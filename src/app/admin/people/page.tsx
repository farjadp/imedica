import Link from "next/link";

import { InlineAction, InlineSelect } from "@/components/app/inline-action";
import { EmptyState, PageHeader, Panel } from "@/components/app/page-header";
import { cn } from "@/lib/cn";
import { formatDate, roleLabel } from "@/lib/labels";
import { changeRole, revokeInvitation, setActive } from "@/server/admin/actions";
import { ORG_MANAGER_ROLES, requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";

import { InviteForm } from "./invite-form";

export const metadata = { title: "People" };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const user = await requireRolePage(ORG_MANAGER_ROLES, "/admin/people");
  const isAdmin = user.role === "ADMIN";
  const { org } = await searchParams;
  const orgId = isAdmin ? org || undefined : user.organizationId!;

  const [people, invites, organizations] = await Promise.all([
    db.user.findMany({
      where: orgId ? { organizationId: orgId } : {},
      orderBy: [{ active: "desc" }, { lastName: "asc" }],
      include: { organization: { select: { name: true } } },
    }),
    db.invitation.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() }, ...(orgId ? { organizationId: orgId } : {}) },
      orderBy: { createdAt: "desc" },
    }),
    isAdmin ? db.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : [],
  ]);

  const roleOptions = (isAdmin ? ["PARAMEDIC", "INSTRUCTOR", "PHYSICIAN", "ADMIN"] : ["PARAMEDIC", "INSTRUCTOR"]).map((r) => ({
    value: r,
    label: roleLabel[r],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description={
          isAdmin
            ? "Everyone with an Imedica account. Filter by organization to manage one service."
            : `Who can sign in for ${user.organizationName}. You never see anyone's individual results here.`
        }
      />

      {isAdmin ? (
        <nav aria-label="Filter by organization" className="flex flex-wrap gap-1">
          <Link
            href="/admin/people"
            className={cn("rounded-md px-3 py-1.5 text-[14px]", !orgId ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}
          >
            Everyone
          </Link>
          {organizations.map((o) => (
            <Link
              key={o.id}
              href={`/admin/people?org=${o.id}`}
              className={cn("rounded-md px-3 py-1.5 text-[14px]", orgId === o.id ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}
            >
              {o.name}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {people.length === 0 ? (
            <EmptyState title="No one yet" body="Invite your first paramedics. They'll get an email with a link to set their password." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-rule bg-card">
              <table className="w-full min-w-[640px] text-left text-[14px]">
                <thead className="border-b border-rule text-[12px] text-ink-3">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    {isAdmin ? <th className="px-4 py-3 font-medium">Organization</th> : null}
                    <th className="px-4 py-3 font-medium">Last sign-in</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule-2">
                  {people.map((p) => {
                    const self = p.id === user.id;
                    return (
                      <tr key={p.id} className={p.active ? "" : "text-ink-3"}>
                        <td className="px-4 py-3">
                          <p className={cn("font-medium", p.active ? "text-ink" : "text-ink-3 line-through")}>
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-[12px] text-ink-3">{p.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {self || !p.active ? (
                            roleLabel[p.role]
                          ) : (
                            <InlineSelect
                              action={changeRole}
                              fields={{ userId: p.id }}
                              name="role"
                              value={p.role}
                              options={roleOptions.some((o) => o.value === p.role) ? roleOptions : [{ value: p.role, label: roleLabel[p.role] }]}
                              label={`Role for ${p.firstName} ${p.lastName}`}
                            />
                          )}
                        </td>
                        {isAdmin ? <td className="px-4 py-3 text-ink-2">{p.organization?.name ?? "Imedica"}</td> : null}
                        <td className="px-4 py-3 text-ink-3">{p.lastLoginAt ? formatDate(p.lastLoginAt) : "Never"}</td>
                        <td className="px-4 py-3 text-right">
                          {self ? (
                            <span className="text-[12px] text-ink-3">You</span>
                          ) : (
                            <InlineAction
                              action={setActive}
                              fields={{ userId: p.id, active: p.active ? "false" : "true" }}
                              label={p.active ? "Deactivate" : "Reactivate"}
                              confirmText={p.active ? `Deactivate ${p.firstName}? They'll be signed out everywhere.` : undefined}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {invites.length ? (
            <Panel title="Pending invitations">
              <ul className="divide-y divide-rule-2">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
                    <span>
                      <span className="text-ink">{i.email}</span>
                      <span className="text-ink-3"> · {roleLabel[i.role]} · expires {formatDate(i.expiresAt)}</span>
                    </span>
                    <InlineAction action={revokeInvitation} fields={{ invitationId: i.id }} label="Revoke" />
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>

        <Panel title="Invite someone">
          <InviteForm isAdmin={isAdmin} organizations={organizations} defaultOrganizationId={orgId} />
        </Panel>
      </div>
    </div>
  );
}
