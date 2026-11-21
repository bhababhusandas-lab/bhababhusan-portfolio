// Lab Notebook · v23 (main site): two more arcade games (Logic Gates, Colour Code Rush), a Workbench of
// engineering tools (Ohm's law, resistor decoder, gear ratio), and animations (corner screws, CRT power-on, marquee lights)
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();
const buzz = p => { try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
};
const fmtOhm = v => v >= 1e6 ? +(v / 1e6).toPrecision(3) + ' MΩ' : v >= 1e3 ? +(v / 1e3).toPrecision(3) + ' kΩ' : +v.toPrecision(3) + ' Ω';
const BANDS = [
  {n: 'black', c: '#1d2321'}, {n: 'brown', c: '#8b5a2b'}, {n: 'red', c: '#e03131'}, {n: 'orange', c: '#f76707'}, {n: 'yellow', c: '#fcc419'},
  {n: 'green', c: '#2f9e44'}, {n: 'blue', c: '#1c7ed6'}, {n: 'violet', c: '#7048e8'}, {n: 'grey', c: '#868e96'}, {n: 'white', c: '#f8f9fa'}
];
const MULT = [...BANDS.slice(0, 7).map((b, i) => ({...b, m: 10 ** i})), {n: 'gold', c: '#c9a227', m: .1}];
const TOL = [{n: 'gold', c: '#c9a227', t: '±5%'}, {n: 'silver', c: '#adb5bd', t: '±10%'}, {n: 'brown', c: '#8b5a2b', t: '±1%'}, {n: 'red', c: '#e03131', t: '±2%'}];
const resistorSVG = (cls = '') => `<svg class="resistor ${cls}" viewBox="0 0 240 70" aria-hidden="true">
  <path class="lead" d="M0 35H40M200 35H240"/><path class="body" d="M40 35c0-16 8-20 20-20h14c6 0 8 4 14 4h64c6 0 8-4 14-4h14c12 0 20 4 20 20s-8 20-20 20h-14c-6 0-8-4-14-4H88c-6 0-8 4-14 4H60c-12 0-20-4-20-20z"/>
  <rect class="band" data-b="0" x="62" y="15" width="10" height="40"/><rect class="band" data-b="1" x="96" y="19" width="10" height="32"/>
  <rect class="band" data-b="2" x="122" y="19" width="10" height="32"/><rect class="band" data-b="3" x="170" y="15" width="10" height="40"/></svg>`;

/* ===================== shared game shell ===================== */
function gameShell(parent, {fig, title, blurb, art, label}){
  const card = document.createElement('div');
  card.className = 'arcade';
  card.innerHTML = `<div class="arcade-art" aria-hidden="true">${art}</div>
    <div class="arcade-txt"><span class="mono-label">${fig}</span><h3>${title}</h3><p>${blurb}</p></div>
    <button type="button" class="btn arcade-play">▶ PLAY</button>`;
  card.style.order = 10 + parent.children.length; // always after the older games, whatever order the modules load in
  parent.appendChild(card);
  const dlg = document.createElement('dialog');
  dlg.className = 'unfold game';
  dlg.setAttribute('aria-label', label);
  dlg.innerHTML = `<button class="close" aria-label="Close game">×</button><div class="game-wrap"><p class="mono-label">${fig} · ${title.toUpperCase()}</p></div>`;
  document.body.appendChild(dlg);
  dlg.querySelector('.close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', e => { if (e.key !== 'Escape' && e.key !== 'Tab') e.stopPropagation(); });
  return {card, dlg, wrap: dlg.querySelector('.game-wrap'), play: card.querySelector('.arcade-play')};
}

const shelf = $('#arcade .arcade-shelf');
if (shelf) { logicGates(shelf); colourRush(shelf); }
const tools = $('#workbench .tools');
if (tools) { ohmTool(tools); resistorTool(tools); gearTool(tools); }
screws();
crtPowerOn();

/* ===================== Logic Gates: flip the inputs until the output lamp lights ===================== */
function logicGates(parent){
  const {dlg, wrap, play} = gameShell(parent, {
    fig: 'FIG. 5.4 — ARCADE', title: 'Logic Gates', label: 'Logic Gates puzzle',
    blurb: 'Flip the input switches so the signal makes it through the gates and lights the output.',
    art: `<svg viewBox="0 0 120 60"><g class="lg-art"><path class="w" d="M8 18H40M8 42H40M74 30H100"/><path class="g" d="M40 10h16a20 20 0 0 1 0 40H40z"/><circle class="o" cx="106" cy="30" r="7"/>
      <rect class="s1" x="2" y="13" width="10" height="10" rx="2"/><rect class="s2" x="2" y="37" width="10" height="10" rx="2"/></g></svg>`
  });
  wrap.insertAdjacentHTML('beforeend', `
    <div class="game-hud"><span>LEVEL <b class="lg-lvl">1</b></span><span>FLIPS <b class="lg-flips">0</b></span><span>BEST <b class="lg-best">–</b></span></div>
    <div class="lg-board"><svg class="lg-svg" viewBox="0 0 330 220"></svg><div class="game-msg" hidden></div></div>
    <div class="wu-actions"><button type="button" class="btn lg-next" disabled>NEXT LEVEL →</button><button type="button" class="btn lg-skip">↻ NEW CIRCUIT</button></div>
    <p class="game-help">Tap the switches on the left. AND, OR, XOR, NAND and NOR gates.</p>`);
  const svg = wrap.querySelector('.lg-svg'), msg = wrap.querySelector('.game-msg'), next = wrap.querySelector('.lg-next');
  const lvlEl = wrap.querySelector('.lg-lvl'), flipsEl = wrap.querySelector('.lg-flips'), bestEl = wrap.querySelector('.lg-best');
  const OPS = {AND: (a, b) => a & b, OR: (a, b) => a | b, XOR: (a, b) => a ^ b, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b)};
  const NAMES = Object.keys(OPS);
  let level = 1, inputs = [], gates = [], flips = 0, done = false;
  bestEl.textContent = store.get('logic-best') || '–';
  const pick = () => NAMES[(Math.random() * NAMES.length) | 0];
  // gate sources: 'i0'.. inputs, 'g0'.. gates
  const layouts = {
    2: [{a: 'i0', b: 'i1', x: 160, y: 110}],
    3: [{a: 'i0', b: 'i1', x: 130, y: 80}, {a: 'g0', b: 'i2', x: 225, y: 125}],
    4: [{a: 'i0', b: 'i1', x: 130, y: 62}, {a: 'i2', b: 'i3', x: 130, y: 158}, {a: 'g0', b: 'g1', x: 225, y: 110}]
  };
  const inY = k => k === 2 ? [80, 140] : k === 3 ? [50, 110, 170] : [35, 89, 131, 185];
  const evaluate = () => {
    const val = {};
    inputs.forEach((v, i) => { val['i' + i] = v; });
    gates.forEach((g, i) => { val['g' + i] = OPS[g.op](val[g.a], val[g.b]); });
    return val;
  };
  const outKey = () => 'g' + (gates.length - 1);
  const generate = () => {
    const k = level <= 2 ? 2 : level <= 5 ? 3 : 4;
    for (let tries = 0; tries < 200; tries++) {
      gates = layouts[k].map(l => ({...l, op: pick()}));
      inputs = Array.from({length: k}, () => (Math.random() * 2) | 0);
      // must be solvable, and not already solved
      let solvable = false;
      for (let m = 0; m < (1 << k); m++) {
        const save = inputs; inputs = Array.from({length: k}, (_, i) => (m >> i) & 1);
        if (evaluate()[outKey()]) solvable = true;
        inputs = save;
      }
      if (solvable && !evaluate()[outKey()]) break;
    }
    flips = 0; done = false; flipsEl.textContent = 0; lvlEl.textContent = level; msg.hidden = true; next.disabled = true;
    draw();
  };
  const port = (src, ys) => src[0] === 'i' ? {x: 52, y: ys[+src.slice(1)]} : {x: gates[+src.slice(1)].x + 30, y: gates[+src.slice(1)].y};
  const draw = () => {
    const val = evaluate(), ys = inY(inputs.length);
    let html = '';
    gates.forEach((g, gi) => {
      [['a', -10], ['b', 10]].forEach(([s, dy]) => {
        const p = port(g[s], ys), tx = g.x - 26, ty = g.y + dy, mx = (p.x + tx) / 2;
        html += `<path class="wire${val[g[s]] ? ' on' : ''}" d="M${p.x} ${p.y}H${mx}V${ty}H${tx}"/>`;
      });
    });
    const o = gates[gates.length - 1], lit = val[outKey()];
    html += `<path class="wire${lit ? ' on' : ''}" d="M${o.x + 30} ${o.y}H292"/>`;
    gates.forEach((g, gi) => {
      html += `<g class="gate${val['g' + gi] ? ' on' : ''}" transform="translate(${g.x} ${g.y})"><rect x="-26" y="-20" width="56" height="40" rx="6"/><text y="4">${g.op}</text></g>`;
    });
    inputs.forEach((v, i) => {
      html += `<g class="sw${v ? ' on' : ''}" data-i="${i}" transform="translate(28 ${ys[i]})" tabindex="0" role="switch" aria-checked="${!!v}" aria-label="Input ${'ABCD'[i]}">
        <rect class="hit" x="-26" y="-18" width="60" height="36"/><rect class="track" x="-20" y="-11" width="40" height="22" rx="11"/><circle class="knob" cx="${v ? 9 : -9}" cy="0" r="8"/>
        <text class="lbl" x="-24" y="-14">${'ABCD'[i]}</text><text class="bit" x="30" y="4">${v}</text></g>`;
    });
    html += `<g class="out${lit ? ' on' : ''}" transform="translate(306 ${o.y})"><circle class="halo" r="22"/><circle class="bulb" r="13"/><text y="34">OUT</text></g>`;
    svg.innerHTML = html;
    svg.querySelectorAll('.sw').forEach(s => {
      const flip = () => {
        if (done) return;
        inputs[+s.dataset.i] ^= 1; flips++; flipsEl.textContent = flips; buzz(6);
        draw(); check();
        svg.querySelector(`.sw[data-i="${s.dataset.i}"]`)?.focus({preventScroll: true});
      };
      s.addEventListener('click', flip);
      s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    });
  };
  const check = () => {
    if (!evaluate()[outKey()]) return;
    done = true; next.disabled = false; buzz([20, 30, 40]);
    const best = +store.get('logic-best') || 0;
    if (level > best) { store.set('logic-best', level); bestEl.textContent = level; }
    const solvedLevel = level;
    setTimeout(() => { if (!done || level !== solvedLevel) return; msg.innerHTML = `<b>OUTPUT HIGH ✓</b><span>level ${level} in ${flips} flip${flips === 1 ? '' : 's'}</span><em>on to the next circuit</em>`; msg.hidden = false; }, 500);
  };
  next.addEventListener('click', () => { level++; generate(); });
  wrap.querySelector('.lg-skip').addEventListener('click', generate);
  play.addEventListener('click', () => { dlg.showModal(); if (!gates.length || done) { if (done) level++; generate(); } svg.querySelector('.sw')?.focus({preventScroll: true}); });
}

/* ===================== Colour Code Rush: name the resistor before time runs out ===================== */
function colourRush(parent){
  const {dlg, wrap, play} = gameShell(parent, {
    fig: 'FIG. 5.5 — ARCADE', title: 'Colour Code Rush', label: 'Colour Code Rush quiz',
    blurb: 'Read the resistor’s colour bands and pick its value. 30 seconds on the clock.',
    art: resistorSVG('art')
  });
  wrap.insertAdjacentHTML('beforeend', `
    <div class="game-hud"><span>SCORE <b class="cr-score">0</b></span><span>TIME <b class="cr-time">30</b>s</span><span>BEST <b class="cr-best">–</b></span></div>
    <div class="cr-timer"><i></i></div>
    <div class="cr-stage">${resistorSVG('big')}<div class="game-msg"></div></div>
    <div class="cr-answers"></div>
    <p class="game-help">Band 1 and 2 are digits, band 3 is the multiplier. Wrong answers cost 3 seconds.</p>`);
  const stage = wrap.querySelector('.cr-stage'), msg = stage.querySelector('.game-msg'), answers = wrap.querySelector('.cr-answers');
  const bands = [...stage.querySelectorAll('.band')], bar = wrap.querySelector('.cr-timer i');
  const scoreEl = wrap.querySelector('.cr-score'), timeEl = wrap.querySelector('.cr-time'), bestEl = wrap.querySelector('.cr-best');
  let score = 0, left = 30, timer = 0, playing = false, value = 0, lastT = 0;
  bestEl.textContent = store.get('colour-best') || '–';
  const valueOf = (d1, d2, m) => (d1 * 10 + d2) * MULT[m].m;
  const question = () => {
    const d1 = 1 + ((Math.random() * 9) | 0), d2 = (Math.random() * 10) | 0, m = (Math.random() * 7) | 0, t = (Math.random() * 2) | 0;
    value = valueOf(d1, d2, m);
    [BANDS[d1], BANDS[d2], MULT[m], TOL[t]].forEach((b, i) => { bands[i].style.fill = b.c; bands[i].dataset.n = b.n; });
    stage.querySelector('svg').classList.remove('pop'); void stage.offsetWidth; stage.querySelector('svg').classList.add('pop');
    const opts = new Set([value]);
    const alts = [valueOf(d2 || 1, d1, m), valueOf(d1, d2, Math.min(7, m + 1)), valueOf(d1, d2, Math.max(0, m - 1)), valueOf(d1, (d2 + 1) % 10, m), valueOf(Math.max(1, (d1 + 1) % 10), d2, m)];
    for (const a of alts.sort(() => Math.random() - .5)) { if (opts.size >= 4) break; opts.add(a); }
    while (opts.size < 4) opts.add(valueOf(1 + ((Math.random() * 9) | 0), (Math.random() * 10) | 0, m));
    answers.innerHTML = [...opts].sort(() => Math.random() - .5).map(v => `<button type="button" class="cr-opt" data-v="${v}">${fmtOhm(v)}</button>`).join('');
  };
  const tick = now => {
    if (!playing) return;
    left -= (now - lastT) / 1000; lastT = now;
    if (left <= 0) return finish();
    timeEl.textContent = Math.ceil(left);
    bar.style.width = (left / 30 * 100) + '%';
    bar.classList.toggle('low', left < 8);
    timer = requestAnimationFrame(tick);
  };
  const start = () => {
    score = 0; left = 30; playing = true; scoreEl.textContent = 0; msg.hidden = true;
    question(); lastT = performance.now(); timer = requestAnimationFrame(tick);
  };
  const finish = () => {
    playing = false; cancelAnimationFrame(timer); left = 0; timeEl.textContent = 0; bar.style.width = '0%';
    const best = +store.get('colour-best') || 0;
    let rec = '';
    if (score > best) { store.set('colour-best', score); bestEl.textContent = score; rec = '<small>NEW RECORD ★</small>'; }
    answers.innerHTML = '<button type="button" class="btn cr-again">↻ PLAY AGAIN</button>';
    msg.innerHTML = `<b>TIME! ${score}</b><span>resistor${score === 1 ? '' : 's'} identified</span>${rec}`; msg.hidden = false;
  };
  answers.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('cr-again') || b.classList.contains('cr-go')) { start(); return; }
    if (!playing) return;
    if (+b.dataset.v === value) {
      score++; scoreEl.textContent = score; b.classList.add('right'); buzz(10);
      setTimeout(question, 220);
    } else {
      left = Math.max(0, left - 3); b.classList.add('wrong'); buzz([30, 20, 30]);
      answers.querySelector(`[data-v="${value}"]`)?.classList.add('right');
      setTimeout(question, 650);
    }
    answers.querySelectorAll('button').forEach(x => { x.disabled = true; });
  });
  play.addEventListener('click', () => {
    dlg.showModal();
    if (!playing) {
      msg.innerHTML = '<b>COLOUR CODE RUSH</b><span>black 0 · brown 1 · red 2 · orange 3 · yellow 4<br>green 5 · blue 6 · violet 7 · grey 8 · white 9</span>'; msg.hidden = false;
      answers.innerHTML = '<button type="button" class="btn cr-go">▶ START</button>';
      answers.querySelector('button').focus({preventScroll: true});
    }
  });
  dlg.addEventListener('close', () => { if (playing) { playing = false; cancelAnimationFrame(timer); } });
}

/* ===================== Workbench tools ===================== */
function toolCard(parent, fig, title, body){
  const el = document.createElement('figure');
  el.className = 'tool';
  el.innerHTML = `<div class="tool-head"><span class="mono-label">${fig}</span><span class="tool-led" aria-hidden="true"></span></div><div class="tool-body"><h3>${title}</h3>${body}</div>`;
  parent.appendChild(el);
  return el;
}

function ohmTool(parent){
  const el = toolCard(parent, 'FIG. 6.1 — OHM’S LAW', 'V = I × R', `
    <div class="ohm-tri" aria-hidden="true"><svg viewBox="0 0 120 100"><path d="M60 6 114 94H6z"/><path d="M24 58H96M60 58V94"/>
      <text class="tv" x="60" y="46">V</text><text class="ti" x="40" y="84">I</text><text class="tr" x="80" y="84">R</text></svg></div>
    <div class="seg" role="radiogroup" aria-label="Solve for">
      <button type="button" role="radio" data-s="V">Solve V</button><button type="button" role="radio" data-s="I">Solve I</button><button type="button" role="radio" data-s="R" aria-checked="true">Solve R</button></div>
    <div class="ohm-fields">
      <label data-f="V">Voltage<span><input type="number" inputmode="decimal" step="any" value="9"> V</span></label>
      <label data-f="I">Current<span><input type="number" inputmode="decimal" step="any" value="0.02"> A</span></label>
      <label data-f="R">Resistance<span><input type="number" inputmode="decimal" step="any" value="450"> Ω</span></label>
    </div>
    <p class="tool-out"><span class="ohm-ans">R = 450 Ω</span><small class="ohm-p">P = 0.18 W</small></p>`);
  let solve = 'R';
  const inp = f => el.querySelector(`[data-f="${f}"] input`);
  const fmt = (v, u) => !isFinite(v) ? '—' : (Math.abs(v) >= 1000 ? +(v / 1000).toPrecision(4) + ' k' : Math.abs(v) < .01 && v !== 0 ? +(v * 1000).toPrecision(4) + ' m' : +v.toPrecision(4) + ' ') + u;
  const calc = () => {
    const V = +inp('V').value, I = +inp('I').value, R = +inp('R').value;
    let out = 0;
    if (solve === 'V') out = I * R; else if (solve === 'I') out = V / R; else out = V / I;
    const vals = {V: solve === 'V' ? out : V, I: solve === 'I' ? out : I, R: solve === 'R' ? out : R};
    inp(solve).value = isFinite(out) ? +out.toPrecision(5) : '';
    el.querySelector('.ohm-ans').textContent = `${solve} = ${fmt(out, {V: 'V', I: 'A', R: 'Ω'}[solve])}`;
    el.querySelector('.ohm-p').textContent = 'P = ' + fmt(vals.V * vals.I, 'W');
    el.classList.remove('tool-flash'); void el.offsetWidth; el.classList.add('tool-flash');
  };
  const setSolve = s => {
    solve = s;
    el.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.s === s)));
    el.querySelectorAll('.ohm-fields label').forEach(l => { const on = l.dataset.f === s; l.classList.toggle('solved', on); l.querySelector('input').readOnly = on; });
    el.querySelector('.ohm-tri').dataset.s = s;
    calc();
  };
  el.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => setSolve(b.dataset.s)));
  el.querySelectorAll('input').forEach(i => i.addEventListener('input', calc));
  setSolve('R');
}

function resistorTool(parent){
  const opt = (list, sel) => list.map((b, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${b.n}</option>`).join('');
  const el = toolCard(parent, 'FIG. 6.2 — RESISTOR DECODER', 'Colour bands → Ω', `
    ${resistorSVG('tool-res')}
    <div class="res-selects">
      <label>Band 1<select data-k="0">${opt(BANDS.slice(1), 3)}</select></label>
      <label>Band 2<select data-k="1">${opt(BANDS, 7)}</select></label>
      <label>Multiplier<select data-k="2">${opt(MULT, 2)}</select></label>
      <label>Tolerance<select data-k="3">${opt(TOL, 0)}</select></label>
    </div>
    <p class="tool-out"><span class="res-ans">4.7 kΩ</span><small class="res-range">±5% · 4.47 kΩ – 4.94 kΩ</small></p>
    <p class="tool-tip">Tip: tap a band on the drawing to cycle its colour.</p>`);
  const sels = [...el.querySelectorAll('select')], bands = [...el.querySelectorAll('.band')];
  const lists = [BANDS.slice(1), BANDS, MULT, TOL];
  const calc = () => {
    const [a, b, m, t] = sels.map(s => +s.value);
    const v = ((a + 1) * 10 + b) * MULT[m].m, tol = parseFloat(TOL[t].t.slice(1)) / 100;
    [lists[0][a], lists[1][b], lists[2][m], lists[3][t]].forEach((x, i) => { bands[i].style.fill = x.c; });
    el.querySelector('.res-ans').textContent = fmtOhm(v);
    el.querySelector('.res-range').textContent = `${TOL[t].t} · ${fmtOhm(v * (1 - tol))} – ${fmtOhm(v * (1 + tol))}`;
    el.classList.remove('tool-flash'); void el.offsetWidth; el.classList.add('tool-flash');
  };
  sels.forEach(s => s.addEventListener('change', calc));
  bands.forEach((b, i) => {
    b.style.cursor = 'pointer';
    b.addEventListener('click', () => { sels[i].value = (+sels[i].value + 1) % lists[i].length; calc(); buzz(6); });
  });
  el.querySelector('svg').removeAttribute('aria-hidden');
  calc();
}

function gearPath(teeth, r, depth){
  let d = '';
  const step = Math.PI * 2 / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    [[a - step * .25, r - depth], [a - step * .12, r], [a + step * .12, r], [a + step * .25, r - depth]].forEach(([ang, rad], j) => {
      d += (i === 0 && j === 0 ? 'M' : 'L') + (Math.cos(ang) * rad).toFixed(2) + ' ' + (Math.sin(ang) * rad).toFixed(2);
    });
  }
  return d + 'Z';
}

function gearTool(parent){
  const el = toolCard(parent, 'FIG. 6.3 — GEAR RATIO', 'Size a gear pair', `
    <svg class="gt-svg" viewBox="0 0 300 160" aria-label="Animated gear pair" role="img"><g class="g1"><path/><circle r="5"/><path class="mk" d="M0 0V-12"/></g><g class="g2"><path/><circle r="5"/><path class="mk" d="M0 0V-12"/></g></svg>
    <div class="gt-fields">
      <label>Driver teeth<span><input type="range" min="8" max="40" value="12" data-k="z1"><b>12</b></span></label>
      <label>Driven teeth<span><input type="range" min="8" max="60" value="30" data-k="z2"><b>30</b></span></label>
      <label>Input speed<span><input type="range" min="10" max="300" step="10" value="60" data-k="rpm"><b>60</b> rpm</span></label>
    </div>
    <p class="tool-out"><span class="gt-ans">2.5 : 1</span><small class="gt-sub">output 24 rpm · torque ×2.5 · speed reducer</small></p>`);
  const svg = el.querySelector('svg'), g1 = el.querySelector('.g1'), g2 = el.querySelector('.g2');
  const ins = Object.fromEntries([...el.querySelectorAll('input')].map(i => [i.dataset.k, i]));
  let z1 = 12, z2 = 30, rpm = 60, mod = 3, c1 = [0, 0], c2 = [0, 0], th = 0, running = false, visible = false, last = 0;
  const layout = () => {
    z1 = +ins.z1.value; z2 = +ins.z2.value; rpm = +ins.rpm.value;
    el.querySelectorAll('.gt-fields b').forEach((b, i) => { b.textContent = [z1, z2, rpm][i]; });
    // pick a module so the pair fits in the 300×160 box
    mod = Math.min(270 / (z1 + z2 + 4), 150 / (z2 + 2.5));
    const r1 = mod * z1 / 2, r2 = mod * z2 / 2, total = r1 + r2;
    const W = (r1 + mod) + total + (r2 + mod); // centre the pair in the box
    c1 = [(300 - W) / 2 + r1 + mod, 80]; c2 = [c1[0] + total, 80];
    g1.querySelector('path').setAttribute('d', gearPath(z1, r1 + mod, mod * 2.2));
    g2.querySelector('path').setAttribute('d', gearPath(z2, r2 + mod, mod * 2.2));
    const ratio = z2 / z1, out = rpm / ratio;
    el.querySelector('.gt-ans').textContent = `${+ratio.toFixed(2)} : 1`;
    el.querySelector('.gt-sub').textContent = `output ${+out.toFixed(1)} rpm · torque ×${+ratio.toFixed(2)} · ${ratio > 1.01 ? 'speed reducer' : ratio < .99 ? 'speed increaser' : 'same speed'}`;
    place();
  };
  const place = () => {
    const a1 = th, a2 = -th * z1 / z2 + Math.PI + Math.PI / z2; // driven gear turns the other way, teeth interleaved
    g1.setAttribute('transform', `translate(${c1[0].toFixed(1)} ${c1[1]}) rotate(${(a1 * 180 / Math.PI).toFixed(2)})`);
    g2.setAttribute('transform', `translate(${c2[0].toFixed(1)} ${c2[1]}) rotate(${(a2 * 180 / Math.PI).toFixed(2)})`);
  };
  const tick = now => {
    const dt = Math.min(50, now - last) / 1000; last = now;
    th += dt * rpm / 60 * Math.PI * 2 * .25; // shown at quarter speed so the teeth stay readable
    place();
    if (visible && !document.hidden && !still()) requestAnimationFrame(tick); else running = false;
  };
  const start = () => { if (running || still()) return; running = true; last = performance.now(); requestAnimationFrame(tick); };
  Object.values(ins).forEach(i => i.addEventListener('input', () => { layout(); start(); }));
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(svg);
  layout();
}

/* ===================== animations ===================== */
/* corner screws on the cards: they turn when you hover (or once when the card scrolls into view on touch) */
function screws(){
  const targets = [...$$('#arcade .arcade'), ...$$('.tool')];
  const add = el => {
    if (el.querySelector(':scope > .screw')) return;
    ['tl', 'tr', 'bl', 'br'].forEach(p => {
      const s = document.createElement('span');
      s.className = 'screw ' + p;
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--r', (Math.random() * 180 | 0) + 'deg');
      el.appendChild(s);
    });
  };
  targets.forEach(add);
  // the games from v21/v22 can land on the shelf after this runs
  const shelfEl = $('#arcade .arcade-shelf');
  if (shelfEl) new MutationObserver(() => $$('#arcade .arcade').forEach(add)).observe(shelfEl, {childList: true});
  if (matchMedia('(pointer: coarse)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting || still()) return;
      io.unobserve(e.target);
      e.target.classList.add('screwed');
    }), {threshold: .6});
    const watch = () => [...$$('#arcade .arcade'), ...$$('.tool')].forEach(el => io.observe(el));
    watch();
    if (shelfEl) new MutationObserver(watch).observe(shelfEl, {childList: true});
  }
}

/* workbench panels switch on like an old CRT when they scroll into view */
function crtPowerOn(){
  const panels = $$('.tool');
  if (!panels.length || !('IntersectionObserver' in window)) return;
  if (still()) return;
  panels.forEach(p => p.classList.add('crt-off'));
  const on = (el, delay) => {
    if (!el.classList.contains('crt-off') || el.dataset.crt) return;
    el.dataset.crt = '1';
    setTimeout(() => {
      el.classList.remove('crt-off'); el.classList.add('crt-on');
      setTimeout(() => el.classList.remove('crt-on'), 800); // hand the background back to the panel
    }, delay);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    on(e.target, (panels.indexOf(e.target) % 3) * 160);
  }), {threshold: .25});
  panels.forEach(p => io.observe(p));
  // backup in case the observer is slow: power on anything that is clearly on screen
  const pos = new Map();
  const measure = () => panels.forEach(p => { const r = p.getBoundingClientRect(); pos.set(p, [r.top + scrollY, r.height]); });
  measure();
  new ResizeObserver(measure).observe(document.body); // cached, so the check below never forces a layout
  const sweep = () => {
    let left = 0;
    panels.forEach(p => {
      if (!p.classList.contains('crt-off')) return;
      left++;
      const [top, h] = pos.get(p) || [0, 0], t = top - scrollY;
      if (t < innerHeight * .8 && t + h > innerHeight * .2) on(p, 0);
    });
    if (!left) removeEventListener('scroll', onScroll);
  };
  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; sweep(); }); } };
  addEventListener('scroll', onScroll, {passive: true});
}
