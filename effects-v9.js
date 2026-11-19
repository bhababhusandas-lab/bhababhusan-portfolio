// Lab Notebook · v9 effects: rolling nav labels, camera flash on the hero photo, VHS rewind to the top
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();

/* 1. nav labels roll like a slot machine */
$$('nav a').forEach(a => {
  const text = [...a.childNodes].find(n => n.nodeType === 3 && n.data.trim());
  if (!text) return;
  const label = text.data.trim();
  const roll = document.createElement('span');
  roll.className = 'roll';
  roll.innerHTML = `<span>${label}</span><span aria-hidden="true">${label}</span>`;
  text.replaceWith(roll);
});

/* 2. camera flash when the hero photo is clicked */
(function camera(){
  const fig = $('.specimen');
  if (!fig) return;
  fig.style.cursor = 'pointer';
  fig.setAttribute('title', 'Say curious!');
  fig.addEventListener('click', () => {
    if (still()) return;
    const flash = document.createElement('div');
    flash.className = 'cam-flash';
    document.body.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());
    fig.classList.remove('snap'); void fig.offsetWidth; fig.classList.add('snap');
    const print = document.createElement('div');
    print.className = 'cam-print';
    print.innerHTML = '<i></i><span>CLICK! ✳ SAVED</span>';
    fig.appendChild(print);
    print.addEventListener('animationend', () => print.remove());
  });
})();

/* 3. VHS rewind overlay when jumping back to the top */
(function rewind(){
  $$('a[href="#top"]').forEach(a => a.addEventListener('click', e => {
    if (still() || scrollY < innerHeight) return;
    e.preventDefault();
    const o = document.createElement('div');
    o.className = 'rewind';
    o.setAttribute('aria-hidden', 'true');
    o.innerHTML = '<span>◀◀ REWINDING</span><b>SHEET 05 → 01</b>';
    document.body.appendChild(o);
    scrollTo({top: 0, behavior: 'smooth'});
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      o.classList.add('out');
      setTimeout(() => o.remove(), 500);
      removeEventListener('scroll', check);
      history.replaceState(null, '', '#top');
    };
    const check = () => { if (scrollY < 4) finish(); };
    addEventListener('scroll', check, {passive: true});
    setTimeout(finish, 3000); // safety net
  }));
})();
