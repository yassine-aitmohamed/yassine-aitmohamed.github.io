// Yassine Ait Mohamed — site interactions

document.addEventListener('DOMContentLoaded', function () {

  // ---- Scroll reveal ----
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ---- Abstract toggle (event delegation) ----
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.abstract-toggle');
    if (!btn) return;
    var el = document.getElementById(btn.getAttribute('data-for'));
    if (!el) return;
    var open = el.style.display === 'block';
    el.style.display = open ? 'none' : 'block';
    btn.textContent = open ? 'Abstract \u2193' : 'Abstract \u2191';
  });

  // ---- Copy email ----
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(btn.getAttribute('data-copy')).then(function () {
        var prev = btn.textContent;
        btn.textContent = '\u2713';
        setTimeout(function () { btn.textContent = prev; }, 1400);
      });
    });
  });
});
