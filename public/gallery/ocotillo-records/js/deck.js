/* Ocotillo Records: the listening station.
   A turntable in SVG and a small groovebox in Web Audio. There are no audio files:
   every drum, bass note, lead note and crackle is built from oscillators and noise as it plays. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var PAPER = '#efe6d2', INK = '#161616', HOT = '#ffc61a';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- the crate ----------
     Two bars of sixteen steps each. Drums: x hit, o soft hit, O open hat, . rest.
     Bass and lead: one token per step. "E2" is a note, "A3+C4+E4" a chord, ":3" holds it three steps. */
  var RECORDS = [
    {
      title: 'Saguaro Hour', artist: 'The Dry Wash Seven', cat: 'OCO-0417', label: 'Third Wash Recording, 1974', grade: 'VG+', price: '$18',
      feel: 'dry funk', bpm: 96, swing: .14, bassVoice: 'pluck', leadVoice: 'clav',
      kick:  'x.....x...x.....x.....x..x.x....',
      snare: '....x..o....x..o....x..o....x.oo',
      hat:   'x.xox.xox.xox.xox.xox.xox.xox.O.',
      bass: 'E2 - - E2 - - G2 - A2 - - A2 B2 - D3 -  E2 - - E2 - - G2 - A2 - B2 - D3 - B2 A2',
      lead: '- - E4 - G4 - - E4 - - B4 A4 - G4 - -  - - E4 - G4 - - A4 - B4 - D5 - B4 A4 G4'
    },
    {
      title: 'Monsoon Static', artist: 'Lupe Vantine and the Night Shift', cat: 'OCO-0418', label: 'Low Mesa Pressings, 1971', grade: 'NM', price: '$24',
      feel: 'slow soul', bpm: 72, swing: .2, bassVoice: 'round', leadVoice: 'keys', snareVoice: 'brush',
      kick:  'x.......x.x.....x......xx.......',
      snare: '....x.......x.......x.......x..o',
      hat:   'o.o.o.o.o.o.o.o.o.o.o.o.o.o.o.o.',
      bass: 'A1:4 - - - - - E2 - A2:2 - G2:2 - - - E2 -  D2:4 - - - - - A2 - D2:2 - F2:2 - E2:2 - G2 -',
      lead: 'A3+C4+E4+G4:7 - - - - - - - E5:2 - D5:2 - C5:4 - - -  D4+F4+A4+C5:7 - - - - - - - A4:2 - C5:2 - E5:4 - - -'
    },
    {
      title: 'Copper State Stomp', artist: 'Hal Brisco Trio', cat: 'OCO-0419', label: 'Javelina Hi-Fi, 1966', grade: 'VG', price: '$15',
      feel: 'organ shuffle', bpm: 132, swing: .24, bassVoice: 'walk', leadVoice: 'organ',
      kick:  'x.....x.x.....x.x.....x.x..x..x.',
      snare: '....x.......x.......x.......x.x.',
      hat:   'x.x.x.x.x.x.x.O.x.x.x.x.x.x.x.O.',
      bass: 'G2 - B2 - D3 - E3 - F3 - E3 - D3 - B2 -  C3 - E3 - G3 - A3 - Bb3 - A3 - G3 - D3 -',
      lead: 'G4+B4 - - G4+B4 - - D5:3 - - - F5 - E5 - D5 -  C5+E5 - - C5+E5 - - G5:3 - - - E5 - D5 - B4:2 -'
    },
    {
      title: 'Parking Lot Moon', artist: 'Glass Arroyo', cat: 'OCO-0420', label: 'Sunslab, 1983', grade: 'VG+', price: '$21',
      feel: 'drum machine and arpeggio', bpm: 112, swing: 0, bassVoice: 'square', leadVoice: 'arp', snareVoice: 'clap',
      kick:  'x...x...x...x...x...x...x...x...',
      snare: '....x.......x.......x.......x.x.',
      hat:   'o.O.o.O.o.O.o.O.o.O.o.O.o.O.o.Oo',
      bass: 'D2 - D3 D2 - D3 D2 - D2 - D3 D2 - D3 F2 -  Bb1 - Bb2 Bb1 - Bb2 Bb1 - C2 - C3 C2 - C3 E2 -',
      lead: 'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 F4 E5 - D5 -  D4 F4 Bb4 D5 Bb4 F4 D4 F4 E4 G4 C5 E5 C5 G4 E5 -'
    }
  ];

  // how loud the surface noise is for each grade on the sticker
  var NOISE = { 'NM': .28, 'VG+': .5, 'VG': .85, 'G+': 1.1 };

  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function hz(name) {
    var m = /^([A-G])([#b]?)(\d)$/.exec(name);
    var n = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }
  function parseLine(line) {
    return line.trim().split(/\s+/).map(function (tok) {
      if (tok === '-') return null;
      var parts = tok.split(':');
      return { notes: parts[0].split('+').map(hz), len: parts[1] ? parseInt(parts[1], 10) : 1 };
    });
  }
  RECORDS.forEach(function (r) { r.bassSteps = parseLine(r.bass); r.leadSteps = parseLine(r.lead); });

  /* ---------- sound ---------- */
  var noiseCache = new WeakMap();
  function noise(ctx) {
    if (!noiseCache.has(ctx)) {
      var buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      noiseCache.set(ctx, buf);
    }
    return noiseCache.get(ctx);
  }
  // Surface noise. The buffer is exactly three turns of a 33 1/3 record (1.8 s each),
  // with one tick that lands at the same spot on every turn, like a real scratch.
  function crackleBuffer(ctx) {
    var sr = ctx.sampleRate, turn = Math.round(sr * 1.8), buf = ctx.createBuffer(1, turn * 3, sr), d = buf.getChannelData(0);
    function pop(at, amp, len) {
      for (var k = 0; k < len && at + k < d.length; k++) d[at + k] += amp * Math.exp(-k / (len / 5)) * (k % 2 ? -1 : 1);
    }
    for (var i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * .012;
      if (Math.random() < .00042) pop(i, .12 + Math.random() * .5, 12 + (Math.random() * 30 | 0));
    }
    for (var t = 0; t < 3; t++) { pop(t * turn + (sr * .7 | 0), .75, 38); pop(t * turn + (sr * .74 | 0), .3, 20); }
    return buf;
  }

  function Voices(ctx, out) {
    function gainEnv(t, attack, peak, decay) {
      var g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(.0001, t + attack + decay);
      g.connect(out);
      return g;
    }
    function osc(type, f, t, stop) {
      var o = ctx.createOscillator();
      o.type = type; o.frequency.setValueAtTime(f, t);
      o.start(t); o.stop(stop);
      return o;
    }
    function burst(t, dur, filterType, freq, q) {
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter();
      s.buffer = noise(ctx); s.loop = true;
      f.type = filterType; f.frequency.value = freq; f.Q.value = q || .7;
      s.connect(f); s.start(t, Math.random() * .5); s.stop(t + dur);
      return f;
    }
    var v = {};
    v.kick = function (t, vel) {
      var o = osc('sine', 150, t, t + .4);
      o.frequency.exponentialRampToValueAtTime(46, t + .11);
      o.connect(gainEnv(t, .002, .95 * vel, .3));
      burst(t, .02, 'lowpass', 2500).connect(gainEnv(t, .001, .2 * vel, .015));
    };
    v.snare = function (t, vel, kind) {
      if (kind === 'brush') {
        burst(t, .3, 'bandpass', 3200, .5).connect(gainEnv(t, .012, .3 * vel, .2));
        return;
      }
      if (kind === 'clap') {
        [0, .011, .023].forEach(function (off, i) {
          burst(t + off, .2, 'bandpass', 1300, 1.2).connect(gainEnv(t + off, .001, (i === 2 ? .55 : .35) * vel, i === 2 ? .14 : .02));
        });
        return;
      }
      burst(t, .22, 'bandpass', 1900, .6).connect(gainEnv(t, .001, .5 * vel, .15));
      var o = osc('triangle', 205, t, t + .15);
      o.frequency.exponentialRampToValueAtTime(150, t + .08);
      o.connect(gainEnv(t, .001, .32 * vel, .09));
    };
    v.hat = function (t, vel, open) {
      burst(t, open ? .3 : .08, 'highpass', 7200).connect(gainEnv(t, .001, .2 * vel, open ? .2 : .035));
    };
    v.bass = function (t, f, dur, kind) {
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      var end = t + dur + .12, g;
      if (kind === 'round') {
        lp.frequency.value = 420;
        g = gainEnv(t, .012, .46, dur + .08);
        osc('sine', f, t, end).connect(lp); osc('triangle', f, t, end).connect(lp);
      } else if (kind === 'walk') {
        lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(260, t + .16);
        g = gainEnv(t, .006, .6, Math.min(dur, .3) + .05);
        osc('triangle', f, t, end).connect(lp); osc('sine', f, t, end).connect(lp);
      } else if (kind === 'square') {
        lp.frequency.setValueAtTime(1100, t); lp.frequency.exponentialRampToValueAtTime(320, t + .12);
        lp.Q.value = 3;
        g = gainEnv(t, .003, .3, dur * .9);
        osc('square', f, t, end).connect(lp);
      } else { // pluck: a short filtered saw, the way a muted bass string sounds
        lp.frequency.setValueAtTime(1300, t); lp.frequency.exponentialRampToValueAtTime(190, t + .14);
        lp.Q.value = 2;
        g = gainEnv(t, .003, .5, Math.min(dur, .22) + .04);
        osc('sawtooth', f, t, end).connect(lp);
        var sub = ctx.createGain(); sub.gain.value = .6; sub.connect(lp);
        osc('sine', f, t, end).connect(sub);
      }
      lp.connect(g);
    };
    v.lead = function (t, f, dur, kind, chordSize) {
      var end = t + dur + 1.4, level = 1 / Math.sqrt(chordSize || 1), g, flt;
      if (kind === 'clav') {
        flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.Q.value = 2.2;
        flt.frequency.setValueAtTime(3000, t); flt.frequency.exponentialRampToValueAtTime(900, t + .12);
        g = gainEnv(t, .002, .34 * level, .17);
        osc('square', f, t, t + .4).connect(flt); osc('sawtooth', f * 1.003, t, t + .4).connect(flt);
        flt.connect(g);
      } else if (kind === 'keys') { // two-operator FM, a soft electric piano
        var car = osc('sine', f, t, end), mod = osc('sine', f * 2, t, end), idx = ctx.createGain();
        idx.gain.setValueAtTime(f * 1.6, t); idx.gain.exponentialRampToValueAtTime(f * .12, t + .5);
        mod.connect(idx); idx.connect(car.frequency);
        g = gainEnv(t, .006, .16 * level, dur + .9);
        car.connect(g);
      } else if (kind === 'organ') { // three drawbars and a slow wobble
        g = ctx.createGain();
        g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.115 * level, t + .012);
        g.gain.setValueAtTime(.115 * level, t + dur * .82); g.gain.linearRampToValueAtTime(.0001, t + dur * .82 + .05);
        g.connect(out);
        var vib = osc('sine', 6.2, t, t + dur + .1), depth = ctx.createGain(); depth.gain.value = f * .006; vib.connect(depth);
        [[1, 1], [2, .55], [3, .3], [.5, .4]].forEach(function (h) {
          var o = osc('sine', f * h[0], t, t + dur + .1), hg = ctx.createGain();
          hg.gain.value = h[1]; depth.connect(o.frequency); o.connect(hg); hg.connect(g);
        });
      } else { // arp: a resonant saw pluck
        flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.Q.value = 6;
        flt.frequency.setValueAtTime(3400, t); flt.frequency.exponentialRampToValueAtTime(500, t + .16);
        g = gainEnv(t, .002, .2 * level, .2);
        osc('sawtooth', f, t, t + .4).connect(flt);
        flt.connect(g);
      }
    };
    return v;
  }

  // Schedules one step of a record at an exact audio-clock time. Used live and by the offline check.
  function scheduleStep(rec, voices, step, t, stepDur) {
    var k = rec.kick[step], s = rec.snare[step], h = rec.hat[step];
    if (k !== '.') voices.kick(t, k === 'x' ? 1 : .5);
    if (s !== '.') voices.snare(t, s === 'x' ? 1 : .35, rec.snareVoice);
    if (h !== '.') voices.hat(t, h === 'o' ? .45 : 1, h === 'O');
    var b = rec.bassSteps[step], l = rec.leadSteps[step];
    if (b) voices.bass(t, b.notes[0], b.len * stepDur * .92, rec.bassVoice);
    if (l) l.notes.forEach(function (f) { voices.lead(t, f, l.len * stepDur * .95, rec.leadVoice, l.notes.length); });
  }
  function stepTime(rec, step, stepDur) { return step * stepDur + (step % 2 ? rec.swing * stepDur : 0); }

  // The record chain: everything a pressing does to a mix. A little saturation, the top rolled off,
  // and a delay line wobbling once per turn for wow.
  function recordChain(ctx, dest, rec) {
    var bus = ctx.createGain(), drive = ctx.createWaveShaper(), lp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter();
    var wow = ctx.createDelay(.05), lfo = ctx.createOscillator(), lfoDepth = ctx.createGain(), out = ctx.createGain();
    var curve = new Float32Array(1024);
    for (var i = 0; i < 1024; i++) { var x = i / 511.5 - 1; curve[i] = Math.tanh(1.6 * x) / Math.tanh(1.6); }
    drive.curve = curve;
    lp.type = 'lowpass'; lp.frequency.value = 7800; lp.Q.value = .5;
    hp.type = 'highpass'; hp.frequency.value = 38;
    wow.delayTime.value = .012; lfo.frequency.value = 1 / 1.8; lfoDepth.gain.value = .0011;
    lfo.connect(lfoDepth); lfoDepth.connect(wow.delayTime); lfo.start();
    bus.gain.value = .5;
    bus.connect(drive); drive.connect(lp); lp.connect(hp); hp.connect(wow); wow.connect(out); out.gain.value = .85; out.connect(dest);
    if (rec.leadVoice === 'arp') { // a dotted-eighth echo for the drum machine record
      var echo = ctx.createDelay(1), fb = ctx.createGain(), send = ctx.createGain();
      echo.delayTime.value = 60 / rec.bpm * .75; fb.gain.value = .32; send.gain.value = .22;
      lp.connect(send); send.connect(echo); echo.connect(fb); fb.connect(echo); echo.connect(hp);
    }
    return { bus: bus, out: out, lfo: lfo };
  }

  var ctx = null, master = null, session = null, timer = null, volume = .7;
  var visualQueue = [];

  function ensureContext() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .18;
    master = ctx.createGain(); master.gain.value = volume * volume;
    master.connect(comp); comp.connect(ctx.destination);
  }

  function startAudio(rec) {
    ensureContext();
    if (ctx.state === 'suspended') ctx.resume();
    stopAudio();
    var chain = recordChain(ctx, master, rec), voices = Voices(ctx, chain.bus);
    var t0 = ctx.currentTime + .05, stepDur = 60 / rec.bpm / 4;

    // needle down: a soft thump, then surface noise, then the music a beat later
    var thump = ctx.createOscillator(), tg = ctx.createGain();
    thump.frequency.setValueAtTime(90, t0); thump.frequency.exponentialRampToValueAtTime(38, t0 + .12);
    tg.gain.setValueAtTime(.5, t0); tg.gain.exponentialRampToValueAtTime(.0001, t0 + .2);
    thump.connect(tg); tg.connect(chain.out); thump.start(t0); thump.stop(t0 + .25);

    var crackle = ctx.createBufferSource(), cf = ctx.createBiquadFilter(), cg = ctx.createGain();
    crackle.buffer = crackleBuffer(ctx); crackle.loop = true;
    cf.type = 'highpass'; cf.frequency.value = 900;
    cg.gain.setValueAtTime(0, t0); cg.gain.linearRampToValueAtTime(NOISE[rec.grade] || .55, t0 + .08);   // a worn copy is a noisier copy
    crackle.connect(cf); cf.connect(cg); cg.connect(chain.out); crackle.start(t0);

    var s = { rec: rec, chain: chain, crackle: crackle, step: 0, loopStart: t0 + .5, stepDur: stepDur };
    session = s;
    visualQueue.length = 0;
    function pump() {
      if (session !== s) return;
      for (;;) {
        var t = s.loopStart + stepTime(rec, s.step, stepDur);
        if (t > ctx.currentTime + .14) break;
        scheduleStep(rec, voices, s.step, t, stepDur);
        visualQueue.push({ step: s.step, t: t });
        if (++s.step === 32) { s.step = 0; s.loopStart += 32 * stepDur; }
      }
    }
    pump();
    timer = setInterval(pump, 25);
  }

  function stopAudio() {
    if (timer) { clearInterval(timer); timer = null; }
    if (!session) return;
    var s = session, now = ctx.currentTime;
    session = null;
    s.chain.out.gain.cancelScheduledValues(now);
    s.chain.out.gain.setValueAtTime(s.chain.out.gain.value, now);
    s.chain.out.gain.linearRampToValueAtTime(0, now + .06);   // the needle leaving the groove
    setTimeout(function () {
      try { s.crackle.stop(); s.chain.lfo.stop(); } catch (e) { /* already stopped */ }
      s.chain.out.disconnect();
    }, 200);
    visualQueue.length = 0;
  }

  /* ---------- the drawing ---------- */
  function svgEl(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  var deck = document.getElementById('deck');
  if (!deck) return;
  var recG = document.getElementById('rec'), spinG = document.getElementById('spin'), strobeG = document.getElementById('strobe');
  var labelG = document.getElementById('label'), groovesG = document.getElementById('grooves');
  var playBtn = document.getElementById('play'), playText = document.getElementById('play-text');
  var nowEl = document.getElementById('now'), factsEl = document.getElementById('facts');
  var stepsEl = document.getElementById('steps'), stepsGrid = document.getElementById('steps-grid'), stepsCap = document.getElementById('steps-cap');
  var sleeves = Array.prototype.slice.call(document.querySelectorAll('.sleeve'));

  // strobe dots on the platter rim
  (function () {
    var d = '';
    for (var i = 0; i < 72; i++) {
      var a = i / 72 * Math.PI * 2, x = 250 + Math.cos(a) * 180, y = 228 + Math.sin(a) * 180;
      d += 'M' + (x - 3).toFixed(1) + ' ' + y.toFixed(1) + 'a3 3 0 1 0 6 0a3 3 0 1 0 -6 0';
    }
    svgEl('path', { d: d, fill: INK }, strobeG);
  })();
  // grooves, with the gaps between three songs
  [160, 154, 147, 141, 133, 127, 120, 112, 106, 99, 93, 86, 79].forEach(function (r, i) {
    svgEl('circle', { cx: 250, cy: 228, r: r, 'stroke-width': i % 4 === 3 ? 2.2 : .8, 'stroke-opacity': i % 4 === 3 ? .34 : .2 }, groovesG);
  });

  // centre labels, one per record, drawn around 0,0 at radius 60
  var LABELS = [
    function (g) {
      svgEl('circle', { r: 60, fill: HOT }, g);
      svgEl('path', { d: 'M-60 0 A60 60 0 0 0 60 0Z', fill: 'url(#ht-ink)' }, g);
      svgEl('rect', { x: -5, y: -46, width: 10, height: 34, rx: 5, fill: INK }, g);
    },
    function (g) {
      svgEl('circle', { r: 60, fill: PAPER }, g);
      svgEl('circle', { r: 60, fill: 'url(#ht-ink-light)' }, g);
      svgEl('path', { d: 'M8 -50 L-16 0 L0 0 L-12 42 L24 -10 L6 -10 L20 -50Z', fill: HOT }, g);
    },
    function (g) {
      svgEl('circle', { r: 60, fill: HOT }, g);
      for (var i = 0; i < 6; i++) svgEl('path', { d: 'M0 0 L-9 -60 L9 -60Z', fill: INK, transform: 'rotate(' + i * 60 + ')' }, g);
      svgEl('circle', { r: 24, fill: PAPER }, g);
    },
    function (g) {
      svgEl('circle', { r: 60, fill: PAPER }, g);
      svgEl('path', { d: 'M-60 0 A60 60 0 0 0 60 0Z', fill: INK }, g);
      svgEl('path', { d: 'M10 -48 a26 26 0 1 0 14 46 a21 21 0 1 1 -14 -46z', fill: HOT }, g);
    }
  ];
  // Each label is the sleeve art shrunk into the middle, inside a paper rim that carries
  // the title and catalog number set on a circle, the way pressing plants print them.
  function drawLabel(i) {
    while (labelG.firstChild) labelG.removeChild(labelG.firstChild);
    var rec = RECORDS[i];
    svgEl('circle', { r: 60, fill: PAPER }, labelG);
    LABELS[i](svgEl('g', { transform: 'scale(.7)' }, labelG));
    svgEl('circle', { r: 42, fill: 'none', stroke: INK, 'stroke-width': 1.5 }, labelG);
    svgEl('path', { id: 'rim-top', d: 'M-48.5 0 A48.5 48.5 0 0 1 48.5 0', fill: 'none' }, labelG);
    svgEl('path', { id: 'rim-bottom', d: 'M-54 0 A54 54 0 0 0 54 0', fill: 'none' }, labelG);
    [['rim-top', rec.title.toLowerCase()], ['rim-bottom', rec.cat + '  side one']].forEach(function (pair) {
      var t = svgEl('text', { 'class': 'label-t', 'text-anchor': 'middle' }, labelG);
      var tp = svgEl('textPath', { href: '#' + pair[0], startOffset: '50%' }, t);
      tp.textContent = pair[1];
    });
  }

  // the step grid: what the scheduler is about to play, drawn as halftone dots
  var ROWS = ['Kick', 'Snare', 'Hat', 'Bass', 'Lead'], cells = [], shownBar = -1;
  function buildGrid() {
    ROWS.forEach(function (name) {
      var n = document.createElement('span'); n.className = 'row-name'; n.textContent = name; stepsGrid.appendChild(n);
      var row = [];
      for (var c = 0; c < 16; c++) { var cell = document.createElement('span'); cell.className = 'cell'; cell.appendChild(document.createElement('i')); stepsGrid.appendChild(cell); row.push(cell); }
      cells.push(row);
    });
  }
  function fillGrid(rec, bar) {
    shownBar = bar;
    for (var c = 0; c < 16; c++) {
      var s = bar * 16 + c;
      var marks = [rec.kick[s], rec.snare[s], rec.hat[s], rec.bassSteps[s] ? 'x' : '.', rec.leadSteps[s] ? 'x' : '.'];
      for (var r = 0; r < 5; r++) {
        cells[r][c].classList.toggle('on', marks[r] === 'x' || marks[r] === 'O');
        cells[r][c].classList.toggle('soft', marks[r] === 'o');
      }
    }
  }
  function showStep(col) {
    for (var r = 0; r < 5; r++) for (var c = 0; c < 16; c++) cells[r][c].classList.toggle('now', c === col);
  }
  buildGrid();

  /* ---------- state ---------- */
  var current = -1, state = 'empty', ticket = 0;
  var ARM_REST = 0, ARM_CUE = 39.2, ARM_END = 47; // degrees: parked, stylus on the first groove, and as far in as it tracks
  var armNow = 0, armTick = 0;
  var angle = 0, speed = 0, lastFrame = 0, raf = 0;
  var RPM = 200;                             // degrees per second at 33 1/3

  function setState(s) { state = s; deck.dataset.state = s; }
  function setArm(deg, down) {
    armNow = deg; armTick = 0;
    deck.style.setProperty('--arm', deg + 'deg');
    if (down) deck.dataset.arm = 'down'; else delete deck.dataset.arm;
  }
  function wait(ms, fn) { var mine = ticket; setTimeout(function () { if (mine === ticket) fn(); }, reduced.matches ? 0 : ms); }

  function frame(now) {
    var dt = Math.min(.05, (now - lastFrame) / 1000); lastFrame = now;
    var target = (state === 'starting' || state === 'playing') && !reduced.matches ? RPM : 0;
    speed += (target - speed) * Math.min(1, dt * (target ? 3.2 : 2.2));   // the platter has weight: it takes a moment either way
    if (Math.abs(target - speed) < .5) speed = target;
    angle = (angle + speed * dt) % 360;
    var tf = 'rotate(' + angle.toFixed(2) + 'deg)';
    spinG.style.transform = tf; strobeG.style.transform = tf;
    // the arm tracks inward as the side plays, a little at a time
    if (state === 'playing' && !reduced.matches && armNow < ARM_END && (armTick += dt) > .5) {
      armNow = Math.min(ARM_END, armNow + armTick * .11); armTick = 0;
      deck.style.setProperty('--arm', armNow.toFixed(2) + 'deg');
    }
    // light the step that is sounding right now
    if (ctx && session) {
      var hit = null;
      while (visualQueue.length && visualQueue[0].t <= ctx.currentTime) hit = visualQueue.shift();
      if (hit) {
        var bar = hit.step >> 4;
        if (bar !== shownBar) fillGrid(session.rec, bar);
        showStep(hit.step & 15);
      }
    }
    raf = (speed > 0 || target > 0 || session) ? requestAnimationFrame(frame) : 0;
  }
  function kick() { if (!raf) { lastFrame = performance.now(); raf = requestAnimationFrame(frame); } }

  function describe(rec) {
    nowEl.innerHTML = '';
    var b = document.createElement('b'); b.textContent = rec.title;
    nowEl.appendChild(b);
    nowEl.appendChild(document.createTextNode(' by ' + rec.artist + (state === 'playing' || state === 'starting' ? ' is playing.' : ' is on the platter. Press play to hear it.')));
  }
  function showFacts(rec) {
    document.getElementById('f-cat').textContent = rec.cat;
    document.getElementById('f-label').textContent = rec.label;
    document.getElementById('f-grade').textContent = rec.grade;
    document.getElementById('f-price').textContent = rec.price;
    factsEl.hidden = false; stepsEl.hidden = false;
    stepsCap.textContent = rec.bpm + ' beats a minute, ' + rec.feel + '. One bar, sixteen steps:';
    fillGrid(rec, 0); showStep(-1);
  }
  function setPlayButton(on) {
    playBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    playText.textContent = on ? 'Pause' : 'Play';
  }

  function dropRecord(i, then) {
    var had = current >= 0, mine = ++ticket;
    current = i;
    sleeves.forEach(function (b, n) { b.setAttribute('aria-pressed', n === i ? 'true' : 'false'); });
    function land() {
      if (mine !== ticket) return;
      drawLabel(i);
      recG.setAttribute('opacity', 1);
      setState('loaded');
      describe(RECORDS[i]); showFacts(RECORDS[i]);
      if (!reduced.matches && recG.animate) {
        recG.animate([
          { transform: 'translate(-40px, -150px) scale(1.12)', opacity: 0 },
          { transform: 'translate(0, 6px) scale(1.01)', opacity: 1, offset: .72 },
          { transform: 'translate(0, -3px) scale(1)', offset: .86 },
          { transform: 'translate(0, 0) scale(1)' }
        ], { duration: 520, easing: 'cubic-bezier(.3, 0, .4, 1)' });
      }
      wait(540, function () { if (then) then(); });
    }
    if (had && !reduced.matches && recG.animate) {
      recG.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(40px, -120px) scale(1.08)', opacity: 0 }], { duration: 230, easing: 'ease-in', fill: 'forwards' })
        .onfinish = function () { this.cancel(); recG.setAttribute('opacity', 0); land(); };
    } else land();
  }

  function play() {
    if (current < 0) { dropRecord(0, play); return; }
    if (state === 'starting' || state === 'playing') return;
    ensureContext();                       // made inside the click, so the browser allows sound
    if (ctx.state === 'suspended') ctx.resume();
    ticket++;
    setState('starting'); setPlayButton(true); describe(RECORDS[current]);
    setArm(ARM_CUE, true); kick();
    wait(980, function () {                // the arm has landed
      setState('playing');
      startAudio(RECORDS[current]);
      kick();
    });
  }
  function pause() {
    ticket++;
    stopAudio();
    setArm(ARM_REST, false);
    if (current >= 0) { setState('loaded'); describe(RECORDS[current]); showStep(-1); fillGrid(RECORDS[current], 0); }
    setPlayButton(false);
  }

  sleeves.forEach(function (btn, i) {
    btn.addEventListener('click', function () {
      if (i === current) return;
      var wasPlaying = state === 'playing' || state === 'starting';
      if (wasPlaying) { stopAudio(); setArm(ARM_REST, false); setState('loaded'); }
      dropRecord(i, wasPlaying ? function () { setPlayButton(false); play(); } : null);
    });
  });
  playBtn.addEventListener('click', function () { if (state === 'playing' || state === 'starting') pause(); else play(); });
  document.getElementById('vol').addEventListener('input', function () {
    volume = this.value / 100;
    if (master) master.gain.setTargetAtTime(volume * volume, ctx.currentTime, .02);
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && (state === 'playing' || state === 'starting')) pause(); });

  /* A way to check the grooves without speakers: render two bars offline and report the levels.
     Used while building the site; see the guide. */
  window.ocotilloCheck = function (i) {
    var rec = RECORDS[i], stepDur = 60 / rec.bpm / 4, len = 32 * stepDur + 1;
    var off = new OfflineAudioContext(1, Math.ceil(44100 * len), 44100);
    var chain = recordChain(off, off.destination, rec), voices = Voices(off, chain.bus);
    for (var s = 0; s < 32; s++) scheduleStep(rec, voices, s, .05 + stepTime(rec, s, stepDur), stepDur);
    return off.startRendering().then(function (buf) {
      var d = buf.getChannelData(0), peak = 0, sum = 0;
      for (var k = 0; k < d.length; k++) { var a = Math.abs(d[k]); if (a > peak) peak = a; sum += a * a; }
      return { title: rec.title, seconds: +len.toFixed(2), peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(3) };
    });
  };
})();
