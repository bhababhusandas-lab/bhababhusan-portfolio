// Lab Notebook · v12 effects (main site): jelly cards on scroll, toolbox "component test", timeline signal pulse
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();
const buzz = p => { try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

/* 1. experiment cards lean with scroll speed, then spring back */
(function jelly(){
  const grid = $('#exp-grid');
  if (!grid) return;
  let lastY = scrollY, lastT = performance.now(), skew = 0, target = 0, running = false, visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(grid);
  const loop = () => {
    target *= .82;                          // speed fades out on its own when scrolling stops
    skew += (target - skew) * .2;
    grid.style.transform = Math.abs(skew) < .02 ? '' : `skewY(${skew.toFixed(2)}deg)`;
    if (Math.abs(skew) < .02 && Math.abs(target) < .02) { running = false; grid.style.transform = ''; return; }
    requestAnimationFrame(loop);
  };
  addEventListener('scroll', () => {
    const now = performance.now(), dt = Math.max(16, now - lastT);
    const v = (scrollY - lastY) / dt;          // px per ms
    lastY = scrollY; lastT = now;
    if (!visible || still()) return;
    target = Math.max(-3.5, Math.min(3.5, v * 2.2));
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, {passive: true});
})();

/* 2. tap / hover a toolbox row: it runs a quick component test and reports OK */
$$('.bom tbody tr').forEach(row => {
  const test = () => {
    if (row.classList.contains('testing')) return;
    row.classList.remove('tested');
    if (still()) { row.classList.add('tested'); return; }
    row.classList.add('testing');
    buzz(6);
    setTimeout(() => { row.classList.remove('testing'); row.classList.add('tested'); buzz([8, 40, 8]); }, 700);
  };
  row.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') test(); });
  row.addEventListener('click', test);
});

/* 3. tap a year in the timeline: a signal pulse travels down the line to NOW */
(function pulse(){
  const tl = $('.timeline');
  if (!tl) return;
  const items = [...tl.querySelectorAll('li')];
  items.forEach((li, i) => {
    li.style.cursor = 'pointer';
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `${li.textContent.replace(/\s+/g, ' ').trim()} — send a signal to now`);
    const fire = () => {
      const now = items[items.length - 1];
      li.classList.remove('emit'); void li.offsetWidth; li.classList.add('emit');
      if (still() || li === now) { now.classList.remove('receive'); void now.offsetWidth; now.classList.add('receive'); return; }
      buzz(10);
      const from = li.offsetTop + 12, to = now.offsetTop + 12;
      const dot = document.createElement('span');
      dot.className = 'tl-pulse';
      tl.appendChild(dot);
      dot.animate([{top: from + 'px', opacity: 1}, {top: to + 'px', opacity: 1}],
        {duration: 500 + (to - from) * 2, easing: 'cubic-bezier(.5,0,.3,1)'}).finished.then(() => {
        dot.remove();
        now.classList.remove('receive'); void now.offsetWidth; now.classList.add('receive');
        buzz([10, 30, 20]);
      });
    };
    li.addEventListener('click', fire);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  });
})();
