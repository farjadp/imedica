// ============================================================================
// File: packages/ui/src/components/Spinner.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Loading indicator primitive used across the UI package.
// Env / Identity: Shared UI package
// ============================================================================

import { cn } from '../lib/cn.js';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'neutral' | 'white';
}

const SIZE_STYLES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-6 w-6 border-[3px]',
} as const;

const COLOR_STYLES = {
  primary: 'border-primary-500 border-t-transparent',
  neutral: 'border-text-subtle border-t-transparent',
  white: 'border-white border-t-transparent',
} as const;

/**
 * Simple CSS spinner with no JavaScript animation state.
 */
export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps): JSX.Element {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-solid',
        SIZE_STYLES[size],
        COLOR_STYLES[color],
      )}
    />
  );
}
