#!/usr/bin/env node
// render.mjs — turn a video HTML file into an MP4 (or a few stills).
//
//   node render.mjs videos/hello.html            → out/hello.mp4
//   node render.mjs hello                        → same (looks in videos/)
//   node render.mjs hello --stills 3             → out/stills/hello-*.png
//   node render.mjs hello --fps 60               → change frame rate (default 30)
//
// A video page must set window.DURATION (seconds), window.SIZE ([w, h])
// and window.render(t). Each frame is drawn by calling render(t) with an
// exact time, so the same file always produces the same video.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

// ---------- args ----------
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const fps = Number(opt('fps', 30));
const stillsArg = opt('stills', null);
const stills = stillsArg === null ? 0 : Number(stillsArg);
const input = args[0];

if (!input || !Number.isFinite(fps) || fps <= 0 || (stillsArg !== null && !(stills >= 1))) {
  console.error('Usage: node render.mjs <video.html | name> [--stills N] [--fps 30]');
  process.exit(1);
}

let file = path.resolve(input);
if (!existsSync(file)) file = path.join(ROOT, 'videos', input.endsWith('.html') ? input : `${input}.html`);
if (!existsSync(file)) {
  console.error(`Video not found: ${input}`);
  process.exit(1);
}
const name = path.basename(file, '.html');
const outDir = path.join(ROOT, 'out');

// ---------- playwright (local install first, then the machine-wide one) ----------
async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  return createRequire(import.meta.url)('playwright'); // honors NODE_PATH
}
const { chromium } = await loadPlaywright();

// ---------- open the page ----------
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

// Seeded Math.random, so "random" motion is identical on every render.
await page.addInitScript(() => {
  let s = 0x2f6b3d;
  Math.random = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
});

const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));
page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });

await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
await page.evaluate(async () => {
  // Load every @font-face up front (not only those already on screen), so a
  // font that first appears mid-video is ready on its very first frame.
  await Promise.all([...document.fonts].map(f => f.load().catch(() => {})));
  await document.fonts.ready;
  if (window.ready instanceof Promise) await window.ready; // optional hook for async assets
});

const meta = await page.evaluate(() => ({
  duration: window.DURATION,
  size: window.SIZE,
  hasRender: typeof window.render === 'function',
}));

const fail = msg => { console.error(`✗ ${name}: ${msg}`); browser.close().finally(() => process.exit(1)); };
if (pageErrors.length) fail(`page error: ${pageErrors[0]}`);
else if (!meta.hasRender) fail('window.render(t) is missing');
else if (!(meta.duration > 0)) fail('window.DURATION must be a positive number of seconds');
else if (!Array.isArray(meta.size) || meta.size.length !== 2 || !meta.size.every(n => n > 0)) fail('window.SIZE must be [width, height]');
else await run();

async function run() {
  // H.264 needs even dimensions.
  const [w, h] = meta.size.map(n => Math.round(n / 2) * 2);
  await page.setViewportSize({ width: w, height: h });

  const totalFrames = Math.round(meta.duration * fps);
  const drawAt = async t => {
    await page.evaluate(t => window.render(t), t);
    if (pageErrors.length) throw new Error(`page error at t=${t.toFixed(3)}s: ${pageErrors[0]}`);
    return page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' });
  };

  if (stills) {
    // Evenly spaced through the video, centered in each slice: for 3 stills
    // of a 3 s video that's t = 0.5, 1.5, 2.5. Snapped to real frame times.
    const dir = path.join(outDir, 'stills');
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < stills; i++) {
      const frame = Math.min(totalFrames - 1, Math.floor(((i + 0.5) / stills) * totalFrames));
      const t = frame / fps;
      const p = path.join(dir, `${name}-${String(i + 1).padStart(2, '0')}-t${t.toFixed(2)}s.png`);
      writeFileSync(p, await drawAt(t));
      console.log(`  still ${i + 1}/${stills}  t=${t.toFixed(2)}s  → ${path.relative(ROOT, p)}`);
    }
    await browser.close();
    return;
  }

  // Full render: stream PNG frames straight into ffmpeg.
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${name}.mp4`);
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-r', String(fps), outFile,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((res, rej) => {
    ff.on('error', rej);
    ff.on('close', code => (code === 0 ? res() : rej(new Error(`ffmpeg exited with code ${code}`))));
  });
  const write = buf => new Promise((res, rej) => ff.stdin.write(buf, e => (e ? rej(e) : res())));

  const started = Date.now();
  try {
    for (let i = 0; i < totalFrames; i++) {
      await write(await drawAt(i / fps));
      if (process.stdout.isTTY) process.stdout.write(`\r  ${name}: frame ${i + 1}/${totalFrames}`);
    }
    ff.stdin.end();
    await ffDone;
  } catch (e) {
    ff.stdin.destroy();
    ff.kill();
    await browser.close();
    console.error(`\n✗ ${name}: ${e.message}`);
    process.exit(1);
  }
  await browser.close();

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  const mb = (statSync(outFile).size / 1e6).toFixed(2);
  if (process.stdout.isTTY) process.stdout.write('\n');
  console.log(`✓ ${path.relative(ROOT, outFile)}  ${w}×${h}  ${fps}fps  ${totalFrames} frames  ${meta.duration}s  ${mb} MB  (rendered in ${secs}s)`);
}
