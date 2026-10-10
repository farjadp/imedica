// One shared model of a heartbeat, so the 3D vectorcardiogram and the 2D
// monitor sweep are driven by the same clock and stay in perfect sync.
// Illustrative physiology, not diagnostic.

export const BPM = 66;
export const PERIOD = 60 / BPM;

const g = (x: number, mu: number, sigma: number) => Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));

/** Lead II amplitude at phase φ ∈ [0, 1). */
export function ecgAt(phi: number): number {
  return (
    0.11 * g(phi, 0.13, 0.022) - // P
    0.09 * g(phi, 0.236, 0.007) + // Q
    1.0 * g(phi, 0.256, 0.0095) - // R
    0.24 * g(phi, 0.273, 0.008) + // S
    0.28 * g(phi, 0.5, 0.042) // T
  );
}

export type Loop = { name: "P" | "QRS" | "T"; start: number; end: number; points: [number, number, number][] };

/**
 * A petal-shaped loop leaving and returning to the origin: the radius swells
 * and falls while the direction sweeps through an arc, the shape real
 * vectorcardiogram loops have.
 */
function loop(radius: number, fromDeg: number, sweepDeg: number, depth: number, n = 180): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const r = radius * Math.pow(Math.sin(Math.PI * u), 1.15);
    const a = ((fromDeg + sweepDeg * u) * Math.PI) / 180;
    pts.push([r * Math.cos(a), -r * Math.sin(a), depth * Math.sin(2 * Math.PI * u)]);
  }
  return pts;
}

/** The three loops the cardiac vector traces each beat, and when. */
export const LOOPS: Loop[] = [
  { name: "P", start: 0.085, end: 0.18, points: loop(0.34, 25, 70, 0.06) },
  { name: "QRS", start: 0.226, end: 0.292, points: loop(1.55, -10, 130, 0.45) },
  { name: "T", start: 0.42, end: 0.6, points: loop(0.72, 20, 55, 0.14) },
];
