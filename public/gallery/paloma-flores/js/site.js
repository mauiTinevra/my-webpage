/* Paloma Flores: the bouquet builder, the order form and the small page drawings. */
(function () {
  'use strict';
  var P = window.Paloma;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAX = 20, MIN = 3, DELIVERY = 9;
  var ZIPS = ['85003', '85004', '85006', '85007', '85012', '85013', '85014', '85015', '85016'];

  /* ---------- state ---------- */
  var state = { stems: [], next: 1, wrap: 'kraft' };
  try {
    var saved = JSON.parse(sessionStorage.getItem('paloma-bouquet') || 'null');
    if (saved && Array.isArray(saved.stems)) {
      saved.stems.slice(0, MAX).forEach(function (t) { if (P.TYPES[t]) state.stems.push({ id: state.next++, type: t }); });
      if (P.WRAPS[saved.wrap]) state.wrap = saved.wrap;
    }
  } catch (e) { /* storage can be unavailable; the builder works without it */ }
  function save() {
    try {
      sessionStorage.setItem('paloma-bouquet', JSON.stringify({ stems: state.stems.map(function (s) { return s.type; }), wrap: state.wrap }));
    } catch (e) { /* ignore */ }
  }

  function count(type) { return state.stems.filter(function (s) { return s.type === type; }).length; }
  function subtotal() { return state.stems.reduce(function (sum, s) { return sum + P.TYPES[s.type].price; }, 0); }
  function sizeOf(n) {
    if (n >= 13) return { key: 'armful', name: 'An armful', note: 'Needs both hands and the big vase.' };
    if (n >= 7) return { key: 'bouquet', name: 'A bouquet', note: 'Fills a kitchen vase.' };
    if (n >= MIN) return { key: 'posy', name: 'A posy', note: 'Fits a jam jar or a desk.' };
    if (n > 0) return { key: '', name: n === 1 ? 'One stem' : 'Two stems', note: n === 1 ? 'Two more make a posy.' : 'One more makes a posy.' };
    return { key: '', name: 'An empty vase', note: 'Add three stems to begin.' };
  }
  function mode() { return document.querySelector('input[name="mode"]:checked').value; }

  /* ---------- the vase ---------- */
  var layerStems = $('layer-stems'), nodes = {}, seats = {};
  $('layer-back').innerHTML = P.backdrop(4);

  function drawVase(fresh) {
    var placed = P.arrange(state.stems), keep = {};
    $('layer-wrap').innerHTML = state.stems.length ? P.wrapBack(state.wrap, state.stems.length) : '';
    $('layer-vase').innerHTML = P.vase(state.wrap, state.stems.length > 0);

    placed.forEach(function (p) {
      var g = nodes[p.id];
      if (!g) {
        g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'stem');
        g.setAttribute('data-type', p.type);
        g.innerHTML = '<g class="seat"><g class="drop">' + P.stem(p.type, p.id) + '</g></g>';
        nodes[p.id] = g;
      }
      keep[p.id] = true;
      layerStems.appendChild(g);            // re-appending keeps paint order: back row first
      var seat = g.firstChild, to = P.seat(p), from = seats[p.id];
      seat.style.transform = to;
      if (!reduce && from && from !== to) {
        // every stem that was already in the vase leans over to its new place
        seat.animate([{ transform: from }, { transform: to }], { duration: 620, easing: 'cubic-bezier(.3,1.45,.5,1)' });
      }
      if (!reduce && fresh === p.id) {
        // the new stem drops in from above, overshoots and settles
        g.firstChild.firstChild.animate([
          { transform: 'translateY(-70px) rotate(' + (p.angle > 0 ? 9 : -9) + 'deg)', opacity: 0 },
          { transform: 'translateY(9px) rotate(' + (p.angle > 0 ? -3 : 3) + 'deg)', opacity: 1, offset: 0.55 },
          { transform: 'translateY(-3px) rotate(1deg)', offset: 0.78 },
          { transform: 'translateY(0) rotate(0deg)' }
        ], { duration: 640, easing: 'ease-out' });
      }
      seats[p.id] = to;
    });
    Object.keys(nodes).forEach(function (id) {
      if (keep[id]) return;
      var gone = nodes[id];
      delete nodes[id]; delete seats[id];
      if (reduce) { gone.remove(); return; }
      // a removed stem is lifted straight out along its own lean
      gone.firstChild.firstChild.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-64px)', opacity: 0 }],
        { duration: 240, easing: 'ease-in', fill: 'forwards' }).onfinish = function () { gone.remove(); };
    });
  }

  /* ---------- picker ---------- */
  var list = $('stems');
  list.innerHTML = P.ORDER.map(function (t, i) {
    var T = P.TYPES[t];
    return '<li class="stem-card" data-type="' + t + '">' +
      '<div class="stem-pic">' + P.single(t, 40 + i) + '</div>' +
      '<div class="stem-words"><h4>' + T.name + '</h4><p class="stem-price">$' + T.price + ' a stem</p><p class="stem-note">' + T.note + '</p></div>' +
      '<div class="stepper">' +
      '<button type="button" class="minus" data-act="remove" aria-label="Remove one ' + T.name.toLowerCase() + '"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8.6 16 8.9 15.8 11.3 4.2 11.2Z"/></svg></button>' +
      '<output class="qty" aria-label="' + T.name + ' in the vase">0</output>' +
      '<button type="button" class="plus" data-act="add" aria-label="Add one ' + T.name.toLowerCase() + '"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8.7 4 11.2 4.2 11.1 8.8 16 8.9 15.8 11.3 11.2 11.2 11.3 16 8.8 15.8 8.9 11.2 4 11.1 4.2 8.7 8.8 8.8Z"/></svg></button>' +
      '</div></li>';
  }).join('');

  list.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b) return;
    var type = b.closest('.stem-card').dataset.type, T = P.TYPES[type];
    if (b.dataset.act === 'add') {
      if (state.stems.length >= MAX) return;
      var s = { id: state.next++, type: type };
      state.stems.push(s);
      update(s.id, T.name + ' added.');
    } else {
      for (var i = state.stems.length - 1; i >= 0; i--) {
        if (state.stems[i].type === type) { state.stems.splice(i, 1); break; }
      }
      update(null, T.name + ' removed.');
      // if the minus button just disabled itself, keep keyboard focus on this card
      if (b.disabled) b.parentNode.querySelector('.plus').focus();
    }
  });

  /* pointing at a card, or tabbing into it, lifts that flower in the vase so you can find it */
  function lift(type) {
    Array.prototype.forEach.call(layerStems.children, function (g) { g.classList.toggle('lift', g.getAttribute('data-type') === type); });
  }
  ['pointerover', 'focusin'].forEach(function (ev) {
    list.addEventListener(ev, function (e) { var c = e.target.closest('.stem-card'); if (c) lift(c.dataset.type); });
  });
  ['pointerleave', 'focusout'].forEach(function (ev) { list.addEventListener(ev, function () { lift(null); }); });

  $('clear').addEventListener('click', function () {
    state.stems = [];
    update(null, 'The vase is empty.');
    list.querySelector('.plus').focus();
  });

  Array.prototype.forEach.call(document.querySelectorAll('input[name="wrap"]'), function (r) {
    r.checked = r.value === state.wrap;
    r.addEventListener('change', function () { state.wrap = r.value; update(null, P.WRAPS[r.value].name + ' wrap.'); });
  });

  /* ---------- summary, slip ---------- */
  function money(n) { return '$' + n; }
  function describe() {
    return P.ORDER.filter(count).map(function (t) {
      var c = count(t), T = P.TYPES[t];
      return c + ' ' + (c === 1 ? T.name.toLowerCase() : T.plural);
    });
  }
  function joinList(a) {
    if (a.length < 2) return a.join('');
    return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  }

  function update(fresh, said) {
    var n = state.stems.length, size = sizeOf(n), sub = subtotal(), full = n >= MAX;
    drawVase(fresh);

    Array.prototype.forEach.call(list.children, function (li) {
      var c = count(li.dataset.type);
      li.querySelector('.qty').textContent = c;
      li.querySelector('.minus').disabled = c === 0;
      li.querySelector('.plus').disabled = full;
      li.classList.toggle('has', c > 0);
    });
    $('limit').hidden = !full;
    $('clear').hidden = n === 0;

    $('size-name').textContent = size.name + (n >= MIN ? ' of ' + n + ' stems' : '');
    $('size-note').textContent = size.note;
    $('price').textContent = money(sub);
    $('ruler-fill').style.width = Math.min(100, (n / MAX) * 100) + '%';
    Array.prototype.forEach.call(document.querySelectorAll('.ruler li'), function (li) {
      li.classList.toggle('on', li.dataset.size === size.key);
    });
    $('vase-title').textContent = n ? size.name + ' in a vase: ' + joinList(describe()) + ', wrapped in ' + P.WRAPS[state.wrap].name.toLowerCase() + ' paper' : 'An empty vase';

    var m = mode(), lines = P.ORDER.filter(count).map(function (t) {
      var c = count(t), T = P.TYPES[t];
      return '<li><span>' + c + ' ' + (c === 1 ? T.name.toLowerCase() : T.plural) + '</span><span>' + money(c * T.price) + '</span></li>';
    });
    if (!n) lines.push('<li class="empty"><span>No stems yet. Add some above.</span></li>');
    lines.push('<li><span>' + P.WRAPS[state.wrap].name + ' wrap and twine</span><span>Included</span></li>');
    lines.push('<li><span>' + (m === 'delivery' ? 'Delivery' : 'Pickup at the shop') + '</span><span>' + (m === 'delivery' ? money(DELIVERY) : 'Free') + '</span></li>');
    $('slip-lines').innerHTML = lines.join('');
    $('slip-total').textContent = money(sub + (m === 'delivery' ? DELIVERY : 0));
    $('place').textContent = 'Place order for ' + m;
    if (n >= MIN) { $('stems-err').hidden = true; }

    if (said) $('announce').textContent = said + ' ' + (n ? size.name + ', ' + n + (n === 1 ? ' stem, ' : ' stems, ') + money(sub) + '.' : '');
    save();
  }

  /* ---------- the clock, in Phoenix (UTC-7 all year) ---------- */
  var HOURS = { 0: [10, 14], 1: null, 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [8, 16] };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function phoenixNow() {
    var test = /[?&]now=([^&]+)/.exec(location.search);      // ?now=2026-11-17T15:10 for testing
    var d = test ? new Date(decodeURIComponent(test[1]) + 'Z') : new Date(Date.now() - 7 * 3600000);
    return isNaN(d) ? new Date(Date.now() - 7 * 3600000) : d;  // read with getUTC*: it holds Phoenix wall time
  }
  function clock(min, bare) {
    var h = Math.floor(min / 60), m = min % 60, h12 = h % 12 || 12;
    return h12 + (m ? ':' + (m < 10 ? '0' : '') + m : '') + (bare ? '' : h < 12 ? ' am' : ' pm');
  }

  function slotsFor(offset, m, now) {
    var day = new Date(now.getTime() + offset * 86400000), h = HOURS[day.getUTCDay()], out = [];
    if (!h) return out;
    var nowMin = now.getUTCHours() * 60 + now.getUTCMinutes(), t;
    if (m === 'pickup') {
      var start = h[0] * 60 + 60;                                // the first bunches are ready an hour after opening
      if (offset === 0) start = Math.max(start, Math.ceil((nowMin + 60) / 30) * 30);
      for (t = start; t <= h[1] * 60 - 30; t += 30) out.push({ value: String(t), label: clock(t), say: 'at ' + clock(t) });
    } else {
      for (t = 10 * 60; t + 120 <= h[1] * 60; t += 120) {
        if (offset === 0 && nowMin > t - 30) continue;           // order half an hour before the van leaves
        var pm = t >= 720;
        out.push({ value: String(t), label: clock(t, pm) + ' to ' + clock(t + 120), say: 'between ' + clock(t, pm) + ' and ' + clock(t + 120) });
      }
    }
    return out;
  }
  function dayChoices(m) {
    var now = phoenixNow(), out = [];
    for (var i = 0; i < 9 && out.length < 4; i++) {
      var slots = slotsFor(i, m, now);
      if (!slots.length) continue;
      var d = new Date(now.getTime() + i * 86400000);
      var long = DAYS[d.getUTCDay()] + ', ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate();
      out.push({ offset: i, slots: slots, label: i === 0 ? 'Today, ' + DAYS[d.getUTCDay()] : i === 1 ? 'Tomorrow, ' + DAYS[d.getUTCDay()] : long,
        say: i === 0 ? 'today' : i === 1 ? 'tomorrow' : 'on ' + long });
    }
    return out;
  }

  var choices = [];
  function fillDays(keepDay, keepTime) {
    var m = mode();
    choices = dayChoices(m);
    $('day').innerHTML = choices.map(function (c) { return '<option value="' + c.offset + '">' + c.label + '</option>'; }).join('');
    if (keepDay != null && choices.some(function (c) { return String(c.offset) === String(keepDay); })) $('day').value = keepDay;
    fillTimes(keepTime);
    $('time-label').textContent = m === 'delivery' ? 'Delivery window' : 'Pickup time';
    $('delivery-fields').hidden = m !== 'delivery';
    var hint = '';
    if (choices.length && choices[0].offset !== 0) {
      var next = choices[0].label;
      if (choices[0].offset === 1) next = 't' + next.slice(1);
      hint = (m === 'delivery' ? 'Delivery' : 'Pickup') + ' has closed for today. The next opening is ' + next + '.';
    } else if (m === 'delivery') {
      hint = 'Order half an hour before a window opens and it goes out on that run.';
    } else {
      hint = 'We need about an hour to tie it. Your bunch waits in the cooler by the door.';
    }
    $('slot-hint').textContent = hint;
  }
  function fillTimes(keepTime) {
    var c = choices.filter(function (c) { return String(c.offset) === $('day').value; })[0];
    $('time').innerHTML = (c ? c.slots : []).map(function (s) { return '<option value="' + s.value + '">' + s.label + '</option>'; }).join('');
    if (keepTime && c && c.slots.some(function (s) { return s.value === keepTime; })) $('time').value = keepTime;
  }
  $('day').addEventListener('change', function () { fillTimes($('time').value); });
  Array.prototype.forEach.call(document.querySelectorAll('input[name="mode"]'), function (r) {
    r.addEventListener('change', function () { fillDays($('day').value); update(); });
  });

  /* ---------- open now? ---------- */
  (function () {
    var now = phoenixNow(), dow = now.getUTCDay(), h = HOURS[dow], min = now.getUTCHours() * 60 + now.getUTCMinutes(), text;
    if (h && min < h[0] * 60) text = 'Opens at ' + clock(h[0] * 60) + ', closes at ' + clock(h[1] * 60);
    else if (h && min < h[1] * 60) text = 'Open now until ' + clock(h[1] * 60);
    else {
      for (var i = 1; i < 8; i++) {
        var nd = (dow + i) % 7;
        if (HOURS[nd]) { text = 'Closed now. Opens ' + (i === 1 ? 'tomorrow' : DAYS[nd]) + ' at ' + clock(HOURS[nd][0] * 60); break; }
      }
    }
    $('open-status').textContent = text;
    var row = document.querySelector('.hours tr[data-dow="' + dow + '"]');
    if (row) { row.classList.add('today'); row.querySelector('th').insertAdjacentHTML('beforeend', ' <span class="today-tag">today</span>'); }
  })();

  /* ---------- the order ---------- */
  var note = $('note');
  note.addEventListener('input', function () {
    var left = 140 - note.value.length;
    $('note-count').textContent = left + (left === 1 ? ' character left' : ' characters left');
  });

  function fail(id, msg) {
    var el = $(id), err = $(id + '-err');
    err.textContent = msg; err.hidden = !msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    return msg ? el : null;
  }
  ['name', 'phone', 'street', 'zip'].forEach(function (id) {
    $(id).addEventListener('input', function () { if ($(id).getAttribute('aria-invalid')) fail(id, ''); });
  });

  var form = $('order-form'), confirmBox = $('confirm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = mode(), bad = [], n = state.stems.length;
    var name = $('name').value.trim(), phone = $('phone').value.replace(/\D/g, '');
    if (n < MIN) {
      $('stems-err').textContent = n ? 'A posy needs three stems. Add ' + (MIN - n === 1 ? 'one more.' : 'two more.') : 'The vase is empty. Add at least three stems above.';
      $('stems-err').hidden = false;
      bad.push(list.querySelector('.plus'));
    }
    if (m === 'delivery') {
      bad.push(fail('street', $('street').value.trim().length < 5 ? 'Enter the street address for the delivery.' : ''));
      var zip = $('zip').value.trim();
      bad.push(fail('zip', !/^\d{5}$/.test(zip) ? 'Enter a five digit ZIP code.' : ZIPS.indexOf(zip) < 0 ? 'We do not deliver to ' + zip + ' yet. Choose pickup, or call us.' : ''));
    }
    bad.push(fail('name', name.length < 2 ? 'Enter the name for the order.' : ''));
    bad.push(fail('phone', phone.length < 10 ? 'Enter a ten digit phone number.' : ''));
    if (!$('time').value) bad.push($('time'));
    bad = bad.filter(Boolean);
    if (bad.length) {
      // the stems error lives in the slip; keep it in view but send focus to the first thing to fix
      bad[0].focus();
      if (n < MIN) $('announce').textContent = $('stems-err').textContent;
      return;
    }

    var day = choices.filter(function (c) { return String(c.offset) === $('day').value; })[0];
    var slot = day.slots.filter(function (s) { return s.value === $('time').value; })[0];
    var size = sizeOf(n), total = subtotal() + (m === 'delivery' ? DELIVERY : 0);
    var first = name.split(/\s+/)[0];
    var no = 'PF-' + (1000 + Math.floor((Date.now() / 1000) % 9000));

    $('confirm-no').textContent = 'Order ' + no;
    $('confirm-h').textContent = 'Thank you, ' + first + '. ' + size.name + ' is on the bench.';
    $('confirm-body').textContent = m === 'delivery'
      ? 'We tie it just before the van leaves and ring the bell when it arrives. If nobody is home it waits in the shade by the door.'
      : 'It will be in the cooler by the front door with your name on the tag. Pay at the counter when you collect it.';
    var facts = [
      ['In it', joinList(describe())],
      ['Wrap', P.WRAPS[state.wrap].name + ' paper, tied with twine'],
      [m === 'delivery' ? 'Delivery' : 'Pickup', (day.say.charAt(0).toUpperCase() + day.say.slice(1)) + ' ' + slot.say + (m === 'delivery' ? ', to ' + $('street').value.trim() + ', ' + $('zip').value.trim() : ', at 4212 N 7th Ave')],
      ['Total', money(total) + (m === 'delivery' ? ', delivery included' : '')]
    ];
    if (note.value.trim()) facts.splice(2, 0, ['On the card', '“' + note.value.trim() + '”']);
    var dl = $('confirm-facts');
    dl.textContent = '';
    facts.forEach(function (f) {
      var div = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = f[0]; dd.textContent = f[1]; div.appendChild(dt); div.appendChild(dd); dl.appendChild(div);
    });
    $('confirm-art').innerHTML = P.still(state.stems.map(function (s) { return s.type; }), state.wrap, { plain: true, seed: 700, viewBox: '20 40 400 440', label: 'Your ' + size.key });

    form.hidden = true; confirmBox.hidden = false;
    document.querySelector('.bench').inert = true;
    $('order').classList.add('done');
    $('confirm-h').focus();
    $('order').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  function reopen() {
    form.hidden = false; confirmBox.hidden = true;
    document.querySelector('.bench').inert = false;
    $('order').classList.remove('done');
  }
  $('change').addEventListener('click', function () {
    reopen();
    fillDays($('day').value, $('time').value);
    form.querySelector('h3').setAttribute('tabindex', '-1');
    form.querySelector('h3').focus();
  });
  $('restart').addEventListener('click', function () {
    reopen();
    state.stems = []; note.value = '';
    note.dispatchEvent(new Event('input'));
    update(null, 'A new bouquet. The vase is empty.');
    $('bouquet').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    list.querySelector('.plus').focus({ preventScroll: true });
  });

  /* ---------- today's three ---------- */
  var DAILY = [
    { name: 'Seventh Avenue', about: 'Small, bright and a little wild. The one people grab on the way to dinner.', wrap: 'kraft',
      stems: ['poppy', 'poppy', 'cornflower', 'cornflower', 'marigold', 'eucalyptus'] },
    { name: 'Front porch', about: 'Poppies and ranunculus with one snapdragon standing up at the back.', wrap: 'leaf',
      stems: ['poppy', 'poppy', 'poppy', 'ranunculus', 'ranunculus', 'cornflower', 'cornflower', 'eucalyptus', 'eucalyptus', 'snapdragon'] },
    { name: 'Sunday table', about: 'A big loose bunch for the middle of a long table. Bring a second pair of hands.', wrap: 'poppy',
      stems: ['snapdragon', 'snapdragon', 'snapdragon', 'poppy', 'poppy', 'poppy', 'ranunculus', 'ranunculus', 'ranunculus', 'marigold', 'marigold', 'marigold', 'cornflower', 'cornflower', 'eucalyptus', 'eucalyptus', 'eucalyptus'] }
  ];
  $('daily-list').innerHTML = DAILY.map(function (b, i) {
    var price = b.stems.reduce(function (s, t) { return s + P.TYPES[t].price; }, 0);
    var size = sizeOf(b.stems.length);
    return '<li class="daily-card">' +
      '<div class="daily-art">' + P.still(b.stems, b.wrap, { seed: 200 + i * 40, label: b.name + ', ' + size.name.toLowerCase() + ' of ' + b.stems.length + ' stems' }) + '</div>' +
      '<div class="daily-words"><h3>' + b.name + '</h3>' +
      '<p class="daily-meta">' + size.name + ' of ' + b.stems.length + ' stems, ' + money(price) + '</p>' +
      '<p>' + b.about + '</p>' +
      '<button type="button" class="btn btn-green" data-daily="' + i + '">Put this in the vase<span class="visually-hidden">: ' + b.name + '</span></button></div></li>';
  }).join('');
  $('daily-list').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-daily]');
    if (!b) return;
    var recipe = DAILY[+b.dataset.daily];
    if (!confirmBox.hidden) reopen();
    state.stems = recipe.stems.map(function (t) { return { id: state.next++, type: t }; });
    state.wrap = recipe.wrap;
    document.querySelector('input[name="wrap"][value="' + recipe.wrap + '"]').checked = true;
    update(null, recipe.name + ' is in the vase. Change it however you like.');
    $('bouquet').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    $('bouquet-h').setAttribute('tabindex', '-1');
    $('bouquet-h').focus({ preventScroll: true });
  });

  /* ---------- page drawings ---------- */
  function giant(type, seed, x, y, angle, scale) {
    return '<g class="stem"><g transform="translate(' + x + ' ' + y + ') rotate(' + angle + ') scale(' + scale + ')">' + P.stem(type, seed) + '</g></g>';
  }
  (function hero() {
    var r = P.rng(11);
    var ground = P.blob(r, 330, 330, 288, 13, 0.05);
    var scrap = [[36, 96], [250, 70], [262, 300], [52, 322]];
    $('hero-art').innerHTML = '<svg viewBox="0 0 640 660">' +
      '<g class="cut"><path d="' + P.d(scrap) + '" fill="#e9cf7c"/></g>' +
      '<g class="cut"><path d="' + P.d(ground) + '" fill="#2d5a3d"/></g>' +
      giant('eucalyptus', 3, 330, 800, 31, 2.3) +
      giant('snapdragon', 5, 330, 800, -21, 2.25) +
      giant('cornflower', 8, 330, 800, -8, 2.9) +
      giant('poppy', 2, 330, 800, 15, 2.75) +
      giant('marigold', 6, 330, 800, -34, 2.3) +
      giant('ranunculus', 9, 330, 800, 3, 2.6) +
      giant('poppy', 12, 340, 800, 38, 2.0) +
      '<path d="' + P.d([[0, 634], [150, 622], [330, 636], [500, 620], [640, 632], [640, 1200], [0, 1200]]) + '" fill="#f6e9b8"/>' +
      '</svg>';
  })();

  (function bar() {
    var buckets = [['snapdragon', 92], ['poppy', 250], ['cornflower', 408]], out = '', k = 0.8;
    out += '<g class="cut"><path d="' + P.d([[0, 398], [170, 392], [340, 397], [500, 391], [498, 446], [2, 448]]) + '" fill="#2d5a3d"/></g>';
    buckets.forEach(function (b, bi) {
      var stems = [], x = b[1];
      for (var i = 0; i < 6; i++) stems.push({ id: 300 + bi * 20 + i, type: b[0] });
      if (bi === 1) stems.push({ id: 390, type: 'ranunculus' }, { id: 391, type: 'ranunculus' }, { id: 392, type: 'marigold' });
      if (bi === 2) stems.push({ id: 395, type: 'eucalyptus' }, { id: 396, type: 'eucalyptus' });
      out += '<g transform="translate(' + (x - P.PIVOT.x * k) + ' ' + (322 - P.PIVOT.y * k) + ') scale(' + k + ')">' +
        P.arrange(stems).map(function (p) { return '<g class="stem"><g style="transform:' + P.seat(p) + '">' + P.stem(p.type, p.id) + '</g></g>'; }).join('') + '</g>';
      var t = bi - 1;   // each bucket is cut a little differently, but stands straight
      out += '<g class="cut"><path d="' + P.d([[x - 52, 300], [x + 52, 301 + t], [x + 40 + t, 412 - t * 2], [x - 39, 410 + t]]) + '" fill="' + (bi === 1 ? '#e9cf7c' : '#fffaf0') + '"/>' +
        '<path d="' + P.d([[x - 57, 293 + t], [x + 57, 294], [x + 56, 307 - t], [x - 56, 306]]) + '" fill="' + (bi === 1 ? '#fffaf0' : '#e9cf7c') + '"/></g>';
    });
    $('bar-art').innerHTML = '<svg viewBox="0 40 500 412">' + out + '</svg>';
  })();

  $('map-pin').innerHTML = '<g class="stem"><g transform="translate(205 178) scale(.62)">' + P.head('poppy', 77) + '</g></g>';

  /* ---------- go ---------- */
  fillDays();
  update();
})();
