// ============================================================================
// File: apps/web/src/lib/query-client.ts
// Version: 1.0.0 — 2026-04-22
// Why: Shared TanStack Query client for the web app.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
