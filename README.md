# Motion Graphics Studio

Motion graphics written as code. Each video is one HTML file; `render.mjs` turns it into an MP4.

## Render

```bash
node render.mjs hello              # → out/hello.mp4 (30 fps)
node render.mjs hello --stills 3   # → out/stills/hello-*.png, a quick check
node render.mjs hello --fps 60     # other frame rates
```

## Make a video

Add `videos/<name>.html`. It links `../brand.css` (and optionally `../lib/motion.js` for easing helpers) and sets:

```js
window.DURATION = 3;            // seconds
window.SIZE = [1920, 1080];     // [width, height]
window.render = (t) => { ... }; // draw the exact frame at time t (seconds)
```

Rules that keep every render identical:
- All motion comes from `t`. No CSS animations, transitions, `setTimeout` or `requestAnimationFrame`.
- `Math.random()` is seeded by the renderer, so it gives the same sequence every time.
- If the page loads images or data, set `window.ready` to a Promise; rendering waits for it.

## Files

| Path | What it is |
|---|---|
| `brand.css` | Colors and fonts as CSS variables, plus the base stage styles |
| `fonts/` | Bundled brand fonts (Playfair Display, Great Vibes, Dancing Script, Inter), OFL licensed, so renders work offline |
| `lib/motion.js` | `M.tween`, `M.progress`, easing curves |
| `videos/` | One HTML file per video |
| `templates/` | Reusable briefs with [brackets] for the parts that change |
| `render.mjs` | Playwright + ffmpeg renderer |
| `out/` | Rendered MP4s (committed). `out/stills/` is ignored by git |

Requires Node 18+, ffmpeg, and Playwright with Chromium.
