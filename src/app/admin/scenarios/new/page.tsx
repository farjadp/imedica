import Link from "next/link";

import { BasicsForm } from "@/components/editor/basics-form";
import { PageHeader } from "@/components/app/page-header";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";

export const metadata = { title: "New scenario" };

export default async function NewScenarioPage() {
  await requireRolePage(CONTENT_ROLES, "/admin/scenarios/new");
  return (
    <div className="space-y-6">
      <p className="text-[14px]">
        <Link href="/admin/scenarios" className="text-ink-3 hover:text-ink">
          ← Scenarios
        </Link>
      </p>
      <PageHeader
        title="New scenario"
        description="Start with the call itself. You'll add the moments, the action menu and the rules next."
      />
      <div className="max-w-3xl">
        <BasicsForm />
      </div>
    </div>
  );
}
