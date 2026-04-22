// ============================================================================
// File: packages/ui/src/components/Timer.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Countdown timer used by scenario runtime and feedback surfaces.
// Env / Identity: Shared UI package
// ============================================================================

import { useEffect, useState } from 'react';

import { cn } from '../lib/cn.js';

export interface TimerProps {
  seconds: number;
  isRunning: boolean;
  onComplete?: () => void;
  variant?: 'default' | 'warning' | 'danger';
}

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Countdown timer with urgency-based color transitions.
 */
export function Timer({
  seconds,
  isRunning,
  onComplete,
  variant = 'default',
}: TimerProps): JSX.Element {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning || remaining <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRemaining((current) => {
        const nextValue = Math.max(current - 1, 0);

        if (nextValue === 0) {
          onComplete?.();
        }

        return nextValue;
      });
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [isRunning, onComplete, remaining]);

  const isUrgent = remaining <= 10;
  const isWarning = remaining <= 30;

  const colorClasses =
    variant === 'danger' || isUrgent
      ? 'text-error-600'
      : variant === 'warning' || isWarning
        ? 'text-warning-600'
        : 'text-success-600';

  return (
    <div
      role="timer"
      aria-live="polite"
      className={cn(
        'inline-flex min-w-[4.5rem] items-center justify-center rounded-full border border-border bg-surface px-3 py-1 font-mono text-sm font-medium tabular-nums',
        colorClasses,
        isUrgent && isRunning && 'animate-pulse',
      )}
    >
      {formatSeconds(remaining)}
    </div>
  );
}
