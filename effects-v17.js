// Lab Notebook · v17 effects (main site): coffee ring stains, session receipt at the end
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
