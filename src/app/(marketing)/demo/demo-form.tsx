"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";

import { requestDemo } from "./actions";

export function DemoForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestDemo, {});
  const e = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="rounded-xl border border-tag-green/30 bg-tag-green-wash p-8">
        <CheckCircle2 className="size-7 text-tag-green" aria-hidden />
        <h2 className="mt-4 font-display text-2xl font-medium text-ink">Thanks. We&apos;ll be in touch.</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          Someone from the clinical team will reply within two business days to set up a walkthrough.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5 rounded-xl border border-rule bg-card p-6 shadow-[var(--shadow-lift)] md:p-8" noValidate>
      <FormError message={state.message} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" error={e.name}>
          {(p) => <Input {...p} name="name" autoComplete="name" required />}
        </Field>
        <Field label="Work email" error={e.email}>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" required />}
        </Field>
      </div>
      <Field label="Service or organization" error={e.organization}>
        {(p) => <Input {...p} name="organization" autoComplete="organization" placeholder="e.g. York Region Paramedic Services" required />}
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your role" error={e.role}>
          {(p) => <Input {...p} name="role" autoComplete="organization-title" placeholder="e.g. Training superintendent" required />}
        </Field>
        <Field label="Paramedics on staff" error={e.teamSize}>
          {(p) => (
            <Select {...p} name="teamSize" defaultValue="" required>
              <option value="" disabled>
                Choose…
              </option>
              <option value="1-20">1–20</option>
              <option value="21-100">21–100</option>
              <option value="101-500">101–500</option>
              <option value="500+">More than 500</option>
            </Select>
          )}
        </Field>
      </div>
      <Field label="Anything we should know?" hint="Optional. Directives you follow, timing, what you'd want to see." error={e.message}>
        {(p) => <Textarea {...p} name="message" rows={4} />}
      </Field>
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-ink-3">We only use these details to reply to you.</p>
        <Button type="submit" size="lg" pending={pending}>
          Request a demo
        </Button>
      </div>
    </form>
  );
}
