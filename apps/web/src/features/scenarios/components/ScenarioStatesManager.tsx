// ============================================================================
// File: apps/web/src/features/scenarios/components/ScenarioStatesManager.tsx
// Version: 1.0.0 — 2026-04-22
// Why: States tab with drag-and-drop reordering and modal state editor.
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Pencil, Trash2, Waves, Activity } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client.js';
import { cn } from '@/lib/cn.js';

import { RichTextEditor } from './RichTextEditor.js';

type EcgRhythm = 'Normal sinus' | 'VF' | 'VT' | 'Asystole' | 'PEA' | 'Other';

export interface ScenarioStateRecord {
  id: string;
  scenarioId: string;
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

const stateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  vitals: z.object({
    hr: z.coerce.number().int().min(0).max(300).nullable().optional(),
    bp: z.string().max(20).nullable().optional(),
    spo2: z.coerce.number().int().min(0).max(100).nullable().optional(),
    rr: z.coerce.number().int().min(0).max(60).nullable().optional(),
    temp: z.coerce.number().min(30).max(45).nullable().optional(),
    ecg: z.string().nullable().optional(),
  }),
  physicalExam: z.string().nullable().optional(),
  symptoms: z.string().nullable().optional(),
  timeLimit: z.coerce.number().int().min(10).max(600).nullable().optional(),
});

type StateFormValues = z.infer<typeof stateSchema>;

const ECG_OPTIONS: EcgRhythm[] = ['Normal sinus', 'VF', 'VT', 'Asystole', 'PEA', 'Other'];

function formatVitalsSummary(vitals: ScenarioStateRecord['vitals']): string {
  const segments = [
    vitals.hr !== null ? `HR ${vitals.hr}` : null,
    vitals.bp ? `BP ${vitals.bp}` : null,
    vitals.spo2 !== null ? `SpO2 ${vitals.spo2}%` : null,
    vitals.ecg ? `ECG ${vitals.ecg}` : null,
  ].filter(Boolean);

  return segments.length > 0 ? segments.join(' · ') : 'No vitals entered';
}

function sanitizeStateForm(values: StateFormValues): StateFormValues {
  return {
    name: values.name,
    vitals: {
      hr: values.vitals.hr ?? null,
      bp: values.vitals.bp ?? null,
      spo2: values.vitals.spo2 ?? null,
      rr: values.vitals.rr ?? null,
      temp: values.vitals.temp ?? null,
      ecg: values.vitals.ecg ?? null,
    },
    physicalExam: values.physicalExam ?? null,
    symptoms: values.symptoms ?? null,
    timeLimit: values.timeLimit ?? null,
  };
}

function getStateLabel(order: number): string {
  return `State ${order + 1}`;
}

function SortableStateCard({
  state,
  onEdit,
  onDelete,
}: {
  state: ScenarioStateRecord;
  onEdit: (state: ScenarioStateRecord) => void;
  onDelete: (state: ScenarioStateRecord) => void;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: state.id });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <Card variant="outlined" padding="md" className={cn('space-y-4 transition', isDragging && 'opacity-70 shadow-lg')}>
        <div className="flex items-start gap-4">
          <button
            type="button"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted text-text-subtle"
            aria-label={`Drag ${state.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{getStateLabel(state.order)}</Badge>
              <h3 className="text-base font-semibold text-text">{state.name}</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{formatVitalsSummary(state.vitals)}</p>
          </div>
        </div>
  
        <div className="grid gap-3 rounded-2xl border border-border bg-surface-muted/60 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-text-subtle">Heart rate</p>
            <p className="font-medium text-text">{state.vitals.hr ?? '—'}</p>
          </div>
          <div>
            <p className="text-text-subtle">Blood pressure</p>
            <p className="font-medium text-text">{state.vitals.bp ?? '—'}</p>
          </div>
          <div>
            <p className="text-text-subtle">SpO2</p>
            <p className="font-medium text-text">{state.vitals.spo2 !== null ? `${state.vitals.spo2}%` : '—'}</p>
          </div>
          <div>
            <p className="text-text-subtle">ECG</p>
            <p className="font-medium text-text">{state.vitals.ecg ?? '—'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(state)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(state)}>
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
}

function FieldLabel({
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

interface ScenarioStatesManagerProps {
  scenarioId: string | null;
}

export function ScenarioStatesManager({ scenarioId }: ScenarioStatesManagerProps): JSX.Element {
  const [states, setStates] = useState<ScenarioStateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingState, setEditingState] = useState<ScenarioStateRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScenarioStateRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const stateIds = useMemo(() => states.map((state) => state.id), [states]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StateFormValues>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      name: '',
      vitals: { hr: null, bp: null, spo2: null, rr: null, temp: null, ecg: 'Normal sinus' },
      physicalExam: '',
      symptoms: '',
      timeLimit: null,
    },
  });

  const loadStates = async (): Promise<void> => {
    if (!scenarioId) {
      setStates([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get<{ success: true; data: ScenarioStateRecord[] }>(`/api/scenarios/${scenarioId}/states`);
      setStates(response.data.data);
    } catch {
      setMessage('Unable to load states from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStates();
  }, [scenarioId]);

  const openCreate = (): void => {
    setEditingState(null);
    reset({
      name: '',
      vitals: { hr: null, bp: null, spo2: null, rr: null, temp: null, ecg: 'Normal sinus' },
      physicalExam: '',
      symptoms: '',
      timeLimit: null,
    });
    setIsEditorOpen(true);
  };

  const openEdit = (state: ScenarioStateRecord): void => {
    setEditingState(state);
    reset({
      name: state.name,
      vitals: {
        hr: state.vitals.hr,
        bp: state.vitals.bp,
        spo2: state.vitals.spo2,
        rr: state.vitals.rr,
        temp: state.vitals.temp,
        ecg: state.vitals.ecg,
      },
      physicalExam: state.physicalExam ?? '',
      symptoms: state.symptoms ?? '',
      timeLimit: state.timeLimit,
    });
    setIsEditorOpen(true);
  };

  const persistStates = async (nextStates: ScenarioStateRecord[]): Promise<void> => {
    setStates(nextStates);
    if (!scenarioId) return;

    try {
      await apiClient.put(`/api/scenarios/${scenarioId}/states/reorder`, { ids: nextStates.map((state) => state.id) });
    } catch {
      setMessage('State order saved locally; server reorder is temporarily unavailable.');
    }
  };

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = states.findIndex((state) => state.id === active.id);
    const newIndex = states.findIndex((state) => state.id === over.id);
    const reordered = arrayMove(states, oldIndex, newIndex).map((state, index) => ({ ...state, order: index }));
    await persistStates(reordered);
    setMessage('State order updated.');
  };

  const onSubmit = async (values: StateFormValues): Promise<void> => {
    if (!scenarioId) {
      setMessage('Save the scenario basics first before adding states.');
      return;
    }

    const payload = sanitizeStateForm(values);

    try {
      if (editingState) {
        const response = await apiClient.patch<{ success: true; data: ScenarioStateRecord }>(
          `/api/scenarios/${scenarioId}/states/${editingState.id}`,
          payload,
        );
        const updated = states.map((state) => (state.id === editingState.id ? response.data.data : state));
        await persistStates(updated.sort((left, right) => left.order - right.order).map((state, index) => ({ ...state, order: index })));
        setMessage('State updated.');
      } else {
        const response = await apiClient.post<{ success: true; data: ScenarioStateRecord }>(
          `/api/scenarios/${scenarioId}/states`,
          { ...payload, order: states.length },
        );
        const nextStates = [...states, { ...response.data.data, order: states.length }];
        setStates(nextStates);
        setMessage('State created.');
      }

      setIsEditorOpen(false);
      setEditingState(null);
    } catch {
      setMessage('Unable to save state.');
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!scenarioId || !deleteTarget) return;

    try {
      await apiClient.delete(`/api/scenarios/${scenarioId}/states/${deleteTarget.id}`);
      const nextStates = states
        .filter((state) => state.id !== deleteTarget.id)
        .map((state, index) => ({ ...state, order: index }));
      setStates(nextStates);
      setMessage('State deleted.');
    } catch {
      setMessage('Unable to delete state.');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!scenarioId) {
    return (
      <Card variant="outlined" padding="lg" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted text-primary-600">
            <Waves className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text">States</h2>
            <p className="text-sm text-text-muted">Save the scenario basics first, then add states here.</p>
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
              <h2 className="text-xl font-semibold text-text">States</h2>
              <p className="text-sm text-text-muted">Drag to reorder states and build the scenario progression.</p>
            </div>
          </div>
        </div>

        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add State
        </Button>
      </div>

      {message ? (
        <div className="rounded-xl border border-border bg-surface-muted/70 px-4 py-3 text-sm text-text-muted">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-muted/50 p-6 text-sm text-text-muted">
          Loading states...
        </div>
      ) : states.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stateIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {states.map((state) => (
                <SortableStateCard key={state.id} state={state} onEdit={openEdit} onDelete={setDeleteTarget} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface-muted/60 p-8 text-center">
          <p className="text-lg font-semibold text-text">No states yet</p>
          <p className="mt-2 text-sm text-text-muted">Create the initial scenario state to begin the clinical progression.</p>
        </div>
      )}

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingState ? 'Edit State' : 'Add State'}
        size="xl"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
              Save state
            </Button>
          </div>
        }
      >
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Name" placeholder="Initial Presentation" error={errors.name?.message} {...register('name')} />
            <div className="space-y-2">
              <FieldLabel>Order</FieldLabel>
              <div className="rounded-lg border border-border bg-surface-muted px-4 py-2.5 text-sm text-text-muted">
                {editingState ? getStateLabel(editingState.order) : getStateLabel(states.length)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Heart Rate"
              type="number"
              min={0}
              max={300}
              placeholder="0"
              error={errors.vitals?.hr?.message}
              {...register('vitals.hr', { setValueAs: (value) => (value === '' ? null : Number(value)) })}
            />
            <Input
              label="Blood Pressure"
              placeholder="120/80"
              error={errors.vitals?.bp?.message}
              {...register('vitals.bp')}
            />
            <Input
              label="SpO2"
              type="number"
              min={0}
              max={100}
              placeholder="98"
              error={errors.vitals?.spo2?.message}
              {...register('vitals.spo2', { setValueAs: (value) => (value === '' ? null : Number(value)) })}
            />
            <Input
              label="Respiratory Rate"
              type="number"
              min={0}
              max={60}
              placeholder="18"
              error={errors.vitals?.rr?.message}
              {...register('vitals.rr', { setValueAs: (value) => (value === '' ? null : Number(value)) })}
            />
            <Input
              label="Temperature"
              type="number"
              min={30}
              max={45}
              step="0.1"
              placeholder="36.8"
              error={errors.vitals?.temp?.message}
              {...register('vitals.temp', { setValueAs: (value) => (value === '' ? null : Number(value)) })}
            />
            <div className="space-y-2">
              <FieldLabel htmlFor="ecg">ECG Rhythm</FieldLabel>
              <select
                id="ecg"
                className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm transition duration-200 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
                {...register('vitals.ecg')}
              >
                {ECG_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Controller
            control={control}
            name="physicalExam"
            render={({ field }) => (
              <RichTextEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                label="Physical Exam"
                placeholder="Optional clinical exam findings."
              />
            )}
          />

          <Controller
            control={control}
            name="symptoms"
            render={({ field }) => (
              <RichTextEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                label="Symptoms"
                placeholder="Optional symptom details."
              />
            )}
          />

          <Input
            label="Time Limit"
            type="number"
            min={10}
            max={600}
            placeholder="120"
            helperText="Optional. Seconds."
            error={errors.timeLimit?.message}
            {...register('timeLimit', { setValueAs: (value) => (value === '' ? null : Number(value)) })}
          />
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete State"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()}>
              Delete state
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-text-muted">
          Delete <span className="font-medium text-text">{deleteTarget?.name}</span>? This removes the state from the
          scenario.
        </p>
      </Modal>
    </Card>
  );
}
