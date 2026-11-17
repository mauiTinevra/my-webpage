/* Monsoon Clay: class dates, opening hours, menu and the booking form. */
(function () {
  'use strict';

  // The timetable. Each course repeats every `cycle` weeks from its first start date.
  var COURSES = [
    { id: 'first-bowls', name: 'First bowls', makes: 'bowl', anchor: [2026, 11, 1], cycle: 7, days: 'Tuesdays', time: '6:30 to 9 pm', short: '6:30 pm', length: 'six weeks', price: 285 },
    { id: 'cups-and-handles', name: 'Cups and handles', makes: 'cup', anchor: [2026, 11, 2], cycle: 7, days: 'Wednesdays', time: '6:30 to 9 pm', short: '6:30 pm', length: 'six weeks', price: 295 },
    { id: 'tall-forms', name: 'Tall forms', makes: 'vase', anchor: [2026, 11, 3], cycle: 7, days: 'Thursdays', time: '6:30 to 9 pm', short: '6:30 pm', length: 'six weeks', price: 310 },
    { id: 'narrow-necks', name: 'Narrow necks', makes: 'bottle', anchor: [2026, 11, 5], cycle: 5, days: 'Saturdays', time: '9:30 am to noon', short: '9:30 am', length: 'four weeks', price: 240 },
    { id: 'wide-and-flat', name: 'Wide and flat', makes: 'plate', anchor: [2026, 11, 6], cycle: 5, days: 'Sundays', time: '10 am to 12:30 pm', short: '10 am', length: 'four weeks', price: 240 },
    { id: 'one-night', name: 'One night at the wheel', makes: '', anchor: [2026, 10, 20], cycle: 1, days: 'Fridays', time: '7 to 9 pm', short: '7 pm', length: 'one evening', price: 65 }
  ];

  // Today in Phoenix, whatever the visitor's own clock says. Arizona keeps one time all year.
  function phoenixNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Phoenix', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
      }).formatToParts(new Date());
      var p = {};
      parts.forEach(function (x) { p[x.type] = parseInt(x.value, 10); });
      return new Date(p.year, p.month - 1, p.day, p.hour, p.minute);
    } catch (e) {
      return new Date();
    }
  }

  var now = phoenixNow();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var WEEK = 7 * 24 * 3600 * 1000;

  function nextStart(course) {
    var d = new Date(course.anchor[0], course.anchor[1], course.anchor[2]);
    var guard = 0;
    while (d < today && guard++ < 2000) {
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + course.cycle * 7);
    }
    return d;
  }

  var fmtShort = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  var fmtLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  COURSES.forEach(function (c) {
    c.start = nextStart(c);
    c.startShort = fmtShort.format(c.start);
    c.startLong = fmtLong.format(c.start);
  });

  function course(id) {
    for (var i = 0; i < COURSES.length; i++) if (COURSES[i].id === id) return COURSES[i];
    return COURSES[0];
  }

  window.MONSOON = { courses: COURSES, course: course };

  // Write the computed start dates into the page. The HTML already holds sensible dates.
  document.querySelectorAll('[data-start]').forEach(function (el) {
    var c = course(el.getAttribute('data-start'));
    el.textContent = el.getAttribute('data-format') === 'long' ? c.startLong : c.startShort;
  });

  // Opening hours, by day of the week (0 is Sunday). Times are minutes after midnight.
  var HOURS = { 0: [540, 1020], 1: null, 2: [600, 1260], 3: [600, 1260], 4: [600, 1260], 5: [600, 1260], 6: [540, 1020] };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function clock(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    var suffix = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + suffix;
  }

  function openStatus() {
    var day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    var h = HOURS[day];
    if (h && mins >= h[0] && mins < h[1]) return 'Open now until ' + clock(h[1]);
    if (h && mins < h[0]) return 'Opens today at ' + clock(h[0]);
    for (var i = 1; i <= 7; i++) {
      var d = (day + i) % 7;
      if (HOURS[d]) return 'Closed now, opens ' + (i === 1 ? 'tomorrow' : DAYS[d]) + ' at ' + clock(HOURS[d][0]);
    }
    return '';
  }

  var openEl = document.getElementById('open-now');
  if (openEl) openEl.textContent = openStatus();
  var todayRow = document.querySelector('.hours tr[data-day="' + now.getDay() + '"]');
  if (todayRow) {
    todayRow.classList.add('is-today');
    todayRow.querySelector('th').insertAdjacentHTML('beforeend', ' <span class="today-tag">today</span>');
  }

  // Small-screen menu.
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menuBtn.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  // Booking form.
  var form = document.getElementById('book-form');
  if (!form) return;
  var fClass = document.getElementById('f-class');
  var fSeats = document.getElementById('f-seats');
  var fName = document.getElementById('f-name');
  var fEmail = document.getElementById('f-email');
  var slip = document.getElementById('slip');

  function money(n) { return '$' + n.toLocaleString('en-US'); }
  function seatsText(n) { return n + (n === 1 ? ' seat' : ' seats'); }

  function summary() {
    var c = course(fClass.value), n = parseInt(fSeats.value, 10);
    document.getElementById('sum-line').textContent = c.name + ', ' + (c.cycle === 1 ? 'on ' : 'starts ') + c.startLong;
    document.getElementById('sum-seats').textContent = seatsText(n);
    document.getElementById('sum-price').textContent = money(c.price * n);
  }
  fClass.addEventListener('change', summary);
  fSeats.addEventListener('change', summary);
  summary();

  // Any "Book" link on the page carries the class it is for.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-book]');
    if (!a) return;
    fClass.value = a.getAttribute('data-book');
    summary();
    if (!slip.hidden) { slip.hidden = true; form.hidden = false; }
  });

  function setError(input, errId, bad) {
    var err = document.getElementById(errId);
    err.hidden = !bad;
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return bad;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var badName = setError(fName, 'e-name', fName.value.trim().length < 2);
    var badEmail = setError(fEmail, 'e-email', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fEmail.value.trim()));
    if (badName) { fName.focus(); return; }
    if (badEmail) { fEmail.focus(); return; }

    var c = course(fClass.value), n = parseInt(fSeats.value, 10);
    var first = fName.value.trim().split(/\s+/)[0];
    document.getElementById('slip-name').textContent = first;
    document.getElementById('slip-class').textContent = c.name;
    document.getElementById('slip-start').textContent = c.startLong;
    document.getElementById('slip-when').textContent = c.days + ', ' + c.time;
    document.getElementById('slip-seats').textContent = String(n);
    document.getElementById('slip-total').textContent = money(c.price * n);
    document.getElementById('slip-no').textContent = String(400 + ((c.start.getDate() * 7 + first.length * 13 + n) % 90)).padStart(4, '0');
    form.hidden = true;
    slip.hidden = false;
    slip.focus();
  });

  [[fName, 'e-name'], [fEmail, 'e-email']].forEach(function (pair) {
    pair[0].addEventListener('input', function () {
      if (pair[0].getAttribute('aria-invalid') === 'true') setError(pair[0], pair[1], false);
    });
  });

  document.getElementById('slip-change').addEventListener('click', function () {
    slip.hidden = true;
    form.hidden = false;
    fClass.focus();
  });
})();
