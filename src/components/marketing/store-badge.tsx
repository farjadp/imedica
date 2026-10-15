import { cn } from "@/lib/cn";
import { apps, type Store } from "@/lib/site";

// Brand glyphs from Simple Icons (CC0). Apple and Google ask for their marks
// to stay unaltered, so they're drawn as-is, in one colour.
export function StoreGlyph({ store, className }: { store: Store; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      {store === "ios" ? (
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      ) : (
        <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
      )}
    </svg>
  );
}

export const storeName = (store: Store) => (store === "ios" ? "App Store" : "Google Play");

const launchDay = new Date(`${apps.launchDate}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

/**
 * A store badge in the shape people recognise. Live: a link to the listing.
 * Not yet: the same badge, quieter, saying when, and not a link.
 */
export function StoreBadge({ store, tone = "dark", className }: { store: Store; tone?: "dark" | "light"; className?: string }) {
  const url = apps[store].url;
  const body = (
    <>
      <StoreGlyph store={store} className="size-[26px] shrink-0" />
      <span className="text-left leading-none">
        <span className="block text-[11px] tracking-[0.01em] opacity-75">
          {url ? (store === "ios" ? "Download on the" : "Get it on") : `Coming ${launchDay} to`}
        </span>
        <span className="mt-1 block text-[19px] font-semibold tracking-[-0.01em]">{storeName(store)}</span>
      </span>
    </>
  );
  const shape = "inline-flex h-[58px] min-w-[184px] items-center gap-3 rounded-[14px] border px-4 transition-[background-color,border-color,transform] duration-200";
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Imedica on the ${storeName(store)}`}
        className={cn(
          shape,
          "hover:-translate-y-0.5",
          tone === "dark" ? "border-white/80 bg-black text-white hover:border-[#9ff0c4]" : "border-black bg-black text-white hover:bg-pine",
          className,
        )}
      >
        {body}
      </a>
    );
  }
  return (
    <span
      aria-label={`${storeName(store)}: coming ${launchDay}`}
      className={cn(
        shape,
        "cursor-default border-dashed",
        tone === "dark" ? "border-white/25 bg-white/[0.03] text-paper/75" : "border-ink-3/50 text-ink-2",
        className,
      )}
    >
      {body}
    </span>
  );
}
