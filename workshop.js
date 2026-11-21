// The Workshop: ten live exhibits drawn on canvas. One shared rAF loop draws only the exhibits on screen,
// and stops when none are visible, the tab is hidden or motion is paused.
const TAU = Math.PI * 2;
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let paused = reduce || root.dataset.motion === 'calm';
const W = 400, H = 300; // every exhibit draws in a 400×300 space

let C = {};
const readColors = () => {
  const s = getComputedStyle(root);
  const v = n => s.getPropertyValue(n).trim();
  C = {ink: v('--ink'), paper: v('--paper'), card: v('--card'), blue: v('--blue'), amber: v('--amber'), muted: v('--muted'), line: v('--line'),
       red: '#e03131', green: '#69db7c', scr: '#12100c', grid: '#ffffff14'};
};
readColors();

/* ---------- helpers ---------- */
const text = (g, s, x, y, col, size = 11, align = 'left', weight = 600) => {
  g.fillStyle = col; g.font = `${weight} ${size}px "JetBrains Mono", monospace`; g.textAlign = align; g.fillText(s, x, y);
};
const line = (g, x1, y1, x2, y2, col, w = 2) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
const dot = (g, x, y, r, fill, stroke, w = 2) => {
  g.beginPath(); g.arc(x, y, r, 0, TAU);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = w; g.stroke(); }
};
const screen = g => {
  g.fillStyle = C.scr; g.fillRect(0, 0, W, H);
  g.strokeStyle = C.grid; g.lineWidth = 1; g.beginPath();
  for (let x = 0; x <= W; x += 40) { g.moveTo(x, 0); g.lineTo(x, H); }
  for (let y = 30; y <= H; y += 40) { g.moveTo(0, y); g.lineTo(W, y); }
  g.stroke();
};
// gear outline: z teeth, module m, rotation a; internal gears point their teeth inward
const gearPath = (g, x, y, z, m, a, internal = false) => {
  const r = m * z / 2, tip = internal ? r - m : r + m, rootR = internal ? r + 1.25 * m : r - 1.25 * m, s = TAU / z;
  const pt = (ang, rad, first) => { const px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad; first ? g.moveTo(px, py) : g.lineTo(px, py); };
  for (let k = 0; k < z; k++) {
    const c = a + k * s;
    pt(c - s * .5, rootR, k === 0); pt(c - s * .28, rootR); pt(c - s * .13, tip); pt(c + s * .13, tip); pt(c + s * .28, rootR);
  }
  g.closePath();
};

/* ---------- exhibits ---------- */
const EX = {
  engine: {
    st: {a: 0, rpm: 120},
    step(dt) { this.st.a += dt * this.st.rpm / 60 * TAU; },
    draw(g) {
      const {a} = this.st, cx = 200, cy = 222, r = 40, L = 110;
      const px = cx + r * Math.sin(a), py = cy - r * Math.cos(a);
      const top = cy - (r * Math.cos(a) + Math.sqrt(L * L - (r * Math.sin(a)) ** 2)); // piston pin height
      const ph = (a % (2 * TAU)) / (2 * TAU); // 0..1 over the four strokes
      const stroke = ['INTAKE', 'COMPRESSION', 'POWER', 'EXHAUST'][Math.floor(ph * 4) % 4];
      // flywheel
      dot(g, cx, cy, 58, C.card, C.ink, 2);
      for (let k = 0; k < 4; k++) { const q = a + k * TAU / 4; line(g, cx, cy, cx + 52 * Math.sin(q), cy - 52 * Math.cos(q), C.muted, 2); }
      // gas in the chamber
      const gas = {INTAKE: '#4dabf755', COMPRESSION: '#4dabf799', POWER: ph < .56 ? '#ff9a1fdd' : '#ff9a1f66', EXHAUST: '#86868655'}[stroke];
      g.fillStyle = gas; g.fillRect(167, 52, 66, top - 18 - 52);
      // cylinder walls + head
      g.fillStyle = C.ink;
      g.fillRect(158, 44, 9, 150); g.fillRect(233, 44, 9, 150); g.fillRect(158, 40, 84, 10);
      // valves
      const iv = stroke === 'INTAKE' ? Math.sin((ph * 4 % 1) * Math.PI) * 9 : 0;
      const xv = stroke === 'EXHAUST' ? Math.sin((ph * 4 % 1) * Math.PI) * 9 : 0;
      line(g, 182, 22, 182, 50 + iv, C.blue, 3); line(g, 173, 51 + iv, 191, 51 + iv, C.blue, 4);
      line(g, 218, 22, 218, 50 + xv, C.muted, 3); line(g, 209, 51 + xv, 227, 51 + xv, C.muted, 4);
      text(g, 'IN', 182, 16, C.blue, 9, 'center'); text(g, 'EX', 218, 16, C.muted, 9, 'center');
      // spark plug + spark
      g.fillStyle = C.ink; g.fillRect(196, 24, 8, 16);
      if (stroke === 'POWER' && ph < .54) {
        g.strokeStyle = C.amber; g.lineWidth = 2; g.beginPath();
        for (let k = 0; k < 6; k++) { const q = k * TAU / 6; g.moveTo(200, 56); g.lineTo(200 + Math.cos(q) * 12, 56 + Math.sin(q) * 12); }
        g.stroke();
      }
      // connecting rod, piston, crank
      line(g, 200, top, px, py, C.ink, 7);
      g.fillStyle = C.blue; g.fillRect(168, top - 18, 64, 34);
      g.fillStyle = C.paper; g.fillRect(168, top - 10, 64, 2); g.fillRect(168, top - 5, 64, 2);
      dot(g, 200, top, 4, C.paper);
      line(g, cx, cy, px, py, C.amber, 8);
      dot(g, cx, cy, 6, C.ink); dot(g, px, py, 5, C.paper, C.ink, 2);
      text(g, stroke, 16, 28, stroke === 'POWER' ? C.amber : C.ink, 14, 'left', 700);
      text(g, `STROKE ${Math.floor(ph * 4) % 4 + 1}/4`, 16, 46, C.muted, 10);
      text(g, `${this.st.rpm} RPM`, 384, 28, C.muted, 10, 'right');
    }
  },

  planet: {
    st: {s: 0, dir: 1},
    tap() { this.st.dir *= -1; },
    step(dt) { this.st.s += dt * 1.3 * this.st.dir; },
    draw(g, layer) {
      const x = 200, y = 150, m = 4.5, zs = 12, zp = 18, zr = 48;
      const ts = this.st.s, tc = ts * zs / (zs + zr); // ring fixed: carrier = sun × 12/60
      // ring
      layer('ring', g => {
        g.beginPath(); g.arc(x, y, 126, 0, TAU); gearPath(g, x, y, zr, m, 0, true);
        g.fillStyle = C.muted + '55'; g.fill('evenodd'); g.strokeStyle = C.ink; g.lineWidth = 1.5; g.stroke();
        text(g, 'RING FIXED', 388, 290, C.muted, 10, 'right');
      });
      // carrier
      const pc = [0, 1, 2].map(i => { const f = tc + i * TAU / 3; return [x + Math.cos(f) * (m * (zs + zp) / 2), y + Math.sin(f) * (m * (zs + zp) / 2), f]; });
      g.strokeStyle = C.amber; g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath();
      pc.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.stroke();
      // planets: phase keeps them meshed with the sun
      pc.forEach(([px, py, f]) => {
        const tp = f + Math.PI - Math.PI / zp - (zs / zp) * (ts - f);
        gearPath(g, px, py, zp, m, tp); g.fillStyle = C.card; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.5; g.stroke();
        dot(g, px, py, 6, C.amber, C.ink, 1.5);
        line(g, px, py, px + Math.cos(tp) * 26, py + Math.sin(tp) * 26, C.muted, 1.5);
      });
      // sun
      gearPath(g, x, y, zs, m, ts); g.fillStyle = C.blue; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.5; g.stroke();
      dot(g, x, y, 5, C.paper);
      text(g, 'SUN ' + (this.st.dir > 0 ? '↻' : '↺'), 12, 22, C.blue, 10);
      text(g, 'CARRIER 5:1', 388, 22, C.amber, 10, 'right');
    }
  },

  phase: {
    st: {t: 0},
    step(dt) { this.st.t += dt * 2.6; },
    draw(g) {
      const t = this.st.t, cx = 88, cy = 150, R = 62, x0 = 172, cols = [C.red, C.amber, C.blue];
      dot(g, cx, cy, R, null, C.line, 1.5);
      line(g, x0, cy, 392, cy, C.line, 1);
      line(g, x0, cy - R - 10, x0, cy + R + 10, C.line, 1);
      for (let k = 0; k < 3; k++) {
        const ph = k * TAU / 3, col = cols[k];
        g.strokeStyle = col; g.lineWidth = 2; g.beginPath();
        for (let x = x0; x <= 392; x += 4) { const yy = cy - R * Math.sin(t - ph - (x - x0) * .035); x === x0 ? g.moveTo(x, yy) : g.lineTo(x, yy); }
        g.stroke();
        const tx = cx + R * Math.cos(t - ph), ty = cy - R * Math.sin(t - ph);
        g.setLineDash([3, 4]); line(g, tx, ty, x0, ty, col, 1); g.setLineDash([]);
        line(g, cx, cy, tx, ty, col, 3); dot(g, tx, ty, 4, col);
        text(g, 'RYB'[k], 14 + k * 18, 26, col, 13, 'left', 700);
      }
      dot(g, cx, cy, 4, C.ink);
      text(g, 'Σ = 0', cx, cy + R + 26, C.muted, 11, 'center');
      text(g, '50 Hz · 120° APART', 392, 26, C.muted, 10, 'right');
    }
  },

  governor: {
    st: {f: 0, th: .3, speed: 45},
    step(dt) {
      const s = this.st.speed / 100, target = .18 + s * .95;
      this.st.th += (target - this.st.th) * Math.min(1, dt * 2.5);
      this.st.f += dt * (2 + s * 11);
    },
    draw(g) {
      const {f, th} = this.st, x = 200, top = 62, L = 72;
      const by = top + L * Math.cos(th), sleeve = top + 2 * L * Math.cos(th);
      // spindle and base
      line(g, x, 26, x, 272, C.ink, 5);
      g.fillStyle = C.ink; g.fillRect(150, 272, 100, 10);
      // sleeve + lever to the steam valve
      g.fillStyle = C.blue; g.fillRect(x - 14, sleeve - 8, 28, 16);
      line(g, x + 14, sleeve, 330, sleeve - 20, C.muted, 3); dot(g, 330, sleeve - 20, 4, C.muted);
      const valve = Math.round(Math.max(0, Math.min(100, 100 - (th - .18) / .95 * 100)));
      g.fillStyle = C.line; g.fillRect(310, 230, 70, 10); g.fillStyle = C.amber; g.fillRect(310, 230, 70 * valve / 100, 10);
      text(g, `VALVE ${valve}%`, 345, 258, C.muted, 9, 'center');
      // two flyballs on opposite sides; draw the far one first
      const balls = [0, Math.PI].map(o => ({dx: L * Math.sin(th) * Math.cos(f + o), z: Math.sin(f + o)})).sort((a, b) => a.z - b.z);
      balls.forEach(({dx, z}) => {
        const bx = x + dx, col = z < 0 ? C.muted : C.ink;
        line(g, x, top, bx, by, col, 3); line(g, bx, by, x, sleeve, col, 2);
        const rr = 14 * (1 + .14 * z);
        const grd = g.createRadialGradient(bx - rr * .35, by - rr * .35, 2, bx, by, rr);
        grd.addColorStop(0, '#fff3bf'); grd.addColorStop(.5, '#fcc419'); grd.addColorStop(1, z < 0 ? '#8a6d00' : '#c9a227');
        dot(g, bx, by, rr, grd, C.ink, 1.5);
      });
      dot(g, x, top, 5, C.amber, C.ink, 1.5);
      text(g, `${Math.round(60 + this.st.speed * 4.4)} RPM`, 16, 26, C.ink, 13, 'left', 700);
      text(g, 'FLYBALL GOVERNOR', 16, 44, C.muted, 9);
    }
  },

  scope: {
    st: {t: 0, i: 2},
    ratios: [[1, 1], [1, 2], [3, 2], [3, 4], [5, 4], [5, 6], [2, 3]],
    tap() { this.st.i = (this.st.i + 1) % this.ratios.length; },
    step(dt) { this.st.t += dt; },
    draw(g, layer) {
      layer('scr', screen);
      const [a, b] = this.ratios[this.st.i], d = this.st.t * .9, P = (u) => [200 + 150 * Math.sin(a * u + d), 150 + 112 * Math.sin(b * u)];
      const trace = (w, col) => {
        g.strokeStyle = col; g.lineWidth = w; g.beginPath();
        for (let k = 0; k <= 200; k++) { const [x, y] = P(k / 200 * TAU); k ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      };
      trace(5, '#69db7c22'); trace(1.6, C.green);
      const [x, y] = P(this.st.t * 2.4);
      dot(g, x, y, 7, '#69db7c44'); dot(g, x, y, 3, '#e9fbe9');
      text(g, `X:Y = ${a}:${b}`, 12, 20, C.green, 11);
      text(g, `φ ${Math.round((d * 180 / Math.PI) % 360)}°`, 388, 20, C.green, 11, 'right');
    }
  },

  cam: {
    st: {a: 0},
    w: 2.2,
    R(phi) { return 46 + 30 * Math.pow(.5 + .5 * Math.cos(phi), 3); },
    step(dt) { this.st.a += dt * this.w; },
    draw(g) {
      const {a} = this.st, cx = 110, cy = 200;
      const lift = q => this.R(-Math.PI / 2 - q); // cam radius pointing straight up at angle q
      const rr = lift(a), fy = cy - rr - 10;
      // guide + follower
      g.fillStyle = C.line; g.fillRect(96, 30, 6, 80); g.fillRect(118, 30, 6, 80);
      line(g, cx, fy, cx, 22, C.ink, 6); dot(g, cx, fy, 10, C.card, C.ink, 2);
      // cam
      g.beginPath();
      for (let k = 0; k <= 120; k++) { const phi = k / 120 * TAU, r = this.R(phi), q = phi + a; const x = cx + Math.cos(q) * r, y = cy + Math.sin(q) * r; k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.closePath(); g.fillStyle = C.amber; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
      line(g, cx, cy, cx + Math.cos(a) * 60, cy + Math.sin(a) * 60, C.ink, 1.5);
      dot(g, cx, cy, 7, C.ink); dot(g, cx, cy, 2.5, C.paper);
      // lift diagram: newest on the left, scrolling right
      const x0 = 200, x1 = 390, base = 260;
      line(g, x0, base, x1, base, C.line, 1); line(g, x0, 120, x0, base, C.line, 1);
      g.strokeStyle = C.blue; g.lineWidth = 2; g.beginPath();
      for (let x = x0; x <= x1; x += 2) { const y = base - (lift(a - (x - x0) * .03) - 46) * 3.6; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
      g.setLineDash([3, 4]); line(g, cx + 12, fy, x0, base - (rr - 46) * 3.6, C.muted, 1); g.setLineDash([]);
      text(g, `LIFT ${(rr - 46).toFixed(1)} mm`, 390, 108, C.blue, 11, 'right');
      text(g, 'ROLLER FOLLOWER', 16, 286, C.muted, 9);
    }
  },

  counter: {
    st: {t: 0, n: 0, dir: 1},
    seg: [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71],
    tap() { this.st.dir *= -1; },
    step(dt) {
      this.st.t += dt;
      if (this.st.t >= .35) { this.st.t -= .35; this.st.n = (this.st.n + this.st.dir + 16) % 16; }
    },
    digit(g, x, y, v) {
      const bits = this.seg[v], w = 38, h = 34, k = 7;
      const S = [[x + 4, y, w - 8, k], [x + w - k, y + 3, k, h - 3], [x + w - k, y + h + 3, k, h - 3], [x + 4, y + 2 * h, w - 8, k], [x, y + h + 3, k, h - 3], [x, y + 3, k, h - 3], [x + 4, y + h, w - 8, k]];
      S.forEach(([sx, sy, sw, sh], i) => { g.fillStyle = bits >> i & 1 ? '#ff6b3d' : '#ff6b3d1c'; g.fillRect(sx, sy, sw, sh); });
    },
    draw(g, layer) {
      layer('scr', screen);
      const n = this.st.n;
      for (let b = 0; b < 4; b++) {
        const on = n >> (3 - b) & 1, x = 92 + b * 72;
        if (on) dot(g, x, 58, 20, '#ff9a1f33');
        dot(g, x, 58, 12, on ? C.amber : '#ff9a1f22', '#ffffff33', 1.5);
        text(g, String(on), x, 98, on ? C.amber : '#ffffff55', 12, 'center', 700);
        text(g, `Q${3 - b}`, x, 24, '#ffffff66', 9, 'center');
      }
      this.digit(g, 70, 122, Math.floor(n / 10)); this.digit(g, 120, 122, n % 10);
      this.digit(g, 286, 122, n);
      text(g, 'DEC', 115, 216, '#ffffff66', 9, 'center'); text(g, 'HEX', 305, 216, '#ffffff66', 9, 'center');
      // clock trace
      g.strokeStyle = C.green; g.lineWidth = 1.5; g.beginPath();
      for (let x = 20; x <= 380; x += 2) {
        const ph = ((x - 20) / 60 + this.st.t / .35) % 1, y = ph < .5 ? 248 : 276;
        x === 20 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
      text(g, 'CLK', 20, 240, C.green, 9);
      text(g, this.st.dir > 0 ? 'UP ▲' : 'DOWN ▼', 380, 240, C.green, 9, 'right');
    }
  },

  rc: {
    st: {t: 0, tau: 60},
    step(dt) { this.st.t += dt; },
    draw(g, layer) {
      layer('scr', screen);
      const tau = this.st.tau / 100, h = 1.2, k = Math.exp(-h / tau), lo = k / (1 + k), hi = 1 / (1 + k);
      const vin = s => (Math.floor(s / h) % 2 + 2) % 2 === 0 ? 1 : 0;
      const vc = s => { const u = ((s % h) + h) % h; return vin(s) ? 1 - (1 - lo) * Math.exp(-u / tau) : hi * Math.exp(-u / tau); };
      const span = 6, x0 = 20, x1 = 380, y = v => 250 - v * 180;
      const plot = (fn, col, w) => {
        g.strokeStyle = col; g.lineWidth = w; g.beginPath();
        for (let x = x0; x <= x1; x += 2) { const s = this.st.t - span + (x - x0) / (x1 - x0) * span; const yy = y(fn(s)); x === x0 ? g.moveTo(x, yy) : g.lineTo(x, yy); }
        g.stroke();
      };
      plot(vin, '#ff9a1f99', 1.5); plot(vc, '#69db7c33', 6); plot(vc, C.green, 2);
      dot(g, x1, y(vc(this.st.t)), 4, '#e9fbe9');
      text(g, 'Vin', 20, 22, C.amber, 11); text(g, 'Vc', 60, 22, C.green, 11);
      text(g, `τ = ${tau.toFixed(2)} s`, 380, 22, C.green, 11, 'right');
      text(g, `${(vc(this.st.t) * 5).toFixed(2)} V`, 380, 285, '#ffffffaa', 10, 'right');
    }
  },

  linkage: {
    st: {a: 0},
      solve(a) {
      const A = [112, 210], D = [232, 210], ca = 40, b = 120, c = 100;
      const B = [A[0] + ca * Math.cos(a), A[1] - ca * Math.sin(a)];
      const dx = D[0] - B[0], dy = D[1] - B[1], e = Math.hypot(dx, dy);
      const p = (b * b - c * c + e * e) / (2 * e), hh = Math.sqrt(Math.max(0, b * b - p * p));
      const mx = B[0] + p * dx / e, my = B[1] + p * dy / e;
      const C1 = [mx + hh * dy / e, my - hh * dx / e], C2 = [mx - hh * dy / e, my + hh * dx / e];
      const Cp = C1[1] < C2[1] ? C1 : C2;
      const ux = (Cp[0] - B[0]) / b, uy = (Cp[1] - B[1]) / b;
      const P = [B[0] + ux * 60 + uy * 64, B[1] + uy * 60 - ux * 64];
      return {A, B, C: Cp, D, P};
    },
    step(dt) { this.st.a += dt * 2.2; },
    draw(g, layer) {
      const {A, B, C: Cc, D, P} = this.solve(this.st.a);
      layer('path', g => {
        g.setLineDash([4, 4]); g.strokeStyle = C.blue; g.lineWidth = 1.5; g.beginPath();
        for (let k = 0; k <= 180; k++) { const [x, y] = this.solve(k / 180 * TAU).P; k ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke(); g.setLineDash([]);
        line(g, A[0], A[1], D[0], D[1], C.line, 2);
        [A, D].forEach(([x, y]) => { g.fillStyle = C.ink; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 10, y + 16); g.lineTo(x + 10, y + 16); g.closePath(); g.fill(); });
        text(g, 'CRANK', A[0], A[1] + 34, C.red, 9, 'center'); text(g, 'ROCKER', D[0], D[1] + 34, C.muted, 9, 'center');
        text(g, 'COUPLER CURVE', 388, 22, C.blue, 9, 'right');
      });
      // coupler triangle
      g.fillStyle = C.amber + '44'; g.beginPath(); g.moveTo(B[0], B[1]); g.lineTo(Cc[0], Cc[1]); g.lineTo(P[0], P[1]); g.closePath(); g.fill();
      line(g, B[0], B[1], P[0], P[1], C.amber, 3); line(g, Cc[0], Cc[1], P[0], P[1], C.amber, 3);
      line(g, B[0], B[1], Cc[0], Cc[1], C.ink, 5);
      line(g, A[0], A[1], B[0], B[1], C.red, 6);
      line(g, D[0], D[1], Cc[0], Cc[1], C.ink, 5);
      [A, B, Cc, D].forEach(([x, y]) => dot(g, x, y, 5, C.paper, C.ink, 2));
      dot(g, P[0], P[1], 6, C.blue);
    }
  },

  pendulum: {
    st: {t: 0},
    step(dt) { this.st.t += dt; },
    draw(g) {
      const N = 15, t = this.st.t;
      line(g, 200, 14, 200, 286, C.line, 1.5);
      for (let i = 0; i < N; i++) {
        const y = 24 + i * 18, w = TAU * (12 + i) / 24, x = 200 + 160 * Math.sin(w * t);
        line(g, 200, y, x, y, C.muted, 1);
        dot(g, x, y, 7, i % 2 ? C.blue : C.amber, C.ink, 1.2);
      }
      dot(g, 200, 24 + 7 * 18, 3, C.ink);
      text(g, `REALIGN IN ${Math.ceil(24 - (t % 24))} s`, 392, 292, C.muted, 9, 'right');
    }
  }
};

/* ---------- setup ---------- */
const items = [];
document.querySelectorAll('.ex').forEach(el => {
  const ex = EX[el.dataset.ex];
  const cv = el.querySelector('canvas');
  if (!ex || !cv) return;
  const it = {el, ex, cv, g: cv.getContext('2d'), vis: false, scale: 1, cache: {}};
  items.push(it);
  const fit = () => {
    const dpr = Math.min(1.5, devicePixelRatio || 1), w = cv.clientWidth;
    if (!w) return;
    cv.width = Math.round(w * dpr); cv.height = Math.round(w * .75 * dpr);
    it.scale = cv.width / W; it.cache = {};
    paint(it);
  };
  new ResizeObserver(fit).observe(cv);
  // controls
  el.querySelectorAll('input[type=range]').forEach(inp => {
    const out = inp.parentElement.querySelector('output');
    const fmt = {rpm: v => `${v} RPM`, speed: v => `${v}%`, tau: v => `${(v / 100).toFixed(2)} s`}[inp.dataset.k];
    const set = () => { ex.st[inp.dataset.k] = +inp.value; out.textContent = fmt(+inp.value); if (paused) paint(it); };
    inp.addEventListener('input', set); set();
  });
  if (ex.tap) {
    cv.tabIndex = 0;
    const act = () => { ex.tap(); try { matchMedia('(pointer: coarse)').matches && navigator.vibrate && navigator.vibrate(8); } catch (e) {} if (paused) paint(it); };
    cv.addEventListener('click', act);
    cv.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
  }
});

// parts that never move (screen grids, the fixed ring gear, the linkage path) are drawn once into an
// offscreen layer and stamped each frame, instead of rebuilding hundreds of path points every frame
function paint(it) {
  const {g, scale} = it;
  g.setTransform(scale, 0, 0, scale, 0, 0);
  g.clearRect(0, 0, W, H);
  it.ex.draw(g, (key, fn) => {
    let c = it.cache[key];
    if (!c) {
      c = document.createElement('canvas'); c.width = it.cv.width; c.height = it.cv.height;
      const cg = c.getContext('2d'); cg.setTransform(scale, 0, 0, scale, 0, 0); fn(cg);
      it.cache[key] = c;
    }
    g.drawImage(c, 0, 0, W, H);
  });
}

// paused or reduced motion: show a representative frame instead of a blank one
if (paused) items.forEach(it => it.ex.step(1.3));

let raf = 0, last = 0;
const frame = now => {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  let any = false;
  for (const it of items) if (it.vis) { any = true; it.ex.step(dt); paint(it); }
  raf = any && !paused && !document.hidden ? requestAnimationFrame(frame) : 0;
};
const kick = () => { if (!raf && !paused && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };

const io = new IntersectionObserver(es => {
  es.forEach(e => {
    const it = items.find(i => i.el === e.target);
    if (!it) return;
    it.vis = e.isIntersecting;
    if (e.isIntersecting) paint(it);
  });
  kick();
}, {rootMargin: '0px'});
items.forEach(it => io.observe(it.el));
// cards fade in well before they reach the screen, so a fast scroll never shows blank boxes
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('seen'); reveal.unobserve(e.target); }
}), {rootMargin: '0px 0px 300px 0px'});
items.forEach(it => reveal.observe(it.el));
document.addEventListener('visibilitychange', kick);

/* ---------- header buttons ---------- */
const mbtn = document.getElementById('ws-motion');
const syncMotion = () => { mbtn.setAttribute('aria-pressed', String(paused)); mbtn.textContent = paused ? 'PLAY ALL' : 'PAUSE ALL'; };
mbtn.addEventListener('click', () => {
  paused = !paused;
  try { localStorage.setItem('portfolio-motion', paused ? 'calm' : 'full'); } catch (e) {}
  root.dataset.motion = paused ? 'calm' : 'full';
  syncMotion(); kick();
});
syncMotion();

const tbtn = document.getElementById('ws-theme');
const syncTheme = () => {
  const dark = root.dataset.theme === 'dark';
  tbtn.setAttribute('aria-pressed', String(dark));
  document.querySelector('meta[name=theme-color]').content = dark ? '#0e2350' : '#f3efe4';
  readColors(); items.forEach(it => { it.cache = {}; paint(it); });
};
tbtn.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('portfolio-theme', root.dataset.theme); } catch (e) {}
  syncTheme();
});
syncTheme();
