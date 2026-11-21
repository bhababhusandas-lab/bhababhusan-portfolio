// Lab Notebook · v15 effects (main site): "you are here" header + nav marker, tech cross-highlight, marching loop
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();

/* 1. the header subtitle flips to the sheet you're reading; on wide screens a marker slides along the nav */
(function youAreHere(){
  const sub = $('.wordmark small');
  const nav = $('nav');
  if (!sub) return;
  const home = sub.textContent;
  const sheets = [
    ['top', home],
    ['experiments', 'SHEET 02 · EXPERIMENTS'],
    ['materials', 'SHEET 03 · MATERIALS'],
    ['method', 'SHEET 04 · METHOD'],
    ['arcade', 'SHEET 05 · ARCADE'],
    ['workbench', 'SHEET 06 · WORKBENCH'],
    ['output', 'SHEET 07 · CONTACT']
  ].map(([id, label]) => ({el: document.getElementById(id), id, label})).filter(s => s.el);

  // subtitle with a flip
  sub.classList.add('here');
  const setLabel = label => {
    if (sub.dataset.label === label) return;
    sub.dataset.label = label;
    if (still()) { sub.textContent = label; return; }
    sub.classList.remove('flip-in'); sub.classList.add('flip-out');
    setTimeout(() => { sub.textContent = label; sub.classList.remove('flip-out'); sub.classList.add('flip-in'); }, 180);
  };

  // nav marker
  let marker = null;
  if (nav) {
    marker = document.createElement('span');
    marker.className = 'nav-marker';
    marker.setAttribute('aria-hidden', 'true');
    nav.appendChild(marker);
  }
  const moveMarker = id => {
    if (!nav || !marker) return;
    const link = nav.querySelector(`a[href="#${id}"]`);
    $$('nav a').forEach(a => a.removeAttribute('aria-current'));
    if (!link) { marker.style.opacity = 0; return; }
    link.setAttribute('aria-current', 'true');
    const nr = nav.getBoundingClientRect(), lr = link.getBoundingClientRect();
    marker.style.opacity = 1;
    marker.style.width = lr.width + 'px';
    marker.style.transform = `translateX(${lr.left - nr.left}px)`;
  };

  let current = null;
  // page positions are cached and refreshed only when the page changes size
  const measure = () => sheets.forEach(s => { s.top = s.el.getBoundingClientRect().top + scrollY; });
  measure();
  new ResizeObserver(() => { measure(); current = null; pick(); }).observe(document.body);
  const pick = () => {
    // the sheet whose area covers the line 40% down the screen
    const line = innerHeight * .4;
    let found = sheets[0];
    sheets.forEach(s => { if (s.top - scrollY <= line) found = s; });
    if (found.id === current) return;
    current = found.id;
    setLabel(found.label);
    moveMarker(found.id);
  };
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; pick(); }); } }, {passive: true});
  addEventListener('resize', () => { current = null; pick(); });
  pick();
})();

/* 2. hover a tech tag: the same tag lights up on every project that used it */
(function crossHighlight(){
  const chips = $$('.exp-parts span');
  const key = el => el.textContent.trim().toLowerCase();
  chips.forEach(chip => {
    chip.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      const k = key(chip);
      if (k.startsWith('+')) return;
      chips.forEach(c => c.classList.toggle('match', key(c) === k));
      $$('.exp').forEach(card => card.classList.toggle('uses', [...card.querySelectorAll('.exp-parts span')].some(c => key(c) === k)));
      document.body.classList.add('tech-focus');
    });
    chip.addEventListener('pointerleave', () => {
      chips.forEach(c => c.classList.remove('match'));
      $$('.exp').forEach(card => card.classList.remove('uses'));
      document.body.classList.remove('tech-focus');
    });
  });
})();
