"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { IconButton } from "@/components/editor/states-tab";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api-client";
import { categoryLabel, difficultyLabel } from "@/lib/labels";

import type { ScenarioOption } from "./types";

type Basics = { id?: string; title: string; summary: string; scenarioIds: string[] };

export function AssessmentBasicsForm({
  initial,
  scenarios,
  readOnly,
}: {
  initial?: Basics;
  scenarios: ScenarioOption[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Basics>(initial ?? { title: "", summary: "", scenarioIds: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const byId = new Map(scenarios.map((s) => [s.id, s]));
  const chosen = form.scenarioIds;
  const set = (patch: Partial<Basics>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved(false);
  };
  const toggle = (id: string) => set({ scenarioIds: chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id] });
  const move = (i: number, by: -1 | 1) => {
    const next = [...chosen];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    set({ scenarioIds: next });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setMessage(null);
    const body = { title: form.title, summary: form.summary, scenarioIds: chosen };
    try {
      if (initial?.id) {
        await api("PATCH", `/assessments/${initial.id}`, body);
        setSaved(true);
        router.refresh();
      } else {
        const created = await api<{ id: string }>("POST", "/assessments", body);
        router.push(`/admin/assessments/${created.id}?tab=questions`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setMessage(err.message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <FormError message={message} />
      <fieldset disabled={readOnly} className="space-y-5">
        <Field label="Title" error={errors.title}>
          {(p) => (
            <Input
              {...p}
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Cardiac readiness, pilot baseline"
            />
          )}
        </Field>
        <Field label="Summary" hint="What training leads see when they open it for their service." error={errors.summary}>
          {(p) => <Textarea {...p} rows={2} value={form.summary} onChange={(e) => set({ summary: e.target.value })} />}
        </Field>

        <div className="space-y-2">
          <p className="text-[13px] font-medium text-ink-2">Scenarios</p>
          <p className="text-[13px] text-ink-3">
            Published scenarios only. Paramedics run them in this order, once before training and once after, with no debrief
            until the second time.
          </p>
          {errors.scenarioIds ? <p className="text-[13px] text-tag-red">{errors.scenarioIds}</p> : null}

          {chosen.length ? (
            <ol className="divide-y divide-rule-2 rounded-lg border border-rule bg-card">
              {chosen.map((id, i) => (
                <li key={id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="tabular w-5 font-mono text-[12px] text-ink-3">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-[14px] text-ink">{byId.get(id)?.title ?? "No longer published"}</span>
                  {readOnly ? null : (
                    <span className="flex shrink-0">
                      <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUp className="size-4" />
                      </IconButton>
                      <IconButton label="Move down" disabled={i === chosen.length - 1} onClick={() => move(i, 1)}>
                        <ArrowDown className="size-4" />
                      </IconButton>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          ) : null}

          {scenarios.length === 0 ? (
            <p className="rounded-md border border-dashed border-rule px-4 py-3 text-[14px] text-ink-3">
              No published scenarios yet. Publish one first.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {scenarios.map((s) => (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-rule bg-card px-3 py-2.5 hover:border-ink-3/60 has-checked:border-pine-3 has-checked:bg-pine-wash">
                    <input
                      type="checkbox"
                      className="mt-1 accent-pine"
                      checked={chosen.includes(s.id)}
                      onChange={() => toggle(s.id)}
                    />
                    <span className="min-w-0">
                      <span className="block text-[14px] text-ink">{s.title}</span>
                      <span className="block text-[12px] text-ink-3">
                        {categoryLabel[s.category]} · {difficultyLabel[s.difficulty]}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </fieldset>
      {readOnly ? null : (
        <div className="flex items-center gap-3">
          <Button type="submit" pending={pending}>
            {initial?.id ? "Save changes" : "Create and add questions"}
          </Button>
          {saved ? <span className="text-[13px] text-tag-green">Saved</span> : null}
        </div>
      )}
    </form>
  );
}
