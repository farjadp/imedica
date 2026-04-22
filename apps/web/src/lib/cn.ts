// ============================================================================
// File: apps/web/src/lib/cn.ts
// Version: 1.0.0 — 2026-04-22
// Why: Small class name combiner for the web app.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
