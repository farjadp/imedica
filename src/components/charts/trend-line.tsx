"use client";

import { useRef, useState } from "react";

type Point = { label: string; value: number | null };

const W = 640;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

/**
 * One series over time: 2px line, ≥8px markers, recessive grid, crosshair and
 * tooltip on hover. Suppressed weeks (null) break the line rather than
 * pretending to be zero.
 */
export function TrendLine({ points, unit = "%" }: { points: Point[]; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / 100) * innerH;

  // Break into segments wherever a point is suppressed.
  const segments: { i: number; v: number }[][] = [];
  let current: { i: number; v: number }[] = [];
  points.forEach((p, i) => {
    if (p.value == null) {
      if (current.length) segments.push(current);
      current = [];
    } else current.push({ i, v: p.value });
  });
  if (current.length) segments.push(current);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setHover(best);
  };

  const h = hover != null ? points[hover] : null;

  return (
    <figure className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label="Team average score by week"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-rule-2)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-ink-3 font-mono text-[10px]">
              {t}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % Math.ceil(points.length / 6) === 0 || i === points.length - 1 ? (
            <text key={p.label} x={x(i)} y={H - 8} textAnchor="middle" className="fill-ink-3 font-mono text-[10px]">
              {p.label}
            </text>
          ) : null,
        )}
        {hover != null ? (
          <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--color-ink-3)" strokeDasharray="3 3" />
        ) : null}
        {segments.map((seg, k) => (
          <polyline
            key={k}
            points={seg.map((s) => `${x(s.i)},${y(s.v)}`).join(" ")}
            fill="none"
            stroke="var(--color-pine-3)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {points.map((p, i) =>
          p.value == null ? null : (
            <circle
              key={p.label}
              cx={x(i)}
              cy={y(p.value)}
              r={hover === i ? 5 : 4}
              fill="var(--color-pine-3)"
              stroke="var(--color-card)"
              strokeWidth="2"
            />
          ),
        )}
      </svg>
      {h ? (
        <div
          className="pointer-events-none absolute top-0 rounded-md border border-rule bg-card px-2.5 py-1.5 text-[12px] shadow-[var(--shadow-lift)]"
          style={{ left: `${(x(hover!) / W) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="text-ink-3">Week of {h.label}</p>
          <p className="tabular font-medium text-ink">{h.value == null ? "Fewer than 5 people" : `${h.value}${unit}`}</p>
        </div>
      ) : null}
    </figure>
  );
}
