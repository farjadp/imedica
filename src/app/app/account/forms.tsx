"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { changePassword, updateProfile } from "@/server/account/actions";

function Saved({ state }: { state: FormState }) {
  return state.ok ? <span className="text-[13px] text-tag-green">{state.message}</span> : null;
}

export function ProfileForm({
  initial,
}: {
  initial: { firstName: string; lastName: string; level: string | null; yearsExperience: number | null };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={state.ok ? null : state.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={e.firstName}>
          {(p) => <Input {...p} name="firstName" defaultValue={initial.firstName} autoComplete="given-name" />}
        </Field>
        <Field label="Last name" error={e.lastName}>
          {(p) => <Input {...p} name="lastName" defaultValue={initial.lastName} autoComplete="family-name" />}
        </Field>
        <Field label="Level" error={e.level}>
          {(p) => (
            <Select {...p} name="level" defaultValue={initial.level ?? ""}>
              <option value="">Prefer not to say</option>
              <option value="PCP">PCP</option>
              <option value="ACP">ACP</option>
              <option value="CCP">CCP</option>
              <option value="EMR">EMR</option>
              <option value="STUDENT">Student</option>
              <option value="OTHER">Other</option>
            </Select>
          )}
        </Field>
        <Field label="Years in practice" error={e.yearsExperience}>
          {(p) => <Input {...p} name="yearsExperience" type="number" min={0} max={60} defaultValue={initial.yearsExperience ?? ""} />}
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" pending={pending}>
          Save
        </Button>
        <Saved state={state} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Current password" error={e.current}>
        {(p) => <Input {...p} name="current" type="password" autoComplete="current-password" />}
      </Field>
      <Field label="New password" hint="At least 12 characters, with a letter and a number." error={e.password}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" />}
      </Field>
      <Field label="Confirm new password" error={e.confirm}>
        {(p) => <Input {...p} name="confirm" type="password" autoComplete="new-password" />}
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" pending={pending}>
          Change password
        </Button>
        <Saved state={state} />
      </div>
    </form>
  );
}
