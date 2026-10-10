import Link from "next/link";

import { InlineAction } from "@/components/app/inline-action";
import { PageHeader, Panel } from "@/components/app/page-header";
import { formatDate, orgTypeLabel } from "@/lib/labels";
import { updateOrganization } from "@/server/admin/actions";
import { requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";

import { OrgForm } from "./org-form";

export const metadata = { title: "Organizations" };

export default async function OrganizationsPage() {
  await requireRolePage(["ADMIN"], "/admin/organizations");
  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: { where: { active: true } } } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Organizations" description="Services licensed to use Imedica, and their seat limits." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-lg border border-rule bg-card">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="border-b border-rule text-[12px] text-ink-3">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Seats used</th>
                <th className="px-4 py-3 font-medium">Since</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-2">
              {orgs.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/people?org=${o.id}`} className="font-medium text-ink hover:underline">
                      {o.name}
                    </Link>
                    <p className="text-[12px] text-ink-3">
                      {o.province}
                      {o.active ? "" : " · turned off"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{orgTypeLabel[o.type]}</td>
                  <td className="tabular px-4 py-3 text-right text-ink-2">
                    {o._count.users} / {o.seatLimit}
                  </td>
                  <td className="px-4 py-3 text-ink-3">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <InlineAction
                      action={updateOrganization}
                      fields={{ organizationId: o.id, active: o.active ? "false" : "true" }}
                      label={o.active ? "Turn off" : "Turn on"}
                      confirmText={o.active ? `Turn off ${o.name}? Everyone there will be locked out.` : undefined}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Panel title="Add an organization">
          <OrgForm />
        </Panel>
      </div>
    </div>
  );
}
