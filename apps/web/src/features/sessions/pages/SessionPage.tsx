// ============================================================================
// File: apps/web/src/features/sessions/pages/SessionPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Live scenario execution page for paramedic session training.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Button, Card, Modal } from '@imedica/ui';
import { ChevronLeft, Clock3, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';

import { apiClient } from '@/lib/api-client.js';

import { ActionMenu } from '../components/ActionMenu.js';
import { DecisionLog } from '../components/DecisionLog.js';
import { VitalsDisplay } from '../components/VitalsDisplay.js';
import type { SessionDecisionResponse, SessionLoadPayload } from '../types.js';

function renderRichText(html: string): JSX.Element {
  return <div className="prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
}

function formatElapsed(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function formatRuntimeTime(minutes: number): string {
  return `${minutes}:00`;
}

function getCurrentState(session: SessionLoadPayload): SessionLoadPayload['scenario']['states'][number] | null {
  return session.scenario.states.find((state) => state.order === session.currentStateOrder) ?? session.scenario.states[0] ?? null;
}

function isFinalState(session: SessionLoadPayload): boolean {
  const lastState = session.scenario.states[session.scenario.states.length - 1];
  return Boolean(lastState && session.currentStateOrder >= lastState.order);
}

export function SessionPage(): JSX.Element | null {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [session, setSession] = useState<SessionLoadPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasAutoCompleted, setHasAutoCompleted] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSession(): Promise<void> {
      if (!sessionId) {
        setError('Session not found.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<{ success: true; data: SessionLoadPayload }>(`/api/sessions/${sessionId}`);
        if (!cancelled) {
          setSession(response.data.data);
        }
      } catch (fetchError) {
        if (!cancelled) {
          if (isAxiosError(fetchError) && fetchError.response?.status === 404) {
            setError('Session not found.');
          } else {
            setError('Unable to load session.');
          }
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const currentState = useMemo(() => (session ? getCurrentState(session) : null), [session]);
  const startedAt = useMemo(() => (session ? new Date(session.startedAt).getTime() : Date.now()), [session]);
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const estimatedDuration = session?.scenario.estimatedDuration ?? 15;
  const hasSessionEnded = session?.status !== 'RUNNING' && session !== null;
  const reachedFinalState = session ? isFinalState(session) : false;

  useEffect(() => {
    if (!session || hasAutoCompleted || isCompleting) return;
    if (session.status !== 'RUNNING') return;
    if (!reachedFinalState) return;

    setHasAutoCompleted(true);
    void handleComplete(session.id);
  }, [hasAutoCompleted, isCompleting, reachedFinalState, session]);

  const currentVitals = currentState?.vitals ?? {
    hr: null,
    bp: null,
    spo2: null,
    rr: null,
    temp: null,
    ecg: null,
  };

  async function handleAction(actionType: string, actionValue?: string): Promise<void> {
    if (!session || isSubmitting) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await apiClient.post<{ success: true; data: SessionDecisionResponse }>(
        `/api/sessions/${session.id}/decisions`,
        {
          actionType,
          actionValue,
          timestamp: Date.now(),
        },
      );

      const nextSession = response.data.data.session;
      setSession(nextSession);

      if (response.data.data.stateChange?.nextState) {
        setStatusMessage(`Patient condition changed to ${response.data.data.stateChange.nextState.name}.`);
      } else if (response.data.data.feedback) {
        setStatusMessage(response.data.data.feedback.title);
      } else {
        setStatusMessage('Action recorded.');
      }

      if (response.data.data.stateChange?.nextState && response.data.data.stateChange.nextState.order >= nextSession.scenario.states.length - 1) {
        await handleComplete(nextSession.id);
      }
    } catch {
      setStatusMessage('Unable to record action.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete(targetSessionId?: string): Promise<void> {
    const activeSessionId = targetSessionId ?? session?.id;
    if (!activeSessionId || isCompleting) return;

    setIsCompleting(true);
    try {
      await apiClient.post(`/api/sessions/${activeSessionId}/complete`);
      navigate(`/sessions/${activeSessionId}/review`);
    } catch {
      setStatusMessage('Unable to complete session.');
    } finally {
      setIsCompleting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card variant="outlined" padding="lg" className="space-y-4">
          <div className="h-8 w-1/2 rounded bg-surface-muted" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-64 rounded-2xl bg-surface-muted" />
            <div className="h-64 rounded-2xl bg-surface-muted" />
          </div>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Card variant="elevated" padding="lg" className="w-full space-y-4">
          <h1 className="text-2xl font-semibold text-text">Unable to load session</h1>
          <p className="text-sm text-text-muted">{error}</p>
          <Button variant="primary" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => navigate('/scenarios')}>
            Back to Library
          </Button>
        </Card>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  const estimatedTotal = estimatedDuration * 60;

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-text">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary-200/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-info-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card variant="elevated" padding="md" className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => setIsExitOpen(true)}>
                Exit
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-text sm:text-3xl">{session.scenario.title}</h1>
                <p className="mt-1 text-sm text-text-muted">Current state: {currentState?.name ?? 'Initial state'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="info" className="inline-flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                {formatElapsed(elapsedSeconds)} / {formatRuntimeTime(estimatedDuration)}
              </Badge>
              <Badge variant="neutral">Score: {session.totalScore}</Badge>
              <Button variant="secondary" onClick={() => void handleComplete()} isLoading={isCompleting}>
                End Session
              </Button>
            </div>
          </div>

          {statusMessage ? (
            <div className="mt-4 rounded-2xl border border-border bg-surface-muted/60 px-4 py-3 text-sm text-text-muted">
              {statusMessage}
            </div>
          ) : null}
        </Card>

        {hasSessionEnded ? (
          <Card variant="elevated" padding="lg" className="mb-6 space-y-3">
            <h2 className="text-xl font-semibold text-text">Session completed</h2>
            <p className="text-sm text-text-muted">This session is no longer running.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => navigate('/scenarios')}>
                Back to Library
              </Button>
              <Button variant="outline" onClick={() => void handleComplete()} isLoading={isCompleting}>
                Mark complete
              </Button>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card variant="outlined" padding="lg" className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-text">Patient Info</h3>
                <Badge variant="neutral">Time limit: {currentState?.timeLimit ? `${currentState.timeLimit} sec` : 'None'}</Badge>
              </div>
              <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
                {renderRichText(session.scenario.patientPresentation || '<p></p>')}
              </div>
            </Card>

            <VitalsDisplay vitals={currentVitals} />

            <Card variant="outlined" padding="lg" className="space-y-4">
              <h3 className="text-lg font-semibold text-text">Current State</h3>
              <div className="space-y-3">
                <p className="text-2xl font-semibold text-text">{currentState?.name ?? 'Initial State'}</p>
                <p className="text-sm text-text-muted">
                  {currentState?.timeLimit ? `Time limit: ${currentState.timeLimit} seconds` : 'No time limit for this state'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-muted/40 p-4 text-sm text-text-muted">
                {currentState?.symptoms ? renderRichText(currentState.symptoms) : <p>No symptom notes available.</p>}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <ActionMenu disabled={isSubmitting || hasSessionEnded} onAction={handleAction} />
            <DecisionLog decisions={session.decisions} />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isExitOpen}
        onClose={() => setIsExitOpen(false)}
        title="Exit Session"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setIsExitOpen(false)}>
              Keep Going
            </Button>
            <Button
              variant="danger"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={() => {
                setIsExitOpen(false);
                navigate('/scenarios');
              }}
            >
              Exit Session
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">
          Leaving now will take you back to the library. Your progress remains in the session record.
        </p>
      </Modal>
    </main>
  );
}
