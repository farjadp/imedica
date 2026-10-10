"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { requestPasswordReset } from "@/server/auth/actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});

  return (
    <>
      <h1 className="font-display text-[2.2rem] leading-tight font-medium tracking-[-0.02em] text-ink">Reset your password</h1>
      {state.ok ? (
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
          If that email has an account, a reset link is on its way. It works for one hour.
        </p>
      ) : (
        <>
          <p className="mt-2 mb-8 text-[15px] text-ink-2">We&apos;ll email you a link to choose a new one.</p>
          <form action={action} className="space-y-5" noValidate>
            <FormError message={state.message} />
            <Field label="Email" error={state.fieldErrors?.email}>
              {(p) => <Input {...p} name="email" type="email" autoComplete="email" autoFocus required />}
            </Field>
            <Button type="submit" size="lg" className="w-full" pending={pending}>
              Send reset link
            </Button>
          </form>
        </>
      )}
      <p className="mt-8 text-[14px]">
        <Link href="/login" className="text-pine-3 underline decoration-pine-3/30 hover:decoration-pine-3">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
