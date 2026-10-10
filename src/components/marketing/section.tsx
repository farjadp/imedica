import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-5 md:px-8", className)}>{children}</div>;
}

export function SectionHeading({
  title,
  lead,
  className,
  as: Tag = "h2",
}: {
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <Tag
        className={cn(
          "font-display font-medium tracking-[-0.02em] text-ink",
          Tag === "h1" ? "text-[clamp(2.4rem,5.2vw,4.25rem)] leading-[1.02]" : "text-[clamp(1.85rem,3.4vw,2.75rem)] leading-[1.08]",
        )}
      >
        {title}
      </Tag>
      {lead ? <p className="mt-5 text-[17px] leading-relaxed text-ink-2 md:text-lg">{lead}</p> : null}
    </div>
  );
}
