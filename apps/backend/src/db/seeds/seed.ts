// ============================================================================
// File: apps/backend/src/db/seeds/seed.ts
// Version: 1.0.0 — 2026-04-20
// Why: Seeds initial data for local development and CI.
//      Content: 1 example scenario + 1 super_admin user.
//      Run with: pnpm --filter backend db:seed
//
//      IMPORTANT: Never seed real patient data or real user credentials.
//      The super_admin password here is for LOCAL DEV ONLY and must be
//      changed before any deployment.
// Env / Identity: Local development / CI only
// ============================================================================

import { BCRYPT_ROUNDS } from '@imedica/shared';
import bcrypt from 'bcryptjs';


import { logger } from '../../lib/logger.js';
import { prisma } from '../clients.js';

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

  const author = await prisma.user.findUnique({
    where: { email: 'admin@imedica.local' },
    select: { id: true },
  });

  if (!author) {
    throw new Error('Seed author not found. Run identity seed before content seed.');
  }

  const scenarioExists = await prisma.scenario.findFirst({
    where: { title: 'Cardiac Arrest in Public Place' },
  });

  if (scenarioExists) {
    logger.info('Example scenario already exists — skipping');
    return;
  }

  const scenario = await prisma.scenario.create({
    data: {
      title: 'Cardiac Arrest in Public Place',
      description: 'Adult witnessed cardiac arrest with an initial shockable rhythm and time-sensitive interventions.',
      category: 'CARDIAC',
      difficulty: 'INTERMEDIATE',
      estimatedDuration: 15,
      patientPresentation: [
        '<p>55-year-old male, unconscious and not breathing.</p>',
        '<p>Bystander CPR is in progress on arrival.</p>',
      ].join(''),
      learningObjectives: [
        '<ul>',
        '<li>Recognize cardiac arrest immediately</li>',
        '<li>Deliver high-quality CPR and early defibrillation</li>',
        '<li>Interpret rhythm changes across scenario states</li>',
        '</ul>',
      ].join(''),
      authorId: author.id,
      status: 'DRAFT',
      isPublished: false,
      states: {
        create: [
          {
            order: 0,
            name: 'Initial Presentation',
            vitals: {
              hr: 0,
              bp: '0/0',
              spo2: null,
              rr: 0,
              temp: null,
              ecg: 'VF',
            },
            physicalExam: '<p>Unresponsive, apneic, pulseless.</p>',
            symptoms: '<p>No spontaneous movement. Bystanders report sudden collapse.</p>',
            timeLimit: 120,
          },
          {
            order: 1,
            name: 'Post-Shock',
            vitals: {
              hr: 60,
              bp: '80/50',
              spo2: 85,
              rr: 8,
              temp: null,
              ecg: 'Sinus rhythm',
            },
            physicalExam: '<p>Pulse is weak but present. Skin remains pale and cool.</p>',
            symptoms: '<p>Spontaneous respirations have returned but are inadequate.</p>',
            timeLimit: 180,
          },
        ],
      },
      rules: {
        create: [
          {
            name: 'Early Defibrillation',
            description: 'Rewards rapid defibrillation while the rhythm remains ventricular fibrillation.',
            condition: {
              action: 'defibrillate',
              stateOrder: 0,
              maxTime: 120,
              vitals: { ecg: 'VF' },
            },
            points: 20,
            feedbackKey: 'early_defib_correct',
            priority: 100,
            isActive: true,
          },
          {
            name: 'Delayed CPR',
            description: 'Penalizes delayed CPR initiation in the initial arrest state.',
            condition: {
              action: 'cpr',
              stateOrder: 0,
              minTime: 180,
              vitals: null,
            },
            points: -10,
            feedbackKey: 'delayed_cpr',
            priority: 90,
            isActive: true,
          },
        ],
      },
      feedbackTemplates: {
        create: [
          {
            key: 'early_defib_correct',
            language: 'en',
            title: 'Excellent Response Time',
            message: 'You defibrillated within {time_seconds}s. Early defibrillation improved the chance of ROSC.',
          },
          {
            key: 'delayed_cpr',
            language: 'en',
            title: 'Delayed CPR',
            message: 'CPR should begin immediately. Your delay was {time_seconds}s before compressions started.',
          },
        ],
      },
    },
  });

  logger.info('Created example scenario', { scenarioId: scenario.id });
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

await main();
