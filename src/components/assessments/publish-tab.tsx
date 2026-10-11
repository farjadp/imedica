"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Panel } from "@/components/app/page-header";
import { useMutation } from "@/components/editor/use-mutation";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { api } from "@/lib/api-client";

import type { EditorAssessment, ScenarioOption } from "./types";

export function AssessmentPublishTab({
  assessment,
  scenarios,
  me,
}: {
  assessment: EditorAssessment;
  scenarios: ScenarioOption[];
  me: { id: string; role: string };
}) {
  const router = useRouter();
  const m = useMutation();
  const mine = assessment.authorId === me.id;
  const ready = assessment.problems.length === 0;
  const title = new Map(scenarios.map((s) => [s.id, s.title]));

  const change = (action: string) => m.run(() => api("POST", `/assessments/${assessment.id}/status`, { action }));
  const remove = async () => {
    if (!confirm("Delete this draft for good?")) return;
    if (await m.run(() => api("DELETE", `/assessments/${assessment.id}`))) router.push("/admin/assessments");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Panel title="Readiness">
          {ready ? (
            <p className="flex items-center gap-2 text-[14px] text-tag-green">
              <CheckCircle2 className="size-4" /> Every check passes. It can go to review.
            </p>
          ) : (
            <ul className="space-y-2">
              {assessment.problems.map((p) => (
                <li key={p} className="flex gap-2 text-[14px] text-ink-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-tag-yellow" /> {p}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="What paramedics take">
          <ol className="space-y-2 text-[14px] text-ink-2">
            <li>
              <span className="text-ink">Quiz:</span> {assessment.questions.length} question
              {assessment.questions.length === 1 ? "" : "s"}, one at a time, no answers shown.
            </li>
            {assessment.scenarioIds.map((id, i) => (
              <li key={id}>
                <span className="text-ink">Scenario {i + 1}:</span> {title.get(id) ?? "No longer published"}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[13px] text-ink-3">
            The same assessment is taken before and after training. Debriefs, quiz answers and rationales stay hidden until a
            paramedic finishes the second one.
          </p>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel title="Status">
          <FormError message={m.error} />
          <div className="space-y-3 text-[14px] text-ink-2">
            {assessment.status === "DRAFT" ? (
              <>
                <p>When it&apos;s ready, send it to another physician to check and publish.</p>
                <Button className="w-full" disabled={!ready} pending={m.pending} onClick={() => change("submit")}>
                  Send for review
                </Button>
                <Button className="w-full" variant="ghost" onClick={remove}>
                  Delete draft
                </Button>
              </>
            ) : null}
            {assessment.status === "IN_REVIEW" ? (
              <>
                {mine && me.role !== "ADMIN" ? (
                  <p>Waiting for a second physician. To change anything, pull it back to draft.</p>
                ) : (
                  <>
                    <p>Check every question and answer against current directives, then publish it for services to use.</p>
                    <Button className="w-full" pending={m.pending} disabled={!ready} onClick={() => change("publish")}>
                      Publish
                    </Button>
                  </>
                )}
                <Button className="w-full" variant="secondary" onClick={() => change("unpublish")}>
                  Back to draft
                </Button>
              </>
            ) : null}
            {assessment.status === "PUBLISHED" ? (
              <>
                <p>
                  Services can open it now. Changing it mid-pilot would make before and after incomparable, so edit with care.
                </p>
                <Button className="w-full" variant="secondary" pending={m.pending} onClick={() => change("unpublish")}>
                  Unpublish to edit
                </Button>
              </>
            ) : null}
            {assessment.status === "ARCHIVED" ? (
              <Button className="w-full" variant="secondary" pending={m.pending} onClick={() => change("restore")}>
                Restore as draft
              </Button>
            ) : (
              <Button className="w-full" variant="ghost" onClick={() => change("archive")}>
                Archive
              </Button>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
