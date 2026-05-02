// ============================================================================
// File: packages/ui/src/components/Badge.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Small status and label primitive for the design system.
// Env / Identity: Shared UI package
// ============================================================================

import type { ReactNode } from 'react';

import { cn } from '../lib/cn.js';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

const VARIANT_STYLES = {
  success: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
  error: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300',
  info: 'bg-info-100 text-info-700 dark:bg-info-900/40 dark:text-info-300',
  neutral: 'bg-neutral-100 text-text-muted dark:bg-neutral-800 dark:text-neutral-200',
} as const;

const SIZE_STYLES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
} as const;

/**
 * Pill-shaped label for statuses and roles.
 */
export function Badge({ children, variant = 'neutral', size = 'sm', className }: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium leading-none',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
