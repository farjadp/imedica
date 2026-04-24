// ============================================================================
// File: apps/web/src/features/sessions/components/VitalsDisplay.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Large, color-coded vitals display for live session execution.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Card } from '@imedica/ui';

import { cn } from '@/lib/cn.js';

import type { SessionVitals } from '../types.js';

function getValueTone(key: keyof SessionVitals, value: string | number | null): string {
  if (value === null) return 'text-text-subtle';
  if (key === 'hr' && typeof value === 'number') {
    if (value < 40 || value > 140) return 'text-error-600';
    if (value < 60 || value > 100) return 'text-warning-600';
    return 'text-success-600';
  }

  if (key === 'spo2' && typeof value === 'number') {
    if (value < 90) return 'text-error-600';
    if (value < 94) return 'text-warning-600';
    return 'text-success-600';
  }

  return 'text-text';
}

function formatValue(key: keyof SessionVitals, value: string | number | null): string {
  if (value === null) {
    return '--';
  }

  if (key === 'spo2') {
    return `${value}%`;
  }

  if (key === 'temp' && typeof value === 'number') {
    return `${value.toFixed(1)}°C`;
  }

  return String(value);
}

function VitalTile({
  label,
  value,
  keyName,
}: {
  label: string;
  value: string | number | null;
  keyName: keyof SessionVitals;
}): JSX.Element {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">{label}</p>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums sm:text-3xl', getValueTone(keyName, value))}>
        {formatValue(keyName, value)}
      </p>
    </div>
  );
}

export function VitalsDisplay({ vitals }: { vitals: SessionVitals }): JSX.Element {
  return (
    <Card variant="outlined" padding="lg" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text">Vitals</h3>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">Live monitor</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <VitalTile label="Heart Rate" value={vitals.hr} keyName="hr" />
        <VitalTile label="Blood Pressure" value={vitals.bp} keyName="bp" />
        <VitalTile label="SpO2" value={vitals.spo2} keyName="spo2" />
        <VitalTile label="Respiratory Rate" value={vitals.rr} keyName="rr" />
        <VitalTile label="Temperature" value={vitals.temp} keyName="temp" />
        <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">ECG</p>
          <p className={cn('mt-2 text-2xl font-semibold sm:text-3xl', getValueTone('ecg', vitals.ecg))}>
            {vitals.ecg ?? '--'}
          </p>
        </div>
      </div>
    </Card>
  );
}

