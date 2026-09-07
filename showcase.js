/* ==================================================================
   NEBULA SHOWCASE  —  behaviour
   ------------------------------------------------------------------
   Everything on this page that moves. Three kinds of thing live here:

     1. nebulaAccent()  — a faithful port of the gallery's
        _accent_shades() (app/main.py). This is the only piece of the
        file worth copying into a real app: it is how a hand-typed hex
        from a config file is turned into the three faces the sheet
        needs, with the contrast guarantees intact.
     2. The labs — the accent, the backdrop, and the four "heresy"
        switches that break one rule each so the page can show what a
        rule is FOR instead of asserting it.
     3. Ordinary page furniture — scroll spy, a working dropdown, a
        working filter, copy buttons.

   No inline styles are written into markup anywhere: values go onto
   custom properties, because the apps this language dresses run under
   a strict CSP that drops style attributes silently.
   ================================================================== */
(function () {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ================================================================
     1 — THE ACCENT DERIVATION
     ----------------------------------------------------------------
     One colour in, three faces out, by moving only LIGHTNESS along
     the source hue. Each face answers a legibility question the
     stylesheet cannot answer for itself:

       acc   small text on a PANEL (not on the page floor — see
             SURFACE below) and a fill under --on-acc label text.
             Both readings want luminance, so a colour too dark to
             read is LIFTED (and we say so).
       deep  the single face that carries WHITE text, so it goes the
             other way until white reads on it. Saturation is capped
             on this one alone: at full chroma a mid-lightness hue
             turns electric, which none of the other shades do.
       soft  the hover step above acc, again under black text.
     ================================================================ */
  var MIN_CONTRAST = 4.5;

  /* THE REFERENCE SURFACE.
     This used to be [0,0,0], and that was the bug: the accent is
     almost never on #000. It is a link inside a .panel, an active
     .menu__option, the glyph in front of an .eyebrow — every one of
     them on --surface or a step above it. Measuring against the
     floor let the loop stop the instant it cleared the EASIEST
     surface in the system, so the whole 4.5 margin was already spent
     before the colour was used: #5865F2 clears 4.56:1 on #000 and
     only 4.19:1 on --surface.

     --surface (#0e0e10) is the highest ground accent-coloured TEXT
     actually sits on, so it is what the loop has to satisfy. It
     lifts the built-in one step, #5865F2 -> #616EF3, and that one
     step is the difference between a promise and a rounding error.

     Accent text on an accent TINT is not in this list on purpose:
     the sheet no longer does it. See the note over .btn in
     nebula.css — on an accent fill the label is --on-acc or --text. */
  var SURFACE = [0x0e, 0x0e, 0x10];

  function srgbLum(rgb) {
    var c = rgb.map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function contrast(a, b) {
    var la = srgbLum(a), lb = srgbLum(b);
    var hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  /* colorsys.rgb_to_hls / hls_to_rgb, to the letter — the Python and the
     JS have to agree or a config colour would render differently in the
     two places it is derived. */
  function rgbToHls(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    var l = (mx + mn) / 2;
    if (mx === mn) return [0, l, 0];
    var d = mx - mn;
    var s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    var h;
    var rc = (mx - r) / d, gc = (mx - g) / d, bc = (mx - b) / d;
    if (r === mx)      h = bc - gc;
    else if (g === mx) h = 2 + rc - bc;
    else               h = 4 + gc - rc;
    h = ((h / 6) % 1 + 1) % 1;
    return [h, l, s];
  }

  function hlsRgb(h, l, s) {
    l = Math.max(0, Math.min(1, l));
    if (s === 0) { var v = Math.round(l * 255); return [v, v, v]; }
    var m2 = l <= 0.5 ? l * (1 + s) : l + s - l * s;
    var m1 = 2 * l - m2;
    function ch(t) {
      t = ((t % 1) + 1) % 1;
      if (t < 1 / 6) return m1 + (m2 - m1) * 6 * t;
      if (t < 1 / 2) return m2;
      if (t < 2 / 3) return m1 + (m2 - m1) * (2 / 3 - t) * 6;
      return m1;
    }
    return [Math.round(ch(h + 1 / 3) * 255), Math.round(ch(h) * 255), Math.round(ch(h - 1 / 3) * 255)];
  }

  function hex(rgb) {
    return '#' + rgb.map(function (v) {
      return ('0' + Math.max(0, Math.min(255, v)).toString(16)).slice(-2);
    }).join('');
  }

  function parseHex(raw) {
    raw = String(raw || '').trim();
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
    if (!m) return null;
    var body = m[1];
    if (body.length === 3) body = body.split('').map(function (c) { return c + c; }).join('');
    return [parseInt(body.slice(0, 2), 16), parseInt(body.slice(2, 4), 16), parseInt(body.slice(4, 6), 16)];
  }

  function nebulaAccent(rgb) {
    var hls = rgbToHls(rgb[0], rgb[1], rgb[2]);
    var h = hls[0], l = hls[1], s = hls[2];

    var accL = l;
    while (accL < 0.97 && contrast(hlsRgb(h, accL, s), SURFACE) < MIN_CONTRAST) accL += 0.02;

    var deepS = Math.min(s, 0.78);
    var deepL = Math.min(accL, 0.58);
    while (deepL > 0.12 && contrast(hlsRgb(h, deepL, deepS), [255, 255, 255]) < MIN_CONTRAST) deepL -= 0.02;

    var acc = hlsRgb(h, accL, s);
    return {
      acc:    acc,
      rgb:    acc.join(','),
      deep:   hlsRgb(h, deepL, deepS),
      soft:   hlsRgb(h, accL + (1 - accL) * 0.42, s),
      lifted: acc[0] !== rgb[0] || acc[1] !== rgb[1] || acc[2] !== rgb[2]
    };
  }

  /* ================================================================
     2 — ACCENT LAB
     ================================================================ */
  var DEFAULT_ACCENT = '#5865F2';
  var PRESETS = [
    ['#5865F2', 'Nebula blue — the built-in'],
    ['#a594ff', 'The round before it: too violet'],
    ['#58f298', 'The status green, as an accent'],
    ['#ff8a3d', 'A warm accent'],
    ['#3dd6ff', 'A cold accent'],
    ['#e0625f', 'A red accent — note how deep darkens'],
    ['#1b2a8f', 'Too dark to read: watch it get LIFTED'],
    ['#f2f2f4', 'No hue at all — the accent stops working']
  ];

  var accHex     = $('#acc-hex');
  var accNote    = $('#acc-note');
  var accPresets = $('#acc-presets');
  var docAcc     = $('#doc-acc');

  function applyAccent(raw, quiet) {
    var rgb = parseHex(raw);
    if (!rgb) {
      if (!quiet && accNote) {
        accNote.classList.add('is-warn');
        accNote.textContent = 'Not a hex colour. A config value that does not parse is refused rather than '
          + 'guessed at — only three parsed integers ever reach a generated stylesheet.';
      }
      return false;
    }
    var d = nebulaAccent(rgb);
    var root = document.documentElement;
    root.style.setProperty('--acc', hex(d.acc));
    root.style.setProperty('--acc-rgb', d.rgb);
    root.style.setProperty('--acc-deep', hex(d.deep));
    root.style.setProperty('--acc-soft', hex(d.soft));

    if (docAcc) docAcc.textContent = hex(d.acc).toUpperCase();

    var faces = { acc: d.acc, deep: d.deep, soft: d.soft };
    Object.keys(faces).forEach(function (k) {
      var chip = $('[data-face="' + k + '"]');
      var label = $('[data-hex="' + k + '"]');
      var on = $('[data-on="' + k + '"]');
      if (chip)  chip.style.setProperty('background', hex(faces[k]));
      if (label) label.textContent = hex(faces[k]);
      if (on) {
        /* the sample text each face has to carry, painted on the face
           itself — so the derivation can be checked by eye, not taken
           on trust */
        on.style.setProperty('background', hex(faces[k]));
        on.style.setProperty('color', k === 'deep' ? '#ffffff' : '#000000');
      }
    });

    $$('.preset').forEach(function (b) {
      b.classList.toggle('is-on', (b.dataset.hex || '').toLowerCase() === hex(rgb).toLowerCase());
    });

    if (accNote) {
      accNote.classList.toggle('is-warn', !!d.lifted);
      if (d.lifted) {
        accNote.innerHTML = '<b>Lifted.</b> ' + hex(rgb).toUpperCase() + ' could not carry small text on '
          + 'black at 4.5:1, so <code>--acc</code> was raised along its own hue to '
          + hex(d.acc).toUpperCase() + '. A config file may hand over an unreadable colour; a page may '
          + 'not render one. The checkers surface the lift rather than hiding it.';
      } else {
        accNote.innerHTML = 'The three faces are <b>derived, not picked</b>: lightness moves along the source '
          + 'hue until each one clears 4.5:1 against the text it has to carry. A colour typed into a config '
          + 'file lands with the same guarantees as the built-in one — which is the whole reason an app may '
          + 'expose an accent knob at all.';
      }
    }
    return true;
  }

  if (accPresets) {
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset';
      b.dataset.hex = p[0];
      b.title = p[0].toUpperCase() + ' — ' + p[1];
      b.setAttribute('aria-label', p[1]);
      b.style.setProperty('--preset', p[0]);
      b.addEventListener('click', function () {
        if (accHex) accHex.value = p[0].toUpperCase();
        applyAccent(p[0]);
      });
      accPresets.appendChild(b);
    });
  }
  if (accHex) {
    accHex.addEventListener('input', function () { applyAccent(accHex.value, true); });
    accHex.addEventListener('change', function () { applyAccent(accHex.value); });
  }
  var accReset = $('#acc-reset');
  if (accReset) {
    accReset.addEventListener('click', function () {
      if (accHex) accHex.value = DEFAULT_ACCENT;
      applyAccent(DEFAULT_ACCENT);
    });
  }

  /* ================================================================
     3 — THE SWATCH GRID
     ----------------------------------------------------------------
     Built from a table rather than written into the markup, so it
     re-reads the live computed values whenever the accent changes and
     can never drift from the sheet.
     ================================================================ */
  var TOKENS = [
    ['--bg',          'The floor. Black, no hue.'],
    ['--surface',     'A solid card or panel body.'],
    ['--surface-2',   'The same, hovered.'],
    ['--line',        'Every hairline. A border is furniture.', true],
    ['--text',        'Body text and names.'],
    ['--text-dim',    'Secondary text, meta lines.'],
    ['--text-ghost',  'Help text, disabled, the third tier.'],
    ['--text-head',   'Section headings — one step below --text.'],
    ['--acc',         'STATE: links, focus, active, selected, featured.'],
    ['--acc-deep',    'The one face that carries white text.'],
    ['--acc-soft',    'The lifted step. Hover faces under black text.'],
    ['--chrome',      'Furniture that reacts: hovers, brackets, HUD strokes.'],
    ['--label',       'Furniture that sits still: labels, counts, values.'],
    ['--ok',          'Good. The one bright status colour.'],
    ['--amb',         'Pending / stale. Dulled on purpose.'],
    ['--red',         'Failed / destructive. Dulled on purpose.'],
    ['--glass',       'A pane over the page. Pair with --glass-blur.', true],
    ['--scrim',       'A chip laid ON a picture. Pair with --scrim-blur.', true]
  ];

  var swatchWrap = $('#swatches');
  function paintSwatches() {
    if (!swatchWrap) return;
    var cs = getComputedStyle(document.documentElement);
    $$('.swatch', swatchWrap).forEach(function (el) {
      var v = cs.getPropertyValue(el.dataset.token).trim();
      el.style.setProperty('--swatch', v);
      $('.swatch__val', el).textContent = v;
    });
  }
  if (swatchWrap) {
    TOKENS.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.dataset.token = t[0];
      b.title = 'Copy ' + t[0];
      b.innerHTML =
        '<span class="swatch__chip' + (t[2] ? ' swatch__chip--split' : '') + '"></span>' +
        '<span class="swatch__body">' +
          '<span class="swatch__var">' + t[0] + '</span>' +
          '<span class="swatch__val"></span>' +
          '<span class="swatch__use">' + t[1] + '</span>' +
        '</span>';
      b.addEventListener('click', function () {
        copy('var(' + t[0] + ')');
        b.classList.add('is-copied');
        var val = $('.swatch__val', b), was = val.textContent;
        val.textContent = 'copied';
        setTimeout(function () { b.classList.remove('is-copied'); val.textContent = was; }, 1100);
      });
      swatchWrap.appendChild(b);
    });
  }

  /* ================================================================
     4 — THE HERESY SWITCHES
     ----------------------------------------------------------------
     Each one puts a class on <html> that breaks exactly one rule. The
     bar at the bottom of the screen exists so nobody wanders off with
     a broken page thinking it is the language.
     ================================================================ */
  var HERESY = {
    violet: 'Rule 01 — the accent is painting furniture too',
    radius: 'Rule 02 — corners are rounded, and the brackets are gone',
    opaque: 'Rule 03 — legibility is being bought with darkness',
    voice:  'Rule 04 — the chrome lost the mono voice',
    measure:'Rule 05 — every value is off the scale by a pixel or two'
  };
  var heresyWhat = $('#heresy-what');

  function refreshHeresy() {
    var on = Object.keys(HERESY).filter(function (k) {
      return document.documentElement.classList.contains('heresy-' + k);
    });
    if (heresyWhat) heresyWhat.textContent = on.map(function (k) { return HERESY[k]; }).join('  ·  ') || '—';
  }

  $$('[data-heresy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.heresy;
      var on = btn.dataset.on === 'true';
      document.documentElement.classList.toggle('heresy-' + key, on);
      $$('[data-heresy="' + key + '"]').forEach(function (b) { b.classList.toggle('is-on', b === btn); });
      refreshHeresy();
      paintSwatches();
    });
  });

  var heresyRestore = $('#heresy-restore');
  if (heresyRestore) {
    heresyRestore.addEventListener('click', function () {
      Object.keys(HERESY).forEach(function (k) {
        document.documentElement.classList.remove('heresy-' + k);
        $$('[data-heresy="' + k + '"]').forEach(function (b) {
          b.classList.toggle('is-on', b.dataset.on === 'false');
        });
      });
      refreshHeresy();
      paintSwatches();
    });
  }

  /* ================================================================
     5 — THE BACKDROP LAB
     ----------------------------------------------------------------
     Writes the four backdrop tokens, which are exactly what an app's
     `wallpaper_tint` / `wallpaper_dim` retune. Two things here are
     easy to get wrong and both were real bugs:

       · the tint knob has to move the BLOOM too. A backdrop asked for
         in full colour that still has an accent wash sitting on it is
         not actually untinted.
       · the dim is a PAIR. The ramp darkens a photograph towards the
         footer of a scrolling page; artwork that already falls off
         downward wants both ends flat, or the ramp lands on the art's
         own falloff and the bottom half goes black.

     The two presets are the two documented positions: the photograph
     figure that nebula.css ships, and the nova figure this page (and
     the configurator) overrides it with.
     ================================================================ */
  var WP = {
    nova:  { tint: 100, dim: 95, flat: true },   /* brand art: tint OFF means no DRAINING */
    photo: { tint: 8,   dim: 72, flat: false }
  };
  var wpTint = $('#wp-tint'), wpDim = $('#wp-dim');
  var wpTintVal = $('#wp-tint-val'), wpDimVal = $('#wp-dim-val');
  var wpNote = $('#wp-note');
  var wpMode = 'nova';

  function applyWallpaper() {
    if (!wpTint || !wpDim) return;
    var tint = Number(wpTint.value) / 100;     /* 0 = fully drained */
    var dim  = Number(wpDim.value) / 100;
    var root = document.documentElement;
    root.style.setProperty('--wallpaper-filter',
      'grayscale(' + (1 - tint).toFixed(2) + ') brightness(' + dim.toFixed(2) + ') contrast(1.04)');
    /* the bloom belongs to the tint, not to the dimming */
    root.style.setProperty('--wallpaper-bloom',
      tint <= 0 ? 'transparent' : 'rgba(var(--acc-rgb),' + (0.07 * Math.min(1, tint * 4)).toFixed(3) + ')');
    var flat = WP[wpMode].flat;
    root.style.setProperty('--wallpaper-shade-top', 'rgba(0,0,0,0.62)');
    root.style.setProperty('--wallpaper-shade-bot', flat ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.82)');
    if (wpTintVal) wpTintVal.textContent = wpTint.value + ' %';
    if (wpDimVal)  wpDimVal.textContent  = wpDim.value + ' %';
  }

  function setWallpaperMode(mode) {
    wpMode = mode;
    if (wpTint) wpTint.value = WP[mode].tint;
    if (wpDim)  wpDim.value  = WP[mode].dim;
    applyWallpaper();
    if (!wpNote) return;
    wpNote.innerHTML = mode === 'nova'
      ? 'The picture behind this page is <b>nova</b>, the house artwork, and it is the one kind '
        + 'of backdrop served with the <b>tint off</b>. A photograph introduces a foreign hue that '
        + 'every blurred pane above it picks up — that cast is what the palette pass was about, and '
        + 'it is why the language\'s own default drains a wallpaper to near-grey. Nova has no foreign '
        + 'hue to introduce: it is drawn in the accent\'s own colour, so draining it removes the one '
        + 'thing it was made to say. Pull the tint down and watch that happen.'
      : 'This is the figure <code>nebula.css</code> ships, applied to the artwork: <b>drained to '
        + 'near-grey and held back to .72</b>, with the dim ramping .62 → .82 down the page. It is '
        + 'the right treatment for a photograph and the wrong one here — the art goes flat and grey, '
        + 'and because nova already falls off downward, the ramp lands on its own falloff and the '
        + 'bottom of the screen goes black. Same tokens, different picture, different answer.';
  }

  $$('[data-wp]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('[data-wp]').forEach(function (b) { b.classList.toggle('is-on', b === btn); });
      setWallpaperMode(btn.dataset.wp);
    });
  });
  if (wpTint) wpTint.addEventListener('input', applyWallpaper);
  if (wpDim)  wpDim.addEventListener('input', applyWallpaper);
  var wpReset = $('#wp-reset');
  if (wpReset) {
    wpReset.addEventListener('click', function () { setWallpaperMode(wpMode); });
  }

  /* ================================================================
     6 — THE FX TIER
     ----------------------------------------------------------------
     In a real app this class is set once, from a hardware check, and
     lite mode then redefines the four surface tokens. Here it is a
     switch so the difference can be seen rather than described.
     ================================================================ */
  $$('[data-fx]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.documentElement.classList.toggle('fx-lite', btn.dataset.fx === 'lite');
      $$('[data-fx]').forEach(function (b) { b.classList.toggle('is-on', b === btn); });
      paintSwatches();
    });
  });

  /* ================================================================
     7 — PAGE FURNITURE
     ================================================================ */

  /* the nav's accent hairline brightens once the page has moved */
  var nav = $('#nav');
  function onScroll() {
    if (nav) nav.classList.toggle('nav--scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* scroll spy — the side nav marks the chapter you are reading, which
     is STATE, which is why it is the accent */
  var chapters = $$('.chapter');
  var navLinks = $$('#sidenav a');
  if ('IntersectionObserver' in window && chapters.length) {
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.intersectionRatio; });
      var best = null, bestR = 0;
      Object.keys(seen).forEach(function (id) { if (seen[id] > bestR) { bestR = seen[id]; best = id; } });
      if (best) navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + best); });
    }, { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.15, 0.4, 0.75, 1] });
    chapters.forEach(function (c) { io.observe(c); });
  }

  /* the nav search filters the chapter list — a real control, not a
     prop: an ornamental search box is the kind of thing rule 04 is
     supposed to keep off a page */
  var docsearch = $('#docsearch');
  if (docsearch) {
    docsearch.addEventListener('input', function () {
      var q = docsearch.value.trim().toLowerCase();
      navLinks.forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        var sec = document.getElementById(id);
        var hay = (a.textContent + ' ' + (sec ? sec.dataset.title || '' : '')).toLowerCase();
        a.hidden = q.length > 0 && hay.indexOf(q) === -1;
      });
    });
  }

  /* every demo segmented group: one selected segment, and it is the
     only thing in the group wearing the accent */
  $$('[data-demo-seg]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('[data-demo-seg]', btn.parentNode).forEach(function (b) { b.classList.toggle('is-on', b === btn); });
    });
  });

  /* the sort dropdown */
  var sortBtn = $('#demo-sort-btn'), sortMenu = $('#demo-sort-menu'), sortVal = $('#demo-sort-val');
  var filterNote = $('#demo-filter-note');
  var state = { tag: 'all', sort: 'Newest first' };

  function noteState() {
    if (!filterNote) return;
    filterNote.innerHTML = 'Filter: <b>' + state.tag + '</b> · sorted by <b>'
      + state.sort.toLowerCase() + '</b>. Both controls are live.';
  }
  function closeSort() {
    if (!sortMenu) return;
    sortMenu.hidden = true;
    if (sortBtn) sortBtn.setAttribute('aria-expanded', 'false');
  }
  if (sortBtn && sortMenu) {
    sortBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = sortMenu.hidden;
      sortMenu.hidden = !open;
      sortBtn.setAttribute('aria-expanded', String(open));
    });
    $$('.menu__option', sortMenu).forEach(function (opt) {
      opt.addEventListener('click', function () {
        $$('.menu__option', sortMenu).forEach(function (o) {
          var on = o === opt;
          o.classList.toggle('is-active', on);
          o.setAttribute('aria-selected', String(on));
        });
        state.sort = opt.dataset.sort;
        if (sortVal) sortVal.textContent = state.sort;
        noteState();
        closeSort();
      });
    });
    document.addEventListener('click', closeSort);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSort(); });
  }

  $$('#demo-tags .tag').forEach(function (t) {
    t.addEventListener('click', function () {
      $$('#demo-tags .tag').forEach(function (x) {
        var on = x === t;
        x.classList.toggle('is-active', on);
        /* the class is what the sheet paints; aria-pressed is what a
           screen reader reads. A filter chip has to carry both, or
           half the visitors get an unlabelled toggle. */
        x.setAttribute('aria-pressed', String(on));
      });
      state.tag = t.textContent.trim().toLowerCase();
      noteState();
    });
  });

  /* ================================================================
     THE SPACE RULER
     ----------------------------------------------------------------
     Read from the live tokens rather than from a list typed here, so
     the specimen cannot drift from the sheet it is documenting — and
     so the rule-05 heresy switch visibly moves it. Widths ride a
     custom property, never an inline style attribute: strict CSP.
     ================================================================ */
  var ruler = $('#ruler');
  if (ruler) {
    var cs = getComputedStyle(document.documentElement);
    var steps = ['--s-0','--s-1','--s-2','--s-3','--s-4','--s-5','--s-6','--s-7','--s-8'];
    var USE = {
      '--s-0':'bezel — a track inset',
      '--s-1':'hairline gaps, chip padding',
      '--s-2':'tight inner padding',
      '--s-3':'the default gap',
      '--s-4':'control padding',
      '--s-5':'panel padding',
      '--s-6':'between components',
      '--s-7':'block separation',
      '--s-8':'section separation'
    };
    var draw = function () {
      var vals = steps.map(function (k) { return parseFloat(cs.getPropertyValue(k)) || 0; });
      var max = Math.max.apply(null, vals);
      ruler.textContent = '';
      steps.forEach(function (k, i) {
        var li = document.createElement('li');
        if (k === '--s-0') li.className = 'is-bezel';
        var tok = document.createElement('span'); tok.textContent = k;
        var px  = document.createElement('span'); px.className = 'px'; px.textContent = vals[i] + ' px';
        var bar = document.createElement('span'); bar.className = 'bar';
        bar.style.setProperty('--w', (vals[i] / max * 100) + '%');
        bar.title = USE[k];
        li.appendChild(tok); li.appendChild(px); li.appendChild(bar);
        ruler.appendChild(li);
      });
    };
    draw();
    /* the heresy switch rewrites the scale, so the ruler has to follow
       it — otherwise the one specimen that is ABOUT the scale would be
       the one thing on the page not obeying it */
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  /* the bar chart: server-rendered in a real app (the gallery's /stats
     draws its charts in three layers of CSS and no JS at all), built
     here only because this page has no server */
  var bars = $('#demo-bars');
  if (bars) {
    var data = [38, 71, 54, 96, 62, 44];
    var peak = Math.max.apply(null, data);
    data.forEach(function (v) {
      var b = document.createElement('span');
      b.className = 'bars__b' + (v === peak ? ' is-peak' : '');
      b.style.setProperty('height', Math.round((v / peak) * 100) + '%');
      b.title = v + ' frames';
      bars.appendChild(b);
    });
  }

  /* the HUD reticle: it flashes the accent while work is in flight —
     the one animation on the page that means something */
  var hud = $('#demo-hud'), hudFire = $('#hud-fire'), hudFrm = $('#hud-frm');
  if (hudFire && hud) {
    hudFire.addEventListener('click', function () {
      hud.classList.add('is-busy');
      setTimeout(function () {
        hud.classList.remove('is-busy');
        if (hudFrm) {
          var n = (parseInt(hudFrm.textContent, 10) || 0) + 1;
          hudFrm.textContent = ('0000' + n).slice(-4);
        }
      }, 620);
    });
  }

  /* copy buttons */
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.className = 'offscreen';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* nothing sensible to do */ }
    document.body.removeChild(ta);
  }

  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = $(btn.dataset.copy);
      if (!src) return;
      copy(src.textContent);
      var was = btn.textContent;
      btn.classList.add('is-done');
      btn.textContent = 'Copied';
      setTimeout(function () { btn.classList.remove('is-done'); btn.textContent = was; }, 1200);
    });
  });

  /* ---- boot ---- */
  applyAccent(DEFAULT_ACCENT, true);
  paintSwatches();
  applyWallpaper();
  noteState();
  refreshHeresy();

  /* expose the derivation for a console poke — the point of the page is
     that you can check the numbers yourself */
  window.nebula = { accent: nebulaAccent, parseHex: parseHex, hex: hex, contrast: contrast };
})();
