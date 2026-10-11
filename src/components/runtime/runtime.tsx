"use client";

import { Radio, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { LogoMark } from "@/components/brand/logo";
import { EcgTrace } from "@/components/clinical/ecg-trace";
import { rhythmLabel, type Rhythm } from "@/components/clinical/ecg";
import { ECG_CREDIT, pickStrip } from "@/components/clinical/ecg-strips";
import { Button } from "@/components/ui/button";
import { OutcomeTag } from "@/components/ui/outcome-tag";
import type { Outcome } from "@/generated/prisma/enums";
import { ApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { actionCategoryLabel, clock } from "@/lib/labels";
import type { Vitals } from "@/lib/validators/scenario";

export type RuntimeData = {
  id: string;
  status: string;
  startedAt: string;
  serverNow: string;
  scenario: {
    id: string;
    title: string;
    dispatch: string;
    timeLimitSec: number;
    actions: { id: string; category: string; label: string; detail: string | null }[];
  };
  state: { id: string; title: string; narrative: string; vitals: Vitals; isTerminal: boolean } | null;
  // Assessment runs come without verdicts (outcome null) until the post-test is done.
  assessment?: boolean;
  decisions: { id: string; actionId: string; outcome: Outcome | null; elapsedMs: number }[];
};

type Verdict = { outcome: Outcome | null; late: boolean; repeated: boolean; ended: boolean };

function VitalCell({ label, value, unit, alarm }: { label: string; value: string; unit?: string; alarm?: boolean }) {
  return (
    <div className="px-4 py-3">
      <dt className="font-mono text-[10px] tracking-wider text-paper/55 uppercase">{label}</dt>
      <dd className={cn("tabular font-mono text-[1.7rem] leading-tight font-medium transition-colors", alarm ? "text-[#ff7b6f]" : "text-[#9ff0c4]")}>
        {value}
        {unit ? <span className="ml-1 text-[11px] font-normal text-paper/45">{unit}</span> : null}
      </dd>
    </div>
  );
}

export function Runtime({ initial }: { initial: RuntimeData }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<(Verdict & { label: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const ending = useRef(false);
  const [ended, setEnded] = useState(false);

  // Server clock is the authority; this offset corrects for a skewed device clock.
  const [offset] = useState(() => new Date(initial.serverNow).getTime() - Date.now());
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 250);
    return () => clearInterval(t);
  }, [offset]);

  const elapsed = now - new Date(data.startedAt).getTime();
  const remaining = data.scenario.timeLimitSec * 1000 - elapsed;
  const actionLabel = useMemo(() => new Map(data.scenario.actions.map((a) => [a.id, a])), [data.scenario.actions]);

  async function finish() {
    if (ending.current) return;
    ending.current = true;
    setEnded(true);
    try {
      await api("POST", `/sessions/${data.id}/end`);
    } catch {
      // The review page will show whatever state the run ended in.
    }
    router.push(`/app/review/${data.id}`);
  }

  useEffect(() => {
    if (remaining <= 0) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0]);

  async function act(actionId: string) {
    setPending(actionId);
    setError(null);
    try {
      const v = await api<Verdict>("POST", `/sessions/${data.id}/decisions`, { actionId });
      setVerdict({ ...v, label: actionLabel.get(actionId)?.label ?? "" });
      if (v.ended) {
        ending.current = true;
        setEnded(true);
        setTimeout(() => router.push(`/app/review/${data.id}`), 1400);
      }
      setData(await api<RuntimeData>("GET", `/sessions/${data.id}`));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        router.push(`/app/review/${data.id}`);
        return;
      }
      setError(err instanceof ApiError ? err.message : "That didn't go through. Try again.");
    } finally {
      setPending(null);
    }
  }

  const v = data.state?.vitals ?? {};
  const rhythm = (v.rhythm ?? "sinus") as Rhythm;
  const low = remaining < 60_000;
  const categories = [...new Set(data.scenario.actions.map((a) => a.category))];
  const shown = filter === "ALL" ? data.scenario.actions : data.scenario.actions.filter((a) => a.category === filter);

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-rule bg-paper px-4 md:px-6">
        <LogoMark className="size-6" />
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">{data.scenario.title}</p>
        <p
          className={cn("tabular rounded-md px-2.5 py-1 font-mono text-[15px] font-medium", low ? "bg-signal-wash text-signal" : "text-ink")}
          aria-live="off"
          aria-label={`Time remaining ${clock(remaining)}`}
        >
          {clock(remaining)}
        </p>
        <Button variant="secondary" size="sm" onClick={() => confirm("Hand over care and end this run?") && finish()}>
          Hand over
        </Button>
        <Link href="/app" aria-label="Leave and come back later" className="hidden text-ink-3 hover:text-ink sm:block">
          <X className="size-5" />
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-[1280px] flex-1 grid-cols-[minmax(0,1fr)] gap-5 p-4 md:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Left: the patient */}
        <section className="space-y-4">
          <div className="rounded-lg border border-rule bg-card">
            <p className="flex items-center gap-2 border-b border-rule px-4 py-2 font-mono text-[11px] tracking-wider text-ink-3 uppercase">
              <Radio className="size-3.5" /> Dispatch
            </p>
            <p className="px-4 py-3 text-[14px] leading-relaxed text-ink-2">{data.scenario.dispatch}</p>
          </div>

          {data.state ? (
            <article key={data.state.id} className="rounded-lg border border-rule bg-card p-5 motion-safe:animate-[verdict-in_420ms_var(--ease-out-expo)]">
              <h1 className="font-display text-[1.6rem] leading-tight font-medium text-ink">{data.state.title}</h1>
              <p className="mt-2 text-[16px] leading-relaxed text-ink">{data.state.narrative}</p>
              {v.skin ? <p className="mt-3 text-[14px] text-ink-3">Skin: {v.skin}</p> : null}
            </article>
          ) : null}

          {/* Monitor: dark like the real thing, in an otherwise paper world. */}
          <div className="overflow-hidden rounded-lg bg-[#0d1513] text-paper shadow-[var(--shadow-float)]">
            <div className="flex items-center justify-between px-4 pt-3 font-mono text-[10px] tracking-wider text-paper/55 uppercase">
              <span>II · {rhythmLabel[rhythm]}</span>
              <span>Monitor</span>
            </div>
            <EcgTrace rhythm={rhythm} height={96} stroke="#9ff0c4" className="mx-1" real hr={v.hr} strip={v.ecgStrip} />
            {pickStrip(rhythm) ? <p className="px-4 pb-1 text-right font-mono text-[9px] text-paper/35">{ECG_CREDIT}</p> : null}
            <dl className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 sm:grid-cols-4">
              <VitalCell label="HR" value={v.hr != null ? String(v.hr) : "--"} unit="bpm" alarm={v.hr != null && (v.hr > 120 || v.hr < 50)} />
              <VitalCell
                label="NIBP"
                value={v.sbp != null ? `${v.sbp}/${v.dbp ?? "--"}` : "--"}
                unit="mmHg"
                alarm={v.sbp != null && v.sbp < 90}
              />
              <VitalCell label="SpO₂" value={v.spo2 != null ? String(v.spo2) : "--"} unit="%" alarm={v.spo2 != null && v.spo2 < 92} />
              <VitalCell label="RR" value={v.rr != null ? String(v.rr) : "--"} unit="/min" alarm={v.rr != null && (v.rr > 28 || v.rr < 8)} />
            </dl>
            {v.gcs != null || v.glucose != null || v.etco2 != null || v.temp != null ? (
              <p className="border-t border-white/10 px-4 py-2 font-mono text-[12px] text-paper/70">
                {[
                  v.gcs != null ? `GCS ${v.gcs}` : null,
                  v.glucose != null ? `BGL ${v.glucose} mmol/L` : null,
                  v.etco2 != null ? `EtCO₂ ${v.etco2}` : null,
                  v.temp != null ? `T ${v.temp}°C` : null,
                ]
                  .filter(Boolean)
                  .join("   ·   ")}
              </p>
            ) : null}
          </div>

          {data.decisions.length ? (
            <div className="rounded-lg border border-rule bg-card">
              <p className="border-b border-rule px-4 py-2 text-[13px] font-medium text-ink-2">Your decisions</p>
              <ol className="max-h-56 divide-y divide-rule-2 overflow-y-auto">
                {[...data.decisions].reverse().map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-4 py-2 text-[14px]">
                    <span className="tabular w-11 font-mono text-[12px] text-ink-3">{clock(d.elapsedMs)}</span>
                    <span className="flex-1 text-ink">{actionLabel.get(d.actionId)?.label}</span>
                    {d.outcome ? <OutcomeTag outcome={d.outcome} /> : <span className="font-mono text-[11px] text-ink-3">Recorded</span>}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>

        {/* Right: what you can do */}
        <section className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div aria-live="polite" className="min-h-[64px]">
            {verdict ? (
              <div
                key={`${verdict.label}-${data.decisions.length}`}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 motion-safe:animate-[verdict-in_360ms_var(--ease-out-expo)]",
                  verdict.outcome === null
                    ? "border-rule bg-paper-2"
                    : verdict.outcome === "HARMFUL" || verdict.outcome === "CRITICAL"
                    ? "border-tag-red/30 bg-tag-red-wash"
                    : verdict.outcome === "SUBOPTIMAL"
                      ? "border-tag-yellow/30 bg-tag-yellow-wash"
                      : "border-tag-green/30 bg-tag-green-wash",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{verdict.label}</p>
                  <p className="text-[12px] text-ink-2">
                    {verdict.outcome === null
                      ? verdict.ended
                        ? "The call is over. Results open once the post-test is handed in."
                        : "Recorded. Results open once the post-test is handed in."
                      : verdict.ended
                      ? "The call is over. Opening your debrief…"
                      : verdict.late
                        ? "Right call, but later than it should have been."
                        : verdict.repeated
                          ? "Already done. No extra credit."
                          : "The reason is in your debrief."}
                  </p>
                </div>
                {verdict.outcome ? <OutcomeTag outcome={verdict.outcome} /> : null}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-rule px-4 py-3 text-[14px] text-ink-3">
                Choose your actions. Each one is scored the moment you make it.
              </p>
            )}
          </div>

          {error ? <p className="text-[13px] text-tag-red">{error}</p> : null}

          <div className="rounded-lg border border-rule bg-card">
            <div className="flex gap-1 overflow-x-auto border-b border-rule p-2">
              {["ALL", ...categories].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilter(c)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[13px] whitespace-nowrap",
                    filter === c ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2",
                  )}
                >
                  {c === "ALL" ? "All" : actionCategoryLabel[c]}
                </button>
              ))}
            </div>
            <ul className="grid gap-2 p-3 sm:grid-cols-2">
              {shown.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    disabled={pending !== null || ended}
                    onClick={() => act(a.id)}
                    className={cn(
                      "flex h-full w-full flex-col items-start rounded-md border border-rule bg-card px-3 py-2.5 text-left transition-[border-color,background-color] duration-150 hover:border-pine-3 hover:bg-pine-wash disabled:cursor-wait",
                      pending === a.id && "border-pine-3 bg-pine-wash",
                    )}
                  >
                    <span className="font-mono text-[10px] tracking-wider text-ink-3 uppercase">{actionCategoryLabel[a.category]}</span>
                    <span className="mt-0.5 text-[14px] leading-snug font-medium text-ink">{a.label}</span>
                    {a.detail ? <span className="text-[12px] text-ink-3">{a.detail}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
