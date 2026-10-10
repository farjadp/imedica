"use client";

import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Panel } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { OutcomeTag } from "@/components/ui/outcome-tag";
import { api } from "@/lib/api-client";

import type { EditorScenario } from "./types";
import { useMutation } from "./use-mutation";

export function PublishTab({ scenario, me }: { scenario: EditorScenario; me: { id: string; role: string } }) {
  const router = useRouter();
  const m = useMutation();
  const mine = scenario.authorId === me.id;
  const ready = scenario.problems.length === 0;
  const actionLabel = new Map(scenario.actions.map((a) => [a.id, a.label]));
  const stateTitle = new Map(scenario.states.map((s) => [s.id, s.title]));

  const change = (action: string) => m.run(() => api("POST", `/scenarios/${scenario.id}/status`, { action }));
  const remove = async () => {
    if (!confirm("Delete this draft for good?")) return;
    if (await m.run(() => api("DELETE", `/scenarios/${scenario.id}`))) router.push("/admin/scenarios");
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
              {scenario.problems.map((p) => (
                <li key={p} className="flex gap-2 text-[14px] text-ink-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-tag-yellow" /> {p}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="How the call can unfold">
          <ol className="space-y-5">
            {scenario.states.map((s) => {
              const out = scenario.rules.filter((r) => r.fromStateId === s.id && r.toStateId);
              return (
                <li key={s.id}>
                  <p className="text-[14px] font-medium text-ink">
                    {s.title}
                    {s.isStart ? <span className="ml-2 text-[12px] font-normal text-pine-3">start</span> : null}
                    {s.isTerminal ? <span className="ml-2 text-[12px] font-normal text-ink-3">end</span> : null}
                  </p>
                  {out.length ? (
                    <ul className="mt-1.5 space-y-1 border-l border-rule pl-4">
                      {out.map((r) => (
                        <li key={r.id} className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
                          <OutcomeTag outcome={r.outcome} /> {actionLabel.get(r.actionId)}
                          <ArrowRight className="size-3.5 text-ink-3" /> {stateTitle.get(r.toStateId!)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel title="Status">
          <FormError message={m.error} />
          <div className="space-y-3 text-[14px] text-ink-2">
            {scenario.status === "DRAFT" ? (
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
            {scenario.status === "IN_REVIEW" ? (
              <>
                {mine && me.role !== "ADMIN" ? (
                  <p>Waiting for a second physician. You can still edit, or pull it back to draft.</p>
                ) : (
                  <>
                    <p>Check the rules and rationales against current directives, then publish to the library.</p>
                    <Button className="w-full" pending={m.pending} disabled={!ready} onClick={() => change("publish")}>
                      Publish to the library
                    </Button>
                  </>
                )}
                <Button className="w-full" variant="secondary" onClick={() => change("unpublish")}>
                  Back to draft
                </Button>
              </>
            ) : null}
            {scenario.status === "PUBLISHED" ? (
              <>
                <p>Live in the library. Unpublishing hides it from learners while you edit.</p>
                <Button className="w-full" variant="secondary" pending={m.pending} onClick={() => change("unpublish")}>
                  Unpublish to edit
                </Button>
              </>
            ) : null}
            {scenario.status === "ARCHIVED" ? (
              <Button className="w-full" variant="secondary" pending={m.pending} onClick={() => change("restore")}>
                Restore as draft
              </Button>
            ) : (
              <Button className="w-full" variant="ghost" onClick={() => confirm("Archive this scenario?") && change("archive")}>
                Archive
              </Button>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
