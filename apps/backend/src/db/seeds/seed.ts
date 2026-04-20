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

  // ─── Scenario 1: Cardiac Arrest ──────────────────────────────────────────
  const cardiacExists = await prisma.scenario.findFirst({
    where: { title: 'Sudden Cardiac Arrest — Adult Witnessed' },
  });

  if (!cardiacExists) {
    const cardiac = await prisma.scenario.create({
      data: {
        title: 'Sudden Cardiac Arrest — Adult Witnessed',
        category: 'cardiac',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 15,
        learningObjectives: [
          'Recognize cardiac arrest within 10 seconds',
          'Initiate CPR to correct rhythm with appropriate rate and depth',
          'Correctly identify shockable vs non-shockable rhythms',
          'Administer epinephrine at correct dose and timing',
          'Demonstrate high-quality team communication during resuscitation',
        ],
        status: 'draft', // Will be moved to 'review' after physician validation
        states: {
          create: [
            {
              stateOrder: 1,
              patientPresentation: {
                chiefComplaint: 'Unresponsive male found collapsed in parking lot',
                age: 58,
                sex: 'male',
                weightKg: 85,
                vitals: {
                  gcs: 3,
                  pulse: 'absent',
                  respirations: 'absent',
                  bp: 'unobtainable',
                  spo2: 'unobtainable',
                  etco2: null,
                },
                history: {
                  witnessed: true,
                  downtime: '2 minutes',
                  bystanterCPR: false,
                  pmhx: 'Unknown',
                  medications: 'Unknown',
                },
                ecg: 'ventricular_fibrillation',
                physical: 'Apnoeic. No pulse. Cyanotic.',
              },
              expectedActions: {
                required: ['assess_responsiveness', 'call_for_help', 'start_cpr', 'apply_aed'],
                optional: ['iv_access', 'airway_adjunct'],
                contraindicated: ['wait_for_hospital', 'administer_medication_without_cpr'],
                timeSensitive: [
                  { action: 'first_shock', maxSeconds: 120, bonusIfBefore: 60 },
                  { action: 'epinephrine', maxSeconds: 300, unit: 'mg', dose: 1.0 },
                ],
              },
              timeLimitSeconds: 600,
            },
            {
              stateOrder: 2,
              patientPresentation: {
                context: 'Post-shock — rhythm check',
                vitals: {
                  gcs: 3,
                  pulse: 'absent',
                  ecg: 'pulseless_electrical_activity',
                  etco2: 18,
                },
                physical: 'ROSC not achieved. Continue resuscitation.',
              },
              expectedActions: {
                required: ['continue_cpr', 'identify_reversible_causes'],
                optional: ['advanced_airway', 'iv_bolus'],
                contraindicated: ['stop_resuscitation'],
                timeSensitive: [
                  { action: 'epinephrine_second_dose', maxSeconds: 600, dose: 1.0 },
                ],
              },
              timeLimitSeconds: 300,
            },
          ],
        },
      },
    });
    logger.info('Created cardiac arrest scenario', { scenarioId: cardiac.id });
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
