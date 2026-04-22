// ============================================================================
// File: packages/ui/src/components/Avatar.tsx
// Version: 1.0.0 — 2026-04-22
// Why: User avatar primitive with image and initials fallback.
// Env / Identity: Shared UI package
// ============================================================================

import type { ImgHTMLAttributes } from 'react';

import { cn } from '../lib/cn.js';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> {
  alt: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_STYLES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

function initialsFromFallback(fallback: string | undefined, alt: string): string {
  if (fallback) {
    return fallback;
  }

  return alt
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Circular avatar with an image source or initials fallback.
 */
export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps): JSX.Element {
  const initials = initialsFromFallback(fallback, alt);

  if (src) {
    return <img src={src} alt={alt} className={cn('rounded-full object-cover', SIZE_STYLES[size], className)} {...props} />;
  }

  return (
    <div
      aria-label={alt}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-800 dark:bg-primary-900/40 dark:text-primary-200',
        SIZE_STYLES[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
