import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const btn = "inline-flex h-11 items-center gap-2 rounded-full border border-rule px-5 text-[15px] text-ink transition-colors hover:border-ink";
  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-between border-t border-rule pt-8">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={btn}>
          <ArrowLeft className="size-4" /> Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="tabular font-mono text-[12px] tracking-[0.12em] text-ink-3 uppercase">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} rel="next" className={btn}>
          Older <ArrowRight className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
