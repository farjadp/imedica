import { Clock, Radio } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button, ButtonLink } from "@/components/ui/button";
import { categoryLabel, difficultyLabel } from "@/lib/labels";
import { requireUserPage } from "@/server/auth/guards";
import { libraryFor } from "@/server/sessions/queries";
import { startRun } from "@/server/sessions/actions";

export const metadata = { title: "Scenario" };

export default async function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/app/scenarios/${id}`);
  const s = (await libraryFor(user)).find((x) => x.id === id);
  if (!s) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <p className="text-[14px]">
        <Link href="/app/scenarios" className="text-ink-3 hover:text-ink">
          ← Library
        </Link>
      </p>
      <header>
        <p className="font-mono text-[11px] tracking-wider text-ink-3 uppercase">
          {categoryLabel[s.category]} · {difficultyLabel[s.difficulty]}
        </p>
        <h1 className="mt-2 font-display text-[2.4rem] leading-[1.08] font-medium tracking-[-0.02em] text-ink">{s.title}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{s.summary}</p>
      </header>

      <section className="rounded-lg border border-rule bg-card">
        <div className="flex items-center gap-2 border-b border-rule bg-pine px-4 py-2.5 font-mono text-[11px] tracking-wider text-paper uppercase">
          <Radio className="size-3.5" /> Dispatch
        </div>
        <p className="px-5 py-4 text-[16px] leading-relaxed text-ink">{s.dispatch}</p>
      </section>

      {s.learningGoals.length ? (
        <section>
          <h2 className="text-[15px] font-medium text-ink">What this scenario trains</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] text-ink-2">
            {s.learningGoals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-[14px] text-ink-3">
          <p className="inline-flex items-center gap-1.5">
            <Clock className="size-4" /> {Math.round(s.timeLimitSec / 60)} minutes. The clock starts when you do.
          </p>
          {s.protocolSource ? <p>Follows: {s.protocolSource}</p> : null}
          {s.best !== null ? <p>Your best so far: {s.best}%</p> : null}
        </div>
        {s.liveSessionId ? (
          <ButtonLink href={`/run/${s.liveSessionId}`} size="lg">
            Return to the call
          </ButtonLink>
        ) : (
          <form action={startRun}>
            <input type="hidden" name="scenarioId" value={s.id} />
            <Button type="submit" size="lg">
              Start the call
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
