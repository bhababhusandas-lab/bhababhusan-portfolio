// Lab Notebook · v5 effects: laser-cut card outlines, scroll ruler, doodle + polaroid triggers
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'calm';
const NS = 'http://www.w3.org/2000/svg';

/* shared: mark elements visible once (doodles, polaroid) */
const seen = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  en.target.classList.add('in-view');
  seen.unobserve(en.target);
}), {threshold: .35});
$$('.doodle, .field').forEach(el => seen.observe(el));

/* 1. laser-cut outline traced around each experiment card */
$$('.exp').forEach(card => {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'draft');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<rect x="1" y="1" pathLength="1"/>';
  card.appendChild(svg);
  const fit = () => {
    const r = svg.firstChild;
    r.setAttribute('width', Math.max(0, svg.clientWidth - 2));
    r.setAttribute('height', Math.max(0, svg.clientHeight - 2));
  };
  new ResizeObserver(fit).observe(card); fit();
  seen.observe(card);
});

/* 2. scroll ruler on the right edge (desktop) */
(function ruler(){
  if (!matchMedia('(min-width: 1100px) and (pointer: fine)').matches) return;
  const el = document.createElement('div');
  el.className = 'ruler';
  el.setAttribute('role', 'slider');
  el.setAttribute('aria-label', 'Page position. Click to jump.');
  el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100');
  el.innerHTML = '<div class="ruler-ticks"></div><span class="ruler-mark"><b>000</b></span>';
  document.body.appendChild(el);
  const ticks = el.querySelector('.ruler-ticks');
  const mark = el.querySelector('.ruler-mark');
  const read = mark.querySelector('b');
  const max = () => document.documentElement.scrollHeight - innerHeight;
  const sections = $$('.sheet');
  const place = () => {
    ticks.querySelectorAll('.ruler-sec').forEach(n => n.remove());
    const m = max();
    sections.forEach((s, i) => {
      const t = document.createElement('button');
      t.className = 'ruler-sec';
      t.type = 'button';
      t.style.top = `${Math.min(100, (s.offsetTop - 80) / m * 100)}%`;
      t.setAttribute('aria-label', `Jump to sheet ${i + 1}`);
      t.dataset.n = String(i + 1).padStart(2, '0');
      t.addEventListener('click', e => { e.stopPropagation(); s.scrollIntoView({behavior: reduce ? 'auto' : 'smooth'}); });
      ticks.appendChild(t);
    });
  };
  const update = () => {
    const p = Math.max(0, Math.min(1, scrollY / (max() || 1)));
    mark.style.top = `${p * 100}%`;
    read.textContent = String(Math.round(p * 100)).padStart(3, '0');
    el.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  };
  el.addEventListener('click', e => {
    const r = ticks.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    scrollTo({top: p * max(), behavior: reduce ? 'auto' : 'smooth'});
  });
  addEventListener('scroll', update, {passive: true});
  new ResizeObserver(() => { place(); update(); }).observe(document.body);
  place(); update();
})();
