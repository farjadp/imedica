// ============================================================================
// File: packages/ui/src/components/Input.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Text input primitive with label, helper/error text, and icon support.
// Env / Identity: Shared UI package
// ============================================================================

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../lib/cn.js';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  helperText?: string | undefined;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/**
 * Accessible input primitive with brand-aware focus states.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className,
    disabled,
    'aria-label': ariaLabel,
    ...props
  },
  ref,
): JSX.Element {
  const inputId = id ?? props.name ?? 'imedica-input';
  const descriptionId = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-text">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {leftIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-subtle"
          >
            {leftIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          aria-label={ariaLabel ?? label}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          disabled={disabled}
          className={cn(
            'block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm transition duration-200 ease-standard',
            'placeholder:text-text-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-subtle',
            Boolean(leftIcon) && 'pl-10',
            Boolean(rightIcon) && 'pr-10',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
            className,
          )}
          {...props}
        />

        {rightIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-subtle"
          >
            {rightIcon}
          </span>
        ) : null}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-error-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-sm text-text-subtle">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
