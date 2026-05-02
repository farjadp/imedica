// ============================================================================
// File: apps/web/src/features/sessions/components/EnhancedFeedbackLoading.tsx
// Version: 1.0.0 — 2026-04-24
// Why: Shows progress while enhanced decision feedback is generated.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Spinner } from '@imedica/ui';

interface EnhancedFeedbackLoadingProps {
  completed: number;
  total: number;
}

export function EnhancedFeedbackLoading({ completed, total }: EnhancedFeedbackLoadingProps): JSX.Element {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mt-3 rounded-xl border border-warning-200 bg-warning-50/80 p-4 dark:border-warning-900/50 dark:bg-warning-900/20">
      <div className="flex items-center gap-3">
        <Spinner size="md" color="neutral" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text">Generating clinical insights...</p>
          <p className="mt-1 text-xs text-text-muted">
            {completed} of {total} complete ({percentage}%)
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-warning-500 transition-all duration-300" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
