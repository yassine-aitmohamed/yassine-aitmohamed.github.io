/*
 * Quantum background.
 *
 * psi(x, y, t) = sum_k c_k  phi_{n_k}^{wx}(x)  phi_{m_k}^{wy}(y)  exp(-i E_k t)
 *
 * is an exact solution of  i dpsi/dt = -1/2 Lap psi + 1/2 (wx^2 x^2 + wy^2 y^2) psi,
 * the anisotropic harmonic oscillator, with E_k = wx (n_k + 1/2) + wy (m_k + 1/2).
 * Since wy / wx = sqrt(2) is irrational, the motion is quasi-periodic and never repeats.
 *
 * The field is drawn by domain coloring: hue = arg psi, brightness = |psi|^2,
 * with faint level sets of |psi|^2. The particles follow the Bohmian guidance
 * equation  dx/dt = Im( grad psi / psi ).
 */
(function () {
  'use strict';
  var host = document.querySelector('[data-quantum]');
  if (!host) return;

  var WX = 1.0, WY = Math.SQRT2;
  var NMAX = 4;
  var MODES = [
    [0, 0, 0.62, 0.0], [1, 0, 0.42, 0.20], [0, 1, 0.30, -0.36], [2, 1, 0.26, 0.22],
    [1, 2, -0.20, 0.28], [3, 0, 0.18, -0.20], [0, 3, 0.20, 0.12], [2, 2, 0.15, 0.13]
  ];
  (function normalize() {
    var s = 0; MODES.forEach(function (m) { s += m[2] * m[2] + m[3] * m[3]; });
    s = Math.sqrt(s); MODES.forEach(function (m) { m[2] /= s; m[3] /= s; });
  })();
  var K = MODES.length;
  var ENERGY = MODES.map(function (m) { return WX * (m[0] + 0.5) + WY * (m[1] + 0.5); });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var intensity = parseFloat(host.getAttribute('data-intensity') || '1');
  var offsetX = parseFloat(host.getAttribute('data-offset') || '0');
  var HALF = 3.7;           // half height of the visible domain
  var SPEED = 0.32;         // physical time per second
  var RES = 0.5;            // render scale of the field

  var field = document.createElement('canvas');
  var parts = document.createElement('canvas');
  [field, parts].forEach(function (c) {
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(c);
  });

  /* ---------- Hermite functions (normalized, with derivatives) ---------- */
  var PI4 = Math.pow(Math.PI, -0.25);
  function hermite(s, out) {            // out[n] = phi_n(s), n = 0..NMAX+1
    out[0] = PI4 * Math.exp(-0.5 * s * s);
    out[1] = Math.SQRT2 * s * out[0];
    for (var n = 1; n <= NMAX; n++) out[n + 1] = Math.sqrt(2 / (n + 1)) * s * out[n] - Math.sqrt(n / (n + 1)) * out[n - 1];
    return out;
  }
  var hx = new Float64Array(NMAX + 2), hy = new Float64Array(NMAX + 2);
  var cr = new Float64Array(K), ci = new Float64Array(K);

  function phases(t) {
    for (var k = 0; k < K; k++) {
      var c = Math.cos(ENERGY[k] * t), s = -Math.sin(ENERGY[k] * t);
      cr[k] = MODES[k][2] * c - MODES[k][3] * s;
      ci[k] = MODES[k][2] * s + MODES[k][3] * c;
    }
  }
  // returns [re, im, dRe/dx, dIm/dx, dRe/dy, dIm/dy]
  var res = new Float64Array(6);
  function evalPsi(x, y, grad) {
    var sx = Math.sqrt(WX), sy = Math.sqrt(WY);
    var ax = Math.pow(WX, 0.25), ay = Math.pow(WY, 0.25);
    hermite(sx * x, hx); hermite(sy * y, hy);
    var re = 0, im = 0, rx = 0, ix = 0, ry = 0, iy = 0;
    for (var k = 0; k < K; k++) {
      var n = MODES[k][0], m = MODES[k][1];
      var fx = ax * hx[n], fy = ay * hy[m];
      var v = fx * fy;
      re += cr[k] * v; im += ci[k] * v;
      if (grad) {
        var dfx = ax * sx * (Math.sqrt(n / 2) * (n > 0 ? hx[n - 1] : 0) - Math.sqrt((n + 1) / 2) * hx[n + 1]);
        var dfy = ay * sy * (Math.sqrt(m / 2) * (m > 0 ? hy[m - 1] : 0) - Math.sqrt((m + 1) / 2) * hy[m + 1]);
        rx += cr[k] * dfx * fy; ix += ci[k] * dfx * fy;
        ry += cr[k] * fx * dfy; iy += ci[k] * fx * dfy;
      }
    }
    res[0] = re; res[1] = im; res[2] = rx; res[3] = ix; res[4] = ry; res[5] = iy;
    return res;
  }

  /* ---------- WebGL field ---------- */
  var gl = field.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  var prog, loc = {};
  var VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'varying vec2 uv;',
    'uniform vec2 uRes; uniform float uHalf; uniform float uOff; uniform float uGain;',
    'uniform vec2 uC[' + K + ']; uniform vec2 uN[' + K + '];',
    'const float WX=' + WX.toFixed(6) + '; const float WY=' + WY.toFixed(6) + ';',
    'float pick(float n,float h0,float h1,float h2,float h3,float h4){',
    '  return n<.5?h0:(n<1.5?h1:(n<2.5?h2:(n<3.5?h3:h4)));}',
    'vec3 hue(float a){',
    '  vec3 R=vec3(.17,.31,.70), S=vec3(.25,.64,.87), O=vec3(.88,.48,.14);',
    '  float t=fract(a/6.2831853+1.)*3.;',
    '  if(t<1.) return mix(R,S,smoothstep(0.,1.,t));',
    '  if(t<2.) return mix(S,O,smoothstep(0.,1.,t-1.));',
    '  return mix(O,R,smoothstep(0.,1.,t-2.));}',
    'void main(){',
    '  float asp=uRes.x/uRes.y;',
    '  float x=(uv.x-.5)*2.*uHalf*asp-uOff; float y=(uv.y-.5)*2.*uHalf;',
    '  float s=sqrt(WX)*x; float q=sqrt(WY)*y;',
    '  float g0=.7511255*exp(-.5*s*s); float g1=1.4142136*s*g0;',
    '  float g2=s*g1-.7071068*g0; float g3=.8164966*s*g2-.8164966*g1; float g4=.7071068*s*g3-.8660254*g2;',
    '  float k0=.7511255*exp(-.5*q*q); float k1=1.4142136*q*k0;',
    '  float k2=q*k1-.7071068*k0; float k3=.8164966*q*k2-.8164966*k1; float k4=.7071068*q*k3-.8660254*k2;',
    '  float ax=pow(WX,.25), ay=pow(WY,.25);',
    '  vec2 psi=vec2(0.);',
    '  for(int k=0;k<' + K + ';k++){',
    '    float fx=ax*pick(uN[k].x,g0,g1,g2,g3,g4); float fy=ay*pick(uN[k].y,k0,k1,k2,k3,k4);',
    '    psi+=uC[k]*fx*fy; }',
    '  float rho=dot(psi,psi);',
    '  float v=1.-exp(-rho*9.);',
    '  float ph=atan(psi.y,psi.x);',
    '  vec3 col=hue(ph)*pow(v,1.15);',
    '  float lv=rho*16.; float f=abs(fract(lv)-.5);',
    '  col+=vec3(.75,.85,1.)*.16*smoothstep(.06,.0,f)*smoothstep(.0,.05,rho);',
    '  vec2 cu=vec2(.5+uOff/(2.*uHalf*asp),.5); vec2 dd=(uv-cu)*vec2(asp,1.); float r=length(dd); col*=1.-.6*smoothstep(.45,1.1,r);',
    '  col=vec3(.016,.024,.055)+col*uGain;',
    '  gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  if (gl) {
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      var pl = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);
      ['uRes', 'uHalf', 'uOff', 'uGain', 'uC', 'uN'].forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });
      var nn = new Float32Array(2 * K);
      MODES.forEach(function (m, k) { nn[2 * k] = m[0]; nn[2 * k + 1] = m[1]; });
      gl.uniform2fv(loc.uN, nn);
    } catch (e) { gl = null; }
  }
  if (!gl) { host.classList.add('quantum-fallback'); field.remove(); }

  /* ---------- particles (Bohmian trajectories) ---------- */
  var ctx = parts.getContext('2d');
  var N = reduce ? 0 : (window.innerWidth < 700 ? 120 : 240);
  var P = [];
  var W = 1, H = 1, asp = 1, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function toScreen(x, y) {
    return [((x + offsetX) / (2 * HALF * asp) + 0.5) * W, (0.5 - y / (2 * HALF)) * H];
  }
  function spawn(p) {
    for (var tries = 0; tries < 60; tries++) {
      var x = (Math.random() - 0.5) * 7.0, y = (Math.random() - 0.5) * 6.0;
      var r = evalPsi(x, y, false);
      var rho = r[0] * r[0] + r[1] * r[1];
      if (Math.random() * 0.22 < rho) { p.x = x; p.y = y; p.life = 4 + Math.random() * 8; p.age = 0; return; }
    }
    p.x = (Math.random() - 0.5) * 3; p.y = (Math.random() - 0.5) * 3; p.life = 3; p.age = 0;
  }
  function velocity(x, y) {
    var r = evalPsi(x, y, true);
    var rho = r[0] * r[0] + r[1] * r[1];
    if (rho < 1e-7) return null;
    // v = Im(conj(psi) grad psi) / |psi|^2
    var vx = (r[0] * r[3] - r[1] * r[2]) / rho;
    var vy = (r[0] * r[5] - r[1] * r[4]) / rho;
    var sp = Math.hypot(vx, vy), cap = 6;
    if (sp > cap) { vx *= cap / sp; vy *= cap / sp; }
    return [vx, vy];
  }

  function resize() {
    var rect = host.getBoundingClientRect();
    W = Math.max(1, rect.width); H = Math.max(1, rect.height); asp = W / H;
    field.width = Math.round(W * RES); field.height = Math.round(H * RES);
    parts.width = Math.round(W * dpr); parts.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (gl) gl.viewport(0, 0, field.width, field.height);
  }

  var t = 7.3, last = 0, running = true, parallax = 0, target = 0;
  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (!reduce) t += SPEED * dt;
    parallax += (target - parallax) * 0.03;
    phases(t);
    if (gl) {
      var cc = new Float32Array(2 * K);
      for (var k = 0; k < K; k++) { cc[2 * k] = cr[k]; cc[2 * k + 1] = ci[k]; }
      gl.uniform2fv(loc.uC, cc);
      gl.uniform2f(loc.uRes, field.width, field.height);
      gl.uniform1f(loc.uHalf, HALF);
      gl.uniform1f(loc.uOff, offsetX + parallax);
      gl.uniform1f(loc.uGain, intensity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    if (N) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.09)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      var h = SPEED * dt / 2;
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.age += dt;
        var v1 = velocity(p.x, p.y);
        if (!v1 || p.age > p.life || Math.abs(p.x) > 7 || Math.abs(p.y) > 6) { spawn(p); continue; }
        var v2 = velocity(p.x + h * v1[0], p.y + h * v1[1]);
        if (!v2) { spawn(p); continue; }
        var a = toScreen(p.x, p.y);
        p.x += 2 * h * v2[0]; p.y += 2 * h * v2[1];
        var b = toScreen(p.x, p.y);
        var fade = Math.min(1, p.age / 0.8, (p.life - p.age) / 0.8);
        ctx.strokeStyle = 'rgba(214,232,255,' + (0.55 * fade * intensity).toFixed(3) + ')';
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(a[0] + parallax * W / (2 * HALF * asp), a[1]); ctx.lineTo(b[0] + parallax * W / (2 * HALF * asp), b[1]); ctx.stroke();
      }
    }
    if (!reduce) requestAnimationFrame(frame);
  }

  resize();
  phases(t);
  for (var i = 0; i < N; i++) { var p = {}; spawn(p); p.age = Math.random() * p.life; P.push(p); }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running && !reduce) { last = 0; requestAnimationFrame(frame); }
  });
  if (!reduce) {
    window.addEventListener('pointermove', function (e) { target = ((e.clientX / window.innerWidth) - 0.5) * 0.35; }, { passive: true });
  }
  requestAnimationFrame(frame);
})();
