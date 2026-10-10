"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { api } from "@/lib/api-client";

import { IconButton } from "./states-tab";
import type { EditorScenario, EFeedback } from "./types";
import { useMutation } from "./use-mutation";

function NoteForm({ scenarioId, note, onDone }: { scenarioId: string; note?: EFeedback; onDone: () => void }) {
  const m = useMutation();
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [reference, setReference] = useState(note?.reference ?? "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = { title, body, reference: reference || null };
    const ok = await m.run(() =>
      note ? api("PATCH", `/scenarios/${scenarioId}/feedback/${note.id}`, payload) : api("POST", `/scenarios/${scenarioId}/feedback`, payload),
    );
    if (ok) onDone();
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-pine-3/40 bg-card p-5" noValidate>
      <FormError message={m.error} />
      <Field label="Title" error={m.fields.title}>
        {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Inferior MI and the right ventricle" />}
      </Field>
      <Field label="Teaching note" error={m.fields.body}>
        {(p) => <Textarea {...p} rows={5} value={body} onChange={(e) => setBody(e.target.value)} />}
      </Field>
      <Field label="Reference" hint="Directive, standard or guideline." error={m.fields.reference}>
        {(p) => <Input {...p} value={reference} onChange={(e) => setReference(e.target.value)} />}
      </Field>
      <div className="flex gap-2">
        <Button type="submit" pending={m.pending}>
          {note ? "Save note" : "Add note"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function FeedbackTab({ scenario, locked }: { scenario: EditorScenario; locked: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const m = useMutation();
  const used = (id: string) => scenario.rules.filter((r) => r.feedbackId === id).length;

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-[14px] text-ink-2">
        Longer explanations a rule can link to. They appear in the debrief and are given to the AI explainer as the
        source it must stay within.
      </p>
      <FormError message={m.error} />
      <ul className="space-y-3">
        {scenario.feedback.map((n) =>
          editing === n.id ? (
            <li key={n.id}>
              <NoteForm scenarioId={scenario.id} note={n} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={n.id} className="rounded-lg border border-rule bg-card p-4">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-medium text-ink">{n.title}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{n.body}</p>
                  <p className="mt-2 text-[12px] text-ink-3">
                    {n.reference ? `${n.reference} · ` : ""}used by {used(n.id)} rule{used(n.id) === 1 ? "" : "s"}
                  </p>
                </div>
                {locked ? null : (
                  <div className="flex shrink-0">
                    <IconButton label={`Edit ${n.title}`} onClick={() => setEditing(n.id)}>
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton
                      label={`Delete ${n.title}`}
                      onClick={() => confirm(`Delete "${n.title}"?`) && void m.run(() => api("DELETE", `/scenarios/${scenario.id}/feedback/${n.id}`))}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
      {locked ? null : editing === "new" ? (
        <NoteForm scenarioId={scenario.id} onDone={() => setEditing(null)} />
      ) : (
        <Button variant="secondary" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add teaching note
        </Button>
      )}
    </div>
  );
}
