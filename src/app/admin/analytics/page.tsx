import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { EmptyState, PageHeader, Panel } from "@/components/app/page-header";
import { TrendLine } from "@/components/charts/trend-line";
import { cn } from "@/lib/cn";
import { actionCategoryLabel, categoryLabel } from "@/lib/labels";
import { organizationReport } from "@/server/analytics/service";
import { ORG_MANAGER_ROLES, requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Team readiness" };

const RANGES = [30, 90, 180];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ org?: string; days?: string }> }) {
  const user = await requireRolePage(ORG_MANAGER_ROLES, "/admin/analytics");
  const { org, days: d } = await searchParams;
  const days = RANGES.includes(Number(d)) ? Number(d) : 90;
  const isAdmin = user.role === "ADMIN";

  const organizations = isAdmin ? await db.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : [];
  const orgId = isAdmin ? org ?? organizations[0]?.id : user.organizationId;
  const qs = (o: Record<string, string | number | undefined>) =>
    "?" + new URLSearchParams(Object.entries({ org: isAdmin ? orgId : undefined, days, ...o }).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();

  if (!orgId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Team readiness" />
        <EmptyState title="No organizations yet" body="Add an organization first." />
      </div>
    );
  }

  const report = await organizationReport(user, orgId, days);
  const o = report.overall;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team readiness"
        description="How the team performs by clinical area. Built only from de-identified runs, and never shown for fewer than five people."
      />

      {/* Filters: one row, above the charts. */}
      <div className="flex flex-wrap items-center gap-3">
        {isAdmin ? (
          <nav aria-label="Organization" className="flex flex-wrap gap-1">
            {organizations.map((x) => (
              <Link
                key={x.id}
                href={qs({ org: x.id })}
                className={cn("rounded-md px-3 py-1.5 text-[14px]", x.id === orgId ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}
              >
                {x.name}
              </Link>
            ))}
          </nav>
        ) : null}
        <nav aria-label="Time range" className="ml-auto flex rounded-md border border-rule bg-card p-0.5">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={qs({ days: r })}
              aria-current={r === days ? "page" : undefined}
              className={cn("rounded px-3 py-1 text-[13px]", r === days ? "bg-paper-2 text-ink" : "text-ink-3 hover:text-ink")}
            >
              {r} days
            </Link>
          ))}
        </nav>
      </div>

      {o.suppressed ? (
        <EmptyState
          title="Not enough people yet"
          body={`Fewer than ${report.kAnonymity} people have finished a scenario in the last ${days} days. Figures appear once at least ${report.kAnonymity} have, so no one can be singled out.`}
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Average score", `${o.averageScore}%`],
              ["Completed runs", o.runs],
              ["Runs with a harmful action", `${o.harmfulRate}%`],
              ["Runs missing a required step", `${o.missedRequiredRate}%`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-rule bg-card p-5">
                <p className="text-[13px] text-ink-3">{k}</p>
                <p className="tabular mt-1 font-display text-[2rem] leading-none font-medium text-ink">{v}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Average score by clinical area">
              <ul className="space-y-3.5">
                {report.byCategory.map((c) => (
                  <li key={c.category}>
                    <div className="flex items-baseline justify-between text-[14px]">
                      <span className="text-ink">{categoryLabel[c.category]}</span>
                      <span className="tabular font-mono text-[13px] text-ink-2">
                        {c.suppressed ? "fewer than 5 people" : `${c.averageScore}% · ${c.people} people`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 rounded-sm bg-paper-2">
                      {c.suppressed ? null : (
                        <div
                          className={cn("h-full rounded-r-[4px]", c.averageScore < 60 ? "bg-tag-yellow" : "bg-pine-3")}
                          style={{ width: `${c.averageScore}%` }}
                          title={`${categoryLabel[c.category]}: ${c.averageScore}%`}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12px] text-ink-3">Yellow marks an area averaging under 60%.</p>
            </Panel>

            <Panel title="Team average, week by week">
              <TrendLine
                points={report.weekly.map((w) => ({
                  label: new Date(w.week).toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
                  value: w.suppressed ? null : w.averageScore,
                }))}
              />
              <p className="mt-2 text-[12px] text-ink-3">Gaps are weeks with fewer than five people.</p>
            </Panel>
          </div>

          <Panel title="Where decisions go wrong">
            <p className="mb-4 text-[14px] text-ink-2">
              Share of decisions in each kind of action that came back suboptimal, harmful or critical.
            </p>
            <ol className="divide-y divide-rule-2">
              {report.problemActions.map((a) => (
                <li key={a.actionCategory} className="flex items-center gap-4 py-2.5 text-[14px]">
                  <span className="w-36 text-ink">{actionCategoryLabel[a.actionCategory]}</span>
                  {a.suppressed ? (
                    <span className="text-[13px] text-ink-3">fewer than 5 people</span>
                  ) : (
                    <>
                      <div className="h-2 flex-1 rounded-sm bg-paper-2">
                        <div className="h-full rounded-r-[4px] bg-ink-2" style={{ width: `${a.problemRate}%` }} />
                      </div>
                      <span className="tabular w-12 text-right font-mono text-[13px] text-ink-2">{a.problemRate}%</span>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </Panel>
        </>
      )}

      <p className="flex items-start gap-2 text-[13px] text-ink-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-pine-3" />
        These figures come from the analytics schema, which holds no names or emails. Individual results aren&apos;t
        available to anyone at your service.
      </p>
    </div>
  );
}
