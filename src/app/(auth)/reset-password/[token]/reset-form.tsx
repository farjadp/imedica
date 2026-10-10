"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { resetPassword } from "@/server/auth/actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  const e = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="space-y-6">
        <p className="text-[15px] leading-relaxed text-ink-2">
          Your password is changed and every device was signed out. Sign in with the new one.
        </p>
        <Link href="/login" className="text-pine-3 underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.message} />
      <input type="hidden" name="token" value={token} />
      <Field label="New password" hint="At least 12 characters, with a letter and a number." error={e.password}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" autoFocus required />}
      </Field>
      <Field label="Confirm new password" error={e.confirm}>
        {(p) => <Input {...p} name="confirm" type="password" autoComplete="new-password" required />}
      </Field>
      <Button type="submit" size="lg" className="w-full" pending={pending}>
        Change password
      </Button>
    </form>
  );
}
