// ============================================================================
// File: packages/ui/src/lib/cn.ts
// Version: 1.0.0 — 2026-04-22
// Why: Small class name combiner for the UI package.
// Env / Identity: Shared UI package
// ============================================================================

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
