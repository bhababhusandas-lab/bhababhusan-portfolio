// Lab Notebook · v7 effects: highlighter strokes, draggable sticky note, Shift+drag measuring tool
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || calm();
const fine = matchMedia('(pointer: fine)').matches;

/* 1. highlighter pen over key phrases */
(function highlighter(){
  const PHRASES = ['AI', 'web technologies', 'useful digital experiences', 'artificial intelligence', 'learning by building', 'AI-powered products'];
  const targets = $$('.hero-bio, .story p');
  targets.forEach(p => {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      // longest phrases first so "AI-powered products" wins over "AI"
      const re = new RegExp(`\\b(${[...PHRASES].sort((a, b) => b.length - a.length).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'g');
      const text = node.data;
      if (!re.test(text)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0, m;
      while ((m = re.exec(text))) {
        frag.append(text.slice(last, m.index));
        const mark = document.createElement('mark');
        mark.className = 'hl';
        mark.textContent = m[0];
        frag.append(mark);
        last = m.index + m[0].length;
      }
      frag.append(text.slice(last));
      node.replaceWith(frag);
    });
  });
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.querySelectorAll('.hl').forEach((m, i) => { m.style.transitionDelay = `${.4 + i * .35}s`; m.classList.add('on'); });
    io.unobserve(en.target);
  }), {threshold: .6});
  targets.forEach(t => io.observe(t));
})();

/* 2. draggable sticky note on the hero */
(function sticky(){
  const hero = $('.hero');
  if (!hero) return;
  const note = document.createElement('div');
  note.className = 'sticky';
  note.setAttribute('role', 'note');
  note.innerHTML = '<span class="sticky-pin" aria-hidden="true"></span><p>Open to<br>opportunities<span>✳</span></p><small>DRAG ME</small>';
  hero.appendChild(note);
  let sx = 0, sy = 0, ox = 0, oy = 0, x = 0, y = 0, lastX = 0, vx = 0, dragging = false;
  note.addEventListener('pointerdown', e => {
    dragging = true; note.setPointerCapture(e.pointerId);
    sx = e.clientX; sy = e.clientY; ox = x; oy = y; lastX = e.clientX;
    note.classList.add('lifted');
  });
  note.addEventListener('pointermove', e => {
    if (!dragging) return;
    // keep it roughly on the hero sheet
    x = Math.max(-hero.clientWidth * .6, Math.min(hero.clientWidth * .3, ox + e.clientX - sx));
    y = Math.max(-hero.clientHeight * .5, Math.min(hero.clientHeight * .25, oy + e.clientY - sy));
    vx = e.clientX - lastX; lastX = e.clientX;
    note.style.translate = `${x}px ${y}px`;
    note.style.rotate = `${Math.max(-18, Math.min(18, vx * 1.4)) + 4}deg`; // swings with drag speed
  });
  const drop = () => {
    if (!dragging) return;
    dragging = false;
    note.classList.remove('lifted');
    note.style.rotate = '';
    if (!reduce && !calm()) { note.classList.remove('settle'); void note.offsetWidth; note.classList.add('settle'); }
  };
  note.addEventListener('pointerup', drop);
  note.addEventListener('pointercancel', drop);
})();

/* 3. measuring tool: hold Shift and drag */
(function measure(){
  if (!fine) return;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'measure');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<line class="m-line"/><line class="m-tick m-a"/><line class="m-tick m-b"/><g class="m-tag"><rect rx="3"/><text></text></g>';
  document.body.appendChild(svg);
  const line = svg.querySelector('.m-line'), ta = svg.querySelector('.m-a'), tb = svg.querySelector('.m-b');
  const tag = svg.querySelector('.m-tag'), rect = tag.querySelector('rect'), label = tag.querySelector('text');
  let start = null;
  const set = (el, a) => Object.entries(a).forEach(([k, v]) => el.setAttribute(k, v));
  const draw = (x1, y1, x2, y2) => {
    set(line, {x1, y1, x2, y2});
    const ang = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(ang) * 8, ny = Math.cos(ang) * 8;
    set(ta, {x1: x1 - nx, y1: y1 - ny, x2: x1 + nx, y2: y1 + ny});
    set(tb, {x1: x2 - nx, y1: y2 - ny, x2: x2 + nx, y2: y2 + ny});
    const px = Math.hypot(x2 - x1, y2 - y1);
    label.textContent = `${Math.round(px)} px · ${(px * 0.2646).toFixed(1)} mm`;
    const bb = label.getBBox();
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 16;
    set(label, {x: mx, y: my + 4});
    set(rect, {x: mx - bb.width / 2 - 7, y: my - 10, width: bb.width + 14, height: 20});
  };
  addEventListener('pointerdown', e => {
    if (!e.shiftKey || e.button !== 0 || e.target.closest('dialog')) return;
    e.preventDefault();
    start = {x: e.clientX, y: e.clientY};
    svg.classList.add('on'); svg.classList.remove('fade');
    draw(start.x, start.y, start.x, start.y);
  });
  addEventListener('pointermove', e => { if (start) draw(start.x, start.y, e.clientX, e.clientY); });
  addEventListener('pointerup', () => {
    if (!start) return;
    start = null;
    svg.classList.add('fade');
    setTimeout(() => svg.classList.remove('on', 'fade'), 1600);
  });
  // stop Shift+click from selecting text while measuring
  addEventListener('selectstart', e => { if (start) e.preventDefault(); });
})();
