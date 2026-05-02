// ============================================================================
// File: apps/web/src/features/sessions/components/ActionMenu.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Button grid and dropdown actions for live session decisions.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Button, Card } from '@imedica/ui';
import { Activity, Sparkles } from 'lucide-react';
import { useState } from 'react';

const ASSESS_OPTIONS = ['ABCs', 'SAMPLE', 'Focused exam'] as const;
const MEDICATION_OPTIONS = ['epinephrine', 'atropine', 'amiodarone', 'naloxone', 'other'] as const;

type ActionType = 'assessment' | 'defibrillate' | 'cpr' | 'intubate' | 'medication' | 'transport';

interface ActionMenuProps {
  disabled?: boolean;
  onAction: (actionType: ActionType, actionValue?: string) => Promise<void> | void;
}

export function ActionMenu({ disabled = false, onAction }: ActionMenuProps): JSX.Element {
  const [assessment, setAssessment] = useState<(typeof ASSESS_OPTIONS)[number]>('ABCs');
  const [medication, setMedication] = useState<(typeof MEDICATION_OPTIONS)[number]>('epinephrine');

  const handleAction = async (actionType: ActionType, actionValue?: string): Promise<void> => {
    await onAction(actionType, actionValue);
  };

  return (
    <Card variant="outlined" padding="lg" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text">What will you do?</h3>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">Record one action at a time</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2 rounded-2xl border border-border bg-surface-muted/40 p-3">
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">Assess</label>
          <div className="flex gap-2">
            <select
              value={assessment}
              onChange={(event) => setAssessment(event.target.value as typeof assessment)}
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
              disabled={disabled}
            >
              {ASSESS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => void handleAction('assessment', assessment)} disabled={disabled}>
              Go
            </Button>
          </div>
        </div>

        <Button variant="primary" leftIcon={<Sparkles className="h-4 w-4" />} onClick={() => void handleAction('defibrillate')} disabled={disabled}>
          Defibrillate
        </Button>
        <Button variant="primary" leftIcon={<Activity className="h-4 w-4" />} onClick={() => void handleAction('cpr')} disabled={disabled}>
          CPR
        </Button>
        <Button variant="primary" onClick={() => void handleAction('intubate')} disabled={disabled}>
          Intubate
        </Button>

        <div className="space-y-2 rounded-2xl border border-border bg-surface-muted/40 p-3">
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">Medication</label>
          <div className="flex gap-2">
            <select
              value={medication}
              onChange={(event) => setMedication(event.target.value as typeof medication)}
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
              disabled={disabled}
            >
              {MEDICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => void handleAction('medication', medication)} disabled={disabled}>
              Go
            </Button>
          </div>
        </div>

        <Button variant="secondary" onClick={() => void handleAction('transport')} disabled={disabled}>
          Transport
        </Button>
      </div>
    </Card>
  );
}
