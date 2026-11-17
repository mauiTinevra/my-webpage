// The figure on page two. A side-view body made of jointed segments, posed by angles,
// so it can move from one asana to the next.
//
// Angles are in degrees, clockwise on screen: 0 points forward (the way the figure faces),
// 90 points down, -90 points up, 180 points behind.

export interface Pose {
  /** hip to shoulder */
  T: number;
  /** shoulder to head */
  H: number;
  /** upper arm, forearm */
  aU: number;
  aF: number;
  /** thigh, shin, foot */
  lU: number;
  lL: number;
  ft: number;
  /** The far-side limbs, when they differ from the near side. */
  a2U?: number;
  a2F?: number;
  l2U?: number;
  l2L?: number;
  ft2?: number;
}

const LEN = { torso: 42, neck: 15, upperArm: 22, forearm: 22, thigh: 34, shin: 34, foot: 9 };
const INK = '#121a3a';
const SKIN = '#c98f5f';
const TOP = '#fbf4e4';
const SHORTS = '#1f3fcf';

export const poses: Record<string, Pose> = {
  samasthiti: { T: -90, H: -90, aU: 90, aF: 90, lU: 90, lL: 90, ft: 0 },
  urdhvaHastasana: { T: -90, H: -100, aU: -88, aF: -92, lU: 90, lL: 90, ft: 0 },
  uttanasana: { T: 76, H: 82, aU: 150, aF: 62, lU: 90, lL: 90, ft: 0 },
  ardhaUttanasana: { T: 8, H: -5, aU: 92, aF: 88, lU: 90, lL: 90, ft: 0 },
  chaturanga: { T: 2, H: -8, aU: 172, aF: 88, lU: 178, lL: 178, ft: 95 },
  urdhvaMukha: { T: -48, H: -85, aU: 96, aF: 92, lU: 170, lL: 176, ft: 178 },
  adhoMukha: { T: 36, H: 44, aU: 36, aF: 36, lU: 130, lL: 132, ft: 20 },
  utkatasana: { T: -68, H: -75, aU: -66, aF: -70, lU: 28, lL: 104, ft: 0 },
  virabhadrasana: { T: -90, H: -92, aU: -88, aF: -92, lU: 14, lL: 90, ft: 0, l2U: 142, l2L: 142, ft2: 20 },
  dandasana: { T: -90, H: -90, aU: 100, aF: 82, lU: 0, lL: 0, ft: -85 },
  paschimottanasana: { T: -14, H: 4, aU: 6, aF: 14, lU: 0, lL: 0, ft: -85 },
  purvottanasana: { T: -157, H: -165, aU: 90, aF: 92, lU: 21, lL: 22, ft: 40 },
  navasana: { T: -128, H: -112, aU: -4, aF: 0, lU: -42, lL: -42, ft: -42 },
  urdhvaDhanurasana: { T: 160, H: 118, aU: 102, aF: 96, lU: 48, lL: 100, ft: 0 },
  sarvangasana: { T: 96, H: 4, aU: 172, aF: -72, lU: -90, lL: -90, ft: -90 },
  halasana: { T: 102, H: 2, aU: 180, aF: 180, lU: 36, lL: 36, ft: 100 },
  sirsasana: { T: 90, H: 90, aU: 42, aF: 152, lU: -90, lL: -90, ft: -90 },
  padmasana: { T: -90, H: -90, aU: 78, aF: 24, lU: 8, lL: 172, ft: 180, l2U: 20, l2L: 164 },
  savasana: { T: 180, H: 180, aU: 4, aF: 2, lU: 0, lL: 0, ft: -55 },
  pasasana: { T: -74, H: -80, aU: 24, aF: 64, lU: -20, lL: 100, ft: 0 },
  shalabhasana: { T: -22, H: -45, aU: 170, aF: 172, lU: 192, lL: 196, ft: 196 },
  dhanurasana: { T: -38, H: -64, aU: 176, aF: 198, lU: 200, lL: -58, ft: -50 },
  ustrasana: { T: -134, H: -175, aU: 98, aF: 94, lU: 90, lL: 180, ft: 180 },
  bakasana: { T: 24, H: -12, aU: 100, aF: 82, lU: 58, lL: 176, ft: 178 },
  pinchaMayurasana: { T: 84, H: 58, aU: 96, aF: 0, lU: -92, lL: -88, ft: -90 },
  mayurasana: { T: 0, H: -12, aU: 140, aF: 90, lU: 182, lL: 186, ft: 186 },
};

type Step = { pose: keyof typeof poses; name: string; hold: number };

// One sun salutation, moving on each breath.
const suryaNamaskara: Step[] = [
  { pose: 'samasthiti', name: 'Samasthiti', hold: 1.6 },
  { pose: 'urdhvaHastasana', name: 'Surya Namaskara A', hold: 0.9 },
  { pose: 'uttanasana', name: 'Surya Namaskara A', hold: 0.9 },
  { pose: 'ardhaUttanasana', name: 'Surya Namaskara A', hold: 0.7 },
  { pose: 'chaturanga', name: 'Chaturanga Dandasana', hold: 0.9 },
  { pose: 'urdhvaMukha', name: 'Urdhva Mukha Svanasana', hold: 1.1 },
  { pose: 'adhoMukha', name: 'Adho Mukha Svanasana', hold: 3.5 },
  { pose: 'ardhaUttanasana', name: 'Surya Namaskara A', hold: 0.7 },
  { pose: 'uttanasana', name: 'Surya Namaskara A', hold: 0.9 },
  { pose: 'urdhvaHastasana', name: 'Surya Namaskara A', hold: 0.9 },
  { pose: 'samasthiti', name: 'Samasthiti', hold: 1.2 },
];

const closing: Step[] = [
  { pose: 'urdhvaDhanurasana', name: 'Urdhva Dhanurasana', hold: 4 },
  { pose: 'paschimottanasana', name: 'Paschimottanasana', hold: 3 },
  { pose: 'sarvangasana', name: 'Salamba Sarvangasana', hold: 4 },
  { pose: 'halasana', name: 'Halasana', hold: 3.5 },
  { pose: 'sirsasana', name: 'Sirsasana', hold: 4.5 },
  { pose: 'padmasana', name: 'Padmasana', hold: 4 },
  { pose: 'savasana', name: 'Savasana', hold: 12 },
];

// A selection from each series, in the order they are practised. Many asanas are left out:
// the twists, binds and lotus variations do not read in a flat side view.
export const practice: { series: string; steps: Step[] }[] = [
  {
    series: 'Primary series',
    steps: [
      ...suryaNamaskara,
      { pose: 'utkatasana', name: 'Utkatasana', hold: 3.5 },
      { pose: 'virabhadrasana', name: 'Virabhadrasana A', hold: 3.5 },
      { pose: 'dandasana', name: 'Dandasana', hold: 3 },
      { pose: 'paschimottanasana', name: 'Paschimottanasana', hold: 4 },
      { pose: 'purvottanasana', name: 'Purvottanasana', hold: 3.5 },
      { pose: 'navasana', name: 'Navasana', hold: 4 },
      ...closing,
    ],
  },
  {
    series: 'Second series',
    steps: [
      ...suryaNamaskara,
      { pose: 'pasasana', name: 'Pasasana', hold: 3.5 },
      { pose: 'shalabhasana', name: 'Shalabhasana', hold: 3.5 },
      { pose: 'dhanurasana', name: 'Dhanurasana', hold: 3.5 },
      { pose: 'ustrasana', name: 'Ustrasana', hold: 4 },
      { pose: 'bakasana', name: 'Bakasana', hold: 4.5 },
      { pose: 'pinchaMayurasana', name: 'Pincha Mayurasana', hold: 4 },
      { pose: 'mayurasana', name: 'Mayurasana', hold: 3.5 },
      ...closing,
    ],
  },
];

const rad = (deg: number) => (deg * Math.PI) / 180;
type Pt = [number, number];
const step = (from: Pt, length: number, angle: number): Pt => [
  from[0] + length * Math.cos(rad(angle)),
  from[1] + length * Math.sin(rad(angle)),
];

/** Moves between two poses, each joint turning the short way round. */
export function blend(a: Pose, b: Pose, k: number): Pose {
  const full = (p: Pose) => ({
    ...p,
    a2U: p.a2U ?? p.aU,
    a2F: p.a2F ?? p.aF,
    l2U: p.l2U ?? p.lU,
    l2L: p.l2L ?? p.lL,
    ft2: p.ft2 ?? p.ft,
  });
  const from = full(a) as Record<string, number>;
  const to = full(b) as Record<string, number>;
  const out: Record<string, number> = {};
  for (const key of Object.keys(from)) {
    const turn = ((((to[key] - from[key]) % 360) + 540) % 360) - 180;
    out[key] = from[key] + turn * k;
  }
  return out as unknown as Pose;
}

/** Draws a pose as SVG, standing on the ground at y = 0 with the hips above x = 0. */
export function draw(p: Pose): string {
  const hip: Pt = [0, 0];
  const shoulder = step(hip, LEN.torso, p.T);
  const head = step(shoulder, LEN.neck, p.H);
  const limbs = (aU: number, aF: number, lU: number, lL: number, ft: number) => {
    const elbow = step(shoulder, LEN.upperArm, aU);
    const hand = step(elbow, LEN.forearm, aF);
    const knee = step(hip, LEN.thigh, lU);
    const ankle = step(knee, LEN.shin, lL);
    const toe = step(ankle, LEN.foot, ft);
    return { elbow, hand, knee, ankle, toe, hem: step(hip, LEN.thigh * 0.5, lU) };
  };
  const near = limbs(p.aU, p.aF, p.lU, p.lL, p.ft);
  const far = limbs(p.a2U ?? p.aU, p.a2F ?? p.aF, p.l2U ?? p.lU, p.l2L ?? p.lL, p.ft2 ?? p.ft);

  // Whatever part of the body is lowest rests on the ground.
  const floor = Math.max(
    hip[1] + 13,
    shoulder[1] + 11,
    head[1] + 12,
    ...[near, far].flatMap((s) => [s.elbow[1] + 6, s.hand[1] + 6, s.knee[1] + 7, s.ankle[1] + 6, s.toe[1] + 5]),
  );
  const at = ([x, y]: Pt) => `${x.toFixed(1)} ${(y - floor).toFixed(1)}`;
  const xy = ([x, y]: Pt) => [x.toFixed(1), (y - floor).toFixed(1)];

  const bone = (points: Pt[], width: number, color: string) => {
    const d = `M${points.map(at).join(' L')}`;
    return (
      `<path d="${d}" stroke="${INK}" stroke-width="${width + 7}"/>` + `<path d="${d}" stroke="${color}" stroke-width="${width}"/>`
    );
  };
  const arm = (s: typeof near) => {
    const [hx, hy] = xy(s.hand);
    return bone([shoulder, s.elbow, s.hand], 8, TOP) + `<circle cx="${hx}" cy="${hy}" r="5" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`;
  };
  const leg = (s: typeof near) => bone([hip, s.knee, s.ankle, s.toe], 10, SKIN) + bone([hip, s.hem], 12, SHORTS);

  const [hpx, hpy] = xy(hip);
  const [hdx, hdy] = xy(head);
  const bun = xy(step(head, 14, p.H - 105));
  const hairFrom = at(step(head, 12, p.H - 195));
  const hairTo = at(step(head, 12, p.H - 15));

  return (
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    arm(far) +
    leg(far) +
    bone([hip, shoulder], 20, TOP) +
    `<circle cx="${hpx}" cy="${hpy}" r="12.5" fill="${SHORTS}" stroke="${INK}" stroke-width="3.5"/>` +
    leg(near) +
    `<circle cx="${bun[0]}" cy="${bun[1]}" r="6" fill="${INK}"/>` +
    `<circle cx="${hdx}" cy="${hdy}" r="12" fill="${SKIN}" stroke="${INK}" stroke-width="3.5"/>` +
    `<path d="M${hairFrom} A12 12 0 0 1 ${hairTo} Z" fill="${INK}"/>` +
    arm(near) +
    `</g>`
  );
}

// ---------------------------------------------------------------------------------------------
// The finer figure, for the home page: a silhouette built from tapered limbs instead of fat
// strokes, moved with overlap (the torso leads, the hands and feet arrive last) and a breath.

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (k: number) => k * k * (3 - 2 * k);
// How late each joint starts, as a share of the move. The spine leads; fingers and toes follow.
const LAG: Record<string, number> = { T: 0, H: 0.16, aU: 0.08, aF: 0.2, a2U: 0.12, a2F: 0.24, lU: 0, lL: 0.07, ft: 0.14, l2U: 0.04, l2L: 0.11, ft2: 0.18 };
const MAX_LAG = 0.24;

/** Like blend, but each joint runs on its own slightly late clock, so the body moves in a wave. */
export function blendLag(a: Pose, b: Pose, k: number): Pose {
  const full = (p: Pose) => ({ ...p, a2U: p.a2U ?? p.aU, a2F: p.a2F ?? p.aF, l2U: p.l2U ?? p.lU, l2L: p.l2L ?? p.lL, ft2: p.ft2 ?? p.ft });
  const from = full(a) as Record<string, number>;
  const to = full(b) as Record<string, number>;
  const out: Record<string, number> = {};
  for (const key of Object.keys(from)) {
    const own = smooth(clamp01((k - (LAG[key] ?? 0)) / (1 - MAX_LAG)));
    const turn = ((((to[key] - from[key]) % 360) + 540) % 360) - 180;
    out[key] = from[key] + turn * own;
  }
  return out as unknown as Pose;
}

/** A held pose, breathing: `breath` runs -1 (empty) to 1 (full). The chest lifts a little. */
export function breathe(p: Pose, breath: number): Pose {
  const lift = breath * 1.4;
  // Lifting means turning toward "up" (-90), whichever way the torso leans.
  const toward = (angle: number) => {
    const turn = ((((-90 - angle) % 360) + 540) % 360) - 180;
    return angle + Math.sign(turn) * Math.min(Math.abs(turn), Math.abs(lift)) * Math.sign(lift);
  };
  return { ...p, T: toward(p.T), H: toward(p.H) };
}

export interface Look {
  /** The near leg, the darkest tone. */
  near: string;
  /** The far arm and leg, the lightest, as if further off. */
  far: string;
  /** The torso and head, and the near arm: two tones between, so folded poses still read. */
  torso: string;
  arm: string;
}

/** Draws a pose as a silhouette. Returns the SVG and where the near hand is, for the trail. */
export function drawFine(p: Pose, look: Look): { svg: string; hand: Pt; head: Pt } {
  const hip: Pt = [0, 0];
  const shoulder = step(hip, LEN.torso, p.T);
  const head = step(shoulder, LEN.neck, p.H);
  const limbs = (aU: number, aF: number, lU: number, lL: number, ft: number) => {
    const elbow = step(shoulder, LEN.upperArm, aU);
    const hand = step(elbow, LEN.forearm, aF);
    const knee = step(hip, LEN.thigh, lU);
    const ankle = step(knee, LEN.shin, lL);
    const toe = step(ankle, LEN.foot, ft);
    return { elbow, hand, knee, ankle, toe };
  };
  const near = limbs(p.aU, p.aF, p.lU, p.lL, p.ft);
  const far = limbs(p.a2U ?? p.aU, p.a2F ?? p.aF, p.l2U ?? p.lU, p.l2L ?? p.lL, p.ft2 ?? p.ft);
  const floor = Math.max(
    hip[1] + 11,
    shoulder[1] + 10,
    head[1] + 11,
    ...[near, far].flatMap((s) => [s.elbow[1] + 4.5, s.hand[1] + 3.5, s.knee[1] + 6, s.ankle[1] + 4, s.toe[1] + 3]),
  );
  const n = (v: number) => v.toFixed(1);
  // One tapered segment: a circle at each end and the skin stretched between them.
  const seg = (a: Pt, b: Pt, ra: number, rb: number) => {
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    const pt = (c: Pt, r: number, side: number) => `${n(c[0] + nx * r * side)} ${n(c[1] - floor + ny * r * side)}`;
    return (
      `<path d="M${pt(a, ra, 1)}L${pt(b, rb, 1)}L${pt(b, rb, -1)}L${pt(a, ra, -1)}Z"/>` +
      `<circle cx="${n(a[0])}" cy="${n(a[1] - floor)}" r="${ra}"/><circle cx="${n(b[0])}" cy="${n(b[1] - floor)}" r="${rb}"/>`
    );
  };
  const arm = (s: typeof near) => seg(shoulder, s.elbow, 5.2, 4.2) + seg(s.elbow, s.hand, 4.2, 3.2);
  const leg = (s: typeof near) => seg(hip, s.knee, 9, 6.2) + seg(s.knee, s.ankle, 6.2, 4) + seg(s.ankle, s.toe, 4, 2.6);
  const bun = step(head, 13, p.H - 105);
  const body =
    seg(hip, shoulder, 10.5, 11) +
    seg(shoulder, head, 5, 5) +
    `<circle cx="${n(head[0])}" cy="${n(head[1] - floor)}" r="10.5"/>` +
    `<circle cx="${n(bun[0])}" cy="${n(bun[1] - floor)}" r="5"/>`;
  const svg =
    `<g fill="${look.far}">${arm(far)}${leg(far)}</g><g fill="${look.torso}">${body}</g>` +
    `<g fill="${look.near}">${leg(near)}</g><g fill="${look.arm}">${arm(near)}</g>`;
  return { svg, hand: [near.hand[0], near.hand[1] - floor], head: [head[0], head[1] - floor] };
}

export interface Colors {
  skin: string;
  skinFar: string;
  top: string;
  topFar: string;
  shorts: string;
  shortsFar: string;
  hair: string;
}

/** The same tapered figure in flat color: skin, a long-sleeved top, shorts and a bun. */
export function drawFlat(p: Pose, c: Colors): { svg: string; hand: Pt } {
  const hip: Pt = [0, 0];
  const shoulder = step(hip, LEN.torso, p.T);
  const head = step(shoulder, LEN.neck, p.H);
  const limbs = (aU: number, aF: number, lU: number, lL: number, ft: number) => {
    const elbow = step(shoulder, LEN.upperArm, aU);
    const hand = step(elbow, LEN.forearm, aF);
    const knee = step(hip, LEN.thigh, lU);
    const ankle = step(knee, LEN.shin, lL);
    const toe = step(ankle, LEN.foot, ft);
    return { elbow, hand, knee, ankle, toe, hem: step(hip, LEN.thigh * 0.55, lU) };
  };
  const near = limbs(p.aU, p.aF, p.lU, p.lL, p.ft);
  const far = limbs(p.a2U ?? p.aU, p.a2F ?? p.aF, p.l2U ?? p.lU, p.l2L ?? p.lL, p.ft2 ?? p.ft);
  const floor = Math.max(
    hip[1] + 11,
    shoulder[1] + 10,
    head[1] + 11,
    ...[near, far].flatMap((s) => [s.elbow[1] + 4.5, s.hand[1] + 3.5, s.knee[1] + 6, s.ankle[1] + 4, s.toe[1] + 3]),
  );
  const n = (v: number) => v.toFixed(1);
  const dot = (a: Pt, r: number, fill: string) => `<circle cx="${n(a[0])}" cy="${n(a[1] - floor)}" r="${r}" fill="${fill}"/>`;
  const seg = (a: Pt, b: Pt, ra: number, rb: number, fill: string) => {
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    const pt = (q: Pt, r: number, side: number) => `${n(q[0] + nx * r * side)} ${n(q[1] - floor + ny * r * side)}`;
    return `<path fill="${fill}" d="M${pt(a, ra, 1)}L${pt(b, rb, 1)}L${pt(b, rb, -1)}L${pt(a, ra, -1)}Z"/>` + dot(a, ra, fill) + dot(b, rb, fill);
  };
  const arm = (s: typeof near, top: string, skin: string) => seg(shoulder, s.elbow, 5.4, 4.4, top) + seg(s.elbow, s.hand, 4.4, 3.4, top) + dot(s.hand, 3.9, skin);
  const leg = (s: typeof near, skin: string, shorts: string) =>
    seg(hip, s.knee, 8.6, 6.2, skin) + seg(s.knee, s.ankle, 6.2, 4, skin) + seg(s.ankle, s.toe, 4, 2.6, skin) + seg(hip, s.hem, 9.6, 8.6, shorts);
  const bun = step(head, 13, p.H - 105);
  const cap = step(head, 2.5, p.H - 100);
  const svg =
    arm(far, c.topFar, c.skinFar) +
    leg(far, c.skinFar, c.shortsFar) +
    seg(shoulder, head, 4.6, 4.6, c.skin) +
    seg(hip, shoulder, 10.5, 11, c.top) +
    dot(hip, 10.6, c.shorts) +
    leg(near, c.skin, c.shorts) +
    dot(bun, 5.2, c.hair) +
    dot(cap, 11.2, c.hair) +
    dot(head, 10, c.skin) +
    arm(near, c.top, c.skin);
  return { svg, hand: [near.hand[0], near.hand[1] - floor] };
}
