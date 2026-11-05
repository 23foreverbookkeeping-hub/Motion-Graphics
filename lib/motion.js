// lib/motion.js — small, pure helpers for render(t).
// Everything here is a function of its inputs only, so frames are repeatable.

window.M = (() => {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  // Progress 0→1 of t through the window [start, start + dur].
  const progress = (t, start, dur) => clamp((t - start) / dur);

  const lerp = (a, b, p) => a + (b - a) * p;

  // Map t from [t0, t1] to [v0, v1] with an easing curve, clamped at the ends.
  const tween = (t, t0, t1, v0, v1, ease = easeInOutCubic) =>
    lerp(v0, v1, ease(progress(t, t0, t1 - t0)));

  const easeOutCubic   = p => 1 - Math.pow(1 - p, 3);
  const easeInCubic    = p => p * p * p;
  const easeInOutCubic = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeOutExpo    = p => (p === 1 ? 1 : 1 - Math.pow(2, -10 * p));
  const easeOutBack    = (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);

  return { clamp, progress, lerp, tween, easeOutCubic, easeInCubic, easeInOutCubic, easeOutExpo, easeOutBack };
})();
