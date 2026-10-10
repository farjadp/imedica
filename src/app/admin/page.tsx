import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageHeader, Panel } from "@/components/app/page-header";
import { requireRolePage, STAFF_ROLES } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Overview" };

function Figure({ label, value, href, note }: { label: string; value: string | number; href?: string; note?: string }) {
  const body = (
    <>
      <p className="text-[13px] text-ink-3">{label}</p>
      <p className="tabular mt-1 font-display text-[2.1rem] leading-none font-medium text-ink">{value}</p>
      {note ? <p className="mt-2 text-[13px] text-ink-3">{note}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="group block rounded-lg border border-rule bg-card p-5 transition-colors hover:border-pine-3">
      {body}
      <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-pine-3">
        Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  ) : (
    <div className="rounded-lg border border-rule bg-card p-5">{body}</div>
  );
}

export default async function AdminOverviewPage() {
  const user = await requireRolePage(STAFF_ROLES, "/admin");
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const authoring = user.role === "PHYSICIAN" || user.role === "ADMIN";
  const managing = user.role === "INSTRUCTOR" || user.role === "ADMIN";
  const orgFilter = user.role === "ADMIN" ? {} : { organizationId: user.organizationId ?? "__none__" };

  const [drafts, awaitingMe, published, flagged, aiCost, people, pendingInvites, org, leads] = await Promise.all([
    authoring ? db.scenario.count({ where: { status: "DRAFT", authorId: user.id } }) : 0,
    authoring ? db.scenario.count({ where: { status: "IN_REVIEW", authorId: { not: user.id } } }) : 0,
    db.scenario.count({ where: { status: "PUBLISHED" } }),
    authoring ? db.aiFeedback.count({ where: { review: "UNREVIEWED", status: "READY" } }) : 0,
    user.role === "ADMIN"
      ? db.aiFeedback.aggregate({ _sum: { costMicroUsd: true }, _count: true, where: { createdAt: { gte: monthStart } } })
      : null,
    managing ? db.user.count({ where: { ...orgFilter, active: true } }) : 0,
    managing ? db.invitation.count({ where: { ...orgFilter, acceptedAt: null, expiresAt: { gt: new Date() } } }) : 0,
    user.organizationId ? db.organization.findUnique({ where: { id: user.organizationId } }) : null,
    user.role === "ADMIN" ? db.demoRequest.count({ where: { handled: false } }) : 0,
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Good to see you, ${user.firstName}.`}
        description={
          user.role === "PHYSICIAN"
            ? "Your scenarios and what's waiting for a physician's eye."
            : user.role === "INSTRUCTOR"
              ? `${org?.name ?? "Your service"} at a glance.`
              : "Across every organization on Imedica."
        }
      />

      {authoring ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Figure label="Your drafts" value={drafts} href="/admin/scenarios?status=DRAFT" />
          <Figure label="Waiting for your review" value={awaitingMe} href="/admin/scenarios?status=IN_REVIEW" note="Written by another physician" />
          <Figure label="Published scenarios" value={published} href="/admin/scenarios?status=PUBLISHED" />
          <Figure label="AI explanations to review" value={flagged} href="/admin/ai" />
        </section>
      ) : null}

      {managing ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Figure
            label="Active people"
            value={people}
            note={org ? `of ${org.seatLimit} seats` : undefined}
            href="/admin/people"
          />
          <Figure label="Pending invitations" value={pendingInvites} href="/admin/people" />
          <Figure label="Scenarios in the library" value={published} />
          {user.role === "ADMIN" ? (
            <Figure label="Unanswered demo requests" value={leads} href="/admin/leads" />
          ) : (
            <Figure label="Team readiness" value="View" href="/admin/analytics" />
          )}
        </section>
      ) : null}

      {aiCost ? (
        <Panel title="AI explanations this month">
          <p className="text-[15px] text-ink-2">
            <span className="tabular font-medium text-ink">{aiCost._count}</span> explanations, costing{" "}
            <span className="tabular font-medium text-ink">${((aiCost._sum.costMicroUsd ?? 0) / 1e6).toFixed(2)}</span>{" "}
            USD in model usage.{" "}
            <Link href="/admin/ai" className="text-pine-3 underline">
              See the breakdown
            </Link>
            .
          </p>
        </Panel>
      ) : null}
    </div>
  );
}
