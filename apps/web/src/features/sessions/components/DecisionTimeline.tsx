// ============================================================================
// File: apps/web/src/features/sessions/components/DecisionTimeline.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Chronological decision timeline for post-session review.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Card } from '@imedica/ui';

import type { SessionDecisionRecord, SessionFeedbackTemplate } from '../types.js';

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function renderRichText(html: string): JSX.Element {
  return <div className="prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
}

function getTone(decision: SessionDecisionRecord): 'success' | 'warning' | 'error' {
  if (decision.pointsAwarded > 0) return 'success';
  if (decision.pointsAwarded < 0) return 'error';
  return 'warning';
}

function getLabel(decision: SessionDecisionRecord): string {
  if (decision.pointsAwarded > 0) return 'Correct';
  if (decision.pointsAwarded < 0) return 'Incorrect';
  return 'Suboptimal';
}

function getIndicator(decision: SessionDecisionRecord): string {
  if (decision.pointsAwarded > 0) return '✅';
  if (decision.pointsAwarded < 0) return '❌';
  return '⚠️';
}

export function DecisionTimeline({
  decisions,
  templates,
}: {
  decisions: SessionDecisionRecord[];
  templates: SessionFeedbackTemplate[];
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

            return (
              <div
                key={decision.id}
                className={`rounded-2xl border-l-4 ${
                  decision.pointsAwarded > 0
                    ? 'border-l-success-600'
                    : decision.pointsAwarded < 0
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

