"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/button";
import { api } from "@/lib/api-client";

type Explanation = {
  summary: string;
  keyMoment: { decision: string; why: string };
  strengths: string[];
  improvements: { point: string; reference: string | null }[];
  practiseNext: string;
};
type Status = { status: "PENDING" | "READY" | "FAILED" | "SKIPPED"; content: Explanation | null };

const POLL_MS = 2500;
const GIVE_UP_MS = 90_000;

/** Polls until the explanation is written, then shows it. Fails quietly to nothing. */
export function AiExplanation({ sessionId, initial }: { sessionId: string; initial: Status | null }) {
  const [state, setState] = useState<Status>(initial ?? { status: "PENDING", content: null });
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (state.status !== "PENDING") return;
    const started = Date.now();
    const t = setInterval(async () => {
      if (Date.now() - started > GIVE_UP_MS) {
        setGaveUp(true);
        clearInterval(t);
        return;
      }
      try {
        const next = await api<Status>("GET", `/sessions/${sessionId}/explanation`);
        if (next.status !== "PENDING") {
          setState(next);
          clearInterval(t);
        }
      } catch {
        // keep polling; the network may come back
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [sessionId, state.status]);

  if (state.status === "SKIPPED" || state.status === "FAILED" || gaveUp) return null;

  return (
    <section className="rounded-lg border border-rule bg-card">
      <header className="flex items-center justify-between border-b border-rule px-5 py-3">
        <h2 className="inline-flex items-center gap-2 text-[15px] font-medium text-ink">
          <Sparkles className="size-4 text-pine-3" /> Debrief notes
        </h2>
        <span className="text-[12px] text-ink-3">Written by Claude from your physician&apos;s rules</span>
      </header>
      {state.status === "PENDING" || !state.content ? (
        <p className="flex items-center gap-2 px-5 py-6 text-[14px] text-ink-3">
          <Spinner /> Writing your debrief notes…
        </p>
      ) : (
        <div className="space-y-5 px-5 py-5 text-[15px] leading-relaxed text-ink-2">
          <p className="text-ink">{state.content.summary}</p>
          <div className="rounded-md bg-paper p-4">
            <p className="text-[13px] font-medium text-ink-3">The decision that mattered most</p>
            <p className="mt-1 font-medium text-ink">{state.content.keyMoment.decision}</p>
            <p className="mt-1">{state.content.keyMoment.why}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {state.content.strengths.length ? (
              <div>
                <h3 className="text-[13px] font-medium text-tag-green">What went well</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  {state.content.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {state.content.improvements.length ? (
              <div>
                <h3 className="text-[13px] font-medium text-tag-yellow">Next time</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  {state.content.improvements.map((i) => (
                    <li key={i.point}>
                      {i.point}
                      {i.reference ? <span className="block text-[13px] text-ink-3">{i.reference}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <p className="border-t border-rule-2 pt-4 text-[14px]">
            <span className="font-medium text-ink">Practise next:</span> {state.content.practiseNext}
          </p>
        </div>
      )}
    </section>
  );
}
