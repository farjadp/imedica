// ============================================================================
// File: apps/web/src/features/auth/components/PasswordStrengthMeter.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Simple password strength indicator used by registration/reset pages.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge } from '@imedica/ui';
import { Check } from 'lucide-react';

import { cn } from '@/lib/cn.js';

interface PasswordStrengthMeterProps {
  password: string;
}

function getStrength(password: string): { label: string; percent: number; className: string } {
  const checks = [
    password.length >= 12,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const score = checks.filter(Boolean).length;

  if (score <= 1) return { label: 'Weak', percent: 25, className: 'bg-error-500' };
  if (score === 2) return { label: 'Fair', percent: 50, className: 'bg-warning-500' };
  if (score === 3) return { label: 'Good', percent: 75, className: 'bg-info-500' };
  return { label: 'Strong', percent: 100, className: 'bg-success-500' };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps): JSX.Element {
  const strength = getStrength(password);

  const rules = [
    { label: 'At least 12 characters', ok: password.length >= 12 },
    { label: 'Contains uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Contains number', ok: /[0-9]/.test(password) },
    { label: 'Contains special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-muted p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text">Password strength</p>
        <Badge variant={strength.label === 'Weak' ? 'error' : strength.label === 'Fair' ? 'warning' : 'success'} size="sm">
          {strength.label}
        </Badge>
      </div>
      <div className="h-2 rounded-full bg-surface-elevated" aria-hidden="true">
        <div className={cn('h-2 rounded-full transition-all duration-200', strength.className)} style={{ width: `${strength.percent}%` }} />
      </div>
      <ul className="space-y-2 text-sm text-text-muted">
        {rules.map((rule) => (
          <li key={rule.label} className="flex items-center gap-2">
            <Check className={cn('h-4 w-4', rule.ok ? 'text-success-600' : 'text-text-subtle')} aria-hidden="true" />
            <span className={cn(rule.ok && 'text-text')}>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
