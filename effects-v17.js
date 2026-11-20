// Lab Notebook · v17 effects (main site): coffee ring stains, rocket back-to-top, session receipt at the end
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();

/* 1. linger on a sheet for a few seconds and a coffee ring appears in its corner */
(function coffee(){
  const sheets = $$('.sheet');
  if (!sheets.length || !('IntersectionObserver' in window)) return;
  const timers = new Map();
  const ring = sheet => {
    if (still() || sheet.querySelector('.coffee')) return;
    const left = Math.random() < .5;
    const c = document.createElement('span');
    c.className = 'coffee' + (left ? ' left' : '');
    c.setAttribute('aria-hidden', 'true');
    c.style.rotate = (Math.random() * 360).toFixed(0) + 'deg';
    c.innerHTML = `<svg viewBox="0 0 120 120"><circle class="ring" cx="60" cy="60" r="44"/><circle class="ring thin" cx="61" cy="58" r="40"/>
      <path class="ring" d="M98 34c6 4 9 9 8 12"/><circle class="drop" cx="108" cy="22" r="3"/><circle class="drop" cx="18" cy="100" r="2"/></svg>`;
    sheet.appendChild(c);
  };
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    clearTimeout(timers.get(e.target));
    if (e.isIntersecting) timers.set(e.target, setTimeout(() => ring(e.target), 5000));
  }), {threshold: .55});
  sheets.forEach(s => io.observe(s));
})();

/* 2. a little rocket that launches you back to the top */
(function rocket(){
  const b = document.createElement('button');
  b.className = 'rocket';
  b.type = 'button';
  b.setAttribute('aria-label', 'Back to top');
  b.innerHTML = `<svg viewBox="0 0 32 32" aria-hidden="true"><path class="hull" d="M16 3c5 4 7 10 6 17h-12C9 13 11 7 16 3z"/><circle class="port" cx="16" cy="12" r="2.6"/>
    <path class="fin" d="M10 16l-4 6 4 1zM22 16l4 6-4 1z"/><path class="flame" d="M13 21h6l-3 7z"/></svg>`;
  document.body.appendChild(b);
  let shown = false, busy = false;
  const check = () => {
    const on = scrollY > innerHeight * 1.5;
    if (on !== shown) { shown = on; b.classList.toggle('on', on); }
  };
  addEventListener('scroll', check, {passive: true});
  check();
  b.addEventListener('click', () => {
    if (busy) return;
    if (still()) { scrollTo({top: 0}); return; }
    busy = true;
    b.classList.add('ignite');
    try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate([10, 30, 20]); } catch (e) {}
    const r = b.getBoundingClientRect();
    // smoke puffs
    for (let i = 0; i < 7; i++) {
      const p = document.createElement('span');
      p.className = 'puff';
      p.setAttribute('aria-hidden', 'true');
      p.style.left = r.left + r.width / 2 + 'px';
      p.style.top = r.bottom - 6 + 'px';
      document.body.appendChild(p);
      const dx = (Math.random() - .5) * 60, s = .6 + Math.random() * .9;
      p.animate([{transform: 'translate(-50%,-50%) scale(.3)', opacity: .8}, {transform: `translate(calc(-50% + ${dx}px), ${10 + Math.random() * 25}px) scale(${s * 2})`, opacity: 0}],
        {duration: 900 + Math.random() * 400, delay: 350 + i * 40, easing: 'ease-out'}).finished.then(() => p.remove());
    }
    b.animate([{transform: 'translate(0,0)'}, {transform: 'translate(-1px,1px)', offset: .1}, {transform: 'translate(1px,0)', offset: .2}, {transform: 'translate(-1px,0)', offset: .3},
      {transform: 'translate(0,0)', offset: .38}, {transform: `translate(0, ${-(r.top + 80)}px)`}],
      {duration: 1100, easing: 'cubic-bezier(.7,0,.9,.6)'}).finished.then(() => {
      b.classList.remove('ignite');
      b.classList.add('landing');
      setTimeout(() => { b.classList.remove('landing'); busy = false; }, 700);
    });
    setTimeout(() => {
      const y0 = scrollY;
      scrollTo({top: 0, behavior: 'smooth'});
      setTimeout(() => { if (scrollY >= y0 - 5) scrollTo({top: 0}); }, 700); // fallback if smooth scroll got interrupted
    }, 380);
  });
})();

/* 3. reach the end of the notebook: a thermal receipt prints a log of the visit */
(function receipt(){
  const end = $('#output');
  if (!end || !('IntersectionObserver' in window)) return;
  const t0 = performance.now();
  const seen = new Set();
  const sio = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && seen.add(e.target.id)), {threshold: .3});
  $$('.sheet[id]').forEach(s => sio.observe(s));
  let printed = false;
  const print = () => {
    if (printed || still() || document.querySelector('dialog[open]')) return;
    printed = true;
    const secs = Math.round((performance.now() - t0) / 1000);
    const time = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    const total = $$('.sheet[id]').length;
    const now = new Date();
    const d = now.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).toUpperCase();
    const r = document.createElement('div');
    r.className = 'receipt';
    r.setAttribute('role', 'status');
    r.innerHTML = `<div class="paper">
      <b>LAB NOTEBOOK · VISIT LOG</b>
      <span>${d} · ${now.toTimeString().slice(0, 5)}</span>
      <hr>
      <p><i>SHEETS READ</i><i>${seen.size}/${total}</i></p>
      <p><i>TIME ON PAGE</i><i>${time}</i></p>
      <p><i>STATUS</i><i class="ok">PASSED ✓</i></p>
      <hr>
      <span class="thx">thanks for reading!</span>
      <span class="code" aria-hidden="true"></span>
      <button type="button" class="tear" aria-label="Dismiss receipt">TEAR OFF ✂</button>
    </div>`;
    document.body.appendChild(r);
    requestAnimationFrame(() => r.classList.add('printing'));
    const tear = () => {
      if (r.classList.contains('torn')) return;
      r.classList.add('torn');
      setTimeout(() => r.remove(), 700);
    };
    r.querySelector('.tear').addEventListener('click', tear);
    setTimeout(tear, 9000);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { io.disconnect(); setTimeout(print, 900); }
  }), {threshold: .6});
  io.observe(end);
})();
