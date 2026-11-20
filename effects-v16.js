// Lab Notebook · v16 effects (main site): circuit power surge on jumps, idle paper plane, re-stamp sheet labels
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();

/* 1. jumping to a section sends a pulse down the circuit to that sheet's node */
(function surge(){
  const main = $('#main');
  if (!main) return;
  const railX = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rail-x')) || 30;
  const nodeY = section => {
    const label = section.querySelector('[data-node]') || section;
    return label.getBoundingClientRect().top + scrollY - (main.getBoundingClientRect().top + scrollY) + label.offsetHeight / 2;
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || still()) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target || !target.classList.contains('sheet') || id === 'top') return;
    const mainTop = main.getBoundingClientRect().top + scrollY;
    const from = Math.max(0, scrollY + innerHeight * .35 - mainTop), to = nodeY(target);
    if (Math.abs(to - from) < 40) return;
    const dot = document.createElement('span');
    dot.className = 'surge';
    dot.setAttribute('aria-hidden', 'true');
    dot.style.left = railX() + 'px';
    main.appendChild(dot);
    const dur = Math.min(1400, 500 + Math.abs(to - from) * .25);
    dot.animate([{top: from + 'px', opacity: 0, scale: .4}, {opacity: 1, scale: 1, offset: .1}, {top: to + 'px', opacity: 1, scale: 1.2}],
      {duration: dur, easing: 'cubic-bezier(.6,0,.3,1)'}).finished.then(() => {
      dot.remove();
      const r = target.querySelector('[data-node]')?.getBoundingClientRect();
      const svg = $('#circuit')?.getBoundingClientRect();
      if (r && svg) dispatchEvent(new CustomEvent('node-lit', {detail: {x: svg.left + railX(), y: r.top + r.height / 2}})); // reuses the spark burst
    });
  });
})();

/* 2. idle for a while: a paper plane glides across the page once */
(function idlePlane(){
  const IDLE = 12000;
  let timer = null, flown = 0;
  const fly = () => {
    if (still() || document.hidden || flown >= 2 || document.querySelector('dialog[open]')) return;
    flown++;
    const w = document.createElement('div');
    w.className = 'idle-plane';
    w.setAttribute('aria-hidden', 'true');
    const W = innerWidth, H = innerHeight, y0 = H * (.25 + Math.random() * .3);
    w.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path class="trail" d="M-40 ${y0} C ${W * .3} ${y0 - 120}, ${W * .55} ${y0 + 140}, ${W + 60} ${y0 - 60}"/></svg>
      <svg class="plane-body" viewBox="0 0 24 24"><path d="M2 11 22 3l-6 18-5-7-9-3zM11 14l11-11"/></svg>`;
    document.body.appendChild(w);
    const path = w.querySelector('.trail'), body = w.querySelector('.plane-body');
    const len = path.getTotalLength();
    path.style.strokeDasharray = `6 7`;
    const D = 4200, t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / D);
      const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const pt = path.getPointAtLength(e * len), ahead = path.getPointAtLength(Math.min(len, e * len + 2));
      const ang = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI;
      body.style.transform = `translate(${pt.x - 14}px, ${pt.y - 14}px) rotate(${ang + 20}deg)`;
      w.style.setProperty('--reveal', (e * 100).toFixed(1) + '%');
      if (p < 1) requestAnimationFrame(step); else { w.classList.add('gone'); setTimeout(() => w.remove(), 900); }
    };
    requestAnimationFrame(step);
  };
  const reset = () => { clearTimeout(timer); timer = setTimeout(fly, IDLE); };
  ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, reset, {passive: true}));
  reset();
})();

/* 3. tap / click a sheet label to stamp it down again */
$$('.sheet-label').forEach(l => {
  l.style.cursor = 'pointer';
  l.addEventListener('click', () => {
    if (still()) return;
    l.classList.remove('stamped'); void l.offsetWidth; l.classList.add('stamped');
    try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate(15); } catch (e) {}
  });
});
