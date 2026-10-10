import { cn } from "@/lib/cn";

/** The mark: a single PQRST complex inside the record's square. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill="var(--color-pine)" />
      <path
        d="M4 18h6.2l1.6-2.6 1.6 2.6h1.4l1.7-10.5 2.6 15 1.7-4.5H28"
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "paper" }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span
        className={cn(
          "font-display text-[21px] leading-none font-semibold tracking-[-0.02em]",
          tone === "paper" ? "text-paper" : "text-ink",
        )}
      >
        imedica
      </span>
    </span>
  );
}
