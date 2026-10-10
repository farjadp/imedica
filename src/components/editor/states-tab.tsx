"use client";

import { ArrowDown, ArrowUp, Flag, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { api } from "@/lib/api-client";
import type { Vitals } from "@/lib/validators/scenario";

import type { EditorScenario, EState } from "./types";
import { useMutation } from "./use-mutation";

const VITALS: { key: keyof Vitals; label: string; unit: string }[] = [
  { key: "hr", label: "HR", unit: "bpm" },
  { key: "sbp", label: "SBP", unit: "mmHg" },
  { key: "dbp", label: "DBP", unit: "mmHg" },
  { key: "rr", label: "RR", unit: "/min" },
  { key: "spo2", label: "SpO₂", unit: "%" },
  { key: "etco2", label: "EtCO₂", unit: "mmHg" },
  { key: "gcs", label: "GCS", unit: "" },
  { key: "temp", label: "Temp", unit: "°C" },
  { key: "glucose", label: "Glucose", unit: "mmol/L" },
];

export function vitalsLine(v: Vitals) {
  const parts = [];
  if (v.hr != null) parts.push(`HR ${v.hr}`);
  if (v.sbp != null) parts.push(`BP ${v.sbp}/${v.dbp ?? "?"}`);
  if (v.rr != null) parts.push(`RR ${v.rr}`);
  if (v.spo2 != null) parts.push(`SpO₂ ${v.spo2}%`);
  if (v.gcs != null) parts.push(`GCS ${v.gcs}`);
  if (v.glucose != null) parts.push(`BGL ${v.glucose}`);
  return parts.join(" · ");
}

function StateForm({ scenarioId, state, onDone }: { scenarioId: string; state?: EState; onDone: () => void }) {
  const m = useMutation();
  const [title, setTitle] = useState(state?.title ?? "");
  const [narrative, setNarrative] = useState(state?.narrative ?? "");
  const [vitals, setVitals] = useState<Vitals>(state?.vitals ?? { rhythm: "sinus" });
  const [isStart, setIsStart] = useState(state?.isStart ?? false);
  const [isTerminal, setIsTerminal] = useState(state?.isTerminal ?? false);
  const [debrief, setDebrief] = useState(state?.debrief ?? "");

  const setVital = (k: keyof Vitals, raw: string) =>
    setVitals((v) => ({ ...v, [k]: raw === "" ? null : k === "skin" ? raw : Number(raw) }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = { title, narrative, vitals, isStart, isTerminal, debrief: debrief || null };
    const ok = await m.run(() =>
      state ? api("PATCH", `/scenarios/${scenarioId}/states/${state.id}`, body) : api("POST", `/scenarios/${scenarioId}/states`, body),
    );
    if (ok) onDone();
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-pine-3/40 bg-card p-5" noValidate>
      <FormError message={m.error} />
      <Field label="Title" error={m.fields.title}>
        {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pressure falling" />}
      </Field>
      <Field label="What the paramedic sees" error={m.fields.narrative}>
        {(p) => <Textarea {...p} rows={3} value={narrative} onChange={(e) => setNarrative(e.target.value)} />}
      </Field>
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-2">Monitor</legend>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {VITALS.map((v) => (
            <label key={v.key} className="block">
              <span className="font-mono text-[10px] tracking-wider text-ink-3 uppercase">
                {v.label} {v.unit ? <span className="normal-case">({v.unit})</span> : null}
              </span>
              <Input
                className="mt-1 h-9 font-mono"
                inputMode="decimal"
                value={(vitals[v.key] as number | null | undefined) ?? ""}
                onChange={(e) => setVital(v.key, e.target.value)}
              />
            </label>
          ))}
          <label className="block">
            <span className="font-mono text-[10px] tracking-wider text-ink-3 uppercase">Rhythm</span>
            <Select
              className="mt-1 h-9"
              value={vitals.rhythm ?? "sinus"}
              onChange={(e) => setVitals((v) => ({ ...v, rhythm: e.target.value as Vitals["rhythm"] }))}
            >
              <option value="sinus">Sinus</option>
              <option value="tachycardia">Sinus tachycardia</option>
              <option value="bradycardia">Sinus bradycardia</option>
              <option value="stemi">ST elevation</option>
              <option value="vfib">VF</option>
              <option value="asystole">Asystole</option>
            </Select>
          </label>
        </div>
        <label className="mt-3 block">
          <span className="font-mono text-[10px] tracking-wider text-ink-3 uppercase">Skin</span>
          <Input className="mt-1 h-9" value={vitals.skin ?? ""} onChange={(e) => setVital("skin", e.target.value)} placeholder="e.g. Pale, diaphoretic" />
        </label>
      </fieldset>
      <div className="flex flex-wrap gap-6 text-[14px] text-ink-2">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isStart} onChange={(e) => setIsStart(e.target.checked)} className="size-4 accent-[var(--color-pine)]" />
          The call starts here
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isTerminal} onChange={(e) => setIsTerminal(e.target.checked)} className="size-4 accent-[var(--color-pine)]" />
          The call ends here
        </label>
      </div>
      {isTerminal ? (
        <Field label="Debrief for this ending" hint="Shown when a run finishes in this state." error={m.fields.debrief}>
          {(p) => <Textarea {...p} rows={3} value={debrief} onChange={(e) => setDebrief(e.target.value)} />}
        </Field>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" pending={m.pending}>
          {state ? "Save state" : "Add state"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function StatesTab({ scenario, locked }: { scenario: EditorScenario; locked: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const m = useMutation();
  const states = scenario.states;

  const move = (index: number, dir: -1 | 1) => {
    const ids = states.map((s) => s.id);
    [ids[index], ids[index + dir]] = [ids[index + dir], ids[index]];
    void m.run(() => api("PUT", `/scenarios/${scenario.id}/states/order`, { ids }));
  };

  const remove = (s: EState) => {
    if (!confirm(`Delete "${s.title}"? Rules that start in this state are deleted with it.`)) return;
    void m.run(() => api("DELETE", `/scenarios/${scenario.id}/states/${s.id}`));
  };

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-[14px] text-ink-2">
        Each state is a moment in the call: what the paramedic sees and what the monitor shows. Rules move the patient
        from one state to the next.
      </p>
      <FormError message={m.error} />
      <ol className="space-y-3">
        {states.map((s, i) =>
          editing === s.id ? (
            <li key={s.id}>
              <StateForm scenarioId={scenario.id} state={s} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={s.id} className="rounded-lg border border-rule bg-card p-4">
              <div className="flex items-start gap-4">
                <span className="tabular mt-0.5 font-mono text-[12px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-medium text-ink">{s.title}</h3>
                    {s.isStart ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pine-wash px-2 py-0.5 text-[11px] text-pine">
                        <Play className="size-3" /> Start
                      </span>
                    ) : null}
                    {s.isTerminal ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-2 py-0.5 text-[11px] text-ink-2">
                        <Flag className="size-3" /> End
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[14px] text-ink-2">{s.narrative}</p>
                  <p className="mt-2 font-mono text-[12px] text-ink-3">{vitalsLine(s.vitals) || "No vitals set"}</p>
                </div>
                {locked ? null : (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <IconButton label="Move up" disabled={i === 0 || m.pending} onClick={() => move(i, -1)}>
                      <ArrowUp className="size-4" />
                    </IconButton>
                    <IconButton label="Move down" disabled={i === states.length - 1 || m.pending} onClick={() => move(i, 1)}>
                      <ArrowDown className="size-4" />
                    </IconButton>
                    <IconButton label={`Edit ${s.title}`} onClick={() => setEditing(s.id)}>
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton label={`Delete ${s.title}`} onClick={() => remove(s)}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                )}
              </div>
            </li>
          ),
        )}
      </ol>
      {locked ? null : editing === "new" ? (
        <StateForm scenarioId={scenario.id} onDone={() => setEditing(null)} />
      ) : (
        <Button variant="secondary" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add state
        </Button>
      )}
    </div>
  );
}

export function IconButton({
  label,
  children,
  ...props
}: { label: string; children: React.ReactNode } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}
