/* ============================================================
   EDEN orb — canvas 2D particle "galaxy in a sphere"
   One component, parameterised; three sizes; five states.
   States morph continuously (params are lerped every frame).
   ============================================================ */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Brand palette stops around the sphere: violet (top-left) → cyan (right) → ember (bottom)
  // angle in screen space: -90 top, 0 right, 90 bottom, 180 left
  const STOPS = [
    { a: -150, c: [124, 92, 255] },  // violet
    { a: -60,  c: [170, 120, 255] }, // lilac
    { a: 0,    c: [45, 212, 191] },  // cyan/teal
    { a: 55,   c: [255, 138, 76] },  // ember
    { a: 120,  c: [251, 113, 133] }, // pink-ember base
    { a: 210,  c: [124, 92, 255] },  // back to violet
  ];
  function colorAt(deg) {
    // normalise into [-150, 210)
    let d = deg; while (d < -150) d += 360; while (d >= 210) d -= 360;
    for (let i = 0; i < STOPS.length - 1; i++) {
      const s = STOPS[i], e = STOPS[i + 1];
      if (d >= s.a && d < e.a) {
        const t = (d - s.a) / (e.a - s.a);
        return [lerp(s.c[0], e.c[0], t), lerp(s.c[1], e.c[1], t), lerp(s.c[2], e.c[2], t)];
      }
    }
    return STOPS[0].c;
  }
  const WARM = [255, 150, 90];

  // Sprite cache: pre-rendered soft dots per hue bucket, drawn with additive blending
  const BUCKETS = 36;
  const spriteCache = new Map();
  function sprite(bucket, warm) {
    const key = bucket + ':' + warm;
    if (spriteCache.has(key)) return spriteCache.get(key);
    const S = 32, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    const base = colorAt((bucket / BUCKETS) * 360 - 150);
    const col = [lerp(base[0], WARM[0], warm), lerp(base[1], WARM[1], warm), lerp(base[2], WARM[2], warm)].map(Math.round);
    const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0, `rgba(255,255,255,0.7)`);
    grd.addColorStop(0.12, `rgba(${col[0]},${col[1]},${col[2]},0.85)`);
    grd.addColorStop(0.45, `rgba(${col[0]},${col[1]},${col[2]},0.3)`);
    grd.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    spriteCache.set(key, c);
    return c;
  }

  const STATE_PARAMS = {
    idle:      { speed: 1.0, spread: 1.0, tighten: 0, lean: 0, core: 0.55, spin: 1.0, spiral: 0, warmPulse: 0 },
    aware:     { speed: 1.35, spread: 1.0, tighten: 0.05, lean: 0, core: 0.7, spin: 1.3, spiral: 0, warmPulse: 1 },
    listening: { speed: 0.9, spread: 0.85, tighten: 0.25, lean: 1, core: 0.65, spin: 0.8, spiral: 0, warmPulse: 0 },
    thinking:  { speed: 2.4, spread: 0.9, tighten: 0.15, lean: 0, core: 1.0, spin: 2.2, spiral: 1, warmPulse: 0 },
    speaking:  { speed: 1.2, spread: 1.05, tighten: 0, lean: 0, core: 0.8, spin: 1.1, spiral: 0, warmPulse: 0 },
  };

  class EdenOrb {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} opts  { size, particles, calm(0..1), state }
     */
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.size = opts.size || 180;
      this.calm = opts.calm != null ? opts.calm : 0;         // 1 = hotbar mini: slower, fewer
      const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (navigator.hardwareConcurrency || 8) <= 4;
      const base = opts.particles || (this.size < 60 ? 70 : this.size < 120 ? 200 : (isMobile ? 200 : 320));
      this.N = base;
      this.state = opts.state || 'idle';
      this.urgency = 0;                                       // 0..1 warmth bias
      this.p = { ...STATE_PARAMS.idle };                      // current (lerped) params
      this.target = { ...STATE_PARAMS[this.state] };
      this.t = 0; this.last = 0; this.raf = 0; this.running = false;
      this.ripples = [];
      this.pulsePhase = Math.random() * TAU;
      this.leanX = 0; this.leanY = 0.35;                      // where "input" is (normalised, y down)
      this._initParticles();
      this._resize();
      this._onVis = () => (document.hidden ? this.stop() : this.start());
      document.addEventListener('visibilitychange', this._onVis);
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(canvas);
    }

    _initParticles() {
      const N = this.N, arr = [];
      for (let i = 0; i < N; i++) {
        // Distribute orbit planes over a set of interleaved bands so it reads as one cohesive galaxy shell
        const band = i % 6;
        const inc = (band / 6) * Math.PI + (Math.random() - 0.5) * 0.35;      // inclination
        const node = Math.random() * TAU;                                       // ascending node
        const r = 0.80 + Math.pow(Math.random(), 2.2) * 0.22;                   // 0.80..1.02 of radius (shell-heavy, cohesive)
        const ecc = 0.82 + Math.random() * 0.18;                                // ellipse squash
        arr.push({
          inc, node, r, ecc,
          phase: Math.random() * TAU,
          speed: (0.35 + Math.random() * 0.55) * (Math.random() < 0.5 ? 1 : -1),
          size: 0.55 + Math.random() * 0.9,
          tw: Math.random() * TAU,        // twinkle phase
        });
      }
      // a few core motes that live inside the sphere for depth
      for (let i = 0; i < Math.max(8, N * 0.08); i++) {
        arr.push({
          inc: Math.random() * Math.PI, node: Math.random() * TAU, r: 0.15 + Math.random() * 0.45, ecc: 1,
          phase: Math.random() * TAU, speed: (0.15 + Math.random() * 0.25) * (Math.random() < 0.5 ? 1 : -1),
          size: 0.35 + Math.random() * 0.4, tw: Math.random() * TAU, inner: true,
        });
      }
      this.parts = arr;
    }

    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      const css = Math.max(1, rect.width || this.size);
      this.cssSize = css;
      const px = Math.round(css * dpr);
      if (this.canvas.width !== px) { this.canvas.width = px; this.canvas.height = px; }
      this.dpr = dpr;
      if (!this.running) this._draw(0);
    }

    setState(s) {
      if (!STATE_PARAMS[s]) s = 'idle';
      this.state = s;
      this.target = { ...STATE_PARAMS[s] };
    }
    setUrgency(u) { this.urgency = clamp(u, 0, 1); }
    /** Point the "listening lean" toward a normalised (x,y) in orb space; y>0 = below the orb. */
    setLeanTarget(x, y) { this.leanX = x; this.leanY = y; }
    /** Emit one ripple (used per EDEN message). */
    ripple() { this.ripples.push({ t: 0 }); if (this.ripples.length > 4) this.ripples.shift(); }

    start() {
      if (this.running) return;
      this.running = true; this.last = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
        this._step(dt); this._draw(dt);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }
    destroy() { this.stop(); document.removeEventListener('visibilitychange', this._onVis); this._ro.disconnect(); }

    _step(dt) {
      // Lerp params toward target: continuous morphs, never hard cuts
      const k = 1 - Math.pow(0.001, dt); // ~ fast but smooth
      for (const key in this.target) this.p[key] = lerp(this.p[key], this.target[key], k * 0.6);
      const calmMul = lerp(1, 0.45, this.calm);
      this.t += dt * this.p.speed * calmMul;
      this.pulsePhase += dt;
      for (const rp of this.ripples) rp.t += dt;
      this.ripples = this.ripples.filter(r => r.t < 1.6);
    }

    _draw(dt) {
      const ctx = this.ctx, W = this.canvas.width, H = W;
      const cx = W / 2, cy = H / 2;
      const p = this.p, static_ = reduceMotion() || document.body.classList.contains('reduce-motion');
      const R0 = W * 0.36;
      // breathing ±3% ~5s (calmer for mini)
      const breathe = static_ ? 1 : 1 + 0.03 * lerp(1, 0.4, this.calm) * Math.sin(this.pulsePhase * (TAU / 5));
      // aware pulse: warm flash every ~3s
      const pulse = p.warmPulse > 0.02 ? Math.pow(Math.max(0, Math.sin(this.pulsePhase * (TAU / 3.2))), 6) * p.warmPulse : 0;
      const warm = clamp(this.urgency * 0.6 + pulse * 0.6, 0, 1);
      const R = R0 * breathe * (1 - 0.12 * p.tighten);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';

      // --- Sphere body: deep space core with a luminous rim (matches brand orb) ---
      const leanX = p.lean * this.leanX * R * 0.12, leanY = p.lean * this.leanY * R * 0.12;
      const ox = cx + leanX, oy = cy + leanY;
      let g = ctx.createRadialGradient(ox, oy, R * 0.05, ox, oy, R * 1.02);
      g.addColorStop(0, `rgba(12,18,44,${0.85})`);
      g.addColorStop(0.55, `rgba(16,20,56,0.9)`);
      g.addColorStop(0.86, `rgba(30,40,110,0.75)`);
      g.addColorStop(1, `rgba(60,90,200,0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, R * 1.02, 0, TAU); ctx.fill();

      // starfield motes inside (static twinkle)
      ctx.globalCompositeOperation = 'lighter';
      const starN = Math.min(28, this.N / 8);
      for (let i = 0; i < starN; i++) {
        const a = i * 2.399963 + 0.7, rr = R * (0.15 + ((i * 37) % 60) / 100);
        const sx = ox + Math.cos(a) * rr * 0.9, sy = oy + Math.sin(a) * rr * 0.9;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.pulsePhase * 1.3 + i));
        ctx.fillStyle = `rgba(210,220,255,${0.35 * tw})`;
        ctx.beginPath(); ctx.arc(sx, sy, W * 0.0035, 0, TAU); ctx.fill();
      }

      // --- Rim glow ring (the halo) ---
      const rimA = 0.42 + 0.35 * p.core;
      g = ctx.createRadialGradient(ox, oy, R * 0.80, ox, oy, R * 1.18);
      g.addColorStop(0, 'rgba(120,150,255,0)');
      g.addColorStop(0.55, `rgba(150,170,255,${rimA * 0.55})`);
      g.addColorStop(0.72, `rgba(120,200,255,${rimA * 0.35})`);
      g.addColorStop(1, 'rgba(90,120,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, R * 1.18, 0, TAU); ctx.fill();

      // --- Luminous rim: colour-by-angle segments (the brand's glass edge), slowly rotating hue ---
      const SEG = this.size < 60 ? 24 : 48, rimR = R * 0.97, rimW = W * 0.022;
      const hueDrift = this.t * 8;                       // degrees; slow colour rotation
      ctx.lineCap = 'butt';
      if (ctx.createConicGradient) {
        const rimAlpha = 0.75 + 0.25 * p.core;
        const mk = (alphaMul, white) => {
          const g2 = ctx.createConicGradient(hueDrift * Math.PI / 180, ox, oy);
          const N = 36;
          for (let k = 0; k <= N; k++) {
            const t = k / N, deg = t * 360, screenDeg = deg + hueDrift;
            const c = colorAt(deg);
            const cw = [lerp(c[0], WARM[0], warm), lerp(c[1], WARM[1], warm), lerp(c[2], WARM[2], warm)].map(Math.round);
            const hi = 0.5 + 0.5 * Math.max(0, Math.cos((screenDeg + 130) * Math.PI / 180)) + 0.35 * Math.max(0, Math.cos((screenDeg - 10) * Math.PI / 180));
            g2.addColorStop(t, white ? `rgba(255,255,255,${(0.32 * hi * alphaMul).toFixed(3)})` : `rgba(${cw[0]},${cw[1]},${cw[2]},${(0.55 * hi * rimAlpha * alphaMul).toFixed(3)})`);
          }
          return g2;
        };
        ctx.strokeStyle = mk(1, false); ctx.lineWidth = rimW * 2.4; ctx.beginPath(); ctx.arc(ox, oy, rimR, 0, TAU); ctx.stroke();      // soft coloured band
        ctx.strokeStyle = mk(0.6, false); ctx.lineWidth = rimW * 5; ctx.beginPath(); ctx.arc(ox, oy, rimR * 1.02, 0, TAU); ctx.stroke(); // wider halo
        ctx.strokeStyle = mk(1, true); ctx.lineWidth = rimW * 0.5; ctx.beginPath(); ctx.arc(ox, oy, rimR, 0, TAU); ctx.stroke();       // crisp edge
      } else for (let i = 0; i < SEG; i++) {
        const a0 = (i / SEG) * TAU, a1 = ((i + 1.15) / SEG) * TAU;
        const deg = a0 * 180 / Math.PI;
        const c = colorAt(deg - hueDrift);
        const cw = [lerp(c[0], WARM[0], warm), lerp(c[1], WARM[1], warm), lerp(c[2], WARM[2], warm)].map(Math.round);
        // brighter where the brand's highlights sit (top-left & right)
        const hi = 0.55 + 0.45 * Math.max(0, Math.cos((deg + 130) * Math.PI / 180)) + 0.35 * Math.max(0, Math.cos((deg - 10) * Math.PI / 180));
        ctx.strokeStyle = `rgba(${cw[0]},${cw[1]},${cw[2]},${0.55 * hi * (0.75 + 0.25 * p.core)})`;
        ctx.lineWidth = rimW * 2.4; ctx.beginPath(); ctx.arc(ox, oy, rimR, a0, a1); ctx.stroke();   // soft outer band
        ctx.strokeStyle = `rgba(255,255,255,${0.32 * hi})`;
        ctx.lineWidth = rimW * 0.5; ctx.beginPath(); ctx.arc(ox, oy, rimR, a0, a1); ctx.stroke();   // crisp bright edge
      }

      // --- Particles: 3D orbits projected, colour by screen angle, additive sprites ---
      const spin = this.t * 0.35 * p.spin;
      const cs = Math.cos(spin), sn = Math.sin(spin);
      const parts = this.parts;
      const spiral = p.spiral;
      const sizeBase = W * 0.031 * lerp(1, 0.9, this.calm);
      // depth-sort cheaply: draw back half dimmer, no real sort needed for additive blending
      for (let i = 0; i < parts.length; i++) {
        const q = parts[i];
        const th = q.phase + this.t * q.speed * (q.inner ? 0.6 : 1) * (1 + spiral * 0.5);
        let rr = q.r * (q.inner ? 1 : p.spread);
        if (spiral && !q.inner) rr *= 0.86 + 0.14 * (0.5 + 0.5 * Math.sin(this.t * 2 + q.phase)); // subtle inward spiral
        // position in orbit plane
        let x = Math.cos(th) * rr, y = Math.sin(th) * rr * q.ecc, z = 0;
        // incline plane about x
        let y1 = y * Math.cos(q.inc), z1 = y * Math.sin(q.inc);
        // rotate about z by node
        let x2 = x * Math.cos(q.node) - y1 * Math.sin(q.node), y2 = x * Math.sin(q.node) + y1 * Math.cos(q.node);
        // global spin about y
        let x3 = x2 * cs + z1 * sn, z3 = -x2 * sn + z1 * cs;
        const px = ox + x3 * R + leanX * 0.6, py = oy + y2 * R + leanY * 0.6;
        const depth = (z3 + 1) / 2;                       // 0 back .. 1 front
        const ang = Math.atan2(py - oy, px - ox) * 180 / Math.PI;
        let bucket = Math.floor(((ang + 150 + 360) % 360) / 360 * BUCKETS) % BUCKETS;
        const wq = Math.round(warm * 4) / 4;
        const sp = sprite(bucket, wq);
        const tw = 0.75 + 0.25 * Math.sin(this.pulsePhase * 2.1 + q.tw);
        const s = sizeBase * q.size * lerp(0.55, 1.15, depth) * tw * (q.inner ? 0.7 : 1);
        ctx.globalAlpha = lerp(0.28, 0.95, depth) * (q.inner ? 0.6 : 1) * (0.7 + 0.3 * p.core);
        ctx.drawImage(sp, px - s, py - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;

      // --- Bright core flare (state 'thinking' brightens it) ---
      const coreA = 0.10 + 0.5 * p.core * p.core;
      g = ctx.createRadialGradient(ox, oy, 0, ox, oy, R * 0.55);
      g.addColorStop(0, `rgba(200,210,255,${coreA})`);
      g.addColorStop(0.35, `rgba(140,150,255,${coreA * 0.35})`);
      g.addColorStop(1, 'rgba(90,120,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, R * 0.55, 0, TAU); ctx.fill();

      // --- Warm ember at the base + urgency wash ---
      if (warm > 0.01) {
        g = ctx.createRadialGradient(ox, oy + R * 0.7, 0, ox, oy + R * 0.7, R * 0.9);
        g.addColorStop(0, `rgba(255,140,80,${0.35 * warm})`);
        g.addColorStop(1, 'rgba(255,140,80,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, R * 1.2, 0, TAU); ctx.fill();
      }

      // --- Ripples (speaking) ---
      for (const rp of this.ripples) {
        const k = rp.t / 1.6, rad = R * (1.0 + k * 0.9);
        ctx.strokeStyle = `rgba(160,190,255,${(1 - k) * 0.5})`;
        ctx.lineWidth = Math.max(1, W * 0.006 * (1 - k));
        ctx.beginPath(); ctx.arc(ox, oy, rad, 0, TAU); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  window.EdenOrb = EdenOrb;
})();
