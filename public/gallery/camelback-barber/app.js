/* Camelback Barber: the chair board.
   Every time on this page is Phoenix wall-clock time, read through Intl with the
   America/Phoenix zone, so the board is right wherever the visitor is sitting. */
(function () {
  'use strict';

  var TZ = 'America/Phoenix';
  var STORE = 'camelback-barber:v1';
  var GRID = 20; // bookable start times fall on :00, :20 and :40

  // Shop hours in minutes after midnight, by day of week (0 is Sunday).
  var HOURS = { 0: null, 1: null, 2: [540, 1140], 3: [540, 1140], 4: [540, 1140], 5: [540, 1140], 6: [480, 960] };

  var BARBERS = [
    { chair: 1, name: 'Odell',   lunch: [740, 780], shifts: { 2: [540, 1140], 3: [540, 1140], 4: [540, 1140], 5: [540, 1140], 6: [480, 960] } },
    { chair: 2, name: 'Tino',    lunch: [780, 820], shifts: { 2: [540, 1140], 3: [540, 1140], 4: [540, 1140], 5: [540, 1140], 6: [480, 960] } },
    { chair: 3, name: 'Marisol', lunch: [840, 880], shifts: { 3: [660, 1140], 4: [660, 1140], 5: [660, 1140], 6: [480, 960] } },
    { chair: 4, name: 'Wes',     lunch: [760, 800], shifts: { 2: [540, 1020], 3: [540, 1140], 4: [540, 1140], 5: [540, 1140] } }
  ];

  var SERVICES = [
    { id: 'classic', name: 'Classic cut',     noun: 'classic cut',     mins: 30, price: 32 },
    { id: 'fade',    name: 'Fade',            noun: 'fade',            mins: 40, price: 38 },
    { id: 'buzz',    name: 'Buzz cut',        noun: 'buzz cut',        mins: 20, price: 22 },
    { id: 'combo',   name: 'Cut and beard',   noun: 'cut and beard',   mins: 50, price: 50 },
    { id: 'beard',   name: 'Beard trim',      noun: 'beard trim',      mins: 20, price: 18 },
    { id: 'shave',   name: 'Hot towel shave', noun: 'hot towel shave', mins: 40, price: 36 },
    { id: 'kids',    name: "Kids' cut",       noun: "kids' cut",       mins: 20, price: 20 }
  ];

  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- the clock ---------- */

  var partsFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'
  });

  function wallParts(date) {
    var o = {};
    partsFmt.formatToParts(date).forEach(function (p) { if (p.type !== 'literal') o[p.type] = parseInt(p.value, 10); });
    return o;
  }

  // ?at=2026-11-19T15:22 pretends it is that moment in Phoenix, so the board can be seen busy at any hour.
  var skew = 0;
  (function readSimulatedTime() {
    var m = /[?&]at=(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(location.search);
    if (!m) return;
    var wantUTC = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    var p = wallParts(new Date(wantUTC));
    var seenUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    skew = (wantUTC + (wantUTC - seenUTC)) - Date.now(); // correct by the zone's own offset
  })();

  function phoenixNow() {
    var p = wallParts(new Date(Date.now() + skew));
    var key = dayKey(p.year, p.month, p.day);
    return { key: key, mins: p.hour * 60 + p.minute, dow: dowOf(key) };
  }

  /* ---------- calendar days as plain keys, "2026-11-19" ---------- */

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function keyDate(key) { var a = key.split('-'); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])); }
  function dowOf(key) { return keyDate(key).getUTCDay(); }
  function addDays(key, n) {
    var d = keyDate(key); d.setUTCDate(d.getUTCDate() + n);
    return dayKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  function dayWord(key, now) {
    if (key === now.key) return 'today';
    if (key === addDays(now.key, 1)) return 'tomorrow';
    return DAY_NAMES[dowOf(key)];
  }
  function dayLong(key) {
    var d = keyDate(key);
    return DAY_NAMES[d.getUTCDay()] + ', ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate();
  }
  function clock(mins) { var h = Math.floor(mins / 60), m = mins % 60; return ((h + 11) % 12 + 1) + ':' + pad(m); }
  function clockAP(mins) { return clock(mins) + (mins < 720 ? ' AM' : ' PM'); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- the invented schedule ----------
     Other customers' appointments are generated from a seed made of the date and the chair,
     so a given day always looks the same and a saved booking never collides after a reload. */

  function seedFrom(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var dayCache = {};
  function dayPlan(ci, key) {
    var id = ci + '|' + key;
    if (dayCache[id]) return dayCache[id];
    var b = BARBERS[ci], shift = b.shifts[dowOf(key)] || null, busy = [];
    if (shift) {
      var rand = rng(seedFrom(key + '#' + b.chair));
      var fill = 0.3 + rand() * 0.24; // some days are busier than others
      var lengths = [20, 30, 30, 40, 40, 50];
      var t = shift[0];
      while (t < shift[1]) {
        if (t >= b.lunch[0] && t < b.lunch[1]) { t = b.lunch[1]; continue; }
        if (rand() < fill) {
          var len = lengths[Math.floor(rand() * lengths.length)];
          var stop = t < b.lunch[0] ? Math.min(b.lunch[0], shift[1]) : shift[1];
          if (t + len <= stop) {
            busy.push({ s: t, e: t + len, type: 'cut' });
            t = Math.ceil((t + len) / GRID) * GRID;
            continue;
          }
        }
        t += GRID;
      }
      if (b.lunch[0] >= shift[0] && b.lunch[1] <= shift[1]) busy.push({ s: b.lunch[0], e: b.lunch[1], type: 'lunch' });
      busy.sort(function (a, c) { return a.s - c.s; });
    }
    return (dayCache[id] = { shift: shift, busy: busy });
  }

  /* ---------- state ---------- */

  var state = { service: null, chair: null, day: null, time: null, booking: null, changing: false };

  function load() {
    try {
      var raw = sessionStorage.getItem(STORE);
      if (!raw) return null;
      var b = JSON.parse(raw);
      if (b && svc(b.service) && BARBERS[b.chair] && /^\d{4}-\d{2}-\d{2}$/.test(b.day) && typeof b.time === 'number') return b;
    } catch (e) { /* private mode or blocked storage: carry on without it */ }
    return null;
  }
  function save() {
    try {
      if (state.booking) sessionStorage.setItem(STORE, JSON.stringify(state.booking));
      else sessionStorage.removeItem(STORE);
    } catch (e) { /* the booking still lives in memory for this page view */ }
  }

  function svc(id) { for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].id === id) return SERVICES[i]; return null; }

  // The visitor's own booking occupies its chair, unless they are in the middle of changing it.
  function mine(ci, key) {
    var b = state.booking;
    return b && !state.changing && b.chair === ci && b.day === key ? b : null;
  }
  function busyList(ci, key) {
    var list = dayPlan(ci, key).busy.slice(), b = mine(ci, key);
    if (b) { list.push({ s: b.time, e: b.time + svc(b.service).mins, type: 'mine' }); list.sort(function (a, c) { return a.s - c.s; }); }
    return list;
  }

  /* ---------- availability ---------- */

  function slots(ci, key, mins, now) {
    var plan = dayPlan(ci, key), out = [];
    if (!plan.shift || key < now.key) return out;
    var busy = busyList(ci, key);
    function fits(t) {
      if (t < plan.shift[0] || t + mins > plan.shift[1]) return false;
      for (var i = 0; i < busy.length; i++) if (t < busy[i].e && t + mins > busy[i].s) return false;
      return true;
    }
    // A chair that is empty this minute can be taken straight away, off the usual grid.
    if (key === now.key) {
      var soon = Math.ceil((now.mins + 1) / 5) * 5;
      if (soon % GRID && fits(now.mins) && fits(soon)) out.push(soon);
    }
    for (var t = Math.ceil(plan.shift[0] / GRID) * GRID; t + mins <= plan.shift[1]; t += GRID) {
      if (key === now.key && t < now.mins) continue;
      if (fits(t)) out.push(t);
    }
    return out;
  }
  function nextSlot(ci, mins, now) {
    for (var n = 0; n < 14; n++) {
      var key = addDays(now.key, n), s = slots(ci, key, mins, now);
      if (s.length) return { chair: ci, day: key, time: s[0] };
    }
    return null;
  }
  function firstOpen(mins, now) {
    var best = null;
    BARBERS.forEach(function (b, ci) {
      var n = nextSlot(ci, mins, now);
      if (n && (!best || n.day < best.day || (n.day === best.day && n.time < best.time))) best = n;
    });
    return best;
  }
  function openDays(now) {
    var out = [], key = now.key, guard = 0;
    while (out.length < 6 && guard++ < 21) {
      var h = HOURS[dowOf(key)];
      if (h && !(key === now.key && now.mins >= h[1])) out.push(key);
      key = addDays(key, 1);
    }
    return out;
  }
  function when(slot, now) { // "4:00" today, "Thursday 4:00" otherwise
    return (slot.day === now.key ? '' : dayWord(slot.day, now) + ' ') + clock(slot.time);
  }

  /* What a chair is doing this minute. */
  function chairStatus(ci, now) {
    var plan = dayPlan(ci, now.key), b = BARBERS[ci];
    if (!plan.shift) return { kind: 'away', line: HOURS[now.dow] ? 'Off today' : 'Shop is closed' };
    if (now.mins < plan.shift[0]) return { kind: 'away', line: 'In at ' + clock(plan.shift[0]) };
    if (now.mins >= plan.shift[1]) return { kind: 'away', line: 'Done for today' };
    var busy = busyList(ci, now.key), upcoming = null;
    for (var i = 0; i < busy.length; i++) {
      var x = busy[i];
      if (now.mins >= x.s && now.mins < x.e) {
        if (x.type === 'lunch') return { kind: 'away', line: 'At lunch until ' + clock(x.e) };
        if (x.type === 'mine') return { kind: 'busy', line: 'Your cut, until ' + clock(x.e) };
        return { kind: 'busy', line: 'Cutting until ' + clock(x.e) };
      }
      if (x.s > now.mins && !upcoming) upcoming = x;
    }
    var until = upcoming ? upcoming.s : plan.shift[1];
    // Less than a quarter of an hour is not an open chair, it is a barber sweeping up.
    if (upcoming && upcoming.type === 'mine' && until - now.mins < 30) return { kind: 'open', line: 'Ready for you at ' + clock(until) };
    if (until - now.mins < 15) return { kind: 'away', line: upcoming ? 'Setting up for the ' + clock(until) : 'Closing up' };
    return { kind: 'open', line: 'Open now, until ' + clock(until), until: until, walkin: true };
  }

  function shopState(now) {
    var h = HOURS[now.dow];
    if (h && now.mins >= h[0] && now.mins < h[1]) return { open: true, text: 'Open now until ' + clockAP(h[1]) };
    if (h && now.mins < h[0]) return { open: false, text: 'Closed right now. Opens today at ' + clockAP(h[0]) };
    for (var n = 1; n < 8; n++) {
      var key = addDays(now.key, n), hh = HOURS[dowOf(key)];
      if (hh) return { open: false, text: 'Closed right now. Opens ' + dayWord(key, now) + ' at ' + clockAP(hh[0]) };
    }
    return { open: false, text: 'Closed right now' };
  }

  /* ---------- drawing a chair from above ---------- */

  function chairSVG() {
    var S = 'stroke="#6b1f2a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
    return '<svg viewBox="0 0 140 196" aria-hidden="true" focusable="false">' +
      // the station: counter, mirror edge, a few things on the shelf
      '<rect x="14" y="6" width="112" height="26" rx="5" fill="#f4efe3" ' + S + '/>' +
      '<path d="M22 11.5 H118" stroke="#c79a3b" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="32" cy="23" r="4" fill="#6b1f2a"/><circle cx="44" cy="23" r="3" fill="none" stroke="#6b1f2a" stroke-width="2"/>' +
      '<rect x="84" y="20.5" width="26" height="5" rx="2" fill="#6b1f2a"/>' +
      // floor plate
      '<circle class="ring" cx="70" cy="118" r="52" fill="rgba(244,239,227,.7)" stroke="#6b1f2a" stroke-width="1.5"/>' +
      '<g class="seatgrp">' +
        '<path d="M58 70 V84 M82 70 V84" ' + S + '/>' +
        '<rect x="46" y="56" width="48" height="14" rx="6" fill="#f4efe3" ' + S + '/>' +
        '<path d="M54 63 H86" stroke="#6b1f2a" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>' +
        '<path d="M34 136 C34 176,106 176,106 136 L106 150 C106 192,34 192,34 150 Z" fill="#6b1f2a" ' + S + '/>' +
        '<rect x="26" y="92" width="14" height="52" rx="7" fill="#6b1f2a" ' + S + '/>' +
        '<rect x="100" y="92" width="14" height="52" rx="7" fill="#6b1f2a" ' + S + '/>' +
        '<rect x="40" y="82" width="60" height="66" rx="13" fill="#ebe4d2" ' + S + '/>' +
        '<rect x="48" y="90" width="44" height="46" rx="8" fill="none" stroke="#6b1f2a" stroke-width="1.2" stroke-dasharray="3 4" opacity=".7"/>' +
        '<circle cx="70" cy="113" r="3" fill="#c79a3b" stroke="#6b1f2a" stroke-width="1.2"/>' +
        // someone in the chair, under a pinstripe cape
        '<g class="occ">' +
          '<rect x="59" y="50" width="9" height="16" rx="4.5" fill="#1a1614"/><rect x="72" y="50" width="9" height="16" rx="4.5" fill="#1a1614"/>' +
          '<path d="M70 74 C96 74,112 96,108 126 C104 150,36 150,32 126 C28 96,44 74,70 74 Z" fill="url(#cape-stripes)" ' + S + '/>' +
          '<circle cx="54.500" cy="134" r="3.5" fill="#ebe4d2" stroke="#6b1f2a" stroke-width="1.5"/><circle cx="85.500" cy="134" r="3.5" fill="#ebe4d2" stroke="#6b1f2a" stroke-width="1.5"/>' +
          '<circle cx="70" cy="134" r="15" fill="#1a1614"/>' +
          '<path d="M61 130 C64 124,74 122,79 128" fill="none" stroke="#f4efe3" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>' +
        '</g>' +
      '</g></svg>';
  }

  /* ---------- rendering ---------- */

  var $ = function (id) { return document.getElementById(id); };
  var el = {};
  ['shopstate', 'shopstate-text', 'next-main', 'next-sub', 'hero-book', 'hero-yours', 'pole', 'clock', 'ticket-zone', 'live',
    'flow', 'changing', 'services', 'first-open', 'chairs', 'days', 'times-note', 'times', 'summary', 'book-form', 'who', 'book-btn', 'hours'
  ].forEach(function (id) { el[id] = $(id); });

  function h(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }
  // Messages that repeat what is already on screen go to a quiet region that only screen readers hear.
  function say(msg, quiet) {
    var a = quiet ? $('live-quiet') : el.live, b = quiet ? el.live : $('live-quiet');
    a.textContent = ''; b.textContent = '';
    setTimeout(function () { a.textContent = msg; }, 30);
  }

  function bookingLine(b, now) { // "Fade with Tino, Thursday 4:00, chair 2"
    return svc(b.service).name + ' with ' + BARBERS[b.chair].name + ', ' + dayWord(b.day, now) + ' ' + clock(b.time) + ', chair ' + BARBERS[b.chair].chair;
  }

  function buildOnce() {
    SERVICES.forEach(function (s) {
      var label = h('label', 'svc');
      var input = h('input'); input.type = 'radio'; input.name = 'service'; input.value = s.id;
      var face = h('span'); face.appendChild(h('b', null, s.name)); face.appendChild(h('small', null, s.mins + ' min, $' + s.price));
      label.appendChild(input); label.appendChild(face);
      el.services.appendChild(label);
      input.addEventListener('change', function () { state.service = s.id; reconcile(); render(); });
    });

    BARBERS.forEach(function (b, ci) {
      var btn = h('button', 'chair'); btn.type = 'button'; btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = chairSVG();
      btn.appendChild(h('span', 'picked')).setAttribute('aria-hidden', 'true');
      btn.appendChild(h('span', 'plate', 'Chair ' + b.chair));
      btn.appendChild(h('span', 'who', b.name));
      btn.appendChild(h('span', 'status'));
      btn.appendChild(h('span', 'next'));
      var m = btn.appendChild(h('span', 'mine')); m.hidden = true;
      btn.appendChild(h('span', 'line')).setAttribute('aria-hidden', 'true');
      el.chairs.appendChild(btn);
      btn.addEventListener('click', function () { pickChair(ci); });
    });

    el['first-open'].addEventListener('click', function () {
      var now = phoenixNow();
      if (!state.service) state.service = 'classic';
      var s = firstOpen(svc(state.service).mins, now);
      if (!s) return;
      state.chair = s.chair; state.day = s.day; state.time = s.time;
      render();
      say('First open chair: ' + bookingLine({ service: state.service, chair: s.chair, day: s.day, time: s.time }, now) + '. Check it below and book.');
      el.summary.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    });

    el['hero-book'].addEventListener('click', function () {
      if (state.booking && !state.changing) return; // the link then just goes to the ticket
      if (heroChair != null && state.chair == null) pickChair(heroChair); // the chair the first screen just named
    });

    el['book-form'].addEventListener('submit', function (ev) {
      ev.preventDefault();
      var now = phoenixNow();
      if (!state.service || state.chair == null || state.time == null) return;
      // Check once more against the clock: the minute may have passed while the form sat open.
      if (slots(state.chair, state.day, svc(state.service).mins, now).indexOf(state.time) < 0) {
        state.time = null; render();
        say('That time has just gone. Pick another and book again.');
        return;
      }
      var was = state.changing;
      state.booking = {
        service: state.service, chair: state.chair, day: state.day, time: state.time,
        name: el.who.value.trim().slice(0, 24),
        no: 1000 + seedFrom(state.day + state.time + state.chair + state.service) % 9000
      };
      state.changing = false;
      save();
      render(true);
      say((was ? 'Changed. ' : 'Booked. ') + bookingLine(state.booking, now) + '.', true);
      spinPole();
      var t = el['ticket-zone'].querySelector('.ticket');
      if (t) { t.focus({ preventScroll: true }); t.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); }
    });
  }

  function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function spinPole() {
    el.pole.classList.remove('spin'); void el.pole.offsetWidth; el.pole.classList.add('spin');
  }

  function pickChair(ci) {
    var now = phoenixNow();
    state.chair = ci;
    var mins = svc(state.service || 'buzz').mins;
    if (!state.day || !slots(ci, state.day, mins, now).length) {
      var n = nextSlot(ci, mins, now);
      if (n) state.day = n.day;
    }
    reconcile(); render();
  }

  // Drop any choice that the clock or another choice has made impossible.
  function reconcile() {
    var now = phoenixNow(), days = openDays(now);
    if (!state.day || days.indexOf(state.day) < 0) {
      var f = firstOpen(svc(state.service || 'buzz').mins, now);
      state.day = f && days.indexOf(f.day) >= 0 ? f.day : days[0];
    }
    if (state.time != null && (state.chair == null || !state.service ||
        slots(state.chair, state.day, svc(state.service).mins, now).indexOf(state.time) < 0)) state.time = null;
    if (state.booking) { // a booking whose time has come and gone is finished
      var b = state.booking, end = b.time + svc(b.service).mins;
      if (b.day < now.key || (b.day === now.key && end <= now.mins)) { state.booking = null; state.changing = false; save(); }
    }
  }

  var heroChair = null;
  var lastTimesSig = '', lastDaysSig = '', lastTicketSig = '', lastStripSig = '';

  function render(fresh) {
    var now = phoenixNow();
    var booked = !!state.booking && !state.changing;
    var service = state.service ? svc(state.service) : null;
    var mins = service ? service.mins : 20;

    /* clock, hero, hours */
    setText(el.clock, DAY_NAMES[now.dow] + ' ' + clockAP(now.mins) + ' in Phoenix. The board keeps itself current.');
    var shop = shopState(now);
    setText(el['shopstate-text'], shop.text);
    el.shopstate.classList.toggle('is-open', shop.open);
    el.pole.classList.toggle('is-closed', !shop.open);
    [].forEach.call(el.hours.querySelectorAll('tr'), function (tr) { tr.classList.toggle('is-today', +tr.getAttribute('data-dow') === now.dow); });

    var statuses = BARBERS.map(function (b, ci) { return chairStatus(ci, now); });
    var openNow = -1;
    statuses.forEach(function (s, ci) { if (s.walkin && openNow < 0) openNow = ci; });
    var first = firstOpen(20, now);
    heroChair = openNow >= 0 ? openNow : first ? first.chair : null;
    if (openNow >= 0) {
      setText(el['next-main'], 'Chair ' + BARBERS[openNow].chair + ' with ' + BARBERS[openNow].name);
      setText(el['next-sub'], 'Open right now, free until ' + clockAP(statuses[openNow].until) + '. Walk in, or book it from here.');
    } else if (first) {
      setText(el['next-main'], 'Chair ' + BARBERS[first.chair].chair + ' with ' + BARBERS[first.chair].name);
      setText(el['next-sub'], (shop.open ? 'All four are busy. Free ' : 'First chair free ') + dayWord(first.day, now) + ' at ' + clockAP(first.time) + '.');
    }
    setText(el['hero-book'], booked ? 'See your ticket' : 'Book this chair');
    el['hero-yours'].hidden = !booked;
    if (booked) setText(el['hero-yours'], 'You are booked: ' + bookingLine(state.booking, now) + '.');

    /* services */
    [].forEach.call(el.services.querySelectorAll('input'), function (i) { i.checked = i.value === state.service; });

    /* chairs */
    [].forEach.call(el.chairs.children, function (btn, ci) {
      var st = statuses[ci];
      btn.classList.toggle('is-open', st.kind === 'open');
      btn.classList.toggle('is-busy', st.kind === 'busy');
      btn.classList.toggle('is-away', st.kind === 'away');
      btn.disabled = booked;
      btn.setAttribute('aria-pressed', String(!booked && state.chair === ci));
      setText(btn.querySelector('.status'), st.line);
      var n = nextSlot(ci, mins, now), what = service ? service.noun : 'opening';
      var soon = n && n.day === now.key && n.time - now.mins <= 5;
      setText(btn.querySelector('.next'), !n ? 'Nothing open in the next two weeks' :
        soon ? 'Room for ' + (service ? 'a ' + service.noun : 'a walk-in') + ' right now' :
        'Next ' + what + ' ' + (n.day === now.key ? 'at ' : '') + when(n, now));
      var b = state.booking, m = btn.querySelector('.mine');
      m.hidden = !(b && b.chair === ci);
      if (b && b.chair === ci) setText(m, (state.changing ? 'Was yours, ' : 'Yours, ') + dayWord(b.day, now) + ' ' + clock(b.time));
    });

    /* each chair's day as a strip: taken time in oxblood, lunch hatched, a brass tick for now */
    var stripDay = booked || !state.day ? (HOURS[now.dow] ? now.key : openDays(now)[0]) : state.day;
    var span = HOURS[dowOf(stripDay)];
    var stripSig = stripDay + '|' + now.key + '|' + Math.floor(now.mins / 5) + '|' + JSON.stringify(state.booking) + state.changing;
    if (stripSig !== lastStripSig && span) {
      lastStripSig = stripSig;
      var pct = function (t) { return ((Math.max(span[0], Math.min(span[1], t)) - span[0]) / (span[1] - span[0]) * 100).toFixed(2) + '%'; };
      [].forEach.call(el.chairs.children, function (btn, ci) {
        var line = btn.querySelector('.line'), plan = dayPlan(ci, stripDay);
        line.textContent = '';
        var bar = line.appendChild(h('span', 'line-bar'));
        var blocks = plan.shift ? busyList(ci, stripDay) : [{ s: span[0], e: span[1], type: 'off' }];
        if (plan.shift && plan.shift[0] > span[0]) blocks.push({ s: span[0], e: plan.shift[0], type: 'off' });
        if (plan.shift && plan.shift[1] < span[1]) blocks.push({ s: plan.shift[1], e: span[1], type: 'off' });
        blocks.forEach(function (x) {
          var seg = bar.appendChild(h('i', 'seg seg-' + x.type));
          seg.style.left = pct(x.s); seg.style.width = 'calc(' + pct(x.e) + ' - ' + pct(x.s) + ')';
        });
        if (stripDay === now.key && now.mins >= span[0] && now.mins <= span[1]) bar.appendChild(h('i', 'seg-now')).style.left = pct(now.mins);
        line.appendChild(h('span', 'line-ends')).innerHTML = '<span>' + clock(span[0]).replace(':00', '') + '</span><span>' +
          (stripDay === now.key ? 'today' : DAY_NAMES[dowOf(stripDay)]) + '</span><span>' + clock(span[1]).replace(':00', '') + '</span>';
      });
    }

    /* ticket or flow */
    el.flow.querySelectorAll('.step').forEach(function (s) { s.hidden = booked && !s.querySelector('#chairs'); });
    el['first-open'].hidden = booked;
    setText($('s2-t'), booked ? 'The shop right now' : 'Pick a chair');
    $('s2-n').hidden = booked;
    renderTicket(now, booked, fresh);

    el.changing.hidden = !state.changing;
    if (state.changing && !el.changing.firstChild) {
      el.changing.appendChild(h('span'));
      var keep = h('button', 'btn btn-ghost btn-small', 'Keep it as it is'); keep.type = 'button';
      keep.addEventListener('click', function () {
        state.changing = false; render();
        say('Nothing changed. Your booking stands.');
        var t = el['ticket-zone'].querySelector('.ticket'); if (t) t.focus();
      });
      el.changing.appendChild(keep);
    }
    if (state.changing) setText(el.changing.firstChild, 'Changing your booking: ' + bookingLine(state.booking, now) + '. Pick anything new below, then save.');
    if (booked) return;

    /* days */
    var days = openDays(now);
    var daysSig = days.join() + '|' + state.day + '|' + state.chair + '|' + mins + '|' + now.key;
    var counts = days.map(function (key) {
      if (state.chair != null) return slots(state.chair, key, mins, now).length;
      var c = 0; BARBERS.forEach(function (b, ci) { c += slots(ci, key, mins, now).length; }); return c;
    });
    daysSig += counts.join();
    if (daysSig !== lastDaysSig) {
      lastDaysSig = daysSig;
      var hadFocus = el.days.contains(document.activeElement) ? document.activeElement.getAttribute('data-day') : null;
      el.days.textContent = '';
      days.forEach(function (key, i) {
        var d = keyDate(key);
        var btn = h('button', 'day'); btn.type = 'button'; btn.setAttribute('data-day', key);
        btn.setAttribute('aria-pressed', String(key === state.day));
        btn.appendChild(h('b', null, key === now.key ? 'Today' : DAY_NAMES[d.getUTCDay()].slice(0, 3) + ' ' + d.getUTCDate()));
        btn.appendChild(h('small', null, counts[i] ? counts[i] + ' open' : 'Full'));
        btn.setAttribute('aria-label', dayLong(key) + ', ' + (counts[i] ? counts[i] + ' open times' : 'no open times'));
        btn.addEventListener('click', function () { state.day = key; reconcile(); render(); });
        el.days.appendChild(btn);
        if (hadFocus === key) btn.focus();
      });
    }

    /* times */
    var list = state.chair != null && service ? slots(state.chair, state.day, mins, now) : [];
    var note;
    if (!service && state.chair == null) note = 'Pick a service and a chair, and the open times show up here.';
    else if (!service) note = 'Pick a service above so we know how long to hold the chair.';
    else if (state.chair == null) note = 'Pick a chair above, or take the first open one.';
    else if (!list.length) {
      var alt = nextSlot(state.chair, mins, now), plan = dayPlan(state.chair, state.day);
      note = (plan.shift ? BARBERS[state.chair].name + ' has no room for a ' + service.noun + ' ' : BARBERS[state.chair].name + ' is off ') +
        (state.day === now.key ? 'today' : 'on ' + DAY_NAMES[dowOf(state.day)]) + '.' +
        (alt ? ' The next one is ' + dayWord(alt.day, now) + ' at ' + clockAP(alt.time) + '.' : '');
    } else note = cap(service.noun) + ' with ' + BARBERS[state.chair].name + ', ' + dayLong(state.day) + '. ' + service.mins + ' minutes in chair ' + BARBERS[state.chair].chair + '.';
    setText(el['times-note'], note);

    var timesSig = list.join() + '|' + state.time;
    if (timesSig !== lastTimesSig) {
      lastTimesSig = timesSig;
      var focusT = el.times.contains(document.activeElement) ? document.activeElement.getAttribute('data-t') : null;
      el.times.textContent = '';
      list.forEach(function (t) {
        var btn = h('button', 'time', clockAP(t)); btn.type = 'button'; btn.setAttribute('data-t', t);
        btn.setAttribute('aria-pressed', String(t === state.time));
        btn.addEventListener('click', function () { state.time = t; render(); });
        el.times.appendChild(btn);
        if (focusT === String(t)) btn.focus();
      });
    }

    /* summary */
    var ready = service && state.chair != null && state.time != null;
    el['book-form'].hidden = !ready;
    if (ready) {
      el.summary.textContent = '';
      el.summary.appendChild(h('strong', null, bookingLine({ service: state.service, chair: state.chair, day: state.day, time: state.time }, now)));
      el.summary.appendChild(document.createTextNode(dayLong(state.day) + ' at ' + clockAP(state.time) + '. ' + service.mins + ' minutes, $' + service.price + ', paid at the shop.'));
      setText(el['book-btn'], state.changing ? 'Save the change' : 'Book it');
    } else {
      var need = [];
      if (!service) need.push('a service'); if (state.chair == null) need.push('a chair'); if (state.time == null) need.push('a time');
      setText(el.summary, 'Still to pick: ' + need.join(need.length > 2 ? ', ' : ' and ').replace(/, ([^,]*)$/, ' and $1') + '.');
    }
  }

  function renderTicket(now, booked, fresh) {
    var zone = el['ticket-zone'], b = state.booking;
    var sig = booked ? JSON.stringify(b) + dayWord(b.day, now) : '';
    zone.hidden = !booked;
    if (sig === lastTicketSig && !fresh) return;
    lastTicketSig = sig;
    zone.textContent = '';
    if (!booked) return;
    var s = svc(b.service), barber = BARBERS[b.chair];

    var t = h('article', 'ticket' + (fresh ? ' fresh' : '')); t.tabIndex = -1; t.setAttribute('aria-label', 'Your booking');
    var main = h('div', 'ticket-main');
    var kicker = h('p', 'ticket-kicker'); kicker.appendChild(h('span', null, 'Camelback Barber')); kicker.appendChild(h('span', null, 'No. ' + b.no));
    main.appendChild(kicker);
    main.appendChild(h('h3', null, bookingLine(b, now)));
    main.appendChild(h('p', 'ticket-line', dayLong(b.day) + ' at ' + clockAP(b.time)));
    main.appendChild(h('p', 'ticket-meta', (b.name ? 'For ' + b.name + '. ' : '') + s.mins + ' minutes, $' + s.price + ', paid at the shop. We hold the chair ten minutes.'));

    var actions = h('div', 'ticket-actions');
    function normal() {
      actions.textContent = '';
      var change = h('button', 'btn btn-small', 'Change'); change.type = 'button';
      var cancel = h('button', 'btn btn-ghost btn-small', 'Cancel'); cancel.type = 'button';
      change.addEventListener('click', function () {
        state.changing = true;
        state.service = b.service; state.chair = b.chair; state.day = b.day; state.time = b.time;
        el.who.value = b.name || '';
        reconcile(); render();
        say('Changing your booking. Your old time is free again while you choose.', true);
        $('s1-h').scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
        var checked = el.services.querySelector('input:checked'); if (checked) checked.focus({ preventScroll: true });
      });
      cancel.addEventListener('click', function () {
        actions.textContent = '';
        actions.appendChild(h('p', null, 'Give this time back to the shop?'));
        var yes = h('button', 'btn btn-small', 'Yes, cancel it'); yes.type = 'button';
        var no = h('button', 'btn btn-ghost btn-small', 'Keep it'); no.type = 'button';
        yes.addEventListener('click', function () {
          var line = barber.name + "'s " + clock(b.time) + ' on ' + DAY_NAMES[dowOf(b.day)] + ' is open again.';
          state.booking = null; state.changing = false; state.time = null;
          save(); reconcile(); render();
          say('Cancelled. ' + line);
          var hd = $('s1-h'); hd.tabIndex = -1; hd.focus({ preventScroll: true });
        });
        no.addEventListener('click', function () { normal(); actions.firstChild.nextSibling.focus(); });
        actions.appendChild(yes); actions.appendChild(no);
        yes.focus();
      });
      actions.appendChild(change); actions.appendChild(cancel);
    }
    normal();
    main.appendChild(actions);

    var stub = h('div', 'ticket-stub');
    stub.appendChild(h('span', 'stub-label', 'Chair'));
    stub.appendChild(h('span', 'stub-num', String(barber.chair)));
    stub.appendChild(h('span', 'stub-time', DAY_NAMES[dowOf(b.day)].slice(0, 3) + ' ' + clockAP(b.time)));
    stub.appendChild(h('span', 'stub-bars')).setAttribute('aria-hidden', 'true');
    t.appendChild(main); t.appendChild(stub);
    zone.appendChild(t);
  }

  /* ---------- go ---------- */

  buildOnce();
  state.booking = load();
  reconcile();
  render();

  // Re-read the clock on the minute, and whenever the tab comes back into view.
  function tick() { reconcile(); render(); }
  (function schedule() {
    var ms = 60000 - (Date.now() + skew) % 60000 + 250;
    setTimeout(function () { tick(); schedule(); }, ms);
  })();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
})();
