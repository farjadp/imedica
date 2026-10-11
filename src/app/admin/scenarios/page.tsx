import { Plus } from "lucide-react";
import Link from "next/link";

import { InlineAction } from "@/components/app/inline-action";
import { EmptyState, PageHeader, StatusPill } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { categoryLabel, difficultyLabel, formatDate } from "@/lib/labels";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";
import { importLibrary } from "@/server/scenarios/library/actions";
import { missingFromLibrary } from "@/server/scenarios/library/missing";
import { listScenarios } from "@/server/scenarios/service";

export const metadata = { title: "Scenarios" };

const tabs = [
  { key: undefined, label: "All" },
  { key: "DRAFT", label: "Drafts" },
  { key: "IN_REVIEW", label: "In review" },
  { key: "PUBLISHED", label: "Published" },
  { key: "ARCHIVED", label: "Archived" },
] as const;

export default async function ScenariosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireRolePage(CONTENT_ROLES, "/admin/scenarios");
  const { status } = await searchParams;
  const active = tabs.find((t) => t.key === status)?.key;
  const [scenarios, missing] = await Promise.all([listScenarios(user, { status: active }), missingFromLibrary()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scenarios"
        description="Write a call, set its rules, and send it to a second physician to publish."
        actions={
          <>
            {missing.length ? (
              <InlineAction
                action={importLibrary}
                fields={{}}
                label={`Add ${missing.length} library scenario${missing.length === 1 ? "" : "s"}`}
                variant="secondary"
                confirmText={`Add ${missing.map((d) => d.title).join(", ")}? They arrive In review with you as author, so another physician must check and publish each one.`}
              />
            ) : null}
            <ButtonLink href="/admin/scenarios/new">
              <Plus className="size-4" /> New scenario
            </ButtonLink>
          </>
        }
      />

      <nav aria-label="Filter by status" className="flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.key ? `/admin/scenarios?status=${t.key}` : "/admin/scenarios"}
            aria-current={active === t.key ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-[14px] whitespace-nowrap",
              active === t.key ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {scenarios.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body="Start a scenario from a call you know well. You can save it as a draft and come back."
          action={<ButtonLink href="/admin/scenarios/new">New scenario</ButtonLink>}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rule bg-card">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead className="border-b border-rule text-[12px] text-ink-3">
              <tr>
                <th className="px-4 py-3 font-medium">Scenario</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">States</th>
                <th className="px-4 py-3 text-right font-medium">Rules</th>
                <th className="px-4 py-3 text-right font-medium">Runs</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-2">
              {scenarios.map((s) => (
                <tr key={s.id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/admin/scenarios/${s.id}`} className="font-medium text-ink hover:underline">
                      {s.title}
                    </Link>
                    <p className="text-[12px] text-ink-3">
                      {difficultyLabel[s.difficulty]}
                      {s.authorId === user.id ? " · yours" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{categoryLabel[s.category]}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-ink-2">{s._count.states}</td>
                  <td className="px-4 py-3 text-right text-ink-2">{s._count.rules}</td>
                  <td className="px-4 py-3 text-right text-ink-2">{s._count.sessions}</td>
                  <td className="px-4 py-3 text-ink-3">{formatDate(s.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
