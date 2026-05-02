// ============================================================================
// File: apps/web/src/features/auth/pages/OnboardingPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: First-login profile completion flow for training personalization.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@imedica/ui';
import { useMutation } from '@tanstack/react-query';
import { Building2, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { getAuthErrorMessage, updateProfile } from '../api/authApi.js';
import { AuthPageShell } from '../components/AuthPageShell.js';
import { onboardingSchema, type OnboardingFormValues } from '../types.js';

const PROVINCES = ['ON', 'BC', 'AB', 'SK', 'MB', 'QC', 'NB', 'NS', 'PE', 'NL', 'NT', 'NU', 'YT'] as const;

export function OnboardingPage(): JSX.Element {
  const navigate = useNavigate();
  const [skipped, setSkipped] = useState(false);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => navigate('/dashboard'),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      paramedicLevel: 'PCP',
      experienceBucket: '0-2_years',
      province: 'ON',
      serviceType: 'public_large',
      organizationName: '',
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  if (skipped) {
    return (
      <AuthPageShell
        eyebrow="Profile setup"
        title="You can finish later"
        description="We will take you to the dashboard. You can complete profile details from settings later."
      >
        <div className="space-y-4 text-center">
          <Button type="button" onClick={() => navigate('/dashboard')}>
            Continue to dashboard
          </Button>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Profile setup"
      title="Complete your onboarding"
      description="A few details help us tailor training scenarios and analytics."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text" htmlFor="paramedicLevel">Paramedic level</label>
            <select id="paramedicLevel" className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background" {...register('paramedicLevel')}>
              <option value="PCP">PCP</option>
              <option value="ACP">ACP</option>
              <option value="CCP">CCP</option>
              <option value="student">Student</option>
            </select>
            {errors.paramedicLevel ? <p className="text-sm text-error-600">{errors.paramedicLevel.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text" htmlFor="experienceBucket">Experience</label>
            <select id="experienceBucket" className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background" {...register('experienceBucket')}>
              <option value="0-2_years">0-2 years</option>
              <option value="3-5_years">3-5 years</option>
              <option value="5-10_years">5-10 years</option>
              <option value="10+_years">10+ years</option>
            </select>
            {errors.experienceBucket ? <p className="text-sm text-error-600">{errors.experienceBucket.message}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text" htmlFor="province">Province</label>
            <select id="province" className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background" {...register('province')}>
              {PROVINCES.map((province) => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
            {errors.province ? <p className="text-sm text-error-600">{errors.province.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text" htmlFor="serviceType">Service type</label>
            <select id="serviceType" className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background" {...register('serviceType')}>
              <option value="public_large">Public large</option>
              <option value="public_small">Public small</option>
              <option value="private">Private</option>
              <option value="training_program">Training program</option>
            </select>
            {errors.serviceType ? <p className="text-sm text-error-600">{errors.serviceType.message}</p> : null}
          </div>
        </div>

        <Input
          label="Organization name"
          placeholder="Optional"
          leftIcon={<Building2 className="h-4 w-4" aria-hidden="true" />}
          error={errors.organizationName?.message}
          {...register('organizationName')}
        />

        {mutation.isError ? (
          <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/30 dark:text-error-200">
            {getAuthErrorMessage(mutation.error, 'Could not save onboarding details.')}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="flex-1" isLoading={mutation.isPending} rightIcon={<ChevronRight className="h-4 w-4" />}>
            Save and continue
          </Button>
          <Button type="button" variant="ghost" className="flex-1 sm:flex-none" onClick={() => setSkipped(true)} leftIcon={<X className="h-4 w-4" />}>
            Skip for now
          </Button>
        </div>
      </form>
    </AuthPageShell>
  );
}
