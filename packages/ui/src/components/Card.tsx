// ============================================================================
// File: packages/ui/src/components/Card.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Surface primitive for grouping related content in a calm, consistent way.
// Env / Identity: Shared UI package
// ============================================================================

import type { ElementType, ReactNode } from 'react';

import { cn } from '../lib/cn.js';

export interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: ElementType;
  className?: string;
}

const VARIANT_STYLES = {
  default: 'border border-border bg-surface shadow-sm',
  outlined: 'border border-border bg-surface',
  elevated: 'border border-border bg-surface shadow-lg',
} as const;

const PADDING_STYLES = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

/**
 * Card primitive for structured content blocks.
 */
export function Card({
  children,
  variant = 'default',
  padding = 'md',
  as: Component = 'section',
  className,
}: CardProps): JSX.Element {
  return (
    <Component className={cn('rounded-xl', VARIANT_STYLES[variant], PADDING_STYLES[padding], className)}>
      {children}
    </Component>
  );
}
