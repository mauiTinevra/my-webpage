/* Ocotillo Records: hours in Phoenix time, the week label, and the two generated drawings. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1f2f6b', HOT = '#ff5a36';

  /* ---------- today's hours, on the shop's clock ---------- */
  // [open, close] in 24h, indexed by day of week (0 = Sunday). Monday is closed.
  var HOURS = { 0: [12, 17], 1: null, 2: [11, 19], 3: [11, 19], 4: [11, 19], 5: [11, 21], 6: [11, 21] };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function phoenixNow() {
    var parts = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Phoenix', hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = parseInt(p.value, 10); });
    var d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    return { y: parts.year, m: parts.month, d: parts.day, dow: d.getUTCDay(), mins: parts.hour * 60 + parts.minute, date: d };
  }
  function hoursFor(date) { // date is a UTC-midnight Date standing in for a Phoenix calendar day
    var h = HOURS[date.getUTCDay()];
    if (!h) return null;
    // first Friday of the month: open late for the art walk
    if (date.getUTCDay() === 5 && date.getUTCDate() <= 7) return [h[0], 22];
    return h;
  }
  function clock(h) { return (h % 12 || 12) + (h < 12 ? ' am' : ' pm'); }

  function status() {
    var now = phoenixNow(), h = hoursFor(now.date);
    if (h && now.mins >= h[0] * 60 && now.mins < h[1] * 60) {
      var left = h[1] * 60 - now.mins;
      return { open: true, text: left <= 45 ? 'Open for ' + left + ' more minute' + (left === 1 ? '' : 's') + ', until ' + clock(h[1]) : 'Open now until ' + clock(h[1]) };
    }
    if (h && now.mins < h[0] * 60) return { open: false, text: 'Closed right now. Opens today at ' + clock(h[0]) };
    for (var i = 1; i <= 7; i++) {
      var next = new Date(now.date.getTime() + i * 864e5), nh = hoursFor(next);
      if (nh) return { open: false, text: 'Closed right now. Opens ' + (i === 1 ? 'tomorrow' : DAYS[next.getUTCDay()]) + ' at ' + clock(nh[0]) };
    }
  }

  function paintHours() {
    var s = status(), el = document.getElementById('status'), now = phoenixNow();
    if (el && s && el.dataset.text !== s.text) {
      el.dataset.text = s.text;
      el.className = 'today-status ' + (s.open ? 'is-open' : 'is-closed');
      el.innerHTML = '<span class="dot" aria-hidden="true"></span>';
      el.appendChild(document.createTextNode(s.text + '.'));
    }
    document.querySelectorAll('#hours tr').forEach(function (tr) {
      tr.classList.toggle('is-today', +tr.dataset.d === now.dow);
    });
    var wk = document.getElementById('week');
    if (wk) {
      var monday = new Date(now.date.getTime() - ((now.dow + 6) % 7) * 864e5);
      wk.textContent = 'Four from the week of ' + new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric' }).format(monday) + '.';
    }
  }
  paintHours();
  setInterval(paintHours, 30000);

  /* ---------- drawings ---------- */
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  // small seeded generator so the drawings are the same on every visit
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  // A real halftone: dots on a rotated screen, each sized by a tone that falls off down the disc.
  function halftoneSun(svg) {
    if (!svg) return;
    var cx = 280, cy = 280, R = 270, pitch = 15, ang = 15 * Math.PI / 180;
    var cos = Math.cos(ang), sin = Math.sin(ang), d = '';
    for (var i = -30; i <= 30; i++) {
      for (var j = -30; j <= 30; j++) {
        var x = cx + (i * cos - j * sin) * pitch, y = cy + (i * sin + j * cos) * pitch;
        var dist = Math.hypot(x - cx, y - cy);
        if (dist > R) continue;
        var tone = 1 - (y - (cy - R)) / (2 * R);           // dense at the top, thin at the bottom
        tone = Math.max(0, Math.min(1, tone * 1.15 - .05)) * (dist > R - 10 ? .8 : 1);
        var r = pitch * .62 * Math.sqrt(tone);
        if (r < .9) continue;
        d += 'M' + (x - r).toFixed(1) + ' ' + y.toFixed(1) + 'a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 0 ' + (2 * r).toFixed(1) + ' 0a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 0 ' + (-2 * r).toFixed(1) + ' 0';
      }
    }
    el('path', { d: d, fill: HOT }, svg);
  }

  // An ocotillo: long canes fanning from one root, small leaves, a flame of flowers on each tip.
  function ocotillo(svg, stem, bloom) {
    if (!svg) return;
    var rand = rng(11), bx = 210, by = 508, n = 11;
    var blooms = el('g', { fill: bloom }, svg);
    var canes = el('g', { fill: 'none', stroke: stem, 'stroke-linecap': 'round' }, svg);
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1) - .5;                       // -0.5 .. 0.5 across the fan
      var lean = t * .98 + (rand() - .5) * .08;      // radians from vertical
      var len = 410 + rand() * 70 - Math.abs(t) * 170;
      var tx = bx + Math.sin(lean) * len, ty = by - Math.cos(lean) * len;
      var bend = (rand() - .5) * 50 + t * 60;
      var mx = bx + Math.sin(lean) * len * .5 - Math.cos(lean) * bend, my = by - Math.cos(lean) * len * .5 - Math.sin(lean) * bend;
      el('path', { d: 'M' + bx + ' ' + by + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1), 'stroke-width': 6.5 }, canes);
      // leaves: short ticks either side of the cane
      var leaves = '';
      for (var k = 3; k < 15; k++) {
        var u = k / 16, v = 1 - u;
        var px = v * v * bx + 2 * v * u * mx + u * u * tx, py = v * v * by + 2 * v * u * my + u * u * ty;
        var a = Math.atan2(2 * v * (my - by) + 2 * u * (ty - my), 2 * v * (mx - bx) + 2 * u * (tx - mx)) + (k % 2 ? 1 : -1) * 1.05;
        leaves += 'M' + px.toFixed(1) + ' ' + py.toFixed(1) + 'l' + (Math.cos(a) * 11).toFixed(1) + ' ' + (Math.sin(a) * 11).toFixed(1);
      }
      el('path', { d: leaves, 'stroke-width': 3 }, canes);
      // the flower flame, set a little off the tip the way a second plate lands
      var tipA = Math.atan2(ty - my, tx - mx) * 180 / Math.PI + 90;
      el('ellipse', { cx: (tx + 5).toFixed(1), cy: (ty + 3).toFixed(1), rx: 9, ry: 30, transform: 'rotate(' + tipA.toFixed(1) + ' ' + (tx + 5).toFixed(1) + ' ' + (ty + 3).toFixed(1) + ')' }, blooms);
    }
    el('path', { d: 'M150 512 H270', stroke: stem, 'stroke-width': 6.5, 'stroke-linecap': 'round' }, svg);
  }

  halftoneSun(document.getElementById('sun'));
  ocotillo(document.getElementById('ocotillo'), '#efe6d2', HOT);
})();
