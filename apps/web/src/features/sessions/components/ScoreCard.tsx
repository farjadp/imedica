// ============================================================================
// File: apps/web/src/features/sessions/components/ScoreCard.tsx
// Version: 1.0.0 — 2026-04-22
// Why: High-level score summary card for the post-session review page.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Card } from '@imedica/ui';
import { Clock3, ListChecks, Award } from 'lucide-react';

import { calculateSessionGrade, getGradeTone } from '../utils/gradeCalculator.js';

interface ScoreCardProps {
  totalScore: number;
  maxScore: number;
  startedAt: string;
  completedAt: string | null;
  estimatedDuration: number;
  decisionCount: number;
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function ScoreCard({
  totalScore,
  maxScore,
  startedAt,
  completedAt,
  estimatedDuration,
  decisionCount,
}: ScoreCardProps): JSX.Element {
  const grade = calculateSessionGrade(totalScore, maxScore);
  const tone = getGradeTone(grade);
  const endTime = completedAt ? new Date(completedAt).getTime() : Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((endTime - new Date(startedAt).getTime()) / 1000));

  return (
    <Card variant="elevated" padding="lg" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-text-subtle">Score Summary</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text">
            {totalScore} / {maxScore}
          </h2>
        </div>
        <Badge variant={tone} className="inline-flex items-center gap-2 text-sm">
          <Award className="h-3.5 w-3.5" />
          Grade {grade}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">Time taken</p>
          <p className="mt-2 text-lg font-semibold text-text">
            {formatElapsed(elapsedSeconds)} / {formatElapsed(estimatedDuration * 60)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">Decisions</p>
          <p className="mt-2 text-lg font-semibold text-text inline-flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-text-muted" />
            {decisionCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">Elapsed</p>
          <p className="mt-2 text-lg font-semibold text-text inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-text-muted" />
            {formatElapsed(elapsedSeconds)}
          </p>
        </div>
      </div>
    </Card>
  );
}

