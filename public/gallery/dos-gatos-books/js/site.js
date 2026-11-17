/* Dos Gatos Books: the shelf, the staff card, the hold slip, and the shop clock. */
(function () {
  'use strict';

  var BOOKS = window.DG_BOOKS || [];
  var SECTIONS = window.DG_SECTIONS || [];
  var byId = {};
  BOOKS.forEach(function (b) { byId[b.id] = b; });
  var sectionName = {};
  SECTIONS.forEach(function (s) { sectionName[s.id] = s.name; });

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  };
  var money = function (n) { return '$' + n; };
  var plural = function (n, one, many) { return n === 1 ? one : many; };
  var NUM = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     The shop clock. Mesa keeps Arizona time all year (no daylight saving).
     ------------------------------------------------------------------ */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var HOURS = { 0: [11, 16], 1: null, 2: [10, 18], 3: [10, 18], 4: [10, 18], 5: [10, 21], 6: [9, 18] };

  function mesaNow() {
    var d = new Date();
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Phoenix', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
      }).formatToParts(d);
      var p = {};
      parts.forEach(function (x) { p[x.type] = parseInt(x.value, 10); });
      // A plain UTC date that carries Mesa's calendar day, safe for day arithmetic.
      var cal = new Date(Date.UTC(p.year, p.month - 1, p.day));
      return { cal: cal, dow: cal.getUTCDay(), mins: (p.hour % 24) * 60 + p.minute };
    } catch (e) {
      var c = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      return { cal: c, dow: c.getUTCDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function addDays(cal, n) { return new Date(cal.getTime() + n * 86400000); }
  function clock(h) { return (h > 12 ? h - 12 : h) + (h >= 12 ? ' pm' : ' am'); }
  function longDate(cal) { return DAYS[cal.getUTCDay()] + ', ' + MONTHS[cal.getUTCMonth()] + ' ' + cal.getUTCDate(); }
  function isoWeek(cal) {
    var t = new Date(cal.getTime());
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 86400000 + 1) / 7);
  }

  function runClock() {
    var now = mesaNow();
    var today = HOURS[now.dow];
    var big = $('open-now');
    var detail = $('open-detail');
    var state, line;
    if (today && now.mins >= today[0] * 60 && now.mins < today[1] * 60) {
      state = 'open';
      line = 'Open until ' + clock(today[1]);
    } else if (today && now.mins < today[0] * 60) {
      state = 'shut';
      line = 'Opens at ' + clock(today[0]) + ' today';
    } else {
      state = 'shut';
      var n = 1;
      while (!HOURS[(now.dow + n) % 7]) { n++; }
      var nd = (now.dow + n) % 7;
      line = 'Closed now. Opens ' + (n === 1 ? 'tomorrow' : DAYS[nd]) + ' at ' + clock(HOURS[nd][0]);
    }
    big.innerHTML = '<span class="dot' + (state === 'open' ? '' : ' shut') + '" aria-hidden="true"></span>' + esc(line);
    detail.innerHTML = esc(DAYS[now.dow]) + ': ' + (today ? clock(today[0]) + ' to ' + clock(today[1]) : 'closed all day') +
      '. Arizona time.<br><a class="tap" href="#hours">All hours</a>';

    // The week runs Monday to Sunday.
    var monday = addDays(now.cal, -((now.dow + 6) % 7));
    var weekLabel = 'Week of ' + MONTHS[monday.getUTCMonth()] + ' ' + monday.getUTCDate();
    $('week-of').textContent = weekLabel;
    $('issue').textContent = 'Vol. ' + (monday.getUTCFullYear() - 2012) + ', No. ' + isoWeek(monday) + ' · ' + weekLabel;
    var order = (now.dow + 6) % 7;
    Array.prototype.forEach.call(document.querySelectorAll('#days li'), function (li) {
      var d = parseInt(li.getAttribute('data-day'), 10);
      var pos = (d + 6) % 7;
      li.querySelector('.day-num').textContent = addDays(monday, pos).getUTCDate();
      li.classList.toggle('is-today', pos === order);
      li.classList.toggle('is-past', pos < order);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#hours-rows tr'), function (tr) {
      tr.classList.toggle('is-today', parseInt(tr.getAttribute('data-day'), 10) === now.dow);
    });
    var fri = document.querySelectorAll('.facts .fact')[2];
    if (fri) {
      var k = fri.querySelector('.kicker');
      if (now.dow === 5) { k.textContent = 'Tonight'; }
      else if (now.dow === 6 || now.dow === 0) {
        k.textContent = 'Every Friday';
        fri.querySelector('p:last-child').textContent = 'Somebody reads, then an open mic, five minutes each. Free, thirty chairs.';
      }
    }
  }

  /* ------------------------------------------------------------------
     The shelf
     ------------------------------------------------------------------ */
  var booksEl = $('books');
  var caseEl = $('case');
  var scrollEl = $('shelf-scroll');
  var cardEl = $('card');
  var tinta = $('tinta');
  var punto = $('punto');
  var state = { section: 'all', pulled: null, held: [], name: '' };
  var spines = {};
  var cardEmptyHTML = cardEl.innerHTML;

  try {
    var saved = JSON.parse(sessionStorage.getItem('dg-slip') || 'null');
    if (saved && Array.isArray(saved.held)) {
      state.held = saved.held.filter(function (id) { return byId[id]; });
      state.name = typeof saved.name === 'string' ? saved.name : '';
    }
  } catch (e) { /* private mode or file:// without storage: the slip just does not persist */ }
  function save() {
    try { sessionStorage.setItem('dg-slip', JSON.stringify({ held: state.held, name: state.name })); } catch (e) { /* ignore */ }
  }

  function buildShelf() {
    var k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--k')) || 1;
    BOOKS.forEach(function (b, i) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'spine tone-' + b.tone + ' cut-' + b.cut + (i % 5 === 1 ? ' f-it' : (i % 5 === 3 && (b.spine || b.title).length < 23) ? ' f-caps' : '');
      el.style.setProperty('--w', b.w);
      el.style.setProperty('--h', b.h);
      el.style.setProperty('--fs', Math.max(10, Math.min(14.5, b.w * k * 0.43)).toFixed(1) + 'px');
      el.setAttribute('data-id', b.id);
      el.setAttribute('aria-pressed', 'false');
      el.setAttribute('aria-label', b.title + ', by ' + b.author + '. ' + sectionName[b.section] + ', ' + money(b.price) + '.');
      el.tabIndex = i === 0 ? 0 : -1;
      el.innerHTML = '<span class="flag" aria-hidden="true"></span><span class="t">' + esc(b.spine || b.title) +
        '</span><span class="a">' + esc(b.surname) + '</span>';
      booksEl.appendChild(el);
      spines[b.id] = el;
    });
  }

  // Shrink a title until it fits its spine; drop the surname if it still will not.
  function fitSpines() {
    BOOKS.forEach(function (b) {
      var el = spines[b.id];
      var t = el.querySelector('.t');
      var a = el.querySelector('.a');
      var cs = getComputedStyle(el);
      var room = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (b.cut === 'plain' ? 16 : 0);
      var fs = parseFloat(getComputedStyle(t).fontSize);
      var guard = 0;
      // The title comes first: shrink it until it fits on its own.
      while (t.offsetHeight + 6 > room && fs > 9 && guard++ < 20) {
        fs -= 0.5;
        t.style.fontSize = fs + 'px';
      }
      // The surname goes on only if there is still room under the title.
      a.hidden = false;
      while (t.offsetHeight + a.offsetHeight + 12 > room && fs > 10.5 && guard++ < 30) {
        fs -= 0.5;
        t.style.fontSize = fs + 'px';
      }
      if (t.offsetHeight + a.offsetHeight + 12 > room) { a.hidden = true; }
    });
  }

  function visibleSpines() {
    return BOOKS.filter(function (b) { return !spines[b.id].classList.contains('away'); }).map(function (b) { return spines[b.id]; });
  }

  function buildFilters() {
    var wrap = $('filters');
    SECTIONS.forEach(function (s) {
      var n = BOOKS.filter(function (b) { return b.section === s.id; }).length;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter caps';
      btn.setAttribute('data-section', s.id);
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = esc(s.name) + '<span class="n" aria-hidden="true">' + n + '</span><span class="visually-hidden">, ' + n + ' books</span>';
      wrap.appendChild(btn);
    });
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (btn) { setSection(btn.getAttribute('data-section')); }
    });
  }

  function setSection(id) {
    state.section = id;
    Array.prototype.forEach.call(document.querySelectorAll('.filter'), function (f) {
      f.setAttribute('aria-pressed', String(f.getAttribute('data-section') === id));
    });
    BOOKS.forEach(function (b) {
      // Books from other sections are pushed to the back of the shelf: still there, out of reach.
      var away = !(id === 'all' || b.section === id);
      spines[b.id].classList.toggle('away', away);
      spines[b.id].disabled = away;
      if (away) { spines[b.id].setAttribute('aria-hidden', 'true'); } else { spines[b.id].removeAttribute('aria-hidden'); }
    });
    if (state.pulled && spines[state.pulled].classList.contains('away')) { pull(null); }
    var vis = visibleSpines();
    BOOKS.forEach(function (b) { spines[b.id].tabIndex = -1; });
    var keep = state.pulled ? spines[state.pulled] : vis[0];
    if (keep) { keep.tabIndex = 0; }
    $('shelf-count').textContent = id === 'all'
      ? '40 of 40 books showing.'
      : vis.length + ' of 40 books showing: ' + sectionName[id] + '.';
    scrollEl.scrollLeft = 0;
    placeTinta(false);
    if (typeof edges === 'function') { edges(); }
    if (!state.pulled && !(lastSeat && spines[lastSeat].offsetWidth)) {
      $('cat-cap').textContent = 'Tinta is waiting to see what you pull. Punto has not moved since Tuesday.';
    }
  }

  /* ---- Tinta follows the last book pulled ---- */
  var TINTA_W = 62;
  var lastSeat = null;
  var seatTimer = null;

  function placeTinta(walk) {
    var target = state.pulled ? spines[state.pulled] : (lastSeat && spines[lastSeat].offsetWidth ? spines[lastSeat] : null);
    var caseW = caseEl.offsetWidth;
    var puntoEnd = punto.offsetLeft + punto.offsetWidth;
    var x;
    var blocked = false;
    if (target) {
      x = target.offsetLeft + 12 + target.offsetWidth / 2 - TINTA_W / 2;
    } else {
      x = puntoEnd + 70;
    }
    if (x < puntoEnd + 2) { x = puntoEnd + 2; blocked = true; }
    x = Math.max(0, Math.min(x, caseW - TINTA_W - 4));
    var prev = parseFloat(tinta.style.getPropertyValue('--x')) || 0;
    var dist = Math.abs(x - prev);
    clearTimeout(seatTimer);
    tinta.classList.remove('arrived');
    if (walk && !reduced && dist > 4) {
      var secs = Math.max(0.45, Math.min(1.3, dist / 520));
      tinta.style.transitionDuration = secs + 's';
      tinta.classList.add('walking');
      seatTimer = setTimeout(function () {
        tinta.classList.remove('walking');
        tinta.classList.add('arrived');
      }, secs * 1000);
    } else {
      tinta.style.transitionDuration = '0s';
      tinta.classList.remove('walking');
    }
    tinta.style.setProperty('--x', x.toFixed(1) + 'px');
    return blocked;
  }

  function pull(id) {
    if (state.pulled && spines[state.pulled]) { spines[state.pulled].setAttribute('aria-pressed', 'false'); }
    state.pulled = id;
    if (!id) {
      cardEl.innerHTML = cardEmptyHTML;
      return;
    }
    var el = spines[id];
    el.setAttribute('aria-pressed', 'true');
    BOOKS.forEach(function (b) { spines[b.id].tabIndex = -1; });
    el.tabIndex = 0;
    lastSeat = id;
    var blocked = placeTinta(true);
    var b = byId[id];
    $('cat-cap').innerHTML = blocked
      ? 'Tinta wanted to sit above <cite>' + esc(b.spine || b.title) + '</cite>, but Punto got there first.'
      : 'Tinta is now sitting above <cite>' + esc(b.spine || b.title) + '</cite>. Punto has not moved since Tuesday.';
    renderCard();
  }

  function renderCard() {
    var b = byId[state.pulled];
    if (!b) { return; }
    var held = state.held.indexOf(b.id) > -1;
    cardEl.innerHTML =
      '<div class="card-in">' +
        '<div class="cover tone-' + b.tone + '" aria-hidden="true">' +
          '<p class="cover-t">' + esc(b.spine || b.title) + '</p><span class="cover-o"></span>' +
          '<p class="cover-a caps">' + esc(b.author) + '</p></div>' +
        '<div>' +
          '<p class="caps kicker">' + esc(sectionName[b.section]) + ' · ' + b.year + '</p>' +
          '<h3 class="card-title">' + esc(b.title) + '</h3>' +
          '<p class="card-author">by ' + esc(b.author) + '</p>' +
          '<blockquote class="card-note"><p>' + esc(b.note) + '</p><footer class="caps">' + esc(b.by) + ', at the counter</footer></blockquote>' +
          '<dl class="card-facts">' +
            '<dt class="caps">Price</dt><dd class="price">' + money(b.price) + '</dd>' +
            '<dt class="caps">Condition</dt><dd>' + esc(b.condition) + '</dd>' +
          '</dl>' +
          '<div class="card-acts">' +
            (held
              ? '<button type="button" class="btn btn-quiet" data-act="unhold">Take it off my slip</button><span class="onslip">On your hold slip.</span>'
              : '<button type="button" class="btn" data-act="hold">Hold this for me</button>') +
            '<button type="button" class="btn btn-quiet" data-act="back">Put it back</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  booksEl.addEventListener('click', function (e) {
    var el = e.target.closest('.spine');
    if (!el) { return; }
    var id = el.getAttribute('data-id');
    pull(state.pulled === id ? null : id);
  });

  booksEl.addEventListener('keydown', function (e) {
    var keys = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
    if (!(e.key in keys)) { return; }
    var vis = visibleSpines();
    var i = vis.indexOf(document.activeElement);
    if (i < 0) { return; }
    e.preventDefault();
    var step = keys[e.key];
    var j = step === 'first' ? 0 : step === 'last' ? vis.length - 1 : Math.max(0, Math.min(vis.length - 1, i + step));
    vis.forEach(function (s) { s.tabIndex = -1; });
    vis[j].tabIndex = 0;
    vis[j].focus({ preventScroll: true });
    // keep the focused spine inside the shelf's own scroller
    var r = vis[j].getBoundingClientRect();
    var sr = scrollEl.getBoundingClientRect();
    if (r.left < sr.left + 24) { scrollEl.scrollLeft -= (sr.left + 24 - r.left); }
    if (r.right > sr.right - 24) { scrollEl.scrollLeft += (r.right - sr.right + 24); }
  });

  cardEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn || !state.pulled) { return; }
    var act = btn.getAttribute('data-act');
    var id = state.pulled;
    if (act === 'back') {
      pull(null);
      spines[id].focus({ preventScroll: true });
      return;
    }
    if (act === 'hold' && state.held.indexOf(id) < 0) {
      if (slipDone) { resetSlip(); }
      state.held.push(id);
    }
    if (act === 'unhold') { state.held = state.held.filter(function (x) { return x !== id; }); }
    save();
    renderSlip();
    renderCard();
    var again = cardEl.querySelector(act === 'hold' ? '[data-act="unhold"]' : '[data-act="hold"]');
    if (again) { again.focus({ preventScroll: true }); }
  });

  /* ------------------------------------------------------------------
     The hold slip
     ------------------------------------------------------------------ */
  var slipList = $('slip-list');
  var slipForm = $('slip-form');
  var slipName = $('slip-name');
  var slipErr = $('slip-err');
  var slipDoneEl = $('slip-done');
  var slipDone = false;

  function total() { return state.held.reduce(function (s, id) { return s + byId[id].price; }, 0); }

  function renderSlip() {
    BOOKS.forEach(function (b) { spines[b.id].classList.toggle('held', state.held.indexOf(b.id) > -1); });
    slipList.innerHTML = state.held.map(function (id) {
      var b = byId[id];
      return '<li><span class="st">' + esc(b.spine || b.title) + '<small>' + esc(b.author) + '</small></span>' +
        '<span class="sp">' + money(b.price) + '</span>' +
        '<button type="button" class="rm" data-rm="' + b.id + '" aria-label="Take ' + esc(b.title) + ' off the slip">Remove</button></li>';
    }).join('');
    var n = state.held.length;
    $('slip-empty').hidden = n > 0;
    $('slip-total').hidden = n === 0;
    $('slip-sum').textContent = money(total());
    if (n > 0) { slipErr.textContent = ''; }
  }

  slipList.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-rm]');
    if (!btn) { return; }
    var id = btn.getAttribute('data-rm');
    state.held = state.held.filter(function (x) { return x !== id; });
    save();
    renderSlip();
    if (state.pulled === id) { renderCard(); }
    var next = slipList.querySelector('.rm');
    (next || slipName).focus({ preventScroll: true });
  });

  slipName.addEventListener('input', function () {
    state.name = slipName.value;
    save();
    if (slipName.value.trim()) { slipErr.textContent = ''; slipName.removeAttribute('aria-invalid'); }
  });

  slipForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = slipName.value.trim();
    if (!state.held.length) {
      slipErr.textContent = 'The slip is empty. Pull a book from the shelf first.';
      return;
    }
    if (!name) {
      slipErr.textContent = 'Tell us what name to write on the slip.';
      slipName.setAttribute('aria-invalid', 'true');
      slipName.focus();
      return;
    }
    var now = mesaNow();
    var until = addDays(now.cal, 3);
    if (!HOURS[until.getUTCDay()]) { until = addDays(until, 1); }
    var n = state.held.length;
    var no = isoWeek(now.cal) + '-' + ('000' + ((now.mins * 7 + n * 131 + name.length * 17) % 10000)).slice(-4);
    slipDoneEl.innerHTML =
      '<p class="stamp" aria-hidden="true">Held</p>' +
      '<h4>Thank you, ' + esc(name) + '. ' + NUM[Math.min(n, 10)] + ' ' + plural(n, 'book is', 'books are') + ' behind the counter.</h4>' +
      '<p>Under the name ' + esc(name) + ' until we close on ' + longDate(until) + '. Pay ' + money(total()) + ' when you pick up.</p>' +
      '<ul>' + state.held.map(function (id) {
        return '<li><span>' + esc(byId[id].spine || byId[id].title) + '</span><span>' + money(byId[id].price) + '</span></li>';
      }).join('') + '</ul>' +
      '<p class="caps">Slip no. ' + no + '</p>' +
      '<p class="honest">This is a concept site for an imaginary shop, so nothing was sent and nobody is holding anything.</p>' +
      '<button type="button" class="btn btn-quiet btn-wide" id="slip-new">Start a new slip</button>';
    $('slip-body').hidden = true;
    slipDoneEl.hidden = false;
    slipDone = true;
    slipDoneEl.focus({ preventScroll: true });
    var r = $('slip').getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.6) {
      $('slip').scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    }
  });

  function resetSlip() {
    state.held = [];
    slipDone = false;
    slipDoneEl.hidden = true;
    slipDoneEl.innerHTML = '';
    $('slip-body').hidden = false;
    save();
    renderSlip();
    if (state.pulled) { renderCard(); }
  }
  slipDoneEl.addEventListener('click', function (e) {
    if (e.target.id === 'slip-new') {
      resetSlip();
      $('slip-h').setAttribute('tabindex', '-1');
      $('slip-h').focus({ preventScroll: true });
    }
  });

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  runClock();
  buildFilters();
  buildShelf();

  // The shelf cat is drawn inline (not through <use>) so her tail can be animated.
  var sym = document.getElementById('cat-tinta');
  if (sym) { tinta.querySelector('svg').innerHTML = sym.innerHTML; }

  slipName.value = state.name;
  renderSlip();
  fitSpines();
  placeTinta(false);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { fitSpines(); placeTinta(false); });
  }
  // Edge fades: show which way the shelf still scrolls.
  var wrapEl = $('shelf-wrap');
  function edges() {
    var max = scrollEl.scrollWidth - scrollEl.clientWidth;
    wrapEl.classList.toggle('more-right', max > 4 && scrollEl.scrollLeft < max - 4);
    wrapEl.classList.toggle('more-left', scrollEl.scrollLeft > 4);
  }
  scrollEl.addEventListener('scroll', edges, { passive: true });
  edges();
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { placeTinta(false); edges(); }, 120);
  });
})();
