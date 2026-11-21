// Lab Notebook · v6 effects: blueprint flashlight, ghost sheet numbers, morse LED, component-shower easter egg, page curl
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'calm';
const fine = matchMedia('(pointer: fine)').matches;

/* 1. blueprint flashlight: grid lines glow around the cursor */
(function torch(){
  if (!fine || reduce) return;
  const t = document.createElement('div');
  t.className = 'torch';
  t.setAttribute('aria-hidden', 'true');
  document.body.prepend(t);
  const root = document.documentElement;
  addEventListener('pointermove', e => {
    t.style.setProperty('--tx', e.clientX + 'px');
    t.style.setProperty('--ty', e.clientY + 'px');
    t.classList.add('on');
  }, {passive: true});
  document.addEventListener('pointerleave', () => t.classList.remove('on'));
  // keep the glowing grid aligned with the page grid, which scrolls with the body
  const sync = () => t.style.setProperty('--sy', `${-scrollY}px`);
  addEventListener('scroll', sync, {passive: true}); sync();
})();

/* 2. giant outlined sheet numbers with parallax */
(function ghosts(){
  const sheets = $$('.sheet');
  const items = sheets.map((s, i) => {
    const g = document.createElement('span');
    g.className = 'ghost-num';
    g.setAttribute('aria-hidden', 'true');
    g.textContent = String(i + 1).padStart(2, '0');
    s.prepend(g);
    return {s, g};
  });
  if (reduce) return;
  let ticking = false;
  // cache each sheet's page position; re-measure only when the page changes size
  const measure = () => items.forEach(it => { const r = it.s.getBoundingClientRect(); it.top = r.top + scrollY; it.h = r.height; });
  measure();
  new ResizeObserver(() => { measure(); update(); }).observe(document.body);
  const update = () => {
    ticking = false;
    items.forEach(({s, g, top, h}) => {
      const r = {top: top - scrollY, bottom: top - scrollY + h};
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      // drift gently around the section's own top, never far enough to spill into the previous sheet
      const shift = Math.max(-70, Math.min(70, (r.top - innerHeight * .25) * -.08));
      g.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, {passive: true});
  update();
})();

/* 3. status LED blinks "HELLO" in morse code */
(function morse(){
  const led = $('.title-block .led');
  if (!led) return;
  const box = led.closest('div');
  box.title = 'Status LED is blinking HELLO in morse code';
  const tip = document.createElement('span');
  tip.className = 'morse-read';
  tip.setAttribute('aria-hidden', 'true');
  box.appendChild(tip);
  if (reduce) return;
  const CODE = {H: '....', E: '.', L: '.-..', O: '---'};
  const U = 150; // one morse unit in ms
  const seq = [];
  'HELLO'.split('').forEach((ch, ci) => {
    CODE[ch].split('').forEach((sym, si) => {
      seq.push({on: true, ms: sym === '.' ? U : U * 3, sym, ch});
      if (si < CODE[ch].length - 1) seq.push({on: false, ms: U});
    });
    if (ci < 4) seq.push({on: false, ms: U * 3, gap: true});
  });
  led.classList.remove('on');
  led.classList.add('morse');
  const play = async () => {
    if (document.documentElement.dataset.motion === 'calm') { led.classList.add('lit'); tip.textContent = ''; setTimeout(play, 3000); return; }
    let text = '';
    for (const s of seq) {
      led.classList.toggle('lit', s.on);
      if (s.on) { text += s.sym === '.' ? '·' : '–'; tip.textContent = text; }
      if (s.gap) { text += ' '; }
      await new Promise(r => setTimeout(r, s.ms));
    }
    led.classList.remove('lit');
    tip.textContent = text + '  = HELLO';
    await new Promise(r => setTimeout(r, 2600));
    tip.textContent = '';
    led.classList.add('lit');
    await new Promise(r => setTimeout(r, 2200));
    play();
  };
  setTimeout(play, 2500);
})();

/* 4. easter egg: type D-A-S (or triple-click the logo) for a component shower */
(function easterEgg(){
  const PARTS = [
    // resistor
    '<svg viewBox="0 0 60 20"><path d="M0 10h12l3-7 5 14 5-14 5 14 5-14 5 14 3-7h12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    // capacitor
    '<svg viewBox="0 0 40 30"><path d="M0 15h16M24 15h16M16 3v24M24 3v24" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>',
    // LED
    '<svg viewBox="0 0 40 40"><path d="M10 6h20v18a10 10 0 0 1-20 0z" fill="#ff9a1f" stroke="currentColor" stroke-width="2"/><path d="M15 34v6M25 34v6" stroke="currentColor" stroke-width="2"/></svg>',
    // chip
    '<svg viewBox="0 0 44 32"><rect x="6" y="4" width="32" height="24" rx="2" fill="currentColor"/><path d="M12 0v4M20 0v4M28 0v4M36 0v4M12 28v4M20 28v4M28 28v4M36 28v4" stroke="currentColor" stroke-width="2"/></svg>',
    // gear
    '<svg viewBox="0 0 40 40"><path d="M20 4l3 5 6-2 1 6 6 1-2 6 5 3-5 3 2 6-6 1-1 6-6-2-3 5-3-5-6 2-1-6-6-1 2-6-5-3 5-3-2-6 6-1 1-6 6 2z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="5" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
  ];
  let busy = false;
  const toast = msg => {
    const t = document.createElement('div');
    t.className = 'egg-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3200);
  };
  const shower = () => {
    if (busy) return;
    busy = true;
    toast('⚡ EASTER EGG FOUND — COMPONENT SHOWER');
    if (reduce) { busy = false; return; }
    const W = innerWidth, H = innerHeight;
    const bodies = Array.from({length: 46}, (_, i) => {
      const el = document.createElement('div');
      el.className = 'egg-part';
      el.innerHTML = PARTS[i % PARTS.length];
      const size = 26 + Math.random() * 30;
      el.style.width = size + 'px';
      document.body.appendChild(el);
      return {el, x: Math.random() * W, y: -60 - Math.random() * H * .8, vx: (Math.random() - .5) * 3, vy: Math.random() * 2,
              r: Math.random() * 360, vr: (Math.random() - .5) * 12, size, bounces: 0};
    });
    const t0 = performance.now();
    const step = now => {
      const age = now - t0;
      bodies.forEach(b => {
        b.vy += .35; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        if (b.y > H - b.size * .5 && b.vy > 0) { b.y = H - b.size * .5; b.vy *= -.45; b.vx *= .8; b.vr *= .6; b.bounces++; }
        if (b.x < 0 || b.x > W) b.vx *= -1;
        b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${b.r}deg)`;
        b.el.style.opacity = age > 3600 ? Math.max(0, 1 - (age - 3600) / 800) : 1;
      });
      if (age < 4400) requestAnimationFrame(step);
      else { bodies.forEach(b => b.el.remove()); busy = false; }
    };
    requestAnimationFrame(step);
  };
  let typed = '';
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-3);
    if (typed === 'das') { typed = ''; shower(); }
  });
  const tile = $('.logo-tile');
  if (tile) tile.addEventListener('click', e => { if (e.detail === 3) shower(); });
})();

/* 5. page curl in the bottom corner of the last sheet */
(function curl(){
  const out = $('#output');
  if (!out) return;
  const c = document.createElement('div');
  c.className = 'curl';
  c.innerHTML = '<div class="curl-back"><span>thanks for<br>reading ✳</span></div><div class="curl-flap"></div>';
  c.setAttribute('aria-hidden', 'true');
  out.appendChild(c);
  // hover to peel on desktop, tap to toggle on touch screens
  c.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') c.classList.add('open'); });
  c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') c.classList.remove('open'); });
  c.addEventListener('click', () => c.classList.toggle('open'));
})();
