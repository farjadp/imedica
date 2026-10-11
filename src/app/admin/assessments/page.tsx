import { Plus } from "lucide-react";
import Link from "next/link";

import { EmptyState, PageHeader, StatusPill } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/labels";
import { listAssessments } from "@/server/assessments/authoring";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";

export const metadata = { title: "Assessments" };

export default async function AssessmentsPage() {
  const user = await requireRolePage(CONTENT_ROLES, "/admin/assessments");
  const assessments = await listAssessments(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="A fixed set of scenarios and a short quiz that services run before and after training, to measure the change."
        actions={
          <ButtonLink href="/admin/assessments/new">
            <Plus className="size-4" /> New assessment
          </ButtonLink>
        }
      />

      {assessments.length === 0 ? (
        <EmptyState
          title="No assessments yet"
          body="Pick a few published scenarios and write five or more questions. A second physician publishes it."
          action={<ButtonLink href="/admin/assessments/new">New assessment</ButtonLink>}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rule bg-card">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="border-b border-rule text-[12px] text-ink-3">
              <tr>
                <th className="px-4 py-3 font-medium">Assessment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Scenarios</th>
                <th className="px-4 py-3 text-right font-medium">Questions</th>
                <th className="px-4 py-3 text-right font-medium">Taken</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-2">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/admin/assessments/${a.id}`} className="font-medium text-ink hover:underline">
                      {a.title}
                    </Link>
                    {a.authorId === user.id ? <p className="text-[12px] text-ink-3">yours</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-ink-2">{a.scenarioIds.length}</td>
                  <td className="px-4 py-3 text-right text-ink-2">{a.questionCount}</td>
                  <td className="px-4 py-3 text-right text-ink-2">{a.attemptCount}</td>
                  <td className="px-4 py-3 text-ink-3">{formatDate(a.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
