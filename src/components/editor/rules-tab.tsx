"use client";

import { ArrowRight, Clock, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { OutcomeTag } from "@/components/ui/outcome-tag";
import { api } from "@/lib/api-client";
import { OUTCOMES } from "@/lib/validators/scenario";

import { IconButton } from "./states-tab";
import type { EditorScenario, ERule } from "./types";
import { useMutation } from "./use-mutation";

const outcomeHelp: Record<string, string> = {
  CORRECT: "The right action now",
  ACCEPTABLE: "Defensible, not the strongest",
  SUBOPTIMAL: "Not indicated, or too late",
  HARMFUL: "Contraindicated; patient worsens",
  CRITICAL: "Serious harm; the call ends",
};

function RuleForm({
  scenario,
  rule,
  defaultFrom,
  onDone,
}: {
  scenario: EditorScenario;
  rule?: ERule;
  defaultFrom: string | null;
  onDone: () => void;
}) {
  const m = useMutation();
  const [f, setF] = useState({
    fromStateId: rule?.fromStateId ?? defaultFrom,
    actionId: rule?.actionId ?? scenario.actions[0]?.id ?? "",
    outcome: rule?.outcome ?? "CORRECT",
    points: String(rule?.points ?? 10),
    toStateId: rule?.toStateId ?? null,
    withinSec: rule?.withinSec ? String(rule.withinSec) : "",
    rationale: rule?.rationale ?? "",
    feedbackId: rule?.feedbackId ?? null,
    priority: String(rule?.priority ?? 100),
    required: rule?.required ?? false,
  });
  const set = (k: keyof typeof f, v: unknown) => setF((x) => ({ ...x, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      ...f,
      points: Number(f.points),
      priority: Number(f.priority),
      withinSec: f.withinSec ? Number(f.withinSec) : null,
    };
    const ok = await m.run(() =>
      rule ? api("PATCH", `/scenarios/${scenario.id}/rules/${rule.id}`, body) : api("POST", `/scenarios/${scenario.id}/rules`, body),
    );
    if (ok) onDone();
  }

  if (!scenario.actions.length) {
    return <p className="text-[14px] text-ink-3">Add actions to the menu before writing rules.</p>;
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-pine-3/40 bg-card p-5" noValidate>
      <FormError message={m.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="When the patient is in" error={m.fields.fromStateId}>
          {(p) => (
            <Select {...p} value={f.fromStateId ?? ""} onChange={(e) => set("fromStateId", e.target.value || null)}>
              <option value="">Any state</option>
              {scenario.states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="and the paramedic does" error={m.fields.actionId}>
          {(p) => (
            <Select {...p} value={f.actionId} onChange={(e) => set("actionId", e.target.value)}>
              {scenario.actions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                  {a.detail ? ` (${a.detail})` : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-2">The verdict is</legend>
        <div className="flex flex-wrap gap-2">
          {OUTCOMES.map((o) => (
            <label
              key={o}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 transition-colors ${
                f.outcome === o ? "border-ink bg-paper" : "border-rule hover:border-ink-3"
              }`}
            >
              <input type="radio" name="outcome" value={o} checked={f.outcome === o} onChange={() => set("outcome", o)} className="sr-only" />
              <OutcomeTag outcome={o} />
              <span className="hidden text-[12px] text-ink-3 md:inline">{outcomeHelp[o]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Points" hint="Negative for penalties" error={m.fields.points}>
          {(p) => <Input {...p} type="number" value={f.points} onChange={(e) => set("points", e.target.value)} />}
        </Field>
        <Field label="Then move to" error={m.fields.toStateId}>
          {(p) => (
            <Select {...p} value={f.toStateId ?? ""} onChange={(e) => set("toStateId", e.target.value || null)}>
              <option value="">Stay in this state</option>
              {scenario.states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Within (seconds)" hint="Late = suboptimal, half points" error={m.fields.withinSec}>
          {(p) => <Input {...p} type="number" min={1} value={f.withinSec} onChange={(e) => set("withinSec", e.target.value)} placeholder="No limit" />}
        </Field>
        <Field label="Priority" hint="Lower wins on overlap" error={m.fields.priority}>
          {(p) => <Input {...p} type="number" value={f.priority} onChange={(e) => set("priority", e.target.value)} />}
        </Field>
      </div>

      <Field label="Rationale" hint="One line the learner sees in the debrief." error={m.fields.rationale}>
        {(p) => <Textarea {...p} rows={2} value={f.rationale} onChange={(e) => set("rationale", e.target.value)} />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <Field label="Teaching note" error={m.fields.feedbackId}>
          {(p) => (
            <Select {...p} value={f.feedbackId ?? ""} onChange={(e) => set("feedbackId", e.target.value || null)}>
              <option value="">None</option>
              {scenario.feedback.map((fb) => (
                <option key={fb.id} value={fb.id}>
                  {fb.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <label className="inline-flex h-10 items-center gap-2 text-[14px] text-ink-2">
          <input type="checkbox" checked={f.required} onChange={(e) => set("required", e.target.checked)} className="size-4 accent-[var(--color-pine)]" />
          Required step (counts toward the maximum score)
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" pending={m.pending}>
          {rule ? "Save rule" : "Add rule"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function RulesTab({ scenario, locked }: { scenario: EditorScenario; locked: boolean }) {
  const [editing, setEditing] = useState<{ id: string; from: string | null } | null>(null);
  const m = useMutation();
  const action = new Map(scenario.actions.map((a) => [a.id, a]));
  const state = new Map(scenario.states.map((s) => [s.id, s]));
  const max = scenario.rules.filter((r) => r.required && r.points > 0).reduce((s, r) => s + r.points, 0);

  const groups: { key: string | null; title: string }[] = [
    { key: null, title: "Any state" },
    ...scenario.states.filter((s) => !s.isTerminal).map((s) => ({ key: s.id, title: s.title })),
  ];

  const remove = (r: ERule) => {
    if (!confirm("Delete this rule?")) return;
    void m.run(() => api("DELETE", `/scenarios/${scenario.id}/rules/${r.id}`));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <p className="max-w-2xl text-[14px] text-ink-2">
          Rules are the grader. In a given state, an action gets a verdict, points, and optionally moves the patient on.
          Rules for a specific state win over &ldquo;any state&rdquo; rules.
        </p>
        <p className="text-[13px] text-ink-3">
          Maximum score <span className="tabular font-mono font-medium text-ink">{max}</span>
        </p>
      </div>
      <FormError message={m.error} />

      {groups.map((g) => {
        const rules = scenario.rules.filter((r) => r.fromStateId === g.key);
        return (
          <section key={g.key ?? "any"}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[15px] font-medium text-ink">{g.title}</h3>
              {locked ? null : (
                <Button variant="ghost" size="sm" onClick={() => setEditing({ id: "new", from: g.key })}>
                  <Plus className="size-3.5" /> Rule
                </Button>
              )}
            </div>
            {editing?.id === "new" && editing.from === g.key ? (
              <div className="mb-3">
                <RuleForm scenario={scenario} defaultFrom={g.key} onDone={() => setEditing(null)} />
              </div>
            ) : null}
            {rules.length === 0 ? (
              <p className="rounded-lg border border-dashed border-rule px-4 py-4 text-[13px] text-ink-3">No rules yet.</p>
            ) : (
              <ul className="divide-y divide-rule-2 rounded-lg border border-rule bg-card">
                {rules.map((r) =>
                  editing?.id === r.id ? (
                    <li key={r.id} className="p-2">
                      <RuleForm scenario={scenario} rule={r} defaultFrom={g.key} onDone={() => setEditing(null)} />
                    </li>
                  ) : (
                    <li key={r.id} className="flex items-start gap-4 px-4 py-3">
                      <OutcomeTag outcome={r.outcome} className="mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 text-[14px] font-medium text-ink">
                          {action.get(r.actionId)?.label ?? "Missing action"}
                          {r.toStateId ? (
                            <span className="inline-flex items-center gap-1 text-[13px] font-normal text-ink-3">
                              <ArrowRight className="size-3.5" /> {state.get(r.toStateId)?.title}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[13px] text-ink-2">{r.rationale}</p>
                        <p className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-ink-3">
                          {r.required ? (
                            <span className="inline-flex items-center gap-1 text-pine-3">
                              <Star className="size-3" /> Required
                            </span>
                          ) : null}
                          {r.withinSec ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" /> within {r.withinSec}s
                            </span>
                          ) : null}
                          {r.priority !== 100 ? <span>priority {r.priority}</span> : null}
                        </p>
                      </div>
                      <span className={`tabular shrink-0 font-mono text-[13px] ${r.points < 0 ? "text-tag-red" : "text-ink-2"}`}>
                        {r.points > 0 ? `+${r.points}` : r.points}
                      </span>
                      {locked ? null : (
                        <div className="flex shrink-0">
                          <IconButton label="Edit rule" onClick={() => setEditing({ id: r.id, from: g.key })}>
                            <Pencil className="size-4" />
                          </IconButton>
                          <IconButton label="Delete rule" onClick={() => remove(r)}>
                            <Trash2 className="size-4" />
                          </IconButton>
                        </div>
                      )}
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
