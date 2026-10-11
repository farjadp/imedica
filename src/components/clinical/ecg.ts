// Synthesises a lead II-style trace as an SVG path. Illustrative, not diagnostic.

export const RHYTHMS = ["sinus", "tachycardia", "bradycardia", "afib", "stemi", "vfib", "asystole"] as const;
export type Rhythm = (typeof RHYTHMS)[number];

type Point = [number, number];

/** One beat sampled across `w` px, baseline at 0, upward = negative y. */
function beat(rhythm: Rhythm, w: number, amp: number): Point[] {
  const p = (t: number, y: number): Point => [t * w, -y * amp];
  const st = rhythm === "stemi" ? 0.32 : 0;
  const pWave = rhythm === "afib" ? 0 : 0.12;
  return [
    p(0, 0),
    p(0.1, 0),
    p(0.14, pWave), // P
    p(0.18, 0),
    p(0.26, 0),
    p(0.28, -0.12), // Q
    p(0.31, 1), // R
    p(0.34, -0.28), // S
    p(0.37, st),
    p(0.46, st + 0.06),
    p(0.52, st + 0.26), // T
    p(0.58, st * 0.4),
    p(0.64, 0),
    p(1, 0),
  ];
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function vfib(width: number, amp: number, seed = 7): Point[] {
  const points: Point[] = [];
  const rand = seeded(seed);
  for (let x = 0; x <= width; x += 4) {
    const y = Math.sin(x / 9) * 0.35 + Math.sin(x / 23 + 1.3) * 0.25 + (rand() - 0.5) * 0.3;
    points.push([x, -y * amp]);
  }
  return points;
}

/** Irregularly irregular QRS complexes on a fibrillating baseline, no P waves. */
function afib(width: number, amp: number, seed = 11): Point[] {
  const points: Point[] = [];
  const rand = seeded(seed);
  for (let x = 0; x < width; ) {
    const w = 70 + rand() * 70;
    for (const [bx, by] of beat("afib", w, amp)) points.push([x + bx, by + Math.sin((x + bx) / 3) * 0.03 * amp]);
    x += w;
  }
  return points;
}

const beatWidth: Record<Rhythm, number> = {
  sinus: 120,
  tachycardia: 78,
  stemi: 96,
  bradycardia: 190,
  afib: 100,
  vfib: 100,
  asystole: 100,
};

export function ecgPath(rhythm: Rhythm, width: number, height: number): string {
  const mid = height * 0.58;
  const amp = height * 0.42;
  let points: Point[] = [];

  if (rhythm === "asystole") {
    points = [
      [0, 0],
      [width, 0],
    ];
  } else if (rhythm === "vfib") {
    points = vfib(width, amp);
  } else if (rhythm === "afib") {
    points = afib(width, amp);
  } else {
    const w = beatWidth[rhythm];
    for (let x = 0; x < width; x += w) {
      for (const [bx, by] of beat(rhythm, w, amp)) points.push([x + bx, by]);
    }
  }

  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${(mid + y).toFixed(1)}`)
    .join(" ");
}

export const rhythmLabel: Record<Rhythm, string> = {
  sinus: "Sinus rhythm",
  tachycardia: "Sinus tachycardia",
  stemi: "Sinus tach · ST elevation",
  bradycardia: "Sinus bradycardia",
  afib: "Atrial fibrillation",
  vfib: "Ventricular fibrillation",
  asystole: "Asystole",
};

/** A real strip as an SVG path: samples in 10 µV units, auto-gained to fill the height like a monitor. */
export function stripPath(samples: number[], width: number, height: number): string {
  if (samples.length < 2) return "";
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of samples) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = Math.max(hi - lo, 40); // at least 0.4 mV, so a flat-ish strip isn't blown up into noise
  const top = height * 0.1;
  const usable = height * 0.8;
  const step = width / (samples.length - 1);
  return samples
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${(top + ((hi - v) / span) * usable).toFixed(1)}`)
    .join(" ");
}
