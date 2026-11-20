// Lab Notebook · v18 effects (main site): flip the field photo, ink drips from handwritten words, tappable doodles
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();
const buzz = ms => { try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

/* 1. tap the hills photo to flip it over and read the notes on the back */
(function flipPhoto(){
  const photo = $('.field .photo');
  if (!photo) return;
  photo.classList.add('flippable');
  photo.setAttribute('role', 'button');
  photo.setAttribute('tabindex', '0');
  photo.setAttribute('aria-label', 'Flip the photo to read the notes on the back');
  photo.insertAdjacentHTML('beforeend', `
    <span class="flip-hint" aria-hidden="true">TAP TO FLIP ↻</span>
    <div class="photo-back" aria-hidden="true">
      <b>FIELD NOTES</b>
      <p><i>location</i><i>up in the hills</i></p>
      <p><i>signal</i><i>0 bars</i></p>
      <p><i>battery</i><i>recharging…</i></p>
      <p><i>bugs fixed</i><i>0 (on purpose)</i></p>
      <p><i>next build</i><i>loading</i></p>
      <span class="back-hand">best place to debug my own head.</span>
      <span class="back-stamp">DEVELOPED ✓</span>
    </div>`);
  const back = photo.querySelector('.photo-back');
  let busy = false;
  const flip = () => {
    if (busy) return;
    const toBack = !photo.classList.contains('flipped');
    const swap = () => {
      photo.classList.toggle('flipped', toBack);
      back.setAttribute('aria-hidden', String(!toBack));
      photo.setAttribute('aria-label', toBack ? 'Flip the photo back' : 'Flip the photo to read the notes on the back');
    };
    buzz(12);
    if (still()) { swap(); return; }
    busy = true;
    photo.animate([{transform: 'perspective(800px) rotateY(0)'}, {transform: 'perspective(800px) rotateY(90deg) scale(.96)'}],
      {duration: 230, easing: 'ease-in'}).finished.then(() => {
      swap();
      return photo.animate([{transform: 'perspective(800px) rotateY(-90deg) scale(.96)'}, {transform: 'perspective(800px) rotateY(0)'}],
        {duration: 320, easing: 'cubic-bezier(.3,1.4,.5,1)'}).finished;
    }).then(() => { busy = false; });
  };
  photo.addEventListener('click', flip);
  photo.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
})();

/* 2. now and then an ink drop forms under a handwritten word, falls and splats */
(function inkDrips(){
  const words = $$('h2 .hand, .hero-statement .hand');
  if (!words.length || !('IntersectionObserver' in window)) return;
  const visible = new Set();
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)), {threshold: .8});
  words.forEach(w => io.observe(w));
  const drip = () => {
    if (still() || document.hidden || !visible.size) return;
    const list = [...visible], w = list[Math.floor(Math.random() * list.length)];
    const d = document.createElement('span');
    d.className = 'ink-drop';
    d.setAttribute('aria-hidden', 'true');
    d.style.left = (15 + Math.random() * 70).toFixed(0) + '%';
    w.appendChild(d);
    const fall = 34 + Math.random() * 26;
    d.animate([
      {transform: 'translateY(0) scale(.2,.2)', opacity: 0},
      {transform: 'translateY(2px) scale(.8,1.1)', opacity: 1, offset: .35},
      {transform: 'translateY(4px) scale(.7,1.4)', opacity: 1, offset: .5},
      {transform: `translateY(${fall}px) scale(.6,1.5)`, opacity: 1}
    ], {duration: 1500, easing: 'cubic-bezier(.6,0,.9,.5)'}).finished.then(() => {
      d.classList.add('splat');
      d.style.transform = `translateY(${fall}px)`;
      d.animate([{transform: `translateY(${fall}px) scale(.3,.2)`}, {transform: `translateY(${fall}px) scale(1.6,.5)`}], {duration: 160, easing: 'ease-out', fill: 'forwards'});
      setTimeout(() => { d.classList.add('dry'); setTimeout(() => d.remove(), 1400); }, 1600);
    });
  };
  setInterval(drip, 5200);
})();

/* 3. the star and bulb doodles react when tapped */
(function doodles(){
  const star = $('.doodle-star'), bulb = $('.doodle-bulb');
  const burst = (el, char, n) => {
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'doodle-bit';
      s.textContent = char;
      s.setAttribute('aria-hidden', 'true');
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      document.body.appendChild(s);
      const a = (i / n) * Math.PI * 2 + Math.random() * .4, dist = 40 + Math.random() * 30;
      s.animate([{transform: 'translate(-50%,-50%) scale(.3) rotate(0)', opacity: 1},
        {transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist}px)) scale(1) rotate(${(Math.random() - .5) * 360}deg)`, opacity: 0}],
        {duration: 750 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.4,1)'}).finished.then(() => s.remove());
    }
  };
  const arm = (el, fn) => {
    if (!el) return;
    el.classList.add('tappable');
    // a bigger invisible hit area around the small doodle
    el.addEventListener('click', e => { e.stopPropagation(); if (!still()) fn(); buzz(10); });
  };
  arm(star, () => {
    star.classList.remove('spin'); void star.getBoundingClientRect(); star.classList.add('spin');
    burst(star, '✦', 8);
  });
  arm(bulb, () => {
    bulb.classList.remove('lit'); void bulb.getBoundingClientRect(); bulb.classList.add('lit');
    document.body.classList.add('bulb-glow');
    setTimeout(() => document.body.classList.remove('bulb-glow'), 900);
    burst(bulb, '·', 10);
  });
})();
