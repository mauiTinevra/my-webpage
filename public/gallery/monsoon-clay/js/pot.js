/* Monsoon Clay: the pot shaper.
   Four control points (foot, belly, shoulder, lip) define a profile. The profile is
   interpolated, lathed around the centre line into shaded bands, and named from its
   proportions. All sizes in the model are centimetres; S converts to drawing units. */
(function () {
  'use strict';

  var svg = document.getElementById('pot-stage');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var CX = 240;        // centre line
  var BASE = 528;      // wheel head surface at the centre
  var S = 14;          // drawing units per centimetre
  var K = 0.2;         // how far we look down on the wheel (ellipse squash)
  var N = 44;          // samples up the profile
  var WALL = 0.7;      // wall thickness, cm
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var LIM = { rf: [2, 12], rb: [2.5, 16], rs: [1.2, 16], rl: [1, 16], h: [2, 30] };

  var PRESETS = {
    bowl:   { rf: 4,   rb: 8.6,  rs: 10.6, rl: 11.2, h: 9,   fb: 0.3,  fs: 0.66 },
    cup:    { rf: 3.3, rb: 4.3,  rs: 4.4,  rl: 4.3,  h: 10,  fb: 0.3,  fs: 0.7 },
    vase:   { rf: 4.4, rb: 8.6,  rs: 6.2,  rl: 4.8,  h: 24,  fb: 0.34, fs: 0.72 },
    bottle: { rf: 4.6, rb: 7.8,  rs: 2.6,  rl: 1.9,  h: 26,  fb: 0.3,  fs: 0.7 },
    plate:  { rf: 8,   rb: 12.6, rs: 13.3, rl: 13.6, h: 2.6, fb: 0.35, fs: 0.7 }
  };

  var p = copy(PRESETS.vase);
  var prof = [];       // [radius, height] pairs, foot to lip
  var phi = 0;         // wheel angle
  var speed = 0;       // current turning speed, radians per second
  var wheelOn = false; // the visitor asked the wheel to keep turning
  var shapingUntil = 0;
  var raf = 0, lastT = 0;
  var drag = null;
  var tween = null;

  function copy(o) { var c = {}; for (var k in o) c[k] = o[k]; return c; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function f(n) { return Math.round(n * 10) / 10; }
  function mix(a, b, t) {
    var out = '#';
    for (var i = 1; i < 7; i += 2) {
      var x = parseInt(a.substr(i, 2), 16), y = parseInt(b.substr(i, 2), 16);
      out += ('0' + Math.round(x + (y - x) * t).toString(16)).slice(-2);
    }
    return out;
  }

  /* ---------- geometry ---------- */

  // Monotone cubic interpolation (Fritsch and Carlson). It never overshoots a control
  // point, so the belly handle really is the widest place when you make it so.
  function pchip(xs, ys) {
    var n = xs.length, h = [], d = [], m = [];
    for (var i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; d[i] = (ys[i + 1] - ys[i]) / h[i]; }
    m[0] = endSlope(h[0], h[1], d[0], d[1]);
    m[n - 1] = endSlope(h[n - 2], h[n - 3], d[n - 2], d[n - 3]);
    for (i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
      var w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
    return function (x) {
      var k = 0;
      while (k < n - 2 && x > xs[k + 1]) k++;
      var t = (x - xs[k]) / h[k], t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[k] + (t3 - 2 * t2 + t) * h[k] * m[k] +
             (-2 * t3 + 3 * t2) * ys[k + 1] + (t3 - t2) * h[k] * m[k + 1];
    };
  }
  function endSlope(h0, h1, d0, d1) {
    var m = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
    if (m * d0 <= 0) return 0;
    if (d0 * d1 <= 0 && Math.abs(m) > 3 * Math.abs(d0)) return 3 * d0;
    return m;
  }

  function buildProfile() {
    var r = pchip([0, p.fb * p.h, p.fs * p.h, p.h], [p.rf, p.rb, p.rs, p.rl]);
    prof = [];
    for (var i = 0; i <= N; i++) {
      var y = p.h * i / N;
      prof.push([Math.max(0.8, r(y)), y]);
    }
  }

  // A point on the lathed surface: u runs from -1 (left edge) to 1 (right edge) across
  // the front of the pot. The front of each ring dips toward the viewer by K * radius.
  function pt(r, y, u) {
    return [CX + u * r * S, BASE - y * S + K * r * S * Math.sqrt(Math.max(0, 1 - u * u))];
  }
  function at(t) { // radius and height at fraction t of the profile
    var x = clamp(t, 0, 1) * N, i = Math.min(N - 1, Math.floor(x)), q = x - i;
    return [prof[i][0] + (prof[i + 1][0] - prof[i][0]) * q, prof[i][1] + (prof[i + 1][1] - prof[i][1]) * q];
  }

  // One shaded band: everything on the front of the pot from u0 across to the right edge.
  // Bands are painted left to right over each other, so there are no seams between them.
  function bandPath(u0) {
    var pts = [], i, u, top = prof[N], bot = prof[0];
    for (i = 0; i <= N; i++) pts.push(pt(prof[i][0], prof[i][1], u0));
    for (i = 1; i <= 10; i++) { u = u0 + (1 - u0) * i / 10; pts.push(pt(top[0], top[1], u)); }
    for (i = N - 1; i >= 0; i--) pts.push(pt(prof[i][0], prof[i][1], 1));
    for (i = 1; i < 10; i++) { u = 1 - (1 - u0) * i / 10; pts.push(pt(bot[0], bot[1], u)); }
    return 'M' + pts.map(function (q) { return f(q[0]) + ' ' + f(q[1]); }).join('L') + 'Z';
  }

  /* ---------- what was made ---------- */

  function measure() {
    var maxR = 0, area = 0, vol = 0, i;
    for (i = 0; i <= N; i++) maxR = Math.max(maxR, prof[i][0]);
    for (i = 0; i < N; i++) {
      var r0 = prof[i][0], r1 = prof[i + 1][0], dy = prof[i + 1][1] - prof[i][1];
      area += Math.PI * (r0 + r1) * Math.sqrt(dy * dy + (r1 - r0) * (r1 - r0));
      var y = (prof[i][1] + prof[i + 1][1]) / 2;
      if (y > 0.8) { var ri = Math.max(0, (r0 + r1) / 2 - WALL); vol += Math.PI * ri * ri * dy; }
    }
    // Wet clay is about 1.75 g per cubic centimetre. A quarter more goes to trimming and slop.
    var grams = (area * WALL + Math.PI * p.rf * p.rf * 0.8) * 1.75 * 1.25;
    return { h: p.h, rim: p.rl * 2, wide: maxR * 2, aspect: p.h / (maxR * 2), open: p.rl / maxR, grams: grams, ml: vol };
  }

  function classify(m) {
    var inch = function (cm) { return cm / 2.54; };
    if (m.aspect <= 0.25 && m.open >= 0.8) {
      var d = inch(m.rim);
      return { kind: 'plate', name: d < 7.5 ? 'A side plate' : d < 10 ? 'A lunch plate' : 'A dinner plate',
        note: 'Low and nearly flat. Plates are thrown on a bat so they can dry without being lifted.' };
    }
    if (m.open < 0.5 && m.aspect >= 0.8) {
      return { kind: 'bottle', name: m.h < 14 ? 'A small bottle' : 'A bottle',
        note: 'A full belly closed in to a narrow neck. The neck is collared in with wet fingers.' };
    }
    if (m.aspect < 0.8) {
      return { kind: 'bowl', name: m.aspect < 0.33 ? 'A shallow bowl' : m.aspect > 0.6 ? 'A deep bowl' : 'A bowl',
        note: m.open < 0.75 ? 'Wider than it is tall, with the rim turned in. Good for keeping soup warm.'
                            : 'Wider than it is tall, with an open rim. The first form most people get right.' };
    }
    if (m.h <= 12.5 && m.open >= 0.65) {
      return { kind: 'cup', name: m.h < 7 ? 'A small cup' : 'A cup',
        note: 'About as tall as a hand, with an easy rim to drink from. Add a pulled handle and it is a mug.' };
    }
    return { kind: 'vase', name: m.h > 22 ? 'A tall vase' : m.h < 12.5 ? 'A bud vase' : 'A vase',
      note: m.open >= 0.85 ? 'Tall and straight, open all the way up. Pulling this much height is the skill.'
                           : 'Tall, with a rim open enough to take stems. Pulling height is the skill here.' };
  }

  var CLASS_FOR = { bowl: 'first-bowls', cup: 'cups-and-handles', vase: 'tall-forms', bottle: 'narrow-necks', plate: 'wide-and-flat' };

  function inches(cm) {
    var q = Math.round(cm / 2.54 * 4), whole = Math.floor(q / 4), frac = ['', '¼', '½', '¾'][q % 4];
    return (whole || !frac ? whole : '') + frac + ' in';
  }
  function pounds(g) {
    var q = Math.max(1, Math.round(g / 453.6 * 4)), whole = Math.floor(q / 4), frac = ['', '¼', '½', '¾'][q % 4];
    return (whole || !frac ? whole : '') + frac + ' lb';
  }

  var out = {
    name: document.getElementById('made-name'), note: document.getElementById('made-note'),
    h: document.getElementById('log-height'), rim: document.getElementById('log-rim'),
    wide: document.getElementById('log-wide'), clay: document.getElementById('log-clay'),
    holds: document.getElementById('log-holds'), tName: document.getElementById('taught-name'),
    tWhen: document.getElementById('taught-when'), tLink: document.getElementById('taught-link'),
    live: document.getElementById('pot-live'), stageNote: document.getElementById('stage-note')
  };
  var liveTimer = 0, lastKind = '';

  function report() {
    var m = measure(), c = classify(m);
    var course = window.MONSOON ? window.MONSOON.course(CLASS_FOR[c.kind]) : null;
    out.name.textContent = c.name;
    out.note.textContent = c.note;
    out.h.textContent = inches(m.h);
    out.rim.textContent = inches(m.rim);
    out.wide.textContent = inches(m.wide);
    out.clay.textContent = pounds(m.grams);
    var oz = m.ml / 29.57;
    out.holds.textContent = c.kind === 'plate' ? 'a meal' : oz < 1.5 ? 'a sip' : Math.round(oz) + ' fl oz';
    if (course) {
      out.tName.textContent = course.name;
      out.tWhen.textContent = course.days + ', ' + course.short + ' · ' + course.length + ' · $' + course.price;
      out.tLink.setAttribute('data-book', course.id);
      out.tLink.textContent = 'Book ' + course.name;
    }
    if (c.kind !== lastKind) {
      lastKind = c.kind;
      out.name.classList.remove('is-new');
      void out.name.offsetWidth;
      out.name.classList.add('is-new');
    }
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () {
      out.live.textContent = c.name + '. ' + inches(m.h) + ' tall, ' + inches(m.rim) + ' across the rim. About ' +
        pounds(m.grams) + ' of clay.' + (course ? ' Taught in ' + course.name + '.' : '');
    }, 700);
  }

  /* ---------- drawing ---------- */

  // Tones of the one clay colour, lit from the upper left.
  var BANDS = [
    [-1, '#a4472a'], [-0.8, '#b65a3b'], [-0.56, '#c9775a'], [-0.34, '#b65a3b'],
    [0.06, '#a4472a'], [0.46, '#8b3a22'], [0.78, '#732e1a']
  ];
  var SPECKS = [];
  (function () {
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 18; i++) SPECKS.push({ a: rnd() * Math.PI * 2, t: 0.05 + rnd() * 0.88, s: 1 + rnd() * 1.5 });
  })();

  var g = {};
  function scaffold() {
    // Ruler, in inches.
    var ruler = el('g', { 'class': 'ruler', 'aria-hidden': 'true' }, svg);
    el('line', { x1: 12, y1: BASE, x2: 12, y2: BASE - 12 * 2.54 * S }, ruler);
    for (var i = 0; i <= 12; i++) {
      var y = BASE - i * 2.54 * S;
      el('line', { x1: i % 2 ? 8 : 5, y1: f(y), x2: 12, y2: f(y) }, ruler);
      if (i % 4 === 0 && i > 0) { el('text', { x: 17, y: f(y + 3.5) }, ruler).textContent = i; }
    }
    el('text', { x: 17, y: f(BASE - 12 * 2.54 * S - 12), 'class': 'ruler-unit' }, ruler).textContent = 'in';
    g.lipLine = el('line', { 'class': 'lip-line' }, ruler);
    g.mark = el('path', { 'class': 'ruler-mark', d: 'M0 0l-7-4v8z' }, ruler);

    // The wheel head.
    var wheel = el('g', { 'class': 'wheel', 'aria-hidden': 'true' }, svg);
    var rx = 228, ry = rx * K, t = 14;
    el('path', { 'class': 'wheel-side', d: 'M' + (CX - rx) + ' ' + BASE + 'v' + t + 'a' + rx + ' ' + ry + ' 0 0 0 ' + (rx * 2) + ' 0v-' + t + 'z' }, wheel);
    el('ellipse', { 'class': 'wheel-top', cx: CX, cy: BASE, rx: rx, ry: f(ry) }, wheel);
    [72, 124, 176].forEach(function (r) { el('ellipse', { 'class': 'wheel-ring', cx: CX, cy: BASE, rx: r, ry: f(r * K) }, wheel); });
    var wclip = el('clipPath', { id: 'wheel-clip' }, el('defs', {}, svg));
    el('ellipse', { cx: CX, cy: BASE, rx: rx - 3, ry: f(ry - 1) }, wclip);
    g.wet = el('path', { 'class': 'wheel-wet', 'clip-path': 'url(#wheel-clip)' }, wheel);
    g.pins = [el('ellipse', { 'class': 'wheel-pin' }, wheel), el('ellipse', { 'class': 'wheel-pin' }, wheel)];
    g.tick = el('line', { 'class': 'wheel-tick' }, wheel);

    // The pot.
    var pot = el('g', { 'class': 'pot', 'aria-hidden': 'true' }, svg);
    g.bands = BANDS.map(function (b) { return el('path', { fill: b[1] }, pot); });
    g.spiral = el('path', { 'class': 'pot-spiral' }, pot);
    g.specks = SPECKS.map(function () { return el('ellipse', { 'class': 'pot-speck' }, pot); });
    var defs = el('defs', {}, svg);
    var clip = el('clipPath', { id: 'lip-clip' }, defs);
    g.clipE = el('ellipse', {}, clip);
    g.inside = el('ellipse', { 'class': 'pot-inside' }, pot);
    g.shade = el('ellipse', { 'class': 'pot-shade', 'clip-path': 'url(#lip-clip)' }, pot);
    g.rim = el('ellipse', { 'class': 'pot-rim' }, pot);

    // Handles last, so they sit on top and come last in the tab order of the drawing.
    g.handles = {};
    HANDLES.forEach(function (h) {
      var node = el('g', { 'class': 'handle', tabindex: 0, role: 'slider', 'aria-label': h.label, 'data-key': h.key }, svg);
      el('circle', { 'class': 'handle-hit', r: 31 }, node);
      el('circle', { 'class': 'handle-ring', r: 10 }, node);
      el('circle', { 'class': 'handle-dot', r: 3.2 }, node);
      var text = el('text', { 'class': 'handle-label' }, node);
      text.textContent = h.key;
      g.handles[h.key] = { node: node, text: text };
      node.addEventListener('pointerdown', onDown);
      node.addEventListener('keydown', onKey);
      node.addEventListener('focus', function () { note(h); });
      node.addEventListener('blur', function () { if (!drag) note(null); });
      node.addEventListener('pointerenter', function () { if (!drag) note(h); });
      node.addEventListener('pointerleave', function () { if (!drag && document.activeElement !== node) note(null); });
    });
  }

  var HANDLES = [
    { key: 'foot', side: -1, r: 'rf', label: 'Foot. Left and right arrows change its width.', y: function () { return 0; } },
    { key: 'belly', side: 1, r: 'rb', label: 'Belly. Left and right arrows change its width, up and down move it.', y: function () { return p.fb * p.h; } },
    { key: 'shoulder', side: -1, r: 'rs', label: 'Shoulder. Left and right arrows change its width, up and down move it.', y: function () { return p.fs * p.h; } },
    { key: 'lip', side: 1, r: 'rl', label: 'Lip. Left and right arrows change the rim, up and down change the height of the pot.', y: function () { return p.h; } }
  ];
  function handle(key) { for (var i = 0; i < HANDLES.length; i++) if (HANDLES[i].key === key) return HANDLES[i]; }

  var noted = null;
  function note(h) {
    noted = h;
    if (!h) { out.stageNote.textContent = 'Foot · belly · shoulder · lip'; return; }
    var txt = h.key.charAt(0).toUpperCase() + h.key.slice(1) + ' · ' + inches(p[h.r] * 2) + ' across';
    if (h.key !== 'foot') txt += ' · ' + inches(h.y()) + ' up';
    out.stageNote.textContent = txt;
  }

  function drawShape() {
    buildProfile();
    for (var i = 0; i < BANDS.length; i++) g.bands[i].setAttribute('d', bandPath(BANDS[i][0]));
    // The wheel head is wet, so it carries a faint reflection of the lowest part of the pot.
    var m = 0, wet = [], j;
    while (m < N && prof[m][1] < 3.2) m++;
    for (j = 0; j <= m; j++) wet.push(pt(prof[j][0], -prof[j][1], -1));
    for (j = 1; j < 12; j++) wet.push(pt(prof[m][0], -prof[m][1], -1 + j / 6));
    for (j = m; j >= 0; j--) wet.push(pt(prof[j][0], -prof[j][1], 1));
    g.wet.setAttribute('d', 'M' + wet.map(function (q) { return f(q[0]) + ' ' + f(q[1]); }).join('L') + 'Z');
    var top = prof[N], cy = BASE - top[1] * S, rx = top[0] * S, ry = rx * K;
    [g.inside, g.rim, g.clipE].forEach(function (e) {
      e.setAttribute('cx', CX); e.setAttribute('cy', f(cy)); e.setAttribute('rx', f(rx)); e.setAttribute('ry', f(ry));
    });
    g.shade.setAttribute('cx', f(CX - rx * 0.24)); g.shade.setAttribute('cy', f(cy + ry * 0.42));
    g.shade.setAttribute('rx', f(rx * 0.98)); g.shade.setAttribute('ry', f(ry * 1.02));
    // A deep pot is dark inside; a plate faces the light. Blend between the two.
    var deep = clamp((p.h / (p.rl * 2) - 0.08) / 0.5, 0, 1);
    g.inside.setAttribute('fill', mix('#b65a3b', '#8b3a22', deep));
    g.shade.setAttribute('fill', mix('#9a4128', '#5a2313', deep));
    g.lipLine.setAttribute('x1', 22); g.lipLine.setAttribute('x2', f(Math.max(22, CX - rx - 6)));
    g.lipLine.setAttribute('y1', f(cy)); g.lipLine.setAttribute('y2', f(cy));
    g.mark.setAttribute('transform', 'translate(' + 12 + ' ' + f(cy) + ') rotate(180)');

    HANDLES.forEach(function (h) {
      var x = CX + h.side * p[h.r] * S, y = BASE - h.y() * S, node = g.handles[h.key].node, text = g.handles[h.key].text;
      node.setAttribute('transform', 'translate(' + f(x) + ' ' + f(y) + ')');
      var outside = h.side < 0 ? x - 84 > 30 : x + 84 < 478;
      if (outside) { text.setAttribute('x', h.side * 18); text.setAttribute('y', 4); text.setAttribute('text-anchor', h.side < 0 ? 'end' : 'start'); }
      else { text.setAttribute('x', -h.side * 4); text.setAttribute('y', -18); text.setAttribute('text-anchor', h.side < 0 ? 'start' : 'end'); }
      text.setAttribute('class', 'handle-label' + (h.key === 'foot' && outside ? ' on-wheel' : ''));
      node.setAttribute('aria-valuemin', f(LIM[h.r][0] * 2 / 2.54));
      node.setAttribute('aria-valuemax', f(LIM[h.r][1] * 2 / 2.54));
      node.setAttribute('aria-valuenow', f(p[h.r] * 2 / 2.54));
      node.setAttribute('aria-valuetext', inches(p[h.r] * 2) + ' across' + (h.key === 'foot' ? '' : ', ' + inches(h.y()) + ' above the wheel'));
    });
    if (noted) note(noted);
    drawTurn();
    report();
  }

  // The parts that move when the wheel turns: throwing lines, iron specks, bat pins.
  function drawTurn() {
    var turns = clamp(Math.round(p.h / 2.4), 2, 11), steps = turns * 26, d = '', pen = false;
    for (var i = 0; i <= steps; i++) {
      var t = 0.03 + 0.93 * i / steps, a = phi + t * turns * Math.PI * 2, c = Math.cos(a);
      if (c > 0.12) {
        var q = at(t), x = CX + q[0] * S * Math.sin(a), y = BASE - q[1] * S + K * q[0] * S * c;
        d += (pen ? 'L' : 'M') + f(x) + ' ' + f(y);
        pen = true;
      } else pen = false;
    }
    g.spiral.setAttribute('d', d);

    for (i = 0; i < SPECKS.length; i++) {
      var s = SPECKS[i], e = g.specks[i], ang = s.a + phi, cs = Math.cos(ang);
      if (cs < 0.15) { e.setAttribute('rx', 0); continue; }
      var w = at(s.t);
      e.setAttribute('cx', f(CX + w[0] * S * Math.sin(ang)));
      e.setAttribute('cy', f(BASE - w[1] * S + K * w[0] * S * cs));
      e.setAttribute('rx', f(s.s * cs)); e.setAttribute('ry', f(s.s));
    }

    for (i = 0; i < 2; i++) {
      var pa = phi + i * Math.PI, R = 198;
      g.pins[i].setAttribute('cx', f(CX + R * Math.sin(pa)));
      g.pins[i].setAttribute('cy', f(BASE + R * K * Math.cos(pa)));
      g.pins[i].setAttribute('rx', 4.5); g.pins[i].setAttribute('ry', 1.6);
    }
    var ta = phi + 1.1;
    g.tick.setAttribute('x1', f(CX + 210 * Math.sin(ta))); g.tick.setAttribute('y1', f(BASE + 210 * K * Math.cos(ta)));
    g.tick.setAttribute('x2', f(CX + 226 * Math.sin(ta))); g.tick.setAttribute('y2', f(BASE + 226 * K * Math.cos(ta)));
  }

  /* ---------- the wheel ---------- */

  function wantSpin() {
    if (wheelOn) return true;
    if (reduced) return false;
    return !!drag || !!tween || performance.now() < shapingUntil;
  }
  function touchWheel() {
    shapingUntil = performance.now() + 1600;
    if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function frame(now) {
    var dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    var target = wantSpin() ? 1.7 : 0;
    speed += (target - speed) * Math.min(1, dt * 3.2);
    phi = (phi + speed * dt) % (Math.PI * 2);
    var shapeChanged = false;
    if (tween) {
      var q = clamp((now - tween.t0) / tween.dur, 0, 1), e = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
      for (var k in tween.to) p[k] = tween.from[k] + (tween.to[k] - tween.from[k]) * e;
      if (q >= 1) tween = null;
      shapeChanged = true;
    }
    if (shapeChanged) drawShape(); else drawTurn();
    if (target === 0 && speed < 0.02 && !tween) { speed = 0; raf = 0; return; }
    raf = requestAnimationFrame(frame);
  }

  /* ---------- shaping ---------- */

  function setRadius(h, r) { p[h.r] = clamp(r, LIM[h.r][0], LIM[h.r][1]); }
  function setHeight(h, y) {
    if (h.key === 'lip') p.h = clamp(y, LIM.h[0], LIM.h[1]);
    else if (h.key === 'belly') p.fb = clamp(y / p.h, 0.12, p.fs - 0.16);
    else if (h.key === 'shoulder') p.fs = clamp(y / p.h, p.fb + 0.16, 0.92);
  }
  function changed() { tween = null; drawShape(); touchWheel(); }

  function svgPoint(e) {
    var m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    var q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: q.x, y: q.y };
  }

  function onDown(e) {
    if (e.button && e.button !== 0) return;
    var pos = svgPoint(e), best = null, bestD = 1e9;
    // Handles can sit close together on a low pot, so take the nearest one to the pointer.
    HANDLES.forEach(function (h) {
      var dx = CX + h.side * p[h.r] * S - pos.x, dy = BASE - h.y() * S - pos.y, d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = h; }
    });
    var node = g.handles[best.key].node;
    drag = { h: best, id: e.pointerId, dx: CX + best.side * p[best.r] * S - pos.x, dy: BASE - best.y() * S - pos.y, node: node };
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    drag.target = e.currentTarget;
    node.classList.add('is-active');
    node.focus({ preventScroll: true });
    note(best);
    e.currentTarget.addEventListener('pointermove', onMove);
    e.currentTarget.addEventListener('pointerup', onUp);
    e.currentTarget.addEventListener('pointercancel', onUp);
    touchWheel();
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var pos = svgPoint(e), h = drag.h;
    setRadius(h, (pos.x + drag.dx - CX) * h.side / S);
    setHeight(h, (BASE - (pos.y + drag.dy)) / S);
    changed();
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.node.classList.remove('is-active');
    drag.target.removeEventListener('pointermove', onMove);
    drag.target.removeEventListener('pointerup', onUp);
    drag.target.removeEventListener('pointercancel', onUp);
    drag = null;
    touchWheel();
  }

  function onKey(e) {
    var h = handle(e.currentTarget.getAttribute('data-key'));
    var step = e.shiftKey ? 1.27 : 0.3175; // half an inch, or an eighth
    var used = true;
    if (e.key === 'ArrowRight') setRadius(h, p[h.r] + step);
    else if (e.key === 'ArrowLeft') setRadius(h, p[h.r] - step);
    else if (e.key === 'ArrowUp' && h.key !== 'foot') setHeight(h, h.y() + step);
    else if (e.key === 'ArrowDown' && h.key !== 'foot') setHeight(h, h.y() - step);
    else used = false;
    if (used) { e.preventDefault(); changed(); }
  }

  document.querySelectorAll('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      var to = PRESETS[b.getAttribute('data-preset')];
      if (reduced) { p = copy(to); tween = null; drawShape(); return; }
      tween = { from: copy(p), to: to, t0: performance.now(), dur: 700 };
      touchWheel();
    });
  });

  var wheelBtn = document.getElementById('wheel-btn');
  if (wheelBtn) {
    wheelBtn.addEventListener('click', function () {
      wheelOn = !wheelOn;
      wheelBtn.setAttribute('aria-pressed', String(wheelOn));
      wheelBtn.textContent = wheelOn ? 'Stop the wheel' : 'Keep the wheel turning';
      touchWheel();
    });
  }

  // Stop drawing frames when the tab is hidden.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (!document.hidden && wantSpin()) touchWheel();
  });

  scaffold();
  drawShape();
  out.live.textContent = '';
  clearTimeout(liveTimer);
})();
