import {projects} from './projects.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'calm';
const SVG = 'http://www.w3.org/2000/svg';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ───────── theme: power switch ───────── */
const power = $('#power');
function setTheme(dark, save){
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  power.setAttribute('aria-checked', String(dark));
  document.querySelector('meta[name=theme-color]').content = dark ? '#0e2350' : '#f3efe4';
  if (save) { try { localStorage.setItem('portfolio-theme', dark ? 'dark' : 'light'); } catch (e) {} }
}
setTheme(document.documentElement.dataset.theme === 'dark', false);
power.addEventListener('click', () => {
  const dark = power.getAttribute('aria-checked') !== 'true';
  const go = () => setTheme(dark, true);
  if (document.startViewTransition && !reduce) {
    const r = power.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(go);
    t.ready.then(() => document.documentElement.animate(
      {clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`]},
      {duration: 750, easing: 'cubic-bezier(.7,0,.25,1)', pseudoElement: '::view-transition-new(root)'}
    )).catch(() => {});
  } else go();
  dispatchEvent(new Event('power-flip'));
});

/* ───────── motion switch: full / calm ───────── */
const motionBtn = $('#motion');
function paintMotion(){
  const calm = document.documentElement.dataset.motion === 'calm';
  motionBtn.setAttribute('aria-checked', String(!calm));
  motionBtn.setAttribute('aria-label', calm ? 'Animations calm (switch to full motion)' : 'Animations on (switch to calm mode)');
  motionBtn.querySelector('b').textContent = calm ? 'CALM' : 'FULL';
}
paintMotion();
motionBtn.addEventListener('click', () => {
  const toCalm = document.documentElement.dataset.motion !== 'calm';
  try { localStorage.setItem('portfolio-motion', toCalm ? 'calm' : 'full'); } catch (e) {}
  if (toCalm) {
    // calm applies instantly through CSS; JS effects check the flag as they run
    document.documentElement.dataset.motion = 'calm';
    paintMotion();
  } else {
    // effects that were never started need a fresh load to come back
    location.reload();
  }
});

/* ───────── experiments ───────── */
const grid = $('#exp-grid');
projects.forEach((p, i) => {
  const [num, kind] = p.tag.split(' / ');
  const b = document.createElement('button');
  b.className = 'exp reveal';
  b.type = 'button';
  b.setAttribute('aria-label', `Open spec sheet: ${p.title}`);
  b.innerHTML = `
    <span class="exp-top"><span><b>EXP-${esc(num)}</b> · ${esc(kind)}</span><span class="led" aria-hidden="true"></span></span>
    <span class="exp-body">
      <span class="exp-symbol" aria-hidden="true">${esc(p.symbol)}</span>
      <span><h3>${esc(p.title)}</h3><span class="exp-hyp"><b>HYPOTHESIS</b>${esc(p.summary)}</span></span>
    </span>
    <span class="exp-parts">${p.stack.slice(0, 5).map(s => `<span>${esc(s)}</span>`).join('')}${p.stack.length > 5 ? `<span>+${p.stack.length - 5}</span>` : ''}</span>
    <span class="exp-foot"><span>STATUS: BUILT ✓</span><span>OPEN SPEC SHEET ↗</span></span>`;
  b.addEventListener('click', () => openProject(i, b));
  grid.appendChild(b);
});

/* ───────── dialogs ───────── */
let returnFocus = null;
function openDialog(d, from){ returnFocus = from || document.activeElement; d.showModal(); }
$$('dialog').forEach(d => {
  d.querySelector('.close').addEventListener('click', () => d.close());
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  d.addEventListener('close', () => returnFocus && returnFocus.focus());
});
function openProject(i, from){
  const p = projects[i];
  const [num, kind] = p.tag.split(' / ');
  $('#dialog-tag').textContent = `EXP-${num} · ${kind} · SPEC SHEET`;
  $('#project-title').textContent = p.title;
  $('#dialog-summary').textContent = p.summary;
  $('#dialog-description').textContent = p.description;
  $('#dialog-points').innerHTML = p.points.map(x => `<li>${esc(x)}</li>`).join('');
  $('#dialog-stack').innerHTML = p.stack.map((s, k) => `<tr><td>P${String(k + 1).padStart(2, '0')}</td><td>${esc(s)}</td></tr>`).join('');
  openDialog($('#project-dialog'), from);
}
$('#read-story').addEventListener('click', e => openDialog($('#story-dialog'), e.currentTarget));

/* ───────── reveal + handwriting ───────── */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
}, {threshold: .15, rootMargin: '0px 0px -8% 0px'});
$$('.reveal, .note, .flow').forEach(el => io.observe(el));

/* ───────── circuit ───────── */
const main = $('#main');
const svg = $('#circuit');
const base = svg.querySelector('.trace-base');
const live = svg.querySelector('.trace-live');
const flow = svg.querySelector('.trace-flow');
const halo = svg.querySelector('.trace-halo');
const nodeLayer = svg.querySelector('.trace-nodes');
const spark = svg.querySelector('.spark');
const output = $('#output');
let total = 0, samples = [], nodes = [], ticking = false, mainH = 0;

// The lit part of the circuit lives in its own layer and is revealed by a clipping window that grows with
// scrolling. Moving a clip is cheap; re-dashing a page-tall path every scroll step forced a full repaint.
const clip = document.createElement('div');
clip.className = 'circuit-clip';
clip.setAttribute('aria-hidden', 'true');
const litSvg = document.createElementNS(SVG, 'svg');
litSvg.setAttribute('class', 'circuit-lit');
litSvg.append(halo, live, flow);
clip.appendChild(litSvg);
svg.after(clip);

function build(){
  const x = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rail-x')) || 30;
  const mTop = main.getBoundingClientRect().top + scrollY;
  const height = main.offsetHeight;
  svg.setAttribute('viewBox', `0 0 ${svg.clientWidth} ${height}`);
  svg.style.height = height + 'px';
  litSvg.setAttribute('viewBox', `0 0 ${svg.clientWidth} ${height}`);
  litSvg.style.height = height + 'px';
  mainH = height;

  const labels = $$('[data-node]');
  const ys = labels.map(l => l.getBoundingClientRect().top + scrollY - mTop + l.offsetHeight / 2);

  // vertical trace with a small resistor zig-zag between each pair of nodes
  let d = `M${x} 0`;
  ys.forEach((y, i) => {
    if (i > 0) {
      const mid = (ys[i - 1] + y) / 2;
      const z = 8;
      d += ` V${mid - 4 * z} l${z} ${z} l${-2 * z} ${z} l${2 * z} ${z} l${-z} ${z}`;
    }
    d += ` V${y}`;
  });
  base.setAttribute('d', d);
  live.setAttribute('d', d);
  flow.setAttribute('d', d);
  halo.setAttribute('d', d);

  nodeLayer.innerHTML = '';
  nodes = ys.map((y, i) => {
    const g = document.createElementNS(SVG, 'g');
    const label = labels[i];
    const lx = label.getBoundingClientRect().left - svg.getBoundingClientRect().left;
    const line = document.createElementNS(SVG, 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', y);
    line.setAttribute('x2', Math.max(x, lx)); line.setAttribute('y2', y);
    const c = document.createElementNS(SVG, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 7);
    g.append(line, c);
    nodeLayer.appendChild(g);
    return {g, y, x, wasLit: nodes[i] ? nodes[i].wasLit : false, last: label.hasAttribute('data-last')};
  });

  total = live.getTotalLength();
  samples = [];
  const N = 400;
  for (let k = 0; k <= N; k++) {
    const len = total * k / N;
    samples.push({len, y: live.getPointAtLength(len).y});
  }
  update();
}

function lengthAtY(y){
  if (y <= 0) return 0;
  let lo = 0, hi = samples.length - 1;
  if (y >= samples[hi].y) return total;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; samples[m].y < y ? lo = m : hi = m; }
  const a = samples[lo], b = samples[hi];
  return a.len + (b.len - a.len) * ((y - a.y) / ((b.y - a.y) || 1));
}

function update(){
  ticking = false;
  const mTop = main.getBoundingClientRect().top + scrollY;
  const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  const front = reduce || atEnd ? Infinity : scrollY + innerHeight * 0.6 - mTop;
  const len = lengthAtY(front);
  clip.style.height = `${Math.max(0, Math.min(mainH, front))}px`;
  const tip = live.getPointAtLength(Math.max(0, Math.min(total, len)));
  spark.setAttribute('cx', tip.x); spark.setAttribute('cy', tip.y);
  spark.style.opacity = len > 2 && len < total - 2 ? 1 : 0;
  nodes.forEach(n => {
    const lit = front >= n.y - 1;
    if (lit && !n.wasLit && !reduce) {
      const r = svg.getBoundingClientRect();
      dispatchEvent(new CustomEvent('node-lit', {detail: {x: r.left + n.x, y: r.top + n.y}}));
    }
    n.wasLit = lit;
    n.g.classList.toggle('lit', lit);
    if (n.last) output.classList.toggle('powered', lit);
  });
}

addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, {passive: true});
// mark the page as scrolling for a moment (electrons on the circuit only flow while it moves)
let scrollIdle;
addEventListener('scroll', () => {
  document.documentElement.classList.add('is-scrolling');
  clearTimeout(scrollIdle);
  scrollIdle = setTimeout(() => document.documentElement.classList.remove('is-scrolling'), 450);
}, {passive: true});
new ResizeObserver(() => build()).observe(main);
document.fonts && document.fonts.ready.then(build);
build();

import('./interactions.js');
