import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { type BankPage, QuestionBank } from "@/components/question-bank/question-bank";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";
import { EMS_MCQA } from "@/server/question-bank/ems-mcqa";
import { internalDatasetsEnabled, searchBank } from "@/server/question-bank/service";

export const metadata = { title: "Question bank" };

export default async function QuestionBankPage() {
  if (!internalDatasetsEnabled()) notFound();
  const user = await requireRolePage(CONTENT_ROLES, "/admin/question-bank");
  const initial = await searchBank(user, new URL("http://localhost/?level=paramedic"));
  const drafts = await db.assessment.findMany({
    where: { status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question bank"
        description={
          <>
            Multiple-choice questions from{" "}
            <a href={EMS_MCQA.page} className="underline" target="_blank" rel="noreferrer">
              EMS-MCQA
            </a>{" "}
            (Hugging Face) to copy into a draft assessment. Internal testing only: the dataset says MIT, but its questions come
            from Quizlet and exam-prep sites, so they aren&apos;t cleared for customers. Every question still needs a physician to
            check it against Ontario directives.
          </>
        }
      />
      <QuestionBank canImport={user.role === "ADMIN"} drafts={drafts} initial={JSON.parse(JSON.stringify(initial)) as BankPage} />
    </div>
  );
}
