// ============================================================================
// File: apps/web/src/features/scenarios/types.ts
// Version: 1.0.0 — 2026-04-22
// Why: Local scenario UI types and display metadata for the authoring workspace.
// Env / Identity: Web (browser runtime)
// ============================================================================

import type { LucideIcon } from 'lucide-react';
import { Activity, Baby, Brain, FlaskConical, HeartPulse, ShieldAlert, Trees, Wind } from 'lucide-react';

export type ScenarioCategory =
  | 'CARDIAC'
  | 'RESPIRATORY'
  | 'TRAUMA'
  | 'NEUROLOGICAL'
  | 'PEDIATRIC'
  | 'OBSTETRIC'
  | 'TOXICOLOGY'
  | 'ENVIRONMENTAL'
  | 'BEHAVIORAL'
  | 'OTHER';

export type ScenarioDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type ScenarioStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export type ScenarioSortKey = 'newest' | 'oldest' | 'recently_updated';

export interface ScenarioSummary {
  id: string;
  title: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  status: ScenarioStatus;
  estimatedDuration: number;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

export interface ScenarioCategoryMeta {
  label: string;
  icon: LucideIcon;
  accent: string;
}

export const SCENARIO_CATEGORY_META: Record<ScenarioCategory, ScenarioCategoryMeta> = {
  CARDIAC: { label: 'Cardiac', icon: HeartPulse, accent: 'from-rose-500/18 to-rose-400/8' },
  RESPIRATORY: { label: 'Respiratory', icon: Wind, accent: 'from-sky-500/18 to-sky-400/8' },
  TRAUMA: { label: 'Trauma', icon: ShieldAlert, accent: 'from-orange-500/18 to-orange-400/8' },
  NEUROLOGICAL: { label: 'Neurological', icon: Brain, accent: 'from-indigo-500/18 to-indigo-400/8' },
  PEDIATRIC: { label: 'Pediatric', icon: Baby, accent: 'from-emerald-500/18 to-emerald-400/8' },
  OBSTETRIC: { label: 'Obstetric', icon: Activity, accent: 'from-fuchsia-500/18 to-fuchsia-400/8' },
  TOXICOLOGY: { label: 'Toxicology', icon: FlaskConical, accent: 'from-amber-500/18 to-amber-400/8' },
  ENVIRONMENTAL: { label: 'Environmental', icon: Trees, accent: 'from-teal-500/18 to-teal-400/8' },
  BEHAVIORAL: { label: 'Behavioral', icon: Activity, accent: 'from-violet-500/18 to-violet-400/8' },
  OTHER: { label: 'Other', icon: Activity, accent: 'from-neutral-500/18 to-neutral-400/8' },
};

export const SCENARIO_DIFFICULTY_LABELS: Record<ScenarioDifficulty, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, string> = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export const SCENARIO_STATUS_VARIANTS: Record<ScenarioStatus, 'neutral' | 'warning' | 'success' | 'error'> = {
  DRAFT: 'neutral',
  REVIEW: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'error',
};

export const SCENARIO_DIFFICULTY_VARIANTS: Record<ScenarioDifficulty, 'success' | 'warning' | 'error'> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'warning',
  ADVANCED: 'error',
};

export const SCENARIO_SORT_OPTIONS: Array<{ value: ScenarioSortKey; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'recently_updated', label: 'Recently updated' },
];

