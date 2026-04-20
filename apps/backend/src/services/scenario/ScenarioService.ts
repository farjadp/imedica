// ============================================================================
// File: apps/backend/src/services/scenario/ScenarioService.ts
// Version: 1.0.0 — 2026-04-20
// Why: Core service for reading scenarios from the content schema.
//      Used by the frontend to list and load simulation data.
// Env / Identity: Backend (Node.js)
// ============================================================================

import { db } from '../../db/clients.js';
import { NotFoundError } from '../../lib/errors.js';

export class ScenarioService {
  /** Returns all published scenarios to display on the dashboard */
  async listPublishedScenarios() {
    return await db.content.scenario.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        estimatedDurationMinutes: true,
        learningObjectives: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Gets the full scenario body including state progression */
  async getScenario(id: string) {
    const scenario = await db.content.scenario.findUnique({
      where: { id },
      include: {
        states: {
          orderBy: { stateOrder: 'asc' },
          select: {
            id: true,
            stateOrder: true,
            patientPresentation: true,
            timeLimitSeconds: true,
            // DO NOT export expectedActions or nextStateLogic directly to 
            // the frontend client if preventing cheating, but for this MVP,
            // we will let the backend handle the decision logic, so we omit them here.
          },
        },
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scenario');
    }

    return scenario;
  }
}

export const scenarioService = new ScenarioService();
