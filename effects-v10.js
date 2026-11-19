// Lab Notebook · v10 effects (phone-first): word-by-word headings, tilt-your-phone photos, haptic taps
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

/* 1. section headings rise in one word at a time */
$$('.sheet h2').forEach(h2 => {
  let i = 0;
  [...h2.childNodes].forEach(node => {
    if (node.nodeType === 3) {
      if (!node.data.trim()) return;
      const frag = document.createDocumentFragment();
      node.data.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const w = document.createElement('span');
        w.className = 'w';
        w.style.setProperty('--i', i++);
        w.textContent = part;
        frag.append(w);
      });
      node.replaceWith(frag);
    } else if (node.nodeType === 1 && node.matches('.hand')) {
      node.classList.add('w');           // the handwritten phrase arrives as one piece, last
      node.style.setProperty('--i', i++);
    }
  });
  h2.classList.add('words');
});

/* 2. tilt your phone: photos lean with it (Android; iOS needs a permission prompt, so it simply stays still) */
(function gyro(){
  if (!coarse || !('DeviceOrientationEvent' in window)) return;
  const photos = $$('.specimen, .field');
  if (!photos.length) return;
  let tx = 0, ty = 0, x = 0, y = 0, base = null, running = false;
  const loop = () => {
    x += (tx - x) * .12; y += (ty - y) * .12;
    photos.forEach(p => { p.style.setProperty('--ry', `${x.toFixed(2)}deg`); p.style.setProperty('--rx', `${y.toFixed(2)}deg`); });
    if (Math.abs(tx - x) > .01 || Math.abs(ty - y) > .01) requestAnimationFrame(loop); else running = false;
  };
  addEventListener('deviceorientation', e => {
    if (calm() || reduce || e.gamma == null) return;
    if (base === null) base = e.beta;                      // however she's holding the phone counts as "flat"
    tx = Math.max(-9, Math.min(9, e.gamma * .35));
    ty = Math.max(-9, Math.min(9, -(e.beta - base) * .35));
    if (!running) { running = true; requestAnimationFrame(loop); }
  });
})();

/* 3. a tiny vibration on taps (Android) */
document.addEventListener('pointerdown', e => {
  if (!coarse || calm() || reduce || !navigator.vibrate) return;
  if (e.target.closest('.btn, .exp, .channel, .email, .power, .motion-switch, nav a, .ruler-sec')) navigator.vibrate(8);
}, {passive: true});
