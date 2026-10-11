import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { vitalsSchema } from "@/lib/validators/scenario";

import { RHYTHMS, stripPath } from "./ecg";
import { ecgStrips, pickStrip, stripDuration } from "./ecg-strips";

describe("ecgStrips", () => {
  it("has a sample file for every strip, trimmed to whole beats", () => {
    for (const s of ecgStrips) {
      const file = join(process.cwd(), "public/ecg/ptbxl", `${s.id}.json`);
      expect(existsSync(file), s.id).toBe(true);
      const data = JSON.parse(readFileSync(file, "utf8")) as { fs: number; samples: number[] };
      expect(data.samples.length / data.fs).toBeCloseTo(s.seconds, 1);
      // the loop's two ends meet at the baseline, so there is no seam
      expect(data.samples[0]).toBe(0);
      expect(data.samples.at(-1)).toBe(0);
    }
  });

  it("covers every rhythm except VF and asystole, which PTB-XL can't record", () => {
    const covered = new Set(ecgStrips.map((s) => s.rhythm));
    expect(RHYTHMS.filter((r) => !covered.has(r))).toEqual(["vfib", "asystole"]);
  });
});

describe("pickStrip", () => {
  it("uses the chosen strip when it matches the rhythm", () => {
    expect(pickStrip("stemi", 100, "ptbxl-12899")?.id).toBe("ptbxl-12899");
  });

  it("ignores a chosen strip from another rhythm and picks the closest heart rate", () => {
    const s = pickStrip("tachycardia", 124, "ptbxl-12899");
    const closest = Math.min(...ecgStrips.filter((x) => x.rhythm === "tachycardia").map((x) => Math.abs(x.hr - 124)));
    expect(s?.rhythm).toBe("tachycardia");
    expect(Math.abs(s!.hr - 124)).toBe(closest);
  });

  it("returns nothing for rhythms without recordings", () => {
    expect(pickStrip("vfib", 0)).toBeNull();
    expect(pickStrip("asystole", null)).toBeNull();
  });
});

describe("stripDuration", () => {
  const strip = { id: "x", rhythm: "sinus" as const, hr: 80, beats: 10, seconds: 7.5 };

  it("stretches the loop to the monitor's heart rate", () => {
    expect(stripDuration(strip, 88)).toBeCloseTo(7.5 * (80 / 88));
  });

  it("stretches at most 25% either way, so the waveform still looks real", () => {
    expect(stripDuration(strip, 200)).toBeCloseTo(7.5 * 0.8);
    expect(stripDuration(strip, 40)).toBeCloseTo(7.5 * 1.25);
  });
});

describe("stripPath", () => {
  it("fills the height, highest sample at the top", () => {
    const d = stripPath([0, 100, 0], 100, 50);
    expect(d).toBe("M0.0 45.0 L50.0 5.0 L100.0 45.0");
  });
});

describe("vitalsSchema ecgStrip", () => {
  it("accepts a PTB-XL id or nothing", () => {
    expect(vitalsSchema.safeParse({ rhythm: "afib", ecgStrip: "ptbxl-14474" }).success).toBe(true);
    expect(vitalsSchema.safeParse({ rhythm: "afib", ecgStrip: null }).success).toBe(true);
  });

  it("rejects anything else", () => {
    expect(vitalsSchema.safeParse({ ecgStrip: "../../etc/passwd" }).success).toBe(false);
  });
});
