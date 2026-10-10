// ============================================================================
// File: apps/backend/src/db/seeds/seed.ts
// Version: 1.0.0 — 2026-04-20
// Why: Seeds initial data for local development and CI.
//      Content: 3 placeholder scenarios + 1 super_admin user.
//      Run with: pnpm --filter backend db:seed
//
//      IMPORTANT: Never seed real patient data or real user credentials.
//      The super_admin password here is for LOCAL DEV ONLY and must be
//      changed before any deployment.
// Env / Identity: Local development / CI only
// ============================================================================

import bcrypt from 'bcryptjs';

import { BCRYPT_ROUNDS } from '@imedica/shared';

import { prisma } from '../clients.js';
import { logger } from '../../lib/logger.js';

async function seedIdentity(): Promise<void> {
  logger.info('Seeding identity schema...');

  // ─── Super Admin User ────────────────────────────────────────────────────
  // LOCAL DEV ONLY — change password before any deployment
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@imedica.local' },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash('Dev@dmin2026!', BCRYPT_ROUNDS);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@imedica.local',
        passwordHash,
        firstName: 'Imedica',
        lastName: 'Admin',
        role: 'super_admin',
        emailVerified: true, // Pre-verified for local dev
        consentAnalytics: false,
      },
    });
    logger.info('Created super_admin user', { userId: admin.id });
  } else {
    logger.info('super_admin already exists — skipping');
  }

  // ─── Demo Paramedic User ─────────────────────────────────────────────────
  const demoExists = await prisma.user.findUnique({
    where: { email: 'paramedic@imedica.local' },
  });

  if (!demoExists) {
    const passwordHash = await bcrypt.hash('Paramedic2026!', BCRYPT_ROUNDS);
    const paramedic = await prisma.user.create({
      data: {
        email: 'paramedic@imedica.local',
        passwordHash,
        firstName: 'Demo',
        lastName: 'Paramedic',
        role: 'paramedic',
        emailVerified: true,
        consentAnalytics: true,
        consentAnalyticsDate: new Date(),
      },
    });
    logger.info('Created demo paramedic user', { userId: paramedic.id });
  }
}

async function seedContent(): Promise<void> {
  logger.info('Seeding content schema...');

  // ─── Scenario 1: Demo Cardiac Arrest (VSA) ───────────────────────────────
  const demoScenarioExists = await prisma.scenario.findFirst({
    where: { title: 'DEMO: Cardiac Arrest (VSA)' },
  });

  if (!demoScenarioExists) {
    const cardiac = await prisma.scenario.create({
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        title: 'DEMO: Cardiac Arrest (VSA)',
        category: 'cardiac',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 3,
        learningObjectives: [
          'Recognize cardiac arrest vs syncope',
          'Administer High-Quality CPR',
          'Deploy first shock for V-Fib quickly',
          'Administer Epinephrine 1mg correctly'
        ],
        status: 'published',
        states: {
          create: [
            {
              stateOrder: 1,
              patientPresentation: {
                 clinicalPicture: "58-year-old male found collapsed on the floor in a grocery store.",
                 observations: "Patient is completely unresponsive. Apneic (no breathing) and cyanotic around the lips.",
                 vitals: "No palpable radial or carotid pulse."
              },
              expectedActions: {
                required: ['Start CPR'],
                optional: ['Call for backup'],
                contraindicated: ['Administer Epinephrine'],
                timeSensitive: []
              },
              timeLimitSeconds: 120,
            },
            {
              stateOrder: 2,
              patientPresentation: {
                 clinicalPicture: "CPR in progress. The AED has been applied to the patient's bare chest.",
                 observations: "The AED interrupts CPR and announces 'Analyzing Rhythm'.",
                 vitals: "Monitor shows coarse Ventricular Fibrillation (V-Fib)."
              },
              expectedActions: {
                required: ['Defibrillate 200J'],
                optional: ['Charge AED while doing CPR'],
                contraindicated: ['Pause CPR to place IV'],
                timeSensitive: []
              },
              timeLimitSeconds: 60,
            },
            {
              stateOrder: 3,
              patientPresentation: {
                 clinicalPicture: "Shock delivered. CPR immediately resumed for 2 minutes.",
                 observations: "IV access has been secured during the compression cycle.",
                 vitals: "Next rhythm check shows sustained Ventricular Fibrillation."
              },
              expectedActions: {
                required: ['Epinephrine 1mg IV'],
                optional: ['Prepare Amiodarone'],
                contraindicated: ['Stop CPR to check pulse'],
                timeSensitive: []
              },
              timeLimitSeconds: 60,
            },
            {
              stateOrder: 4,
              patientPresentation: {
                 clinicalPicture: "After Epinephrine and a second shock, the patient suddenly groans and moves his hand.",
                 observations: "Patient is making weak spontaneous respiratory efforts. Chest rising symmetrically.",
                 vitals: "Strong carotid pulse present. HR 95. SpO2 88%. BP 90/60."
              },
              expectedActions: {
                required: ['Assess ABCs', 'Administer Oxygen'],
                optional: ['Obtain 12-lead ECG'],
                contraindicated: ['Give another shock', 'Give more Epinephrine'],
                timeSensitive: []
              },
              timeLimitSeconds: 120,
            }
          ],
        },
      },
    });
    logger.info('Created Demo Cardiac Arrest scenario', { scenarioId: cardiac.id });
  }

  // ─── Scenario 2: Anaphylaxis ─────────────────────────────────────────────
  const anaphylaxisExists = await prisma.scenario.findFirst({
    where: { title: 'Severe Anaphylaxis — Bee Sting' },
  });

  if (!anaphylaxisExists) {
    const anaphylaxis = await prisma.scenario.create({
      data: {
        title: 'Severe Anaphylaxis — Bee Sting',
        category: 'respiratory',
        difficulty: 'beginner',
        estimatedDurationMinutes: 10,
        learningObjectives: [
          'Recognize anaphylaxis using clinical criteria',
          'Administer epinephrine IM at correct dose and site',
          'Identify the need for repeat epinephrine',
          'Manage airway compromise in anaphylaxis',
          'Differentiate anaphylaxis from asthma and panic attack',
        ],
        status: 'draft',
        states: {
          create: [
            {
              stateOrder: 1,
              patientPresentation: {
                chiefComplaint: '28F stung by bees — difficulty breathing, hives',
                age: 28,
                sex: 'female',
                weightKg: 62,
                vitals: {
                  gcs: 14,
                  hr: 128,
                  rr: 26,
                  bp: '84/52',
                  spo2: 92,
                  temp: 37.2,
                },
                history: {
                  onset: '5 minutes ago',
                  trigger: 'Multiple bee stings to the forearm',
                  pmhx: 'No known allergies (prescribed EpiPen but left at home)',
                  medications: 'Oral contraceptive',
                },
                physical: [
                  'Stridor present',
                  'Diffuse urticaria and angioedema',
                  'Flushed, diaphoretic',
                  'Equal air entry bilaterally with wheeze',
                ].join('. '),
                ecg: 'sinus_tachycardia',
              },
              expectedActions: {
                required: ['epinephrine_im_1000', 'oxygen_15lpm', 'iv_access', 'position_supine'],
                optional: ['antihistamine', 'salbutamol', 'iv_fluid_bolus'],
                contraindicated: ['epinephrine_iv_bolus_unmonitored', 'delay_for_history'],
                timeSensitive: [
                  {
                    action: 'epinephrine_im',
                    maxSeconds: 120,
                    bonusIfBefore: 60,
                    dose: 0.5,
                    unit: 'mg',
                    route: 'IM',
                    concentration: '1:1000',
                  },
                ],
              },
              timeLimitSeconds: 480,
            },
          ],
        },
      },
    });
    logger.info('Created anaphylaxis scenario', { scenarioId: anaphylaxis.id });
  }

  // ─── Scenario 3: Stroke ──────────────────────────────────────────────────
  const strokeExists = await prisma.scenario.findFirst({
    where: { title: 'Acute Ischemic Stroke — Time-Critical Transfer' },
  });

  if (!strokeExists) {
    const stroke = await prisma.scenario.create({
      data: {
        title: 'Acute Ischemic Stroke — Time-Critical Transfer',
        category: 'neuro',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 12,
        learningObjectives: [
          'Apply the CPSS/FAST stroke recognition tool accurately',
          'Determine last-known-well time and tPA window',
          'Perform a targeted neurological assessment',
          'Initiate stroke protocol and pre-notify receiving hospital',
          'Avoid hyperglycemia, hypoxia, and hypertension during transport',
        ],
        status: 'draft',
        states: {
          create: [
            {
              stateOrder: 1,
              patientPresentation: {
                chiefComplaint: '71M with sudden onset facial droop and arm weakness',
                age: 71,
                sex: 'male',
                weightKg: 78,
                vitals: {
                  gcs: 12,
                  hr: 88,
                  rr: 16,
                  bp: '178/98',
                  spo2: 96,
                  glucose: 6.8,
                  temp: 37.0,
                },
                history: {
                  onset: 'Wife found him at 09:15. Last seen normal 08:45.',
                  pmhx: 'HTN, AF on warfarin, hyperlipidemia',
                  medications: 'Warfarin, metoprolol, atorvastatin',
                  allergies: 'NKDA',
                },
                neuro: {
                  facialDroop: 'Right sided',
                  armDrift: 'Right arm drift present',
                  speech: 'Dysarthric but intelligible',
                  pupils: 'PERL 4mm bilateral',
                },
                physical: 'Alert but confused. Right hemiparesis. No headache reported.',
              },
              expectedActions: {
                required: [
                  'cpss_assessment',
                  'determine_last_known_well',
                  'obtain_12_lead',
                  'check_glucose',
                  'stroke_protocol_activation',
                  'hospital_pre_notification',
                ],
                optional: ['iv_access', 'supplemental_oxygen_if_spo2_below_94'],
                contraindicated: [
                  'aggressive_bp_reduction',
                  'glucose_without_hypoglycemia',
                  'delay_transport_for_investigations',
                ],
                timeSensitive: [
                  { action: 'hospital_prenotification', maxSeconds: 300 },
                ],
              },
              timeLimitSeconds: 600,
            },
          ],
        },
      },
    });
    logger.info('Created stroke scenario', { scenarioId: stroke.id });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  logger.info('Starting database seed...');

  try {
    await seedIdentity();
    await seedContent();
    logger.info('Seed completed successfully');
  } catch (error) {
    logger.error('Seed failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
