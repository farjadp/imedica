import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { categoryLabel, formatDateTime } from "@/lib/labels";
import { requireUserPage } from "@/server/auth/guards";
import { listMySessions } from "@/server/sessions/service";

export const metadata = { title: "My runs" };

export default async function HistoryPage() {
  const user = await requireUserPage("/app/history");
  const runs = await listMySessions(user, 100);

  return (
    <div className="space-y-6">
      <PageHeader title="My runs" description="Only you can see this list." />
      {runs.length === 0 ? (
        <EmptyState
          title="No runs yet"
          body="Pick a scenario from the library. It takes about ten minutes."
          action={<ButtonLink href="/app/scenarios">Open the library</ButtonLink>}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rule bg-card">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="border-b border-rule text-[12px] text-ink-3">
              <tr>
                <th className="px-4 py-3 font-medium">Scenario</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-2">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link
                      href={r.status === "IN_PROGRESS" ? `/run/${r.id}` : `/app/review/${r.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {r.scenario.title}
                    </Link>
                    {r.status === "IN_PROGRESS" ? <span className="ml-2 text-[12px] text-signal">in progress</span> : null}
                    {r.status === "TIMED_OUT" ? <span className="ml-2 text-[12px] text-ink-3">timed out</span> : null}
                  </td>
                  <td className="px-4 py-3 text-ink-2">{categoryLabel[r.scenario.category]}</td>
                  <td className="px-4 py-3 text-ink-3">{formatDateTime(r.startedAt)}</td>
                  <td className="tabular px-4 py-3 text-right font-mono text-ink">{r.status === "IN_PROGRESS" ? "—" : `${r.percent}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
