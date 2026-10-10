"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api-client";
import { categoryLabel, difficultyLabel } from "@/lib/labels";
import { CATEGORIES, DIFFICULTIES } from "@/lib/validators/scenario";

export type Basics = {
  id?: string;
  title: string;
  summary: string;
  dispatch: string;
  category: string;
  difficulty: string;
  timeLimitSec: number;
  learningGoals: string[];
  protocolSource: string | null;
};

const blank: Basics = {
  title: "",
  summary: "",
  dispatch: "",
  category: "CARDIAC",
  difficulty: "INTERMEDIATE",
  timeLimitSec: 600,
  learningGoals: [],
  protocolSource: null,
};

export function BasicsForm({ initial, readOnly }: { initial?: Basics; readOnly?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<Basics>(initial ?? blank);
  const [goals, setGoals] = useState((initial?.learningGoals ?? []).join("\n"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const set = <K extends keyof Basics>(k: K, v: Basics[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setMessage(null);
    const body = {
      ...form,
      timeLimitSec: Number(form.timeLimitSec),
      learningGoals: goals.split("\n").map((g) => g.trim()).filter(Boolean),
      protocolSource: form.protocolSource || null,
    };
    try {
      if (initial?.id) {
        await api("PATCH", `/scenarios/${initial.id}`, body);
        setSaved(true);
        router.refresh();
      } else {
        const created = await api<{ id: string }>("POST", "/scenarios", body);
        router.push(`/admin/scenarios/${created.id}?tab=states`);
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
          {(p) => <Input {...p} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Inferior STEMI with RV involvement" />}
        </Field>
        <Field label="Summary" hint="One or two sentences learners see in the library." error={errors.summary}>
          {(p) => <Textarea {...p} rows={2} value={form.summary} onChange={(e) => set("summary", e.target.value)} />}
        </Field>
        <Field label="Dispatch" hint="The call exactly as dispatch would give it." error={errors.dispatch}>
          {(p) => <Textarea {...p} rows={3} value={form.dispatch} onChange={(e) => set("dispatch", e.target.value)} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Clinical area" error={errors.category}>
            {(p) => (
              <Select {...p} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel[c]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Difficulty" error={errors.difficulty}>
            {(p) => (
              <Select {...p} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {difficultyLabel[d]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Time limit (minutes)" error={errors.timeLimitSec}>
            {(p) => (
              <Input
                {...p}
                type="number"
                min={2}
                max={60}
                value={Math.round(form.timeLimitSec / 60)}
                onChange={(e) => set("timeLimitSec", Number(e.target.value) * 60)}
              />
            )}
          </Field>
        </div>
        <Field label="Learning goals" hint="One per line. Shown to learners and given to the AI explainer." error={errors.learningGoals}>
          {(p) => <Textarea {...p} rows={3} value={goals} onChange={(e) => (setGoals(e.target.value), setSaved(false))} />}
        </Field>
        <Field label="Protocol source" hint="The directive or standard the rules follow." error={errors.protocolSource}>
          {(p) => (
            <Input
              {...p}
              value={form.protocolSource ?? ""}
              onChange={(e) => set("protocolSource", e.target.value)}
              placeholder="e.g. ALS PCS — Cardiac Ischemia Medical Directive"
            />
          )}
        </Field>
      </fieldset>
      {readOnly ? null : (
        <div className="flex items-center gap-3">
          <Button type="submit" pending={pending}>
            {initial?.id ? "Save changes" : "Create and add states"}
          </Button>
          {saved ? <span className="text-[13px] text-tag-green">Saved</span> : null}
        </div>
      )}
    </form>
  );
}
