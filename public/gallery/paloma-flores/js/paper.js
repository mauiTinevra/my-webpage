/* Paloma Flores: the cut-paper drawing kit.
   Every flower is a handful of straight-edged polygons, cut with a seeded random
   number generator so each stem is a little different but never changes between renders. */
(function () {
  'use strict';

  var INK = {
    stem: '#5d8a63', stemDark: '#4a7553', leaf: '#3c6e4a', sage: '#7fa377', sageLight: '#9dbb90',
    poppy: '#e8452c', poppyDark: '#cb3920', seed: '#1f4230',
    coral1: '#ee8672', coral2: '#f3a48f', coral3: '#f8c3b0', coral4: '#fcdfcf',
    blue: '#5b7fd6', blueLight: '#8ea6e8', blueDark: '#34509f',
    gold1: '#ea7d3c', gold2: '#f0993f', gold3: '#f4b748',
    butterDeep: '#e9cf7c', paper: '#fffaf0', shade: '#16301f'
  };

  var TYPES = {
    snapdragon: { name: 'Snapdragon', plural: 'snapdragons', price: 6, len: 258, over: 0, note: 'The tall one. Gives a bunch its height.' },
    eucalyptus: { name: 'Eucalyptus', plural: 'eucalyptus', price: 2, len: 196, over: 62, note: 'Silver dollar. Smells like a clean kitchen.' },
    poppy: { name: 'Poppy', plural: 'poppies', price: 4, len: 222, over: 0, note: 'Papery petals that open wide by noon.' },
    cornflower: { name: 'Cornflower', plural: 'cornflowers', price: 3, len: 200, over: 0, note: 'Field blue. Good at filling the gaps.' },
    marigold: { name: 'Marigold', plural: 'marigolds', price: 3, len: 180, over: 0, note: 'Grown in Laveen. Bright and sturdy.' },
    ranunculus: { name: 'Ranunculus', plural: 'ranunculus', price: 5, len: 164, over: 0, note: 'Tight coral layers. Lasts a week.' }
  };
  var ORDER = ['poppy', 'ranunculus', 'cornflower', 'eucalyptus', 'marigold', 'snapdragon'];

  function rng(seed) {
    var a = (seed * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(id, salt) { return rng(id * 31 + (salt || 0) * 977 + 5)(); }

  function f(n) { return Math.round(n * 10) / 10; }
  function d(pts) {
    return 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + 'Z';
  }
  function piece(pts, fill, shadow) {
    var path = d(pts);
    var s = shadow === false ? '' : '<path d="' + path + '" fill="' + INK.shade + '" opacity=".2" transform="translate(1.1 1.7)"/>';
    return s + '<path d="' + path + '" fill="' + fill + '"/>';
  }

  /* A scissor-cut round: n straight facets, each corner nudged in or out. */
  function blob(r, cx, cy, rad, n, jit, squash) {
    var pts = [], off = r() * 6.28;
    for (var i = 0; i < n; i++) {
      var a = off + (i / n) * 6.283 + (r() - 0.5) * (3.6 / n);
      var k = rad * (1 + (r() - 0.5) * 2 * (jit == null ? 0.1 : jit));
      pts.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k * (squash || 1)]);
    }
    return pts;
  }
  /* A zigzag rosette, for marigolds. */
  function star(r, cx, cy, outer, inner, n) {
    var pts = [], off = r() * 6.28;
    for (var i = 0; i < n * 2; i++) {
      var a = off + (i / (n * 2)) * 6.283;
      var k = (i % 2 ? inner : outer) * (0.93 + r() * 0.14);
      pts.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k]);
    }
    return pts;
  }
  function place(local, cx, cy, ang) {
    var c = Math.cos(ang), s = Math.sin(ang);
    return local.map(function (p) { return [cx + p[0] * c - p[1] * s, cy + p[0] * s + p[1] * c]; });
  }
  /* A petal or leaf: narrow at the base, wide and faceted at the tip. Points along +y. */
  function petal(r, cx, cy, ang, len, w) {
    var j = function () { return (r() - 0.5) * len * 0.07; };
    var local = [
      [-w * 0.14, len * 0.04], [-w * 0.47 + j(), len * 0.5], [-w * 0.44 + j(), len * 0.8 + j()],
      [-w * 0.16, len + j()], [w * 0.2, len * 0.97 + j()], [w * 0.46 + j(), len * 0.78 + j()],
      [w * 0.5 + j(), len * 0.48], [w * 0.14, len * 0.04]
    ];
    return place(local, cx, cy, ang);
  }
  /* A cornflower ray with a notched tip. */
  function ray(r, ang, len, w) {
    var l = len * (0.9 + r() * 0.2);
    var local = [[-1.5, 2.5], [-w / 2, l * 0.78], [-w * 0.3, l], [-w * 0.1, l * 0.82], [w * 0.08, l * 0.98],
      [w * 0.27, l * 0.83], [w / 2, l * 0.92], [1.5, 2.5]];
    return place(local, 0, 0, ang);
  }

  var HEAD = {
    poppy: function (r) {
      var out = '', turn = r() * 6.28, i;
      for (i = 0; i < 3; i++) out += piece(petal(r, 0, 0, turn + i * 2.094 + (r() - 0.5) * 0.3, 27 + r() * 3, 33), INK.poppyDark);
      for (i = 0; i < 3; i++) out += piece(petal(r, 0, 0, turn + 1.047 + i * 2.094 + (r() - 0.5) * 0.3, 24 + r() * 3, 30), INK.poppy);
      out += piece(blob(r, 0, 0, 6.6, 8, 0.1), INK.seed);
      out += piece(blob(r, 0.3, -0.2, 2.4, 6, 0.12), INK.butterDeep, false);
      return out;
    },
    ranunculus: function (r) {
      var layers = [[25, 11, INK.coral1], [19.5, 10, INK.coral2], [14, 9, INK.coral3], [8.8, 8, INK.coral4]];
      var out = '';
      layers.forEach(function (l, i) {
        out += piece(blob(r, (r() - 0.5) * 2.4 * i, (r() - 0.5) * 2.4 * i, l[0], l[1], 0.07), l[2]);
      });
      out += piece(blob(r, 0.5, 0.4, 4.2, 7, 0.1), INK.butterDeep, false);
      out += piece(blob(r, 0.5, 0.4, 1.9, 5, 0.1), INK.leaf, false);
      return out;
    },
    cornflower: function (r) {
      var out = piece(blob(r, 0, 9, 7.5, 7, 0.08, 1.15), INK.leaf), turn = r() * 6.28, i;
      for (i = 0; i < 9; i++) out += piece(ray(r, turn + i * 0.698 + (r() - 0.5) * 0.2, 25, 12), INK.blue, i % 3 === 0);
      for (i = 0; i < 7; i++) out += piece(ray(r, turn + 0.3 + i * 0.898, 14, 8.5), INK.blueLight, false);
      out += piece(blob(r, 0, 0, 4.6, 7, 0.1), INK.blueDark, false);
      return out;
    },
    marigold: function (r) {
      var out = piece(blob(r, 0, 12, 9, 7, 0.08, 1.1), INK.leaf);
      out += piece(star(r, 0, 0, 25, 19.5, 15), INK.gold1);
      out += piece(star(r, 0.4, -0.4, 18, 13.5, 12), INK.gold2);
      out += piece(star(r, -0.3, 0.3, 11.5, 8, 9), INK.gold3);
      out += piece(blob(r, 0, 0, 3.8, 6, 0.1), INK.butterDeep, false);
      return out;
    },
    snapdragon: function (r) {
      /* A spire: green buds at the tip, open florets below. Drawn tip first so lower florets overlap. */
      var out = '', n = 9;
      for (var i = 0; i < n; i++) {
        var t = i / (n - 1);               // 0 at the tip, 1 at the lowest floret
        var y = -44 + t * 92, side = i % 2 ? 1 : -1;
        if (i < 3) {
          out += piece(blob(r, side * (2 + t * 5), y, 3.6 + t * 4, 6, 0.1, 1.25), INK.sage, i > 0);
        } else {
          var rad = 7 + t * 5.5, x = side * (4.5 + t * 6);
          out += piece(blob(r, x, y, rad, 8, 0.1, 0.9), INK.paper);
          out += piece(blob(r, x - side * rad * 0.3, y + rad * 0.22, rad * 0.42, 6, 0.12), INK.gold3, false);
        }
      }
      return out;
    },
    eucalyptus: function (r) {
      var out = '', n = 9;
      for (var i = n - 1; i >= 0; i--) {
        var t = i / (n - 1);               // 0 at the tip
        var y = -58 + t * 108, rad = 5 + t * 9.5, side = i % 2 ? 1 : -1;
        out += piece(blob(r, side * rad * 0.82, y, rad, 8, 0.09, 0.86), i % 3 === 0 ? INK.sageLight : INK.sage);
        if (i > 2 && i % 2 === 0) out += piece(blob(r, -side * rad * 0.7, y + 5, rad * 0.78, 7, 0.09, 0.86), INK.sageLight);
      }
      return out;
    }
  };

  /* The stalk is a thin strip of paper with a slight bow, not a stroked line. */
  function stalk(r, len, over, colour) {
    var bow = (r() - 0.5) * 16, L = [], R = [], steps = 7, top = -(len + over);
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, y = 14 + (top - 14) * t;
      var x = bow * 4 * t * (1 - t) * (len / (len + over));
      var w = 2.1 - t * 0.8;
      L.push([x - w, y]); R.unshift([x + w, y]);
    }
    return { svg: '<path d="' + d(L.concat(R)) + '" fill="' + colour + '"/>', bow: bow };
  }

  /* One whole stem, drawn upright with its foot at 0,0 and its head at 0,-len. */
  function stem(type, seed) {
    var T = TYPES[type], r = rng(seed * 13 + ORDER.indexOf(type) + 1);
    var s = stalk(r, T.len, T.over, type === 'eucalyptus' ? INK.stemDark : INK.stem);
    var out = s.svg;
    if (type === 'poppy' || type === 'marigold' || type === 'ranunculus' || type === 'cornflower') {
      var side = r() > 0.5 ? 1 : -1, t = 0.5 + r() * 0.14;
      var lx = s.bow * 4 * t * (1 - t), ly = 14 + (-T.len - 14) * t;
      out += piece(petal(r, lx, ly, Math.PI + side * (0.75 + r() * 0.3), 25 + r() * 6, 11), INK.leaf, false);
    }
    return out + '<g transform="translate(0 ' + (-T.len) + ')">' + HEAD[type](r) + '</g>';
  }

  /* The fan. Tallest stems go to the back row and to the middle of each row;
     shorter ones sit lower, further out and in front. Returns stems in paint order. */
  function arrange(stems) {
    var n = stems.length;
    if (!n) return [];
    var sorted = stems.slice().sort(function (a, b) {
      var ka = TYPES[a.type].len + TYPES[a.type].over * 0.6 + hash(a.id, 1) * 14;
      var kb = TYPES[b.type].len + TYPES[b.type].over * 0.6 + hash(b.id, 1) * 14;
      return kb - ka || a.id - b.id;
    });
    var sizes;
    if (n <= 5) sizes = [n];
    else if (n <= 12) sizes = [Math.floor(n / 2), Math.ceil(n / 2)];
    else { var a = Math.floor(n / 3), c = Math.ceil(n / 3); sizes = [a, n - a - c, c]; }

    var out = [], at = 0;
    sizes.forEach(function (m, row) {
      var half = Math.min(54, 8.5 * (m - 1)) + row * 3.5;
      var step = m > 1 ? (2 * half) / (m - 1) : 0;
      var slots = [];
      for (var j = 0; j < m; j++) slots.push(m > 1 ? -half + step * j : 0);
      // middle slots first, so the tallest of the row stand in the centre
      slots.sort(function (p, q) { return Math.abs(p) - Math.abs(q) || p - q; });
      for (var k = 0; k < m; k++) {
        var s = sorted[at++], ang = slots[k];
        var edge = Math.abs(ang) / Math.max(half, 24);
        out.push({
          id: s.id, type: s.type, row: row,
          angle: ang + (hash(s.id, 2) - 0.5) * 9 + (row % 2 ? step * 0.22 : 0),
          sink: row * 23 + 20 * edge * edge + hash(s.id, 3) * 12
        });
      }
    });
    // paint back row first; within a row paint the outside before the middle
    return out.sort(function (p, q) { return p.row - q.row || Math.abs(q.angle) - Math.abs(p.angle); });
  }

  var PIVOT = { x: 220, y: 364 };
  function seat(p) {
    return 'translate(' + PIVOT.x + 'px,' + PIVOT.y + 'px) rotate(' + f(p.angle) + 'deg) translate(0px,' + f(p.sink) + 'px)';
  }

  var WRAPS = {
    kraft: { name: 'Kraft', front: '#e3c36a', back: '#cfad52' },
    leaf: { name: 'Leaf green', front: '#3f7350', back: '#254c33' },
    poppy: { name: 'Poppy', front: '#e8452c', back: '#c63920' }
  };

  /* The fixed parts of the scene (viewBox 0 0 440 520). */
  function backdrop(seed) {
    var r = rng(seed || 4);
    var arch = [[34, 464]];
    for (var i = 0; i <= 12; i++) {
      var a = Math.PI - (i / 12) * Math.PI, k = i === 0 || i === 12 ? 0 : 7;
      arch.push([220 + Math.cos(a) * 186 + (r() - 0.5) * k, 262 - Math.sin(a) * 226 + (r() - 0.5) * k]);
    }
    arch.push([406, 464]);
    return '<g class="cut">' + '<path d="' + d(arch) + '" fill="#2d5a3d"/></g>' +
      '<g class="cut"><path d="' + d([[0, 458], [150, 453], [300, 457], [440, 452], [438, 496], [2, 499]]) + '" fill="' + INK.butterDeep + '"/></g>';
  }
  function wrapBack(w, n) {
    var k = Math.round((0.7 + Math.min(n || 8, 20) * 0.025) * 100) / 100;
    return '<g class="cut" transform="translate(220 374) scale(' + k + ') translate(-220 -374)"><path d="' + d([[220, 374], [122, 268], [150, 232], [192, 252], [224, 226], [258, 250], [298, 230], [320, 270]]) +
      '" fill="' + WRAPS[w].back + '"/></g>';
  }
  function vase(w, withWrap) {
    var out = '<g class="cut"><path d="' + d([[184, 350], [257, 351], [251, 368], [277, 408], [272, 440], [255, 459], [187, 458], [167, 438], [163, 406], [191, 367]]) +
      '" fill="' + INK.paper + '"/>' +
      '<path d="' + d([[163.4, 411], [276.4, 414], [274.6, 427], [165, 424]]) + '" fill="' + INK.butterDeep + '"/>' +
      '<path d="' + d([[166, 433], [273, 435], [271.6, 441], [167.6, 439.5]]) + '" fill="' + INK.butterDeep + '"/></g>' +
      '<g class="cut"><path d="' + d([[178, 343], [263, 344.5], [261, 355], [180, 353.5]]) + '" fill="#fff"/></g>';
    if (withWrap) {
      out += '<g class="cut wrap-front"><path d="' + d([[181, 351], [144, 298], [213, 330], [297, 293], [260, 352]]) + '" fill="' + WRAPS[w].front + '"/></g>';
    }
    return out;
  }

  var clips = 0;
  /* A finished, still picture of a recipe, for the daily cards and the confirmation. */
  function still(list, wrap, opts) {
    opts = opts || {};
    var stems = list.map(function (t, i) { return { id: (opts.seed || 100) + i, type: t }; });
    var cid = 'rim-' + (++clips);
    var body = arrange(stems).map(function (p) {
      return '<g class="stem"><g style="transform:' + seat(p) + '">' + stem(p.type, p.id) + '</g></g>';
    }).join('');
    return '<svg viewBox="' + (opts.viewBox || '0 0 440 504') + '" role="img" aria-label="' + (opts.label || 'A bouquet in a vase') + '">' +
      (opts.plain ? '' : backdrop(opts.seed)) + (stems.length ? wrapBack(wrap || 'kraft', stems.length) : '') + '<clipPath id="' + cid + '"><rect x="-300" y="-300" width="1040" height="656"/></clipPath><g clip-path="url(#' + cid + ')">' + body + '</g>' + vase(wrap || 'kraft', stems.length > 0) + '</svg>';
  }

  /* One stem on its own, cropped to the flower, for the picker. */
  function single(type, seed) {
    var T = TYPES[type];
    var tall = type === 'snapdragon' || type === 'eucalyptus';
    var top = -(T.len + T.over) - (tall ? 8 : 34), h = 132;
    if (type === 'snapdragon') top = -T.len - 54;
    return '<svg viewBox="-52 ' + top + ' 104 ' + h + '" aria-hidden="true" focusable="false"><g class="stem">' + stem(type, seed) + '</g></svg>';
  }

  window.Paloma = {
    TYPES: TYPES, ORDER: ORDER, WRAPS: WRAPS, INK: INK,
    rng: rng, d: d, blob: blob, petal: petal, piece: piece,
    head: function (type, seed) { return HEAD[type](rng(seed)); },
    stem: stem, arrange: arrange, seat: seat, backdrop: backdrop, wrapBack: wrapBack, vase: vase,
    still: still, single: single, PIVOT: PIVOT
  };
})();
