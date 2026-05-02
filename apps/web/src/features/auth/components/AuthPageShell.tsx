// ============================================================================
// File: apps/web/src/features/auth/components/AuthPageShell.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Shared shell for auth pages to keep layout and brand treatment consistent.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Card } from '@imedica/ui';
import type { ReactNode } from 'react';


interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthPageShell({ eyebrow, title, description, children }: AuthPageShellProps): JSX.Element {
  return (
    <main className="min-h-screen bg-background text-text">
      <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.14),_transparent_30%),linear-gradient(180deg,_var(--color-neutral-50)_0%,_var(--color-neutral-100)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.15),_transparent_28%),linear-gradient(180deg,_var(--color-background)_0%,_var(--color-neutral-900)_100%)]"
        />

        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface shadow-md">
              <span className="text-2xl font-semibold text-primary-600">+</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-text-subtle">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">{description}</p>
          </div>

          <Card variant="elevated" padding="lg" className="backdrop-blur-sm">
            {children}
          </Card>
        </div>
      </section>
    </main>
  );
}
