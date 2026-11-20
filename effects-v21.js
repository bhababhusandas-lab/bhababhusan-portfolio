// Lab Notebook · v21 (main site): interactive circuit lab (switch, dimmer, motor + gear train, LED)
// and "Trace Runner", a little snake-style game played on a circuit board
const $ = s => document.querySelector(s);
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const method = $('#method');
if (method) {
  /* ---------- layout: bench + circuit lab side by side on wide screens, game card below ---------- */
  const row = document.createElement('div');
  row.className = 'lab-row';
  const anchor = method.querySelector('.bench') || method.querySelector('.loop') || method.lastElementChild;
  anchor.after(row);
  const adoptBench = () => { const b = method.querySelector('.bench'); if (b && b.parentElement !== row) { row.prepend(b); return true; } return !!b; };
  if (!adoptBench()) { // v20 may load after this module
    const mo = new MutationObserver(() => { if (adoptBench()) mo.disconnect(); });
    mo.observe(method, {childList: true});
  }
  circuitLab(row);
  traceRunner(row);
}

/* ===================== circuit lab ===================== */
function gearPath(cx, cy, teeth, r, depth){
  let d = '';
  const step = Math.PI * 2 / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [[a, r - depth], [a + step * .15, r], [a + step * .45, r], [a + step * .6, r - depth]];
    pts.forEach(([ang, rad], j) => { d += (i === 0 && j === 0 ? 'M' : 'L') + (cx + Math.cos(ang) * rad).toFixed(1) + ' ' + (cy + Math.sin(ang) * rad).toFixed(1); });
  }
  return d + 'Z';
}

function circuitLab(row){
  const V = 9, RM = 10;
  const fig = document.createElement('figure');
  fig.className = 'circuit-lab';
  fig.innerHTML = `
    <div class="cl-head"><span class="mono-label">FIG. 4.2 — CIRCUIT LAB · FLIP THE SWITCH</span><span class="cl-led" aria-hidden="true"></span></div>
    <svg class="cl-svg" viewBox="0 0 340 190" aria-hidden="true">
      <path class="wire" d="M30 30H220V160H30Z"/>
      <path class="flow" d="M30 95V30H220V160H30Z"/>
      <!-- battery -->
      <g class="batt"><rect class="gap" x="12" y="80" width="36" height="30"/><path d="M14 88H46M22 98H38M14 104H46M22 114H38" transform="translate(0 -6)"/>
        <text x="52" y="90">9V</text><text class="pm" x="50" y="80">+</text></g>
      <!-- switch -->
      <g class="sw" role="presentation"><rect class="gap" x="72" y="20" width="56" height="20"/><circle cx="80" cy="30" r="3.5"/><circle cx="120" cy="30" r="3.5"/>
        <line class="lever" x1="80" y1="30" x2="119" y2="30"/><text x="100" y="54">S1</text><rect class="hit" x="66" y="6" width="68" height="40"/></g>
      <!-- variable resistor -->
      <g class="res"><rect class="gap" x="138" y="20" width="64" height="20"/><path class="zig" d="M138 30h8l4-8 8 16 8-16 8 16 8-16 8 16 4-8h8"/>
        <path class="pot" d="M150 46 192 12M186 12h6v6"/><text class="r-txt" x="170" y="58">47Ω</text></g>
      <!-- motor + gear train -->
      <g class="motor"><rect class="gap" x="206" y="72" width="28" height="46"/><circle cx="220" cy="95" r="17"/><text x="220" y="100">M</text>
        <path class="shaft" d="M237 95H252"/></g>
      <g class="gear-s"><path d="${gearPath(0, 0, 10, 13, 4)}"/><circle r="3"/></g>
      <g class="gear-l"><path d="${gearPath(0, 0, 20, 25, 4)}"/><circle r="4"/><path class="fan" d="M0 0 0-19M0 0 16.5 9.5M0 0-16.5 9.5"/></g>
      <!-- LED -->
      <g class="led-c"><circle class="glow" cx="125" cy="160" r="22"/><rect class="gap" x="108" y="148" width="34" height="24"/>
        <path class="diode" d="M114 150v20l20-10zM134 150v20"/><path class="rays" d="M126 144l6-8M133 147l7-6M136 133h4v4M141 139h4v4"/></g>
      <text class="lbl" x="125" y="185">D1</text>
    </svg>
    <div class="cl-controls">
      <button type="button" class="cl-power" aria-pressed="false">⏻ POWER OFF</button>
      <label class="cl-dim"><span>RESISTANCE</span><input type="range" min="5" max="100" value="47" aria-label="Resistance in ohms"></label>
    </div>
    <figcaption><span>V <b>9.0</b></span><span>I <b class="cl-i">0.00</b> A</span><span>P <b class="cl-p">0.00</b> W</span><span>MOTOR <b class="cl-rpm">0</b> RPM</span></figcaption>`;
  row.appendChild(fig);

  const svg = fig.querySelector('.cl-svg');
  const btn = fig.querySelector('.cl-power'), range = fig.querySelector('input');
  const flow = fig.querySelector('.flow'), glow = fig.querySelector('.glow');
  const gs = fig.querySelector('.gear-s'), gl = fig.querySelector('.gear-l');
  const iEl = fig.querySelector('.cl-i'), pEl = fig.querySelector('.cl-p'), rpmEl = fig.querySelector('.cl-rpm'), rTxt = fig.querySelector('.r-txt');
  const GSX = 265, GLX = 300, GY = 95; // gear centres (radii 13 + 25, meshing)
  let on = false, R = 47, omega = 0, angle = 0, dash = 0, running = false, visible = false, lastTxt = 0;

  const current = () => on ? V / (R + RM) : 0;
  const paint = () => {
    const I = current();
    fig.classList.toggle('on', on);
    fig.classList.toggle('hot', on && R <= 12);
    btn.textContent = on ? '⏻ POWER ON' : '⏻ POWER OFF';
    btn.setAttribute('aria-pressed', String(on));
    rTxt.textContent = R + 'Ω';
    glow.style.opacity = on ? (.25 + Math.min(1, I / .6) * .75).toFixed(2) : 0;
    iEl.textContent = I.toFixed(2);
    pEl.textContent = (I * I * (R + RM)).toFixed(2);
    if (still()) rpmEl.textContent = Math.round(I * 40 * 60 / (Math.PI * 2) * 10);
  };
  const place = () => {
    gs.setAttribute('transform', `translate(${GSX} ${GY}) rotate(${angle.toFixed(1)})`);
    gl.setAttribute('transform', `translate(${GLX} ${GY}) rotate(${(-angle * 13 / 25 + 9).toFixed(1)})`);
    flow.style.strokeDashoffset = dash.toFixed(1);
  };
  let prev = 0;
  const tick = now => {
    const dt = Math.min(50, now - prev) / 1000; prev = now;
    const I = current();
    omega += (I * 40 - omega) * Math.min(1, dt * 1.4); // the motor has inertia: spins up and coasts down
    angle = (angle + omega * dt * 180 / Math.PI) % 360;
    if (on) dash -= I * 110 * dt;
    place();
    if (now - lastTxt > 120) { lastTxt = now; rpmEl.textContent = Math.round(omega * 60 / (Math.PI * 2) * 10); }
    if (visible && !document.hidden && !still() && (on || omega > .05)) requestAnimationFrame(tick);
    else { running = false; if (!on && omega <= .05) { omega = 0; rpmEl.textContent = '0'; } }
  };
  const start = () => { if (running || still()) return; running = true; prev = performance.now(); requestAnimationFrame(tick); };
  const toggle = () => {
    on = !on;
    try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate(on ? [8, 40, 8] : 8); } catch (e) {}
    paint(); start();
  };
  btn.addEventListener('click', toggle);
  svg.querySelector('.sw .hit').addEventListener('click', toggle);
  range.addEventListener('input', () => { R = +range.value; paint(); start(); });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(fig);
  paint(); place();
}

/* ===================== Trace Runner (snake on a circuit board) ===================== */
function traceRunner(row){
  const card = document.createElement('div');
  card.className = 'arcade';
  card.innerHTML = `
    <div class="arcade-art" aria-hidden="true"><svg viewBox="0 0 120 60"><path class="t" d="M8 44H40V20H76V40H104"/><circle class="h" cx="104" cy="40" r="5"/>
      <g class="part"><rect x="54" y="47" width="16" height="8" rx="2"/><path d="M48 51h6M70 51h6"/></g></svg></div>
    <div class="arcade-txt">
      <span class="mono-label">FIG. 4.3 — BREAK ROOM</span>
      <h3>Trace Runner</h3>
      <p>Guide the current around the board, collect components and don’t short the circuit.</p>
    </div>
    <button type="button" class="btn arcade-play">▶ PLAY</button>`;
  row.after(card);

  const dlg = document.createElement('dialog');
  dlg.className = 'unfold game';
  dlg.setAttribute('aria-label', 'Trace Runner game');
  dlg.innerHTML = `
    <button class="close" aria-label="Close game">×</button>
    <div class="game-wrap">
      <p class="mono-label">FIG. 4.3 — BREAK ROOM · TRACE RUNNER</p>
      <div class="game-hud"><span>PARTS <b class="g-score">0</b></span><span>BEST <b class="g-best">0</b></span><span>SPEED <b class="g-speed">x1</b></span></div>
      <div class="game-board"><canvas tabindex="0" aria-label="Game board" role="img"></canvas><div class="game-msg"></div></div>
      <div class="dpad" aria-label="Direction controls">
        <button type="button" data-d="up" aria-label="Up">▲</button><button type="button" data-d="left" aria-label="Left">◀</button>
        <button type="button" data-d="down" aria-label="Down">▼</button><button type="button" data-d="right" aria-label="Right">▶</button>
      </div>
      <p class="game-help">Arrows / WASD or swipe · Space to pause</p>
    </div>`;
  document.body.appendChild(dlg);

  const N = 17;
  const canvas = dlg.querySelector('canvas'), ctx = canvas.getContext('2d');
  const msg = dlg.querySelector('.game-msg'), board = dlg.querySelector('.game-board');
  const scoreEl = dlg.querySelector('.g-score'), bestEl = dlg.querySelector('.g-best'), speedEl = dlg.querySelector('.g-speed');
  const DIRS = {up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]};
  const PARTS = [
    {type: 'res', label: '+ 220Ω'}, {type: 'cap', label: '+ 10µF'}, {type: 'led', label: '+ LED'},
    {type: 'chip', label: '+ IC 555'}, {type: 'res', label: '+ 1kΩ'}, {type: 'cap', label: '+ 100nF'}
  ];
  let best = 0;
  try { best = +localStorage.getItem('trace-runner-best') || 0; } catch (e) {}
  bestEl.textContent = best;

  let size = 340, cell = 20, colors = {};
  let snake, dir, queue, food, score, state = 'ready', interval, acc = 0, last = 0, raf = 0, pops = [], flash = 0;

  const fit = () => {
    const avail = Math.min(board.parentElement.clientWidth, 420, innerHeight * .52);
    cell = Math.max(12, Math.floor(avail / N));
    size = cell * N;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = board.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    colors = {card: css('--card'), ink: css('--ink'), amber: css('--amber'), blue: css('--blue'), muted: css('--muted'), line: css('--line'), grid: css('--grid')};
  };
  const placeFood = () => {
    let p;
    do { p = {x: (Math.random() * N) | 0, y: (Math.random() * N) | 0}; } while (snake.some(s => s.x === p.x && s.y === p.y));
    food = {...p, ...PARTS[(Math.random() * PARTS.length) | 0]};
  };
  const reset = () => {
    const m = N >> 1;
    snake = [{x: m - 2, y: m}, {x: m - 3, y: m}, {x: m - 4, y: m}];
    dir = 'right'; queue = []; score = 0; interval = 150; pops = [];
    scoreEl.textContent = 0; speedEl.textContent = 'x1';
    placeFood();
  };
  const say = html => { msg.innerHTML = html; msg.hidden = !html; };

  /* drawing */
  const cx = c => c * cell + cell / 2;
  const drawPart = (f, t) => {
    const x = cx(f.x), y = cx(f.y), s = cell * .42, bob = Math.sin(t / 220) * cell * .06;
    ctx.save(); ctx.translate(x, y + bob);
    ctx.lineWidth = Math.max(1.5, cell * .09); ctx.strokeStyle = colors.ink; ctx.lineCap = 'round';
    ctx.shadowColor = colors.amber; ctx.shadowBlur = 8;
    if (f.type === 'res') {
      ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke();
      ctx.fillStyle = '#e9c98b'; ctx.fillRect(-s * .6, -s * .35, s * 1.2, s * .7); ctx.strokeRect(-s * .6, -s * .35, s * 1.2, s * .7);
      ctx.shadowBlur = 0;
      ['#c92a2a', '#7048e8', '#2b8a3e'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-s * .4 + i * s * .3, -s * .35, s * .12, s * .7); });
    } else if (f.type === 'cap') {
      ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s * .18, 0); ctx.moveTo(s * .18, 0); ctx.lineTo(s, 0);
      ctx.moveTo(-s * .18, -s * .6); ctx.lineTo(-s * .18, s * .6); ctx.moveTo(s * .18, -s * .6); ctx.lineTo(s * .18, s * .6); ctx.stroke();
    } else if (f.type === 'led') {
      ctx.fillStyle = '#ff6b6b'; ctx.shadowColor = '#ff6b6b'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(-s * .5, -s * .55); ctx.lineTo(s * .45, 0); ctx.lineTo(-s * .5, s * .55); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * .5, -s * .55); ctx.lineTo(s * .5, s * .55); ctx.stroke();
    } else {
      ctx.fillStyle = colors.ink; ctx.fillRect(-s * .55, -s * .45, s * 1.1, s * .9);
      ctx.shadowBlur = 0; ctx.beginPath();
      for (let i = -1; i <= 1; i++) { ctx.moveTo(i * s * .35, -s * .45); ctx.lineTo(i * s * .35, -s * .75); ctx.moveTo(i * s * .35, s * .45); ctx.lineTo(i * s * .35, s * .75); }
      ctx.stroke();
    }
    ctx.restore();
  };
  const draw = t => {
    ctx.fillStyle = colors.card; ctx.fillRect(0, 0, size, size);
    // PCB vias
    ctx.fillStyle = colors.grid;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { ctx.beginPath(); ctx.arc(cx(i), cx(j), Math.max(1, cell * .07), 0, 7); ctx.fill(); }
    if (!snake) return;
    drawPart(food, t);
    // the trace: dark outline, copper core, moving current dashes
    const path = () => { ctx.beginPath(); snake.forEach((s, i) => i ? ctx.lineTo(cx(s.x), cx(s.y)) : ctx.moveTo(cx(s.x), cx(s.y))); };
    ctx.lineJoin = ctx.lineCap = 'round';
    path(); ctx.strokeStyle = colors.ink; ctx.lineWidth = cell * .62; ctx.stroke();
    path(); ctx.strokeStyle = state === 'over' ? '#fa5252' : colors.amber; ctx.lineWidth = cell * .4; ctx.stroke();
    if (!still()) { path(); ctx.setLineDash([cell * .15, cell * .55]); ctx.lineDashOffset = -t / 40; ctx.strokeStyle = '#fff8'; ctx.lineWidth = cell * .14; ctx.stroke(); ctx.setLineDash([]); }
    // head = electron
    const h = snake[0];
    ctx.save(); ctx.shadowColor = colors.amber; ctx.shadowBlur = 14; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx(h.x), cx(h.y), cell * .3, 0, 7); ctx.fill();
    ctx.restore();
    ctx.fillStyle = colors.ink; ctx.font = `700 ${Math.round(cell * .38)}px ${css('--mono') || 'monospace'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('e', cx(h.x), cx(h.y) + 1);
    // popping labels
    pops = pops.filter(p => t - p.t < 900);
    pops.forEach(p => {
      const k = (t - p.t) / 900;
      ctx.globalAlpha = 1 - k; ctx.fillStyle = colors.blue;
      ctx.font = `700 ${Math.round(cell * .6)}px ${css('--mono') || 'monospace'}`;
      ctx.fillText(p.label, Math.min(size - 40, Math.max(40, p.x)), p.y - k * cell * 1.6);
      ctx.globalAlpha = 1;
    });
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, size, size); flash = Math.max(0, flash - .06); }
  };

  /* rules */
  const step = t => {
    if (queue.length) dir = queue.shift();
    const [dx, dy] = DIRS[dir], h = snake[0];
    const nx = h.x + dx, ny = h.y + dy;
    const hitWall = nx < 0 || ny < 0 || nx >= N || ny >= N;
    const hitSelf = snake.some((s, i) => i < snake.length - 1 && s.x === nx && s.y === ny);
    if (hitWall || hitSelf) return over();
    snake.unshift({x: nx, y: ny});
    if (nx === food.x && ny === food.y) {
      score++; scoreEl.textContent = score;
      pops.push({label: food.label, x: cx(nx), y: cx(ny), t});
      interval = Math.max(68, 150 - score * 5);
      speedEl.textContent = 'x' + (150 / interval).toFixed(1);
      try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate(12); } catch (e) {}
      placeFood();
    } else snake.pop();
  };
  const over = () => {
    state = 'over'; flash = .8;
    try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate([30, 40, 60]); } catch (e) {}
    let rec = '';
    if (score > best) { best = score; bestEl.textContent = best; rec = '<small>NEW RECORD ★</small>'; try { localStorage.setItem('trace-runner-best', best); } catch (e) {} }
    board.classList.remove('shake'); void board.offsetWidth; board.classList.add('shake');
    say(`<b>SHORT CIRCUIT ⚡</b><span>${score} part${score === 1 ? '' : 's'} soldered</span>${rec}<em>tap or press Space to rewire</em>`);
  };
  const loop = t => {
    raf = requestAnimationFrame(loop);
    if (state === 'play') {
      acc += Math.min(200, t - last);
      while (acc >= interval && state === 'play') { acc -= interval; step(t); }
    }
    last = t;
    draw(t);
  };
  const begin = () => { reset(); state = 'play'; acc = 0; say(''); };
  const pause = () => {
    if (state === 'play') { state = 'paused'; say('<b>PAUSED</b><em>tap or press Space to resume</em>'); }
    else if (state === 'paused') { state = 'play'; say(''); }
  };
  const turn = d => {
    if (state === 'ready' || state === 'over') { begin(); }
    if (state !== 'play') return;
    const lastDir = queue.length ? queue[queue.length - 1] : dir;
    const [ax, ay] = DIRS[lastDir], [bx, by] = DIRS[d];
    if (ax + bx === 0 && ay + by === 0) return; // no reversing into yourself
    if (d !== lastDir && queue.length < 2) queue.push(d);
  };

  /* input */
  const KEYS = {ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'};
  dlg.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'Tab') return;
    e.stopPropagation(); // keep WASD from reaching the page's other keyboard easter eggs
    if (KEYS[e.key]) { e.preventDefault(); turn(KEYS[e.key]); }
    else if (e.key === ' ' || e.key === 'Enter') {
      if (e.key === 'Enter' && e.target.closest('button')) return; // Enter still presses the close button
      e.preventDefault();
      state === 'play' || state === 'paused' ? pause() : begin();
    }
  });
  let sx = 0, sy = 0, tracking = false;
  board.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; tracking = true; });
  board.addEventListener('pointermove', e => {
    if (!tracking) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    sx = e.clientX; sy = e.clientY;
  });
  board.addEventListener('pointerup', () => {
    if (tracking && (state === 'ready' || state === 'over')) begin();
    else if (tracking && state === 'paused') pause();
    tracking = false;
  });
  board.addEventListener('pointercancel', () => { tracking = false; });
  dlg.querySelectorAll('.dpad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); turn(b.dataset.d); }));

  /* open / close */
  const open = () => {
    dlg.showModal();
    fit(); reset(); state = 'ready';
    say('<b>TRACE RUNNER</b><span>collect components · avoid the edges and yourself</span><em>tap the board or press Space to power on</em>');
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    canvas.focus({preventScroll: true});
  };
  card.querySelector('.arcade-play').addEventListener('click', open);
  dlg.querySelector('.close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { cancelAnimationFrame(raf); if (state === 'play') state = 'paused'; });
  addEventListener('resize', () => { if (dlg.open) fit(); });
  dlg.peek = () => ({snake, food, state, dir}); // read-only snapshot, handy for testing
}
