import { cn } from "@/lib/cn";

/**
 * The iMedica mark: a heart drawn as one continuous line, with the stem of an
 * "i" folded into it. Redrawn from the original artwork as two strokes so it
 * stays crisp at favicon size. Colour comes from `currentColor`.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("size-7 text-brand", className)} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="56">
        <path d="M141 86V185a80 80 0 0 0 80 80h134a99 99 0 0 1 0 198H57V150a99 99 0 0 1 198 0v90" />
        <path d="M57 300a68 68 0 0 0 68 68h205" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Logo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "paper" }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={tone === "paper" ? "text-[#9ff0c4]" : undefined} />
      <span
        className={cn(
          "font-display text-[21px] leading-none font-semibold tracking-[-0.02em]",
          tone === "paper" ? "text-paper" : "text-ink",
        )}
      >
        i<span className="text-brand">M</span>edica
      </span>
    </span>
  );
}
