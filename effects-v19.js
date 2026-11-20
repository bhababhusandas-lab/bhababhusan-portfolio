// Lab Notebook · v19 effects (main site): scissors snip along sheet dividers, copy stamp, signal arcs on social links
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = () => document.documentElement.dataset.motion === 'calm';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => reduce || calm();

/* 1. a pair of scissors snips along the dashed line at the bottom of each sheet, once */
(function scissors(){
  const sheets = $$('.sheet').slice(0, -1); // the last sheet has no divider below it worth cutting
  if (!sheets.length || !('IntersectionObserver' in window)) return;
  const make = () => {
    const s = document.createElement('span');
    s.className = 'snip';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = `<svg viewBox="0 0 40 24"><g class="blade a"><path d="M20 12 38 7"/><circle cx="7" cy="6" r="4.5"/><path d="M11 8l9 4"/></g>
      <g class="blade b"><path d="M20 12 38 17"/><circle cx="7" cy="18" r="4.5"/><path d="M11 16l9-4"/></g><circle class="pin" cx="20" cy="12" r="1.4"/></svg>`;
    return s;
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    if (still()) return;
    const sheet = e.target.parentElement;
    const s = make();
    sheet.appendChild(s);
    const w = sheet.clientWidth;
    s.animate([{transform: 'translateX(-30px)', opacity: 0}, {opacity: 1, offset: .06}, {opacity: 1, offset: .9}, {transform: `translateX(${w}px)`, opacity: 0}],
      {duration: Math.max(1800, w * 3.2), easing: 'linear'}).finished.then(() => s.remove());
  }), {rootMargin: '0px 0px -30% 0px'});
  // watch a thin marker at the bottom edge of each sheet
  sheets.forEach(sh => {
    const m = document.createElement('span');
    m.className = 'snip-mark';
    m.setAttribute('aria-hidden', 'true');
    sh.appendChild(m);
    io.observe(m);
  });
})();

/* 2. copying text slaps a "COPIED" rubber stamp next to the selection */
(function copyStamp(){
  let last = 0;
  document.addEventListener('copy', () => {
    const now = performance.now();
    if (now - last < 600) return;
    last = now;
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const r = sel.getRangeAt(0).getBoundingClientRect();
    const st = document.createElement('span');
    st.className = 'copy-stamp' + (still() ? ' still' : '');
    st.setAttribute('role', 'status');
    st.innerHTML = 'COPIED ✓<small>please cite the source</small>';
    document.body.appendChild(st);
    const sw = st.offsetWidth, sh = st.offsetHeight;
    const x = Math.min(innerWidth - sw - 10, Math.max(10, r.right - sw / 2));
    const y = r.top - sh - 12 < 70 ? r.bottom + 12 : r.top - sh - 12;
    st.style.left = x + scrollX + 'px';
    st.style.top = y + scrollY + 'px'; // anchored to the page, so it stays beside the text while scrolling
    setTimeout(() => { st.classList.add('fade'); setTimeout(() => st.remove(), 500); }, 1600);
  });
})();

/* 3. hover / press a social link: signal arcs radiate from its icon */
(function signal(){
  $$('.channel').forEach(ch => {
    const icon = ch.querySelector('svg');
    if (!icon) return;
    const wrap = document.createElement('span');
    wrap.className = 'sig';
    wrap.setAttribute('aria-hidden', 'true');
    icon.after(wrap);
    wrap.prepend(icon);
    let t = 0;
    const emit = () => {
      if (still()) return;
      const now = performance.now();
      if (now - t < 450) return;
      t = now;
      for (let i = 0; i < 3; i++) {
        const a = document.createElement('i');
        a.className = 'arc';
        wrap.appendChild(a);
        a.animate([{transform: 'translate(-50%,-50%) scale(.6)', opacity: .9}, {transform: 'translate(-50%,-50%) scale(2.6)', opacity: 0}],
          {duration: 900, delay: i * 160, easing: 'cubic-bezier(.2,.7,.4,1)'}).finished.then(() => a.remove());
      }
    };
    ch.addEventListener('pointerenter', e => e.pointerType === 'mouse' && emit());
    ch.addEventListener('pointerdown', emit);
    ch.addEventListener('focus', emit);
  });
})();
