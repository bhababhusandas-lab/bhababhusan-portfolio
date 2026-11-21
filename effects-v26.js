// Lab Notebook · v26 (main site): vernier caliper measuring the Workbench heading, an INSERT COIN prompt with a
// flippable coin in the Arcade, and signal bars beside the email. Transform/opacity only; nothing runs per scroll.
const $ = s => document.querySelector(s);
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();
const buzz = p => { try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

/* 1. a vernier caliper slides open to measure the Workbench heading */
(function caliper(){
  const head = $('#workbench .sheet-head');
  const h2 = $('#workbench h2');
  if (!head || !h2) return;
  const c = document.createElement('div');
  c.className = 'caliper';
  c.setAttribute('aria-hidden', 'true');
  let ticks = '';
  for (let i = 0; i <= 40; i++) ticks += `<i style="left:${i * 2.5}%;height:${i % 10 === 0 ? 9 : i % 5 === 0 ? 6 : 4}px"></i>`;
  c.innerHTML = `<div class="cal-beam">${ticks}</div><div class="cal-fixed"></div><div class="cal-jaw"><span class="cal-read">0.0 mm</span></div>`;
  h2.after(c);
  const read = c.querySelector('.cal-read'), jaw = c.querySelector('.cal-jaw');
  const run = () => {
    const beam = c.querySelector('.cal-beam').getBoundingClientRect().width;
    const w = Math.min(beam - 14, h2.getBoundingClientRect().width);
    const mm = w * 0.2646; // px → mm at 96 dpi
    if (still()) { jaw.style.transform = `translateX(${w}px)`; read.textContent = mm.toFixed(1) + ' mm'; return; }
    jaw.animate([{transform: 'translateX(0)'}, {transform: `translateX(${w * 1.06}px)`, offset: .75}, {transform: `translateX(${w}px)`}],
      {duration: 1500, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards'});
    const t0 = performance.now();
    const count = now => {
      const p = Math.min(1, (now - t0) / 1300);
      read.textContent = (mm * (1 - Math.pow(1 - p, 3))).toFixed(1) + ' mm';
      if (p < 1) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
  };
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); setTimeout(run, 400); } }, {threshold: .8});
  io.observe(c);
  c.addEventListener('click', () => { c.getAnimations({subtree: true}).forEach(a => a.cancel()); run(); });
  c.style.pointerEvents = 'auto';
})();

/* 2. INSERT COIN: an arcade prompt; tap the coin to flip it into the slot */
(function insertCoin(){
  const head = $('#arcade .sheet-head');
  if (!head) return;
  const box = document.createElement('div');
  box.className = 'coin-slot';
  box.innerHTML = `<button type="button" class="coin" aria-label="Insert a coin"><span class="coin-face">₹</span><span class="coin-back">1</span></button>
    <span class="slot" aria-hidden="true"></span><b class="coin-text">INSERT COIN</b><span class="credits" aria-live="polite">CREDITS 00</span>`;
  head.after(box);
  const coin = box.querySelector('.coin'), credits = box.querySelector('.credits');
  let n = 0, busy = false;
  coin.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    n = Math.min(99, n + 1);
    buzz([10, 40, 20]);
    const done = () => {
      credits.textContent = 'CREDITS ' + String(n).padStart(2, '0');
      box.classList.remove('paid'); void box.offsetWidth; box.classList.add('paid');
      busy = false;
    };
    if (still()) { done(); return; }
    coin.animate([
      {transform: 'translateY(0) rotateY(0)'},
      {transform: 'translateY(-46px) rotateY(540deg)', offset: .45, easing: 'cubic-bezier(.2,.7,.4,1)'},
      {transform: 'translateY(4px) rotateY(900deg) scale(.6)', opacity: 1, offset: .85, easing: 'cubic-bezier(.6,0,1,.6)'},
      {transform: 'translateY(10px) rotateY(900deg) scale(.4)', opacity: 0}
    ], {duration: 900}).finished.then(() => {
      coin.animate([{transform: 'translateY(-14px)', opacity: 0}, {transform: 'translateY(0)', opacity: 1}], {duration: 350, delay: 250, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'backwards'});
      done();
    });
  });
})();

/* 3. signal-strength bars beside the email rise one after another */
(function signalBars(){
  const email = $('.email');
  if (!email) return;
  const s = document.createElement('span');
  s.className = 'sig-bars';
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<i></i><i></i><i></i><i></i>';
  email.appendChild(s);
})();
