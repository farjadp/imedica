"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form";

/** A one-button form for a server action, with optional confirmation. */
export function InlineAction({
  action,
  fields,
  label,
  confirmText,
  variant = "ghost",
}: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  fields: Record<string, string>;
  label: string;
  confirmText?: string;
  variant?: "ghost" | "secondary" | "danger" | "primary";
}) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (confirmText && !confirm(confirmText)) e.preventDefault();
      }}
      className="inline-flex flex-col items-end gap-1"
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Button type="submit" size="sm" variant={variant} pending={pending}>
        {label}
      </Button>
      {state.message && !state.ok ? <span className="max-w-56 text-right text-[12px] text-tag-red">{state.message}</span> : null}
    </form>
  );
}

/** A select that saves on change, e.g. a person's role. */
export function InlineSelect({
  action,
  fields,
  name,
  value,
  options,
  label,
}: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  fields: Record<string, string>;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  label: string;
}) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="inline-flex flex-col gap-1">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <select
        name={name}
        defaultValue={value}
        aria-label={label}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-md border border-rule bg-card px-2 text-[13px] text-ink hover:border-ink-3"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {state.message && !state.ok ? <span className="text-[12px] text-tag-red">{state.message}</span> : null}
    </form>
  );
}
