// ============================================================================
// File: apps/web/src/features/sessions/components/DecisionTimeline.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Chronological decision timeline for post-session review.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Card } from '@imedica/ui';

import type { EnhancedFeedbackStatus, SessionDecisionRecord, SessionFeedbackTemplate } from '../types.js';

import { EnhancedFeedbackCard } from './EnhancedFeedbackCard.js';
import { EnhancedFeedbackLoading } from './EnhancedFeedbackLoading.js';

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function renderRichText(html: string): JSX.Element {
  return <div className="prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
}

function getTone(decision: SessionDecisionRecord): 'success' | 'warning' | 'error' {
  if (decision.isCorrect === true) return 'success';
  if (decision.isCorrect === false) return 'error';
  return 'warning';
}

function getLabel(decision: SessionDecisionRecord): string {
  if (decision.isCorrect === true) return 'Correct';
  if (decision.isCorrect === false) return 'Incorrect';
  return 'Suboptimal';
}

function getIndicator(decision: SessionDecisionRecord): string {
  if (decision.isCorrect === true) return '✅';
  if (decision.isCorrect === false) return '❌';
  return '⚠️';
}

export function DecisionTimeline({
  decisions,
  templates,
  enhancedFeedbackStatus,
}: {
  decisions: SessionDecisionRecord[];
  templates: SessionFeedbackTemplate[];
  enhancedFeedbackStatus?: EnhancedFeedbackStatus | undefined;
}): JSX.Element {
  return (
    <Card variant="outlined" padding="lg" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-text-subtle">Timeline</p>
          <h2 className="mt-2 text-xl font-semibold text-text">Decision Review</h2>
        </div>
        <Badge variant="neutral">{decisions.length} decisions</Badge>
      </div>

      <div className="space-y-3">
        {decisions.length > 0 ? (
          decisions.map((decision) => {
            const feedbackTemplate = decision.feedbackKey
              ? templates.find((template) => template.key === decision.feedbackKey)
              : null;
            const hasEnhancedFeedback = typeof decision.enhancedFeedback === 'string' && decision.enhancedFeedback.trim().length > 0;
            const showEnhancedFeedbackLoading =
              !hasEnhancedFeedback &&
              enhancedFeedbackStatus !== undefined &&
              enhancedFeedbackStatus.total > 0 &&
              !enhancedFeedbackStatus.isComplete;

            return (
              <div
                key={decision.id}
                className={`rounded-2xl border-l-4 ${
                  decision.isCorrect === true
                    ? 'border-l-success-600'
                    : decision.isCorrect === false
                      ? 'border-l-error-600'
                      : 'border-l-warning-500'
                } border border-border bg-surface-muted/50 p-4`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {formatClock(decision.timeFromStart)} - {decision.actionType}
                      {decision.actionValue ? ` (${decision.actionValue})` : ''}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-subtle">{getIndicator(decision)} {getLabel(decision)}</p>
                  </div>
                  <Badge variant={getTone(decision)}>
                    {decision.pointsAwarded >= 0 ? `+${decision.pointsAwarded}` : decision.pointsAwarded} pts
                  </Badge>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-sm text-text-muted">
                    {feedbackTemplate ? feedbackTemplate.title : decision.feedbackKey ?? 'No feedback template matched.'}
                  </p>
                  {feedbackTemplate ? renderRichText(feedbackTemplate.message) : null}
                </div>

                {hasEnhancedFeedback ? (
                  <EnhancedFeedbackCard feedback={decision.enhancedFeedback ?? ''} source={decision.feedbackSource} />
                ) : showEnhancedFeedbackLoading ? (
                  <EnhancedFeedbackLoading completed={enhancedFeedbackStatus.completed} total={enhancedFeedbackStatus.total} />
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-text-muted">No decisions were recorded for this session.</p>
        )}
      </div>
    </Card>
  );
}
