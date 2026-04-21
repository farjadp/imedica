// ============================================================================
// File: apps/web/src/main.tsx
// Version: 1.0.0 — 2026-04-20
// Why: React 18 entry point. Sets up QueryClient, BrowserRouter, and renders
//      the App component. Phase 1 scaffold — full routing and auth context
//      comes in Phase 2.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.js';
import './styles/globals.css';

// ─── TanStack Query Client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutes
      gcTime: 1000 * 60 * 10,       // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─── React Root ───────────────────────────────────────────────────────────────
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
