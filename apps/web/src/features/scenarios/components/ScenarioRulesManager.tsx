// ============================================================================
// File: apps/web/src/features/scenarios/components/ScenarioRulesManager.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Rules tab with drag-and-drop priority ordering and modal rule editor.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Card, Input, Modal } from '@imedica/ui';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Activity, GripVertical, Pencil, Plus, Trash2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client.js';
import { cn } from '@/lib/cn.js';

const RULE_ACTIONS = ['defibrillate', 'cpr', 'intubate', 'medication', 'assessment', 'diagnosis', 'transport', 'other'] as const;
type ScenarioAction = (typeof RULE_ACTIONS)[number];

const ruleFormSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100),
    description: z.string().max(250).nullable().optional(),
    action: z.enum(RULE_ACTIONS),
    stateOrder: z.coerce.number().int().min(0),
    maxTime: z.number().int().min(1).nullable().optional(),
    minTime: z.number().int().min(0).nullable().optional(),
    points: z.coerce.number().int().min(-100).max(100),
    feedbackKey: z.string().min(3, 'Feedback key must be at least 3 characters').max(100).regex(/^[a-z_]+$/, 'Use lowercase snake_case'),
    priority: z.coerce.number().int().min(0).max(1000),
  })
  .refine(
    (value) =>
      value.minTime === undefined ||
      value.maxTime === undefined ||
      value.minTime === null ||
      value.maxTime === null ||
      value.minTime <= value.maxTime,
    {
      message: 'Minimum time cannot be greater than maximum time',
      path: ['minTime'],
    },
  );

type RuleFormValues = z.infer<typeof ruleFormSchema>;

interface ScenarioRuleRecord {
  id: string;
  scenarioId: string;
  name: string;
  description: string | null;
  condition: {
    action: ScenarioAction;
    stateOrder: number;
    maxTime?: number | null;
    minTime?: number | null;
    vitals?: Record<string, unknown> | null;
  };
  points: number;
  feedbackKey: string;
  priority: number;
  isActive: boolean;
}

interface ScenarioStateRecord {
  id: string;
  order: number;
  name: string;
}

function SortableRuleCard({
  rule,
  onEdit,
  onDelete,
}: {
  rule: ScenarioRuleRecord;
  onEdit: (rule: ScenarioRuleRecord) => void;
  onDelete: (rule: ScenarioRuleRecord) => void;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.id });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <Card variant="outlined" padding="md" className={cn('space-y-4 transition', isDragging && 'opacity-70 shadow-lg')}>
        <div className="flex items-start gap-4">
          <button
            type="button"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted text-text-subtle"
            aria-label={`Drag ${rule.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Priority {rule.priority}</Badge>
              <h3 className="text-base font-semibold text-text">{rule.name}</h3>
            </div>
            {rule.description ? <p className="mt-2 text-sm leading-relaxed text-text-muted">{rule.description}</p> : null}
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border bg-surface-muted/60 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-text-subtle">Condition</p>
            <p className="font-medium text-text">{formatConditionSummary(rule.condition)}</p>
          </div>
          <div>
            <p className="text-text-subtle">Outcome</p>
            <p className="font-medium text-text">
              {rule.points >= 0 ? `+${rule.points}` : rule.points} points, feedback={rule.feedbackKey}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(rule)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(rule)}>
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
}

function formatConditionSummary(condition: ScenarioRuleRecord['condition']): string {
  const parts = [`action=${condition.action}`, `state=${condition.stateOrder}`];
  if (condition.minTime !== undefined && condition.minTime !== null) {
    parts.push(`minTime=${condition.minTime}s`);
  }
  if (condition.maxTime !== undefined && condition.maxTime !== null) {
    parts.push(`maxTime=${condition.maxTime}s`);
  }
  return parts.join(', ');
}

function getStateLabel(order: number): string {
  return `State ${order + 1}`;
}

function getNextPriority(rules: ScenarioRuleRecord[]): number {
  if (rules.length === 0) {
    return 1000;
  }

  return Math.max(...rules.map((rule) => rule.priority)) - 10;
}

interface ScenarioRulesManagerProps {
  scenarioId: string | null;
}

export function ScenarioRulesManager({ scenarioId }: ScenarioRulesManagerProps): JSX.Element {
  const [rules, setRules] = useState<ScenarioRuleRecord[]>([]);
  const [states, setStates] = useState<ScenarioStateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScenarioRuleRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScenarioRuleRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ruleIds = useMemo(() => rules.map((rule) => rule.id), [rules]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      action: 'defibrillate',
      stateOrder: 0,
      maxTime: null,
      minTime: null,
      points: 0,
      feedbackKey: '',
      priority: 1000,
    },
  });

  const loadData = async (): Promise<void> => {
    if (!scenarioId) {
      setRules([]);
      setStates([]);
      return;
    }

    setIsLoading(true);
    try {
      const [rulesResponse, statesResponse] = await Promise.all([
        apiClient.get<{ success: true; data: ScenarioRuleRecord[] }>(`/api/scenarios/${scenarioId}/rules`),
        apiClient.get<{ success: true; data: ScenarioStateRecord[] }>(`/api/scenarios/${scenarioId}/states`),
      ]);

      setRules(rulesResponse.data.data);
      setStates(statesResponse.data.data);
    } catch {
      setMessage('Unable to load rules from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [scenarioId]);

  const openCreate = (): void => {
    setEditingRule(null);
    reset({
      name: '',
      description: '',
      action: 'defibrillate',
      stateOrder: 0,
      maxTime: null,
      minTime: null,
      points: 0,
      feedbackKey: '',
      priority: getNextPriority(rules),
    });
    setIsEditorOpen(true);
  };

  const openEdit = (rule: ScenarioRuleRecord): void => {
    setEditingRule(rule);
    reset({
      name: rule.name,
      description: rule.description ?? '',
      action: rule.condition.action,
      stateOrder: rule.condition.stateOrder,
      maxTime: rule.condition.maxTime ?? null,
      minTime: rule.condition.minTime ?? null,
      points: rule.points,
      feedbackKey: rule.feedbackKey,
      priority: rule.priority,
    });
    setIsEditorOpen(true);
  };

  const persistRules = async (nextRules: ScenarioRuleRecord[]): Promise<void> => {
    setRules(nextRules);
    if (!scenarioId) return;

    try {
      await apiClient.patch(`/api/scenarios/${scenarioId}/rules/reorder`, {
        ids: nextRules.map((rule) => rule.id),
      });
    } catch {
      setMessage('Rule order saved locally; server reorder is temporarily unavailable.');
    }
  };

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rules.findIndex((rule) => rule.id === active.id);
    const newIndex = rules.findIndex((rule) => rule.id === over.id);
    const reordered = arrayMove(rules, oldIndex, newIndex).map((rule, index) => ({
      ...rule,
      priority: 1000 - index * 10,
    }));
    await persistRules(reordered);
    setMessage('Rule order updated.');
  };

  const onSubmit = async (values: RuleFormValues): Promise<void> => {
    if (!scenarioId) {
      setMessage('Save the scenario basics first before adding rules.');
      return;
    }

    const payload = {
      name: values.name,
      description: values.description ? values.description : null,
      condition: {
        action: values.action,
        stateOrder: values.stateOrder,
        maxTime: values.maxTime ?? null,
        minTime: values.minTime ?? null,
        vitals: null,
      },
      points: values.points,
      feedbackKey: values.feedbackKey,
      priority: values.priority,
    };

    try {
      if (editingRule) {
        const response = await apiClient.patch<{ success: true; data: ScenarioRuleRecord }>(
          `/api/scenarios/${scenarioId}/rules/${editingRule.id}`,
          payload,
        );
        const updated = rules.map((rule) => (rule.id === editingRule.id ? response.data.data : rule));
        const nextRules = updated.sort((left, right) => right.priority - left.priority);
        await persistRules(nextRules);
        setMessage('Rule updated.');
      } else {
        const response = await apiClient.post<{ success: true; data: ScenarioRuleRecord }>(
          `/api/scenarios/${scenarioId}/rules`,
          payload,
        );
        const nextRules = [...rules, response.data.data].sort((left, right) => right.priority - left.priority);
        setRules(nextRules);
        setMessage('Rule created.');
      }

      setIsEditorOpen(false);
      setEditingRule(null);
    } catch {
      setMessage('Unable to save rule.');
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!scenarioId || !deleteTarget) return;

    try {
      await apiClient.delete(`/api/scenarios/${scenarioId}/rules/${deleteTarget.id}`);
      const nextRules = rules
        .filter((rule) => rule.id !== deleteTarget.id)
        .map((rule, index) => ({ ...rule, priority: 1000 - index * 10 }));
      setRules(nextRules);
      setMessage('Rule deleted.');
    } catch {
      setMessage('Unable to delete rule.');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!scenarioId) {
    return (
      <Card variant="outlined" padding="lg" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted text-primary-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text">Rules</h2>
            <p className="text-sm text-text-muted">Save the scenario basics first, then add rules here.</p>
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
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text">Rules</h2>
              <p className="text-sm text-text-muted">Order the rules by priority. Higher values are evaluated first.</p>
            </div>
          </div>
        </div>

        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Rule
        </Button>
      </div>

      {message ? (
        <div className="rounded-xl border border-border bg-surface-muted/70 px-4 py-3 text-sm text-text-muted">
          {message}
        </div>
      ) : null}

      <div className="rounded-xl border border-dashed border-border bg-surface-muted/50 px-4 py-3 text-sm text-text-muted">
        Available states: {states.length > 0 ? states.map((state) => `${getStateLabel(state.order)} (${state.name})`).join(' · ') : 'none yet'}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-muted/50 p-6 text-sm text-text-muted">
          Loading rules...
        </div>
      ) : rules.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ruleIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {rules.map((rule) => (
                <SortableRuleCard key={rule.id} rule={rule} onEdit={openEdit} onDelete={setDeleteTarget} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface-muted/60 p-8 text-center">
          <p className="text-lg font-semibold text-text">No rules yet</p>
          <p className="mt-2 text-sm text-text-muted">Create the first rule to define how scenario decisions are scored.</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Rule
        </Button>
      </div>

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingRule ? 'Edit Rule' : 'Add Rule'}
        size="xl"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
              Save rule
            </Button>
          </div>
        }
      >
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Name" placeholder="Early Defibrillation" error={errors.name?.message} {...register('name')} />
            <Input
              label="Priority"
              type="number"
              min={0}
              max={1000}
              helperText="Higher values are evaluated first"
              error={errors.priority?.message}
              {...register('priority', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text">Description</label>
            <textarea
              rows={3}
              placeholder="Optional human-readable explanation"
              className={cn(
                'block w-full rounded-lg border border-border bg-surface px-4 py-3 text-text shadow-sm transition duration-200 ease-standard',
                'placeholder:text-text-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background',
                errors.description && 'border-error-500 focus:border-error-500 focus:ring-error-500',
              )}
              {...register('description')}
            />
            {errors.description ? <p className="text-sm text-error-600">{errors.description.message}</p> : null}
          </div>

          <Card variant="outlined" padding="md" className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-text">Condition builder</h3>
              <p className="text-sm text-text-muted">Define when this rule should match.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">Action</label>
                <select
                  className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm transition duration-200 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
                  {...register('action')}
                >
                  {RULE_ACTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                {errors.action ? <p className="text-sm text-error-600">{errors.action.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">State</label>
                <select
                  className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm transition duration-200 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
                  {...register('stateOrder', { valueAsNumber: true })}
                >
                  {states.length > 0 ? (
                    states.map((state) => (
                      <option key={state.id} value={state.order}>
                        {getStateLabel(state.order)} - {state.name}
                      </option>
                    ))
                  ) : (
                    <option value={0}>State 1</option>
                  )}
                </select>
                {errors.stateOrder ? <p className="text-sm text-error-600">{errors.stateOrder.message}</p> : null}
              </div>

              <Input
                label="Minimum Time"
                type="number"
                min={0}
                helperText="Optional, seconds"
                error={errors.minTime?.message}
                {...register('minTime', { setValueAs: (value) => (value === '' ? null : Number(value)) })}
              />
              <Input
                label="Maximum Time"
                type="number"
                min={1}
                helperText="Optional, seconds"
                error={errors.maxTime?.message}
                {...register('maxTime', { setValueAs: (value) => (value === '' ? null : Number(value)) })}
              />
            </div>
          </Card>

          <Card variant="outlined" padding="md" className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-text">Outcome</h3>
              <p className="text-sm text-text-muted">Set the scoring impact and feedback template key.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Points"
                type="number"
                min={-100}
                max={100}
                helperText="Range: -100 to +100"
                error={errors.points?.message}
                {...register('points', { valueAsNumber: true })}
              />
              <Input
                label="Feedback Key"
                placeholder="early_defib_correct"
                helperText="Lowercase snake_case"
                error={errors.feedbackKey?.message}
                {...register('feedbackKey')}
              />
            </div>
          </Card>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Rule"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()}>
              Delete rule
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-text-muted">
          Delete <span className="font-medium text-text">{deleteTarget?.name}</span>? This removes the rule from the
          scenario.
        </p>
      </Modal>
    </Card>
  );
}
