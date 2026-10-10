import { EmptyState, PageHeader } from "@/components/app/page-header";
import { InlineAction } from "@/components/app/inline-action";
import { formatDateTime } from "@/lib/labels";
import { markLeadHandled } from "@/server/admin/actions";
import { requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Demo requests" };

export default async function LeadsPage() {
  await requireRolePage(["ADMIN"], "/admin/leads");
  const leads = await db.demoRequest.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 100 });

  return (
    <div className="space-y-6">
      <PageHeader title="Demo requests" description="Requests from the website, newest first." />
      {leads.length === 0 ? (
        <EmptyState title="No requests yet" body="They'll appear here when someone fills in the demo form." />
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => (
            <li key={l.id} className={`rounded-lg border border-rule bg-card p-5 ${l.handled ? "opacity-60" : ""}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[15px] font-medium text-ink">
                    {l.name} · {l.organization}
                  </p>
                  <p className="text-[13px] text-ink-3">
                    {l.role} · {l.teamSize} paramedics ·{" "}
                    <a href={`mailto:${l.email}`} className="text-pine-3 underline">
                      {l.email}
                    </a>{" "}
                    · {formatDateTime(l.createdAt)}
                  </p>
                  {l.message ? <p className="mt-2 max-w-2xl text-[14px] text-ink-2">{l.message}</p> : null}
                </div>
                {l.handled ? (
                  <span className="text-[12px] text-ink-3">Handled</span>
                ) : (
                  <InlineAction action={markLeadHandled} fields={{ id: l.id }} label="Mark handled" variant="secondary" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
