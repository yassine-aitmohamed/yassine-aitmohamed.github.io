// Laurel: the root system of G2 (six short and six long roots) turning slowly in space,
// drawn as a faint gold figure at the side of every page. Off with reduced motion.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'theme-lattice';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const roots = [];
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3, b = a + Math.PI / 6;
    roots.push([Math.cos(a), Math.sin(a), 0, 1]);
    roots.push([Math.sqrt(3) * Math.cos(b), Math.sqrt(3) * Math.sin(b), 0, 2]);
  }
  let S = 0, R = 1, t = 0, last = 0, raf = 0, rgb = '212,178,106';
  function size() {
    const box = canvas.getBoundingClientRect();
    R = Math.min(devicePixelRatio || 1, 2); S = box.width;
    canvas.width = S * R; canvas.height = S * R; ctx.setTransform(R, 0, 0, R, 0, 0);
  }
  function project(v) {
    const ca = Math.cos(t), sa = Math.sin(t), cb = Math.cos(.9 + .25 * Math.sin(t * .6)), sb = Math.sin(.9 + .25 * Math.sin(t * .6));
    let [x, y, z] = v;
    [x, y] = [x * ca - y * sa, x * sa + y * ca];
    [y, z] = [y * cb - z * sb, y * sb + z * cb];
    const f = 1 / (1 + z * .12), k = S * .24;
    return [S / 2 + x * k * f, S / 2 + y * k * f, f];
  }
  function draw() {
    ctx.clearRect(0, 0, S, S);
    const P = roots.map(project), c = [S / 2, S / 2];
    ctx.lineWidth = 1;
    for (let i = 0; i < P.length; i++) {
      ctx.strokeStyle = `rgba(${rgb},${roots[i][3] === 2 ? .22 : .32})`;
      ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(P[i][0], P[i][1]); ctx.stroke();
    }
    for (const len of [1, 2]) {
      const ring = P.filter((_, i) => roots[i][3] === len);
      ctx.strokeStyle = `rgba(${rgb},${len === 1 ? .38 : .2})`;
      ctx.beginPath(); ring.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
    }
    ctx.strokeStyle = `rgba(${rgb},.1)`;
    ctx.beginPath(); ctx.arc(c[0], c[1], S * .24 * Math.sqrt(3) * 1.18, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < P.length; i++) {
      ctx.fillStyle = `rgba(${rgb},${.45 + .35 * (P[i][2] - .9) * 5})`;
      ctx.beginPath(); ctx.arc(P[i][0], P[i][1], roots[i][3] === 2 ? 3.2 : 2.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (now - last < 33) return;
    t += Math.min((now - last) / 1000, .05) * .12; last = now;
    rgb = getComputedStyle(document.documentElement).getPropertyValue('--lattice').trim() || rgb;
    draw();
  }
  function run() { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  addEventListener('resize', () => { size(); draw(); }, { passive: true });
  document.addEventListener('visibilitychange', run);
  size(); draw(); run();
})();
