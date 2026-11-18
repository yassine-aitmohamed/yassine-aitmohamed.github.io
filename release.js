(() => {
  const pad = n => String(n).padStart(2, '0');
  const els = document.querySelectorAll('.countdown[data-release]');
  if (!els.length) return;
  const tick = () => {
    els.forEach(el => {
      const ms = Date.parse(el.dataset.release) - Date.now();
      if (ms <= 0) { el.textContent = 'Available shortly'; return; }
      const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
      el.textContent = `${d} d ${pad(h)} h ${pad(m)} min ${pad(s % 60)} s`;
    });
  };
  tick(); setInterval(tick, 1000);
})();
