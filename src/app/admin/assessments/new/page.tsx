import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { AssessmentBasicsForm } from "@/components/assessments/basics-form";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";

import { scenarioOptions } from "../scenario-options";

export const metadata = { title: "New assessment" };

export default async function NewAssessmentPage() {
  await requireRolePage(CONTENT_ROLES, "/admin/assessments/new");
  const scenarios = await scenarioOptions();
  return (
    <div className="space-y-6">
      <p className="text-[14px]">
        <Link href="/admin/assessments" className="text-ink-3 hover:text-ink">
          ← Assessments
        </Link>
      </p>
      <PageHeader title="New assessment" description="Name it and choose the scenarios. You'll write the quiz next." />
      <div className="max-w-3xl">
        <AssessmentBasicsForm scenarios={scenarios} />
      </div>
    </div>
  );
}
