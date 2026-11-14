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
