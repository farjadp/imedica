// ============================================================================
// File: apps/web/src/features/scenarios/components/ScenarioFeedbackManager.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Feedback templates tab with CRUD and scenario-scoped key validation.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Card, Input, Modal } from '@imedica/ui';
import { FileText, Pencil, Plus, Trash2, MessageSquareText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client.js';
import { cn } from '@/lib/cn.js';

const LANGUAGE_OPTIONS = ['en', 'fr'] as const;

const feedbackTemplateSchema = z.object({
  key: z.string().min(3, 'Key must be at least 3 characters').max(100).regex(/^[a-z_]+$/, 'Key must use lowercase snake_case'),
  language: z.enum(LANGUAGE_OPTIONS),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

type FeedbackTemplateFormValues = z.infer<typeof feedbackTemplateSchema>;

interface FeedbackTemplateRecord {
  id: string;
  scenarioId: string;
  key: string;
  language: string;
  title: string;
  message: string;
}

function truncateMessage(message: string): string {
  return message.length > 100 ? `${message.slice(0, 100)}…` : message;
}

interface ScenarioFeedbackManagerProps {
  scenarioId: string | null;
}

export function ScenarioFeedbackManager({ scenarioId }: ScenarioFeedbackManagerProps): JSX.Element {
  const [templates, setTemplates] = useState<FeedbackTemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FeedbackTemplateRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackTemplateRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackTemplateFormValues>({
    resolver: zodResolver(feedbackTemplateSchema),
    defaultValues: {
      key: '',
      language: 'en',
      title: '',
      message: '',
    },
  });

  const existingKeys = useMemo(
    () => templates.map((template) => `${template.key}:${template.language}`),
    [templates],
  );

  const loadTemplates = async (): Promise<void> => {
    if (!scenarioId) {
      setTemplates([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get<{ success: true; data: { feedbackTemplates?: FeedbackTemplateRecord[] } }>(
        `/api/scenarios/${scenarioId}`,
      );
      setTemplates(response.data.data.feedbackTemplates ?? []);
    } catch {
      setMessage('Unable to load feedback templates from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, [scenarioId]);

  const openCreate = (): void => {
    setEditingTemplate(null);
    reset({
      key: '',
      language: 'en',
      title: '',
      message: '',
    });
    setIsEditorOpen(true);
  };

  const openEdit = (template: FeedbackTemplateRecord): void => {
    setEditingTemplate(template);
    reset({
      key: template.key,
      language: template.language as FeedbackTemplateFormValues['language'],
      title: template.title,
      message: template.message,
    });
    setIsEditorOpen(true);
  };

  const onSubmit = async (values: FeedbackTemplateFormValues): Promise<void> => {
    if (!scenarioId) {
      setMessage('Save the scenario basics first before adding templates.');
      return;
    }

    const duplicateExists = existingKeys.includes(`${values.key}:${values.language}`) &&
      (!editingTemplate || editingTemplate.key !== values.key || editingTemplate.language !== values.language);

    if (duplicateExists) {
      setMessage('That feedback key already exists for this language in the scenario.');
      return;
    }

    try {
      if (editingTemplate) {
        const response = await apiClient.patch<{ success: true; data: FeedbackTemplateRecord }>(
          `/api/scenarios/${scenarioId}/feedback-templates/${editingTemplate.id}`,
          values,
        );
        setTemplates((current) =>
          current.map((template) => (template.id === editingTemplate.id ? response.data.data : template)),
        );
        setMessage('Template updated.');
      } else {
        const response = await apiClient.post<{ success: true; data: FeedbackTemplateRecord }>(
          `/api/scenarios/${scenarioId}/feedback-templates`,
          values,
        );
        setTemplates((current) => [...current, response.data.data]);
        setMessage('Template created.');
      }

      setIsEditorOpen(false);
      setEditingTemplate(null);
    } catch {
      setMessage('Unable to save template.');
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!scenarioId || !deleteTarget) return;

    try {
      await apiClient.delete(`/api/scenarios/${scenarioId}/feedback-templates/${deleteTarget.id}`);
      setTemplates((current) => current.filter((template) => template.id !== deleteTarget.id));
      setMessage('Template deleted.');
    } catch {
      setMessage('Unable to delete template.');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!scenarioId) {
    return (
      <Card variant="outlined" padding="lg" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted text-primary-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text">Feedback</h2>
            <p className="text-sm text-text-muted">Save the scenario basics first, then add feedback templates here.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding="lg" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text">Feedback Templates</h2>
              <p className="text-sm text-text-muted">Create physician-approved feedback messages for scenario outcomes.</p>
            </div>
          </div>
        </div>

        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Template
        </Button>
      </div>

      {message ? (
        <div className="rounded-xl border border-border bg-surface-muted/70 px-4 py-3 text-sm text-text-muted">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-muted/50 p-6 text-sm text-text-muted">
          Loading feedback templates...
        </div>
      ) : templates.length > 0 ? (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} variant="outlined" padding="md" className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{template.key}</Badge>
                    <Badge variant="neutral">{template.language}</Badge>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-text">{template.title}</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(template)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteTarget(template)}>
                    Delete
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-muted/60 p-4 text-sm text-text-muted">
                <p className="line-clamp-3">{truncateMessage(template.message)}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface-muted/60 p-8 text-center">
          <p className="text-lg font-semibold text-text">No feedback templates yet</p>
          <p className="mt-2 text-sm text-text-muted">Add the first template to support deterministic feedback messaging.</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Template
        </Button>
      </div>

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingTemplate ? 'Edit Template' : 'Add Template'}
        size="xl"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
              Save template
            </Button>
          </div>
        }
      >
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Key" placeholder="early_defib_correct" helperText="Lowercase snake_case" error={errors.key?.message} {...register('key')} />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text">Language</label>
              <select
                className={cn(
                  'block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm transition duration-200 ease-standard',
                  'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background',
                )}
                {...register('language')}
              >
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
              {errors.language ? <p className="text-sm text-error-600">{errors.language.message}</p> : null}
            </div>
          </div>

          <Input label="Title" placeholder="Excellent Response Time" error={errors.title?.message} {...register('title')} />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text">Message</label>
            <textarea
              rows={8}
              placeholder="You defibrillated within {time_seconds}s. AHA guidelines recommend <2 minutes."
              className={cn(
                'block w-full rounded-lg border border-border bg-surface px-4 py-3 text-text shadow-sm transition duration-200 ease-standard',
                'placeholder:text-text-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background',
                errors.message && 'border-error-500 focus:border-error-500 focus:ring-error-500',
              )}
              {...register('message')}
            />
            {errors.message ? <p className="text-sm text-error-600">{errors.message.message}</p> : null}
            <p className="text-xs text-text-subtle">
              Use {`{variable_name}`} for dynamic values like {`{time_seconds}`}, {`{medication_name}`}, etc.
            </p>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Template"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()}>
              Delete template
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-text-muted">
          Delete <span className="font-medium text-text">{deleteTarget?.key}</span>? This removes the template from the
          scenario.
        </p>
      </Modal>
    </Card>
  );
}

