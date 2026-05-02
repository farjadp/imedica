// ============================================================================
// File: apps/web/src/features/auth/pages/ResetPasswordPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Password reset page using the token from the email link.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@imedica/ui';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { getAuthErrorMessage, resetPassword } from '../api/authApi.js';
import { AuthPageShell } from '../components/AuthPageShell.js';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter.js';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../types.js';

export function ResetPasswordPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [completed, setCompleted] = useState(false);

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) => resetPassword(token, values),
    onSuccess: () => {
      setCompleted(true);
      window.setTimeout(() => navigate('/login', { replace: true, state: { message: 'Password reset successful' } }), 1800);
    },
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');
  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  if (!token) {
    return (
      <AuthPageShell
        eyebrow="Password reset"
        title="Missing token"
        description="This reset link is incomplete. Request a new password reset email."
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-text-muted">The reset token was not found in the URL.</p>
          <Link to="/forgot-password" className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600">
            Request new link
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  if (completed) {
    return (
      <AuthPageShell
        eyebrow="Password reset"
        title="Password updated"
        description="Your password has been reset successfully. Redirecting to login."
      >
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success-600" aria-hidden="true" />
          <p className="text-sm text-text-muted">You can now sign in with the new password.</p>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Password reset"
      title="Set a new password"
      description="Choose a secure password for your Imedica account."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        noValidate
      >
        <Input
          type="password"
          label="New password"
          leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          error={errors.password?.message}
          autoComplete="new-password"
          {...register('password')}
        />
        <PasswordStrengthMeter password={password ?? ''} />

        <Input
          type="password"
          label="Confirm password"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />

        {mutation.isError ? (
          <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/30 dark:text-error-200">
            {getAuthErrorMessage(mutation.error, 'Reset failed. The token may have expired.')}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Update password
        </Button>
      </form>
    </AuthPageShell>
  );
}
