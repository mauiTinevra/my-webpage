/* Dark Sky Sonora: the page. Reads the clock, asks astro.js about the sun and moon,
   draws the sky on a canvas and runs the booking form. */
(function () {
  'use strict';
  var A = window.Astro, RAD = Math.PI / 180;
  var TZMS = A.TZ * 3600000, MIN = 60000, STEP = 5 * MIN;
  var $ = function (s) { return document.querySelector(s); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Phoenix time, written out by hand (UTC-7, no daylight saving) ---------- */
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function local(ms) { return new Date(ms + TZMS); }
  function clock(ms) {
    var d = local(Math.round(ms / MIN) * MIN), h = d.getUTCHours(), m = d.getUTCMinutes();
    return ((h + 11) % 12 + 1) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM' : ' PM');
  }
  function dayShort(n) { var d = new Date(Date.UTC(n.date[0], n.date[1] - 1, n.date[2])); return DOW[d.getUTCDay()] + ' ' + n.date[2] + ' ' + MON[n.date[1] - 1]; }
  function dayLong(n) { var d = new Date(Date.UTC(n.date[0], n.date[1] - 1, n.date[2])); return DOWL[d.getUTCDay()] + ' ' + n.date[2] + ' ' + MONL[n.date[1] - 1] + ' ' + n.date[0]; }
  function pct(x) { return Math.round(x * 100); }

  /* ---------- Which night is "tonight", and the six after it ---------- */
  function nightFor(ms) { var d = local(ms); return A.night(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); }
  var now = Date.now();
  var forced = /date=(\d{4})-(\d\d)-(\d\d)/.exec(location.hash);          // #date=2026-11-17 to look at another night
  if (forced) now = Date.UTC(+forced[1], +forced[2] - 1, +forced[3], 12 - A.TZ);
  var first = nightFor(now - 86400000);
  if (now >= first.sunrise) first = nightFor(now);                       // before sunrise, last evening's night is still tonight
  var nights = [first];
  for (var i = 1; i < 7; i++) nights.push(nightFor(first.noon + i * 86400000));

  var TOURS = {
    moon: { name: 'Moon and planets', hours: 2, price: 65 },
    deep: { name: 'Deep sky', hours: 3, price: 95 }
  };
  nights.forEach(function (n, idx) {
    var p = pct(n.phase.lit), ev = n.moonInNight;
    n.idx = idx; n.label = dayShort(n);
    // The plain verdict.
    if (!n.dark.length) {
      n.verdict = 'The moon is up all night, ' + p + '% lit.';
      n.brief = 'Moonlit all night';
    } else if (!ev.length) {
      n.verdict = 'Dark all night, from ' + clock(n.dusk) + ' to ' + clock(n.dawn) + '.';
      n.brief = 'Dark all night';
    } else if (ev[0].type === 'set') {
      n.verdict = 'Moonlit until ' + clock(ev[0].t) + ', then dark until ' + clock(n.dawn) + '.';
      n.brief = 'Dark from ' + clock(ev[0].t);
    } else {
      n.verdict = 'Dark until ' + clock(ev[0].t) + ', then the moon rises.';
      n.brief = 'Dark until ' + clock(ev[0].t);
    }
    n.tour = tourFor(n);
    n.meet = Math.round((n.sunset + 40 * MIN) / STEP) * STEP;
    n.ends = n.meet + n.tour.hours * 3600000;
    var dow = new Date(Date.UTC(n.date[0], n.date[1] - 1, n.date[2])).getUTCDay();
    n.left = 2 + (n.date[2] * 7 + n.date[1] * 3) % 6;                     // invented: seats left of 8
    n.closed = dow === 1 ? 'No tour on Mondays' : (idx === 0 && !forced && now > n.meet - 30 * MIN) ? 'Tonight’s group has gone out' : '';
    n.key = n.date.join('-');
  });
  var tonight = nights[0];
  // Which tour: is a moon worth looking at above the hills at any point in the first three hours?
  function tourFor(n) {
    var up = [70, 130, 190].some(function (m) { return A.moonAltAz(n.sunset + m * MIN).alt > 3; });
    return up && n.phase.lit >= 0.12 ? TOURS.moon : TOURS.deep;
  }

  /* ---------- Stars, moved from J2000 to this year ---------- */
  var stars = window.STARS.map(function (s) {
    var p = A.precess(s[1] * 15, s[2], now);
    return { name: s[0], ra: p.ra, dec: p.dec, mag: s[3], con: s[4], warm: !!s[5], kind: 'star' };
  });
  var byName = {};
  stars.forEach(function (s) { byName[s.name] = s; });
  // The Milky Way: points along the galactic equator, turned into right ascension and declination.
  var milky = [];
  for (var gl = 0; gl < 360; gl += 4) {
    var NGP_RA = 192.85948, NGP_DEC = 27.12825 * RAD, L0 = (122.93192 - gl) * RAD;
    var gdec = Math.asin(Math.sin(NGP_DEC) * 0 + Math.cos(NGP_DEC) * Math.cos(L0));
    var gra = NGP_RA + Math.atan2(Math.sin(L0), -Math.sin(NGP_DEC) * Math.cos(L0)) / RAD;
    var gp = A.precess(((gra % 360) + 360) % 360, gdec / RAD, now);
    milky.push({ ra: gp.ra, dec: gp.dec, w: 0.65 + 0.35 * Math.cos(gl * RAD) });     // broader and brighter towards the centre, in Sagittarius
  }
  var PLANET_MAG = { Venus: -4.2, Jupiter: -2.2, Mars: 0.8, Saturn: 0.9 };

  /* ---------- The state of the sky at one moment ---------- */
  var COMPASS16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  var COMPASS8 = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  function c16(az) { return COMPASS16[Math.round(az / 22.5) % 16]; }
  function c8(az) { return COMPASS8[Math.round(az / 45) % 8]; }

  function skyAt(t) {
    var s = A.sun(t), sh = A.altAz(s.ra, s.dec, t), mh = A.moonAltAz(t), ph = A.moonPhase(t);
    var objs = stars.map(function (st) {
      var h = A.altAz(st.ra, st.dec, t);
      return { o: st, name: st.name, kind: 'star', mag: st.mag, alt: h.alt, az: h.az, what: 'Star in ' + st.con };
    });
    A.planetNames.forEach(function (name) {
      var p = A.planet(name, t), q = A.precess(p.ra, p.dec, t), h = A.altAz(q.ra, q.dec, t);
      objs.push({ name: name, kind: 'planet', mag: PLANET_MAG[name], alt: h.alt, az: h.az, what: 'Planet' });
    });
    var state = sh.alt > -0.833 ? 'Daylight' : sh.alt > -6 ? 'Civil twilight' : sh.alt > -12 ? 'Nautical twilight'
      : sh.alt > -18 ? 'Astronomical twilight' : mh.alt > -0.833 ? 'Moonlit' : 'Dark';
    // Faintest star you could expect to pick out: twilight and moonlight both cut it.
    var f = Math.min(1, Math.max(0, (-sh.alt - 0.8) / 17.2));
    var lim = -2.6 + 6.9 * Math.pow(f, 0.6);
    if (mh.alt > 0) lim -= 1.4 * ph.lit * Math.sin(mh.alt * RAD) + 0.3 * ph.lit;
    return { t: t, sun: sh, moon: mh, phase: ph, objs: objs, state: state, lim: lim, twilight: 1 - f, lst: A.lst(t) };
  }

  /* ---------- Canvas chart ---------- */
  var canvas = $('#chart'), frame = $('#chart-frame'), ctx = canvas.getContext('2d');
  var W = 0, geo = null, hits = [], hover = null, lampOn = false;
  var FONT = '"JetBrains Mono", ui-monospace, monospace';

  function palette() {
    return lampOn
      ? { ink: '226,88,62', red: '226,88,62', deep: [5, 1, 4], dusk: [44, 10, 10], land: '#020001', page: '#070206' }
      : { ink: '233,226,207', red: '214,67,42', deep: [6, 9, 28], dusk: [38, 50, 104], land: '#04060f', page: '#0b1026' };
  }
  function proj(alt, az) {
    var r = geo.R * Math.tan((90 - alt) / 2 * RAD);
    return [geo.cx - r * Math.sin(az * RAD), geo.cy - r * Math.cos(az * RAD)];   // east is on the left, as it is overhead
  }
  function resize() {
    var w = frame.clientWidth;
    if (!w || w === W) return;
    W = w;
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(W * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    geo = { cx: W / 2, cy: W / 2, R: W / 2 - (W < 420 ? 22 : 30), k: Math.min(1.1, Math.max(0.74, W / 600)) };
    draw();
  }
  // The low hills and saguaros around the rim. Invented, but always the same.
  function ridge(az) {
    var a = az * RAD;
    return 0.011 + 0.004 * Math.sin(a * 3 + 1.1) + 0.003 * Math.sin(a * 7 + 2.3) + 0.0025 * Math.sin(a * 17 + 0.4) + 0.0015 * Math.sin(a * 41)
      + 0.016 * Math.exp(-Math.pow((az - 48) / 16, 2)) + 0.009 * Math.exp(-Math.pow((az - 62) / 5, 2)) + 0.008 * Math.exp(-Math.pow((az - 300) / 12, 2));
  }
  var SAGUAROS = [[18, 1], [78, .8], [122, 1.15], [163, .7], [236, 1], [281, .85], [338, 1.1]];

  function draw() {
    if (!geo || !cur) return;
    var P = palette(), s = cur, R = geo.R, cx = geo.cx, cy = geo.cy, k = geo.k;
    var ink = function (a) { return 'rgba(' + P.ink + ',' + a + ')'; };
    ctx.clearRect(0, 0, W, W);
    hits = [];

    // Sky colour: deep night, lifted by twilight, with the last glow where the sun went down.
    var tw = Math.pow(s.twilight, 1.6);
    var col = P.deep.map(function (c, i) { return Math.round(c + (P.dusk[i] - c) * tw); });
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    ctx.fillStyle = 'rgb(' + col.join(',') + ')'; ctx.fillRect(0, 0, W, W);
    if (s.twilight > 0.01) {
      var sp = proj(0, s.sun.az), g = ctx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], R * 1.15);
      g.addColorStop(0, 'rgba(' + P.red + ',' + (0.62 * s.twilight) + ')');
      g.addColorStop(0.35, 'rgba(' + P.red + ',' + (0.2 * s.twilight) + ')');
      g.addColorStop(1, 'rgba(' + P.red + ',0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
    }
    // Phoenix, low in the south-south-west. It never goes away.
    var cp = proj(0, 205), cg = ctx.createRadialGradient(cp[0], cp[1], 0, cp[0], cp[1], R * 0.5);
    cg.addColorStop(0, ink(0.13)); cg.addColorStop(1, ink(0));
    ctx.fillStyle = cg; ctx.fillRect(0, 0, W, W);
    // Moonlight washes the whole dome a little.
    if (s.moon.alt > 0) {
      var mp0 = proj(s.moon.alt, s.moon.az), mg = ctx.createRadialGradient(mp0[0], mp0[1], 0, mp0[0], mp0[1], R * 1.3);
      var wash = 0.2 * s.phase.lit * (0.4 + 0.6 * Math.sin(s.moon.alt * RAD));
      mg.addColorStop(0, ink(wash)); mg.addColorStop(1, ink(wash * 0.12));
      ctx.fillStyle = mg; ctx.fillRect(0, 0, W, W);
    }

    // The Milky Way, only once the sky is dark enough to show it.
    var mw = Math.min(1, Math.max(0, (s.lim - 3.3) / 0.9));
    if (mw > 0.02) {
      milky.forEach(function (m) {
        var h = A.altAz(m.ra, m.dec, s.t);
        if (h.alt < -12) return;
        var p = proj(h.alt, h.az), rad = R * (0.07 + 0.09 * m.w), fade = Math.min(1, Math.max(0.25, (h.alt + 4) / 24));
        var gm = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rad);
        gm.addColorStop(0, ink(0.042 * mw * fade * (0.5 + m.w))); gm.addColorStop(1, ink(0));
        ctx.fillStyle = gm; ctx.beginPath(); ctx.arc(p[0], p[1], rad, 0, 7); ctx.fill();
      });
    }

    // Altitude rings and the meridian: the logbook's ruled lines.
    ctx.lineWidth = 1; ctx.strokeStyle = ink(0.09);
    [30, 60].forEach(function (a) { ctx.beginPath(); ctx.arc(cx, cy, R * Math.tan((90 - a) / 2 * RAD), 0, 7); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
    ctx.font = '400 ' + (W < 420 ? 8 : 9) + 'px ' + FONT; ctx.fillStyle = ink(0.34); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('30°', cx + 4, cy + R * Math.tan(30 * RAD) - 4);
    ctx.fillText('60°', cx + 4, cy + R * Math.tan(15 * RAD) - 4);

    var pos = {};
    s.objs.forEach(function (o) { if (o.alt > -25) pos[o.name] = proj(o.alt, o.az); });

    // Constellation figures.
    ctx.strokeStyle = ink(0.26); ctx.lineWidth = 0.8; ctx.lineJoin = 'round';
    var bright = Math.min(1, Math.max(0, (s.lim - 0.5) / 2.5));
    ctx.globalAlpha = bright;
    window.FIGURES.forEach(function (fig) {
      for (var c = 1; c < fig.length; c++) {
        ctx.beginPath();
        var pen = false;
        fig[c].forEach(function (nm) {
          var p = pos[nm];
          if (!p) { pen = false; return; }
          if (pen) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
          pen = true;
        });
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    // Stars and planets.
    var labelMag = W < 440 ? 0.9 : 1.3, wants = [], halo = 'rgb(' + col.join(',') + ')';
    placed = [];
    s.objs.forEach(function (o) {
      if (o.alt < -1) return;
      var p = pos[o.name], a = Math.min(1, Math.max(0, (s.lim - o.mag + 0.7) / 1.3));
      if (o.alt < 6) a *= 0.35 + 0.65 * Math.max(0, o.alt) / 6;                 // murk near the horizon
      if (a < 0.03) return;
      var r = Math.max(0.75, 3.2 - 0.8 * Math.max(o.mag, -1.6)) * k;
      var c = o.o && o.o.warm && !lampOn ? '233,160,128' : P.ink;
      if (o.mag < 1) {
        var gl = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 4.2);
        gl.addColorStop(0, 'rgba(' + c + ',' + 0.3 * a + ')'); gl.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p[0], p[1], r * 4.2, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(' + c + ',' + a + ')';
      ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
      if (o.kind === 'planet') {
        ctx.strokeStyle = ink(0.75 * a); ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(p[0], p[1], r + 3.2 * k, 0, 7); ctx.stroke();
      }
      hits.push({ x: p[0], y: p[1], o: o });
      if (o.mag < 2.6) placed.push([p[0] - r - 1, p[1] - r - 1, 2 * r + 2, 2 * r + 2]);
      if ((o.kind === 'planet' || o.mag < labelMag || o.name === 'Polaris') && o.alt > 3 && a > 0.35 && !(hover && hover.name === o.name)) {
        wants.push({ text: o.name, p: p, gap: r + (o.kind === 'planet' ? 5 : 2), style: ink((o.kind === 'planet' ? 0.95 : 0.74) * a), rank: o.kind === 'planet' ? -5 : o.mag });
      }
    });

    // The moon, lit on the side that faces the sun.
    if (s.moon.alt > -1) {
      var mp = proj(s.moon.alt, s.moon.az), mr = Math.max(7, 10 * k);
      // Find which way the sun lies from the moon on this chart: step a little along the arc towards it.
      var mv = vec(s.moon.alt, s.moon.az), sv = vec(s.sun.alt, s.sun.az), d = mv[0] * sv[0] + mv[1] * sv[1] + mv[2] * sv[2];
      var q = [mv[0] + 0.03 * (sv[0] - d * mv[0]), mv[1] + 0.03 * (sv[1] - d * mv[1]), mv[2] + 0.03 * (sv[2] - d * mv[2])];
      var ql = Math.hypot(q[0], q[1], q[2]);
      var qp = proj(Math.asin(q[2] / ql) / RAD, Math.atan2(q[1], q[0]) / RAD);
      var ang = Math.atan2(qp[1] - mp[1], qp[0] - mp[0]);
      ctx.save(); ctx.translate(mp[0], mp[1]); ctx.rotate(ang);
      var halo = ctx.createRadialGradient(0, 0, mr, 0, 0, mr * 5);
      halo.addColorStop(0, ink(0.2 * s.phase.lit + 0.04)); halo.addColorStop(1, ink(0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, mr * 5, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgb(' + col.map(function (c) { return Math.round(c * 0.8 + 16); }).join(',') + ')';
      ctx.beginPath(); ctx.arc(0, 0, mr, 0, 7); ctx.fill();
      moonPath(ctx, mr, s.phase.lit);
      ctx.fillStyle = ink(0.96); ctx.fill();
      ctx.strokeStyle = ink(0.5); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(0, 0, mr, 0, 7); ctx.stroke();
      ctx.restore();
      hits.push({ x: mp[0], y: mp[1], o: { name: 'Moon', kind: 'moon', alt: s.moon.alt, az: s.moon.az, what: pct(s.phase.lit) + '% lit' } });
      if (!(hover && hover.name === 'Moon')) wants.push({ text: 'Moon', p: mp, gap: mr + 3, style: ink(0.95), rank: -9 });
    }
    // Labels, brightest first, each one looking for a free spot beside its star.
    ctx.font = '400 ' + (W < 440 ? 9.5 : 10.5) + 'px ' + FONT;
    wants.sort(function (a, b) { return a.rank - b.rank; }).forEach(function (w) { label(w, halo); });
    // Constellation names, only where the whole figure is up and there is room.
    if (W >= 440 && bright > 0.2) {
      ctx.font = '400 ' + (9.5 * Math.max(k, 0.9)) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '1.5px';
      window.FIGURES.forEach(function (fig) {
        var names = [].concat.apply([], fig.slice(1)), x = 0, y = 0, n = 0, low = false;
        names.forEach(function (nm) {
          var o = byNameNow[nm];
          if (!o || o.alt < 6) { low = true; return; }
          x += pos[nm][0]; y += pos[nm][1]; n++;
        });
        if (low || !n) return;
        x /= n; y /= n;
        var tw2 = ctx.measureText(fig[0]).width, spots = [[0, 0], [0, 16], [0, -16], [tw2 / 2 + 14, 0], [-tw2 / 2 - 14, 0], [0, 30], [0, -30]];
        for (var i = 0; i < spots.length; i++) {
          var bx = x + spots[i][0] - tw2 / 2 - 3, by = y + spots[i][1] - 7;
          if (!free(bx, by, tw2 + 6, 14)) continue;
          placed.push([bx, by, tw2 + 6, 14]);
          ctx.lineWidth = 4; ctx.strokeStyle = halo; ctx.lineJoin = 'round'; ctx.strokeText(fig[0], x + spots[i][0], y + spots[i][1]);
          ctx.fillStyle = ink(0.5 * bright); ctx.fillText(fig[0], x + spots[i][0], y + spots[i][1]);
          break;
        }
      });
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    }
    ctx.restore();   // end of clip

    // Horizon: hills and saguaros, drawn pointing up towards the middle of the sky.
    ctx.fillStyle = P.land;
    ctx.beginPath();
    for (var az = 0; az <= 360; az += 1) {
      var rr = R * (1 - ridge(az)), x = cx - rr * Math.sin(az * RAD), y = cy - rr * Math.cos(az * RAD);
      if (az) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.arc(cx, cy, R + 0.5, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2, true);
    ctx.fill('evenodd');
    SAGUAROS.forEach(function (sg) {
      var rr = R * (1 - ridge(sg[0]) + 0.004), x = cx - rr * Math.sin(sg[0] * RAD), y = cy - rr * Math.cos(sg[0] * RAD);
      var ux = (cx - x) / rr, uy = (cy - y) / rr, h = R * 0.062 * sg[1], w = h * 0.16;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(ux, -uy));
      ctx.lineCap = 'round'; ctx.strokeStyle = P.land; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h);
      ctx.moveTo(0, -h * 0.38); ctx.lineTo(-h * 0.26, -h * 0.38); ctx.lineTo(-h * 0.26, -h * 0.7);
      ctx.moveTo(0, -h * 0.52); ctx.lineTo(h * 0.24, -h * 0.52); ctx.lineTo(h * 0.24, -h * 0.82);
      ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
    });

    // Rim: a degree scale, with the compass points outside it.
    ctx.strokeStyle = ink(0.55); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R + 0.5, 0, 7); ctx.stroke();
    ctx.strokeStyle = ink(0.4);
    ctx.beginPath();
    for (var t = 0; t < 360; t += 5) {
      var len = t % 90 === 0 ? 0 : t % 30 === 0 ? 8 : t % 10 === 0 ? 5 : 2.5;
      var sx = Math.sin(t * RAD), sy = Math.cos(t * RAD);
      ctx.moveTo(cx - (R + 2) * sx, cy - (R + 2) * sy); ctx.lineTo(cx - (R + 2 + len) * sx, cy - (R + 2 + len) * sy);
    }
    ctx.stroke();
    ctx.font = '500 ' + (W < 420 ? 11 : 13) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var off = W < 420 ? 12 : 16;
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(function (c) {
      ctx.fillStyle = c[0] === 'N' ? 'rgba(' + P.red + ',1)' : ink(0.85);
      ctx.fillText(c[0], cx - (R + off) * Math.sin(c[1] * RAD), cy - (R + off) * Math.cos(c[1] * RAD) + 0.5);
    });

    // The star being pointed at.
    if (hover) {
      var hp = null;
      hits.forEach(function (h) { if (h.o.name === hover.name) hp = h; });
      if (hp) {
        ctx.strokeStyle = 'rgba(' + P.red + ',1)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 9, 0, 7); ctx.stroke();
        var l1 = hp.o.name, l2 = Math.round(hp.o.alt) + '° up, ' + c16(hp.o.az);
        ctx.font = '500 11px ' + FONT;
        var tw1 = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) + 16;
        var bx = Math.min(Math.max(hp.x - tw1 / 2, 4), W - tw1 - 4), by = hp.y > 60 ? hp.y - 52 : hp.y + 16;
        ctx.fillStyle = P.page; ctx.fillRect(bx, by, tw1, 36);
        ctx.strokeStyle = ink(0.5); ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, tw1 - 1, 35);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = ink(1); ctx.fillText(l1, bx + 8, by + 15);
        ctx.fillStyle = ink(0.7); ctx.font = '400 10px ' + FONT; ctx.fillText(l2, bx + 8, by + 29);
      }
    }
  }
  var byNameNow = {};
  function vec(alt, az) { return [Math.cos(alt * RAD) * Math.cos(az * RAD), Math.cos(alt * RAD) * Math.sin(az * RAD), Math.sin(alt * RAD)]; }
  var placed = [];
  function free(x, y, w, h) {
    var dx = Math.max(Math.abs(x - geo.cx), Math.abs(x + w - geo.cx)), dy = Math.max(Math.abs(y - geo.cy), Math.abs(y + h - geo.cy));
    if (dx * dx + dy * dy > geo.R * geo.R * 0.94) return false;                  // keep clear of the hills
    for (var i = 0; i < placed.length; i++) {
      var q = placed[i];
      if (x < q[0] + q[2] && x + w > q[0] && y < q[1] + q[3] && y + h > q[1]) return false;
    }
    return true;
  }
  function label(wn, halo) {
    var w = ctx.measureText(wn.text).width, g = wn.gap + 4, p = wn.p;
    var spots = [[g, -5, 'left'], [-g, -5, 'right'], [g, 8, 'left'], [-g, 8, 'right'], [0, g + 6, 'center'], [0, -g - 6, 'center']];
    for (var i = 0; i < spots.length; i++) {
      var sp = spots[i], x = p[0] + sp[0] - (sp[2] === 'right' ? w : sp[2] === 'center' ? w / 2 : 0), y = p[1] + sp[1] - 6;
      if (!free(x - 2, y, w + 4, 12)) continue;
      placed.push([x - 2, y, w + 4, 12]);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = 3; ctx.strokeStyle = halo; ctx.strokeText(wn.text, x, y + 6);
      ctx.fillStyle = wn.style; ctx.fillText(wn.text, x, y + 6);
      return;
    }
  }
  // The lit part of a moon of radius r, with the sun off to the right (+x). lit runs 0 to 1.
  function moonPath(c, r, lit) {
    var rx = r * Math.abs(2 * lit - 1);
    c.beginPath();
    c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);                          // the sunward limb
    c.ellipse(0, 0, rx, r, 0, Math.PI / 2, Math.PI * 1.5, lit < 0.5);           // the terminator
    c.closePath();
  }
  // The same shape as an SVG, north up, for the week table.
  function moonSVG(ph, size) {
    var r = size / 2 - 1, rx = (r * Math.abs(2 * ph.lit - 1)).toFixed(2), gib = ph.lit > 0.5 ? 1 : 0;
    var d = 'M0 ' + -r + 'A' + r + ' ' + r + ' 0 0 1 0 ' + r + 'A' + rx + ' ' + r + ' 0 0 ' + gib + ' 0 ' + -r + 'Z';
    return '<svg class="moon" viewBox="' + [-size / 2, -size / 2, size, size].join(' ') + '" width="' + size + '" height="' + size + '" aria-hidden="true">'
      + '<circle r="' + r + '" class="moon-dark"/><path d="' + d + '" class="moon-lit"' + (ph.waxing ? '' : ' transform="scale(-1 1)"') + '/><circle r="' + r + '" class="moon-rim"/></svg>';
  }

  /* ---------- Night bars: twilight, moonlight, dark ---------- */
  function barHTML(n, t0, t1) {
    var seg = function (a, b, cls) {
      a = Math.max(a, t0); b = Math.min(b, t1);
      return b > a ? '<i class="' + cls + '" style="left:' + ((a - t0) / (t1 - t0) * 100).toFixed(2) + '%;width:' + ((b - a) / (t1 - t0) * 100).toFixed(2) + '%"></i>' : '';
    };
    var h = seg(n.sunset, n.dusk, 'tw tw-a') + seg(n.dawn, n.sunrise, 'tw tw-b');
    var from = n.dusk;
    n.dark.forEach(function (w) { h += seg(from, w[0], 'ml') + seg(w[0], w[1], 'dk'); from = w[1]; });
    h += seg(from, n.dawn, 'ml');
    return h;
  }

  /* ---------- Hero: the verdict ---------- */
  function fact(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }
  function moonEventFacts(n) {
    return n.moonEvents.filter(function (e) { return e.t > n.sunset - 3 * 3600000 && e.t < n.sunrise; })
      .map(function (e) { return fact(e.type === 'rise' ? 'Moonrise' : 'Moonset', clock(e.t)); }).join('');
  }
  function renderHero() {
    var n = tonight, p = pct(n.phase.lit);
    $('#logline').textContent = 'Observing log, ' + dayLong(n) + '. 33.49° N, 111.93° W.';
    $('#verdict').textContent = n.verdict;
    var note;
    if (n.closed) {
      var next = nights.filter(function (x) { return !x.closed; })[0];
      note = n.closed + '. The next tour is ' + next.label + ': ' + next.tour.name + ', meeting at ' + clock(next.meet) + '.';
      $('#book-tonight').textContent = 'Book a seat for ' + next.label;
      $('#book-tonight').dataset.night = next.key;
    } else {
      note = 'So tonight we run ' + n.tour.name + '. Meet at ' + clock(n.meet) + ', back at the cars by ' + clock(n.ends) + '. '
        + n.left + ' of 8 seats left.';
      $('#book-tonight').dataset.night = n.key;
    }
    $('#verdict-note').textContent = note;
    $('#facts').innerHTML = fact('Sunset', clock(n.sunset)) + fact('Fully dark', clock(n.dusk))
      + fact('Moon', moonSVG(n.phase, 16) + p + '% lit, ' + n.phase.name) + moonEventFacts(n) + fact('First light', clock(n.dawn));
  }

  /* ---------- The chart's controls ---------- */
  var slider = $('#hour'), cur = null, sel = tonight, playing = null;
  function tOf(v) { return sel.t0 + v * STEP; }
  function setNight(n, startAt) {
    sel = n;
    n.t0 = Math.floor(n.sunset / STEP) * STEP;
    slider.max = Math.ceil((n.sunrise - n.t0) / STEP);
    var t1 = tOf(+slider.max);
    $('#scrub-bar').innerHTML = barHTML(n, n.t0, t1);
    // A ruler under the bar: a tick for every whole hour, a figure every third.
    var ticks = '';
    for (var h = Math.ceil((n.t0 + TZMS) / 3600000) * 3600000 - TZMS; h < t1; h += 3600000) {
      var hr = local(h).getUTCHours(), big = hr % 3 === 0 && h - n.t0 > 40 * MIN && t1 - h > 40 * MIN;
      ticks += '<i' + (big ? ' class="big"' : '') + ' style="left:' + ((h - n.t0) / (t1 - n.t0) * 100).toFixed(2) + '%">' + (big ? '<b>' + clock(h).replace(':00', '') + '</b>' : '') + '</i>';
    }
    $('#ticks').innerHTML = ticks;
    $('#end-a').textContent = 'sunset ' + clock(n.sunset);
    $('#end-b').textContent = 'sunrise ' + clock(n.sunrise);
    $('#sky-h').textContent = n === tonight ? 'Tonight’s sky, computed' : 'The sky on ' + n.label + ', computed';
    $('#back-tonight').hidden = n === tonight;
    // Jump buttons for the moments that matter.
    var jumps = [['Sunset', n.sunset], ['Fully dark', n.dusk]];
    n.moonEvents.forEach(function (e) { if (e.t > n.sunset && e.t < n.sunrise) jumps.push([e.type === 'rise' ? 'Moonrise' : 'Moonset', e.t]); });
    jumps.push(['Midnight', n.noon + 12 * 3600000], ['First light', n.dawn]);
    jumps.sort(function (a, b) { return a[1] - b[1]; });
    $('#jumps').innerHTML = jumps.map(function (j) {
      return '<button type="button" class="chip" data-v="' + Math.round((j[1] - n.t0) / STEP) + '">' + j[0] + '</button>';
    }).join('');
    var v = startAt != null ? Math.round((startAt - n.t0) / STEP) : Math.round((n.dusk - n.t0) / STEP) + 6;
    slider.value = Math.max(0, Math.min(+slider.max, v));
    update();
  }
  function update() {
    var t = tOf(+slider.value);
    cur = skyAt(t);
    byNameNow = {};
    cur.objs.forEach(function (o) { byNameNow[o.name] = o; });
    var s = cur, time = clock(t);
    $('#clock').textContent = time;
    slider.style.setProperty('--p', (+slider.value / +slider.max * 100) + '%');
    var moonTxt = s.moon.alt > -0.833 ? Math.round(Math.max(0, s.moon.alt)) + '° up, ' + c16(s.moon.az) + ', ' + pct(s.phase.lit) + '% lit' : 'Below the horizon';
    var lstH = s.lst / 15, lh = Math.floor(lstH), lm = Math.floor((lstH - lh) * 60);
    $('#readout').innerHTML = fact('Sky', s.state) + fact('Moon', moonTxt)
      + fact('Sun', Math.abs(s.sun.alt) < 1 ? 'On the horizon' : Math.abs(Math.round(s.sun.alt)) + '° ' + (s.sun.alt < 0 ? 'below' : 'above') + ' the horizon')
      + fact('Sidereal time', (lh < 10 ? '0' : '') + lh + 'h ' + (lm < 10 ? '0' : '') + lm + 'm');

    // What is up, in words.
    var list = s.objs.filter(function (o) { return o.alt > 8 && o.mag < s.lim + 0.3; })
      .sort(function (a, b) { return (a.kind === 'planet' ? -9 : 0) + a.mag - (b.kind === 'planet' ? -9 : 0) - b.mag; }).slice(0, 9);
    var rows = '';
    if (s.moon.alt > 0) rows += row('Moon', pct(s.phase.lit) + '% lit, ' + s.phase.name, s.moon);
    list.forEach(function (o) { rows += row(o.name, o.what, o); });
    if (!rows) rows = '<tr><td colspan="4">Nothing bright enough to pick out yet. The sky is still too light.</td></tr>';
    $('#up-table tbody').innerHTML = rows;
    $('#up-time').textContent = time + (sel === tonight ? '' : ' on ' + sel.label);

    var names = list.slice(0, 5).map(function (o) { return o.name + ' (' + c8(o.az) + ')'; });
    var words = time + '. ' + s.state + '. ' + (s.moon.alt > 0 ? 'Moon ' + Math.round(s.moon.alt) + ' degrees up in the ' + c8(s.moon.az) + ', ' + pct(s.phase.lit) + ' percent lit. ' : 'Moon down. ');
    slider.setAttribute('aria-valuetext', words);
    canvas.setAttribute('aria-label', 'Chart of the whole sky over Scottsdale at ' + words
      + (names.length ? 'Brightest above the horizon: ' + names.join(', ') + '.' : 'No stars visible yet.'));
    draw();
  }
  function row(name, what, h) {
    var where = h.alt > 75 ? 'Straight up' : (h.alt > 50 ? 'High in the ' : h.alt < 20 ? 'Low in the ' : 'In the ') + c8(h.az);
    return '<tr><th scope="row">' + name + '</th><td>' + what + '</td><td>' + where + '</td><td class="num">' + Math.round(h.alt) + '°</td></tr>';
  }
  slider.addEventListener('input', function () { stop(); cancelAnimationFrame(gliding); update(); });
  $('#jumps').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    glide(+b.dataset.v);
  });
  // A jump turns the sky to its new hour instead of snapping there. With reduced motion it snaps.
  var gliding = 0;
  function glide(to) {
    stop(); cancelAnimationFrame(gliding);
    var from = +slider.value, t0 = performance.now(), ms = Math.min(900, 250 + Math.abs(to - from) * 9);
    if (reduced.matches || from === to) { slider.value = to; update(); return; }
    (function frame(nowT) {
      var x = Math.min(1, (nowT - t0) / ms), e = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      slider.value = Math.round(from + (to - from) * e);
      update();
      if (x < 1) gliding = requestAnimationFrame(frame);
    })(t0);
  }
  $('#play').addEventListener('click', function () { playing ? stop() : play(); });
  $('#back-tonight').addEventListener('click', function () { stop(); setNight(tonight); });
  function play() {
    cancelAnimationFrame(gliding);
    var b = $('#play');
    if (+slider.value >= +slider.max) slider.value = 0;
    b.setAttribute('aria-pressed', 'true'); b.textContent = 'Stop the sky';
    var slow = reduced.matches;                                   // with reduced motion: half-hour jumps, not a sweep
    playing = setInterval(function () {
      slider.value = +slider.value + (slow ? 6 : 1);
      update();
      if (+slider.value >= +slider.max) stop();
    }, slow ? 900 : 70);
  }
  function stop() {
    if (!playing) return;
    clearInterval(playing); playing = null;
    var b = $('#play');
    if (b) { b.setAttribute('aria-pressed', 'false'); b.textContent = 'Turn the sky'; }
  }

  // Pointing at a star names it.
  function pick(e) {
    var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = null, bd = 18 * 18;
    hits.forEach(function (h) { var d = (h.x - x) * (h.x - x) + (h.y - y) * (h.y - y); if (d < bd) { bd = d; best = h.o; } });
    if ((best && best.name) !== (hover && hover.name)) { hover = best; canvas.style.cursor = best ? 'crosshair' : ''; draw(); }
  }
  canvas.addEventListener('pointermove', pick);
  canvas.addEventListener('pointerdown', pick);
  canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && hover) { hover = null; draw(); } });

  /* ---------- The week ---------- */
  function renderWeek() {
    var ax0 = function (n) { return n.noon + 5 * 3600000; }, span = 15 * 3600000;   // every row runs 5 PM to 8 AM
    $('#week-axis').innerHTML = [['6 PM', 1], ['9 PM', 4], ['Midnight', 7], ['3 AM', 10], ['6 AM', 13]].map(function (a) {
      return '<span style="left:' + (a[1] / 15 * 100) + '%">' + a[0] + '</span>';
    }).join('');
    $('#nights').innerHTML = nights.map(function (n) {
      var p = pct(n.phase.lit);
      return '<li class="night' + (n.closed ? ' is-closed' : '') + '" data-key="' + n.key + '">'
        + '<p class="n-date">' + (n.idx === 0 ? 'Tonight' : n.label.split(' ')[0]) + '<span>' + n.date[2] + ' ' + MON[n.date[1] - 1] + '</span></p>'
        + '<p class="n-moon">' + moonSVG(n.phase, 26) + '<span>' + p + '%<span class="vh"> lit, ' + n.phase.name + '</span></span></p>'
        + '<div class="n-bar"><div class="nightbar" aria-hidden="true">' + barHTML(n, ax0(n), ax0(n) + span) + '</div><p class="n-brief">' + n.brief + '</p></div>'
        + '<p class="n-tour">' + (n.closed ? n.closed : n.tour.name + '<span>Meet ' + clock(n.meet) + ', ' + n.left + ' seats left</span>') + '</p>'
        + '<div class="n-act"><button type="button" class="chip" data-sky="' + n.idx + '">See this sky<span class="vh"> for ' + n.label + '</span></button>'
        + (n.closed ? '' : '<a class="chip chip-solid" href="#book" data-night="' + n.key + '">Book<span class="vh"> ' + n.label + '</span></a>') + '</div></li>';
    }).join('');
  }
  // If the whole week is one kind of tour, look further ahead for the first night of the other kind.
  (function () {
    var kinds = nights.filter(function (n) { return !n.closed; }).map(function (n) { return n.tour; });
    if (kinds.indexOf(TOURS.deep) >= 0 && kinds.indexOf(TOURS.moon) >= 0) return;
    var want = kinds.indexOf(TOURS.deep) < 0 ? TOURS.deep : TOURS.moon;
    for (var i = 7; i < 36; i++) {
      var n = nightFor(first.noon + i * 86400000);
      if (new Date(Date.UTC(n.date[0], n.date[1] - 1, n.date[2])).getUTCDay() === 1 || tourFor(n) !== want) continue;
      var note = $('#week-note');
      note.hidden = false;
      note.innerHTML = (want === TOURS.deep ? 'A bright moon owns every evening this week. The next moonless evening, and the next Deep sky tour, is '
        : 'Every evening this week is moonless. The moon is back in the evening sky, for Moon and planets, on ')
        + '<strong>' + dayLong(n).replace(/ \d{4}$/, '') + '</strong>. To hold seats that far ahead, call or text 480-555-0142.';
      return;
    }
  })();
  $('#nights').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sky]');
    if (!b) return;
    stop(); setNight(nights[+b.dataset.sky]);
    $('#sky').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    $('#hour').focus({ preventScroll: true });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-night]');
    if (a && !booking) { nightSel.value = a.dataset.night; seats = Math.min(seats, chosen().left); renderForm(); }
  });

  /* ---------- Booking ---------- */
  var form = $('#form'), slip = $('#slip'), nightSel = $('#f-night'), seats = 2, booking = null;
  var open = nights.filter(function (n) { return !n.closed; });
  function chosen() { return nights.filter(function (n) { return n.key === nightSel.value; })[0] || open[0]; }
  nightSel.innerHTML = nights.map(function (n) {
    return '<option value="' + n.key + '"' + (n.closed ? ' disabled' : '') + '>' + n.label + (n.idx === 0 ? ' (tonight)' : '') + ': '
      + (n.closed ? n.closed.toLowerCase() : n.tour.name) + '</option>';
  }).join('');
  nightSel.value = open[0].key;
  function renderForm() {
    var n = chosen();
    seats = Math.max(1, Math.min(seats, n.left));
    $('#seats').textContent = seats;
    $('#less').disabled = seats <= 1; $('#more').disabled = seats >= n.left;
    $('#seats-hint').textContent = seats >= n.left ? 'That is every seat left on ' + n.label + '.' : n.left + ' left on ' + n.label + '.';
    $('#summary').innerHTML = '<strong>' + seats + (seats === 1 ? ' seat' : ' seats') + ' on ' + n.tour.name + ', ' + n.label + '.</strong> Meet at '
      + clock(n.meet) + ' at the Cholla Tank lot. $' + seats * n.tour.price + ', paid on the night.';
  }
  $('#less').addEventListener('click', function () { seats--; renderForm(); });
  $('#more').addEventListener('click', function () { seats++; renderForm(); });
  nightSel.addEventListener('change', renderForm);

  function save() { try { booking ? sessionStorage.setItem('dss-booking', JSON.stringify(booking)) : sessionStorage.removeItem('dss-booking'); } catch (e) { /* private mode: the booking just lasts until reload */ } }
  function showSlip(focus) {
    var b = booking;
    form.hidden = true; slip.hidden = false;
    slip.innerHTML = '<p class="slip-ref">Held, ref ' + b.ref + '</p>'
      + '<h3>' + b.seats + (b.seats === 1 ? ' seat' : ' seats') + ' for ' + esc(b.name) + '</h3>'
      + '<dl>' + fact('Night', b.label) + fact('Tour', b.tour) + fact('Meet', b.meet + ', Cholla Tank lot') + fact('To pay', '$' + b.total + ' on the night') + fact('Weather text', 'By 3 PM to ' + esc(b.phone)) + '</dl>'
      + '<p class="slip-note">The sky that night: ' + b.sky.charAt(0).toLowerCase() + b.sky.slice(1) + '</p>'
      + '<div class="slip-act"><button type="button" class="btn btn-ink" id="change">Change this booking</button><button type="button" class="btn btn-line" id="cancel">Cancel it</button></div>';
    if (focus) slip.focus();
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#f-name'), phone = $('#f-phone');
    var okN = name.value.trim().length > 1, okP = phone.value.replace(/\D/g, '').length >= 10;
    $('#e-name').hidden = okN; name.setAttribute('aria-invalid', !okN);
    $('#e-phone').hidden = okP; phone.setAttribute('aria-invalid', !okP);
    if (!okN) { name.focus(); return; }
    if (!okP) { phone.focus(); return; }
    var n = chosen();
    booking = { key: n.key, seats: seats, name: name.value.trim(), phone: phone.value.trim(), label: n.label, tour: n.tour.name,
      meet: clock(n.meet), total: seats * n.tour.price, sky: n.verdict,
      ref: 'DSS-' + (n.date[1] < 10 ? '0' : '') + n.date[1] + (n.date[2] < 10 ? '0' : '') + n.date[2] + '-' + seats + name.value.trim().charAt(0).toUpperCase() };
    save(); showSlip(true);
  });
  slip.addEventListener('click', function (e) {
    if (e.target.id === 'change') {
      $('#f-name').value = booking.name; $('#f-phone').value = booking.phone; seats = booking.seats;
      if (nights.some(function (n) { return n.key === booking.key && !n.closed; })) nightSel.value = booking.key;
      booking = null; save();
      slip.hidden = true; form.hidden = false; renderForm(); nightSel.focus();
    } else if (e.target.id === 'cancel') {
      booking = null; save();
      slip.innerHTML = '<p class="slip-ref">Cancelled</p><h3>Nothing is held in your name now.</h3><p class="slip-note">No charge. The seats have gone back to the group.</p>'
        + '<div class="slip-act"><button type="button" class="btn btn-ink" id="again">Book a different night</button></div>';
      slip.focus();
    } else if (e.target.id === 'again') {
      slip.hidden = true; form.hidden = false; form.reset(); seats = 2; nightSel.value = open[0].key; renderForm(); nightSel.focus();
    }
  });
  try {
    var saved = JSON.parse(sessionStorage.getItem('dss-booking') || 'null');
    if (saved && nights.some(function (n) { return n.key === saved.key; })) booking = saved;
  } catch (e) { /* nothing saved */ }

  /* ---------- Red lamp ---------- */
  $('#lamp').addEventListener('click', function () {
    lampOn = !lampOn;
    document.documentElement.classList.toggle('lamp-on', lampOn);
    this.setAttribute('aria-pressed', lampOn);
    draw();
  });

  /* ---------- Go ---------- */
  renderHero();
  renderWeek();
  renderForm();
  if (booking) showSlip(false);
  var inNight = !forced && now > tonight.sunset && now < tonight.sunrise;
  setNight(tonight, inNight ? now : null);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(frame); else window.addEventListener('resize', resize);
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
