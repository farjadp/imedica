// ============================================================================
// File: packages/ui/src/components/Button.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Primary interactive button primitive for the Imedica design system.
// Env / Identity: Shared UI package
// ============================================================================

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

import { cn } from '../lib/cn.js';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary:
    'bg-surface-muted text-text hover:bg-neutral-200 focus-visible:ring-primary-500 dark:hover:bg-neutral-700',
  outline:
    'border border-border bg-transparent text-text hover:bg-surface-muted focus-visible:ring-primary-500',
  ghost: 'bg-transparent text-text hover:bg-surface-muted focus-visible:ring-primary-500',
  danger:
    'bg-error-600 text-white shadow-sm hover:bg-error-700 focus-visible:ring-error-500',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-2',
  md: 'h-10 px-4 text-sm gap-2.5',
  lg: 'h-12 px-5 text-base gap-3',
};

/**
 * Button primitive with brand-aware variants and an accessible loading state.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className,
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref,
): JSX.Element {
  const isDisabled = disabled === true || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-[transform,filter,background-color,border-color,color,box-shadow] duration-200 ease-standard',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100',
        'hover:brightness-[1.02]',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
      aria-busy={isLoading ? true : undefined}
      aria-disabled={isDisabled ? true : undefined}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <span
          role="status"
          aria-label="Loading"
          className="inline-flex h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : leftIcon ? (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center">
          {leftIcon}
        </span>
      ) : null}

      <span className="inline-flex items-center">{children}</span>

      {!isLoading && rightIcon ? (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center">
          {rightIcon}
        </span>
      ) : null}
    </button>
  );
});
