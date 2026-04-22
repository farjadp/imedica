// ============================================================================
// File: apps/web/src/features/auth/pages/VerifyEmailPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Email verification page that auto-submits the token from the link.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Button, Spinner } from '@imedica/ui';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, MailWarning } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';


import { getAuthErrorMessage, verifyEmail } from '../api/authApi.js';
import { AuthPageShell } from '../components/AuthPageShell.js';

export function VerifyEmailPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [redirecting, setRedirecting] = useState(false);

  const mutation = useMutation({
    mutationFn: () => verifyEmail({ token }),
    onSuccess: () => {
      setRedirecting(true);
      window.setTimeout(() => navigate('/login', { replace: true, state: { message: 'Email verified' } }), 1800);
    },
  });

  useEffect(() => {
    if (token) {
      void mutation.mutateAsync();
    }
  }, [mutation, token]);

  if (!token) {
    return (
      <AuthPageShell
        eyebrow="Email verification"
        title="Missing token"
        description="This verification link is incomplete. Request a new email verification link."
      >
        <div className="space-y-4 text-center">
          <MailWarning className="mx-auto h-12 w-12 text-warning-500" aria-hidden="true" />
          <Link to="/login" className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600">
            Back to login
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  if (redirecting) {
    return (
      <AuthPageShell
        eyebrow="Email verified"
        title="Verification complete"
        description="Your email is verified. Redirecting you back to login."
      >
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success-600" aria-hidden="true" />
          <p className="text-sm text-text-muted">You can now sign in.</p>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Email verification"
      title="Verifying your email"
      description="Please wait while we confirm your verification link."
    >
      <div className="flex items-center justify-center py-6">
        {mutation.isPending ? <Spinner size="lg" /> : null}
      </div>

      {mutation.isError ? (
        <div className="space-y-4 text-center">
          <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/30 dark:text-error-200">
            {getAuthErrorMessage(mutation.error, 'Verification failed. Request a new link.')}
          </p>
          <Button type="button" onClick={() => navigate('/login')}>
            Back to login
          </Button>
        </div>
      ) : null}
    </AuthPageShell>
  );
}
