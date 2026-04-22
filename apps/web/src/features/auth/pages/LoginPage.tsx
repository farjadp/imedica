// ============================================================================
// File: apps/web/src/features/auth/pages/LoginPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Login screen for authenticated entry into Imedica.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@imedica/ui';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { getAuthErrorMessage, login } from '../api/authApi.js';
import { AuthPageShell } from '../components/AuthPageShell.js';
import { useAuthStore } from '../store/authStore.js';
import { loginSchema, type LoginFormValues } from '../types.js';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      navigate('/dashboard');
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <AuthPageShell
      eyebrow="Clinical access"
      title="Welcome back"
      description="Sign in to continue training, reviewing decisions, and managing your account."
    >
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

        <Input
          type="password"
          label="Password"
          placeholder="Your password"
          error={errors.password?.message}
          autoComplete="current-password"
          {...register('password')}
        />

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
              {...register('rememberMe')}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-primary-600 transition hover:text-primary-700">
            Forgot password?
          </Link>
        </div>

        {mutation.isError ? (
          <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/30 dark:text-error-200">
            {getAuthErrorMessage(mutation.error, 'Login failed. Please try again.')}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isLoading={mutation.isPending} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Sign in
        </Button>

        <p className="text-center text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-primary-600 transition hover:text-primary-700">
            Register
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
