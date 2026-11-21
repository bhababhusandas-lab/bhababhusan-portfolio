// Lab Notebook · v25 (main site): LED dot-matrix ticker, swinging plug cable, drafting guide lines under
// headings, and the Arcade heading's words drop and bounce when tapped. All cheap: transforms only, loops sleep.
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();

/* 1. LED dot-matrix ticker above the footer */
(function ticker(){
  const footer = $('#output footer');
  if (!footer) return;
  const msg = 'THANKS FOR VISITING ✦ BUILT BY BHABABHUSAN DAS ✦ AI · WEB · ELECTRICAL · MECHANICAL ✦ STILL LEARNING, STILL BUILDING ✦ ';
  const t = document.createElement('div');
  t.className = 'ticker';
  t.setAttribute('role', 'marquee');
  t.setAttribute('aria-label', msg.replace(/✦/g, '·'));
  // two copies side by side so the loop is seamless
  t.innerHTML = `<div class="ticker-track" aria-hidden="true"><span>${msg}</span><span>${msg}</span></div><i class="ticker-dots" aria-hidden="true"></i>`;
  footer.before(t);
})();

/* 2. the plug's cable sways when you scroll, like a real cord, then settles */
(function cable(){
  const cord = $('.plug .cord');
  const out = $('#output');
  if (!cord || !out) return;
  // M0 60 C40 60 50 30 90 30 S130 60 150 60  → the dip at (90,30) and its handles move on a spring
  let y = 0, v = 0, target = 0, running = false, visible = false, lastY = scrollY, prev = 0;
  const draw = () => {
    const d = y.toFixed(2), d2 = (y * .6).toFixed(2);
    cord.setAttribute('d', `M0 60C40 ${60 + +d2} 50 ${30 + +d} 90 ${30 + +d}S130 ${60 + +d2} 150 60`);
  };
  const tick = now => {
    const dt = Math.min(40, now - prev) / 1000; prev = now;
    target *= Math.pow(.02, dt);              // the push from scrolling fades away
    v += ((target - y) * 60 - v * 5) * dt;    // spring + damping
    y += v * dt;
    draw();
    if (Math.abs(v) > .02 || Math.abs(y - target) > .02 || Math.abs(target) > .02) requestAnimationFrame(tick);
    else { y = 0; v = 0; draw(); running = false; }
  };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, {rootMargin: '100px 0px'}).observe(cord.closest('svg'));
  addEventListener('scroll', () => {
    const dy = scrollY - lastY; lastY = scrollY;
    if (!visible || still()) return;
    target = Math.max(-18, Math.min(18, target + dy * .12)); // scroll down: the cord lags and bows
    if (!running) { running = true; prev = performance.now(); requestAnimationFrame(tick); }
  }, {passive: true});
})();

/* 3. a drafter's guide line sweeps under each section heading the first time it appears */
(function guides(){
  if (!('IntersectionObserver' in window)) return;
  const heads = $$('.sheet h2');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    if (still()) return;
    const g = document.createElement('span');
    g.className = 'guide';
    g.setAttribute('aria-hidden', 'true');
    g.innerHTML = '<i></i><b></b><b></b><b></b><b></b><b></b>';
    e.target.appendChild(g);
    setTimeout(() => g.remove(), 2600);
  }), {threshold: .6});
  heads.forEach(h => { h.style.position = h.style.position || 'relative'; io.observe(h); });
})();

/* 4. tap "Take a break." and its words drop, bounce and climb back */
(function dropWords(){
  const h = $('#arcade h2');
  if (!h) return;
  h.style.cursor = 'pointer';
  h.title = 'tap me';
  let busy = false;
  h.addEventListener('click', () => {
    if (busy || still()) return;
    const words = [...h.querySelectorAll('.w')];
    const parts = words.length ? words : [h];
    busy = true;
    try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate([8, 60, 8, 60, 8]); } catch (e) {}
    const runs = parts.map((w, i) => w.animate([
      {transform: 'translateY(0) rotate(0)'},
      {transform: `translateY(60px) rotate(${(i % 2 ? 1 : -1) * (6 + i * 3)}deg)`, offset: .3, easing: 'cubic-bezier(.6,0,1,.6)'},
      {transform: `translateY(38px) rotate(${(i % 2 ? 1 : -1) * 3}deg)`, offset: .42, easing: 'cubic-bezier(0,.4,.6,1)'},
      {transform: 'translateY(60px) rotate(0)', offset: .54, easing: 'cubic-bezier(.6,0,1,.6)'},
      {transform: 'translateY(52px) rotate(0)', offset: .62},
      {transform: 'translateY(60px) rotate(0)', offset: .7},
      {transform: 'translateY(0) rotate(0)', easing: 'cubic-bezier(.3,1.4,.5,1)'}
    ], {duration: 1800, delay: i * 90}).finished);
    Promise.all(runs).then(() => { busy = false; });
  });
})();
