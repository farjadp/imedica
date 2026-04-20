// ============================================================================
// File: apps/web/src/lib/utils.ts
// Version: 1.0.0 — 2026-04-20
// Why: Shared utility functions for the frontend. Includes the `cn` 
//      utility for resolving conditional Tailwind classes safely.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
