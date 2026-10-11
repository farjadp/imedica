"use client";

import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { IconButton } from "@/components/editor/states-tab";
import { useMutation } from "@/components/editor/use-mutation";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/cn";

import type { AQuestion, EditorAssessment } from "./types";

function QuestionForm({ assessmentId, question, onDone }: { assessmentId: string; question?: AQuestion; onDone: () => void }) {
  const m = useMutation();
  const [stem, setStem] = useState(question?.stem ?? "");
  const [options, setOptions] = useState<string[]>(question?.options ?? ["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(question?.correctIndex ?? 0);
  const [rationale, setRationale] = useState(question?.rationale ?? "");
  const [reference, setReference] = useState(question?.reference ?? "");
  const [blankAnswer, setBlankAnswer] = useState(false);

  const setOption = (i: number, v: string) => setOptions((o) => o.map((x, j) => (j === i ? v : x)));
  const removeOption = (i: number) => {
    setOptions((o) => o.filter((_, j) => j !== i));
    setCorrectIndex((c) => (c === i ? 0 : c > i ? c - 1 : c));
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    // Blank slots are dropped, so the correct answer's index shifts with them.
    const trimmed = options.map((o) => o.trim());
    if (!trimmed[correctIndex]) {
      setBlankAnswer(true);
      return;
    }
    setBlankAnswer(false);
    const payload = {
      stem,
      options: trimmed.filter(Boolean),
      correctIndex: trimmed.slice(0, correctIndex).filter(Boolean).length,
      rationale,
      reference: reference || null,
    };
    const ok = await m.run(() =>
      question
        ? api("PATCH", `/assessments/${assessmentId}/questions/${question.id}`, payload)
        : api("POST", `/assessments/${assessmentId}/questions`, payload),
    );
    if (ok) onDone();
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-pine-3/40 bg-card p-5" noValidate>
      <FormError message={m.error} />
      <Field label="Question" error={m.fields.stem}>
        {(p) => (
          <Textarea
            {...p}
            rows={2}
            value={stem}
            onChange={(e) => setStem(e.target.value)}
            placeholder="e.g. Which finding rules out nitroglycerin?"
          />
        )}
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium text-ink-2">Options</legend>
        <p className="text-[13px] text-ink-3">Select the correct answer. Leave a slot blank to drop it.</p>
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <label className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-rule has-checked:border-tag-green has-checked:bg-tag-green-wash">
              <input
                type="radio"
                name="correct"
                className="sr-only"
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
                aria-label={`Option ${i + 1} is correct`}
              />
              <Check className={cn("size-4", correctIndex === i ? "text-tag-green" : "text-ink-3/40")} />
            </label>
            <Input
              value={o}
              onChange={(e) => setOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              aria-label={`Option ${i + 1}`}
            />
            <IconButton label={`Remove option ${i + 1}`} disabled={options.length <= 2} onClick={() => removeOption(i)}>
              <X className="size-4" />
            </IconButton>
          </div>
        ))}
        {blankAnswer || m.fields.options || m.fields.correctIndex ? (
          <p className="text-[13px] text-tag-red">
            {blankAnswer ? "The correct answer can't be a blank option." : (m.fields.options ?? m.fields.correctIndex)}
          </p>
        ) : null}
        {options.length < 6 ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => setOptions((o) => [...o, ""])}>
            <Plus className="size-4" /> Add option
          </Button>
        ) : null}
      </fieldset>

      <Field
        label="Rationale"
        hint="Why the answer is right. Paramedics see it only after their post-test."
        error={m.fields.rationale}
      >
        {(p) => <Textarea {...p} rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} />}
      </Field>
      <Field label="Reference" hint="Directive, standard or guideline." error={m.fields.reference}>
        {(p) => <Input {...p} value={reference} onChange={(e) => setReference(e.target.value)} />}
      </Field>
      <div className="flex gap-2">
        <Button type="submit" pending={m.pending}>
          {question ? "Save question" : "Add question"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function QuestionsTab({ assessment, locked }: { assessment: EditorAssessment; locked: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const m = useMutation();
  const qs = assessment.questions;

  const move = (i: number, by: -1 | 1) => {
    const ids = qs.map((q) => q.id);
    [ids[i], ids[i + by]] = [ids[i + by], ids[i]];
    void m.run(() => api("PUT", `/assessments/${assessment.id}/questions/order`, { ids }));
  };

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-[14px] text-ink-2">
        A short knowledge check taken before the scenarios. Keep each question to one decision a paramedic makes on a call. The
        same questions are asked before and after training.
      </p>
      <FormError message={m.error} />
      <ol className="space-y-3">
        {qs.map((q, i) =>
          editing === q.id ? (
            <li key={q.id}>
              <QuestionForm assessmentId={assessment.id} question={q} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={q.id} className="rounded-lg border border-rule bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  <span className="tabular mt-0.5 w-5 shrink-0 font-mono text-[12px] text-ink-3">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-medium text-ink">{q.stem}</h3>
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o, j) => (
                        <li
                          key={j}
                          className={cn(
                            "flex items-center gap-2 text-[14px]",
                            j === q.correctIndex ? "text-tag-green" : "text-ink-2",
                          )}
                        >
                          {j === q.correctIndex ? <Check className="size-3.5" /> : <span className="size-3.5" />} {o}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{q.rationale}</p>
                  </div>
                </div>
                {locked ? null : (
                  <div className="ml-7 flex shrink-0 sm:ml-0">
                    <IconButton label="Move up" disabled={i === 0 || m.pending} onClick={() => move(i, -1)}>
                      <ArrowUp className="size-4" />
                    </IconButton>
                    <IconButton label="Move down" disabled={i === qs.length - 1 || m.pending} onClick={() => move(i, 1)}>
                      <ArrowDown className="size-4" />
                    </IconButton>
                    <IconButton label={`Edit question ${i + 1}`} onClick={() => setEditing(q.id)}>
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton
                      label={`Delete question ${i + 1}`}
                      onClick={() =>
                        confirm("Delete this question?") &&
                        void m.run(() => api("DELETE", `/assessments/${assessment.id}/questions/${q.id}`))
                      }
                    >
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
        <QuestionForm assessmentId={assessment.id} onDone={() => setEditing(null)} />
      ) : (
        <Button variant="secondary" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add question
        </Button>
      )}
    </div>
  );
}
