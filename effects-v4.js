// Lab Notebook · v4 effects: pencil trail, rubber stamps, gear train, split-flap title block
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'calm';
const fine = matchMedia('(pointer: fine)').matches;
const lerp = (a, b, t) => a + (b - a) * t;

/* 1. pencil trail on the graph paper */
(function pencil(){
  const c = $('#pencil');
  if (!c) return;
  if (!fine || reduce) { c.hidden = true; return; }
  const ctx = c.getContext('2d');
  let pts = [];
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  addEventListener('resize', size); size();
  addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') pts.push({x: e.clientX, y: e.clientY, t: performance.now()});
  }, {passive: true});
  addEventListener('scroll', () => { pts = []; }, {passive: true}); // trail lives in screen space
  const LIFE = 900;
  const frame = () => {
    requestAnimationFrame(frame);
    const now = performance.now();
    pts = pts.filter(p => now - p.t < LIFE);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (pts.length < 2) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim();
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], life = 1 - (now - b.t) / LIFE;
      ctx.globalAlpha = life * .55;
      ctx.lineWidth = .6 + life * 1.6;
      ctx.beginPath(); ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x + (Math.random() - .5) * .6, b.y + (Math.random() - .5) * .6); // graphite jitter
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  frame();
})();

/* 2. rubber-stamp sheet labels */
(function stamps(){
  const labels = $$('.sheet-label');
  if (reduce) return;
  labels.forEach(l => l.classList.add('stamp-ready'));
  // stamp when it comes into view, or straight away if a nav jump already scrolled past it
  const so = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting && en.boundingClientRect.top > 0) return;
    en.target.classList.add('stamped');
    so.unobserve(en.target);
  }), {threshold: [0, .6]});
  labels.forEach(l => so.observe(l));
})();

/* 3. gear train driven by scrolling */
(function gears(){
  const NS = 'http://www.w3.org/2000/svg';
  const gearPath = (n, ro, ri) => {
    let d = '';
    const step = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      const a0 = i * step;
      [[ri, a0], [ro, a0 + step * .18], [ro, a0 + step * .5], [ri, a0 + step * .68]].forEach(([r, a], k) => {
        d += `${i === 0 && k === 0 ? 'M' : 'L'}${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
      });
    }
    return d + 'Z';
  };
  const spec = [['.gear-a', 16, 58, 49], ['.gear-b', 10, 38, 30], ['.gear-c', 8, 31, 24]];
  const els = spec.map(([sel, n, ro, ri]) => {
    const g = $(sel);
    if (!g) return null;
    const rot = document.createElementNS(NS, 'g');
    const spokes = Array.from({length: 4}, (_, k) =>
      `<line class="gear-spoke" x1="0" y1="0" x2="${(Math.cos(k * Math.PI / 2) * ri * .78).toFixed(1)}" y2="${(Math.sin(k * Math.PI / 2) * ri * .78).toFixed(1)}"/>`).join('');
    rot.innerHTML = `<path class="gear-body" d="${gearPath(n, ro, ri)}"/>${spokes}<circle class="gear-hub" r="${(ri * .34).toFixed(1)}"/>`;
    g.appendChild(rot);
    return {rot, n};
  });
  if (els.some(e => !e)) return;
  let target = scrollY * .25, cur = target;
  addEventListener('scroll', () => { target = scrollY * .25; }, {passive: true});
  const [a, b, c] = els;
  const tick = () => {
    cur = reduce ? target : lerp(cur, target, .12);
    a.rot.setAttribute('transform', `rotate(${cur.toFixed(2)})`);
    // meshing gears turn the other way, scaled by the tooth ratio
    b.rot.setAttribute('transform', `rotate(${(-cur * a.n / b.n + 9).toFixed(2)})`);
    c.rot.setAttribute('transform', `rotate(${(-cur * a.n / c.n + 11).toFixed(2)})`);
    requestAnimationFrame(tick);
  };
  tick();
})();

/* 4. split-flap title block */
(function splitFlap(){
  const block = $('.title-block');
  if (!block || reduce) return;
  const chars = [];
  [...block.querySelectorAll('dd')].filter(d => d.id !== 'clock').forEach(dd => {
    const walker = document.createTreeWalker(dd, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(t => {
      if (!t.textContent.trim()) return;
      // one wrapper per phrase: inside a flex <dd>, loose spaces between items would collapse
      const run = document.createElement('span');
      run.className = 'flap-run';
      // letters grouped per word so a word never breaks mid-letter on narrow screens
      t.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (!part.trim()) { run.append(part); return; }
        const word = document.createElement('span');
        word.className = 'flap-word';
        [...part].forEach(ch => {
          const s = document.createElement('span');
          s.className = 'flap'; s.textContent = ch; s.dataset.c = ch;
          word.append(s); chars.push(s);
        });
        run.append(word);
      });
      t.replaceWith(run);
    });
  });
  const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.';
  let running = false;
  const run = () => {
    if (running) return;
    running = true;
    const start = performance.now();
    const settle = chars.map((_, i) => 200 + (i % 18) * 55 + Math.random() * 120);
    const step = now => {
      let pending = false;
      chars.forEach((s, i) => {
        if (now - start < settle[i]) { pending = true; s.textContent = FLAP[(Math.random() * FLAP.length) | 0]; s.classList.add('flipping'); }
        else if (s.classList.contains('flipping')) { s.textContent = s.dataset.c; s.classList.remove('flipping'); }
      });
      if (pending) requestAnimationFrame(step); else running = false;
    };
    requestAnimationFrame(step);
  };
  const fo = new IntersectionObserver(([en]) => { if (en.isIntersecting) { fo.disconnect(); setTimeout(run, 350); } }, {threshold: .6});
  fo.observe(block);
  block.addEventListener('pointerenter', run); // replay on hover
})();
