import Link from "next/link";
import { notFound } from "next/navigation";

import { DraftButton } from "@/components/calls/draft-button";
import { CONTENT_ROLES, HttpError, requireRolePage } from "@/server/auth/guards";
import { getCall } from "@/server/calls/service";
import { env } from "@/server/env";
import { internalDatasetsEnabled } from "@/server/question-bank/service";

export const metadata = { title: "Call transcript" };

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  if (!internalDatasetsEnabled()) notFound();
  const user = await requireRolePage(CONTENT_ROLES, "/admin/calls");
  const { id } = await params;

  let call;
  try {
    call = await getCall(user, id);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <p className="text-[14px]">
        <Link href="/admin/calls" className="text-ink-3 hover:text-ink">
          ← Call transcripts
        </Link>
      </p>
      <header className="space-y-2">
        <p className="font-mono text-[11px] tracking-wider text-ink-3 uppercase">
          {call.source === "EMSDialog-real" ? "Real call, de-identified" : "Synthetic call"} · {call.sourceKey} · {call.turnCount} turns
        </p>
        <h1 className="font-display text-[1.8rem] leading-tight font-medium text-ink">{call.protocol}</h1>
      </header>

      <DraftButton
        callId={call.id}
        aiReady={Boolean(env().ANTHROPIC_API_KEY)}
        draftScenarioId={call.draftScenarioId}
        notes={call.draftNotes}
      />

      <ol className="space-y-2 rounded-lg border border-rule bg-card p-5">
        {call.turns.map((t, i) => (
          <li key={i} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3 text-[14px] leading-relaxed">
            <span className="truncate font-mono text-[11px] tracking-wide text-ink-3 uppercase">{t.role}</span>
            <span className="text-ink-2">{t.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
