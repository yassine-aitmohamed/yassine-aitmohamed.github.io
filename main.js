(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.querySelector('section.page');

  const nav = document.querySelector('nav.tabs .links'), mark = document.querySelector('.nav-mark');
  if (nav && mark) {
    const active = () => nav.querySelector('a[aria-current="page"]');
    const place = a => {
      if (!a) { mark.style.opacity = '0'; return; }
      mark.style.left = a.offsetLeft + 'px';
      mark.style.width = a.offsetWidth + 'px';
      mark.style.opacity = '1';
    };
    mark.style.transition = 'none'; place(active()); void mark.offsetWidth; mark.style.transition = '';
    nav.querySelectorAll('a').forEach(a => a.addEventListener('mouseenter', () => place(a)));
    nav.addEventListener('mouseleave', () => place(active()));
    addEventListener('resize', () => place(active()));
    if (document.fonts) document.fonts.ready.then(() => place(active()));
  }

  const tabs = document.querySelector('nav.tabs'), sentinel = document.querySelector('.sentinel');
  if (tabs && sentinel && 'IntersectionObserver' in window) {
    const links = tabs.querySelector('.links'), inner = tabs.querySelector('.tabs-in');
    const shift = () => {
      const free = inner.clientWidth - 40 - links.offsetWidth;
      links.style.setProperty('--shift', Math.max(0, free / 2) + 'px');
    };
    shift(); addEventListener('resize', shift);
    if (document.fonts) document.fonts.ready.then(shift);
    new IntersectionObserver(([e]) => tabs.classList.toggle('stuck', !e.isIntersecting)).observe(sentinel);
  }

  const cv = document.querySelector('canvas.flow');
  if (cv) {
    const ctx = cv.getContext('2d');
    const ink = getComputedStyle(root).getPropertyValue('--link').trim() || '#1F3A68';
    let W = 0, H = 0, dpr = 1, pts = [], running = true, raf = 0;
    const Q = 2 * Math.PI, P = 3.1;
    const X = q => (q + Q) / (2 * Q) * W, Y = p => H / 2 - p / P * (H / 2);
    const spawn = () => {
      const q = (Math.random() * 2 - 1) * Q;
      const E = -1 + Math.random() * 3.4;
      const p2 = 2 * (E + Math.cos(q));
      const p = p2 > 0 ? (Math.random() < .5 ? -1 : 1) * Math.sqrt(p2) : (Math.random() * 2 - 1) * 0.4;
      return { q, p, life: 600 + Math.random() * 900 };
    };
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.lineCap = 'round';
      const n = Math.round(Math.min(170, Math.max(60, W / 8)));
      pts = Array.from({ length: n }, spawn);
    };
    const dt = 0.011;
    const step = draw => {
      if (draw) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.035)';
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = .55;
        ctx.beginPath();
      }
      for (const s of pts) {
        const x0 = X(s.q), y0 = Y(s.p);
        s.p -= dt / 2 * Math.sin(s.q); s.q += dt * s.p; s.p -= dt / 2 * Math.sin(s.q);
        let wrapped = false;
        if (s.q > Q) { s.q -= 2 * Q; wrapped = true; } else if (s.q < -Q) { s.q += 2 * Q; wrapped = true; }
        if (draw && !wrapped) { ctx.moveTo(x0, y0); ctx.lineTo(X(s.q), Y(s.p)); }
        if (--s.life < 0) Object.assign(s, spawn());
      }
      if (draw) { ctx.stroke(); ctx.globalAlpha = 1; }
    };
    const loop = () => { step(true); if (running) raf = requestAnimationFrame(loop); };
    size();
    if (reduce) { for (let i = 0; i < 500; i++) step(true); }
    else {
      for (let i = 0; i < 160; i++) step(true);
      loop();
      new IntersectionObserver(([e]) => {
        running = e.isIntersecting;
        if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
      }).observe(cv);
      document.addEventListener('visibilitychange', () => {
        running = !document.hidden; if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
      });
    }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
  }

  if (page && !reduce) {
    const items = [];
    [...page.children].forEach(c => {
      if (c.classList.contains('portrait')) return;
      if (c.matches('ol.papers')) items.push(...c.children); else items.push(c);
    });
    items.forEach((el, i) => { el.classList.add('st'); el.style.setProperty('--i', Math.min(i, 14)); });
    page.classList.add('enter');

    document.querySelectorAll('a[href$=".html"]').forEach(a => {
      if (a.target || a.origin !== location.origin) return;
      a.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (a.pathname === location.pathname) return;
        e.preventDefault();
        page.classList.add('leave');
        setTimeout(() => { location.href = a.href; }, 200);
      });
    });
    addEventListener('pageshow', e => { if (e.persisted) page.classList.remove('leave'); });
  }

  document.querySelectorAll('.toggle').forEach(b => {
    b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!open));
      b.nextElementSibling.classList.toggle('open', !open);
    });
  });

  document.querySelectorAll('[data-schema]:not(.kw)').forEach(el => {
    el.addEventListener('mouseenter', () => { if (window.showSchema) window.showSchema(+el.dataset.schema); });
  });

  const papers = document.querySelector('ol.papers');
  document.querySelectorAll('.kw').forEach(k => {
    const enter = () => {
      if (window.showSchema) window.showSchema(+k.dataset.schema);
      const ns = k.dataset.papers.split(' ').filter(Boolean);
      if (!ns.length || !papers) return;
      papers.classList.add('focus');
      papers.querySelectorAll('li').forEach(li => li.classList.toggle('lit', ns.includes(li.dataset.n)));
    };
    const leave = () => {
      if (!papers) return;
      papers.classList.remove('focus');
      papers.querySelectorAll('li.lit').forEach(li => li.classList.remove('lit'));
    };
    k.addEventListener('mouseenter', enter); k.addEventListener('focus', enter);
    k.addEventListener('mouseleave', leave); k.addEventListener('blur', leave);
  });

  const copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    const note = copyBtn.querySelector('.copied'), addr = copyBtn.firstChild.textContent.trim();
    const shown = msg => {
      note.textContent = msg; copyBtn.classList.add('done');
      setTimeout(() => copyBtn.classList.remove('done'), 1800);
    };
    const select = () => {
      const r = document.createRange(); r.selectNodeContents(copyBtn.firstChild);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); shown('Selected');
    };
    copyBtn.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(() => shown('Copied ✓'), select);
      else select();
    });
  }

  const bar = document.querySelector('.readbar');
  if (bar) {
    const progress = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 40 ? Math.min(1, scrollY / h) : 0) + ')';
    };
    addEventListener('scroll', progress, { passive: true });
    addEventListener('resize', progress);
    progress();
  }

  const btn = document.getElementById('night');
  if (!btn) return;
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const label = () => { btn.textContent = isDark() ? 'Day mode' : 'Night mode'; };
  label();
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
    };
    if (!document.startViewTransition || reduce) { apply(); return; }
    const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(() => {});
  });
})();
