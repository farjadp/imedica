import { EmptyState, PageHeader } from "@/components/app/page-header";
import { StartAttempt } from "@/components/assessments/start-attempt";
import { ButtonLink } from "@/components/ui/button";
import { myAssessments } from "@/server/assessments/taking";
import { requireUserPage } from "@/server/auth/guards";

export const metadata = { title: "Assessments" };

export default async function MyAssessmentsPage() {
  const user = await requireUserPage("/app/assessments");
  const open = await myAssessments(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Your service runs the same short assessment before and after training, to see what changed for the team. Your service only ever sees team totals, never your own results."
      />
      {open.length === 0 ? (
        <EmptyState title="Nothing open right now" body="When your training lead opens an assessment, it shows up here." />
      ) : (
        <ul className="space-y-3">
          {open.map((w) => (
            <li
              key={w.windowId}
              className="flex flex-col gap-4 rounded-lg border border-rule bg-card p-5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink-3">{w.phase === "PRE" ? "Before training" : "After training"}</p>
                <p className="mt-0.5 text-[17px] font-medium text-ink">{w.assessment.title}</p>
                <p className="mt-1 text-[14px] text-ink-2">
                  {w.assessment.questionCount} questions, then {w.assessment.scenarioCount} scenario
                  {w.assessment.scenarioCount === 1 ? "" : "s"}.
                </p>
              </div>
              {w.completed ? (
                <ButtonLink href={`/app/assessments/${w.attemptId}`} variant="secondary" size="sm">
                  Done · view
                </ButtonLink>
              ) : (
                <StartAttempt windowId={w.windowId} label={w.attemptId ? "Continue" : "Start"} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
