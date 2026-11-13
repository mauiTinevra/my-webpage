// What the sky looks like at a given time of day, wherever Maui is (see `here` in site.ts).

export interface Place {
  latitude: number;
  /** Degrees east; west is negative. */
  longitude: number;
  timeZone: string;
}

export interface Now {
  /** Hours since midnight at the place, e.g. 19.5 for 7:30 PM. */
  hour: number;
  /** Day of the year, 1 to 366. */
  day: number;
  /** The place's offset from UTC in hours, e.g. -7. */
  offset: number;
}

export function nowAt(place: Place, date = new Date()): Now {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: place.timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  const day = Math.round((Date.UTC(get('year'), get('month') - 1, get('day')) - Date.UTC(get('year'), 0, 0)) / 864e5);
  const offset = Math.round((wall - Math.floor(date.getTime() / 1000) * 1000) / 36e5 * 4) / 4;
  return { hour: get('hour') + get('minute') / 60 + get('second') / 3600, day, offset };
}

export function formatHour(hour: number): { time: string; half: 'AM' | 'PM' } {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour % 1) * 60);
  return { time: `${h % 12 || 12}:${String(m).padStart(2, '0')}`, half: h < 12 ? 'AM' : 'PM' };
}

/** Sunrise and sunset in local clock hours, from the day of the year. Good to within a few minutes. */
export function sunTimes(day: number, place: Place, offset: number) {
  const rad = Math.PI / 180;
  // The sun runs a little fast or slow of the clock through the year.
  const b = (2 * Math.PI * (day - 81)) / 365;
  const drift = (9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b)) / 60;
  const noon = 12 - place.longitude / 15 + offset - drift;
  const tilt = -23.44 * Math.cos((2 * Math.PI * (day + 10)) / 365) * rad;
  const halfDay = (Math.acos(Math.max(-1, Math.min(1, -Math.tan(place.latitude * rad) * Math.tan(tilt)))) * 12) / Math.PI;
  return { rise: noon - halfDay, set: noon + halfDay, noon };
}

/** The next sunrise or sunset, and how many hours away it is. */
export function nextSun(hour: number, day: number, place: Place, offset: number) {
  const today = sunTimes(day, place, offset);
  if (hour < today.rise) return { event: 'Sunrise' as const, in: today.rise - hour };
  if (hour < today.set) return { event: 'Sunset' as const, in: today.set - hour };
  return { event: 'Sunrise' as const, in: sunTimes(day + 1, place, offset).rise + 24 - hour };
}

type Palette = {
  sky: [string, string, string, string];
  far: string;
  mid: string;
  near: string;
  bandA: string;
  bandB: string;
  sun: string;
};

const NIGHT: Palette = {
  sky: ['#080620', '#110b33', '#1b1147', '#2a1658'],
  far: '#2c1a5c',
  mid: '#172078',
  near: '#090d22',
  bandA: '#3a2a7a',
  bandB: '#4a2470',
  sun: '#ff8a4a',
};
// The sun on the horizon: the colours the picture was first painted in.
const TWILIGHT: Palette = {
  sky: ['#1b1147', '#5a2484', '#f0508f', '#ffb37a'],
  far: '#7b2d8e',
  mid: '#1f3fcf',
  near: '#121a3a',
  bandA: '#f6b7cf',
  bandB: '#f0508f',
  sun: '#ff9a4a',
};
const GOLDEN: Palette = {
  sky: ['#3a6fd8', '#8fb8f0', '#f9c6c9', '#ffdcae'],
  far: '#b0689e',
  mid: '#7a4fc0',
  near: '#4a2a4e',
  bandA: '#ffe3ea',
  bandB: '#ffc0a0',
  sun: '#f8c23a',
};
const DAY: Palette = {
  sky: ['#1876dc', '#1e9fea', '#7fc4f0', '#d6edfb'],
  far: '#e0a07c',
  mid: '#c4552f',
  near: '#7a2c1b',
  bandA: '#ffffff',
  bandB: '#e4f2fc',
  sun: '#f2cb3a',
};

const mix = (a: string, b: string, k: number) => {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * k).toString(16).padStart(2, '0')).join('')}`;
};
const mixPalette = (a: Palette, b: Palette, k: number): Palette => ({
  sky: a.sky.map((c, i) => mix(c, b.sky[i], k)) as Palette['sky'],
  far: mix(a.far, b.far, k),
  mid: mix(a.mid, b.mid, k),
  near: mix(a.near, b.near, k),
  bandA: mix(a.bandA, b.bandA, k),
  bandB: mix(a.bandB, b.bandB, k),
  sun: mix(a.sun, b.sun, k),
});
const ease = (k: number) => k * k * (3 - 2 * k);

export interface Sky extends Palette {
  phase: 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk';
  stars: number;
  /** Where the sun and the moon are across the sky, 0 at one horizon to 1 at the other; null when down. */
  sunAt: number | null;
  moonAt: number | null;
}

export function skyAt(hour: number, day: number, place: Place, offset: number): Sky {
  const { rise, set, noon } = sunTimes(day, place, offset);
  // Hours of daylight either side: positive while the sun is up, negative while it is down.
  const up = hour >= rise && hour <= set;
  const fromHorizon = up ? Math.min(hour - rise, set - hour) : -Math.min((hour - set + 24) % 24, (rise - hour + 24) % 24);

  let palette: Palette;
  if (fromHorizon <= -1.3) palette = NIGHT;
  else if (fromHorizon <= 0) palette = mixPalette(NIGHT, TWILIGHT, ease((fromHorizon + 1.3) / 1.3));
  else if (fromHorizon <= 0.9) palette = mixPalette(TWILIGHT, GOLDEN, ease(fromHorizon / 0.9));
  else if (fromHorizon <= 2.4) palette = mixPalette(GOLDEN, DAY, ease((fromHorizon - 0.9) / 1.5));
  else palette = DAY;

  const morning = hour < noon;
  const phase: Sky['phase'] =
    fromHorizon <= -1.3
      ? 'night'
      : fromHorizon <= 0.9
        ? morning
          ? 'dawn'
          : 'dusk'
        : Math.abs(hour - noon) < 1.5
          ? 'midday'
          : morning
            ? 'morning'
            : 'afternoon';

  const night = 24 - (set - rise);
  return {
    ...palette,
    phase,
    stars: Math.min(1, Math.max(0, -fromHorizon / 0.9)),
    // Let each disc dip a little past the horizon so it sinks behind the mesas.
    sunAt: hour > rise - 0.4 && hour < set + 0.4 ? (hour - rise) / (set - rise) : null,
    moonAt: !up ? (((hour - set + 24) % 24) / night) : null,
  };
}
