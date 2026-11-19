// Lab Notebook · v8 effects: ink ripple on press, per-project symbol animations, self-writing signature
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 1. ink ripple from the exact press point */
document.addEventListener('pointerdown', e => {
  if (reduce || calm() || e.button !== 0) return;
  const el = e.target.closest('.btn, .exp, .email, .power, .motion-switch');
  if (!el) return;
  let box = el.querySelector(':scope > .ripple-box');
  if (!box) {
    box = document.createElement('span');
    box.className = 'ripple-box';
    box.setAttribute('aria-hidden', 'true');
    el.appendChild(box);
  }
  const r = el.getBoundingClientRect();
  const d = Math.hypot(r.width, r.height) * 2;
  const ink = document.createElement('span');
  ink.className = 'ripple';
  ink.style.width = ink.style.height = d + 'px';
  ink.style.left = (e.clientX - r.left - d / 2) + 'px';
  ink.style.top = (e.clientY - r.top - d / 2) + 'px';
  box.appendChild(ink);
  ink.addEventListener('animationend', () => ink.remove());
});

/* 2. each project symbol gets its own hover animation */
$$('.exp-symbol').forEach((sym, i) => {
  const glyph = document.createElement('i');
  glyph.className = 'sym';
  glyph.textContent = sym.textContent;
  sym.textContent = '';
  sym.appendChild(glyph);
  sym.classList.add(`sym-${i}`);
});

/* 3. signature writes itself at the end of the notebook */
(function signature(){
  const out = $('#output footer');
  if (!out) return;
  const wrap = document.createElement('div');
  wrap.className = 'signature';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = '<span class="sig-label">SIGNED,</span><svg viewBox="0 0 520 120"><text x="6" y="88">Bhababhusan</text><path class="sig-line" d="M10 104C150 96 330 92 500 98"/></svg>';
  out.before(wrap);
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    wrap.classList.add('write');
    io.disconnect();
  }, {threshold: .5});
  io.observe(wrap);
})();
