/* ==================================================================
   NEBULA — ERROR PAGES: the scenes
   ------------------------------------------------------------------
   One engine, one scene per page, picked by <body data-fx>. A scene is
   a factory returning { step(dt, t), draw(t), still }:

     step   advances the simulation; never draws
     draw   paints one frame; never advances
     still  the moment (in seconds) the still frame is taken at

   Rule 6, as the engine's one job: when the environment says less —
   .fx-lite (weak hardware, data saver, reduced motion) or reduced
   transparency — the scene is simulated to its `still` moment off
   screen and painted ONCE. Nothing then moves, and the page is still
   the picture. Forced colours get no canvas at all (errors.css).

   Every colour is read off the tokens at start, so an app that sets
   its own accent repaints every scene without touching this file.
   Each scene spends the accent on ONE live thing; a refusal is --red.
   ================================================================== */
(() => {
  'use strict';

  const doc = document, root = doc.documentElement, body = doc.body;
  const mq = (q) => matchMedia(q).matches;
  const forced = mq('(forced-colors: active)');
  const reduce = mq('(prefers-reduced-motion: reduce)');
  const lessGlass = mq('(prefers-reduced-transparency: reduce)');
  const conn = navigator.connection;
  const weak = (conn && conn.saveData) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  if (weak || reduce) root.classList.add('fx-lite');
  const still = root.classList.contains('fx-lite') || lessGlass;

  /* ---------------------------------------------------------------
     FACTS — the parts of the page that are not the scene
     --------------------------------------------------------------- */
  const now = doc.querySelector('[data-now]');
  if (now) {
    const d = new Date();
    now.dateTime = d.toISOString();
    now.textContent = d.toISOString().slice(11, 19) + ' UTC';
    now.closest('[data-now-wrap]').hidden = false;
  }
  // Back only when there is somewhere to go back TO.
  doc.querySelectorAll('[data-back]').forEach((b) => {
    if (history.length > 1) b.hidden = false;
    b.addEventListener('click', () => history.back());
  });
  doc.querySelectorAll('[data-retry]').forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', () => location.reload());
  });

  /* ---------------------------------------------------------------
     TOKENS
     --------------------------------------------------------------- */
  const cs = getComputedStyle(root);
  const tok = (n) => cs.getPropertyValue(n).trim();
  const rgbOf = (v) => {
    v = v.trim();
    if (v[0] === '#') {
      let h = v.slice(1);
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    }
    const m = v.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : [255, 255, 255];
  };
  const C = {};
  [['acc', '--acc'], ['accSoft', '--acc-soft'], ['chrome', '--chrome'], ['label', '--label'],
   ['text', '--text'], ['dim', '--text-dim'], ['ghost', '--text-ghost'], ['mist', '--mist'],
   ['mist1', '--mist-1'], ['mist2', '--mist-2'], ['mist3', '--mist-3'], ['mist4', '--mist-4'],
   ['red', '--red'], ['amb', '--amb'], ['ok', '--ok'], ['titleA', '--title-a'], ['titleB', '--title-b'],
   ['bg', '--bg']].forEach(([k, n]) => { C[k] = rgbOf(tok(n) || '#ffffff'); });
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, u) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * u));
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const SANS = '"Space Grotesk", system-ui, sans-serif';

  /* ---------------------------------------------------------------
     SMALL MATHS
     --------------------------------------------------------------- */
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = (u) => (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const easeOut = (u) => 1 - Math.pow(1 - u, 3);
  const rand = (a, b) => a + Math.random() * (b - a);
  // Seeded, so a still frame is the same frame every time it is taken.
  let seed = 7;
  const srand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  // Smooth 1-D noise from three incommensurate sines: cheap, and enough
  // for a corona's rays or a wisp of steam.
  const wob = (x) => (Math.sin(x) + Math.sin(x * 2.17 + 1.3) * .5 + Math.sin(x * 4.73 + 4.1) * .25) / 1.75;

  /* ---------------------------------------------------------------
     THE CANVAS
     --------------------------------------------------------------- */
  const cv = doc.querySelector('.err__fx');
  if (!cv || forced) return;
  const ctx = cv.getContext('2d');
  const stageEl = doc.querySelector('.err__stage');
  const hudEl = doc.querySelector('[data-hud]');
  const codeEl = doc.querySelector('.err__code');
  let W = 0, H = 0, DPR = 1;
  // The stage, in viewport pixels: the scene's focal box.
  const S = { x: 0, y: 0, w: 0, h: 0, l: 0, t: 0, r: 0, b: 0, R: 0 };
  // The pointer, in viewport pixels.
  const P = { x: -1e4, y: -1e4, on: false, down: false, moved: 0 };

  function measureStage() {
    const r = stageEl ? stageEl.getBoundingClientRect() : { left: W * .5, top: 0, width: W * .5, height: H };
    S.l = r.left; S.t = r.top; S.w = r.width; S.h = r.height;
    S.r = r.left + r.width; S.b = r.top + r.height;
    S.x = S.l + S.w / 2; S.y = S.t + S.h / 2;
    S.R = Math.min(S.w, S.h) / 2;
  }
  function measure() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    measureStage();
  }

  addEventListener('pointermove', (e) => { P.x = e.clientX; P.y = e.clientY; P.on = true; P.moved = performance.now(); }, { passive: true });
  addEventListener('pointerdown', (e) => { P.x = e.clientX; P.y = e.clientY; P.down = true; P.on = true; }, { passive: true });
  addEventListener('pointerup', () => { P.down = false; }, { passive: true });
  addEventListener('pointercancel', () => { P.down = false; }, { passive: true });
  doc.addEventListener('pointerleave', () => { P.on = false; P.down = false; });
  // a press that lands on a control belongs to the control, not the scene
  const onControl = (e) => !!(e.target.closest && e.target.closest('a, button, input, label'));

  /* ---------------------------------------------------------------
     HUD — the readout a scene writes into. Text nodes, never HTML.
     --------------------------------------------------------------- */
  let hudLast = 0;
  function hud(rows, force) {
    if (!hudEl) return;
    const t = performance.now();
    if (!force && t - hudLast < 90) return;
    hudLast = t;
    while (hudEl.children.length < rows.length) {
      const r = doc.createElement('span');
      r.append(doc.createTextNode(''), doc.createElement('b'));
      hudEl.append(r);
    }
    rows.forEach(([label, value, cls], i) => {
      const r = hudEl.children[i];
      const l = label.padEnd(10, ' ');
      if (r.firstChild.nodeValue !== l) r.firstChild.nodeValue = l;
      const b = r.lastChild;
      if (b.textContent !== value) b.textContent = value;
      const c = cls || '';
      if (b.className !== c) b.className = c;
    });
  }

  /* ---------------------------------------------------------------
     DRAWING HELPERS
     --------------------------------------------------------------- */
  const mono = (px, w = 400) => `${w} ${px}px ${MONO}`;
  function tracked(px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }
  function brackets(x, y, w, h, len, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
    ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
    ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
    ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
    ctx.stroke();
  }

  // A starfield, shared by the scenes that sit in space. Square stars:
  // rule 2 holds even at two pixels.
  function starfield(n) {
    const stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({ x: srand(), y: srand(), z: [.25, .5, 1][Math.floor(srand() * 3)], s: srand() < .08 ? 2 : 1, p: srand() * TAU });
    }
    let ox = 0, oy = 0;
    return {
      step(dt) {
        const tx = P.on ? (P.x / W - .5) : 0, ty = P.on ? (P.y / H - .5) : 0;
        ox = lerp(ox, tx, Math.min(1, dt * 2)); oy = lerp(oy, ty, Math.min(1, dt * 2));
        for (const s of stars) { s.x -= dt * .0025 * s.z; if (s.x < -.02) s.x += 1.04; }
      },
      draw(t, warp) {
        for (const s of stars) {
          let x = s.x * W - ox * 24 * s.z, y = s.y * H - oy * 24 * s.z;
          if (warp) [x, y] = warp(x, y);
          const a = (.25 + .55 * s.z) * (.75 + .25 * Math.sin(t * 1.3 + s.p));
          ctx.fillStyle = rgba(C.chrome, a);
          ctx.fillRect(x, y, s.s, s.s);
        }
      },
    };
  }

  // Where the numeral's digits are drawn, so a scene can paint them on
  // the canvas exactly over the DOM ones: each digit's left edge, and the
  // shared baseline (a zero-height inline-block sits on it).
  function numeralGeometry() {
    if (!codeEl) return null;
    const ds = [...codeEl.querySelectorAll('.d')];
    const probe = doc.createElement('span');
    probe.style.display = 'inline-block';
    probe.style.width = '0';
    probe.style.height = '0';
    codeEl.append(probe);
    const base = probe.getBoundingClientRect().bottom;
    probe.remove();
    const box = codeEl.getBoundingClientRect();
    const st = getComputedStyle(codeEl);
    return {
      box, base,
      font: `400 ${st.fontSize} ${st.fontFamily}`,
      digits: ds.map((d) => ({ ch: d.textContent, x: d.getBoundingClientRect().left })),
    };
  }
  function drawNumeral(g, c, alpha) {
    const grad = c.createLinearGradient(0, g.box.top, 0, g.box.bottom);
    grad.addColorStop(.22, rgba(C.titleA, alpha));
    grad.addColorStop(.96, rgba(C.titleB, alpha));
    c.font = g.font; c.textBaseline = 'alphabetic'; c.fillStyle = grad;
    for (const d of g.digits) c.fillText(d.ch, d.x, g.base);
  }
  // The numeral as points, one per `gap` px of ink.
  function numeralPoints(g, gap) {
    const pad = 8;
    const w = Math.ceil(g.box.width + pad * 2), h = Math.ceil(g.box.height + pad * 2);
    const off = doc.createElement('canvas'); off.width = w; off.height = h;
    const o = off.getContext('2d');
    o.translate(-g.box.left + pad, -g.box.top + pad);
    o.font = g.font; o.textBaseline = 'alphabetic'; o.fillStyle = '#fff';
    for (const d of g.digits) o.fillText(d.ch, d.x, g.base);
    const data = o.getImageData(0, 0, w, h).data;
    const pts = [];
    for (let y = 0; y < h; y += gap) {
      for (let x = 0; x < w; x += gap) {
        if (data[(y * w + x) * 4 + 3] > 120) pts.push([x + g.box.left - pad, y + g.box.top - pad]);
      }
    }
    return pts;
  }

  /* ===============================================================
     THE SCENES
     =============================================================== */
  const scenes = {};

  /* ---- 400 · PARSER ---------------------------------------------
     The request as a hex dump, read byte by byte. The cursor is the
     live thing (accent); it reaches the byte that does not parse, stops
     on it in red, and starts again on a fresh dump. Meanwhile the
     numeral itself keeps failing to decode. */
  scenes.parse = () => {
    const NOISE = '{}[]<>/\\#%&?!*=+;:$@~^';
    const ds = codeEl ? [...codeEl.querySelectorAll('.d')] : [];
    const real = ds.map((d) => d.textContent);
    // the digits arrive scrambled and settle, one after the other
    const settleAt = ds.map((_, i) => .5 + i * .28);
    let nextGlitch = 3;
    let glitch = null;
    function scramble(t) {
      ds.forEach((d, i) => {
        const noisy = t < settleAt[i] || (glitch && glitch.i === i && t < glitch.until);
        if (noisy) {
          d.classList.add('is-noise');
          if (Math.random() < .5) d.textContent = NOISE[Math.floor(Math.random() * NOISE.length)];
        } else if (d.classList.contains('is-noise')) {
          d.classList.remove('is-noise');
          d.textContent = real[i];
        }
      });
    }

    let bytes = [], cols = 0, rows = 0, cw = 22, lh = 20, cur = 0, errAt = 0, failT = -1;
    const hex = (n) => n.toString(16).toUpperCase().padStart(2, '0');
    function fill() {
      cols = Math.max(4, Math.floor((S.w - 8) / cw));
      // leave the bottom of the stage to the readout
      rows = Math.max(4, Math.floor((S.h - 130) / lh));
      bytes = [];
      for (let i = 0; i < cols * rows; i++) bytes.push(Math.floor(srand() * 256));
      cur = 0;
      errAt = Math.floor(lerp(cols * 1.5, cols * rows - 2, srand()));
      bytes[errAt] = 0x3c;   // '<' — where a '}' was expected
      failT = -1;
    }
    fill();
    let lastW = S.w, lastH = S.h;
    return {
      still: 7.5,
      step(dt, t) {
        if (S.w !== lastW || S.h !== lastH) { lastW = S.w; lastH = S.h; fill(); }
        if (failT < 0) {
          cur += dt * 34;
          if (cur >= errAt) { cur = errAt; failT = t; glitch = { i: Math.floor(Math.random() * ds.length), until: t + .45 }; }
        } else if (t - failT > 2.2) {
          fill();
        }
        if (!still) {
          if (t > nextGlitch && !glitch) { glitch = { i: Math.floor(Math.random() * ds.length), until: t + .35 }; nextGlitch = t + rand(3.5, 7); }
          if (glitch && t > glitch.until + .05) glitch = null;
          scramble(t);
        }
      },
      draw(t) {
        const x0 = S.l + (S.w - cols * cw) / 2, y0 = S.t + 24;
        ctx.font = mono(11); ctx.textBaseline = 'middle'; tracked(0);
        const ci = Math.floor(cur);
        for (let i = 0; i < bytes.length; i++) {
          const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * lh;
          let a = i < ci ? .5 : .16;
          if (P.on) {
            const d = Math.hypot(P.x - x - 8, P.y - y);
            if (d < 90) a += (1 - d / 90) * .45;
          }
          if (i === errAt && failT >= 0) {
            ctx.strokeStyle = rgba(C.red, .95); ctx.lineWidth = 1;
            ctx.strokeRect(x - 3.5, y - 8.5, 21, 17);
            ctx.fillStyle = rgba(C.red, 1);
          } else if (i === ci && failT < 0) {
            ctx.fillStyle = rgba(C.acc, .9);
            ctx.fillRect(x - 3, y - 8, 20, 16);
            ctx.fillStyle = rgba(C.bg, 1);   // on an accent FILL: --on-acc
          } else {
            ctx.fillStyle = rgba(C.label, Math.min(1, a));
          }
          ctx.fillText(hex(bytes[i]), x, y);
        }
        if (failT >= 0) {
          const x = x0 + (errAt % cols) * cw, y = y0 + Math.floor(errAt / cols) * lh;
          ctx.font = mono(10); tracked(1.5);
          ctx.fillStyle = rgba(C.red, Math.min(1, (t - failT) * 4));
          const lab = 'UNEXPECTED ‹<›';
          const tx = Math.min(x, S.r - ctx.measureText(lab).width - 4);
          ctx.fillText(lab, tx, y + 17);
          tracked(0);
        }
        const off = (failT >= 0 ? errAt : ci);
        hud([
          ['Offset', '0x' + off.toString(16).toUpperCase().padStart(4, '0')],
          ['Expected', "'}'"],
          ['Got', failT >= 0 ? "'<'" : '…', failT >= 0 ? 'is-bad' : ''],
          ['State', failT >= 0 ? 'REJECTED' : 'PARSING', failT >= 0 ? 'is-bad' : 'is-live'],
        ]);
      },
    };
  };

  /* ---- 401 · IRIS -----------------------------------------------
     An aperture, stopped down. It breathes, nearly shut; hover or focus
     the Sign in button and it opens, and the opening is ringed in the
     accent — the one state on the page is "about to let you in". */
  scenes.iris = () => {
    const N = 9;
    let ro = .14, opening = false;
    const opener = doc.querySelector('[data-open]');
    if (opener) {
      ['pointerenter', 'focus'].forEach((e) => opener.addEventListener(e, () => { opening = true; }));
      ['pointerleave', 'blur'].forEach((e) => opener.addEventListener(e, () => { opening = false; }));
    }
    const STOPS = ['1.4', '2', '2.8', '4', '5.6', '8', '11', '16', '22'];
    let cx = 0, cy = 0;
    return {
      still: 1,
      step(dt, t) {
        const target = opening ? .66 : .15 + .035 * Math.sin(t * .9);
        ro = lerp(ro, target, Math.min(1, dt * (opening ? 3.2 : 1.6)));
        const px = P.on ? clamp((P.x - S.x) / W, -.5, .5) * 18 : 0;
        const py = P.on ? clamp((P.y - S.y) / H, -.5, .5) * 18 : 0;
        cx = lerp(cx || S.x, S.x + px, Math.min(1, dt * 3));
        cy = lerp(cy || S.y, S.y + py, Math.min(1, dt * 3));
      },
      draw(t) {
        // the barrel and its scale take ~60px outside R
        const R = Math.max(40, S.R - 64), r = R * ro;
        const rot = .35 + ro * 2.1 + t * .015;
        const V = [], E = [];
        for (let i = 0; i < N; i++) { const a = rot + i * TAU / N; V.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
        for (let i = 0; i < N; i++) {
          const A = V[i], B = V[(i + 1) % N];
          let dx = B[0] - A[0], dy = B[1] - A[1]; const L = Math.hypot(dx, dy); dx /= L; dy /= L;
          const bx = B[0] - cx, by = B[1] - cy, bb = bx * dx + by * dy, c = bx * bx + by * by - R * R;
          const k = -bb + Math.sqrt(Math.max(0, bb * bb - c));
          E.push([B[0] + dx * k, B[1] + dy * k]);
        }
        // the blades
        for (let i = 0; i < N; i++) {
          const ep = E[(i - 1 + N) % N], en = E[i];
          let a0 = Math.atan2(ep[1] - cy, ep[0] - cx), a1 = Math.atan2(en[1] - cy, en[0] - cx);
          while (a1 < a0) a1 += TAU;
          ctx.beginPath();
          ctx.moveTo(V[i][0], V[i][1]);
          ctx.lineTo(ep[0], ep[1]);
          ctx.arc(cx, cy, R, a0, a1, false);
          ctx.lineTo(V[(i + 1) % N][0], V[(i + 1) % N][1]);
          ctx.closePath();
          const g = ctx.createLinearGradient(V[i][0], V[i][1], en[0], en[1]);
          g.addColorStop(0, rgba(C.chrome, i % 2 ? .10 : .07));
          g.addColorStop(1, rgba(C.chrome, .02));
          ctx.fillStyle = g; ctx.fill();
          ctx.strokeStyle = rgba(C.chrome, .32); ctx.lineWidth = 1; ctx.stroke();
        }
        // the barrel
        ctx.strokeStyle = rgba(C.chrome, .22);
        ctx.beginPath(); ctx.arc(cx, cy, R + 10, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, R + 34, 0, TAU); ctx.stroke();
        for (let i = 0; i < 120; i++) {
          const a = i * TAU / 120, l = i % 10 ? 4 : 9;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10));
          ctx.lineTo(cx + Math.cos(a) * (R + 10 + l), cy + Math.sin(a) * (R + 10 + l));
          ctx.stroke();
        }
        // the f-stop scale on the barrel, and the index that reads it
        ctx.font = mono(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; tracked(1);
        const a0 = -Math.PI * .78, span = Math.PI * .56;
        STOPS.forEach((s, i) => {
          const a = a0 + span * i / (STOPS.length - 1);
          ctx.fillStyle = rgba(C.label, .85);
          ctx.fillText(s, cx + Math.cos(a) * (R + 50), cy + Math.sin(a) * (R + 50));
        });
        const u = clamp((ro - .1) / .6, 0, 1);
        const ai = a0 + span * (1 - u);
        ctx.fillStyle = rgba(C.acc, 1);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ai) * (R + 36), cy + Math.sin(ai) * (R + 36));
        ctx.lineTo(cx + Math.cos(ai - .03) * (R + 43), cy + Math.sin(ai - .03) * (R + 43));
        ctx.lineTo(cx + Math.cos(ai + .03) * (R + 43), cy + Math.sin(ai + .03) * (R + 43));
        ctx.fill();
        ctx.textAlign = 'start'; tracked(0);
        // the opening
        const glow = clamp((ro - .2) / .4, 0, 1);
        if (glow > 0) {
          ctx.strokeStyle = rgba(C.acc, .9 * glow); ctx.lineWidth = 1.5;
          ctx.beginPath();
          V.forEach((v, i) => (i ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])));
          ctx.closePath(); ctx.stroke(); ctx.lineWidth = 1;
        }
        const f = STOPS[Math.round((1 - u) * (STOPS.length - 1))];
        hud([
          ['Aperture', 'f/' + f, opening ? 'is-live' : ''],
          ['Session', 'NONE'],
          ['Door', opening ? 'OPENING' : 'CLOSED', opening ? 'is-live' : ''],
        ]);
      },
    };
  };

  /* ---- 403 · FORCE FIELD ----------------------------------------
     A square field over the stage. Probes strike it and it ripples;
     nothing gets through. Move the pointer over it and you are the
     probe. The impacts are --red, the field is --chrome: there is no
     state here to wear the accent, only a refusal. */
  scenes.field = () => {
    const waves = [];
    let next = .4, lastPoke = 0, probes = 0;
    const box = () => { const s = Math.min(S.w, S.h - 70) * .84; return { x: S.x - s / 2, y: S.y - s / 2, s }; };
    function strike(x, y, amp, t) { waves.push({ x, y, t0: t, amp }); probes++; if (waves.length > 14) waves.shift(); }
    addEventListener('pointerdown', (e) => {
      if (onControl(e)) return;
      const b = box();
      if (e.clientX > b.x && e.clientX < b.x + b.s && e.clientY > b.y && e.clientY < b.y + b.s) strike(e.clientX, e.clientY, 26, clock);
    });
    function disp(x, y, t) {
      let dx = 0, dy = 0, e = 0;
      for (const w of waves) {
        const age = t - w.t0, front = age * 240;
        const vx = x - w.x, vy = y - w.y, d = Math.hypot(vx, vy) || 1;
        const k = d - front;
        if (k > -70 && k < 70) {
          const m = w.amp * Math.exp(-age * 1.1) * Math.sin(k * .14) * (1 - Math.abs(k) / 70);
          dx += vx / d * m; dy += vy / d * m; e += Math.abs(m);
        }
      }
      return [dx, dy, e];
    }
    return {
      still: 3.1,
      step(dt, t) {
        const b = box();
        if (t > next) {
          const side = Math.floor(srand() * 4), u = srand();
          const pts = [[b.x + u * b.s, b.y], [b.x + b.s, b.y + u * b.s], [b.x + u * b.s, b.y + b.s], [b.x, b.y + u * b.s]];
          strike(pts[side][0], pts[side][1], 30, t);
          next = t + rand(1.4, 2.6);
        }
        if (P.on && P.x > b.x && P.x < b.x + b.s && P.y > b.y && P.y < b.y + b.s && t - lastPoke > .32 && performance.now() - P.moved < 120) {
          strike(P.x, P.y, 15, t); lastPoke = t; probes--;
        }
        while (waves.length && t - waves[0].t0 > 4) waves.shift();
      },
      draw(t) {
        const b = box(), G = 24, n = Math.floor(b.s / G), step = 8;
        const ox = b.x + (b.s - n * G) / 2, oy = b.y + (b.s - n * G) / 2, L = n * G;
        ctx.lineWidth = 1;
        const scan = (t * .18) % 1.4 - .2;
        for (let dir = 0; dir < 2; dir++) {
          for (let i = 0; i <= n; i++) {
            let px = null, py = null;
            for (let j = 0; j <= L; j += step) {
              const x = dir ? ox + j : ox + i * G, y = dir ? oy + i * G : oy + j;
              const [dx, dy, e] = disp(x, y, t);
              const X = x + dx, Y = y + dy;
              if (px !== null) {
                const sc = Math.max(0, 1 - Math.abs((y - oy) / L - scan) * 10) * .08;
                ctx.strokeStyle = rgba(C.chrome, Math.min(.9, .11 + e * .09 + sc));
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(X, Y); ctx.stroke();
              }
              px = X; py = Y;
            }
          }
        }
        ctx.strokeStyle = rgba(C.chrome, .4); ctx.strokeRect(ox - .5, oy - .5, L + 1, L + 1);
        brackets(ox - 8, oy - 8, L + 16, L + 16, 16, rgba(C.chrome, .9));
        // impacts
        ctx.font = mono(10); tracked(1.5); ctx.textBaseline = 'middle';
        for (const w of waves) {
          const age = t - w.t0; if (age > .9) continue;
          const a = 1 - age / .9;
          ctx.strokeStyle = rgba(C.red, a); ctx.lineWidth = 1;
          ctx.strokeRect(w.x - 7, w.y - 7, 14, 14);
          ctx.beginPath(); ctx.moveTo(w.x - 13, w.y); ctx.lineTo(w.x - 4, w.y); ctx.moveTo(w.x + 4, w.y); ctx.lineTo(w.x + 13, w.y);
          ctx.moveTo(w.x, w.y - 13); ctx.lineTo(w.x, w.y - 4); ctx.moveTo(w.x, w.y + 4); ctx.lineTo(w.x, w.y + 13); ctx.stroke();
          if (w.amp > 20) { ctx.fillStyle = rgba(C.red, a); ctx.fillText('DENIED', Math.min(w.x + 16, S.r - 50), w.y - 14); }
        }
        tracked(0);
        ctx.font = mono(10); tracked(2); ctx.fillStyle = rgba(C.label, .9); ctx.textBaseline = 'alphabetic';
        ctx.fillText('FIELD 07', ox, oy - 14);
        tracked(0);
        hud([['Probes', String(Math.max(0, probes))], ['Passed', '0', 'is-bad'], ['Clearance', 'NONE']]);
      },
    };
  };

  /* ---- 404 · RADAR ----------------------------------------------
     Deep space and a radar that will not stop looking. The sweep is the
     live thing. It lights whatever it passes; none of it is the page.
     The sector is derived from the path — the same address always lands
     in the same sector — without the path itself ever appearing. */
  scenes.radar = () => {
    const stars = starfield(Math.round(W * H / 4200));
    let h = 2166136261;
    for (const ch of location.pathname) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    const sector = String(h % 97).padStart(2, '0') + '-' + String((h >>> 8) % 9973).padStart(4, '0');
    const blips = [];
    for (let i = 0; i < 9; i++) blips.push({ a: srand() * TAU, d: .2 + srand() * .75, seen: -10 });
    let a = 0, contacts = 0;
    return {
      still: 2.2,
      step(dt) {
        stars.step(dt);
        const prev = a; a = (a + dt * 1.05) % TAU;
        for (const b of blips) {
          const crossed = prev <= a ? (b.a > prev && b.a <= a) : (b.a > prev || b.a <= a);
          if (crossed) { b.seen = clock; contacts++; }
        }
      },
      draw(t) {
        stars.draw(t);
        const R = S.R * .86, cx = S.x, cy = S.y;
        ctx.lineWidth = 1;
        for (let k = 1; k <= 4; k++) {
          ctx.strokeStyle = rgba(C.chrome, k === 4 ? .3 : .12);
          ctx.beginPath(); ctx.arc(cx, cy, R * k / 4, 0, TAU); ctx.stroke();
        }
        ctx.strokeStyle = rgba(C.chrome, .1);
        ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
        ctx.strokeStyle = rgba(C.chrome, .3);
        for (let i = 0; i < 72; i++) {
          const q = i * TAU / 72, l = i % 9 ? 4 : 10;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(q) * R, cy + Math.sin(q) * R);
          ctx.lineTo(cx + Math.cos(q) * (R - l), cy + Math.sin(q) * (R - l)); ctx.stroke();
        }
        ctx.font = mono(10); ctx.fillStyle = rgba(C.label, .85); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; tracked(1);
        [['000', -Math.PI / 2], ['090', 0], ['180', Math.PI / 2], ['270', Math.PI]].forEach(([s, q]) => {
          ctx.fillText(s, cx + Math.cos(q) * (R + 18), cy + Math.sin(q) * (R + 18));
        });
        ctx.textAlign = 'start'; tracked(0);
        // the sweep: a fan of thin wedges, falling off behind the line
        const sa = a - Math.PI / 2;
        for (let k = 0; k < 28; k++) {
          ctx.fillStyle = rgba(C.acc, .13 * (1 - k / 28));
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, R, sa - (k + 1) * .028, sa - k * .028); ctx.closePath(); ctx.fill();
        }
        ctx.strokeStyle = rgba(C.acc, .95);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sa) * R, cy + Math.sin(sa) * R); ctx.stroke();
        // blips: lit when the sweep passes, fading to nothing
        ctx.font = mono(9); tracked(1.5);
        for (const b of blips) {
          const age = t - b.seen; if (age > 3.5) continue;
          const f = Math.exp(-age * 1.1);
          const x = cx + Math.cos(b.a - Math.PI / 2) * b.d * R, y = cy + Math.sin(b.a - Math.PI / 2) * b.d * R;
          ctx.fillStyle = rgba(C.chrome, f); ctx.fillRect(x - 2, y - 2, 4, 4);
          ctx.strokeStyle = rgba(C.chrome, f * .7); ctx.strokeRect(x - 7.5, y - 7.5, 15, 15);
          if (age < 1.6) { ctx.fillStyle = rgba(C.label, f); ctx.fillText('NO MATCH', Math.min(x + 12, W - 74), y + 3); }
        }
        tracked(0);
        const deg = Math.round(a * 180 / Math.PI) % 360;
        hud([
          ['Sector', sector],
          ['Bearing', String(deg).padStart(3, '0') + '°', 'is-live'],
          ['Contacts', String(contacts)],
          ['Match', 'NONE', 'is-bad'],
        ]);
      },
    };
  };

  /* ---- 405 · DRUM -----------------------------------------------
     The methods on a turning drum. It slows, lands one in the window,
     and the window refuses it. The window's brackets are furniture; the
     refusal is red. */
  scenes.drum = () => {
    const M = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'];
    const N = M.length, step = TAU / N;
    let th = 0, from = 0, to = 0, phase = 'spin', t0 = 0, landed = 4, tries = 0, vel = 0;
    function plan(t) {
      let k; do { k = Math.floor(srand() * N); } while (k === 0 || k === 6 || k === landed);
      from = th;
      // item k sits in the window when th + k*step ≡ 0
      let target = -k * step;
      while (target < from + TAU * 2) target += TAU;
      to = target; t0 = t; phase = 'spin'; landed = k;
    }
    plan(0);
    return {
      still: 3.4,
      step(dt, t) {
        const prev = th;
        if (phase === 'spin') {
          const u = clamp((t - t0) / 2.8, 0, 1);
          th = from + (to - from) * easeOut(u);
          if (u >= 1) { phase = 'hold'; t0 = t; tries++; }
        } else if (t - t0 > 2) {
          plan(t);
        }
        vel = (th - prev) / Math.max(dt, 1e-3);
      },
      draw(t) {
        const fs = clamp(S.w / 9, 26, 56), Rd = fs * 2.3, cx = S.x, cy = S.y;
        ctx.font = mono(fs, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; tracked(fs * .06);
        const blur = clamp(Math.abs(vel) / 18, 0, 1);
        for (let i = 0; i < N; i++) {
          const phi = th + i * step;
          const c = Math.cos(phi); if (c <= .02) continue;
          const y = cy + Rd * Math.sin(phi);
          const inWin = phase === 'hold' && i === landed;
          for (let g = blur > .1 ? 2 : 0; g >= 0; g--) {
            ctx.save();
            ctx.translate(cx, y + g * blur * 9);
            ctx.scale(1, c);
            ctx.fillStyle = inWin ? rgba(C.red, 1) : rgba(C.chrome, Math.pow(c, 2.2) * (g ? .18 : .85));
            ctx.fillText(M[i], 0, 0);
            ctx.restore();
          }
          if (inWin) {
            const w = ctx.measureText(M[i]).width;
            const u = clamp((t - t0) / .25, 0, 1);
            ctx.strokeStyle = rgba(C.red, 1); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx - w / 2 - 8, y); ctx.lineTo(cx - w / 2 - 8 + (w + 16) * u, y); ctx.stroke();
            ctx.lineWidth = 1;
          }
        }
        // the window and the drum's edges
        const wh = fs * 1.5, ww = Math.min(S.w * .9, fs * 6.2);
        brackets(cx - ww / 2, cy - wh / 2, ww, wh, 14, phase === 'hold' ? rgba(C.red, .9) : rgba(C.chrome, .9));
        ctx.strokeStyle = rgba(C.chrome, .14);
        ctx.beginPath();
        ctx.moveTo(cx - ww / 2, cy - Rd - fs * .3); ctx.lineTo(cx + ww / 2, cy - Rd - fs * .3);
        ctx.moveTo(cx - ww / 2, cy + Rd + fs * .3); ctx.lineTo(cx + ww / 2, cy + Rd + fs * .3);
        ctx.stroke();
        if (phase === 'hold') {
          ctx.font = mono(10); tracked(2); ctx.fillStyle = rgba(C.red, clamp((t - t0) * 4, 0, 1));
          ctx.fillText('NOT ON THIS ROUTE', cx, cy + wh / 2 + 18);
        }
        ctx.textAlign = 'start'; tracked(0);
        hud([
          ['Method', phase === 'hold' ? M[landed] : '…', phase === 'hold' ? 'is-bad' : 'is-live'],
          ['Verdict', phase === 'hold' ? '405' : '—', phase === 'hold' ? 'is-bad' : ''],
          ['Tries', String(tries)],
        ]);
      },
    };
  };

  /* ---- 408 · DIAL -----------------------------------------------
     Sixty ticks and a hand. Every second the hand passes comes loose
     and drifts off; when the last one goes the dial times out, in red,
     and the ticks come back for the next try. */
  scenes.clock = () => {
    const PERIOD = 11, LIMIT = 30;
    let u = 0, phase = 'run', t0 = 0;
    const ticks = [];
    for (let i = 0; i < 60; i++) ticks.push({ off: false, x: 0, y: 0, vx: 0, vy: 0, a: 1, rot: 0, vr: 0, back: 0 });
    return {
      still: 8.4,
      step(dt, t) {
        if (phase === 'run') {
          u = Math.min(1, u + dt / PERIOD);
          const R = S.R * .8;
          const spent = Math.floor(u * 60);
          for (let i = 0; i < spent; i++) {
            const k = ticks[i];
            if (!k.off) {
              const q = -Math.PI / 2 + i * TAU / 60;
              k.off = true; k.x = S.x + Math.cos(q) * R; k.y = S.y + Math.sin(q) * R;
              k.vx = Math.cos(q) * rand(10, 40) + rand(-10, 10); k.vy = Math.sin(q) * rand(10, 40) + rand(5, 25);
              k.rot = q; k.vr = rand(-1.5, 1.5); k.a = 1;
            }
          }
          if (u >= 1) { phase = 'out'; t0 = t; }
        } else if (phase === 'out' && t - t0 > 1.6) {
          phase = 'back'; t0 = t;
          ticks.forEach((k, i) => { k.back = t + i * .012; });
        } else if (phase === 'back' && t - t0 > 1.3) {
          phase = 'run'; u = 0; ticks.forEach((k) => { k.off = false; });
        }
        for (const k of ticks) {
          if (!k.off) continue;
          k.x += k.vx * dt; k.y += k.vy * dt; k.vy += 30 * dt; k.rot += k.vr * dt;
          k.a = Math.max(0, k.a - dt * .45);
        }
      },
      draw(t) {
        const R = S.R * .8, cx = S.x, cy = S.y;
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(C.chrome, .08); ctx.beginPath(); ctx.arc(cx, cy, R * .72, 0, TAU); ctx.stroke();
        ticks.forEach((k, i) => {
          const q = -Math.PI / 2 + i * TAU / 60, l = i % 5 ? 10 : 22;
          // the slot the tick came from stays, faintly
          ctx.strokeStyle = rgba(C.chrome, .07);
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(q) * R, cy + Math.sin(q) * R);
          ctx.lineTo(cx + Math.cos(q) * (R - l), cy + Math.sin(q) * (R - l)); ctx.stroke();
          let a = i % 5 ? .45 : .85, x = cx + Math.cos(q) * R, y = cy + Math.sin(q) * R, rot = q;
          if (k.off) { a *= k.a; x = k.x; y = k.y; rot = k.rot; }
          if (phase === 'back' && k.off) { a = (i % 5 ? .45 : .85) * clamp((t - k.back) / .3, 0, 1); x = cx + Math.cos(q) * R; y = cy + Math.sin(q) * R; rot = q; }
          if (a <= .01) return;
          ctx.strokeStyle = rgba(C.chrome, a);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(rot) * l, y - Math.sin(rot) * l); ctx.stroke();
        });
        const out = phase !== 'run';
        if (out && phase === 'out') {
          ctx.strokeStyle = rgba(C.red, .8 * Math.max(0, 1 - (t - t0) / 1.6)); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, R + 8, 0, TAU); ctx.stroke(); ctx.lineWidth = 1;
        }
        // the hand, and the arc it has swept
        const q = -Math.PI / 2 + u * TAU;
        if (!out) {
          ctx.strokeStyle = rgba(C.acc, .35); ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, R * .72, Math.max(-Math.PI / 2, q - .6), q); ctx.stroke(); ctx.lineWidth = 1;
        }
        ctx.strokeStyle = out ? rgba(C.red, .9) : rgba(C.acc, 1); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - Math.cos(q) * 14, cy - Math.sin(q) * 14); ctx.lineTo(cx + Math.cos(q) * R * .94, cy + Math.sin(q) * R * .94); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = out ? rgba(C.red, 1) : rgba(C.acc, 1); ctx.fillRect(cx - 3, cy - 3, 6, 6);
        // the figure
        const secs = (u * LIMIT).toFixed(2);
        ctx.font = mono(clamp(S.R * .16, 18, 34), 500); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; tracked(1);
        ctx.fillStyle = out ? rgba(C.red, 1) : rgba(C.text, .95);
        ctx.fillText(out ? '30.00' : secs, cx, cy + R * .36);
        ctx.font = mono(9); tracked(2.2); ctx.fillStyle = out ? rgba(C.red, .9) : rgba(C.label, .9);
        ctx.fillText(out ? 'TIMED OUT' : 'SECONDS', cx, cy + R * .36 + 24);
        ctx.textAlign = 'start'; tracked(0);
        hud([
          ['Elapsed', (out ? '30.00' : secs) + ' s', out ? 'is-bad' : 'is-live'],
          ['Limit', LIMIT.toFixed(2) + ' s'],
          ['State', out ? 'TIMEOUT' : 'WAITING', out ? 'is-bad' : ''],
        ]);
      },
    };
  };

  /* ---- 410 · DUST -----------------------------------------------
     The numeral comes apart from its left edge and blows away across the
     stage, then — because a page has to be looked at more than once —
     gathers itself again. The pointer is a wind. */
  scenes.dust = () => {
    let g = numeralGeometry(), pts = [], parts = [], minX = 0, spanX = 1;
    function build() {
      g = numeralGeometry(); if (!g) return;
      const gap = g.box.height > 140 ? 3 : 2;
      pts = numeralPoints(g, gap);
      minX = g.box.left; spanX = g.box.width;
      parts = pts.map(([x, y]) => ({
        hx: x, hy: y, x, y, vx: 0, vy: 0, a: 1, s: gap,
        rel: (x - minX) / spanX * 3.2 + srand() * .7,
        col: mix(C.titleA, C.titleB, clamp((y - g.box.top) / g.box.height, 0, 1)),
        free: false,
      }));
    }
    build();
    const CYCLE = 11.5;
    let lastW = W;
    return {
      // half gone: the 4 is dust, the rest still reads
      still: 2.7,
      resize() { build(); },
      step(dt, t) {
        if (W !== lastW) { lastW = W; build(); }
        const c = t % CYCLE;
        for (const p of parts) {
          if (c < 1.6) {                      // whole
            p.free = false; p.x = p.hx; p.y = p.hy; p.a = 1;
          } else if (c < 8.4) {               // blowing away
            if (!p.free && c - 1.6 > p.rel) { p.free = true; p.vx = rand(40, 110); p.vy = rand(-22, 6); }
            if (p.free) {
              p.vx += (60 + wob(p.hy * .05 + t) * 40) * dt;
              p.vy += wob(p.hx * .03 + t * 1.3) * 40 * dt;
              if (P.on) {
                const dx = p.x - P.x, dy = p.y - P.y, d2 = dx * dx + dy * dy;
                if (d2 < 9000) { const f = (1 - d2 / 9000) * 900 * dt; const d = Math.sqrt(d2) || 1; p.vx += dx / d * f; p.vy += dy / d * f; }
              }
              p.x += p.vx * dt; p.y += p.vy * dt;
              p.a = Math.max(0, p.a - dt * .32);
            }
          } else if (c < 9.4) {               // nothing
            p.a = 0;
          } else {                            // gathering
            const u = ease(clamp((c - 9.4) / 2, 0, 1));
            if (p.free) { p.sx = p.x; p.sy = p.y; p.free = false; }
            const sx = p.sx ?? p.hx, sy = p.sy ?? p.hy;
            p.x = lerp(sx, p.hx, u); p.y = lerp(sy, p.hy, u); p.a = u;
          }
        }
        if (c >= CYCLE - .05) parts.forEach((p) => { p.sx = undefined; p.sy = undefined; });
      },
      draw(t) {
        if (!g) return;
        // hand the numeral over only once the canvas has one to show
        body.classList.add('err--drawn');
        const c = t % CYCLE;
        // the geometry was taken at one scroll position; follow the page
        ctx.save();
        ctx.translate(0, codeEl.getBoundingClientRect().top - g.box.top);
        if (c < 1.6) { drawNumeral(g, ctx, 1); }
        else if (c < 8.4) {
          // the part the front has not reached yet stays crisp type
          const front = minX + (c - 1.6) / 3.2 * spanX;
          ctx.save(); ctx.beginPath(); ctx.rect(front + spanX * .22, 0, W, H); ctx.clip();
          drawNumeral(g, ctx, 1); ctx.restore();
          for (const p of parts) {
            if (!p.free && p.hx > front + spanX * .22) continue;
            if (p.a <= .02) continue;
            ctx.fillStyle = rgba(p.col, p.a);
            ctx.fillRect(p.x, p.y, p.s, p.s);
          }
        } else {
          for (const p of parts) {
            if (p.a <= .02) continue;
            ctx.fillStyle = rgba(p.col, p.a);
            ctx.fillRect(p.x, p.y, p.s, p.s);
          }
        }
        ctx.restore();
        const left = c < 1.6 ? 100 : c < 8.4 ? Math.round(100 * (1 - clamp((c - 1.6) / 4.4, 0, 1))) : c < 9.4 ? 0 : Math.round(100 * clamp((c - 9.4) / 2, 0, 1));
        hud([['Residue', left + '%'], ['Forward', 'NONE'], ['Returns', 'NEVER', 'is-bad']]);
      },
    };
  };

  /* ---- 413 · OVERFLOW -------------------------------------------
     A container with a marked limit, filling with blocks. Past the line
     they turn red and spill over the side; when enough have spilled the
     floor opens and it starts again. */
  scenes.press = () => {
    let cols = 7, cap = 8, bs = 30, box = null;
    let heights = [], blocks = [], spawnT = 0, spilled = 0, flushT = -1;
    const MB = .41;
    function layout() {
      const cw = Math.min(S.w * .56, 320);
      bs = Math.floor(cw / cols);
      const ch = Math.min(S.h * .62, bs * 9);
      cap = Math.floor(ch / bs);
      box = { x: S.x - (bs * cols) / 2, y: S.y + ch / 2 - cap * bs, w: bs * cols, h: cap * bs };
    }
    function reset() { heights = new Array(cols).fill(0); blocks = []; spilled = 0; flushT = -1; }
    layout(); reset();
    let lastW = S.w, lastH = S.h;
    return {
      still: 9,
      step(dt, t) {
        if (S.w !== lastW || S.h !== lastH) { lastW = S.w; lastH = S.h; layout(); reset(); }
        if (flushT < 0 && t > spawnT) {
          spawnT = t + .1;
          const c = Math.floor(srand() * cols);
          blocks.push({ c, x: box.x + c * bs, y: S.t - bs, vy: 0, state: 'fall', vx: 0, a: 1, rot: 0, vr: 0 });
        }
        for (const b of blocks) {
          if (b.state === 'fall') {
            b.vy += 1400 * dt; b.y += b.vy * dt;
            const floor = box.y + box.h - (heights[b.c] + 1) * bs;
            if (b.y >= floor) {
              b.y = floor; b.vy = 0; heights[b.c]++;
              if (heights[b.c] > cap) {
                b.state = 'spill'; heights[b.c]--; spilled++;
                b.vx = (b.c < cols / 2 ? -1 : 1) * rand(80, 160); b.vy = -rand(80, 200); b.vr = rand(-4, 4);
              } else b.state = 'rest';
            }
          } else if (b.state === 'spill' || b.state === 'drop') {
            b.vy += 1400 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
            b.a = Math.max(0, b.a - dt * .6);
          }
        }
        blocks = blocks.filter((b) => b.a > 0 && b.y < H + 60);
        if (flushT < 0 && spilled >= 14) {
          flushT = t;
          blocks.forEach((b) => { if (b.state === 'rest') { b.state = 'drop'; b.vy = rand(0, 80); b.vx = rand(-20, 20); b.vr = rand(-1, 1); } });
        }
        if (flushT >= 0 && t - flushT > 1.6) reset();
      },
      draw(t) {
        // the container
        ctx.lineWidth = 1; ctx.strokeStyle = rgba(C.chrome, .5);
        ctx.beginPath();
        ctx.moveTo(box.x, box.y - bs * .6); ctx.lineTo(box.x, box.y + box.h);
        if (flushT < 0) ctx.lineTo(box.x + box.w, box.y + box.h); else ctx.moveTo(box.x + box.w, box.y + box.h);
        ctx.lineTo(box.x + box.w, box.y - bs * .6); ctx.stroke();
        // the limit
        ctx.strokeStyle = rgba(C.red, .85); ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(box.x - 16, box.y); ctx.lineTo(box.x + box.w + 16, box.y); ctx.stroke();
        ctx.setLineDash([]);
        // the ruler
        ctx.strokeStyle = rgba(C.chrome, .35); ctx.font = mono(9); ctx.textBaseline = 'middle'; tracked(1.2);
        const rx = box.x + box.w + 26;
        for (let i = 0; i <= cap; i++) {
          const y = box.y + box.h - i * bs;
          ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + (i % 2 ? 4 : 8), y); ctx.stroke();
        }
        ctx.fillStyle = rgba(C.red, .95); ctx.fillText('LIMIT', rx + 12, box.y);
        ctx.fillStyle = rgba(C.label, .8); ctx.fillText('0', rx + 12, box.y + box.h);
        tracked(0);
        // the blocks
        for (const b of blocks) {
          const over = b.state === 'spill';
          ctx.save();
          ctx.translate(b.x + bs / 2, b.y + bs / 2); ctx.rotate(b.rot);
          ctx.fillStyle = over ? rgba(C.red, .14 * b.a) : rgba(C.chrome, .07 * b.a);
          ctx.fillRect(-bs / 2 + 1.5, -bs / 2 + 1.5, bs - 3, bs - 3);
          ctx.strokeStyle = over ? rgba(C.red, .9 * b.a) : rgba(C.chrome, .45 * b.a);
          ctx.strokeRect(-bs / 2 + 1.5, -bs / 2 + 1.5, bs - 3, bs - 3);
          ctx.restore();
        }
        const inBox = heights.reduce((s, h) => s + h, 0);
        const size = (inBox + spilled) * MB, limit = cols * cap * MB;
        const over = Math.max(0, Math.round((size / limit - 1) * 100));
        hud([
          ['Payload', size.toFixed(2) + ' MB', over ? 'is-bad' : 'is-live'],
          ['Limit', limit.toFixed(2) + ' MB'],
          ['Over', over ? '+' + over + '%' : '—', over ? 'is-bad' : ''],
        ]);
      },
    };
  };

  /* ---- 429 · RATE GATE ------------------------------------------
     Requests stream at a gate that lets one through per beat; the rest
     bounce off and fall. The one admitted is the live thing. The DOM
     meter is the real cool-down: Retry-After, when the server puts it
     on <body data-retry-after>, else thirty seconds. It counts down
     even in the still frame — it is information, not motion. */
  scenes.bucket = () => {
    const total = Math.max(1, parseInt(body.dataset.retryAfter, 10) || 30);
    const startAt = performance.now();
    const meter = doc.querySelector('[data-wait]');
    const fill = meter && meter.querySelector('.meter__fill');
    const figure = doc.querySelector('[data-wait-n]');
    const btn = doc.querySelector('[data-retry]');
    const label = doc.querySelector('[data-retry-label]');
    if (meter) meter.setAttribute('aria-valuemax', String(total));
    let left = total;
    function tickWait() {
      left = Math.max(0, total - (performance.now() - startAt) / 1000);
      const s = Math.ceil(left);
      if (fill) meter.style.setProperty('--p', (left / total * 100).toFixed(1));
      if (meter) meter.setAttribute('aria-valuenow', String(s));
      if (figure) figure.textContent = s ? s + ' s' : 'Ready';
      if (btn) btn.disabled = s > 0;
      if (label) label.textContent = s ? `Try again · ${s}s` : 'Try again';
      if (s > 0) setTimeout(tickWait, 250);
    }
    tickWait();

    const pk = [];
    let emitT = 0, token = 1, sent = 0, admitted = 0;
    return {
      still: 4,
      step(dt, t) {
        const calm = 1 - left / total;
        const rate = lerp(24, 3, calm);
        token = Math.min(1, token + dt * lerp(.7, 2.2, calm));
        if (t > emitT) {
          emitT = t + 1 / rate;
          pk.push({ x: S.l + rand(0, 24), y: S.y + rand(-S.h * .3, S.h * .3), vx: rand(300, 420), vy: 0, st: 'go', a: 1 });
          sent++;
        }
        const gx = S.x;
        for (const p of pk) {
          if (p.st === 'go' && p.x + 6 >= gx - 4 && p.x < gx) {
            if (token >= 1 && Math.abs(p.y - S.y) < S.h * .32) { token = 0; p.st = 'in'; admitted++; p.y = lerp(p.y, S.y, .0); }
            else { p.st = 'off'; p.vx = -p.vx * rand(.2, .4); p.vy = rand(-160, -40); }
          }
          if (p.st === 'off') { p.vy += 900 * dt; p.a -= dt * .7; }
          if (p.st === 'in') { p.vy += (S.y - p.y) * 6 * dt; p.vy *= .9; p.a -= dt * .25; }
          p.x += p.vx * dt; p.y += p.vy * dt;
        }
        for (let i = pk.length - 1; i >= 0; i--) if (pk[i].a <= 0 || pk[i].x > W + 20 || pk[i].y > H + 20) pk.splice(i, 1);
      },
      draw(t) {
        const gx = S.x, gh = S.h * .7;
        // the gate
        ctx.strokeStyle = rgba(C.chrome, .55); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx, S.y - gh / 2); ctx.lineTo(gx, S.y - 9);
        ctx.moveTo(gx, S.y + 9); ctx.lineTo(gx, S.y + gh / 2); ctx.stroke();
        for (let y = S.y - gh / 2; y < S.y + gh / 2; y += 12) {
          ctx.strokeStyle = rgba(C.chrome, .18);
          ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + 6, y + 6); ctx.stroke();
        }
        brackets(gx - 14, S.y - 14, 28, 28, 7, token >= 1 ? rgba(C.acc, 1) : rgba(C.chrome, .5));
        // the packets
        for (const p of pk) {
          if (p.st === 'in') {
            ctx.fillStyle = rgba(C.acc, Math.max(0, p.a));
            ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
            ctx.fillStyle = rgba(C.acc, Math.max(0, p.a) * .25);
            ctx.fillRect(p.x - 40, p.y - 1, 34, 2);
          } else {
            ctx.strokeStyle = rgba(p.st === 'off' ? C.red : C.chrome, Math.max(0, p.a) * (p.st === 'off' ? .7 : .6));
            ctx.strokeRect(p.x - 4.5, p.y - 4.5, 9, 9);
          }
        }
        hud([
          ['Sent', String(sent)],
          ['Admitted', String(admitted), 'is-live'],
          ['Refused', String(Math.max(0, sent - admitted - pk.filter((p) => p.st === 'go').length)), 'is-bad'],
        ]);
      },
    };
  };

  /* ---- 500 · TESSERACT ------------------------------------------
     The core: a four-dimensional cube turning in planes we cannot see.
     Its inner cell is the fault, pulsing red. Every few seconds the
     signal tears — the canvas slices itself sideways and the numeral
     tears with it. */
  scenes.tesseract = () => {
    const V = [];
    for (let i = 0; i < 16; i++) V.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
    const E = [];
    for (let i = 0; i < 16; i++) for (let k = 0; k < 4; k++) { const j = i ^ (1 << k); if (j > i) E.push([i, j]); }
    let nextTear = 2.2, tearUntil = -1;
    return {
      still: 1.7,
      step(dt, t) {
        if (still) return;
        if (t > nextTear) {
          tearUntil = t + .38; nextTear = t + rand(2.4, 5.2);
          if (codeEl) { codeEl.classList.remove('is-tearing'); void codeEl.offsetWidth; codeEl.classList.add('is-tearing'); }
        }
        if (codeEl && t > tearUntil + .05) codeEl.classList.remove('is-tearing');
      },
      draw(t) {
        const a = t * .42, b = t * .27, c = t * .19;
        const sc = S.R * .9;
        const tearing = t < tearUntil;
        const P2 = V.map(([x, y, z, w]) => {
          let x1 = x * Math.cos(a) - w * Math.sin(a), w1 = x * Math.sin(a) + w * Math.cos(a);
          let y1 = y * Math.cos(b) - z * Math.sin(b), z1 = y * Math.sin(b) + z * Math.cos(b);
          let x2 = x1 * Math.cos(c) - z1 * Math.sin(c), z2 = x1 * Math.sin(c) + z1 * Math.cos(c);
          const k4 = 2.6 / (3.2 - w1);
          let X = x2 * k4, Y = y1 * k4, Z = z2 * k4;
          const k3 = 3.4 / (4.4 - Z);
          let sx = S.x + X * k3 * sc * .5, sy = S.y + Y * k3 * sc * .5;
          if (tearing) { sx += rand(-6, 6); sy += rand(-2, 2); }
          return [sx, sy, w1];
        });
        const drawEdges = (dx, col) => {
          for (const [i, j] of E) {
            const inner = V[i][3] < 0 && V[j][3] < 0;
            const depth = (P2[i][2] + P2[j][2]) / 4 + .5;
            if (col) ctx.strokeStyle = col;
            else if (inner) ctx.strokeStyle = rgba(C.red, .45 + .4 * (.5 + .5 * Math.sin(t * 3.2)));
            else ctx.strokeStyle = rgba(C.chrome, .18 + .5 * depth);
            ctx.beginPath(); ctx.moveTo(P2[i][0] + dx, P2[i][1]); ctx.lineTo(P2[j][0] + dx, P2[j][1]); ctx.stroke();
          }
        };
        ctx.lineWidth = 1;
        if (tearing) {
          ctx.globalCompositeOperation = 'screen';
          drawEdges(-5, rgba(C.accSoft, .55));
          drawEdges(5, rgba(C.mist, .55));
          ctx.globalCompositeOperation = 'source-over';
        }
        drawEdges(0, null);
        for (const p of P2) { ctx.fillStyle = rgba(C.chrome, .8); ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3); }
        // scanlines over the stage
        ctx.fillStyle = rgba(C.bg, .22);
        for (let y = Math.floor(S.t); y < S.b; y += 3) ctx.fillRect(S.l, y, S.w, 1);
        // the tear: slices of the frame copied sideways onto itself
        if (tearing) {
          ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
          for (let k = 0; k < 5; k++) {
            const y = (S.t + rand(0, S.h)) * DPR, h = rand(4, 26) * DPR, off = rand(-28, 28) * DPR;
            ctx.drawImage(cv, S.l * DPR, y, S.w * DPR, h, S.l * DPR + off, y, S.w * DPR, h);
          }
          ctx.restore();
        }
        hud([['Core', 'FAULT', 'is-bad'], ['Cell', 'INNER · w−1'], ['Retry', 'SAFE']]);
      },
    };
  };

  /* ---- 502 · BROKEN LINK ----------------------------------------
     This server on the left, the one behind it on the right, and a link
     between them that is broken in the middle. Our requests (the live
     thing) cross to the break and burst; now and then the far side
     answers, garbled, in red. */
  scenes.gateway = () => {
    const pk = [], sparks = [];
    let sendT = 0, replyT = 1.5, sent = 0, replies = 0;
    const ends = () => {
      const pad = Math.min(60, S.w * .1);
      return { ax: S.l + pad, bx: S.r - pad, y: S.y, gap: Math.min(34, S.w * .06) };
    };
    function burst(x, y, col, n) {
      for (let i = 0; i < n; i++) sparks.push({ x, y, vx: rand(-120, 120), vy: rand(-160, 40), a: 1, col });
    }
    return {
      still: 2.6,
      step(dt, t) {
        const e = ends();
        if (t > sendT) { sendT = t + .55; pk.push({ x: e.ax + 26, dir: 1 }); sent++; }
        if (t > replyT) { replyT = t + rand(2.6, 4); pk.push({ x: e.bx - 26, dir: -1 }); replies++; }
        for (let i = pk.length - 1; i >= 0; i--) {
          const p = pk[i];
          p.x += p.dir * 210 * dt;
          const gx = S.x - p.dir * e.gap;
          if ((p.dir > 0 && p.x >= gx) || (p.dir < 0 && p.x <= gx)) {
            burst(gx, e.y, p.dir > 0 ? C.chrome : C.red, p.dir > 0 ? 9 : 14);
            pk.splice(i, 1);
          }
        }
        for (const s of sparks) { s.vy += 420 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.a -= dt * 1.3; }
        for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].a <= 0) sparks.splice(i, 1);
      },
      draw(t) {
        const e = ends();
        ctx.lineWidth = 1;
        // the link, with a jagged break in the middle
        ctx.strokeStyle = rgba(C.chrome, .45);
        ctx.beginPath();
        ctx.moveTo(e.ax + 23, e.y); ctx.lineTo(S.x - e.gap, e.y);
        for (let k = 0; k < 3; k++) ctx.lineTo(S.x - e.gap + 4 + k * 3, e.y + (k % 2 ? 5 : -5) + wob(t * 9 + k) * 2);
        ctx.moveTo(e.bx - 23, e.y); ctx.lineTo(S.x + e.gap, e.y);
        for (let k = 0; k < 3; k++) ctx.lineTo(S.x + e.gap - 4 - k * 3, e.y + (k % 2 ? -5 : 5) + wob(t * 8 + k + 3) * 2);
        ctx.stroke();
        // the break crackles: a jagged arc that never quite closes it
        if (Math.random() < .4) {
          const x0 = S.x - e.gap + 12, x1 = S.x + e.gap - 12, n = 7;
          ctx.strokeStyle = rgba(C.chrome, rand(.25, .75));
          ctx.beginPath(); ctx.moveTo(x0, e.y);
          for (let k = 1; k < n; k++) ctx.lineTo(lerp(x0, x1, k / n), e.y + rand(-14, 14));
          ctx.stroke();
        }
        // the two nodes
        [[e.ax, 'EDGE', 'this server'], [e.bx, 'UPSTREAM', '']].forEach(([x, lab], i) => {
          ctx.fillStyle = rgba(C.chrome, .06); ctx.fillRect(x - 22, e.y - 22, 44, 44);
          ctx.strokeStyle = rgba(C.chrome, .55); ctx.strokeRect(x - 22.5, e.y - 22.5, 45, 45);
          ctx.strokeStyle = rgba(C.chrome, .25); ctx.strokeRect(x - 10.5, e.y - 10.5, 21, 21);
          if (i === 1) { ctx.fillStyle = rgba(C.red, .55 + .45 * Math.sin(t * 5)); ctx.fillRect(x - 3, e.y - 3, 6, 6); }
          else { ctx.fillStyle = rgba(C.chrome, .9); ctx.fillRect(x - 3, e.y - 3, 6, 6); }
          ctx.font = mono(10); ctx.textAlign = 'center'; tracked(2); ctx.fillStyle = rgba(C.label, .9);
          ctx.fillText(lab, x, e.y + 42);
          ctx.textAlign = 'start'; tracked(0);
        });
        // in flight
        const GL = '#%&?!<>';
        ctx.font = mono(10, 600); ctx.textBaseline = 'middle';
        for (const p of pk) {
          if (p.dir > 0) {
            ctx.fillStyle = rgba(C.acc, .25); ctx.fillRect(p.x - 30, e.y - 1, 26, 2);
            ctx.fillStyle = rgba(C.acc, 1); ctx.fillRect(p.x - 4, e.y - 4, 8, 8);
          } else {
            ctx.fillStyle = rgba(C.red, .95);
            ctx.fillText(GL[Math.floor(t * 20 + p.x) % GL.length], p.x - 3, e.y - 12);
            ctx.strokeStyle = rgba(C.red, .9); ctx.strokeRect(p.x - 3.5, e.y - 3.5, 7, 7);
          }
        }
        for (const s of sparks) { ctx.fillStyle = rgba(s.col, Math.max(0, s.a)); ctx.fillRect(s.x, s.y, 2, 2); }
        hud([['Sent', String(sent), 'is-live'], ['Replies', String(replies)], ['Valid', '0', 'is-bad']]);
      },
    };
  };

  /* ---- 503 · ECLIPSE --------------------------------------------
     The light is behind something, on purpose, for a while. A corona of
     rays in the mist; the black disc of the moon over it, drifting with
     the pointer so the bright rim shows on one side. One bead of light —
     the diamond ring — is the live thing: it is what comes back. */
  scenes.eclipse = () => {
    const stars = starfield(Math.round(W * H / 7000));
    const RAYS = 260;
    const ray = [];
    for (let i = 0; i < RAYS; i++) ray.push({ a: i / RAYS * TAU + srand() * .02, p: srand() * 50, w: srand() });
    let mx = 0, my = 0;
    const eta = body.dataset.eta;
    return {
      still: 2,
      step(dt, t) {
        stars.step(dt);
        const tx = Math.sin(t * .23) * 5 + (P.on ? clamp((P.x - S.x) / W, -.5, .5) * 36 : 0);
        const ty = Math.cos(t * .19) * 4 + (P.on ? clamp((P.y - S.y) / H, -.5, .5) * 36 : 0);
        mx = lerp(mx, tx, Math.min(1, dt * 2.4)); my = lerp(my, ty, Math.min(1, dt * 2.4));
      },
      draw(t) {
        stars.draw(t);
        const R = S.R * .42, cx = S.x, cy = S.y;
        // the glow
        const g = ctx.createRadialGradient(cx, cy, R * .95, cx, cy, R * 2.6);
        g.addColorStop(0, rgba(C.mist1, .38));
        g.addColorStop(.25, rgba(C.mist2, .12));
        g.addColorStop(1, rgba(C.mist3, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 2.6, 0, TAU); ctx.fill();
        // the rays
        for (const r of ray) {
          const L = R * (.12 + 1.05 * Math.pow(.5 + .5 * wob(r.a * 3 + r.p + t * .12), 2.2));
          ctx.strokeStyle = rgba(r.w > .7 ? C.titleA : C.mist1, .05 + .14 * r.w);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(r.a) * R, cy + Math.sin(r.a) * R);
          ctx.lineTo(cx + Math.cos(r.a) * (R + L), cy + Math.sin(r.a) * (R + L));
          ctx.stroke();
        }
        // the rim
        ctx.save();
        ctx.shadowColor = rgba(C.titleA, .9); ctx.shadowBlur = 24;
        ctx.strokeStyle = rgba(C.titleA, .95); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
        ctx.restore();
        // the moon
        ctx.fillStyle = rgba(C.bg, 1);
        ctx.beginPath(); ctx.arc(cx + mx, cy + my, R * 1.005, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(C.chrome, .06); ctx.lineWidth = 1; ctx.stroke();
        // the diamond ring, on the side the moon has drifted away from
        const q = Math.atan2(-my, -mx || -.001);
        const bx = cx + Math.cos(q) * R, by = cy + Math.sin(q) * R;
        const bg = ctx.createRadialGradient(bx, by, 0, bx, by, R * .5);
        bg.addColorStop(0, rgba(C.titleA, .95));
        bg.addColorStop(.08, rgba(C.accSoft, .6));
        bg.addColorStop(.4, rgba(C.acc, .12));
        bg.addColorStop(1, rgba(C.acc, 0));
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bx, by, R * .5, 0, TAU); ctx.fill();
        hud([['State', 'MAINTENANCE'], ['Back', eta || 'SOON', 'is-live'], ['Data', 'SAFE']]);
      },
    };
  };

  /* ---- 504 · SONAR ----------------------------------------------
     A ping goes out across the stage toward a server that is only a dot
     at the far edge. The rings pass it; nothing comes back. Underneath,
     the trace: a spike for every ping, and flat where the echo should be. */
  scenes.sonar = () => {
    const rings = [];
    let pingT = 0, pings = 0, waited = 0;
    const trace = [];
    return {
      still: 4.2,
      step(dt, t) {
        waited += dt;
        if (t > pingT) { pingT = t + 1.8; rings.push(t); pings++; trace.push({ t, kind: 'ping' }); }
        while (rings.length && t - rings[0] > 6) rings.shift();
        while (trace.length && t - trace[0].t > 12) trace.shift();
      },
      draw(t) {
        const ex = S.l + S.w * .2, ey = S.y - S.h * .08;
        const tx = S.r - 24, ty = S.y - S.h * .28;
        const dist = Math.hypot(tx - ex, ty - ey);
        // the expected echo distance
        ctx.setLineDash([3, 6]); ctx.strokeStyle = rgba(C.chrome, .2);
        ctx.beginPath(); ctx.arc(ex, ey, dist, -.9, .5); ctx.stroke(); ctx.setLineDash([]);
        // the rings stay on the stage: they are not allowed over the words
        ctx.save(); ctx.beginPath(); ctx.rect(S.l - 20, S.t, S.w + 40, S.h); ctx.clip();
        for (const r0 of rings) {
          const age = t - r0, rad = age * 150;
          const a = Math.max(0, 1 - rad / (dist * 1.25));
          ctx.strokeStyle = rgba(C.acc, .75 * a); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(ex, ey, rad, 0, TAU); ctx.stroke();
        }
        ctx.restore();
        ctx.lineWidth = 1;
        // emitter and target
        ctx.fillStyle = rgba(C.acc, 1); ctx.fillRect(ex - 4, ey - 4, 8, 8);
        brackets(ex - 12, ey - 12, 24, 24, 6, rgba(C.chrome, .8));
        const near = rings.some((r0) => Math.abs((t - r0) * 150 - dist) < 10);
        ctx.strokeStyle = rgba(C.chrome, near ? .9 : .4); ctx.strokeRect(tx - 5.5, ty - 5.5, 11, 11);
        ctx.font = mono(9); tracked(1.8); ctx.fillStyle = rgba(C.label, .85); ctx.textAlign = 'right';
        ctx.fillText('UPSTREAM', tx + 6, ty - 16);
        ctx.fillStyle = rgba(C.red, near ? 1 : .5); ctx.fillText('NO ECHO', tx + 6, ty + 22);
        ctx.textAlign = 'start'; tracked(0);
        // the trace
        const y0 = S.b - 92, x0 = S.l, w = S.w, span = 12;
        ctx.strokeStyle = rgba(C.chrome, .12); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.stroke();
        ctx.strokeStyle = rgba(C.chrome, .7); ctx.beginPath();
        for (let i = 0; i <= w; i += 2) {
          const tt = t - span + i / w * span;
          let y = y0 + wob(tt * 37) * 1.4;
          for (const ev of trace) {
            const d = tt - ev.t;
            if (d > 0 && d < .25) y -= Math.sin(d / .25 * Math.PI) * 26 * (d < .12 ? 1 : -.4);
          }
          i ? ctx.lineTo(x0 + i, y) : ctx.moveTo(x0, y);
        }
        ctx.stroke();
        // where each echo should have been
        ctx.setLineDash([2, 4]); ctx.strokeStyle = rgba(C.red, .5);
        for (const ev of trace) {
          const ex2 = x0 + ((ev.t + dist / 150) - (t - span)) / span * w;
          if (ex2 > x0 && ex2 < x0 + w) { ctx.beginPath(); ctx.moveTo(ex2, y0 - 22); ctx.lineTo(ex2, y0 + 8); ctx.stroke(); }
        }
        ctx.setLineDash([]);
        hud([['Pings', String(pings), 'is-live'], ['Echoes', '0', 'is-bad'], ['Waited', waited.toFixed(1) + ' s']]);
      },
    };
  };

  /* ---- 418 · TEAPOT ---------------------------------------------
     A wireframe teapot, turned on a lathe and given a spout and a
     handle, steaming. Drag to turn it. Drawn in the mist: it is a KIND
     of thing, not a state. */
  scenes.teapot = () => {
    // the body and lid, as a profile (radius, height), turned around y
    const PROF = [[0, 0], [.55, .02], [.86, .14], [1, .38], [.98, .6], [.84, .8], [.62, .93], [.56, .97],
      [.6, 1.0], [.44, 1.07], [.22, 1.13], [.08, 1.17], [.1, 1.24], [.06, 1.29], [0, 1.3]];
    const MER = 20, PAR = 40;
    const lines = [];   // [ [x,y,z], ... ] polylines in model space
    for (const [r, y] of PROF) {
      if (r < .01) continue;
      const pl = [];
      for (let i = 0; i <= PAR; i++) { const a = i / PAR * TAU; pl.push([r * Math.cos(a), y, r * Math.sin(a)]); }
      lines.push(pl);
    }
    for (let m = 0; m < MER; m++) {
      const a = m / MER * TAU, pl = [];
      for (const [r, y] of PROF) pl.push([r * Math.cos(a), y, r * Math.sin(a)]);
      lines.push(pl);
    }
    // a tube along a cubic Bézier in the xy-plane
    const bez = (p, u) => {
      const v = 1 - u;
      return [0, 1].map((k) => v * v * v * p[0][k] + 3 * v * v * u * p[1][k] + 3 * v * u * u * p[2][k] + u * u * u * p[3][k]);
    };
    function tube(ctrl, r0, r1, rings, longs) {
      const rs = [];
      for (let i = 0; i <= rings; i++) {
        const u = i / rings, c = bez(ctrl, u), c2 = bez(ctrl, Math.min(1, u + .01)), c1 = bez(ctrl, Math.max(0, u - .01));
        let tx = c2[0] - c1[0], ty = c2[1] - c1[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
        const nx = -ty, ny = tx, r = lerp(r0, r1, u), ring = [];
        for (let k = 0; k <= 16; k++) {
          const a = k / 16 * TAU;
          ring.push([c[0] + nx * Math.cos(a) * r, c[1] + ny * Math.cos(a) * r, Math.sin(a) * r]);
        }
        rs.push(ring); lines.push(ring);
      }
      for (let k = 0; k < 16; k += 16 / longs) lines.push(rs.map((ring) => ring[k]));
    }
    tube([[.9, .36], [1.38, .36], [1.36, .9], [1.72, 1.06]], .17, .06, 12, 8);   // spout
    tube([[-.86, .86], [-1.6, .98], [-1.56, .22], [-.92, .3]], .075, .075, 14, 4); // handle
    const tip = [1.74, 1.08, 0];

    let yaw = .6, vyaw = .35, drag = null;
    addEventListener('pointerdown', (e) => { if (!onControl(e)) drag = { x: e.clientX, yaw }; });
    addEventListener('pointerup', () => { drag = null; });
    addEventListener('pointermove', (e) => {
      if (!drag) return;
      const ny = drag.yaw + (e.clientX - drag.x) * .01;
      vyaw = clamp((ny - yaw) * 30, -4, 4); yaw = ny;
    });
    const steam = [];
    let puffT = 0;
    const pitch = .34;
    function proj([x, y, z], sc) {
      y -= .62;
      const x1 = x * Math.cos(yaw) + z * Math.sin(yaw), z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
      // tilt toward us, so the near rim sits LOWER: we look down into the pot
      const y2 = y * Math.cos(pitch) + z1 * Math.sin(pitch), z2 = -y * Math.sin(pitch) + z1 * Math.cos(pitch);
      const k = 8 / (8 + z2);   // a long lens: a teapot, not a fisheye
      return [S.x + x1 * sc * k, S.y - y2 * sc * k + S.h * .06, z2];
    }
    return {
      still: 1.5,
      step(dt, t) {
        if (!drag) { yaw += vyaw * dt; vyaw = lerp(vyaw, .35, Math.min(1, dt * .8)); }
        if (t > puffT) {
          puffT = t + (drag ? .03 : .07);
          const sc = S.R * .66, [x, y] = proj(tip, sc);
          steam.push({ x, y, vx: rand(-6, 6), vy: rand(-46, -30), r: rand(2, 4), a: .5, p: srand() * 10 });
        }
        for (const s of steam) { s.y += s.vy * dt; s.x += (s.vx + wob(s.p + t * 1.6) * 16) * dt; s.r += dt * 6; s.a -= dt * .2; }
        for (let i = steam.length - 1; i >= 0; i--) if (steam[i].a <= 0) steam.splice(i, 1);
      },
      draw(t) {
        const sc = S.R * .66;
        ctx.lineWidth = 1;
        for (const pl of lines) {
          let prev = proj(pl[0], sc);
          for (let i = 1; i < pl.length; i++) {
            const p = proj(pl[i], sc);
            const front = clamp(.5 - (prev[2] + p[2]) / 2 * .5, 0, 1);
            ctx.strokeStyle = rgba(C.mist, .08 + .62 * front * front);
            ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
            prev = p;
          }
        }
        for (const s of steam) {
          ctx.strokeStyle = rgba(C.chrome, Math.max(0, s.a) * .55);
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.stroke();
        }
        const deg = Math.round(93 + wob(t * .7) * 1.5);
        hud([['Brewing', 'EARL GREY', 'is-live'], ['Water', deg + ' °C'], ['Coffee', 'REFUSED', 'is-bad']]);
      },
    };
  };

  /* ---- 420 · BREATH ---------------------------------------------
     Box breathing, which suits a language of square corners: in for
     four, hold four, out four, hold four. The squares grow and settle
     with the breath; one point walks the square's edge and is the live
     thing. The meter beside the words keeps the count. */
  scenes.breathe = () => {
    const phaseEl = doc.querySelector('[data-breath-phase]');
    const nEl = doc.querySelector('[data-breath-n]');
    const meter = doc.querySelector('[data-wait]');
    const PH = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];
    const motes = [];
    for (let i = 0; i < 90; i++) motes.push({ a: srand() * TAU, d: .3 + srand() * .9, s: srand() < .2 ? 2 : 1, p: srand() * TAU });
    let lastWords = '';
    const scaleAt = (c) => {
      const ph = Math.floor(c / 4), u = (c % 4) / 4;
      return ph === 0 ? lerp(.5, 1, ease(u)) : ph === 1 ? 1 : ph === 2 ? lerp(1, .5, ease(u)) : .5;
    };
    return {
      still: 4,
      step() {},
      draw(t) {
        const c = t % 16, ph = Math.floor(c / 4), u = (c % 4) / 4;
        const s = scaleAt(c), L = S.R * 1.5, cx = S.x, cy = S.y;
        for (const m of motes) {
          const r = m.d * L * .5 * (.6 + s * .7);
          const x = cx + Math.cos(m.a + t * .03) * r, y = cy + Math.sin(m.a + t * .03) * r;
          ctx.fillStyle = rgba(C.mist, .35 + .3 * Math.sin(t + m.p)); ctx.fillRect(x, y, m.s, m.s);
        }
        ctx.lineWidth = 1;
        for (let k = 5; k >= 0; k--) {
          const side = L * s * (1 - k * .14), rot = k * (s - .5) * .09;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
          ctx.strokeStyle = rgba(k ? C.mist : C.chrome, k ? .1 + (5 - k) * .04 : .55);
          ctx.strokeRect(-side / 2, -side / 2, side, side);
          ctx.restore();
        }
        // the guide: top edge on the in-breath, right on the hold, …
        const side = L * s, h = side / 2;
        const pts = [[-h, -h], [h, -h], [h, h], [-h, h]];
        const a = pts[ph], b = pts[(ph + 1) % 4];
        const gx = cx + lerp(a[0], b[0], u), gy = cy + lerp(a[1], b[1], u);
        ctx.strokeStyle = rgba(C.acc, .5); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + a[0], cy + a[1]); ctx.lineTo(gx, gy); ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = rgba(C.acc, 1); ctx.fillRect(gx - 5, gy - 5, 10, 10);
        // the word, in the reading voice, and the count
        const count = 4 - Math.floor(c % 4);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `500 ${clamp(S.R * .1, 15, 22)}px ${SANS}`; ctx.fillStyle = rgba(C.text, .95);
        ctx.fillText(PH[ph], cx, cy - 8);
        ctx.font = mono(11); tracked(2); ctx.fillStyle = rgba(C.label, .9);
        ctx.fillText(String(count), cx, cy + 18);
        ctx.textAlign = 'start'; tracked(0);
        const words = PH[ph] + count;
        if (words !== lastWords) {
          lastWords = words;
          if (phaseEl) phaseEl.textContent = PH[ph];
          if (nEl) nEl.textContent = `${count} · breath ${Math.floor(t / 16) + 1}`;
        }
        if (meter) meter.style.setProperty('--p', ((c / 16) * 100).toFixed(1));
        hud([['Phase', PH[ph].toUpperCase(), 'is-live'], ['Count', String(count)], ['Rate', 'CALM']]);
      },
    };
  };

  /* ---- 450 · MOSAIC ---------------------------------------------
     The page behind the filter, as the filter shows it: blocks. The
     pointer is a lens that makes the blocks smaller, never small enough.
     The picture is a plate — the stand-in for a photograph, which is what
     a filter usually hides.
     The switch over it is the real control, on and disabled. */
  scenes.mosaic = () => {
    const img = new Image();
    let ok = false;
    img.onload = () => { ok = true; if (still) paintStill(); };
    img.src = '../assets/img/plate-05.svg';
    const small = doc.createElement('canvas'), sx = small.getContext('2d');
    // the picture's frame: the stage, less the readout under it
    const A = () => ({ l: S.l, t: S.t, w: S.w, h: Math.max(80, S.h - 84) });
    function blocks(bs, x, y, w, h, drift) {
      const a = A();
      const cw = Math.max(1, Math.ceil(w / bs)), ch = Math.max(1, Math.ceil(h / bs));
      small.width = cw; small.height = ch;
      // cover the stage with the picture, then read it back at one pixel a block
      const ir = img.width / img.height, sr = a.w / a.h;
      let iw, ih; if (ir > sr) { ih = a.h; iw = ih * ir; } else { iw = a.w; ih = iw / ir; }
      const ix = a.l - (iw - a.w) / 2 + drift, iy = a.t - (ih - a.h) / 2;
      sx.imageSmoothingEnabled = true;
      sx.clearRect(0, 0, cw, ch);
      sx.drawImage(img, (x - ix) / iw * img.width, (y - iy) / ih * img.height, w / iw * img.width, h / ih * img.height, 0, 0, cw, ch);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, cw, ch, x, y, cw * bs, ch * bs);
      ctx.imageSmoothingEnabled = true;
      ctx.strokeStyle = rgba(C.bg, .45); ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= cw; i++) { ctx.moveTo(x + i * bs + .5, y); ctx.lineTo(x + i * bs + .5, y + ch * bs); }
      for (let j = 0; j <= ch; j++) { ctx.moveTo(x, y + j * bs + .5); ctx.lineTo(x + cw * bs, y + j * bs + .5); }
      ctx.stroke();
    }
    function paint(t) {
      if (!ok) return;
      const bs = Math.round(26 + Math.sin(t * .8) * 3), a = A();
      ctx.save(); ctx.beginPath(); ctx.rect(a.l, a.t, a.w, a.h); ctx.clip();
      ctx.globalAlpha = .85;
      blocks(bs, a.l, a.t, a.w, a.h, Math.sin(t * .15) * 30);
      if (P.on && P.x > a.l && P.x < a.l + a.w && P.y > a.t && P.y < a.t + a.h) {
        const L = 140, lx = Math.round(P.x - L / 2), ly = Math.round(P.y - L / 2);
        blocks(10, lx, ly, L, L, Math.sin(t * .15) * 30);
        ctx.globalAlpha = 1;
        brackets(lx - 4, ly - 4, L + 8, L + 8, 12, rgba(C.chrome, .95));
        ctx.font = mono(9); tracked(1.8); ctx.fillStyle = rgba(C.label, 1);
        ctx.fillText('NICE TRY', lx, ly + L + 18); tracked(0);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = rgba(C.chrome, .3); ctx.strokeRect(a.l + .5, a.t + .5, a.w - 1, a.h - 1);
      brackets(a.l - 6, a.t - 6, a.w + 12, a.h + 12, 18, rgba(C.chrome, .85));
      hud([['Filter', 'ON', 'is-live'], ['Set by', 'ADMIN'], ['Override', 'NO', 'is-bad']], true);
    }
    function paintStill() { ctx.clearRect(0, 0, W, H); paint(2); }
    return { still: 2, step() {}, draw(t) { paint(t); } };
  };

  /* ---- 451 · REDACTION ------------------------------------------
     A notice, being redacted word by word, while the bottom edge of the
     page smoulders — paper ignites at 451 °F. The embers are amber: the
     one status colour that means "this is about to happen". */
  scenes.redact = () => {
    const words = [...doc.querySelectorAll('.err__notice-body .w')];
    const notice = doc.querySelector('.err__notice');
    const order = words.map((_, i) => i).sort(() => srand() - .5);
    let k = 0, nextT = .8, holdT = -1;
    const embers = [];
    let emberT = 0;
    if (still) words.forEach((w, i) => { if (i % 3) w.classList.add('is-x'); });
    return {
      still: 3,
      step(dt, t) {
        if (!still) {
          if (holdT < 0 && t > nextT) {
            if (k < order.length) { words[order[k++]].classList.add('is-x'); nextT = t + rand(.05, .22); }
            else { holdT = t; }
          }
          if (holdT >= 0 && t - holdT > 3.2) {
            words.forEach((w) => w.classList.remove('is-x'));
            order.sort(() => Math.random() - .5); k = 0; holdT = -1; nextT = t + 1.2;
          }
        }
        const r = notice ? notice.getBoundingClientRect() : { left: S.l, right: S.r, bottom: S.b };
        if (t > emberT) {
          emberT = t + .014;
          // mostly from the bottom edge, a few licking up the sides
          const side = srand() < .2, left = srand() < .5;
          embers.push({
            x: side ? (left ? r.left : r.right) + rand(-4, 4) : rand(r.left, r.right),
            y: side ? rand(r.bottom - 60, r.bottom) : r.bottom + rand(-4, 6),
            vy: rand(-70, -20), vx: rand(-10, 10), a: rand(.5, 1), s: srand() < .25 ? 2 : 1, p: srand() * 10, hot: srand() < .65,
          });
        }
        for (const e of embers) { e.y += e.vy * dt; e.x += (e.vx + wob(e.p + t * 2) * 22) * dt; e.a -= dt * .35; }
        for (let i = embers.length - 1; i >= 0; i--) if (embers[i].a <= 0) embers.splice(i, 1);
      },
      draw(t) {
        const r = notice ? notice.getBoundingClientRect() : { left: S.l, right: S.r, bottom: S.b, width: S.w };
        const g = ctx.createLinearGradient(0, r.bottom - 30, 0, r.bottom + 40);
        g.addColorStop(0, rgba(C.amb, 0)); g.addColorStop(.5, rgba(C.amb, .1 + .04 * wob(t * 3))); g.addColorStop(1, rgba(C.amb, 0));
        ctx.fillStyle = g; ctx.fillRect(r.left - 30, r.bottom - 30, r.width + 60, 70);
        for (const e of embers) {
          ctx.fillStyle = rgba(e.hot ? C.amb : C.chrome, Math.max(0, e.a) * (e.hot ? 1 : .5));
          ctx.fillRect(e.x, e.y, e.s, e.s);
        }
        const done = words.filter((w) => w.classList.contains('is-x')).length;
        hud([['Redacted', Math.round(done / Math.max(1, words.length) * 100) + '%', 'is-live'], ['Basis', 'WITHHELD'], ['Shown', 'NOTHING', 'is-bad']]);
      },
    };
  };

  /* ---- 701 · DROOP ----------------------------------------------
     Leave the pointer still and the page loses interest: the digits lean
     and sag, the words slump, and a few z's drift up. Move and it perks
     up for a second. The needle on the meh-o-meter is the live thing,
     and it never gets far from the middle. */
  scenes.droop = () => {
    const ds = codeEl ? [...codeEl.querySelectorAll('.d')] : [];
    const TILT = [7, -6, 15, -9], SAG = [6, 12, 18, 8];
    let asleep = false, lastMove = performance.now() - 2000, needle = .5;
    const zs = [];
    let zT = 0;
    function set(on) {
      asleep = on;
      body.classList.toggle('is-awake', !on);
      ds.forEach((d, i) => {
        d.style.setProperty('--tilt', on ? TILT[i % 4] : 0);
        d.style.setProperty('--sag', on ? SAG[i % 4] : 0);
      });
      root.style.setProperty('--slump', on ? 1.1 : 0);
    }
    if (!still) addEventListener('pointermove', () => { lastMove = performance.now(); if (asleep) set(false); }, { passive: true });
    set(true);
    return {
      still: 2,
      step(dt, t) {
        if (!still && !asleep && performance.now() - lastMove > 1600) set(true);
        needle = lerp(needle, (asleep ? .42 : .6) + wob(t * .9) * .035, Math.min(1, dt * 1.5));
        if (asleep && ds.length && t > zT) {
          zT = t + 1.1;
          const r = ds[ds.length - 1].getBoundingClientRect();
          zs.push({ x: r.right - 10, y: r.top + 10, a: 1, s: 10, p: srand() * 6 });
        }
        for (const z of zs) { z.y -= 22 * dt; z.x += wob(z.p + t) * 10 * dt + 6 * dt; z.s += dt * 5; z.a -= dt * .3; }
        for (let i = zs.length - 1; i >= 0; i--) if (zs[i].a <= 0) zs.splice(i, 1);
      },
      draw(t) {
        ctx.textBaseline = 'middle';
        for (const z of zs) { ctx.font = mono(Math.round(z.s), 500); ctx.fillStyle = rgba(C.label, Math.max(0, z.a)); ctx.fillText('z', z.x, z.y); }
        // the meh-o-meter: a half dial, which is genuinely round
        const R = S.R * .78, cx = S.x, cy = S.y + R * .35;
        ctx.lineWidth = 1; ctx.strokeStyle = rgba(C.chrome, .35);
        ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, TAU); ctx.stroke();
        ctx.strokeStyle = rgba(C.chrome, .12);
        ctx.beginPath(); ctx.arc(cx, cy, R * .82, Math.PI, TAU); ctx.stroke();
        for (let i = 0; i <= 40; i++) {
          const q = Math.PI + i / 40 * Math.PI, l = i % 10 ? 6 : 14;
          ctx.strokeStyle = rgba(C.chrome, i % 10 ? .25 : .6);
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(q) * R, cy + Math.sin(q) * R);
          ctx.lineTo(cx + Math.cos(q) * (R - l), cy + Math.sin(q) * (R - l)); ctx.stroke();
        }
        ctx.font = mono(10); tracked(2); ctx.textAlign = 'center'; ctx.fillStyle = rgba(C.label, .9);
        [['NOPE', 0], ['MEH', .5], ['YAY', 1]].forEach(([s, u]) => {
          const q = Math.PI + u * Math.PI;
          ctx.fillText(s, cx + Math.cos(q) * (R + 22), cy + Math.sin(q) * (R + 22));
        });
        const q = Math.PI + needle * Math.PI;
        ctx.strokeStyle = rgba(C.acc, 1); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(q) * R * .9, cy + Math.sin(q) * R * .9); ctx.stroke();
        ctx.lineWidth = 1; ctx.fillStyle = rgba(C.acc, 1); ctx.fillRect(cx - 4, cy - 4, 8, 8);
        ctx.font = mono(clamp(R * .14, 14, 26), 500); ctx.fillStyle = rgba(C.text, .9);
        ctx.fillText(Math.round(needle * 100) + '%', cx, cy + 30);
        ctx.textAlign = 'start'; tracked(0);
        hud([['Interest', Math.round(needle * 100) + '%', 'is-live'], ['Effort', asleep ? 'LOW' : 'SOME'], ['Mood', 'MEH']]);
      },
    };
  };

  /* ---- 999 · EVENT HORIZON --------------------------------------
     A black hole, tilted toward edge-on: the disk in front crosses the
     shadow, the far side of the disk is bent up and over it, and the
     stars behind are pushed outward by the lens. Particles spiral in
     and do not come out. Press anywhere to feed it. */
  scenes.hole = () => {
    const stars = starfield(Math.round(W * H / 3600));
    const INC = .24;     // how open the disk is (0 = edge-on)
    const parts = [];
    const rs = () => S.R * .2;
    function spawn(r, a) {
      parts.push({ r: r ?? lerp(rs() * 1.5, S.R * 1.05, Math.pow(srand(), 2)), a: a ?? srand() * TAU, s: srand() < .2 ? 2 : 1.4, h: srand() });
    }
    for (let i = 0; i < 2400; i++) spawn();
    let fed = 0;
    addEventListener('pointerdown', (e) => {
      if (onControl(e)) return;
      const dx = e.clientX - S.x, dy = (e.clientY - S.y) / INC;
      const r = clamp(Math.hypot(dx, dy), rs() * 2, S.R * 1.6), a = Math.atan2(dy, dx);
      for (let i = 0; i < 80; i++) spawn(r + rand(-14, 14), a + rand(-.15, .15));
      fed += 80;
    });
    let swallowed = 0;
    const warp = (x, y) => {
      const dx = x - S.x, dy = y - S.y, d2 = dx * dx + dy * dy, R2 = rs() * rs() * 2.6;
      const k = 1 + R2 / Math.max(d2, 1);
      return [S.x + dx * k, S.y + dy * k];
    };
    return {
      still: 3,
      step(dt) {
        stars.step(dt);
        const r0 = rs();
        for (const p of parts) {
          p.a += dt * 260 / Math.pow(p.r, 1.5) * 8;
          p.r -= dt * (900 / p.r);
          if (p.r < r0 * 1.15) { p.r = lerp(r0 * 1.5, S.R * 1.05, Math.pow(srand(), 2)); p.a = srand() * TAU; swallowed++; }
        }
        if (parts.length > 3400) parts.splice(0, parts.length - 3400);
      },
      draw(t) {
        stars.draw(t, warp);
        const r0 = rs(), cx = S.x, cy = S.y;
        const col = (p) => {
          const u = clamp((p.r - r0 * 1.15) / (S.R * 1.2), 0, 1);
          return u < .15 ? mix(C.titleA, C.accSoft, u / .15) : u < .5 ? mix(C.accSoft, C.mist2, (u - .15) / .35) : mix(C.mist2, C.mist4, (u - .5) / .5);
        };
        const bright = (p) => {
          const u = clamp((p.r - r0) / (S.R * .9), 0, 1);
          // the side coming toward us is brighter (beaming)
          return Math.min(1, (1.15 - u * .9) * (.6 + .4 * -Math.cos(p.a)));
        };
        // far side, flat: mostly hidden behind the shadow
        for (const p of parts) {
          const z = Math.sin(p.a); if (z < 0) continue;
          ctx.fillStyle = rgba(col(p), bright(p) * .5);
          ctx.fillRect(cx + Math.cos(p.a) * p.r, cy - z * p.r * INC, p.s, p.s);
        }
        // the shadow and the photon ring
        const halo = ctx.createRadialGradient(cx, cy, r0, cx, cy, r0 * 2.2);
        halo.addColorStop(0, rgba(C.accSoft, .25)); halo.addColorStop(1, rgba(C.acc, 0));
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r0 * 2.2, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(C.bg, 1); ctx.beginPath(); ctx.arc(cx, cy, r0 * 1.04, 0, TAU); ctx.fill();
        ctx.save(); ctx.shadowColor = rgba(C.titleA, .8); ctx.shadowBlur = 14;
        ctx.strokeStyle = rgba(C.titleA, .85); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, r0 * 1.06, 0, TAU); ctx.stroke(); ctx.restore();
        // far side again, lensed up and over the shadow
        for (const p of parts) {
          const z = Math.sin(p.a); if (z < 0) continue;
          const rl = r0 * 1.1 + (p.r - r0 * 1.15) * .32;
          ctx.fillStyle = rgba(col(p), bright(p) * .9 * Math.sqrt(z));
          ctx.fillRect(cx + Math.cos(p.a) * rl, cy - z * rl * .95, p.s, p.s);
        }
        // near side, in front of everything
        for (const p of parts) {
          const z = Math.sin(p.a); if (z >= 0) continue;
          ctx.fillStyle = rgba(col(p), bright(p));
          ctx.fillRect(cx + Math.cos(p.a) * p.r, cy - z * p.r * INC, p.s, p.s);
        }
        hud([['Horizon', 'CROSSED', 'is-bad'], ['Swallowed', String(swallowed)], ['Fed', String(fed), 'is-live'], ['Returns', 'NONE']]);
      },
    };
  };

  /* ---- the catalogue: just the sky ----------------------------- */
  scenes.stars = () => {
    const stars = starfield(Math.round(W * H / 3000));
    return { still: 0, step(dt) { stars.step(dt); }, draw(t) { stars.draw(t); } };
  };

  /* ===============================================================
     THE ENGINE
     =============================================================== */
  const make = scenes[body.dataset.fx];
  if (!make) return;
  let scene = null, raf = 0, last = 0, clock = 0;

  function paintStill() {
    seed = 7;
    scene = make();
    clock = 0;
    const n = Math.round((scene.still || 0) * 60);
    for (let i = 0; i < n; i++) { clock += 1 / 60; scene.step(1 / 60, clock); }
    ctx.clearRect(0, 0, W, H);
    scene.draw(clock);
  }
  function frame(ts) {
    const dt = Math.min(.05, last ? (ts - last) / 1000 : 1 / 60);
    last = ts; clock += dt;
    scene.step(dt, clock);
    ctx.clearRect(0, 0, W, H);
    scene.draw(clock);
    raf = requestAnimationFrame(frame);
  }
  function play() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function pause() { cancelAnimationFrame(raf); raf = 0; }

  function start() {
    measure();
    if (still) { paintStill(); }
    else { scene = make(); play(); }
    let rt = 0;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        measure();
        if (still) paintStill();
        else if (scene.resize) scene.resize();
      }, 120);
    });
    addEventListener('scroll', () => { measureStage(); if (still) { ctx.clearRect(0, 0, W, H); scene.draw(clock); } }, { passive: true });
    doc.addEventListener('visibilitychange', () => { if (still) return; doc.hidden ? pause() : play(); });
  }
  // The numeral has to be in its own face before a scene measures it.
  const ready = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
  Promise.race([ready, new Promise((r) => setTimeout(r, 1500))]).then(start);
})();
