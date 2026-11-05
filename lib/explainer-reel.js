// lib/explainer-reel.js — builds and animates a 9:16 explainer from window.REEL.
//
// A video file only sets the words:
//   window.REEL = {
//     title:  ['3 Things', 'You Must Stop', 'Doing Manually', '~in~ *2027*'],  // one string per line
//     header: '3 Things You Must Stop Doing|Manually in *2027*',             // | = line break
//     steps:  [{ head: 'Categorizing your own bank feeds.', sub: 'Offload the ledger…' }, …],
//     end:    { name1: '23 Forever', name2: 'Bookkeeping & Solutions',
//               cta: 'Link in bio to book|your consultation!' },
//   };
// Markers: ~words~ = accent script font, *words* = big black emphasis (header: black).
// Timing scales with the number of steps (about 2.8 s each); 3 steps = 15 s.

(() => {
  const R = window.REEL;
  const stage = document.getElementById('stage');

  // ---------- build ----------
  const el = (tag, cls, parent, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  };
  // Split "plain ~script~ *big*" into segments.
  const segments = s => [...s.matchAll(/~([^~]+)~|\*([^*]+)\*|([^~*]+)/g)].map(m =>
    m[1] ? { k: 'script', t: m[1] } : m[2] ? { k: 'big', t: m[2] } : { k: 'plain', t: m[3] });

  const title = el('div', 'layer', stage); title.id = 'title';
  for (const line of R.title) {
    const ln = el('div', 'line', title);
    for (const seg of segments(line)) {
      if (seg.k !== 'plain') ln.classList.add(`has-${seg.k}`);
      const units = seg.k === 'plain' ? seg.t.trim().split(/\s+/).filter(Boolean) : [seg.t.trim()];
      for (const u of units) el('span', '', el('span', `w ${seg.k}`, ln), u);
    }
  }
  el('div', 'rule', title);

  const header = el('div', 'layer reveal', stage); header.id = 'header';
  const htext = el('div', 'text', header);
  R.header.split('|').forEach((part, i) => {
    if (i) el('br', '', htext);
    for (const seg of segments(part)) {
      if (seg.k === 'plain') htext.appendChild(document.createTextNode(seg.t));
      else el('b', '', htext, seg.t);
    }
  });
  el('div', 'rule', header);

  const stepsBox = el('div', 'layer', stage); stepsBox.id = 'steps';
  const steps = R.steps.map((s, i) => {
    const row = el('div', 'step', stepsBox);
    el('div', 'num reveal', row, String(i + 1));
    const txt = el('div', '', row);
    el('div', 'head reveal', txt, s.head);
    if (s.sub) el('div', 'sub reveal', txt, s.sub);
    return row;
  });
  const links = steps.slice(1).map(() => el('div', 'link', stepsBox));

  const end = el('div', 'layer', stage); end.id = 'end';
  const lines = (parent, cls, s) => {
    const n = el('div', cls, parent);
    s.split('|').forEach((p, i) => { if (i) el('br', '', n); n.appendChild(document.createTextNode(p)); });
    return n;
  };
  lines(end, 'name1 reveal', R.end.name1);
  if (R.end.name2) lines(end, 'name2 reveal', R.end.name2);
  el('div', 'rule', end);
  lines(end, 'cta reveal', R.end.cta);

  // ---------- timing ----------
  const STEP = 2.8;
  const T = {
    titleIn: 0.1, titleOut: 3.0, headerIn: 3.25,
    steps: R.steps.map((_, i) => 3.7 + i * STEP),
  };
  T.listOut = 3.7 + R.steps.length * STEP - 0.2;
  T.endIn = T.listOut + 0.4;
  window.DURATION = R.duration ?? +(T.endIn + 2.7).toFixed(2);
  window.SIZE = [1080, 1920];

  // ---------- layout that needs real fonts (runs on the first frame) ----------
  let measured = false;
  const measure = () => {
    // Shrink any title line that's wider than the safe box.
    for (const ln of title.querySelectorAll('.line')) {
      const avail = title.clientWidth;
      if (ln.scrollWidth > avail) ln.style.fontSize = (112 * avail / ln.scrollWidth * 0.98).toFixed(1) + 'px';
    }
    // Sage connector lines between numbers.
    steps.slice(1).forEach((s, i) => {
      const prevNum = steps[i].querySelector('.num');
      const top = steps[i].offsetTop + prevNum.offsetTop + prevNum.offsetHeight + 22;
      const bottom = s.offsetTop - 18;
      links[i].style.top = top + 'px';
      links[i].style.height = Math.max(0, bottom - top) + 'px';
    });
    measured = true;
  };

  // ---------- animation ----------
  const titleWords = [...title.querySelectorAll('.w > span')];
  const q = (root, s) => root.querySelector(s);
  const rise = (node, t, start, dur = 0.7, dist = 30) => {
    if (!node) return;
    const p = M.easeOutCubic(M.progress(t, start, dur));
    node.style.opacity = p;
    node.style.transform = `translateY(${(1 - p) * dist}px)`;
  };

  window.render = (t) => {
    if (!measured) measure();
    const { progress, easeOutExpo, easeOutBack, easeInOutCubic, easeOutCubic } = M;

    // Scene 1: title words rise in, then the block lifts away as the header arrives.
    titleWords.forEach((w, i) => {
      const p = easeOutExpo(progress(t, T.titleIn + i * 0.07, 0.6));
      w.style.transform = `translateY(${(1 - p) * 110}%)`;
    });
    q(title, '.rule').style.transform = `scaleX(${easeOutExpo(progress(t, 1.1, 0.9))})`;
    const tOut = easeInOutCubic(progress(t, T.titleOut, 0.7));
    title.style.opacity = 1 - tOut;
    title.style.transform = `translateY(${-170 * tOut}px) scale(${1 - 0.5 * tOut})`;

    // Scene 2: header settles at the top.
    q(header, '.rule').style.transform = `scaleX(${easeOutExpo(progress(t, T.headerIn + 0.3, 0.8))})`;

    // Scenes 2–4: steps arrive one at a time and stay.
    steps.forEach((s, i) => {
      const st = T.steps[i];
      const num = q(s, '.num');
      const pn = progress(t, st, 0.75);
      num.style.opacity = Math.min(1, pn * 2.5);
      num.style.transform = `scale(${0.55 + 0.45 * easeOutBack(pn, 1.4)})`;
      rise(q(s, '.head'), t, st + 0.15, 0.75, 36);
      rise(q(s, '.sub'), t, st + 0.45, 0.75, 24);
      if (i > 0) links[i - 1].style.transform = `scaleY(${easeInOutCubic(progress(t, st - 0.35, 0.5))})`;
    });

    // Scene 5: list drifts up and away while the end card rises in. No cuts.
    const out = easeInOutCubic(progress(t, T.listOut, 0.65));
    stepsBox.style.opacity = 1 - out;
    stepsBox.style.transform = `translateY(${-70 * out}px)`;
    const hIn = easeOutCubic(progress(t, T.headerIn, 0.7));
    header.style.opacity = hIn * (1 - out);
    header.style.transform = `translateY(${-24 * (1 - hIn) - 70 * out}px)`;

    rise(q(end, '.name1'), t, T.endIn, 0.9, 50);
    rise(q(end, '.name2'), t, T.endIn + 0.2, 0.9, 40);
    q(end, '.rule').style.transform = `scaleX(${easeOutExpo(progress(t, T.endIn + 0.5, 0.9))})`;
    rise(q(end, '.cta'), t, T.endIn + 0.7, 1.0, 30);
  };
})();
