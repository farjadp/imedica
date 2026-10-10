import Link from "next/link";
import { notFound } from "next/navigation";

import { ScenarioEditor } from "@/components/editor/scenario-editor";
import type { EditorScenario } from "@/components/editor/types";
import { CONTENT_ROLES, HttpError, requireRolePage } from "@/server/auth/guards";
import { getScenarioFull } from "@/server/scenarios/service";

export const metadata = { title: "Edit scenario" };

export default async function EditScenarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRolePage(CONTENT_ROLES, "/admin/scenarios");
  const { id } = await params;
  const { tab } = await searchParams;

  let scenario;
  try {
    scenario = await getScenarioFull(user, id);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <p className="text-[14px]">
        <Link href="/admin/scenarios" className="text-ink-3 hover:text-ink">
          ← Scenarios
        </Link>
      </p>
      <ScenarioEditor
        scenario={JSON.parse(JSON.stringify(scenario)) as EditorScenario}
        me={{ id: user.id, role: user.role }}
        initialTab={tab}
      />
    </div>
  );
}
