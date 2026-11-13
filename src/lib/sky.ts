// What the sky over Scottsdale, Arizona looks like at a given time of day.
// Arizona keeps Mountain Standard Time all year, so the clock never shifts.

const LATITUDE = 33.49;
// Scottsdale sits west of its time zone's meridian, so the sun is highest about 12:27.
const SOLAR_NOON = 12.45;

export interface Now {
  /** Hours since midnight in Scottsdale, e.g. 19.5 for 7:30 PM. */
  hour: number;
  /** Day of the year, 1 to 366. */
  day: number;
  /** The clock time as people there would read it. */
  clock: string;
}

export function scottsdaleNow(date = new Date()): Now {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Phoenix',
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const day = Math.round((Date.UTC(get('year'), get('month') - 1, get('day')) - Date.UTC(get('year'), 0, 0)) / 864e5);
  const clock = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Phoenix', hour: 'numeric', minute: '2-digit' }).format(date);
  return { hour: get('hour') + get('minute') / 60, day, clock };
}

export function formatHour(hour: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour % 1) * 60);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Sunrise and sunset in hours, from the day of the year. Good to within a few minutes. */
export function sunTimes(day: number) {
  const tilt = (-23.44 * Math.cos((2 * Math.PI * (day + 10)) / 365) * Math.PI) / 180;
  const halfDay = (Math.acos(-Math.tan((LATITUDE * Math.PI) / 180) * Math.tan(tilt)) * 12) / Math.PI;
  return { rise: SOLAR_NOON - halfDay, set: SOLAR_NOON + halfDay };
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

export function skyAt(hour: number, day: number): Sky {
  const { rise, set } = sunTimes(day);
  // Hours of daylight either side: positive while the sun is up, negative while it is down.
  const up = hour >= rise && hour <= set;
  const fromHorizon = up ? Math.min(hour - rise, set - hour) : -Math.min((hour - set + 24) % 24, (rise - hour + 24) % 24);

  let palette: Palette;
  if (fromHorizon <= -1.3) palette = NIGHT;
  else if (fromHorizon <= 0) palette = mixPalette(NIGHT, TWILIGHT, ease((fromHorizon + 1.3) / 1.3));
  else if (fromHorizon <= 0.9) palette = mixPalette(TWILIGHT, GOLDEN, ease(fromHorizon / 0.9));
  else if (fromHorizon <= 2.4) palette = mixPalette(GOLDEN, DAY, ease((fromHorizon - 0.9) / 1.5));
  else palette = DAY;

  const morning = hour < SOLAR_NOON;
  const phase: Sky['phase'] =
    fromHorizon <= -1.3
      ? 'night'
      : fromHorizon <= 0.9
        ? morning
          ? 'dawn'
          : 'dusk'
        : Math.abs(hour - SOLAR_NOON) < 1.5
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
