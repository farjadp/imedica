import { cn } from "@/lib/cn";

/**
 * The resus-bay backdrop shared by every dark section: a pine glow, a faint
 * red one low on the opposite side, and monitor grid paper that fades out
 * toward the edges. Purely decorative.
 */
export function DarkField({ glow = "right", grid = true }: { glow?: "right" | "left" | "center"; grid?: boolean }) {
  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          glow === "right" &&
            "bg-[radial-gradient(55%_55%_at_72%_40%,rgb(42_107_88/0.22),transparent_70%),radial-gradient(40%_40%_at_8%_100%,rgb(194_48_42/0.10),transparent_70%)]",
          glow === "left" &&
            "bg-[radial-gradient(55%_55%_at_22%_45%,rgb(42_107_88/0.22),transparent_70%),radial-gradient(40%_40%_at_95%_100%,rgb(194_48_42/0.10),transparent_70%)]",
          glow === "center" &&
            "bg-[radial-gradient(60%_60%_at_50%_45%,rgb(42_107_88/0.24),transparent_70%),radial-gradient(35%_35%_at_50%_110%,rgb(194_48_42/0.12),transparent_70%)]",
        )}
      />
      {grid ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#9ff0c4_1px,transparent_1px),linear-gradient(to_bottom,#9ff0c4_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.07] [mask-image:radial-gradient(ellipse_at_60%_45%,black_20%,transparent_75%)]"
        />
      ) : null}
    </>
  );
}
