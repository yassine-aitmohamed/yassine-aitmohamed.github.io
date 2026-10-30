// Background schemas: slowly turning 3D wireframes, one for each research theme, fading from one to the next.
// Drawn faintly on a fixed canvas behind the page. Pauses when the tab is hidden; off with reduced motion.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'theme-lattice';
  canvas.setAttribute('aria-hidden', 'true');
  const caption = document.createElement('div');
  caption.id = 'theme-caption';
  caption.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  document.body.appendChild(caption);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const PI = Math.PI, TAU = 2 * PI;

  const circle = (f, n = 48) => Array.from({ length: n + 1 }, (_, i) => f(i / n * TAU));
  const curve = (f, n = 40) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
  function grid(fn, n = 14, m = 14) {
    const L = [];
    for (let i = 0; i <= n; i++) L.push(curve(v => fn(i / n, v), m * 2));
    for (let j = 0; j <= m; j++) L.push(curve(u => fn(u, j / m), n * 2));
    return L;
  }
  function sphere(r, lat = 6, lon = 8) {
    const L = [];
    for (let i = 1; i < lat; i++) { const a = -PI / 2 + i * PI / lat; L.push(circle(t => [r * Math.cos(a) * Math.cos(t), r * Math.sin(a), r * Math.cos(a) * Math.sin(t)])); }
    for (let j = 0; j < lon; j++) { const b = j * PI / lon; L.push(circle(t => [r * Math.cos(t) * Math.cos(b), r * Math.sin(t), r * Math.cos(t) * Math.sin(b)])); }
    return L;
  }
  function arrow(a, b) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], k = .12;
    const side = [-d[2], 0, d[0]], s = Math.hypot(...side) || 1;
    const p = [b[0] - d[0] * k, b[1] - d[1] * k, b[2] - d[2] * k];
    return [[a, b], [[p[0] + side[0] / s * .06, p[1], p[2] + side[2] / s * .06], b, [p[0] - side[0] / s * .06, p[1], p[2] - side[2] / s * .06]]];
  }

  const scenes = [
    { name: 'Poisson geometry · symplectic leaves', build: () => ({ lines: [...sphere(1.05, 7, 10), ...sphere(.68, 5, 8), ...sphere(.32, 4, 6)], hi: [0, 1, 2], dots: [[0, 0, 0]] }) },
    { name: 'Lie groupoids · G ⇉ M', build: (t) => {
      const G = grid((u, v) => [2 * u - 1, .75 + .12 * Math.sin(3 * u + 2 * v + t), 2 * v - 1], 8, 8);
      const M = grid((u, v) => [2 * u - 1, -.8, 2 * v - 1], 8, 8);
      const x = .45 * Math.sin(t * .7);
      return { lines: [...G, ...M, ...arrow([x - .25, .7, .2], [x - .45, -.75, .2]), ...arrow([x + .25, .7, -.2], [x + .45, -.75, -.2])], hi: [], dots: [[x - .25, .7, .2], [x + .25, .7, -.2]] };
    } },
    { name: 'Coisotropic reduction', build: () => {
      const R = .75, r = .3, L = [];
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; L.push(circle(t => [(R + r * Math.cos(t)) * Math.cos(a), r * Math.sin(t) + .25, (R + r * Math.cos(t)) * Math.sin(a)], 24)); }
      for (let j = 0; j < 6; j++) { const b = j / 6 * TAU; L.push(circle(a => [(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b) + .25, (R + r * Math.cos(b)) * Math.sin(a)])); }
      L.push(circle(a => [R * Math.cos(a), -.85, R * Math.sin(a)]));
      return { lines: L, hi: [0, 4, 8, L.length - 1], dots: [] };
    } },
    { name: 'Deformation quantization', build: (t) => ({ lines: grid((u, v) => { const x = 2 * u - 1, z = 2 * v - 1; return [x, .32 * Math.sin(4 * x + t) * Math.cos(3 * z - .6 * t), z]; }, 16, 16), hi: [8, 25], dots: [] }) },
    { name: 'Topological quantum field theories · Moore–Tachikawa', build: () => {
      const L = [];
      for (let k = 0; k <= 10; k++) {
        const y = -1 + k * .1, s = k / 10, c = .5 * (1 - .55 * s), rad = .28 + .05 * s;
        for (const sgn of [-1, 1]) L.push(circle(t => [sgn * c + rad * Math.cos(t), y, rad * Math.sin(t) * .8], 32));
      }
      for (let k = 0; k <= 8; k++) { const y = .05 + k * .12, w = .55 + .1 * Math.cos(k / 8 * PI) - .05; L.push(circle(t => [w * Math.cos(t), y, .36 * Math.sin(t)], 40)); }
      return { lines: L, hi: [0, 1, L.length - 1], dots: [] };
    } },
    { name: 'Differentiable stacks · orbifolds', build: () => {
      const L = [];
      for (let k = 1; k <= 8; k++) { const h = k / 8; L.push(circle(t => [h * Math.cos(t), .9 - 1.8 * h, h * Math.sin(t)], 40)); }
      for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; L.push([[0, .9, 0], [Math.cos(a), -.9, Math.sin(a)]]); }
      return { lines: L, hi: [7], dots: [[0, .9, 0]] };
    } },
    { name: 'Algebraic geometry', build: () => ({ lines: grid((u, v) => { const x = 2 * u - 1, z = 2 * v - 1; return [x, .9 * (x * x * x - 3 * x * z * z) / 2, z]; }, 14, 14), hi: [7, 22], dots: [[0, 0, 0]] }) },
    { name: 'Graded rings · Ore extensions', build: (t) => {
      const L = [], dots = [], n = 4, k = Math.round(((Math.sin(t * .5) + 1) / 2) * 3 * n);
      for (let a = 0; a <= n; a++) for (let b = 0; b <= n; b++) for (let c = 0; c <= n; c++) if (a + b + c === k) dots.push([a / n * 1.6 - .8, b / n * 1.6 - .8, c / n * 1.6 - .8]);
      for (let a = 0; a <= n; a++) for (let b = 0; b <= n; b++) {
        const p = a / n * 1.6 - .8, q = b / n * 1.6 - .8;
        L.push([[p, q, -.8], [p, q, .8]]); L.push([[p, -.8, q], [p, .8, q]]); L.push([[-.8, p, q], [.8, p, q]]);
      }
      L.push(curve(s => [.95 * Math.cos(s * 4 * PI), -1 + 2 * s, .95 * Math.sin(s * 4 * PI)], 120));
      return { lines: L, hi: [L.length - 1], dots, faint: true };
    } },
    { name: 'Lie theory · root system of A3', build: () => {
      const R = [];
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) for (const s of [1, -1]) for (const u of [1, -1]) { const v = [0, 0, 0]; v[i] = s * .75; v[j] = u * .75; R.push(v); }
      const L = R.map(v => [[0, 0, 0], v]);
      for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const d = Math.hypot(R[i][0] - R[j][0], R[i][1] - R[j][1], R[i][2] - R[j][2]); if (Math.abs(d - 1.06) < .02) L.push([R[i], R[j]]); }
      return { lines: L, hi: [], dots: R };
    } },
  ];

  let S = 0, DPR = 1, raf = 0, last = 0, t = 0, rgb = '255,107,107', rgbHi = '255,196,120', idx = 0, phase = 0;
  const HOLD = 9, FADE = 1.6;
  function size() {
    const box = canvas.getBoundingClientRect();
    DPR = Math.min(devicePixelRatio || 1, 2); S = box.width;
    canvas.width = S * DPR; canvas.height = S * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function project(v, yaw, pitch) {
    let [x, y, z] = v;
    [x, z] = [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
    [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
    const f = 2.6 / (2.6 + z), k = S * .3;
    return [S / 2 + x * k * f, S / 2 - y * k * f, f];
  }
  function drawScene(sc, alpha) {
    if (alpha <= 0) return;
    const d = sc.build(t), yaw = t * .16, pitch = .42 + .12 * Math.sin(t * .23);
    const base = d.faint ? .22 : .42;
    d.lines.forEach((line, i) => {
      const hi = d.hi.includes(i);
      ctx.strokeStyle = `rgba(${hi ? rgbHi : rgb},${(hi ? .85 : base) * alpha})`;
      ctx.lineWidth = hi ? 1.5 : 1;
      ctx.beginPath();
      line.forEach((p, j) => { const q = project(p, yaw, pitch); j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      ctx.stroke();
    });
    ctx.fillStyle = `rgba(${rgbHi},${.95 * alpha})`;
    for (const p of d.dots) { const q = project(p, yaw, pitch); ctx.beginPath(); ctx.arc(q[0], q[1], 2.6 * q[2], 0, TAU); ctx.fill(); }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 33) return;
    const dt = Math.min((now - last) / 1000, .05); last = now; t += dt; phase += dt;
    if (phase > HOLD + FADE) { phase -= HOLD + FADE; idx = (idx + 1) % scenes.length; caption.textContent = scenes[idx].name; }
    const cs = getComputedStyle(document.documentElement);
    rgb = cs.getPropertyValue('--schema').trim() || rgb;
    rgbHi = cs.getPropertyValue('--schema-hi').trim() || rgbHi;
    ctx.clearRect(0, 0, S, S);
    const fadeOut = phase > HOLD ? 1 - (phase - HOLD) / FADE : 1;
    drawScene(scenes[idx], fadeOut);
    if (phase > HOLD) drawScene(scenes[(idx + 1) % scenes.length], 1 - fadeOut);
    caption.style.opacity = String(Math.min(1, phase / FADE, fadeOut) * .9);
  }
  function run() { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  addEventListener('resize', size, { passive: true });
  document.addEventListener('visibilitychange', run);
  caption.textContent = scenes[0].name;
  size(); run();
})();
