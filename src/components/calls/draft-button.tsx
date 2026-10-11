"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api-client";

type Result = { scenarioId: string; notes: string[]; problems: string[] };

/** Asks Claude for a scenario draft from this call, then links to it with the reviewer notes. */
export function DraftButton({
  callId,
  aiReady,
  draftScenarioId,
  notes,
}: {
  callId: string;
  aiReady: boolean;
  draftScenarioId: string | null;
  notes: string[];
}) {
  const [result, setResult] = useState<Result | null>(draftScenarioId ? { scenarioId: draftScenarioId, notes, problems: [] } : null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function draft() {
    setPending(true);
    setError(null);
    try {
      setResult(await api<Result>("POST", `/calls/${callId}/draft`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The draft couldn't be written.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-pine-3/40 bg-card p-5">
      <FormError message={error} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[60ch] text-[14px] text-ink-2">
          Claude reads this call and drafts a scenario scored against the Ontario ALS PCS: states with vitals, an action menu
          and rules. It lands in Scenarios as your draft. Takes about a minute.
        </p>
        <Button onClick={draft} pending={pending} disabled={!aiReady}>
          <Sparkles className="size-4" /> {result ? "Draft again" : "Draft a scenario"}
        </Button>
      </div>
      {!aiReady ? <p className="text-[13px] text-signal">Drafting needs ANTHROPIC_API_KEY on the server, and it isn&apos;t set.</p> : null}

      {result ? (
        <div className="space-y-2 border-t border-rule pt-3 text-[14px]">
          <Link href={`/admin/scenarios/${result.scenarioId}`} className="font-medium text-pine hover:underline">
            Open the draft scenario →
          </Link>
          {result.problems.length ? (
            <p className="text-ink-2">Before review: {result.problems.join(" ")}</p>
          ) : null}
          {result.notes.length ? (
            <div>
              <p className="text-[12px] font-medium text-ink-3 uppercase">Check before review</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-2">
                {result.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
