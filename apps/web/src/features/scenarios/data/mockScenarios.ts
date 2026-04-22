// ============================================================================
// File: apps/web/src/features/scenarios/data/mockScenarios.ts
// Version: 1.0.0 — 2026-04-22
// Why: Seed data for the Scenario List Page while the backend list API is built.
// Env / Identity: Web (browser runtime)
// ============================================================================

import type { ScenarioSummary } from '../types.js';

const DAY = 24 * 60 * 60 * 1000;

const createdBase = new Date('2026-04-08T10:00:00.000Z').getTime();

const makeScenario = (
  index: number,
  title: string,
  description: string,
  category: ScenarioSummary['category'],
  difficulty: ScenarioSummary['difficulty'],
  status: ScenarioSummary['status'],
  duration: number,
  authorName: string,
): ScenarioSummary => {
  const createdAt = new Date(createdBase + index * DAY * 2);
  const updatedAt = new Date(createdAt.getTime() + (index % 5 + 1) * DAY);

  return {
    id: `scenario-${index + 1}`,
    title,
    description,
    category,
    difficulty,
    status,
    estimatedDuration: duration,
    authorName,
    createdAt,
    updatedAt,
    isPublished: status === 'PUBLISHED',
  };
};

const scenarioSeeds = [
  {
    category: 'CARDIAC' as const,
    difficulty: 'BEGINNER' as const,
    authorName: 'Dr. Salman',
    description: 'High-acuity arrest management with early defibrillation and CPR sequencing.',
    variants: [
      ['Cardiac Arrest in Public Place', 'PUBLISHED', 15],
      ['Cardiac Arrest on Transit Bus', 'REVIEW', 14],
      ['Cardiac Arrest at Community Centre', 'DRAFT', 16],
    ] as const,
  },
  {
    category: 'RESPIRATORY' as const,
    difficulty: 'INTERMEDIATE' as const,
    authorName: 'Dr. Salman',
    description: 'Rapid escalation and airway support for severe allergic reaction.',
    variants: [
      ['Anaphylaxis After Restaurant Meal', 'PUBLISHED', 12],
      ['Severe Asthma Exacerbation at Home', 'REVIEW', 18],
      ['Respiratory Distress During Transfer', 'DRAFT', 20],
    ] as const,
  },
  {
    category: 'NEUROLOGICAL' as const,
    difficulty: 'INTERMEDIATE' as const,
    authorName: 'Dr. Rahman',
    description: 'Focused neurologic assessment, last-known-well capture, and stroke pathway activation.',
    variants: [
      ['Stroke Assessment in Apartment Building', 'PUBLISHED', 15],
      ['Syncope With Focal Deficit', 'REVIEW', 13],
      ['Headache With Sudden Weakness', 'ARCHIVED', 15],
    ] as const,
  },
  {
    category: 'TRAUMA' as const,
    difficulty: 'ADVANCED' as const,
    authorName: 'Dr. Chen',
    description: 'Time-critical trauma assessment with hemorrhage control and transport planning.',
    variants: [
      ['Penetrating Chest Trauma', 'PUBLISHED', 18],
      ['Motor Vehicle Collision with Entrapment', 'REVIEW', 22],
      ['Fall From Height on Construction Site', 'DRAFT', 25],
    ] as const,
  },
  {
    category: 'PEDIATRIC' as const,
    difficulty: 'INTERMEDIATE' as const,
    authorName: 'Dr. Patel',
    description: 'Pediatric assessment with family communication and age-specific intervention timing.',
    variants: [
      ['Pediatric Seizure in School', 'PUBLISHED', 12],
      ['Febrile Child With Lethargy', 'REVIEW', 10],
      ['Pediatric Respiratory Distress at Clinic', 'DRAFT', 14],
    ] as const,
  },
  {
    category: 'TOXICOLOGY' as const,
    difficulty: 'ADVANCED' as const,
    authorName: 'Dr. Nguyen',
    description: 'Poisoning and overdose recognition with antidote selection and supportive care.',
    variants: [
      ['Opioid Overdose in Apartment', 'PUBLISHED', 10],
      ['Carbon Monoxide Exposure After Heater Failure', 'REVIEW', 16],
      ['Mixed Medication Ingestion', 'ARCHIVED', 20],
    ] as const,
  },
  {
    category: 'ENVIRONMENTAL' as const,
    difficulty: 'BEGINNER' as const,
    authorName: 'Dr. Salman',
    description: 'Cold-weather and heat-related emergencies with rapid stabilization priorities.',
    variants: [
      ['Hypothermia in Outdoor Worker', 'PUBLISHED', 14],
      ['Heat Exhaustion at Marathon Event', 'REVIEW', 11],
      ['Near Drowning With Cold Exposure', 'DRAFT', 16],
    ] as const,
  },
  {
    category: 'BEHAVIORAL' as const,
    difficulty: 'BEGINNER' as const,
    authorName: 'Dr. Ellis',
    description: 'Behavioral emergency approach with scene safety and de-escalation decisions.',
    variants: [
      ['Agitated Patient in Public Library', 'PUBLISHED', 13],
      ['Panic Attack in Waiting Room', 'REVIEW', 9],
      ['Suicidal Ideation With Family Present', 'DRAFT', 17],
    ] as const,
  },
] as const;

export const mockScenarios: ScenarioSummary[] = scenarioSeeds.flatMap((seed, seedIndex) =>
  seed.variants.map(([title, status, duration], variantIndex) =>
    makeScenario(
      seedIndex * 3 + variantIndex,
      title,
      `${seed.description} ${title.toLowerCase()}.`,
      seed.category,
      seed.difficulty,
      status,
      duration,
      seed.authorName,
    ),
  ),
);

