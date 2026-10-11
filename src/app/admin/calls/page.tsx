import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { type CallsPage, CallList } from "@/components/calls/call-list";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";
import { EMSDIALOG } from "@/server/calls/emsdialog";
import { listCalls } from "@/server/calls/service";
import { internalDatasetsEnabled } from "@/server/question-bank/service";

export const metadata = { title: "Call transcripts" };

export default async function CallsPage() {
  if (!internalDatasetsEnabled()) notFound();
  const user = await requireRolePage(CONTENT_ROLES, "/admin/calls");
  const initial = await listCalls(user, new URL("http://localhost/"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call transcripts"
        description={
          <>
            EMS calls from{" "}
            <a href={EMSDIALOG.page} className="underline" target="_blank" rel="noreferrer">
              EMSDialog
            </a>{" "}
            (University of Virginia): de-identified real calls and synthetic ones written from patient care reports. Open
            one and have Claude draft a scenario from it, then edit and review it like any other. Internal testing only: the
            licence ({EMSDIALOG.licence}) doesn&apos;t allow commercial use without the authors&apos; permission.
          </>
        }
      />
      <CallList canImport={user.role === "ADMIN"} initial={JSON.parse(JSON.stringify(initial)) as CallsPage} />
    </div>
  );
}
