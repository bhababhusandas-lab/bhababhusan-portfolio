// Lab Notebook · v20 effects (main site), mechanical + electrical:
// scroll-driven test bench (piston engine with spark plug + analog ammeter), live-wire flow arrows, arcing plug
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();
const NS = 'http://www.w3.org/2000/svg';

/* 1. test bench: a single-cylinder engine and an ammeter, both driven by how fast you scroll */
(function bench(){
  const method = $('#method');
  if (!method) return;
  const fig = document.createElement('figure');
  fig.className = 'bench reveal';
  fig.setAttribute('aria-hidden', 'true');
  // meter ticks
  let ticks = '', labels = '';
  for (let i = 0; i <= 10; i++) {
    const a = (-60 + i * 12) * Math.PI / 180, big = i % 2 === 0;
    const r1 = big ? 70 : 74, r2 = 82;
    ticks += `<line x1="${100 + Math.sin(a) * r1}" y1="${112 - Math.cos(a) * r1}" x2="${100 + Math.sin(a) * r2}" y2="${112 - Math.cos(a) * r2}"${i >= 8 ? ' class="hot"' : ''}/>`;
    if (big) labels += `<text x="${100 + Math.sin(a) * 99}" y="${112 - Math.cos(a) * 99 + 3}">${i}</text>`;
  }
  const red = (() => { const a1 = 36 * Math.PI / 180, a2 = 60 * Math.PI / 180, r = 86;
    return `M${100 + Math.sin(a1) * r} ${112 - Math.cos(a1) * r}A${r} ${r} 0 0 1 ${100 + Math.sin(a2) * r} ${112 - Math.cos(a2) * r}`; })();
  fig.innerHTML = `
    <div class="bench-head"><span class="mono-label">FIG. 4.1 — TEST BENCH · SCROLL TO DRIVE</span><span class="bench-led"></span></div>
    <div class="bench-body">
      <svg class="engine" viewBox="56 0 88 166">
        <g class="plug-top"><rect x="94" y="2" width="12" height="10" rx="2"/><path d="M100 12v7"/></g>
        <g class="spark"><path d="M100 22l-6 6 7 1-5 7"/><circle cx="100" cy="26" r="9"/></g>
        <path class="cyl" d="M76 16H124V90M76 16V90"/>
        <rect class="piston" x="79" y="40" width="42" height="20" rx="2"/>
        <line class="ring" x1="79" y1="45" x2="121" y2="45"/>
        <g class="fly"><circle class="wheel" cx="100" cy="128" r="34"/><path class="spokes" d="M100 94v68M66 128h68M76 104l48 48M124 104l-48 48"/><circle class="hub" cx="100" cy="128" r="6"/></g>
        <line class="rod" x1="100" y1="50" x2="100" y2="106"/>
        <circle class="pin" cx="100" cy="106" r="3.5"/>
      </svg>
      <svg class="meter" viewBox="-6 2 212 128">
        <path class="dial" d="M14 112A86 86 0 0 1 186 112"/>
        <path class="red" d="${red}"/>
        <g class="ticks">${ticks}</g><g class="nums">${labels}</g>
        <text class="unit" x="100" y="88">A</text>
        <line class="needle" x1="100" y1="112" x2="100" y2="36"/>
        <circle class="pivot" cx="100" cy="112" r="6"/>
      </svg>
    </div>
    <figcaption><span>RPM <b class="b-rpm">0</b></span><span>LOAD <b class="b-amp">0.0</b> A</span><span>STATUS <b class="b-st">IDLE</b></span></figcaption>`;
  const loop = method.querySelector('.loop');
  (loop || method.lastElementChild).after(fig);
  requestAnimationFrame(() => fig.classList.add('is-visible')); // the reveal observer ran before this existed

  const piston = fig.querySelector('.piston'), ring = fig.querySelector('.ring'), rod = fig.querySelector('.rod');
  const pin = fig.querySelector('.pin'), fly = fig.querySelector('.fly'), spark = fig.querySelector('.spark');
  const needle = fig.querySelector('.needle'), led = fig.querySelector('.bench-led');
  const rpmEl = fig.querySelector('.b-rpm'), ampEl = fig.querySelector('.b-amp'), stEl = fig.querySelector('.b-st');
  const CX = 100, CY = 128, R = 22, L = 62;

  let theta = 0, omega = 0, speed = 0, lastY = scrollY, lastT = performance.now();
  let needleA = -60, needleV = 0, running = false, visible = false, lastTxt = 0;

  const draw = () => {
    const px = CX + R * Math.sin(theta), py = CY - R * Math.cos(theta);
    const top = py - Math.sqrt(L * L - (R * Math.sin(theta)) ** 2); // piston pin height
    const pyTop = top - 14;
    piston.setAttribute('y', pyTop.toFixed(1));
    ring.setAttribute('y1', (pyTop + 5).toFixed(1)); ring.setAttribute('y2', (pyTop + 5).toFixed(1));
    rod.setAttribute('x1', CX); rod.setAttribute('y1', top.toFixed(1));
    rod.setAttribute('x2', px.toFixed(1)); rod.setAttribute('y2', py.toFixed(1));
    pin.setAttribute('cx', px.toFixed(1)); pin.setAttribute('cy', py.toFixed(1));
    fly.setAttribute('transform', `rotate(${(theta * 180 / Math.PI).toFixed(1)} ${CX} ${CY})`);
    needle.setAttribute('transform', `rotate(${needleA.toFixed(2)} 100 112)`);
  };

  addEventListener('scroll', () => {
    const now = performance.now(), dt = Math.max(1, now - lastT);
    const v = Math.abs(scrollY - lastY) / dt; // px per ms
    speed = Math.min(6, speed * .6 + v * .4 * 1.6);
    lastY = scrollY; lastT = now;
    if (visible) start();
  }, {passive: true});

  let prev = performance.now(), wasTop = false;
  const tick = now => {
    const dt = Math.min(50, now - prev) / 1000; prev = now;
    speed *= Math.pow(.25, dt); // decays when you stop scrolling
    const targetOmega = 1.2 + speed * 9; // rad/s, idles slowly
    omega += (targetOmega - omega) * Math.min(1, dt * 3);
    theta = (theta + omega * dt) % (Math.PI * 2);
    // spark fires near top dead centre
    const nearTop = theta < .35 || theta > Math.PI * 2 - .05;
    if (nearTop && !wasTop) { spark.classList.remove('fire'); void spark.getBoundingClientRect(); spark.classList.add('fire'); }
    wasTop = nearTop;
    // needle: spring + damper toward the load
    const amps = Math.min(10.4, speed * 2.2);
    const target = -60 + amps * 12;
    needleV += ((target - needleA) * 90 - needleV * 11) * dt;
    needleA = Math.max(-62, Math.min(63, needleA + needleV * dt));
    draw();
    if (now - lastTxt > 120) {
      lastTxt = now;
      const rpm = Math.round(omega * 60 / (Math.PI * 2) * 10);
      rpmEl.textContent = String(rpm).padStart(4, '0');
      ampEl.textContent = Math.max(0, (needleA + 60) / 12).toFixed(1);
      const st = amps > 8 ? 'OVERLOAD!' : amps > 1.2 ? 'RUNNING' : 'IDLE';
      if (stEl.textContent !== st) { stEl.textContent = st; fig.classList.toggle('overload', amps > 8); }
      led.classList.toggle('on', amps > 1.2);
    }
    if (visible && !still() && !document.hidden) requestAnimationFrame(tick); else running = false;
  };
  const start = () => { if (running || still()) return; running = true; prev = performance.now(); requestAnimationFrame(tick); };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(fig);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });
  draw();
})();

/* 2. the flow-chart arrows become live wires with current running through them */
(function liveWires(){
  $$('.flow-arrow').forEach(svg => {
    const base = svg.querySelector('path');
    if (!base) return;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', 'M2 12H72');
    p.setAttribute('class', 'current');
    svg.appendChild(p);
  });
})();

/* 3. the plug arcs and crackles as it reaches the socket */
(function arcingPlug(){
  const out = $('#output'), plug = $('.plug');
  if (!out || !plug) return;
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'arcs');
  plug.appendChild(g);
  const bolt = (x1, x2, y) => {
    let d = `M${x1} ${y}`;
    const n = 5;
    for (let i = 1; i < n; i++) d += `L${(x1 + (x2 - x1) * i / n).toFixed(1)} ${(y + (Math.random() - .5) * 12).toFixed(1)}`;
    return d + `L${x2} ${y}`;
  };
  let busy = false;
  const crackle = () => {
    if (busy || still()) return;
    busy = true;
    const start = performance.now();
    const frame = now => {
      const t = now - start;
      // the prongs travel 34px over ~600ms; arc across whatever gap is left
      const tip = 244 + Math.min(1, t / 520) * 22;
      g.innerHTML = tip < 264 && Math.random() > .2
        ? `<path d="${bolt(tip, 266, 50.5)}"/><path d="${bolt(tip, 266, 69.5)}"/><path class="thin" d="${bolt(tip, 266, 50.5 + (Math.random() - .5) * 6)}"/>`
        : '';
      if (t < 600) requestAnimationFrame(frame);
      else { g.innerHTML = ''; busy = false; flash(); }
    };
    requestAnimationFrame(frame);
  };
  const flash = () => {
    const led = plug.querySelector('.socket-led');
    if (!led) return;
    for (let i = 0; i < 6; i++) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'zap');
      c.setAttribute('cx', 266); c.setAttribute('cy', 60); c.setAttribute('r', 1.6);
      g.appendChild(c);
      const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 16;
      c.animate([{transform: 'translate(0,0)', opacity: 1}, {transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`, opacity: 0}],
        {duration: 420, easing: 'ease-out'}).finished.then(() => c.remove());
    }
  };
  let was = out.classList.contains('powered');
  new MutationObserver(() => {
    const now = out.classList.contains('powered');
    if (now && !was) crackle();
    was = now;
  }).observe(out, {attributes: true, attributeFilter: ['class']});
  const link = $('.output-link');
  link && link.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !out.classList.contains('powered')) crackle(); });
})();
