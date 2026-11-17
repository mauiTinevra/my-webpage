/* Dark Sky Sonora: the astronomy. Low-precision formulas, written out by hand.
   Everything takes a time in milliseconds since 1970 (UTC) and works for one place. */
(function (root) {
  'use strict';
  var RAD = Math.PI / 180;
  var LAT = 33.49, LON = -111.93;      // Scottsdale, Arizona. East longitude is positive.
  var TZ = -7;                         // America/Phoenix: UTC-7 all year, no daylight saving.
  var sin = function (d) { return Math.sin(d * RAD); };
  var cos = function (d) { return Math.cos(d * RAD); };
  var norm = function (d) { return ((d % 360) + 360) % 360; };

  function julian(ms) { return ms / 86400000 + 2440587.5; }
  function days2000(ms) { return julian(ms) - 2451545.0; }

  // Ecliptic longitude and latitude (of date) to right ascension and declination, in degrees.
  function eclToEq(lam, beta, eps) {
    var ra = Math.atan2(sin(lam) * cos(eps) - Math.tan(beta * RAD) * sin(eps), cos(lam)) / RAD;
    var dec = Math.asin(sin(beta) * cos(eps) + cos(beta) * sin(eps) * sin(lam)) / RAD;
    return { ra: norm(ra), dec: dec };
  }

  // Sun: the Astronomical Almanac's low-precision formula, good to about 0.01 degrees.
  function sun(ms) {
    var n = days2000(ms);
    var L = norm(280.460 + 0.9856474 * n);
    var g = norm(357.528 + 0.9856003 * n);
    var lam = norm(L + 1.915 * sin(g) + 0.020 * sin(2 * g));
    var eq = eclToEq(lam, 0, 23.439 - 0.0000004 * n);
    return { ra: eq.ra, dec: eq.dec, lam: lam };
  }

  // Moon: the Almanac's truncated series. Longitude good to about 0.3 degrees.
  function moon(ms) {
    var n = days2000(ms), T = n / 36525;
    var lam = 218.32 + 481267.881 * T
      + 6.29 * sin(135.0 + 477198.87 * T) - 1.27 * sin(259.3 - 413335.36 * T)
      + 0.66 * sin(235.7 + 890534.22 * T) + 0.21 * sin(269.9 + 954397.74 * T)
      - 0.19 * sin(357.5 + 35999.05 * T) - 0.11 * sin(186.5 + 966404.03 * T);
    var beta = 5.13 * sin(93.3 + 483202.02 * T) + 0.28 * sin(228.2 + 960400.89 * T)
      - 0.28 * sin(318.3 + 6003.15 * T) - 0.17 * sin(217.6 - 407332.21 * T);
    var par = 0.9508 + 0.0518 * cos(135.0 + 477198.87 * T) + 0.0095 * cos(259.3 - 413335.36 * T)
      + 0.0078 * cos(235.7 + 890534.22 * T) + 0.0028 * cos(269.9 + 954397.74 * T);
    lam = norm(lam);
    var eq = eclToEq(lam, beta, 23.439 - 0.0000004 * n);
    return { ra: eq.ra, dec: eq.dec, lam: lam, beta: beta, par: par };
  }

  // Phase from the angle between moon and sun.
  function moonPhase(ms) {
    var m = moon(ms), s = sun(ms);
    var diff = norm(m.lam - s.lam);                       // 0 new, 90 first quarter, 180 full
    var elong = Math.acos(cos(m.beta) * cos(diff)) / RAD;
    var lit = (1 - cos(elong)) / 2;
    var name = diff < 12 || diff > 348 ? 'new moon'
      : diff < 80 ? 'waxing crescent' : diff < 100 ? 'first quarter'
      : diff < 168 ? 'waxing gibbous' : diff < 192 ? 'full moon'
      : diff < 260 ? 'waning gibbous' : diff < 280 ? 'last quarter' : 'waning crescent';
    return { lit: lit, waxing: diff < 180, angle: diff, name: name, age: diff / 360 * 29.53 };
  }

  // Planets: JPL's approximate Keplerian elements for 1800 to 2050 (value at J2000, change per century).
  // a (au), e, inclination, mean longitude, longitude of perihelion, longitude of ascending node.
  var ELEMENTS = {
    Venus:   [0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
    Earth:   [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0],
    Mars:    [1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
    Jupiter: [5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
    Saturn:  [9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794]
  };
  function helio(name, T) {
    var k = ELEMENTS[name];
    var a = k[0] + k[1] * T, e = k[2] + k[3] * T, I = k[4] + k[5] * T;
    var L = k[6] + k[7] * T, peri = k[8] + k[9] * T, node = k[10] + k[11] * T;
    var w = peri - node, M = norm(L - peri);
    if (M > 180) M -= 360;
    var E = M + e / RAD * sin(M);
    for (var i = 0; i < 6; i++) E += (M - (E - e / RAD * sin(E))) / (1 - e * cos(E));   // Kepler's equation
    var xp = a * (cos(E) - e), yp = a * Math.sqrt(1 - e * e) * sin(E);
    return [
      (cos(w) * cos(node) - sin(w) * sin(node) * cos(I)) * xp + (-sin(w) * cos(node) - cos(w) * sin(node) * cos(I)) * yp,
      (cos(w) * sin(node) + sin(w) * cos(node) * cos(I)) * xp + (-sin(w) * sin(node) + cos(w) * cos(node) * cos(I)) * yp,
      sin(w) * sin(I) * xp + cos(w) * sin(I) * yp
    ];
  }
  // Geocentric right ascension and declination of a planet, in J2000 coordinates.
  function planet(name, ms) {
    var T = days2000(ms) / 36525, p = helio(name, T), e = helio('Earth', T);
    var x = p[0] - e[0], y = p[1] - e[1], z = p[2] - e[2], eps = 23.43928;
    var yq = y * cos(eps) - z * sin(eps), zq = y * sin(eps) + z * cos(eps);
    return { ra: norm(Math.atan2(yq, x) / RAD), dec: Math.atan2(zq, Math.sqrt(x * x + yq * yq)) / RAD,
             dist: Math.sqrt(x * x + y * y + z * z) };
  }

  // Move J2000 catalogue coordinates forward to the given date (simple annual precession).
  function precess(ra, dec, ms) {
    var years = days2000(ms) / 365.25;
    var m = 3.07496 / 240, nn = 20.0431 / 3600;           // degrees per year
    return { ra: norm(ra + (m + nn * sin(ra) * Math.tan(dec * RAD)) * years), dec: dec + nn * cos(ra) * years };
  }

  // Greenwich and local sidereal time, in degrees.
  function gmst(ms) {
    var d = days2000(ms), T = d / 36525;
    return norm(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T);
  }
  function lst(ms) { return norm(gmst(ms) + LON); }

  // Equatorial to horizon coordinates. Azimuth runs from north through east.
  function altAz(ra, dec, ms) {
    var H = lst(ms) - ra;
    var sinAlt = sin(LAT) * sin(dec) + cos(LAT) * cos(dec) * cos(H);
    var alt = Math.asin(sinAlt) / RAD;
    var az = Math.atan2(-cos(dec) * sin(H), sin(dec) * cos(LAT) - cos(dec) * sin(LAT) * cos(H)) / RAD;
    return { alt: alt, az: norm(az) };
  }
  function sunAlt(ms) { var s = sun(ms); return altAz(s.ra, s.dec, ms).alt; }
  // The moon is close enough that where you stand matters: subtract its parallax.
  function moonAltAz(ms) {
    var m = moon(ms), h = altAz(m.ra, m.dec, ms);
    h.alt -= m.par * cos(h.alt);
    return h;
  }

  // One night, from local noon to the next local noon. Steps of two minutes, crossings interpolated.
  var HORIZON = -0.833;   // refraction plus half a disc: when the top edge touches the horizon
  function night(y, mo, d) {
    var start = Date.UTC(y, mo - 1, d, 12 - TZ), STEP = 120000, N = 720;
    var out = { date: [y, mo, d], noon: start, sunset: null, dusk: null, dawn: null, sunrise: null, moonEvents: [] };
    var ps = sunAlt(start), pm = moonAltAz(start).alt;
    var moonUpAtDusk = false;
    for (var i = 1; i <= N; i++) {
      var t = start + i * STEP, s = sunAlt(t), m = moonAltAz(t).alt;
      var cross = function (a, b, level) { return t - STEP + STEP * (level - a) / (b - a); };
      if (ps > HORIZON && s <= HORIZON && !out.sunset) out.sunset = cross(ps, s, HORIZON);
      if (ps > -18 && s <= -18 && !out.dusk) { out.dusk = cross(ps, s, -18); moonUpAtDusk = m > HORIZON; }
      if (ps < -18 && s >= -18 && out.dusk) out.dawn = cross(ps, s, -18);
      if (ps < HORIZON && s >= HORIZON && out.sunset) out.sunrise = cross(ps, s, HORIZON);
      if (pm < HORIZON && m >= HORIZON) out.moonEvents.push({ t: cross(pm, m, HORIZON), type: 'rise' });
      if (pm > HORIZON && m <= HORIZON) out.moonEvents.push({ t: cross(pm, m, HORIZON), type: 'set' });
      ps = s; pm = m;
    }
    // Dark means: sun more than 18 degrees down and the moon below the horizon.
    var up = moonUpAtDusk, from = out.dusk, dark = [], inNight = [];
    out.moonEvents.forEach(function (e) {
      if (e.t <= out.dusk || e.t >= out.dawn) return;
      inNight.push(e);
      if (!up) dark.push([from, e.t]);
      up = e.type === 'rise'; from = e.t;
    });
    if (!up) dark.push([from, out.dawn]);
    out.moonUpAtDusk = moonUpAtDusk;
    out.moonInNight = inNight;
    out.dark = dark;
    out.darkMinutes = dark.reduce(function (a, w) { return a + (w[1] - w[0]) / 60000; }, 0);
    out.phase = moonPhase(out.dusk);
    return out;
  }

  var api = { LAT: LAT, LON: LON, TZ: TZ, julian: julian, sun: sun, moon: moon, moonPhase: moonPhase,
    planet: planet, precess: precess, gmst: gmst, lst: lst, altAz: altAz, sunAlt: sunAlt,
    moonAltAz: moonAltAz, night: night, planetNames: ['Venus', 'Mars', 'Jupiter', 'Saturn'] };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Astro = api;
})(typeof window !== 'undefined' ? window : globalThis);
