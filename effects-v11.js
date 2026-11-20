// Lab Notebook · v11 effects: x-ray cards on long-press, shake to scramble headings, page-curl hint at the end
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();

/* 1. press and hold an experiment card to see it as a blueprint wireframe */
(function xray(){
  const HOLD = 450;
  let timer = null, held = null;
  $$('.exp').forEach(card => {
    const clear = () => { clearTimeout(timer); timer = null; };
    card.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      clear();
      timer = setTimeout(() => {
        held = card;
        card.classList.add('xray');
        try { navigator.vibrate && navigator.vibrate(12); } catch (err) {}
      }, HOLD);
    });
    const release = () => {
      clear();
      if (held === card) setTimeout(() => card.classList.remove('xray'), 900);
    };
    card.addEventListener('pointerup', release);
    card.addEventListener('pointerleave', release);
    card.addEventListener('pointercancel', release);
    card.addEventListener('contextmenu', e => { if (held === card || timer) e.preventDefault(); });
    // a long-press shouldn't also open the spec sheet
    card.addEventListener('click', e => {
      if (held === card) { e.stopImmediatePropagation(); e.preventDefault(); held = null; }
    }, true);
  });
})();

/* 2. shake the phone: every heading scrambles into symbols and decodes back */
(function shake(){
  if (!('DeviceMotionEvent' in window)) return;
  const GLYPHS = '01<>/\\[]{}=+*#%&$@ΩµΔ∑≈';
  let last = 0, hits = 0, firstHit = 0, busy = false;
  const scrambleAll = () => {
    if (busy || still()) return;
    busy = true;
    try { navigator.vibrate && navigator.vibrate([30, 40, 30]); } catch (err) {}
    // the hero name is already split into letters (.ch); headings are split into words (.w), so scramble text nodes per letter
    const targets = [...$$('.hero h1 .ch'), ...$$('.sheet h2 .w:not(.hand)')];
    const originals = targets.map(t => t.textContent);
    const start = performance.now();
    const step = now => {
      const t = now - start;
      let pending = false;
      targets.forEach((el, i) => {
        const settle = 250 + (i % 14) * 60;
        if (t < settle) {
          pending = true;
          el.textContent = originals[i].replace(/\S/g, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]);
          el.classList.add('shaken');
        } else if (el.classList.contains('shaken')) {
          el.textContent = originals[i]; el.classList.remove('shaken');
        }
      });
      if (pending) requestAnimationFrame(step); else busy = false;
    };
    requestAnimationFrame(step);
  };
  addEventListener('devicemotion', e => {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a || a.x == null) return;
    const now = performance.now();
    const force = Math.hypot(a.x, a.y, a.z || 0);
    if (force > 24 && now - last > 120) {
      last = now;
      if (now - firstHit > 900) { hits = 0; firstHit = now; }
      if (++hits >= 3) { hits = 0; scrambleAll(); }
    }
  });
  window.__labShake = scrambleAll; // handy for testing
})();

/* 3. at the very bottom, the folded page corner wiggles to invite a tap */
(function curlHint(){
  let shown = false;
  addEventListener('scroll', () => {
    const curl = $('.curl');
    if (!curl || still()) return;
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 6;
    if (atEnd && !shown) {
      shown = true;
      curl.classList.remove('nudge'); void curl.offsetWidth; curl.classList.add('nudge');
      setTimeout(() => { shown = false; }, 6000);
    }
  }, {passive: true});
})();
