import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/app/page-header";
import { formatDateTime, roleLabel } from "@/lib/labels";
import { ORG_MANAGER_ROLES, requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Audit log" };

const PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireRolePage(ORG_MANAGER_ROLES, "/admin/audit");
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const where = user.role === "ADMIN" ? {} : { organizationId: user.organizationId };

  const [entries, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.auditLog.count({ where }),
  ]);
  const actors = await db.user.findMany({
    where: { id: { in: entries.map((e) => e.actorId).filter((v): v is string => Boolean(v)) } },
    select: { id: true, firstName: true, lastName: true },
  });
  const name = new Map(actors.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description={user.role === "ADMIN" ? "Every recorded action across Imedica." : "Sign-ins, invitations and account changes at your service."}
      />
      {entries.length === 0 ? (
        <EmptyState title="No entries" body="Actions will be recorded here as people use Imedica." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rule bg-card">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-rule text-[12px] text-ink-3">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-2">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="tabular px-4 py-2.5 whitespace-nowrap text-ink-3">{formatDateTime(e.createdAt)}</td>
                  <td className="px-4 py-2.5 text-ink">
                    {e.actorId ? (name.get(e.actorId) ?? "Removed user") : "Website visitor"}
                    {e.actorRole ? <span className="text-ink-3"> · {roleLabel[e.actorRole]}</span> : null}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-ink-2">{e.action}</td>
                  <td className="px-4 py-2.5 text-ink-3">{e.targetType ? `${e.targetType}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between text-[14px]">
          {page > 1 ? <Link href={`?page=${page - 1}`} className="text-pine-3 hover:underline">← Newer</Link> : <span />}
          <span className="text-ink-3">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={`?page=${page + 1}`} className="text-pine-3 hover:underline">Older →</Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
