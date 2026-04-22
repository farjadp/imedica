// ============================================================================
// File: apps/web/src/features/scenarios/pages/ScenarioEditorShellPage.tsx
// Version: 1.1.0 — 2026-04-22
// Why: Scenario editor page with the Phase 3 Basic Info tab implemented.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Card, Input } from '@imedica/ui';
import {
  ArrowLeft,
  Check,
  ClipboardList,
  FileText,
  Layers3,
  Save,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { useAuthStore } from '@/features/auth/store/authStore.js';
import { apiClient } from '@/lib/api-client.js';
import { cn } from '@/lib/cn.js';

import { mockScenarios } from '../data/mockScenarios.js';
import { RichTextEditor } from '../components/RichTextEditor.js';
import { ScenarioStatesManager } from '../components/ScenarioStatesManager.js';
import { ScenarioRulesManager } from '../components/ScenarioRulesManager.js';
import { ScenarioFeedbackManager } from '../components/ScenarioFeedbackManager.js';
import { ScenarioPreviewTab } from '../components/ScenarioPreviewTab.js';
import {
  SCENARIO_CATEGORY_META,
  SCENARIO_DIFFICULTY_LABELS,
  type ScenarioDifficulty,
  type ScenarioSummary,
} from '../types.js';

const editorSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be 200 characters or fewer'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be 500 characters or fewer'),
  category: z.enum([
    'CARDIAC',
    'RESPIRATORY',
    'TRAUMA',
    'NEUROLOGICAL',
    'PEDIATRIC',
    'OBSTETRIC',
    'TOXICOLOGY',
    'ENVIRONMENTAL',
    'BEHAVIORAL',
    'OTHER',
  ]),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  estimatedDuration: z.coerce.number().int().min(5, 'Minimum duration is 5 minutes').max(120, 'Maximum duration is 120 minutes'),
  patientPresentation: z.string().min(20, 'Patient presentation must contain at least 20 characters'),
  learningObjectives: z.string().min(20, 'Learning objectives must contain at least 20 characters'),
});

type EditorFormValues = z.infer<typeof editorSchema>;

const EMPTY_EDITOR_VALUES: EditorFormValues = {
  title: '',
  description: '',
  category: 'CARDIAC',
  difficulty: 'BEGINNER',
  estimatedDuration: 15,
  patientPresentation: '<p></p>',
  learningObjectives: '<ul><li></li></ul>',
};

function getScenarioDraftKey(id: string): string {
  return `imedica:scenario-draft:${id}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getDefaultValues(id?: string): EditorFormValues {
  if (!id || id === 'new') {
    return EMPTY_EDITOR_VALUES;
  }

  const fromList = mockScenarios.find((scenario) => scenario.id === id);
  if (fromList) {
    return {
      title: fromList.title,
      description: fromList.description,
      category: fromList.category,
      difficulty: fromList.difficulty,
      estimatedDuration: fromList.estimatedDuration,
      patientPresentation: `<p>${fromList.description}</p>`,
      learningObjectives: `<ul><li>Review ${fromList.title}</li></ul>`,
    };
  }

  return EMPTY_EDITOR_VALUES;
}

function loadDraft(id?: string): EditorFormValues | null {
  if (!id) return null;

  try {
    const raw = window.localStorage.getItem(getScenarioDraftKey(id));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<EditorFormValues>;
    const result = editorSchema.partial().safeParse(parsed);
    if (!result.success) return null;

    return {
      title: result.data.title ?? '',
      description: result.data.description ?? '',
      category: result.data.category ?? 'CARDIAC',
      difficulty: result.data.difficulty ?? 'BEGINNER',
      estimatedDuration: result.data.estimatedDuration ?? 15,
      patientPresentation: result.data.patientPresentation ?? '<p></p>',
      learningObjectives: result.data.learningObjectives ?? '<ul><li></li></ul>',
    };
  } catch {
    return null;
  }
}

function saveDraftToStorage(id: string, values: EditorFormValues): void {
  window.localStorage.setItem(getScenarioDraftKey(id), JSON.stringify(values));
}

function EditorTabs({
  activeTab,
  onChange,
}: {
  activeTab: 'basic' | 'states' | 'rules' | 'feedback' | 'preview';
  onChange: (tab: 'basic' | 'states' | 'rules' | 'feedback' | 'preview') => void;
}): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border px-4 py-4 sm:px-6">
      <TabChip active={activeTab === 'basic'} icon={<ClipboardList className="h-4 w-4" />} label="Basic Info" onClick={() => onChange('basic')} />
      <TabChip active={activeTab === 'states'} icon={<Layers3 className="h-4 w-4" />} label="States" onClick={() => onChange('states')} />
      <TabChip active={activeTab === 'rules'} icon={<Sparkles className="h-4 w-4" />} label="Rules" onClick={() => onChange('rules')} />
      <TabChip active={activeTab === 'feedback'} icon={<FileText className="h-4 w-4" />} label="Feedback" onClick={() => onChange('feedback')} />
      <TabChip active={activeTab === 'preview'} icon={<Check className="h-4 w-4" />} label="Preview" onClick={() => onChange('preview')} />
    </div>
  );
}

function TabChip({
  label,
  icon,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: JSX.Element;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'border border-border bg-surface text-text-muted hover:bg-surface-muted hover:text-text',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      {icon}
      {label}
      {disabled ? <Lock className="h-3.5 w-3.5" aria-hidden="true" /> : null}
    </button>
  );
}

function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}): JSX.Element {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-text">
      {children}
    </label>
  );
}

export function ScenarioEditorShellPage(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams();
  const role = useAuthStore((state) => state.user?.role);
  const [activeTab, setActiveTab] = useState<'basic' | 'states' | 'rules' | 'feedback' | 'preview'>('basic');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const isNewScenario = id === undefined || id === 'new';
  const existingScenario = useMemo<ScenarioSummary | undefined>(
    () => (id && id !== 'new' ? mockScenarios.find((scenario) => scenario.id === id) : undefined),
    [id],
  );

  const defaultValues = useMemo(() => {
    const stored = loadDraft(id);
    return stored ?? getDefaultValues(id);
  }, [id]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<EditorFormValues>({
    resolver: zodResolver(editorSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const currentValues = watch();

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const canEdit = role === 'admin' || role === 'super_admin' || role === 'clinical_validator';

  async function onSaveDraft(values: EditorFormValues): Promise<void> {
    const scenarioId = id && id !== 'new' ? id : null;

    try {
      if (scenarioId) {
        await apiClient.patch(`/api/scenarios/${scenarioId}`, values);
      } else {
        const response = await apiClient.post<{ success: true; data: { id: string } }>('/api/scenarios', values);
        navigate(`/admin/scenarios/${response.data.data.id}/edit`, { replace: true });
      }

      if (scenarioId) {
        saveDraftToStorage(scenarioId, values);
      }

      setSavedAt(new Date());
      setSaveMessage('Draft saved to the scenario service.');
      return;
    } catch {
      if (scenarioId) {
        saveDraftToStorage(scenarioId, values);
      }

      setSavedAt(new Date());
      setSaveMessage('Draft saved locally. The backend draft endpoint is unavailable for this scenario id yet.');
    }
  }

  if (!canEdit) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Card variant="elevated" padding="lg" className="w-full">
          <div className="space-y-4">
            <Badge variant="error" className="w-fit">
              Access restricted
            </Badge>
            <h1 className="text-2xl font-semibold text-text">You do not have access to scenario authoring.</h1>
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-text">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary-200/25 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-info-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card variant="elevated" padding="none" className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/admin/scenarios')}>
                    Back
                  </Button>
                  <Badge variant="info">Scenario editor</Badge>
                  <Badge variant="neutral">{isNewScenario ? 'New draft' : `Scenario ${id}`}</Badge>
                  <Badge variant="neutral">{existingScenario?.status ?? 'DRAFT'}</Badge>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                    {existingScenario?.title ?? 'Untitled scenario'}
                  </h1>
                  <p className="max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
                    Build the scenario step by step. The Basic Info tab is ready now; the remaining tabs will be wired in
                    sequence next.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/admin/scenarios')}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={handleSubmit(onSaveDraft)}
                  isLoading={isSubmitting}
                >
                  Save Draft
                </Button>
              </div>
            </div>

            {saveMessage ? (
              <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-900/40 dark:bg-success-900/20 dark:text-success-300">
                {saveMessage}
              </div>
            ) : null}

            <EditorTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {activeTab === 'basic' ? (
            <div className="grid gap-8 p-4 sm:p-6 xl:grid-cols-[1.1fr_0.9fr]">
              <form className="space-y-6" onSubmit={handleSubmit(onSaveDraft)}>
                <Card variant="outlined" padding="lg" className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-subtle">Basic Info</p>
                    <h2 className="text-xl font-semibold text-text">Scenario metadata</h2>
                    <p className="text-sm leading-relaxed text-text-muted">
                      Fill in the core scenario details before moving on to states, rules, and feedback.
                    </p>
                  </div>

                  <Input
                    label="Title"
                    placeholder="Cardiac Arrest in Public Place"
                    error={errors.title?.message}
                    {...register('title')}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      rows={4}
                      placeholder="Brief summary for the scenario card"
                      className={cn(
                        'block w-full rounded-lg border border-border bg-surface px-4 py-3 text-text shadow-sm transition duration-200 ease-standard',
                        'placeholder:text-text-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background',
                        errors.description && 'border-error-500 focus:border-error-500 focus:ring-error-500',
                      )}
                      {...register('description')}
                    />
                    {errors.description ? <p className="text-sm text-error-600">{errors.description.message}</p> : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm transition duration-200 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
                        {...register('category')}
                      >
                        {Object.entries(SCENARIO_CATEGORY_META).map(([value, meta]) => (
                          <option key={value} value={value}>
                            {meta.label}
                          </option>
                        ))}
                      </select>
                      {errors.category ? <p className="text-sm text-error-600">{errors.category.message}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <select
                        id="difficulty"
                        className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm transition duration-200 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
                        {...register('difficulty')}
                      >
                        {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as ScenarioDifficulty[]).map((value) => (
                          <option key={value} value={value}>
                            {SCENARIO_DIFFICULTY_LABELS[value]}
                          </option>
                        ))}
                      </select>
                      {errors.difficulty ? <p className="text-sm text-error-600">{errors.difficulty.message}</p> : null}
                    </div>
                  </div>

                  <Input
                    label="Estimated Duration"
                    type="number"
                    min={5}
                    max={120}
                    step={1}
                    helperText="Minutes"
                    error={errors.estimatedDuration?.message}
                    {...register('estimatedDuration', { valueAsNumber: true })}
                  />
                </Card>

                <Card variant="outlined" padding="lg" className="space-y-5">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-text">Rich text content</h2>
                    <p className="text-sm leading-relaxed text-text-muted">
                      Use formatting for key clinical details. These editor fields will later render in the paramedic
                      scenario experience.
                    </p>
                  </div>

                  <Controller
                    control={control}
                    name="patientPresentation"
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        label="Patient Presentation"
                        placeholder="Describe the presentation as the paramedic sees it."
                        error={errors.patientPresentation?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="learningObjectives"
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        label="Learning Objectives"
                        placeholder="Add the key things the learner should achieve."
                        error={errors.learningObjectives?.message}
                      />
                    )}
                  />

                  <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-2">
                    <Button variant="outline" onClick={() => navigate('/admin/scenarios')}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" leftIcon={<Save className="h-4 w-4" />} isLoading={isSubmitting}>
                      Save Draft
                    </Button>
                  </div>
                </Card>
              </form>

              <aside className="space-y-6">
                <Card variant="elevated" padding="lg" className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text">Current draft status</h3>
                      <p className="text-sm text-text-muted">
                        {savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not saved yet'}
                      </p>
                    </div>
                  </div>

                  <dl className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted/60 px-4 py-3">
                      <dt className="text-text-muted">Title length</dt>
                      <dd className="font-medium text-text">{stripHtml(defaultValues.title).length} chars</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted/60 px-4 py-3">
                      <dt className="text-text-muted">Description length</dt>
                      <dd className="font-medium text-text">{stripHtml(defaultValues.description).length} chars</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted/60 px-4 py-3">
                      <dt className="text-text-muted">Estimated time</dt>
                      <dd className="font-medium text-text">{defaultValues.estimatedDuration} minutes</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted/60 px-4 py-3">
                      <dt className="text-text-muted">Category</dt>
                      <dd className="font-medium text-text">{SCENARIO_CATEGORY_META[defaultValues.category].label}</dd>
                    </div>
                  </dl>
                </Card>

                <Card variant="outlined" padding="lg" className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-subtle">Next up</p>
                  <div className="space-y-2 text-sm leading-relaxed text-text-muted">
                    <p>• States tab with drag and drop ordering</p>
                    <p>• Rules tab with deterministic condition builder</p>
                    <p>• Feedback tab for physician-approved templates</p>
                    <p>• Preview tab for the learner view</p>
                  </div>
                  <div className="rounded-xl border border-dashed border-border bg-surface-muted/60 px-4 py-3 text-sm text-text-muted">
                    Basic Info is complete. The next step is the States tab.
                  </div>
                </Card>
              </aside>
            </div>
          ) : activeTab === 'states' ? (
            <div className="p-4 sm:p-6">
              <ScenarioStatesManager scenarioId={id && id !== 'new' ? id : null} />
            </div>
          ) : activeTab === 'rules' ? (
            <div className="p-4 sm:p-6">
              <ScenarioRulesManager scenarioId={id && id !== 'new' ? id : null} />
            </div>
          ) : activeTab === 'feedback' ? (
            <div className="p-4 sm:p-6">
              <ScenarioFeedbackManager scenarioId={id && id !== 'new' ? id : null} />
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <ScenarioPreviewTab
                scenarioId={id && id !== 'new' ? id : null}
                title={currentValues.title || defaultValues.title}
                description={currentValues.description || defaultValues.description}
                category={currentValues.category || defaultValues.category}
                difficulty={currentValues.difficulty || defaultValues.difficulty}
                estimatedDuration={currentValues.estimatedDuration || defaultValues.estimatedDuration}
                patientPresentation={currentValues.patientPresentation || defaultValues.patientPresentation}
                learningObjectives={currentValues.learningObjectives || defaultValues.learningObjectives}
              />
            </div>
          )}
        </Card>

        <div className="mt-4 flex items-center justify-between px-1 text-xs text-text-subtle">
          <span>Phase 3 editor workspace</span>
          <span>TipTap + React Hook Form + Zod</span>
        </div>
      </div>
    </main>
  );
}
