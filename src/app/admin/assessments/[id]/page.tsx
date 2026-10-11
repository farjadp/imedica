import Link from "next/link";
import { notFound } from "next/navigation";

import { AssessmentEditor } from "@/components/assessments/assessment-editor";
import type { EditorAssessment } from "@/components/assessments/types";
import { getAssessment } from "@/server/assessments/authoring";
import { CONTENT_ROLES, HttpError, requireRolePage } from "@/server/auth/guards";

import { scenarioOptions } from "../scenario-options";

export const metadata = { title: "Edit assessment" };

export default async function EditAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRolePage(CONTENT_ROLES, "/admin/assessments");
  const { id } = await params;
  const { tab } = await searchParams;

  let assessment;
  try {
    assessment = await getAssessment(user, id);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  const scenarios = await scenarioOptions(assessment.scenarioIds);

  return (
    <div className="space-y-6">
      <p className="text-[14px]">
        <Link href="/admin/assessments" className="text-ink-3 hover:text-ink">
          ← Assessments
        </Link>
      </p>
      <AssessmentEditor
        assessment={JSON.parse(JSON.stringify(assessment)) as EditorAssessment}
        scenarios={scenarios}
        me={{ id: user.id, role: user.role }}
        initialTab={tab}
      />
    </div>
  );
}
