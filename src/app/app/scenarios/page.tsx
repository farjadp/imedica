import { Clock } from "lucide-react";
import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/app/page-header";
import { FormError } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { categoryLabel, difficultyLabel } from "@/lib/labels";
import { requireUserPage } from "@/server/auth/guards";
import { libraryFor } from "@/server/sessions/queries";

export const metadata = { title: "Scenario library" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ area?: string; error?: string }> }) {
  const user = await requireUserPage("/app/scenarios");
  const { area, error } = await searchParams;
  const library = await libraryFor(user);
  const areas = [...new Set(library.map((s) => s.category))];
  const shown = area ? library.filter((s) => s.category === area) : library;

  return (
    <div className="space-y-6">
      <PageHeader title="Scenario library" description="Every scenario is written by an emergency physician and checked by a second one." />
      <FormError message={error} />
      {areas.length > 1 ? (
        <nav aria-label="Clinical area" className="flex flex-wrap gap-1">
          <Link href="/app/scenarios" className={cn("rounded-md px-3 py-1.5 text-[14px]", !area ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}>
            All
          </Link>
          {areas.map((a) => (
            <Link
              key={a}
              href={`/app/scenarios?area=${a}`}
              className={cn("rounded-md px-3 py-1.5 text-[14px]", area === a ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}
            >
              {categoryLabel[a]}
            </Link>
          ))}
        </nav>
      ) : null}

      {shown.length === 0 ? (
        <EmptyState title="No scenarios here yet" body="Try another clinical area." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {shown.map((s) => (
            <li key={s.id}>
              <Link
                href={`/app/scenarios/${s.id}`}
                className="group flex h-full flex-col rounded-lg border border-rule bg-card p-5 transition-[border-color,box-shadow] hover:border-pine-3 hover:shadow-[var(--shadow-lift)]"
              >
                <p className="font-mono text-[11px] tracking-wider text-ink-3 uppercase">
                  {categoryLabel[s.category]} · {difficultyLabel[s.difficulty]}
                </p>
                <h2 className="mt-2 font-display text-[1.35rem] leading-snug font-medium text-ink">{s.title}</h2>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-2">{s.summary}</p>
                <div className="mt-4 flex items-center justify-between border-t border-rule-2 pt-3 text-[13px] text-ink-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {Math.round(s.timeLimitSec / 60)} min
                  </span>
                  <span>
                    {s.liveSessionId
                      ? "In progress"
                      : s.best !== null
                        ? `Best ${s.best}% · ${s.attempts} run${s.attempts > 1 ? "s" : ""}`
                        : "Not tried"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
