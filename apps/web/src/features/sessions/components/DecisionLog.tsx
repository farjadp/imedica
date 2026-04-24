// ============================================================================
// File: apps/web/src/features/sessions/components/DecisionLog.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Scrollable decision log for live session recording.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Card } from '@imedica/ui';
import { useEffect, useRef } from 'react';

import type { SessionDecisionRecord } from '../types.js';

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function getTone(decision: SessionDecisionRecord): 'success' | 'warning' | 'error' | 'neutral' {
  if (decision.isCorrect === true) return 'success';
  if (decision.isCorrect === false && decision.pointsAwarded < 0) return 'error';
  if (decision.isCorrect === false) return 'warning';
  return 'neutral';
}

export function DecisionLog({ decisions }: { decisions: SessionDecisionRecord[] }): JSX.Element {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [decisions]);

  return (
    <Card variant="outlined" padding="lg" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text">Decision Log</h3>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">{decisions.length} actions</p>
      </div>

      <div ref={listRef} className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {decisions.length > 0 ? (
          decisions.map((decision) => (
            <div key={decision.id} className="rounded-2xl border border-border bg-surface-muted/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-text">
                    {formatClock(decision.timeFromStart)} - {decision.actionType}
                    {decision.actionValue ? ` (${decision.actionValue})` : ''}
                  </p>
                  <p className="text-xs text-text-subtle">{new Date(decision.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <Badge variant={getTone(decision)}>{decision.pointsAwarded >= 0 ? `+${decision.pointsAwarded}` : decision.pointsAwarded}</Badge>
              </div>
              <p className="mt-2 text-sm text-text-muted">
                {decision.isCorrect === true ? 'Correct' : decision.isCorrect === false ? 'Suboptimal' : 'Recorded'}
                {decision.feedbackKey ? ` · ${decision.feedbackKey}` : ''}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-muted">No decisions recorded yet.</p>
        )}
      </div>
    </Card>
  );
}

