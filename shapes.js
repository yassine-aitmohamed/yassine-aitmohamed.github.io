/*
 * Mathematical objects drifting in 3D, drawn in perspective over the quantum field.
 *
 *   Dynamics      the Lorenz attractor  x' = s(y - x), y' = x(r - z) - y, z' = xy - bz
 *   Topology      the (2,3) torus knot (trefoil) and the figure-eight Klein bottle
 *   Geometry      the Hopf fibration of S^3, stereographically projected to R^3,
 *                 and an icosahedron with its dual dodecahedron
 *   Quantization  hydrogen orbitals |psi_nlm|^2, sampled by rejection, with quantum jumps
 *                 2p_z -> 3d_z2 -> 3d_xy -> 2p_z
 *
 * Far objects live on a blurred layer, near objects on a sharp one, and every point
 * fades with its depth, which gives a depth of field.
 */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ROYAL = [127, 155, 242], SKY = [124, 198, 240], ORANGE = [242, 161, 96];

  function layer(blur, op) {
    var c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;' +
      (blur ? 'filter:blur(' + blur + 'px);' : '') + 'opacity:' + op + ';';
    var host = document.querySelector('.quantum');
    if (host && host.after) host.after(c); else document.body.insertBefore(c, document.body.firstChild);
    return c;
  }
  var back = layer(5, 0.75), front = layer(0, 1);
  var bx = back.getContext('2d'), fx = front.getContext('2d');
  var W = 0, H = 0, DPR = 1, S = 1, narrow = false;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    [back, front].forEach(function (c) { c.width = W * DPR; c.height = H * DPR; });
    [bx, fx].forEach(function (g) { g.setTransform(DPR, 0, 0, DPR, 0, 0); });
    S = Math.min(W, H);
    narrow = W < 900;
  }
  resize();
  addEventListener('resize', resize);

  function rot(p, ax, ay, az) {
    var x = p[0], y = p[1], z = p[2], c, s, t;
    c = Math.cos(ax); s = Math.sin(ax); t = y * c - z * s; z = y * s + z * c; y = t;
    c = Math.cos(ay); s = Math.sin(ay); t = x * c + z * s; z = -x * s + z * c; x = t;
    c = Math.cos(az); s = Math.sin(az); t = x * c - y * s; y = x * s + y * c; x = t;
    return [x, y, z];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0]; }
  function grad3(t) { return t < 0.5 ? mix(ROYAL, SKY, t * 2) : mix(SKY, ORANGE, t * 2 - 1); }

  // An object: anchor in the viewport, size, rotation speed, layer.
  function place(o) {
    var x = o.fx, y = o.fy, k = o.k;
    if (narrow) { x = x < 0.5 ? 0.06 : 0.94; k *= 0.8; }
    var par = (o.par || 0.04) * (scrollY || 0);
    return { cx: x * W, cy: y * H - Math.min(par, H * 0.25), r: k * S };
  }
  function project(p, P, f) {
    var s = f / (f + p[2]);
    return [P.cx + p[0] * P.r * s, P.cy + p[1] * P.r * s, s];
  }
  function depthAlpha(z) { return Math.max(0.15, Math.min(1, 0.65 - z * 0.35)); }

  // ---------- Dynamics: Lorenz attractor ----------
  var L = { s: 10, r: 28, b: 8 / 3, p: [1.1, 0.4, 24], trail: [], max: 1600 };
  function lorenzStep(dt) {
    var p = L.p, x = p[0], y = p[1], z = p[2];
    var k1 = [L.s * (y - x), x * (L.r - z) - y, x * y - L.b * z];
    var m = [x + k1[0] * dt / 2, y + k1[1] * dt / 2, z + k1[2] * dt / 2];
    var k2 = [L.s * (m[1] - m[0]), m[0] * (L.r - m[2]) - m[1], m[0] * m[1] - L.b * m[2]];
    L.p = [x + k2[0] * dt, y + k2[1] * dt, z + k2[2] * dt];
    L.trail.push([L.p[0] / 22, -(L.p[2] - 25) / 22, L.p[1] / 22]);
    if (L.trail.length > L.max) L.trail.shift();
  }
  for (var i = 0; i < 1600; i++) lorenzStep(0.006);

  function drawLorenz(g, t) {
    var P = place({ fx: 0.14, fy: 0.3, k: 0.155, par: 0.05 });
    var n = L.trail.length, prev = null;
    g.lineWidth = 1.1;
    for (var i = 0; i < n; i++) {
      var q = project(rot(L.trail[i], 0.25, t * 0.11, 0), P, 3.2);
      if (prev) {
        var age = i / n;
        g.strokeStyle = rgba(grad3(age), age * 0.75 * depthAlpha(q[2] - 1));
        g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(q[0], q[1]); g.stroke();
      }
      prev = q;
    }
    g.fillStyle = rgba(ORANGE, 0.95);
    g.beginPath(); g.arc(prev[0], prev[1], 2.4, 0, 6.283); g.fill();
    g.fillStyle = rgba(ORANGE, 0.18);
    g.beginPath(); g.arc(prev[0], prev[1], 8, 0, 6.283); g.fill();
  }

  // ---------- Topology: trefoil knot with flowing beads ----------
  var KN = [];
  for (i = 0; i <= 360; i++) {
    var ph = i / 360 * Math.PI * 2, rr = Math.cos(3 * ph) + 2.2;
    KN.push([rr * Math.cos(2 * ph) / 3.3, rr * Math.sin(2 * ph) / 3.3, -Math.sin(3 * ph) / 3.3]);
  }
  function drawKnot(g, t) {
    var P = place({ fx: 0.87, fy: 0.27, k: 0.19, par: 0.06 });
    var pts = KN.map(function (p) { return project(rot(p, 0.9 + 0.2 * Math.sin(t * 0.2), t * 0.17, t * 0.05), P, 3); });
    for (var pass = 0; pass < 2; pass++) {
      g.lineWidth = pass ? 1.2 : 7;
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], c = grad3(0.5 + 0.5 * Math.sin(i / 360 * 6.283 * 2 + t * 0.4));
        g.strokeStyle = rgba(c, (pass ? 0.8 : 0.07) * depthAlpha(b[2] - 1));
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      }
    }
    for (var k = 0; k < 9; k++) {
      var u = ((t * 0.035 + k / 9) % 1) * 360 | 0, q = pts[u];
      g.fillStyle = rgba(k % 3 === 0 ? ORANGE : SKY, 0.9);
      g.beginPath(); g.arc(q[0], q[1], 2.2 * q[2], 0, 6.283); g.fill();
    }
  }

  // ---------- Geometry and topology: Hopf fibration ----------
  function hopfFiber(theta, phi, N) {
    var x = Math.sin(theta) * Math.cos(phi), y = Math.sin(theta) * Math.sin(phi), z = Math.cos(theta);
    var nrm = Math.sqrt(2 * (1 + z)), out = [];
    for (var j = 0; j <= N; j++) {
      var s = j / N * Math.PI * 2, c = Math.cos(s), sn = Math.sin(s);
      var a = (1 + z) / nrm * c, b = (1 + z) / nrm * sn;
      var cr = (x * c - y * sn) / nrm, ci = (x * sn + y * c) / nrm;
      var d = 1 - ci;
      out.push([a / d * 0.55, b / d * 0.55, cr / d * 0.55]);
    }
    return out;
  }
  function drawHopf(g, t) {
    var P = place({ fx: 0.88, fy: 0.73, k: 0.17, par: 0.03 });
    var rings = [[0.55, 9, ORANGE], [0.95, 12, SKY], [1.35, 14, ROYAL]];
    g.lineWidth = 1;
    rings.forEach(function (R, ri) {
      var th = R[0] + 0.08 * Math.sin(t * 0.3 + ri);
      for (var k = 0; k < R[1]; k++) {
        var f = hopfFiber(th, k / R[1] * 6.283 + t * 0.12, 72);
        g.strokeStyle = rgba(R[2], 0.5);
        g.beginPath();
        for (var j = 0; j < f.length; j++) {
          var q = project(rot(f[j], 0.6, t * 0.09, 0.3), P, 3);
          if (j) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]);
        }
        g.stroke();
      }
    });
  }

  // ---------- Quantization: hydrogen orbitals and quantum jumps ----------
  var ORB = [
    function (r, ct, st, cp, sp) { var v = r * Math.exp(-r / 2) * ct; return v; },                         // 2p_z
    function (r, ct, st, cp, sp) { return r * r * Math.exp(-r / 3) * (3 * ct * ct - 1); },                // 3d_z2
    function (r, ct, st, cp, sp) { return r * r * Math.exp(-r / 3) * st * st * 2 * sp * cp; }            // 3d_xy
  ];
  var NP = narrow ? 900 : 1500;
  function sample(f, R) {
    var pts = [], vmax = 0, tries = 0;
    for (var i = 0; i < 4000; i++) {
      var x = (Math.random() * 2 - 1) * R, y = (Math.random() * 2 - 1) * R, z = (Math.random() * 2 - 1) * R;
      var r = Math.hypot(x, y, z) || 1e-6, rho = Math.hypot(x, y) || 1e-6;
      var v = f(r, z / r, rho / r, x / rho, y / rho); vmax = Math.max(vmax, v * v);
    }
    while (pts.length < NP && tries++ < 400000) {
      x = (Math.random() * 2 - 1) * R; y = (Math.random() * 2 - 1) * R; z = (Math.random() * 2 - 1) * R;
      r = Math.hypot(x, y, z) || 1e-6; rho = Math.hypot(x, y) || 1e-6;
      v = f(r, z / r, rho / r, x / rho, y / rho);
      if (Math.random() * vmax < v * v) pts.push([x / R, -z / R, y / R, v > 0 ? 1 : 0]);
    }
    return pts;
  }
  var ORBS = [sample(ORB[0], 11), sample(ORB[1], 20), sample(ORB[2], 20)];
  function drawOrbital(g, t) {
    var P = place({ fx: 0.13, fy: 0.76, k: 0.22, par: 0.04 });
    var period = 9, ph = t / period, k = Math.floor(ph) % 3, u = ph - Math.floor(ph);
    var w = u < 0.7 ? 0 : (u - 0.7) / 0.3; w = w * w * (3 - 2 * w);
    var A = ORBS[k], B = ORBS[(k + 1) % 3], n = Math.min(A.length, B.length);
    var flash = Math.sin(Math.PI * w);
    for (var i = 0; i < n; i++) {
      var a = A[i], b = B[i];
      var p = [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
      var q = project(rot(p, 0.35, t * 0.15, 0), P, 3);
      var sign = w < 0.5 ? a[3] : b[3];
      var tw = 0.55 + 0.45 * Math.sin(i * 12.9898 + t * 2.1);
      g.fillStyle = rgba(sign ? SKY : ORANGE, (0.6 + 0.4 * flash) * tw * depthAlpha(q[2] - 1));
      g.fillRect(q[0], q[1], 2.1 * q[2], 2.1 * q[2]);
    }
  }

  // ---------- Topology, far: figure-eight Klein bottle ----------
  function klein(u, v) {
    var r = 2.2, cu = Math.cos(u / 2), su = Math.sin(u / 2);
    var w = r + cu * Math.sin(v) - su * Math.sin(2 * v);
    return [w * Math.cos(u) / 3.4, w * Math.sin(u) / 3.4, (su * Math.sin(v) + cu * Math.sin(2 * v)) / 3.4];
  }
  function drawKlein(g, t) {
    var P = place({ fx: 0.76, fy: 0.5, k: 0.3, par: 0.015 });
    g.lineWidth = 1;
    var NU = 28, NV = 14, i, j, q;
    for (i = 0; i < NU; i++) {
      var u = i / NU * 6.283;
      g.strokeStyle = rgba(i % 2 ? ROYAL : SKY, 0.35);
      g.beginPath();
      for (j = 0; j <= 40; j++) {
        q = project(rot(klein(u, j / 40 * 6.283), 1.0, t * 0.05, 0.2), P, 3.5);
        if (j) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]);
      }
      g.stroke();
    }
    for (j = 0; j < NV; j++) {
      var v = j / NV * 6.283;
      g.strokeStyle = rgba(ORANGE, 0.22);
      g.beginPath();
      for (i = 0; i <= 80; i++) {
        q = project(rot(klein(i / 80 * 6.283, v), 1.0, t * 0.05, 0.2), P, 3.5);
        if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]);
      }
      g.stroke();
    }
  }

  // ---------- Geometry, far: icosahedron and its dual ----------
  var G = (1 + Math.sqrt(5)) / 2, ICO = [], DOD = [], EI = [], ED = [];
  [[-1, G, 0], [1, G, 0], [-1, -G, 0], [1, -G, 0], [0, -1, G], [0, 1, G], [0, -1, -G], [0, 1, -G], [G, 0, -1], [G, 0, 1], [-G, 0, -1], [-G, 0, 1]]
    .forEach(function (p) { var n = Math.hypot(p[0], p[1], p[2]); ICO.push([p[0] / n, p[1] / n, p[2] / n]); });
  function edges(V, len) {
    var E = [];
    for (var a = 0; a < V.length; a++) for (var b = a + 1; b < V.length; b++) {
      var d = Math.hypot(V[a][0] - V[b][0], V[a][1] - V[b][1], V[a][2] - V[b][2]);
      if (Math.abs(d - len) < 0.02) E.push([a, b]);
    }
    return E;
  }
  EI = edges(ICO, 1.0515);
  for (var a = 0; a < 12; a++) for (var b = a + 1; b < 12; b++) for (var c = b + 1; c < 12; c++) {
    if (Math.hypot(ICO[a][0] - ICO[b][0], ICO[a][1] - ICO[b][1], ICO[a][2] - ICO[b][2]) < 1.06 &&
        Math.hypot(ICO[a][0] - ICO[c][0], ICO[a][1] - ICO[c][1], ICO[a][2] - ICO[c][2]) < 1.06 &&
        Math.hypot(ICO[b][0] - ICO[c][0], ICO[b][1] - ICO[c][1], ICO[b][2] - ICO[c][2]) < 1.06) {
      var m = [ICO[a][0] + ICO[b][0] + ICO[c][0], ICO[a][1] + ICO[b][1] + ICO[c][1], ICO[a][2] + ICO[b][2] + ICO[c][2]];
      var nn = Math.hypot(m[0], m[1], m[2]); DOD.push([m[0] / nn * 1.25, m[1] / nn * 1.25, m[2] / nn * 1.25]);
    }
  }
  ED = edges(DOD, Math.min.apply(null, DOD.slice(1).map(function (p) { return Math.hypot(p[0] - DOD[0][0], p[1] - DOD[0][1], p[2] - DOD[0][2]); })));
  function drawPoly(g, t) {
    var P = place({ fx: 0.24, fy: 0.52, k: 0.17, par: 0.02 });
    var breathe = 1 + 0.06 * Math.sin(t * 0.6);
    function draw(V, E, col, al, sc) {
      var Q = V.map(function (p) { return project(rot([p[0] * sc, p[1] * sc, p[2] * sc], t * 0.07, t * 0.11, 0.3), P, 3); });
      g.strokeStyle = rgba(col, al); g.lineWidth = 1.2;
      E.forEach(function (e) { g.beginPath(); g.moveTo(Q[e[0]][0], Q[e[0]][1]); g.lineTo(Q[e[1]][0], Q[e[1]][1]); g.stroke(); });
      g.fillStyle = rgba(col, al + 0.2);
      Q.forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 2 * q[2], 0, 6.283); g.fill(); });
    }
    draw(ICO, EI, SKY, 0.5, breathe);
    draw(DOD, ED, ORANGE, 0.32, 1 / breathe);
  }

  // ---------- loop ----------
  var t0 = performance.now(), last = 0;
  function frame(now) {
    if (!document.hidden && now - last > 30) {
      last = now;
      var t = Math.max(0, now - t0) / 1000;
      for (var i = 0; i < 3; i++) lorenzStep(0.005);
      bx.clearRect(0, 0, W, H); fx.clearRect(0, 0, W, H);
      bx.globalCompositeOperation = fx.globalCompositeOperation = 'lighter';
      drawKlein(bx, t); drawPoly(bx, t);
      drawLorenz(fx, t); drawKnot(fx, t); drawHopf(fx, t); drawOrbital(fx, t);
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
