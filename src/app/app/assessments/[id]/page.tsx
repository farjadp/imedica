import Link from "next/link";
import { notFound } from "next/navigation";

import { AttemptFlow, type AttemptData } from "@/components/assessments/attempt-flow";
import { getAttempt } from "@/server/assessments/taking";
import { HttpError, requireUserPage } from "@/server/auth/guards";

export const metadata = { title: "Assessment" };

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/app/assessments/${id}`);
  let data;
  try {
    data = await getAttempt(user, id);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <p className="text-[14px]">
        <Link href="/app/assessments" className="text-ink-3 hover:text-ink">
          ← Assessments
        </Link>
      </p>
      <AttemptFlow initial={JSON.parse(JSON.stringify(data)) as AttemptData} />
    </div>
  );
}
