// Progressive enhancement: all page content stays readable without animation.
document.addEventListener('DOMContentLoaded', () => {
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 const items = document.querySelectorAll('.reveal');
 if ('IntersectionObserver' in window && !motion.matches) {
  const observer = new IntersectionObserver(entries => {
   entries.forEach(entry => { if (entry.isIntersecting) {
    entry.target.classList.remove('will-reveal'); entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
   }});
  }, {threshold:0, rootMargin:'0px 0px 30px 0px'});
  items.forEach(item => { if (item.getBoundingClientRect().top > innerHeight) item.classList.add('will-reveal'); observer.observe(item); });
  motion.addEventListener('change', () => { if (motion.matches) items.forEach(item => item.classList.remove('will-reveal')); });
 }
 document.querySelectorAll('.abstract-toggle').forEach(button => {
  button.setAttribute('aria-controls', button.dataset.for); button.setAttribute('aria-expanded','false');
 });
 document.addEventListener('click', event => {
  const button = event.target.closest('.abstract-toggle'); if (!button) return;
  const abstract = document.getElementById(button.dataset.for); if (!abstract) return;
  const open = button.getAttribute('aria-expanded') === 'true';
  abstract.style.display = open ? 'none' : 'block'; button.setAttribute('aria-expanded',String(!open));
  button.textContent = open ? 'Abstract ↓' : 'Abstract ↑';
 });
 document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => {
  if (navigator.clipboard) navigator.clipboard.writeText(button.dataset.copy).then(() => {
   const previous = button.textContent; button.textContent = '✓'; setTimeout(() => { button.textContent = previous; },1400);
  }).catch(() => {});
 }));
 const canvas = document.querySelector('.geometry-surface'); if (!canvas) return;
 const ctx = canvas.getContext('2d'); if (!ctx) return;
 let width=0,height=0,frame=0,time=0,last=0,visible=true,pointer=0,targetPointer=0;
 function size() {
  const box=canvas.getBoundingClientRect(); width=box.width; height=box.height;
  const ratio=Math.min(devicePixelRatio || 1,2); canvas.width=Math.round(width*ratio); canvas.height=Math.round(height*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0); draw();
 }
 function point(u,v) {
  const crest = Math.exp(-Math.pow((u - .62 - Math.sin(time)*.018) / .16, 2));
  const wave = Math.sin(u*7.5-v*2.1+time)*.035;
  return [u*width,height*(.96-.38*u*u-.40*crest-.34*Math.pow(u,8)+(v-.5)*(.06+.68*u)+wave*u+pointer*u*.025)];
 }
 function stroke(points,color) {
  ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.strokeStyle=color; ctx.lineWidth=.7; ctx.stroke();
 }
 function draw() {
  ctx.clearRect(0,0,width,height);
  for(let row=0;row<=24;row++) { const points=[]; for(let col=0;col<=70;col++) points.push(point(col/70,row/24)); stroke(points,row%4===0 ? 'rgba(31,58,104,.70)' : 'rgba(31,58,104,.45)'); }
  for(let col=0;col<=44;col++) { const points=[]; for(let row=0;row<=30;row++) points.push(point(col/44,row/30)); stroke(points,'rgba(31,122,104,.38)'); }
 }
 function tick(now) {
  frame=0; if(document.hidden || !visible || motion.matches) return;
  if(now-last>32) { time+=Math.min((now-last)/1000,.05)*.16; pointer+=(targetPointer-pointer)*.035; last=now; draw(); }
  frame=requestAnimationFrame(tick);
 }
 function sync() {
  cancelAnimationFrame(frame); frame=0; last=performance.now();
  if(!document.hidden && visible && !motion.matches) frame=requestAnimationFrame(tick); else draw();
 }
 if('ResizeObserver' in window) new ResizeObserver(size).observe(canvas); else addEventListener('resize',size,{passive:true});
 if('IntersectionObserver' in window) new IntersectionObserver(entries => { visible=entries[0].isIntersecting; sync(); }).observe(canvas);
 canvas.parentElement.addEventListener('pointermove',event => {
  if(event.pointerType==='mouse' && !motion.matches) { const box=canvas.getBoundingClientRect(); targetPointer=(event.clientY-box.top)/box.height-.5; }
 },{passive:true});
 canvas.parentElement.addEventListener('pointerleave',() => { targetPointer=0; });
 document.addEventListener('visibilitychange',sync); motion.addEventListener('change',sync); size(); sync();
});

// Night mode: button at the end of the navigation, choice remembered per visitor.
(() => {
 const root = document.documentElement;
 const save = v => { try { localStorage.setItem('theme', v); } catch (e) {} };
 document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav-links'); if (!nav) return;
  const li = document.createElement('li'); li.className = 'theme-li';
  li.innerHTML = '<button class="theme-toggle" type="button">'
   + '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.3 3a9 9 0 1 0 8.7 11.3A7 7 0 0 1 12.3 3z"/></svg>'
   + '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></g></svg>'
   + '</button>';
  nav.appendChild(li);
  const btn = li.firstChild;
  const label = () => {
   const dark = root.dataset.theme === 'dark';
   btn.setAttribute('aria-label', dark ? 'Switch to day mode' : 'Switch to night mode');
   btn.title = dark ? 'Day mode' : 'Night mode';
  };
  label();
  btn.addEventListener('click', () => {
   const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
   root.classList.add('theme-fade');
   if (next === 'dark') root.dataset.theme = 'dark'; else delete root.dataset.theme;
   save(next); label();
   setTimeout(() => root.classList.remove('theme-fade'), 500);
  });
 });
})();
