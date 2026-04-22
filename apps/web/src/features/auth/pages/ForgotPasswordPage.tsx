// ============================================================================
// File: apps/web/src/features/auth/pages/ForgotPasswordPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Email-based password recovery flow.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@imedica/ui';
import { useMutation } from '@tanstack/react-query';
import { Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { forgotPassword, getAuthErrorMessage } from '../api/authApi.js';
import { AuthPageShell } from '../components/AuthPageShell.js';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../types.js';

export function ForgotPasswordPage(): JSX.Element {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (_, values) => {
      setSubmittedEmail(values.email);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <AuthPageShell
      eyebrow="Password recovery"
      title="Forgot password"
      description="Enter your email address and we will send a reset link if the account exists."
    >
      {submittedEmail ? (
        <div className="space-y-4 text-center">
          <Mail className="mx-auto h-12 w-12 text-primary-600" aria-hidden="true" />
          <p className="text-sm text-text-muted">Check {submittedEmail} for a password reset link.</p>
          <Link to="/login" className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600">
            Return to login
          </Link>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            void onSubmit(event);
          }}
          noValidate
        >
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          {mutation.isError ? (
            <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/30 dark:text-error-200">
              {getAuthErrorMessage(mutation.error, 'Could not send reset email.')}
            </p>
          ) : null}

          <Button type="submit" className="w-full" isLoading={mutation.isPending} rightIcon={<Send className="h-4 w-4" />}>
            Send reset link
          </Button>

          <p className="text-center text-sm text-text-muted">
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-primary-600 transition hover:text-primary-700">
              Login
            </Link>
          </p>
        </form>
      )}
    </AuthPageShell>
  );
}
