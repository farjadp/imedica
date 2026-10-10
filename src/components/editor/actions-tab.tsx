"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select } from "@/components/ui/field";
import { api } from "@/lib/api-client";
import { actionCategoryLabel } from "@/lib/labels";
import { ACTION_CATEGORIES } from "@/lib/validators/scenario";

import { IconButton } from "./states-tab";
import type { EAction, EditorScenario } from "./types";
import { useMutation } from "./use-mutation";

function ActionForm({ scenarioId, action, onDone }: { scenarioId: string; action?: EAction; onDone: () => void }) {
  const m = useMutation();
  const [category, setCategory] = useState(action?.category ?? "ASSESSMENT");
  const [label, setLabel] = useState(action?.label ?? "");
  const [detail, setDetail] = useState(action?.detail ?? "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = { category, label, detail: detail || null };
    const ok = await m.run(() =>
      action ? api("PATCH", `/scenarios/${scenarioId}/actions/${action.id}`, body) : api("POST", `/scenarios/${scenarioId}/actions`, body),
    );
    if (ok) onDone();
  }

  return (
    <form onSubmit={save} className="grid gap-4 rounded-lg border border-pine-3/40 bg-card p-4 sm:grid-cols-[180px_1fr_1fr_auto] sm:items-end" noValidate>
      <div className="sm:col-span-4">
        <FormError message={m.error} />
      </div>
      <Field label="Category" error={m.fields.category}>
        {(p) => (
          <Select {...p} value={category} onChange={(e) => setCategory(e.target.value)}>
            {ACTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {actionCategoryLabel[c]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Action" error={m.fields.label}>
        {(p) => <Input {...p} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Nitroglycerin" />}
      </Field>
      <Field label="Dose, route or detail" error={m.fields.detail}>
        {(p) => <Input {...p} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. 0.4 mg SL" />}
      </Field>
      <div className="flex gap-2">
        <Button type="submit" pending={m.pending}>
          {action ? "Save" : "Add"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function ActionsTab({ scenario, locked }: { scenario: EditorScenario; locked: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const m = useMutation();
  const ruleCount = (id: string) => scenario.rules.filter((r) => r.actionId === id).length;

  const groups = ACTION_CATEGORIES.map((c) => ({ c, items: scenario.actions.filter((a) => a.category === c) })).filter(
    (g) => g.items.length,
  );

  const remove = (a: EAction) => {
    const n = ruleCount(a.id);
    if (!confirm(n ? `Delete "${a.label}" and the ${n} rule${n > 1 ? "s" : ""} that use it?` : `Delete "${a.label}"?`)) return;
    void m.run(() => api("DELETE", `/scenarios/${scenario.id}/actions/${a.id}`));
  };

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-[14px] text-ink-2">
        Everything a crew could reasonably do on this call, including the wrong things. An action with no rule in the
        current state is scored as suboptimal.
      </p>
      <FormError message={m.error} />
      {groups.map((g) => (
        <section key={g.c}>
          <h3 className="mb-2 font-mono text-[11px] tracking-wider text-ink-3 uppercase">{actionCategoryLabel[g.c]}</h3>
          <ul className="divide-y divide-rule-2 rounded-lg border border-rule bg-card">
            {g.items.map((a) =>
              editing === a.id ? (
                <li key={a.id} className="p-2">
                  <ActionForm scenarioId={scenario.id} action={a} onDone={() => setEditing(null)} />
                </li>
              ) : (
                <li key={a.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink">{a.label}</p>
                    {a.detail ? <p className="text-[13px] text-ink-3">{a.detail}</p> : null}
                  </div>
                  <span className="text-[12px] text-ink-3">
                    {ruleCount(a.id)} rule{ruleCount(a.id) === 1 ? "" : "s"}
                  </span>
                  {locked ? null : (
                    <div className="flex">
                      <IconButton label={`Edit ${a.label}`} onClick={() => setEditing(a.id)}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label={`Delete ${a.label}`} onClick={() => remove(a)}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                  )}
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
      {locked ? null : editing === "new" ? (
        <ActionForm scenarioId={scenario.id} onDone={() => setEditing(null)} />
      ) : (
        <Button variant="secondary" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add action
        </Button>
      )}
    </div>
  );
}
