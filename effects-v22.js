// Lab Notebook · v22 (main site): two more games (Wire Up puzzle, Reflex Breaker) and a mechanical
// workshop (Newton's cradle you can pull, Geneva drive intermittent mechanism)
const $ = s => document.querySelector(s);
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();
const NS = 'http://www.w3.org/2000/svg';
const buzz = p => { try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
};

const method = $('#method');
if (method) {
  let games = document.querySelector('#arcade .arcade-shelf');
  if (!games) { games = document.createElement('div'); games.className = 'arcade-more'; method.appendChild(games); }
  wireUp(games);
  reflex(games);
  const mech = document.createElement('div');
  mech.className = 'mech-row';
  method.appendChild(mech);
  cradle(mech);
  geneva(mech);
}

/* shared: a game card + dialog shell */
function gameShell(parent, {fig, title, blurb, art, label}){
  const card = document.createElement('div');
  card.className = 'arcade';
  card.innerHTML = `<div class="arcade-art" aria-hidden="true">${art}</div>
    <div class="arcade-txt"><span class="mono-label">${fig}</span><h3>${title}</h3><p>${blurb}</p></div>
    <button type="button" class="btn arcade-play">▶ PLAY</button>`;
  parent.appendChild(card);
  const dlg = document.createElement('dialog');
  dlg.className = 'unfold game';
  dlg.setAttribute('aria-label', label);
  dlg.innerHTML = `<button class="close" aria-label="Close game">×</button><div class="game-wrap"><p class="mono-label">${fig} · ${title.toUpperCase()}</p></div>`;
  document.body.appendChild(dlg);
  dlg.querySelector('.close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', e => { if (e.key !== 'Escape' && e.key !== 'Tab') e.stopPropagation(); }); // keep keys away from page easter eggs
  return {card, dlg, wrap: dlg.querySelector('.game-wrap'), play: card.querySelector('.arcade-play')};
}

/* ===================== Wire Up: rotate tiles until every LED is powered ===================== */
function wireUp(parent){
  const {dlg, wrap, play} = gameShell(parent, {
    fig: 'FIG. 5.2 — ARCADE', title: 'Wire Up', label: 'Wire Up puzzle',
    blurb: 'Rotate the tiles to route power from the battery to every LED on the board.',
    art: `<svg viewBox="0 0 120 60"><g class="wu-art"><rect x="6" y="6" width="48" height="48"/><rect x="60" y="6" width="48" height="48"/>
      <path class="w1" d="M30 30H54M30 30V6"/><path class="w2" d="M84 30H60M84 30V54"/><circle cx="30" cy="30" r="6"/><circle class="led" cx="84" cy="30" r="6"/></g></svg>`
  });
  wrap.insertAdjacentHTML('beforeend', `
    <div class="game-hud"><span>MOVES <b class="wu-moves">0</b></span><span>LIT <b class="wu-lit">0/0</b></span><span>BEST <b class="wu-best">–</b></span></div>
    <div class="wu-board"><svg class="wu-svg" role="grid" aria-label="Puzzle board"></svg><div class="game-msg" hidden></div></div>
    <div class="wu-actions"><button type="button" class="btn wu-new">↻ NEW BOARD</button><select class="wu-size" aria-label="Board size"><option value="4">4 × 4</option><option value="5" selected>5 × 5</option><option value="6">6 × 6</option></select></div>
    <p class="game-help">Tap a tile to turn it 90°. Light every LED.</p>`);
  const svg = wrap.querySelector('.wu-svg'), msg = wrap.querySelector('.game-msg');
  const movesEl = wrap.querySelector('.wu-moves'), litEl = wrap.querySelector('.wu-lit'), bestEl = wrap.querySelector('.wu-best');
  const sizeSel = wrap.querySelector('.wu-size');
  const N_ = 1, E_ = 2, S_ = 4, W_ = 8;
  const DIRS = [[0, -1, N_, S_], [1, 0, E_, W_], [0, 1, S_, N_], [-1, 0, W_, E_]];
  const rotMask = (m, r) => { for (let i = 0; i < (r % 4); i++) m = ((m << 1) | (m >> 3)) & 15; return m; };
  let n = 5, tiles = [], src, moves = 0, solved = false;

  const generate = () => {
    n = +sizeSel.value;
    const mask = Array(n * n).fill(0), seen = Array(n * n).fill(false);
    src = (n >> 1) * n + (n >> 1);
    // randomised DFS spanning tree = every cell joined, no loops
    const stack = [src]; seen[src] = true;
    while (stack.length) {
      const c = stack[stack.length - 1], x = c % n, y = (c / n) | 0;
      const opts = DIRS.filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < n && ny < n && !seen[ny * n + nx]; });
      // keep branches short so there are lots of LEDs
      if (!opts.length || (stack.length > 1 && Math.random() < .12)) { stack.pop(); continue; }
      const [dx, dy, a, b] = opts[(Math.random() * opts.length) | 0];
      const nc = (y + dy) * n + (x + dx);
      mask[c] |= a; mask[nc] |= b; seen[nc] = true; stack.push(nc);
    }
    // any cell left unvisited by an early pop gets joined to a visited neighbour
    let fixed = true;
    while (fixed) {
      fixed = false;
      for (let c = 0; c < n * n; c++) if (!seen[c]) {
        const x = c % n, y = (c / n) | 0;
        for (const [dx, dy, a, b] of DIRS) {
          const nx = x + dx, ny = y + dy, nc = ny * n + nx;
          if (nx >= 0 && ny >= 0 && nx < n && ny < n && seen[nc]) { mask[c] |= a; mask[nc] |= b; seen[c] = true; fixed = true; break; }
        }
      }
    }
    tiles = mask.map(m => ({base: m, rot: (Math.random() * 4) | 0, turns: 0}));
    tiles.forEach(t => { t.turns = t.rot; });
    if (connected().size === n * n) tiles[(src + 1) % (n * n)].rot = (tiles[(src + 1) % (n * n)].rot + 1) % 4; // never start solved
    moves = 0; solved = false; movesEl.textContent = 0; msg.hidden = true;
    const b = store.get('wireup-best-' + n); bestEl.textContent = b || '–';
    build(); update();
  };
  const cur = i => rotMask(tiles[i].base, tiles[i].rot);
  const connected = () => {
    const lit = new Set([src]), q = [src];
    while (q.length) {
      const c = q.shift(), x = c % n, y = (c / n) | 0, m = cur(c);
      for (const [dx, dy, a, b] of DIRS) {
        if (!(m & a)) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
        const nc = ny * n + nx;
        if (!lit.has(nc) && (cur(nc) & b)) { lit.add(nc); q.push(nc); }
      }
    }
    return lit;
  };
  const build = () => {
    const S = 60;
    svg.setAttribute('viewBox', `0 0 ${n * S} ${n * S}`);
    svg.innerHTML = '';
    tiles.forEach((t, i) => {
      const x = (i % n) * S, y = ((i / n) | 0) * S;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'wu-tile');
      g.setAttribute('transform', `translate(${x} ${y})`);
      g.setAttribute('role', 'gridcell');
      g.setAttribute('tabindex', '0');
      const arms = [[30, 0], [60, 30], [30, 60], [0, 30]].filter((_, k) => t.base & (1 << k)).map(([ax, ay]) => `M30 30L${ax} ${ay}`).join('');
      const deg = [1, 2, 4, 8].filter(b => t.base & b).length;
      const kind = i === src ? 'src' : deg === 1 ? 'led' : 'wire';
      g.innerHTML = `<rect class="cell" x="1.5" y="1.5" width="57" height="57" rx="4"/>
        <g class="spin" style="rotate:${t.turns * 90}deg"><path class="arm" d="${arms}"/>
        ${kind === 'src' ? '<rect class="batt" x="17" y="19" width="26" height="22" rx="3"/><path class="batt-mark" d="M24 30h6M27 27v6M34 30h4"/>' : kind === 'led' ? '<circle class="bulb" cx="30" cy="30" r="10"/><path class="bulb-x" d="M25 25l10 10M35 25l-10 10"/>' : '<circle class="node" cx="30" cy="30" r="4"/>'}</g>`;
      g.dataset.kind = kind;
      const turn = () => {
        if (solved) return;
        t.rot = (t.rot + 1) % 4; t.turns++;
        g.querySelector('.spin').style.rotate = t.turns * 90 + 'deg';
        moves++; movesEl.textContent = moves;
        buzz(6);
        update();
      };
      g.addEventListener('click', turn);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(); } });
      svg.appendChild(g);
    });
  };
  const update = () => {
    const lit = connected();
    const leds = tiles.map((_, i) => i).filter(i => svg.children[i]?.dataset.kind === 'led');
    [...svg.children].forEach((g, i) => g.classList.toggle('lit', lit.has(i)));
    const on = leds.filter(i => lit.has(i)).length;
    litEl.textContent = `${on}/${leds.length}`;
    if (lit.size === n * n && !solved) {
      solved = true;
      const key = 'wireup-best-' + n, b = +store.get(key) || 0;
      let rec = '';
      if (!b || moves < b) { store.set(key, moves); bestEl.textContent = moves; rec = '<small>NEW RECORD ★</small>'; }
      buzz([20, 40, 20, 40, 60]);
      svg.classList.remove('win'); void svg.getBoundingClientRect(); svg.classList.add('win');
      setTimeout(() => { msg.innerHTML = `<b>ALL LIT ✓</b><span>${moves} moves</span>${rec}<em>tap “new board” for another</em>`; msg.hidden = false; }, 700);
    }
  };
  wrap.querySelector('.wu-new').addEventListener('click', generate);
  sizeSel.addEventListener('change', generate);
  play.addEventListener('click', () => { dlg.showModal(); if (!tiles.length || solved) generate(); svg.querySelector('.wu-tile')?.focus({preventScroll: true}); });
}

/* ===================== Reflex Breaker: hit the breaker the instant the lamp goes green ===================== */
function reflex(parent){
  const {dlg, wrap, play} = gameShell(parent, {
    fig: 'FIG. 5.3 — ARCADE', title: 'Reflex Breaker', label: 'Reflex Breaker reaction game',
    blurb: 'Wait for the lamp to turn green, then slam the breaker. Five rounds, how fast is your relay?',
    art: `<svg viewBox="0 0 120 60"><g class="rb-art"><rect x="40" y="6" width="40" height="48" rx="5"/><rect class="lever" x="52" y="14" width="16" height="18" rx="3"/>
      <circle class="lamp" cx="98" cy="20" r="8"/><circle cx="22" cy="20" r="8" class="lamp2"/></g></svg>`
  });
  wrap.insertAdjacentHTML('beforeend', `
    <div class="game-hud"><span>ROUND <b class="rb-round">0/5</b></span><span>LAST <b class="rb-last">–</b></span><span>BEST AVG <b class="rb-best">–</b></span></div>
    <button type="button" class="rb-panel" aria-live="polite">
      <span class="rb-lamp" aria-hidden="true"></span>
      <span class="rb-switch" aria-hidden="true"><span class="rb-handle"></span></span>
      <span class="rb-text"><b>TAP TO ARM</b><em>wait for green, then tap fast</em></span>
    </button>
    <ol class="rb-log" aria-label="Round times"></ol>
    <p class="game-help">Tap the panel or press Space. Tapping on red trips the breaker.</p>`);
  const panel = wrap.querySelector('.rb-panel'), text = wrap.querySelector('.rb-text');
  const roundEl = wrap.querySelector('.rb-round'), lastEl = wrap.querySelector('.rb-last'), bestEl = wrap.querySelector('.rb-best'), log = wrap.querySelector('.rb-log');
  let state = 'idle', round = 0, times = [], timer = 0, t0 = 0;
  const b = store.get('reflex-best'); if (b) bestEl.textContent = b + ' ms';
  const set = (s, html) => { state = s; panel.dataset.state = s; text.innerHTML = html; };
  const rating = ms => ms < 200 ? 'RELAY-FAST ⚡' : ms < 260 ? 'SHARP' : ms < 330 ? 'HUMAN' : ms < 450 ? 'WARMING UP' : 'SLEEPY CAPACITOR';
  const arm = () => {
    set('wait', '<b>WAIT…</b><em>lamp is red</em>');
    timer = setTimeout(() => { t0 = performance.now(); set('go', '<b>NOW!</b><em>tap!</em>'); }, 1200 + Math.random() * 2600);
  };
  const press = () => {
    if (state === 'idle' || state === 'done') { round = 0; times = []; log.innerHTML = ''; roundEl.textContent = '0/5'; lastEl.textContent = '–'; arm(); return; }
    if (state === 'wait') {
      clearTimeout(timer); buzz([40, 30, 40]);
      panel.classList.remove('trip'); void panel.offsetWidth; panel.classList.add('trip');
      set('tripped', '<b>TRIPPED!</b><em>too early, tap to retry the round</em>'); return;
    }
    if (state === 'tripped') { arm(); return; }
    if (state === 'go') {
      const ms = Math.round(performance.now() - t0);
      times.push(ms); round++; buzz(15);
      roundEl.textContent = `${round}/5`; lastEl.textContent = ms + ' ms';
      log.insertAdjacentHTML('beforeend', `<li><span>R${round}</span><b>${ms} ms</b><i style="--w:${Math.min(100, ms / 6)}%"></i></li>`);
      if (round >= 5) {
        const avg = Math.round(times.reduce((a, c) => a + c, 0) / times.length);
        const prev = +store.get('reflex-best') || 0;
        const rec = !prev || avg < prev;
        if (rec) { store.set('reflex-best', avg); bestEl.textContent = avg + ' ms'; }
        set('done', `<b>${avg} ms AVG</b><em>${rating(avg)}${rec ? ' · NEW RECORD ★' : ''} · tap to go again</em>`);
      } else set('hit', `<b>${ms} ms</b><em>${rating(ms)} · tap for next round</em>`);
      return;
    }
    if (state === 'hit') arm();
  };
  panel.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
  panel.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) press(); } });
  panel.addEventListener('click', e => e.preventDefault());
  play.addEventListener('click', () => { dlg.showModal(); set('idle', '<b>TAP TO ARM</b><em>wait for green, then tap fast</em>'); panel.focus({preventScroll: true}); });
  dlg.addEventListener('close', () => { clearTimeout(timer); state = 'idle'; });
}

/* ===================== Newton's cradle: drag an end ball and let go ===================== */
function cradle(parent){
  const fig = document.createElement('figure');
  fig.className = 'mech cradle';
  const PX = [92, 120, 148, 176, 204], PY = 22, L = 118, R = 13.6;
  fig.innerHTML = `
    <div class="mech-head"><span class="mono-label">FIG. 4.4 — NEWTON’S CRADLE · PULL A BALL</span><span class="mech-led" aria-hidden="true"></span></div>
    <svg class="cradle-svg" viewBox="0 0 296 190" aria-label="Newton's cradle. Drag an end ball sideways and release." role="img">
      <path class="frame" d="M6 182V14H290V182M-4 182H300"/>
      ${PX.map((x, i) => `<g class="pend" data-i="${i}"><line class="str" x1="${x}" y1="${PY}" x2="${x}" y2="${PY + L}"/><circle class="ball" cx="${x}" cy="${PY + L}" r="${R}"/><circle class="shine" cx="${x - 4}" cy="${PY + L - 5}" r="3.5"/></g>`).join('')}
      <text class="cradle-hint" x="148" y="182">← drag an end ball →</text>
    </svg>
    <div class="mech-foot"><button type="button" class="btn mech-btn">⟲ SWING 1</button><button type="button" class="btn mech-btn" data-k="2">⟲ SWING 2</button><span class="cr-read">ENERGY <b>0%</b></span></div>`;
  parent.appendChild(fig);
  const svg = fig.querySelector('svg'), pends = [...fig.querySelectorAll('.pend')], read = fig.querySelector('.cr-read b'), led = fig.querySelector('.mech-led');
  const hint = fig.querySelector('.cradle-hint');
  const angles = [0, 0, 0, 0, 0];
  let A = 0, k = 1, t = 0, side = -1, running = false, dragging = null, lastSign = 0, last = 0;
  const OMEGA = Math.sqrt(9.81 / 0.32), GAMMA = .12; // a ~0.3 m pendulum, gently damped

  const render = () => {
    pends.forEach((p, i) => {
      const a = angles[i];
      const x = PX[i] + L * Math.sin(a), y = PY + L * Math.cos(a);
      const s = p.children;
      s[0].setAttribute('x2', x.toFixed(1)); s[0].setAttribute('y2', y.toFixed(1));
      s[1].setAttribute('cx', x.toFixed(1)); s[1].setAttribute('cy', y.toFixed(1));
      s[2].setAttribute('cx', (x - 4).toFixed(1)); s[2].setAttribute('cy', (y - 5).toFixed(1));
    });
  };
  const setGroup = theta => {
    angles.fill(0);
    if (theta < 0) for (let i = 0; i < k; i++) angles[i] = theta;
    else for (let i = 5 - k; i < 5; i++) angles[i] = theta;
  };
  const tick = now => {
    const dt = Math.min(40, now - last) / 1000; last = now; t += dt;
    const amp = A * Math.exp(-GAMMA * t);
    const theta = side * amp * Math.cos(OMEGA * t);
    const sign = Math.sign(theta);
    if (sign !== lastSign && lastSign !== 0) { // balls collide at the bottom
      buzz(5);
      fig.classList.remove('clack'); void fig.offsetWidth; fig.classList.add('clack');
    }
    lastSign = sign;
    setGroup(theta);
    render();
    read.textContent = Math.round(Math.pow(amp / .6, 2) * 100) + '%';
    led.classList.toggle('on', amp > .02);
    if (amp > .004 && !dragging) requestAnimationFrame(tick);
    else { running = false; if (!dragging) { angles.fill(0); render(); read.textContent = '0%'; led.classList.remove('on'); } }
  };
  const release = (theta, count) => {
    k = count; A = Math.min(.6, Math.abs(theta)); side = theta < 0 ? -1 : 1; t = 0; lastSign = side;
    if (still()) { angles.fill(0); render(); return; }
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
  };
  const toLocal = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const ball = e.target.closest('.pend');
    if (!ball) return;
    const i = +ball.dataset.i;
    // pulling ball i lifts it and every ball beyond it on that side
    const left = i <= 2;
    dragging = {left, count: left ? i + 1 : 5 - i, idx: i};
    hint.style.opacity = 0;
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    if (!dragging) return;
    const p = toLocal(e), px = PX[dragging.idx];
    let a = Math.atan2(p.x - px, p.y - PY);
    a = dragging.left ? Math.max(-.6, Math.min(0, a)) : Math.min(.6, Math.max(0, a));
    k = dragging.count; setGroup(a); render();
    dragging.a = a;
  });
  const up = () => {
    if (!dragging) return;
    const {a = 0, count} = dragging; dragging = null;
    if (Math.abs(a) > .05) release(a, count); else { angles.fill(0); render(); }
  };
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);
  fig.querySelectorAll('.mech-btn').forEach(b => b.addEventListener('click', () => { hint.style.opacity = 0; release(-.6, +(b.dataset.k || 1)); }));
  render();
}

/* ===================== Geneva drive: continuous rotation in, 90° steps out ===================== */
function geneva(parent){
  const fig = document.createElement('figure');
  fig.className = 'mech geneva';
  const D = [92, 100], G = [162, 100], C = 70, r = C * Math.SQRT1_2, RW = C * Math.SQRT1_2, RHO = 30;
  const slots = [0, 90, 180, 270].map(a => `<rect x="${16}" y="-6.5" width="${RW + 4}" height="13" rx="6.5" transform="rotate(${a})" fill="#000"/>`).join('');
  const cuts = [45, 135, 225, 315].map(a => { const ar = a * Math.PI / 180; return `<circle cx="${(Math.cos(ar) * C).toFixed(1)}" cy="${(Math.sin(ar) * C).toFixed(1)}" r="${RHO + 2}" fill="#000"/>`; }).join('');
  fig.innerHTML = `
    <div class="mech-head"><span class="mono-label">FIG. 4.5 — GENEVA DRIVE · TAP TO CHANGE SPEED</span><span class="mech-led on" aria-hidden="true"></span></div>
    <svg class="gen-svg" viewBox="0 18 250 164" aria-label="Geneva drive mechanism: a continuously turning wheel advances a slotted wheel a quarter turn at a time" role="img">
      <defs>
        <mask id="gen-wheel" maskUnits="userSpaceOnUse" x="-60" y="-60" width="120" height="120"><circle r="${RW}" fill="#fff"/>${slots}${cuts}</mask>
        <mask id="gen-lock" maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100"><circle r="${RHO}" fill="#fff"/><circle cx="${C}" cy="0" r="${RW + 3}" fill="#000"/></mask>
      </defs>
      <g class="gen-driven" transform="translate(${G[0]} ${G[1]})"><g class="gw"><rect x="-60" y="-60" width="120" height="120" class="wheel" mask="url(#gen-wheel)"/>
        <circle r="${RW}" class="wheel-edge" mask="url(#gen-wheel)"/><circle r="6" class="hub"/><path class="mark" d="M0 -10V-22"/></g></g>
      <g class="gen-driver" transform="translate(${D[0]} ${D[1]})"><g class="dw">
        <rect x="-50" y="-50" width="100" height="100" class="lock" mask="url(#gen-lock)"/>
        <rect class="arm" x="-6" y="-7" width="${r + 6}" height="14" rx="7"/><circle class="pin" cx="${r.toFixed(1)}" cy="0" r="5.5"/><circle r="6" class="hub"/></g></g>
    </svg>
    <div class="mech-foot"><span class="gen-read">INPUT <b class="gi">0</b>° · OUTPUT STEP <b class="go">0</b> · <b class="gs">DWELL</b></span><span class="gen-speed">1×</span></div>`;
  parent.appendChild(fig);
  const dw = fig.querySelector('.dw'), gw = fig.querySelector('.gw');
  const gi = fig.querySelector('.gi'), go = fig.querySelector('.go'), gs = fig.querySelector('.gs'), sp = fig.querySelector('.gen-speed');
  const SPEEDS = [1, 2.5, .4];
  let Th = -Math.PI / 2, si = 0, running = false, visible = false, last = 0, lastTxt = 0;
  const place = () => {
    const rev = Math.floor((Th + Math.PI) / (Math.PI * 2));
    const a = Th - rev * Math.PI * 2; // -π..π, 0 = pin pointing at the slotted wheel
    let beta, moving = false;
    if (Math.abs(a) < Math.PI / 4) { beta = -Math.atan2(r * Math.sin(a), C - r * Math.cos(a)); moving = true; }
    else beta = a > 0 ? -Math.PI / 4 : Math.PI / 4;
    const total = beta - rev * Math.PI / 2;
    dw.setAttribute('transform', `rotate(${(Th * 180 / Math.PI).toFixed(2)})`);
    gw.setAttribute('transform', `rotate(${(total * 180 / Math.PI).toFixed(2)})`);
    return {rev, a, moving, total};
  };
  const tick = now => {
    const dt = Math.min(50, now - last) / 1000; last = now;
    Th += dt * 1.3 * SPEEDS[si];
    const s = place();
    if (now - lastTxt > 100) {
      lastTxt = now;
      gi.textContent = Math.round(((Th * 180 / Math.PI) % 360 + 360) % 360);
      go.textContent = (((Math.round(-s.total / (Math.PI / 2) - .5) % 4) + 4) % 4) + 1;
      gs.textContent = s.moving ? 'INDEXING' : 'DWELL';
      fig.classList.toggle('indexing', s.moving);
    }
    if (visible && !document.hidden && !still()) requestAnimationFrame(tick); else running = false;
  };
  const start = () => { if (running || still()) return; running = true; last = performance.now(); requestAnimationFrame(tick); };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(fig);
  fig.querySelector('svg').addEventListener('click', () => { si = (si + 1) % SPEEDS.length; sp.textContent = SPEEDS[si] + '×'; buzz(8); start(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });
  place();
}
