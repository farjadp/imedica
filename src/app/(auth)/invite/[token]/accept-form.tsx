"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { acceptInvitation } from "@/server/auth/actions";

export function AcceptForm({ token, askLevel }: { token: string; askLevel: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(acceptInvitation, {});
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.message} />
      <input type="hidden" name="token" value={token} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" error={e.firstName}>
          {(p) => <Input {...p} name="firstName" autoComplete="given-name" autoFocus required />}
        </Field>
        <Field label="Last name" error={e.lastName}>
          {(p) => <Input {...p} name="lastName" autoComplete="family-name" required />}
        </Field>
      </div>
      {askLevel ? (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Level" error={e.level}>
            {(p) => (
              <Select {...p} name="level" defaultValue="">
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
            {(p) => <Input {...p} name="yearsExperience" type="number" min={0} max={60} inputMode="numeric" />}
          </Field>
        </div>
      ) : null}
      <Field label="Password" hint="At least 12 characters, with a letter and a number." error={e.password}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" required />}
      </Field>
      <Field label="Confirm password" error={e.confirm}>
        {(p) => <Input {...p} name="confirm" type="password" autoComplete="new-password" required />}
      </Field>
      {askLevel ? (
        <p className="text-[13px] leading-relaxed text-ink-3">
          Level and experience are only used as ranges in de-identified reporting. Your service never sees them next
          to your results.
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" pending={pending}>
        Create account
      </Button>
    </form>
  );
}
