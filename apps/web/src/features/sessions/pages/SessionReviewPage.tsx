// ============================================================================
// File: apps/web/src/features/sessions/pages/SessionReviewPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Post-session review page with score summary and decision timeline.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Button, Card } from '@imedica/ui';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { apiClient } from '@/lib/api-client.js';

import { getSession } from '../api/sessionsApi.js';
import { DecisionTimeline } from '../components/DecisionTimeline.js';
import { ScoreCard } from '../components/ScoreCard.js';
import { useEnhancedFeedbackPolling } from '../hooks/useEnhancedFeedbackPolling.js';
import type { SessionRuntimePayload } from '../types.js';

function renderRichText(html: string): JSX.Element {
  return <div className="prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
}

function formatTitleCase(actionType: string): string {
  return actionType
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(' ');
}

export function SessionReviewPage(): JSX.Element {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const {
    data: session,
    error: loadError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId ?? ''),
    enabled: Boolean(sessionId),
    retry: false,
  });

  const { status: feedbackStatus, isPolling } = useEnhancedFeedbackPolling(
    session?.status === 'COMPLETED' ? sessionId : undefined,
  );

  useEffect(() => {
    if (feedbackStatus?.isComplete && !isPolling) {
      void refetch();
    }
  }, [feedbackStatus?.isComplete, isPolling, refetch]);

  const feedbackTemplates = useMemo(() => session?.scenario.feedbackTemplates ?? [], [session]);
  const error = !sessionId
    ? 'Session not found.'
    : loadError
      ? isAxiosError(loadError) && loadError.response?.status === 404
        ? 'Session not found.'
        : 'Unable to load session review.'
      : null;

  async function handleRetry(): Promise<void> {
    if (!session) return;

    setIsRetrying(true);
    setRetryError(null);

    try {
      const response = await apiClient.post<{ success: true; data: SessionRuntimePayload }>('/api/sessions', {
        scenarioId: session.scenarioId,
      });
      navigate(`/sessions/${response.data.data.sessionId}`);
    } catch {
      setRetryError('Unable to retry the scenario right now.');
    } finally {
      setIsRetrying(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card variant="outlined" padding="lg" className="space-y-4">
          <div className="h-8 w-1/2 rounded bg-surface-muted" />
          <div className="h-40 rounded-2xl bg-surface-muted" />
          <div className="h-72 rounded-2xl bg-surface-muted" />
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Card variant="elevated" padding="lg" className="w-full space-y-4">
          <h1 className="text-2xl font-semibold text-text">Unable to load review</h1>
          <p className="text-sm text-text-muted">{error}</p>
          <Button variant="primary" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => navigate('/scenarios')}>
            Back to Library
          </Button>
        </Card>
      </main>
    );
  }

  if (!session) {
    return <></>;
  }

  const totalScore = session.totalScore;
  const maxScore = session.maxPossibleScore ?? Math.max(totalScore, 1);
  const estimatedDuration = session.scenario.estimatedDuration;
  const decisionCount = session.decisions.length;
  const completedAt = session.completedAt ?? new Date().toISOString();

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-text">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary-200/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-info-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button variant="outline" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => navigate('/scenarios')}>
            Back to Library
          </Button>
          <Button variant="primary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => void handleRetry()} isLoading={isRetrying}>
            Retry Scenario
          </Button>
        </div>

        <div className="space-y-6">
          {retryError ? (
            <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-900/40 dark:bg-error-900/20 dark:text-error-300">
              {retryError}
            </div>
          ) : null}

          <Card variant="elevated" padding="lg" className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-text-subtle">Session Complete</p>
            <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">{session.scenario.title}</h1>
            <p className="text-sm text-text-muted">{session.scenario.description}</p>
          </Card>

          <ScoreCard
            totalScore={totalScore}
            maxScore={maxScore}
            startedAt={session.startedAt}
            completedAt={completedAt}
            estimatedDuration={estimatedDuration}
            decisionCount={decisionCount}
          />

          <DecisionTimeline decisions={session.decisions} templates={feedbackTemplates} enhancedFeedbackStatus={feedbackStatus} />

          <Card variant="outlined" padding="lg" className="space-y-3 text-center">
            <h2 className="text-xl font-semibold text-text">Next steps</h2>
            <p className="text-sm text-text-muted">You can retry the same scenario to practice again or return to the library to select a different case.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => void handleRetry()} isLoading={isRetrying}>
                Retry Scenario
              </Button>
              <Button variant="outline" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => navigate('/scenarios')}>
                Back to Library
              </Button>
            </div>
          </Card>

          <Card variant="outlined" padding="lg" className="space-y-3">
            <h2 className="text-xl font-semibold text-text">Scenario Snapshot</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-muted">Patient Presentation</p>
                <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
                  {renderRichText(session.scenario.patientPresentation || '<p></p>')}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-muted">Learning Objectives</p>
                <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
                  {renderRichText(session.scenario.learningObjectives || '<p></p>')}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
              <p className="text-sm font-medium text-text-muted">Actions Recorded</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {session.decisions.map((decision) => (
                  <span key={decision.id} className="rounded-full bg-background px-3 py-1 text-xs font-medium text-text-muted">
                    {formatTitleCase(decision.actionType)}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
