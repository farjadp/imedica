import type { Outcome } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";

// Outcome colours borrow from Canadian triage tags, which every paramedic
// reads without thinking.
const styles: Record<Outcome, { label: string; className: string }> = {
  CORRECT: { label: "Correct", className: "bg-tag-green text-white" },
  ACCEPTABLE: { label: "Acceptable", className: "border border-tag-green text-tag-green bg-tag-green-wash" },
  SUBOPTIMAL: { label: "Suboptimal", className: "bg-tag-yellow-wash text-tag-yellow border border-tag-yellow/40" },
  HARMFUL: { label: "Harmful", className: "bg-tag-red text-white" },
  CRITICAL: { label: "Critical", className: "bg-tag-black text-white" },
};

export function outcomeLabel(outcome: Outcome) {
  return styles[outcome].label;
}

export function OutcomeTag({ outcome, className }: { outcome: Outcome; className?: string }) {
  const s = styles[outcome];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[4px] px-2 font-mono text-[11px] font-medium tracking-wide uppercase",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
