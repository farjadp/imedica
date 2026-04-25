// ============================================================================
// File: apps/web/src/features/sessions/components/EnhancedFeedbackCard.tsx
// Version: 1.0.0 — 2026-04-24
// Why: Displays generated clinical insight for a session decision.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useState } from 'react';

import type { FeedbackSource } from '../types.js';

interface EnhancedFeedbackCardProps {
  feedback: string;
  source: FeedbackSource | null;
}

export function EnhancedFeedbackCard({ feedback, source }: EnhancedFeedbackCardProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const ToggleIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <div className="mt-3 rounded-xl border border-info-200 bg-info-50/80 p-4 dark:border-info-900/50 dark:bg-info-900/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-100 text-info-700 dark:bg-info-900/50 dark:text-info-300">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
          </span>
          <h4 className="text-sm font-semibold text-text">Clinical Insight</h4>
        </div>

        {import.meta.env.DEV && source ? (
          <span className="rounded-full bg-info-100 px-2 py-1 text-xs font-medium text-info-700 dark:bg-info-900/50 dark:text-info-300">
            {source}
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        {isExpanded ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">{feedback}</p>
        ) : (
          <p className="line-clamp-3 text-sm leading-relaxed text-text-muted">{feedback}</p>
        )}
      </div>

      {feedback.length > 200 ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-info-700 transition hover:text-info-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-info-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:text-info-300 dark:hover:text-info-200"
        >
          {isExpanded ? 'Show less' : 'Read full insight'}
          <ToggleIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
