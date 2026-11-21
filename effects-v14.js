// Lab Notebook · v14 effects (main site): hero name scatters on scroll, REVIEWED stamp on read projects, typed email
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();

/* 1. the letters of the name drift apart as the hero scrolls away, and come back together */
(function scatter(){
  const hero = $('.hero');
  const letters = $$('.hero h1 .ch');
  if (!hero || !letters.length) return;
  // each letter gets its own speed, sideways drift and spin
  const seed = letters.map((_, i) => ({v: .08 + ((i * 37) % 11) / 30, x: (((i * 53) % 9) - 4) * .06, r: (((i * 71) % 13) - 6) * 1.6}));
  let ticking = false, heroH = hero.offsetHeight;
  new ResizeObserver(() => { heroH = hero.offsetHeight; }).observe(hero); // cached: no layout read per frame
  let settled = false;
  const update = () => {
    ticking = false;
    const y = scrollY, h = heroH;
    if (y > h && settled) return; // already off screen and parked: nothing to write
    settled = y > h;
    if (still() || y > h) {
      if (still()) letters.forEach(l => { l.style.translate = ''; l.style.rotate = ''; l.style.opacity = ''; });
      return;
    }
    const p = Math.min(1, y / (h * .7));
    letters.forEach((l, i) => {
      const s = seed[i];
      l.style.translate = `${(y * s.x).toFixed(1)}px ${(-y * s.v).toFixed(1)}px`;
      l.style.rotate = `${(p * s.r).toFixed(2)}deg`;
      l.style.opacity = (1 - p * .55).toFixed(3);
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, {passive: true});
  update();
})();

/* 2. after a project's spec sheet is opened and closed, its card gets a REVIEWED stamp */
(function reviewed(){
  const dialog = $('#project-dialog');
  if (!dialog) return;
  let current = null;
  document.addEventListener('click', e => { const c = e.target.closest('.exp'); if (c) current = c; }, true);
  dialog.addEventListener('close', () => {
    const card = current;
    current = null;
    if (!card || card.querySelector('.reviewed')) return;
    const s = document.createElement('span');
    s.className = 'reviewed';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = 'REVIEWED <b>✓</b>';
    card.appendChild(s);
    card.setAttribute('data-reviewed', '');
  });
})();

/* 3. the email address types itself into its box when the contact sheet comes into view */
(function typedEmail(){
  const link = $('.email');
  if (!link) return;
  const textNode = [...link.childNodes].find(n => n.nodeType === 3 && n.data.trim());
  if (!textNode) return;
  const full = textNode.data.trim();
  link.setAttribute('aria-label', `Email ${full}`);
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    if (still()) return;
    link.style.width = link.getBoundingClientRect().width + 'px';   // keep the box from shrinking while it types
    const caret = document.createElement('span');
    caret.className = 'type-caret';
    caret.setAttribute('aria-hidden', 'true');
    textNode.data = '';
    textNode.after(caret);
    let i = 0;
    const step = () => {
      textNode.data = full.slice(0, ++i);
      if (i < full.length) setTimeout(step, full[i - 1] === '@' || full[i - 1] === '.' ? 160 : 42 + Math.random() * 40);
      else setTimeout(() => { caret.remove(); link.style.width = ''; }, 1400);
    };
    setTimeout(step, 500);
  }, {threshold: .8});
  io.observe(link);
})();
