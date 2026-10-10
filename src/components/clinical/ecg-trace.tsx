"use client";

import { useMemo } from "react";

import { cn } from "@/lib/cn";

import { ecgPath, type Rhythm } from "./ecg";

const WIDTH = 960;

/**
 * A sweeping monitor trace. Two copies of the strip scroll left forever, so
 * the loop has no seam. Speed follows the rhythm, as on a real monitor.
 */
export function EcgTrace({
  rhythm,
  height = 72,
  className,
  stroke = "var(--color-signal)",
}: {
  rhythm: Rhythm;
  height?: number;
  className?: string;
  stroke?: string;
}) {
  const d = useMemo(() => ecgPath(rhythm, WIDTH, height), [rhythm, height]);
  const seconds = rhythm === "asystole" ? 12 : 6;

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ height }} aria-hidden>
      <svg
        key={rhythm}
        className="absolute inset-y-0 left-0 h-full motion-safe:animate-[ecg-sweep_var(--sweep)_linear_infinite]"
        style={{ width: WIDTH * 2, ["--sweep" as string]: `${seconds}s` }}
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
