// Lab Notebook · animation & interaction layer
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'calm';
const fine = matchMedia('(pointer: fine)').matches;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const GLYPHS = '01<>/\\[]{}=+*#%&$@ΩµΔ∑≈';

/* ───────── 1. boot sequence (once per session) ───────── */
function boot(){
  const el = $('#boot');
  let seen = false;
  try { seen = sessionStorage.getItem('lab-booted') === '1'; } catch (e) {}
  if (reduce || seen || !el) { el && el.remove(); return Promise.resolve(); }
  try { sessionStorage.setItem('lab-booted', '1'); } catch (e) {}
  document.documentElement.classList.add('booting');
  el.classList.add('show');
  const log = $('#boot-log');
  const lines = [
    '> POWERING ON LAB NOTEBOOK Nº001',
    '> CHECKING CURIOSITY .......... OK',
    '> LOADING EXPERIMENTS ......... 4 FOUND',
    '> CALIBRATING BUILDER INSTINCT  OK',
    '> READY.'
  ];
  return new Promise(resolve => {
    let done = false, li = 0, ci = 0, timer;
    const finish = () => {
      if (done) return; done = true; clearTimeout(timer);
      log.textContent = lines.join('\n');
      el.classList.add('done');
      document.documentElement.classList.remove('booting');
      removeEventListener('keydown', finish); el.removeEventListener('click', finish);
      setTimeout(() => el.remove(), 900);
      resolve();
    };
    addEventListener('keydown', finish); el.addEventListener('click', finish);
    // time-based so a throttled tab can't stretch it: types everything in ~1.4s, hard cap 2s
    const full = lines.join('\n'), DURATION = 1400, t0 = performance.now();
    setTimeout(finish, 2000);
    const tick = () => {
      if (done) return;
      const p = Math.min(1, (performance.now() - t0) / DURATION);
      log.textContent = full.slice(0, Math.round(full.length * p)) + (p < 1 ? '▌' : '');
      el.style.setProperty('--boot', p.toFixed(3));
      if (p >= 1) { timer = setTimeout(finish, 280); return; }
      timer = setTimeout(tick, 16);
    };
    tick();
  });
}

/* ───────── 2. text scramble + bouncy letters ───────── */
function splitLetters(root){
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  const chars = [];
  texts.forEach(t => {
    const frag = document.createDocumentFragment();
    [...t.textContent].forEach(c => {
      if (c.trim() === '') { frag.append(c); return; }
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = c; s.dataset.c = c;
      frag.append(s); chars.push(s);
    });
    t.replaceWith(frag);
  });
  return chars;
}
function scramble(chars){
  if (reduce) return;
  const start = performance.now();
  const step = now => {
    let pending = false;
    chars.forEach((s, i) => {
      const settle = 260 + i * 45;
      if (now - start < settle) { pending = true; s.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0]; s.classList.add('glitch'); }
      else if (s.classList.contains('glitch')) { s.textContent = s.dataset.c; s.classList.remove('glitch'); }
    });
    if (pending) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const titleChars = $$('[data-scramble]').flatMap(splitLetters);
// letters wobble when the cursor passes over them
titleChars.forEach(s => s.addEventListener('pointerenter', () => {
  if (reduce) return;
  s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump');
}));

/* ───────── 3. probe cursor ───────── */
function probe(){
  const p = $('#probe');
  if (!fine || reduce || !p) { p && p.remove(); return; }
  document.documentElement.classList.add('has-probe');
  const read = $('#probe-read');
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, shown = false;
  addEventListener('pointermove', e => {
    tx = e.clientX; ty = e.clientY;
    if (!shown) { x = tx; y = ty; shown = true; p.classList.add('on'); }
    const hot = e.target.closest('a,button,[data-tilt],canvas');
    p.classList.toggle('hot', !!hot);
  }, {passive: true});
  document.addEventListener('pointerleave', () => { p.classList.remove('on'); shown = false; });
  addEventListener('pointerdown', () => p.classList.add('press'));
  addEventListener('pointerup', () => p.classList.remove('press'));
  const loop = () => {
    x = lerp(x, tx, .22); y = lerp(y, ty, .22);
    p.style.transform = `translate(${x}px,${y}px)`;
    read.textContent = `X ${String(Math.round(tx)).padStart(4, '0')} · Y ${String(Math.round(ty + scrollY)).padStart(4, '0')}`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* ───────── 4. 3D tilt + spotlight ───────── */
function tilt(){
  if (!fine || reduce) return;
  const els = [...$$('.exp'), $('.specimen'), $('.field'), ...$$('.flow-step')].filter(Boolean);
  els.forEach(el => {
    el.dataset.tilt = '';
    const max = el.classList.contains('specimen') ? 10 : 7;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', `${(px - .5) * max}deg`);
      el.style.setProperty('--rx', `${(.5 - py) * max}deg`);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });
}

/* ───────── 5. magnetic buttons ───────── */
function magnetic(){
  if (!fine || reduce) return;
  $$('.btn, .power, .email, .close, nav a').forEach(el => {
    const k = el.matches('nav a') ? .18 : .3;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * k}px ${(e.clientY - r.top - r.height / 2) * k}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });
}

/* ───────── 6. sparks (clicks + circuit nodes) ───────── */
function sparks(x, y, n = 12, spread = 70){
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.className = 'spark-p';
    const a = Math.random() * Math.PI * 2, d = spread * (.4 + Math.random() * .8);
    s.style.left = x + 'px'; s.style.top = y + 'px';
    s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    s.style.setProperty('--rot', `${a}rad`);
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }
}
addEventListener('pointerdown', e => {
  if (e.target.closest('dialog') || e.button !== 0) return;
  sparks(e.clientX, e.clientY, 9, 50);
});
let lastBurst = 0;
addEventListener('node-lit', e => {
  const now = performance.now();
  if (now - lastBurst < 250) return;
  lastBurst = now;
  sparks(e.detail.x, e.detail.y, 16, 80);
});

/* ───────── 7. power flicker ───────── */
addEventListener('power-flip', () => {
  if (reduce) return;
  if (!document.startViewTransition) { // ink-spill handles it where supported
    const f = $('.flash');
    f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  }
  const r = $('#power').getBoundingClientRect();
  sparks(r.left + 23, r.top + r.height / 2, 14, 60);
});

/* ───────── 8. scribble underlines under handwritten words ───────── */
$$('h2 .hand, .hero-statement .hand').forEach(h => {
  h.classList.add('scribbled');
  h.insertAdjacentHTML('beforeend', '<svg class="scribble" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path d="M3 13C40 6 90 4 150 8 170 9 185 12 197 9M20 17C70 12 130 12 180 15"/></svg>');
});

/* ───────── 9. live clock (IST) ───────── */
const clock = $('#clock');
if (clock) {
  const fmt = new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false});
  // each character is its own cell; only the cells that change flip, like a split-flap clock
  clock.setAttribute('aria-live', 'off');
  let cells = [];
  const t = () => {
    const s = fmt.format(new Date());
    clock.setAttribute('aria-label', `Local time ${s}`);
    if (cells.length !== s.length) {
      clock.textContent = '';
      cells = [...s].map(ch => {
        const c = document.createElement('span');
        c.className = ch === ':' ? 'clk-sep' : 'clk-digit';
        c.textContent = ch;
        c.setAttribute('aria-hidden', 'true');
        clock.appendChild(c);
        return c;
      });
      return;
    }
    [...s].forEach((ch, i) => {
      const c = cells[i];
      if (c.textContent === ch) return;
      c.textContent = ch;
      c.classList.remove('flip'); void c.offsetWidth; c.classList.add('flip');
    });
  };
  t(); setInterval(t, 1000);
}

/* ───────── 10. voltage meter (page progress) ───────── */
const vf = $('#voltage-fill');
const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  vf.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
};
addEventListener('scroll', onScroll, {passive: true}); onScroll();

/* ───────── 11. oscilloscope ───────── */
function scope(){
  const c = $('#scope');
  if (!c) return;
  const ctx = c.getContext('2d');
  const fEl = $('#scope-f'), aEl = $('#scope-a');
  let w = 0, h = 0, dpr = 1, f = 1, a = .5, tf = 1, ta = .5, t = 0, vis = false, vel = 0, lastY = scrollY;
  const size = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(size).observe(c); size();
  new IntersectionObserver(([en]) => { vis = en.isIntersecting; }).observe(c);
  const area = c.closest('.materials-grid') || c;
  area.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    tf = .5 + clamp((e.clientX - r.left) / r.width, 0, 1) * 3.5;
    ta = .15 + clamp(1 - (e.clientY - r.top) / r.height, 0, 1) * .8;
  });
  addEventListener('scroll', () => { vel = Math.min(1, vel + Math.abs(scrollY - lastY) / 400); lastY = scrollY; }, {passive: true});
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const draw = () => {
    requestAnimationFrame(draw);
    if (!vis || !w) return;
    if (!reduce && !(document.documentElement.dataset.motion === 'calm')) t += 1 / 60;
    f = lerp(f, tf, .06); a = lerp(a, ta, .06); vel *= .95;
    fEl.textContent = f.toFixed(2); aEl.textContent = a.toFixed(2);
    ctx.clearRect(0, 0, w, h);
    // grid
    ctx.strokeStyle = css('--grid'); ctx.lineWidth = 1;
    for (let gx = 0; gx <= w; gx += w / 10) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    for (let gy = 0; gy <= h; gy += h / 4) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
    const mid = h / 2;
    // blue reference wave
    ctx.strokeStyle = css('--blue'); ctx.lineWidth = 1.5; ctx.globalAlpha = .55;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) { const y = mid + Math.sin(x / w * Math.PI * 2 * f * 1.5 + t * 2) * a * h * .22; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.globalAlpha = 1;
    // amber live signal
    ctx.strokeStyle = css('--amber'); ctx.lineWidth = 2.2; ctx.shadowColor = css('--amber'); ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const p = x / w * Math.PI * 2 * f * 2 - t * 4;
      const y = mid + (Math.sin(p) + Math.sin(p * 2.3 + t) * .35 + (Math.random() - .5) * vel * 1.4) * a * h * .3;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  };
  draw();
}

/* ───────── 12. staggered entrances ───────── */
$$('.exp').forEach((el, i) => el.style.transitionDelay = `${i * 90}ms`);
$$('.exp').forEach(el => el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, {once: true}));

/* ───────── go ───────── */
probe(); tilt(); magnetic(); scope();
boot().then(() => { document.documentElement.classList.add('booted'); scramble(titleChars); });

import('./effects-v4.js');
import('./effects-v5.js');
import('./effects-v6.js');
import('./effects-v7.js');
import('./effects-v8.js');
import('./effects-v9.js');
import('./effects-v10.js');
import('./effects-v11.js');
import('./effects-v12.js');
import('./effects-v13.js');
import('./effects-v14.js');
import('./effects-v15.js');
import('./effects-v16.js');
import('./effects-v17.js');
import('./effects-v18.js');
import('./effects-v19.js');
import('./effects-v20.js');
import('./effects-v21.js');
import('./effects-v22.js');
import('./effects-v23.js');
import('./effects-v24.js');
import('./effects-v25.js');
