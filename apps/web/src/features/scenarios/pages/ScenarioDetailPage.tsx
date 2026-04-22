// ============================================================================
// File: apps/web/src/features/scenarios/pages/ScenarioDetailPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Public scenario detail page for paramedics to review training content.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Button, Card } from '@imedica/ui';
import { ChevronLeft, ChevronRight, Heart, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';

import { apiClient } from '@/lib/api-client.js';

import { SCENARIO_CATEGORY_META, SCENARIO_DIFFICULTY_LABELS, SCENARIO_DIFFICULTY_VARIANTS, type ScenarioCategory, type ScenarioDifficulty } from '../types.js';

interface PublicScenarioState {
  id: string;
  order: number;
  name: string;
}

interface PublicScenarioDetail {
  id: string;
  title: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  estimatedDuration: number;
  patientPresentation: string;
  learningObjectives: string;
  states: PublicScenarioState[];
}

function renderRichText(html: string): JSX.Element {
  return <div className="prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
}

function getCategoryIcon(category: ScenarioCategory): LucideIcon {
  return SCENARIO_CATEGORY_META[category].icon;
}

export function ScenarioDetailPage(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams();
  const [scenario, setScenario] = useState<PublicScenarioDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadScenario(): Promise<void> {
      if (!id) {
        setError('Scenario not found.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<{ success: true; data: PublicScenarioDetail }>(`/api/scenarios/${id}/public`);
        if (!cancelled) {
          setScenario(response.data.data);
        }
      } catch (fetchError) {
        if (!cancelled) {
          if (isAxiosError(fetchError) && fetchError.response?.status === 404) {
            setError('Scenario not found or not yet published.');
          } else {
            setError('Unable to load scenario details. Please try again.');
          }
          setScenario(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadScenario();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const CategoryIcon = useMemo(() => {
    if (!scenario) return Heart;
    return getCategoryIcon(scenario.category);
  }, [scenario]);

  async function handleStartScenario(): Promise<void> {
    if (!scenario) return;

    setIsStarting(true);
    setError(null);

    try {
      const response = await apiClient.post<{ success: true; data: { sessionId: string } }>('/api/sessions', {
        scenarioId: scenario.id,
      });
      navigate(`/sessions/${response.data.data.sessionId}`);
    } catch {
      setError('Unable to start the session. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-text">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary-200/25 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-info-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="outline" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => navigate('/scenarios')}>
            Back to Library
          </Button>
        </div>

        {isLoading ? (
          <Card variant="outlined" padding="lg" className="space-y-4">
            <div className="h-8 w-2/3 rounded bg-surface-muted" />
            <div className="h-4 w-1/2 rounded bg-surface-muted" />
            <div className="h-40 rounded-2xl bg-surface-muted" />
          </Card>
        ) : error ? (
          <Card variant="elevated" padding="lg" className="space-y-4">
            <h1 className="text-2xl font-semibold text-text">Unable to load scenario</h1>
            <p className="text-sm leading-relaxed text-text-muted">{error}</p>
            <Button variant="primary" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => navigate('/scenarios')}>
              Return to Library
            </Button>
          </Card>
        ) : scenario ? (
          <div className="space-y-6">
            <Card variant="elevated" padding="lg" className="space-y-4">
              <div className="space-y-4 border-b border-border pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral" className="inline-flex items-center gap-2">
                    <CategoryIcon className="h-3.5 w-3.5" />
                    {SCENARIO_CATEGORY_META[scenario.category].label}
                  </Badge>
                  <Badge variant={SCENARIO_DIFFICULTY_VARIANTS[scenario.difficulty]}>
                    {SCENARIO_DIFFICULTY_LABELS[scenario.difficulty]}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">{scenario.title}</h1>
                  <p className="max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">{scenario.description}</p>
                  <p className="text-sm font-medium text-text-muted">Estimated duration: {scenario.estimatedDuration} minutes</p>
                </div>
              </div>
            </Card>

            <div className="grid gap-6">
              <Card variant="outlined" padding="lg" className="space-y-3">
                <h2 className="text-xl font-semibold text-text">Patient Presentation</h2>
                <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
                  {renderRichText(scenario.patientPresentation || '<p></p>')}
                </div>
              </Card>

              <Card variant="outlined" padding="lg" className="space-y-3">
                <h2 className="text-xl font-semibold text-text">Learning Objectives</h2>
                <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
                  {renderRichText(scenario.learningObjectives || '<p></p>')}
                </div>
              </Card>

              <Card variant="outlined" padding="lg" className="space-y-4">
                <h2 className="text-xl font-semibold text-text">What to Expect</h2>
                {scenario.states.length > 0 ? (
                  <ol className="space-y-3">
                    {scenario.states
                      .slice()
                      .sort((left, right) => left.order - right.order)
                      .map((state) => (
                        <li key={state.id} className="flex items-start gap-3 rounded-2xl border border-border bg-surface-muted/40 px-4 py-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                            {state.order + 1}
                          </span>
                          <div>
                            <p className="font-medium text-text">{state.name}</p>
                          </div>
                        </li>
                      ))}
                  </ol>
                ) : (
                  <p className="text-sm text-text-muted">Scenario states are being prepared for this scenario.</p>
                )}
              </Card>

              <Card variant="elevated" padding="lg" className="space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-text">Ready to begin?</h2>
                  <p className="mx-auto max-w-2xl text-sm leading-relaxed text-text-muted">
                    Start the scenario when you are ready to begin the training session. Tracking will be enabled in Phase 4.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    onClick={() => void handleStartScenario()}
                    isLoading={isStarting}
                  >
                    Start Scenario
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
