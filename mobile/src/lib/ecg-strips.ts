// Copied from the web app (src/components/clinical/ecg-strips.ts); keep the two in step.
// Real lead II strips from PTB-XL (PhysioNet, CC BY 4.0), built by
// scripts/ptbxl/build_strips.py. Each strip is trimmed to whole beats so it
// loops without a seam; samples live in public/ecg/ptbxl/<id>.json.

import type { Rhythm } from "./ecg";

export type EcgStrip = { id: string; rhythm: Rhythm; hr: number; beats: number; seconds: number };

export const ECG_CREDIT = "ECG: PTB-XL, PhysioNet (CC BY 4.0)";

export const ecgStrips: EcgStrip[] = [
  { id: "ptbxl-02644", rhythm: "sinus", hr: 55, beats: 7, seconds: 7.68 },
  { id: "ptbxl-07425", rhythm: "sinus", hr: 59, beats: 8, seconds: 8.19 },
  { id: "ptbxl-16872", rhythm: "sinus", hr: 64, beats: 9, seconds: 8.45 },
  { id: "ptbxl-06813", rhythm: "sinus", hr: 71, beats: 10, seconds: 8.48 },
  { id: "ptbxl-14117", rhythm: "sinus", hr: 77, beats: 10, seconds: 7.84 },
  { id: "ptbxl-14071", rhythm: "sinus", hr: 85, beats: 12, seconds: 8.46 },
  { id: "ptbxl-03564", rhythm: "tachycardia", hr: 101, beats: 15, seconds: 8.92 },
  { id: "ptbxl-16309", rhythm: "tachycardia", hr: 103, beats: 15, seconds: 8.71 },
  { id: "ptbxl-01375", rhythm: "tachycardia", hr: 104, beats: 15, seconds: 8.63 },
  { id: "ptbxl-06997", rhythm: "tachycardia", hr: 109, beats: 16, seconds: 8.81 },
  { id: "ptbxl-07413", rhythm: "tachycardia", hr: 110, beats: 16, seconds: 8.7 },
  { id: "ptbxl-19229", rhythm: "tachycardia", hr: 121, beats: 18, seconds: 8.91 },
  { id: "ptbxl-19261", rhythm: "bradycardia", hr: 43, beats: 5, seconds: 6.92 },
  { id: "ptbxl-04291", rhythm: "bradycardia", hr: 46, beats: 6, seconds: 7.84 },
  { id: "ptbxl-14186", rhythm: "bradycardia", hr: 56, beats: 8, seconds: 8.57 },
  { id: "ptbxl-16102", rhythm: "bradycardia", hr: 56, beats: 7, seconds: 7.45 },
  { id: "ptbxl-14503", rhythm: "bradycardia", hr: 58, beats: 8, seconds: 8.29 },
  { id: "ptbxl-01742", rhythm: "bradycardia", hr: 60, beats: 8, seconds: 8.06 },
  { id: "ptbxl-15993", rhythm: "afib", hr: 52, beats: 7, seconds: 8.05 },
  { id: "ptbxl-14474", rhythm: "afib", hr: 63, beats: 9, seconds: 8.61 },
  { id: "ptbxl-13877", rhythm: "afib", hr: 69, beats: 10, seconds: 8.68 },
  { id: "ptbxl-10054", rhythm: "afib", hr: 86, beats: 12, seconds: 8.34 },
  { id: "ptbxl-01233", rhythm: "afib", hr: 98, beats: 14, seconds: 8.56 },
  { id: "ptbxl-05859", rhythm: "afib", hr: 156, beats: 23, seconds: 8.87 },
  { id: "ptbxl-12899", rhythm: "stemi", hr: 72, beats: 10, seconds: 8.3 },
  { id: "ptbxl-00514", rhythm: "stemi", hr: 76, beats: 11, seconds: 8.74 },
  { id: "ptbxl-19270", rhythm: "stemi", hr: 87, beats: 12, seconds: 8.28 },
  { id: "ptbxl-01063", rhythm: "stemi", hr: 88, beats: 12, seconds: 8.2 },
  { id: "ptbxl-19269", rhythm: "stemi", hr: 91, beats: 13, seconds: 8.58 },
  { id: "ptbxl-08075", rhythm: "stemi", hr: 92, beats: 14, seconds: 9.18 },
];

/** The strip to show: the chosen one if it fits the rhythm, else the one closest to the heart rate. */
export function pickStrip(rhythm: Rhythm, hr?: number | null, chosen?: string | null): EcgStrip | null {
  const pool = ecgStrips.filter((s) => s.rhythm === rhythm);
  if (pool.length === 0) return null;
  const exact = chosen ? pool.find((s) => s.id === chosen) : undefined;
  if (exact) return exact;
  if (hr == null || hr <= 0) return pool[0];
  return pool.reduce((best, s) => (Math.abs(s.hr - hr) < Math.abs(best.hr - hr) ? s : best));
}

/** Loop length in seconds, stretched toward the monitor's heart rate (at most 25% either way). */
export function stripDuration(strip: EcgStrip, hr?: number | null): number {
  if (hr == null || hr <= 0) return strip.seconds;
  const scale = Math.min(1.25, Math.max(0.8, strip.hr / hr));
  return strip.seconds * scale;
}
