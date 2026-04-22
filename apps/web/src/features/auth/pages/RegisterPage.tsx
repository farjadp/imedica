// ============================================================================
// File: apps/web/src/features/auth/pages/RegisterPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: New account creation flow for Imedica.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@imedica/ui';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { getAuthErrorMessage, register } from '../api/authApi.js';
import { AuthPageShell } from '../components/AuthPageShell.js';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter.js';
import { registerSchema, type RegisterFormValues } from '../types.js';

export function RegisterPage(): JSX.Element {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (_, values) => {
      setRegisteredEmail(values.email);
    },
  });

  const { register: registerField, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      consentAnalytics: false,
    },
  });

  const password = watch('password');
  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  if (registeredEmail) {
    return (
      <AuthPageShell
        eyebrow="Check your inbox"
        title="Verify your email"
        description={`We sent a verification link to ${registeredEmail}. Finish verification before signing in.`}
      >
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success-600" aria-hidden="true" />
          <p className="text-sm text-text-muted">If the email does not arrive in a few minutes, check spam or request a new link later.</p>
          <Link to="/login" className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600">
            Back to login
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Create account"
      title="Start training"
      description="Create your Imedica account to review clinical scenarios and track progress."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" error={errors.firstName?.message} autoComplete="given-name" {...registerField('firstName')} />
          <Input label="Last name" error={errors.lastName?.message} autoComplete="family-name" {...registerField('lastName')} />
        </div>

        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
          error={errors.email?.message}
          autoComplete="email"
          {...registerField('email')}
        />

        <div className="space-y-3">
          <Input
            type="password"
            label="Password"
            error={errors.password?.message}
            autoComplete="new-password"
            {...registerField('password')}
          />
          <PasswordStrengthMeter password={password ?? ''} />
        </div>

        <Input
          type="password"
          label="Confirm password"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...registerField('confirmPassword')}
        />

        <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4 text-sm text-text-muted">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            {...registerField('consentAnalytics')}
          />
          <span>I agree to allow my anonymized training data to improve the platform.</span>
        </label>

        {mutation.isError ? (
          <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/30 dark:text-error-200">
            {getAuthErrorMessage(mutation.error, 'Registration failed. Please try again.')}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Create account
        </Button>

        <p className="text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 transition hover:text-primary-700">
            Login
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
