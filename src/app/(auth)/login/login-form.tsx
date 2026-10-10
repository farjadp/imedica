"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { login } from "@/server/auth/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.message} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="Email" error={e.email}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" autoFocus required />}
      </Field>
      <Field label="Password" error={e.password}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      <div className="flex items-center justify-between">
        <Link href="/forgot-password" className="text-[13px] text-pine-3 underline decoration-pine-3/30 hover:decoration-pine-3">
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" pending={pending}>
        Sign in
      </Button>
    </form>
  );
}
