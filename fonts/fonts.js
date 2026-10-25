/* The fontset specimen: the voice switch and the two glyph tables. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('voice-nebula');

  // ---- the voice switch: swaps two tokens on <html>, nothing else
  var label = document.getElementById('fs-voice');
  var opts = document.querySelectorAll('[data-voice]');
  opts.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var nebula = btn.dataset.voice === 'nebula';
      root.classList.toggle('voice-nebula', nebula);
      opts.forEach(function (o) { o.classList.toggle('is-on', o === btn); });
      if (label) label.textContent = nebula ? 'Nebula Mono · Wordmark' : 'JetBrains Mono · Ethnocentric';
    });
  });

  // ---- the glyph tables
  function range(a, b) {
    var out = [];
    for (var c = a; c <= b; c++) out.push(String.fromCharCode(c));
    return out;
  }
  var ascii = range(0x21, 0x7e);
  var latin = 'ÄÖÜäöüßÉÈÊËéèêëÁÀÂÅáàâåÍÏÎíïîÓÔóôÚúÑñ'.split('');
  var extra = '·•–—…×‹›«»‘’‚“”„←↑→↓€°'.split('');

  var sets = {
    mono: ascii.concat(latin, extra),
    display: range(0x41, 0x5a).concat(range(0x30, 0x39),
      '!?.,:;-–—/&@#%+=*()[]<>"\'·€°→←ÄÖÜÉÈÁÑ'.split(''))
  };

  function fill(id, set, countId) {
    var list = document.getElementById(id);
    if (!list) return;
    var frag = document.createDocumentFragment();
    set.forEach(function (ch) {
      var li = document.createElement('li');
      li.className = 'fs__glyph';
      li.textContent = ch;
      li.title = 'U+' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
      var cp = document.createElement('span');
      cp.className = 'fs__glyph-cp';
      cp.textContent = ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
      cp.setAttribute('aria-hidden', 'true');
      li.appendChild(cp);
      frag.appendChild(li);
    });
    list.appendChild(frag);
    var n = document.getElementById(countId);
    if (n) n.textContent = set.length;
  }
  // the icons: read off icons.css itself, so the table cannot fall behind
  function fillIcons() {
    var list = document.getElementById('glyphs-icons');
    if (!list) return;
    var names = [];
    Array.prototype.forEach.call(document.styleSheets, function (sheet) {
      var rules;
      try { rules = sheet.cssRules; } catch (e) { return; }
      Array.prototype.forEach.call(rules || [], function (r) {
        var m = r.selectorText && /^\.ni-([a-z-]+)$/.exec(r.selectorText);
        if (m && m[1] !== 'fw') names.push(m[1]);
      });
    });
    names.forEach(function (name) {
      var li = document.createElement('li');
      li.className = 'fs__glyph';
      li.title = 'ni-' + name;
      var i = document.createElement('i');
      i.className = 'ni ni-' + name;
      i.setAttribute('aria-hidden', 'true');
      var cp = document.createElement('span');
      cp.className = 'fs__glyph-cp';
      cp.textContent = name;
      li.appendChild(i);
      li.appendChild(cp);
      list.appendChild(li);
    });
    var n = document.getElementById('g-icons-n');
    if (n) n.textContent = names.length;
  }
  fillIcons();
  fill('glyphs-mono', sets.mono, 'g-mono-n');
  fill('glyphs-display', sets.display, 'g-disp-n');
  fill('glyphs-wordmark', range(0x41, 0x5a).concat(range(0x30, 0x39), '.,:-–·/!?\'&+ÄÖÜÉÑ'.split('')));
})();
