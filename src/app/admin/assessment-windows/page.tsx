import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/app/page-header";
import { ReportPanel } from "@/components/assessments/report-panel";
import { CloseWindow, OpenWindow } from "@/components/assessments/window-actions";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/labels";
import { assessmentReport } from "@/server/assessments/report";
import { listWindows } from "@/server/assessments/windows";
import { ORG_MANAGER_ROLES, requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Pre/post tests" };

type Win = {
  id: string;
  opensAt: Date;
  closesAt: Date | null;
  open: boolean;
  completed: number | null;
  suppressed: boolean;
} | null;

function Phase({ label, win, k }: { label: string; win: Win; k: number }) {
  return (
    <div className="space-y-1">
      <p className="text-[13px] font-medium text-ink-2">{label}</p>
      {win ? (
        <>
          <p className="text-[14px] text-ink">
            {win.open ? "Open" : "Closed"} · since {formatDate(win.opensAt)}
            {win.closesAt && !win.open ? ` to ${formatDate(win.closesAt)}` : ""}
          </p>
          <p className="text-[13px] text-ink-3">{win.suppressed ? `Fewer than ${k} finished` : `${win.completed} finished`}</p>
        </>
      ) : (
        <p className="text-[14px] text-ink-3">Not opened</p>
      )}
    </div>
  );
}

export default async function AssessmentWindowsPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const user = await requireRolePage(ORG_MANAGER_ROLES, "/admin/assessment-windows");
  const { org } = await searchParams;
  const isAdmin = user.role === "ADMIN";
  const organizations = isAdmin
    ? await db.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];
  const orgId = isAdmin ? (org ?? organizations[0]?.id) : user.organizationId;

  if (!orgId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pre/post tests" />
        <EmptyState
          title="No organization"
          body={isAdmin ? "Add an organization first." : "Your account isn't attached to a service."}
        />
      </div>
    );
  }

  const data = await listWindows(user, orgId);
  const scoped = isAdmin ? orgId : undefined;
  // A report only makes sense once the after round has opened.
  const reports = new Map(
    await Promise.all(
      data.assessments.filter((a) => a.post).map(async (a) => [a.id, await assessmentReport(user, a.id, orgId)] as const),
    ),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pre/post tests"
        description="Open the before-training round for your team, train, then open the after-training round. You see team totals once at least five people have done both, never anyone's own result."
      />

      {isAdmin ? (
        <nav aria-label="Organization" className="flex flex-wrap gap-1">
          {organizations.map((x) => (
            <Link
              key={x.id}
              href={`?org=${x.id}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-[14px]",
                x.id === orgId ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2",
              )}
            >
              {x.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {data.assessments.length === 0 ? (
        <EmptyState
          title="No assessments published yet"
          body="Imedica's physicians publish them. They'll appear here when ready."
        />
      ) : (
        <ul className="space-y-4">
          {data.assessments.map((a) => (
            <li key={a.id} className="rounded-lg border border-rule bg-card p-5">
              <h2 className="text-[17px] font-medium text-ink">{a.title}</h2>
              <p className="mt-1 text-[14px] text-ink-2">{a.summary}</p>
              <p className="mt-1 text-[13px] text-ink-3">
                {a.questionCount} questions · {a.scenarioCount} scenario{a.scenarioCount === 1 ? "" : "s"} · about{" "}
                {a.scenarioCount * 12 + Math.ceil(a.questionCount / 2)} minutes per person
              </p>

              <div className="mt-5 grid gap-5 border-t border-rule-2 pt-5 sm:grid-cols-2">
                <div className="space-y-3">
                  <Phase label="Before training" win={a.pre} k={data.kAnonymity} />
                  {!a.pre ? (
                    <OpenWindow
                      assessmentId={a.id}
                      phase="PRE"
                      organizationId={scoped}
                      label="Open the before round"
                      confirmText="Open the before-training round for your whole team?"
                    />
                  ) : a.pre.open && !a.post ? (
                    <CloseWindow windowId={a.pre.id} />
                  ) : null}
                </div>
                <div className="space-y-3">
                  <Phase label="After training" win={a.post} k={data.kAnonymity} />
                  {a.pre && !a.post ? (
                    <OpenWindow
                      assessmentId={a.id}
                      phase="POST"
                      organizationId={scoped}
                      label="Open the after round"
                      confirmText="Open the after-training round? This closes the before round for good."
                    />
                  ) : a.post?.open ? (
                    <CloseWindow windowId={a.post.id} />
                  ) : null}
                </div>
              </div>

              {reports.get(a.id) ? (
                <div className="mt-5 border-t border-rule-2 pt-5">
                  <h3 className="mb-4 text-[15px] font-medium text-ink">Before and after</h3>
                  <ReportPanel report={reports.get(a.id)!} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
