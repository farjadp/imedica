// ============================================================================
// File: apps/web/src/components/AppShell.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Shared app shell for authenticated and public pages.
// Env / Identity: Web (browser runtime)
// ============================================================================

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn.js';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps): JSX.Element {
  return <div className={cn('min-h-screen bg-background text-text', className)}>{children}</div>;
}
