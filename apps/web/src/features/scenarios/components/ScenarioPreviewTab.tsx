// ============================================================================
// File: apps/web/src/features/scenarios/components/ScenarioPreviewTab.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Read-only preview tab showing the scenario as a paramedic would see it.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Card } from '@imedica/ui';
import { useEffect, useMemo, useState } from 'react';

import { apiClient } from '@/lib/api-client.js';

import { SCENARIO_CATEGORY_META, SCENARIO_DIFFICULTY_LABELS, type ScenarioDifficulty } from '../types.js';

interface ScenarioPreviewState {
  id: string;
  order: number;
  name: string;
  vitals: {
    hr: number | null;
    bp: string | null;
    spo2: number | null;
    rr: number | null;
    temp: number | null;
    ecg: string | null;
  };
  physicalExam: string | null;
  symptoms: string | null;
  timeLimit: number | null;
}

interface ScenarioPreviewRule {
  id: string;
  name: string;
}

interface ScenarioPreviewTemplate {
  id: string;
  key: string;
}

interface ScenarioPreviewRecord {
  id: string;
  title: string;
  description: string;
  category: keyof typeof SCENARIO_CATEGORY_META;
  difficulty: ScenarioDifficulty;
  estimatedDuration: number;
  patientPresentation: string;
  learningObjectives: string;
  states: ScenarioPreviewState[];
  rules: ScenarioPreviewRule[];
  feedbackTemplates: ScenarioPreviewTemplate[];
}

interface ScenarioPreviewTabProps {
  scenarioId: string | null;
  title: string;
  description: string;
  category: keyof typeof SCENARIO_CATEGORY_META;
  difficulty: ScenarioDifficulty;
  estimatedDuration: number;
  patientPresentation: string;
  learningObjectives: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatVitals(vitals: ScenarioPreviewState['vitals']): string {
  const parts = [
    vitals.hr !== null ? `HR ${vitals.hr}` : null,
    vitals.bp ? `BP ${vitals.bp}` : null,
    vitals.spo2 !== null ? `SpO2 ${vitals.spo2}%` : null,
    vitals.rr !== null ? `RR ${vitals.rr}` : null,
    vitals.temp !== null ? `Temp ${vitals.temp.toFixed(1)}°C` : null,
    vitals.ecg ? `ECG ${vitals.ecg}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : 'No vitals entered';
}

function renderRichText(html: string): JSX.Element {
  return <div className="prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ScenarioPreviewTab({
  scenarioId,
  title,
  description,
  category,
  difficulty,
  estimatedDuration,
  patientPresentation,
  learningObjectives,
}: ScenarioPreviewTabProps): JSX.Element {
  const [scenario, setScenario] = useState<ScenarioPreviewRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadScenario(): Promise<void> {
      if (!scenarioId) {
        setScenario(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get<{ success: true; data: ScenarioPreviewRecord }>(`/api/scenarios/${scenarioId}`);
        if (!cancelled) {
          setScenario(response.data.data);
          setMessage(null);
        }
      } catch {
        if (!cancelled) {
          setScenario(null);
          setMessage('Unable to load preview data from the server.');
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
  }, [scenarioId]);

  const previewData = scenario
    ? {
        title: scenario.title,
        description: scenario.description,
        category: scenario.category,
        difficulty: scenario.difficulty,
        estimatedDuration: scenario.estimatedDuration,
        patientPresentation: scenario.patientPresentation,
        learningObjectives: scenario.learningObjectives,
        states: scenario.states,
        rules: scenario.rules,
        feedbackTemplates: scenario.feedbackTemplates,
      }
    : {
        title,
        description,
        category,
        difficulty,
        estimatedDuration,
        patientPresentation,
        learningObjectives,
        states: [] as ScenarioPreviewState[],
        rules: [] as ScenarioPreviewRule[],
        feedbackTemplates: [] as ScenarioPreviewTemplate[],
      };

  const counts = useMemo(
    () => ({
      states: previewData.states.length,
      rules: previewData.rules.length,
      feedbackTemplates: previewData.feedbackTemplates.length,
    }),
    [previewData.feedbackTemplates.length, previewData.rules.length, previewData.states.length],
  );

  return (
    <div className="space-y-6">
      {message ? (
        <Card variant="outlined" padding="md" className="border-dashed">
          <p className="text-sm text-text-muted">{message}</p>
        </Card>
      ) : null}

      <Card variant="elevated" padding="lg" className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{SCENARIO_CATEGORY_META[previewData.category].label}</Badge>
              <Badge variant="neutral">{SCENARIO_DIFFICULTY_LABELS[previewData.difficulty]}</Badge>
              <Badge variant="neutral">{previewData.estimatedDuration} min</Badge>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-text">{previewData.title}</h2>
              <p className="max-w-3xl text-sm leading-relaxed text-text-muted">{previewData.description}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-muted/50 p-6 text-sm text-text-muted">
            Loading preview...
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card variant="outlined" padding="lg" className="space-y-3">
            <h3 className="text-lg font-semibold text-text">Patient Presentation</h3>
            <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
              {renderRichText(previewData.patientPresentation || '<p></p>')}
            </div>
          </Card>

          <Card variant="outlined" padding="lg" className="space-y-3">
            <h3 className="text-lg font-semibold text-text">Learning Objectives</h3>
            <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
              {renderRichText(previewData.learningObjectives || '<p></p>')}
            </div>
          </Card>
        </div>
      </Card>

      <Card variant="outlined" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-text">States Timeline</h3>
          <Badge variant="info">{counts.states} states configured</Badge>
        </div>

        {counts.states > 0 ? (
          <div className="space-y-4">
            {previewData.states
              .slice()
              .sort((left, right) => left.order - right.order)
              .map((state) => (
                <Card key={state.id} variant="outlined" padding="md" className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">State {state.order + 1}</Badge>
                    <h4 className="text-base font-semibold text-text">{state.name}</h4>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-muted/50 p-4 text-sm text-text-muted">
                    {formatVitals(state.vitals)}
                  </div>

                  {state.physicalExam ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-text">Physical Exam</p>
                      <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
                        {renderRichText(state.physicalExam)}
                      </div>
                    </div>
                  ) : null}

                  {state.symptoms ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-text">Symptoms</p>
                      <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
                        {renderRichText(state.symptoms)}
                      </div>
                    </div>
                  ) : null}

                  {state.timeLimit !== null ? (
                    <p className="text-sm text-text-muted">Time limit: {state.timeLimit} seconds</p>
                  ) : null}
                </Card>
              ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface-muted/50 p-8 text-center">
            <p className="text-lg font-semibold text-text">No states configured yet</p>
            <p className="mt-2 text-sm text-text-muted">Add states in the States tab to show the clinical progression here.</p>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="outlined" padding="lg" className="space-y-2">
          <h3 className="text-lg font-semibold text-text">Rules Summary</h3>
          <p className="text-sm text-text-muted">{counts.rules} rules configured</p>
          {counts.rules > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              {previewData.rules.map((rule) => (
                <li key={rule.id} className="rounded-xl border border-border bg-surface-muted/40 px-4 py-3">
                  {rule.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No rules added yet.</p>
          )}
        </Card>

        <Card variant="outlined" padding="lg" className="space-y-2">
          <h3 className="text-lg font-semibold text-text">Feedback Templates Summary</h3>
          <p className="text-sm text-text-muted">{counts.feedbackTemplates} feedback messages prepared</p>
          {counts.feedbackTemplates > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              {previewData.feedbackTemplates.map((template) => (
                <li key={template.id} className="rounded-xl border border-border bg-surface-muted/40 px-4 py-3">
                  {template.key}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No feedback templates added yet.</p>
          )}
        </Card>
      </div>

      <Card variant="elevated" padding="md" className="text-sm text-text-muted">
        Preview content is read-only. Paramedics will see the clinical scenario content without rule implementation details.
      </Card>
    </div>
  );
}

