// ============================================================================
// File: apps/web/src/components/AuthBootstrap.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Runs auth bootstrap once when the web app starts.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/store/authStore.js';

export function AuthBootstrap(): null {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return null;
}
