"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";

import { ecgPath, stripPath, type Rhythm } from "./ecg";
import { pickStrip, stripDuration } from "./ecg-strips";

const WIDTH = 960;

const sampleCache = new Map<string, Promise<number[] | null>>();

function loadSamples(id: string): Promise<number[] | null> {
  let p = sampleCache.get(id);
  if (!p) {
    p = fetch(`/ecg/ptbxl/${id}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<{ samples: number[] }>) : null))
      .then((d) => (d && Array.isArray(d.samples) ? d.samples : null))
      .catch(() => null);
    sampleCache.set(id, p);
  }
  return p;
}

/**
 * A sweeping monitor trace. Two copies of the strip scroll left forever, so
 * the loop has no seam. Speed follows the rhythm, as on a real monitor.
 *
 * With `real`, rhythms that have PTB-XL recordings play a real lead II strip
 * (the chosen one, or the one closest to `hr`), stretched toward `hr`. VF and
 * asystole, and anything still loading, use the drawn trace.
 */
export function EcgTrace({
  rhythm,
  height = 72,
  className,
  stroke = "var(--color-signal)",
  real = false,
  hr,
  strip,
}: {
  rhythm: Rhythm;
  height?: number;
  className?: string;
  stroke?: string;
  real?: boolean;
  hr?: number | null;
  strip?: string | null;
}) {
  const chosen = real ? pickStrip(rhythm, hr, strip) : null;
  const [loaded, setLoaded] = useState<{ id: string; samples: number[] } | null>(null);

  useEffect(() => {
    if (!chosen) return;
    let live = true;
    loadSamples(chosen.id).then((samples) => {
      if (live && samples) setLoaded({ id: chosen.id, samples });
    });
    return () => {
      live = false;
    };
  }, [chosen]);

  const samples = chosen && loaded?.id === chosen.id ? loaded.samples : null;
  const d = useMemo(
    () => (samples ? stripPath(samples, WIDTH, height) : ecgPath(rhythm, WIDTH, height)),
    [samples, rhythm, height],
  );
  const seconds = samples && chosen ? stripDuration(chosen, hr) : rhythm === "asystole" ? 12 : 6;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ height }}
      aria-hidden
      data-strip={samples && chosen ? chosen.id : undefined}
    >
      <svg
        key={samples && chosen ? chosen.id : rhythm}
        className="absolute inset-y-0 left-0 h-full motion-safe:animate-[ecg-sweep_var(--sweep)_linear_infinite]"
        style={{ width: WIDTH * 2, ["--sweep" as string]: `${seconds.toFixed(2)}s` }}
        viewBox={`0 0 ${WIDTH * 2} ${height}`}
        preserveAspectRatio="none"
      >
        <path d={d} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path
          d={d}
          transform={`translate(${WIDTH} 0)`}
          fill="none"
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
