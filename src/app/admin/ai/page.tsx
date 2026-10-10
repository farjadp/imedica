import { EmptyState, PageHeader, Panel } from "@/components/app/page-header";
import { InlineAction } from "@/components/app/inline-action";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/labels";
import { reviewExplanation } from "@/server/admin/actions";
import type { Explanation } from "@/server/ai/feedback";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "AI review" };

const usd = (micro: number) => `$${(micro / 1e6).toFixed(micro < 10_000 ? 4 : 2)}`;

export default async function AiReviewPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireRolePage(CONTENT_ROLES, "/admin/ai");
  const { show } = await searchParams;
  const filter = show === "all" ? {} : show === "flagged" ? { review: "FLAGGED" as const } : { review: "UNREVIEWED" as const, status: "READY" as const };

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [items, month, statusCounts] = await Promise.all([
    db.aiFeedback.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { session: { select: { score: true, maxScore: true, scenario: { select: { title: true } } } } },
    }),
    db.aiFeedback.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { costMicroUsd: true, inputTokens: true, outputTokens: true, cacheReadTokens: true },
      _count: true,
    }),
    db.aiFeedback.groupBy({ by: ["status"], _count: true }),
  ]);
  const perRun = month._count ? Math.round((month._sum.costMicroUsd ?? 0) / month._count) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI review"
        description="Claude explains the rule engine's verdicts after each run. Read them against the scenario, approve the good ones, flag anything clinically off."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Explanations this month", String(month._count)],
          ["Model cost this month", usd(month._sum.costMicroUsd ?? 0)],
          ["Average per run", usd(perRun)],
          [
            "Tokens in / out",
            `${((month._sum.inputTokens ?? 0) / 1000).toFixed(1)}k / ${((month._sum.outputTokens ?? 0) / 1000).toFixed(1)}k`,
          ],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-rule bg-card p-5">
            <p className="text-[13px] text-ink-3">{k}</p>
            <p className="tabular mt-1 font-display text-[1.8rem] leading-none font-medium text-ink">{v}</p>
          </div>
        ))}
      </section>
      <p className="text-[13px] text-ink-3">
        Status across all runs:{" "}
        {statusCounts.map((s) => `${s._count} ${s.status.toLowerCase()}`).join(" · ") || "none yet"}. Skipped means no
        Anthropic API key was configured.
      </p>

      <nav aria-label="Filter" className="flex gap-1">
        {[
          [undefined, "To review"],
          ["flagged", "Flagged"],
          ["all", "All"],
        ].map(([k, l]) => (
          <a
            key={l}
            href={k ? `?show=${k}` : "?"}
            className={cn("rounded-md px-3 py-1.5 text-[14px]", show === k ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}
          >
            {l}
          </a>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState title="Nothing to review" body="New explanations appear here as paramedics finish runs." />
      ) : (
        <div className="space-y-4">
          {items.map((f) => {
            const c = f.content as Explanation | null;
            return (
              <Panel
                key={f.id}
                title={f.session.scenario.title}
                aside={
                  <span className="text-[12px] text-ink-3">
                    {formatDateTime(f.createdAt)} · {usd(f.costMicroUsd)} · {f.review.toLowerCase()}
                  </span>
                }
              >
                {c ? (
                  <div className="space-y-3 text-[14px] leading-relaxed text-ink-2">
                    <p className="text-ink">{c.summary}</p>
                    <p>
                      <span className="font-medium text-ink">Key moment: {c.keyMoment.decision}.</span> {c.keyMoment.why}
                    </p>
                    {c.improvements.length ? (
                      <ul className="list-disc space-y-1 pl-5">
                        {c.improvements.map((i) => (
                          <li key={i.point}>
                            {i.point}
                            {i.reference ? <span className="text-ink-3"> ({i.reference})</span> : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[14px] text-ink-3">{f.error ?? `Status: ${f.status.toLowerCase()}`}</p>
                )}
                {f.status === "READY" ? (
                  <div className="mt-4 flex justify-end gap-2 border-t border-rule-2 pt-3">
                    <InlineAction action={reviewExplanation} fields={{ feedbackId: f.id, decision: "FLAGGED" }} label="Flag" />
                    <InlineAction action={reviewExplanation} fields={{ feedbackId: f.id, decision: "APPROVED" }} label="Approve" variant="secondary" />
                  </div>
                ) : null}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
