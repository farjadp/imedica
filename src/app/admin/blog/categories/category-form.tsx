"use client";

import { useActionState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { saveCategory } from "@/server/blog/actions";

type Cat = { id: string; name: string; slug: string; description: string | null; sortOrder: number };

/** Add a category, or edit one when `category` is given. */
export function CategoryForm({ category, onDone }: { category?: Cat; onDone?: () => void }) {
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, data) => {
    const res = await saveCategory(prev, data);
    if (res.ok) {
      if (!category) form.current?.reset();
      onDone?.();
    }
    return res;
  }, {});
  const e = state.fieldErrors ?? {};
  return (
    <form ref={form} action={action} className="space-y-4" noValidate>
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      {state.ok ? <p className="rounded-md bg-tag-green-wash p-3 text-[14px] text-ink">{state.message}</p> : <FormError message={state.message} />}
      <Field label="Name" error={e.name}>
        {(p) => <Input {...p} name="name" defaultValue={category?.name} placeholder="Case breakdowns" required />}
      </Field>
      <div className="grid grid-cols-[1fr_88px] gap-3">
        <Field label="Slug" hint="Leave blank to generate" error={e.slug}>
          {(p) => <Input {...p} name="slug" defaultValue={category?.slug} className="font-mono text-[13px]" />}
        </Field>
        <Field label="Order" error={e.sortOrder}>
          {(p) => <Input {...p} name="sortOrder" type="number" min={0} defaultValue={category?.sortOrder ?? 0} />}
        </Field>
      </div>
      <Field label="Description" hint="Shown on the category page and in search results." error={e.description}>
        {(p) => <Textarea {...p} name="description" rows={3} defaultValue={category?.description ?? ""} />}
      </Field>
      <Button type="submit" pending={pending} className="w-full">
        {category ? "Save category" : "Add category"}
      </Button>
    </form>
  );
}
