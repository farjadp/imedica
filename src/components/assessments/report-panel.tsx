import { CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/cn";
import type { assessmentReport } from "@/server/assessments/report";

type Report = Awaited<ReturnType<typeof assessmentReport>>;
type Row = Report["scenarios"];

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

function Bars({ row, label }: { row: Extract<Row, { suppressed: false }>; label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] font-medium text-ink">{label}</p>
        <p className="tabular font-mono text-[13px] text-ink-2">
          {signed(row.delta!)} points{row.relativePct !== null ? ` · ${signed(row.relativePct)}%` : ""}
        </p>
      </div>
      {(
        [
          ["Before", row.preAvg!, "bg-ink-3/50"],
          ["After", row.postAvg!, "bg-pine-3"],
        ] as const
      ).map(([name, value, tone]) => (
        <div key={name} className="flex items-center gap-3">
          <span className="w-12 text-[12px] text-ink-3">{name}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper-2">
            <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
          </div>
          <span className="tabular w-10 text-right font-mono text-[13px] text-ink">{value}%</span>
        </div>
      ))}
    </div>
  );
}

export function ReportPanel({ report }: { report: Report }) {
  const s = report.scenarios;
  const q = report.quiz;
  const k = report.kAnonymity;

  if (s.suppressed) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-rule bg-paper-2 px-4 py-3 text-[14px] text-ink-2">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-pine-3" />
        <p>
          Results appear once at least {k} people have finished both rounds. So far that&apos;s fewer than {k}, so nothing is
          shown, to keep anyone&apos;s own result from showing through.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="font-display text-[2rem] leading-none font-medium text-ink">
          {s.relativePct !== null ? `${signed(s.relativePct)}%` : `${signed(s.delta!)} pts`}
        </p>
        <p className="text-[14px] text-ink-2">change in scenario scores across {s.people} people who did both rounds</p>
      </div>
      <p className={cn("inline-flex items-center gap-1.5 text-[13px]", report.metTarget ? "text-tag-green" : "text-ink-3")}>
        {report.metTarget ? <CheckCircle2 className="size-4" /> : <CircleDashed className="size-4" />}
        {report.metTarget ? "Meets" : "Below"} the pilot target of {report.targetImprovementPct}% improvement
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Bars row={s} label="Scenario scores" />
        {q.suppressed ? (
          <p className="text-[13px] text-ink-3">Quiz results need at least {k} people with both rounds.</p>
        ) : (
          <Bars row={q} label="Quiz" />
        )}
      </div>

      <table className="w-full text-left text-[14px]">
        <thead className="border-b border-rule text-[12px] text-ink-3">
          <tr>
            <th className="py-2 font-medium">Scenario</th>
            <th className="py-2 pl-3 text-right font-medium">Before</th>
            <th className="py-2 pl-3 text-right font-medium">After</th>
            <th className="py-2 pl-3 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule-2">
          {report.byScenario.map((r) => (
            <tr key={r.id}>
              <td className="py-2 pr-3 text-ink">{r.title}</td>
              {r.suppressed ? (
                <td colSpan={3} className="py-2 text-right text-[13px] text-ink-3">
                  fewer than {k} people
                </td>
              ) : (
                <>
                  <td className="tabular py-2 pl-3 text-right font-mono text-ink-2">{r.preAvg}%</td>
                  <td className="tabular py-2 pl-3 text-right font-mono text-ink">{r.postAvg}%</td>
                  <td className="tabular py-2 pl-3 text-right font-mono text-ink">{signed(r.delta!)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-[13px] text-ink-3">{report.note}</p>
    </div>
  );
}
