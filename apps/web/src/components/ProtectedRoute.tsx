// ============================================================================
// File: apps/web/src/components/ProtectedRoute.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Guarded route wrapper for authenticated sections of the web app.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Spinner } from '@imedica/ui';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';


import { useAuthStore } from '@/features/auth/store/authStore.js';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
