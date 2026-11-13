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
