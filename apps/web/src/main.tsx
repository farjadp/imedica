// ============================================================================
// File: apps/web/src/main.tsx
// Version: 1.1.0 — 2026-04-22
// Why: React 18 entry point. Sets up the shared QueryClient and renders the
//      app shell with global styles and design tokens.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.js';
import './styles/globals.css';

// ─── TanStack Query Client ───────────────────────────────────────────────────
const queryClient = new QueryClient({
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
