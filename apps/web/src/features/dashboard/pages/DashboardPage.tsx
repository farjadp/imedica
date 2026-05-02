// ============================================================================
// File: apps/web/src/features/dashboard/pages/DashboardPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Authenticated landing page with an empty-state shell for Phase 2.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Card } from '@imedica/ui';
import { BookOpen, LayoutDashboard, Settings2 } from 'lucide-react';


import { DashboardHeader } from '../components/DashboardHeader.js';

const shortcuts = [
  { label: 'Scenarios', icon: BookOpen },
  { label: 'My Progress', icon: LayoutDashboard },
  { label: 'Settings', icon: Settings2 },
] as const;

export function DashboardPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-background text-text">
      <DashboardHeader />

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Card variant="elevated" padding="lg" className="w-full max-w-4xl">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-text-subtle">Dashboard</p>
              <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                Welcome back to Imedica
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
                No scenarios are available yet. This shell is ready for Phase 3 scenario delivery and progress tracking.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {shortcuts.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text-muted">
                    <item.icon className="h-4 w-4 text-primary-600" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-border bg-surface-muted p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated shadow-sm">
                <BookOpen className="h-8 w-8 text-primary-600" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-text">Nothing to review yet</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                Your scenario library and performance timeline will appear here when training content is published.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
