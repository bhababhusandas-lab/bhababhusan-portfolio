// Lab Notebook · v13 effects (main site): flowchart data packet, experiment LEDs boot-up
// (the split-flap clock lives in interactions.js, where the clock is updated)
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();

/* 1. a data packet travels through the Explore → Build → Keep going flowchart */
(function packet(){
  const flow = $('.flow');
  if (!flow) return;
  const steps = [...flow.querySelectorAll('.flow-step')];
  if (steps.length < 2) return;
  let busy = false;
  const light = (s, ms) => { s.classList.remove('active'); void s.offsetWidth; s.classList.add('active'); setTimeout(() => s.classList.remove('active'), ms); };
  const run = () => {
    if (busy) return;
    if (still()) { steps.forEach(s => light(s, 1200)); return; }
    busy = true;
    const fr = flow.getBoundingClientRect();
    const pts = steps.map(s => { const r = s.getBoundingClientRect(); return {x: r.left - fr.left + r.width / 2, y: r.top - fr.top + r.height / 2}; });
    const dot = document.createElement('span');
    dot.className = 'packet';
    dot.setAttribute('aria-hidden', 'true');
    flow.appendChild(dot);
    const leg = 900, hold = 350;
    light(steps[0], leg);
    const frames = [];
    const total = (pts.length - 1) * (leg + hold);
    let t = 0;
    pts.forEach((p, i) => {
      frames.push({left: p.x + 'px', top: p.y + 'px', offset: t / total});
      if (i < pts.length - 1) { t += hold; frames.push({left: p.x + 'px', top: p.y + 'px', offset: t / total}); t += leg; }
    });
    frames[frames.length - 1].offset = 1;
    pts.forEach((_, i) => { if (i) setTimeout(() => light(steps[i], i === pts.length - 1 ? 1600 : leg), i * (leg + hold)); });
    dot.animate(frames, {duration: total, easing: 'linear'}).finished.then(() => {
      dot.remove(); busy = false;
    });
  };
  // once when the flowchart scrolls into view, then whenever a step is tapped
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); setTimeout(run, 900); } }, {threshold: .5});
  io.observe(flow);
  steps.forEach(s => { s.style.cursor = 'pointer'; s.addEventListener('click', run); });
})();

/* 2. experiment status LEDs boot up one after another */
(function ledBoot(){
  const grid = $('#exp-grid');
  if (!grid) return;
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    if (still()) return;
    $$('.exp .exp-top .led').forEach((led, i) => setTimeout(() => {
      led.classList.add('boot');
      led.addEventListener('animationend', () => led.classList.remove('boot'), {once: true});
    }, 400 + i * 260));
  }, {threshold: .25});
  io.observe(grid);
})();
