// ============================================================================
// File: apps/backend/src/services/session/SessionService.ts
// Version: 1.0.0 — 2026-04-20
// Why: Core execution engine for a scenario. Manages analytics sessions
//      and validates incoming decisions against the scenario state.
// Env / Identity: Backend (Node.js)
// ============================================================================

import type { CreateSessionDto, SubmitDecisionDto } from '@imedica/shared';
import { db } from '../../db/clients.js';
import { NotFoundError } from '../../lib/errors.js';
import { DeidentificationService } from '../deidentification/DeidentificationService.js';
import { AuditService } from '../audit/AuditService.js';
import { auditService } from '../audit/AuditService.js';

// Requires an instance of DeidentificationService to protect PII boundary.
export class SessionService {
  constructor(private readonly deident: DeidentificationService) {}

  /**
   * Starts a new AnalyticsSession.
   * STRICT PRIVACY BOUNDARY: We instantly map userId -> anonymousHash.
   * The session table itself has ZERO concept of user tracking beyond the hash.
   */
  async createSession(userId: string, dto: CreateSessionDto) {
    // 1. Convert user_id to anonymous_hash BEFORE touching analytics schema
    const anonymousHash = await this.deident.getAnonymousHash(userId);

    // 2. Ensure a profile snapshot exists for this hash (baseline analytics tracking)
    await db.analytics.paramedicProfileSnapshot.upsert({
      where: { anonymousHash },
      create: { anonymousHash },
      update: { lastUpdated: new Date() },
    });

    const scenario = await db.content.scenario.findUnique({
      where: { id: dto.scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scenario');
    }

    const session = await db.analytics.analyticsSession.create({
      data: {
        anonymousHash,
        scenarioId: dto.scenarioId,
        startedAt: new Date(),
        status: 'in_progress',
      },
    });

    return { sessionId: session.id };
  }

  /**
   * Processes a realtime decision from the paramedic.
   * A basic Rule Engine matching the JSON expectedActions shape.
   */
  async submitDecision(userId: string, sessionId: string, dto: SubmitDecisionDto) {
    const anonymousHash = await this.deident.getAnonymousHash(userId);

    const session = await db.analytics.analyticsSession.findUnique({
      where: { id: sessionId },
      include: { decisions: true },
    });

    if (!session || session.anonymousHash !== anonymousHash) {
      throw new NotFoundError('Session');
    }

    // Determine current state based on number of decisions made
    // For this MVP slice, 1 decision advances the state by 1.
    const currentStateOrder = session.decisions.length + 1;

    // Load expected actions for the current state from content schema
    const state = await db.content.scenarioState.findUnique({
      where: {
        scenarioId_stateOrder: {
          scenarioId: session.scenarioId,
          stateOrder: currentStateOrder,
        },
      },
    });

    if (!state) {
      // Scenario is likely already over, but handle gracefully for now
      throw new NotFoundError('ScenarioState');
    }

    const expectedActions = state.expectedActions as any;
    
    // MVP RULE ENGINE: Deterministic match against expected array of strings
    // E.g., if expectedActions contains "Oxygen 15L NRB", we check if decision matches
    let isCorrect = false;
    let feedback = 'Incorrect action for this phase of the clinical pathway.';

    // Very naive string matching for the prototype
    const valObj = typeof dto.decisionValue === 'object' ? JSON.stringify(dto.decisionValue).toLowerCase() : String(dto.decisionValue).toLowerCase();

    if (Array.isArray(expectedActions)) {
      for (const expected of expectedActions) {
        if (typeof expected === 'string' && expected.toLowerCase().includes(valObj) || valObj.includes(expected.toLowerCase())) {
          isCorrect = true;
          feedback = 'Good decision. Action aligns with base hospital protocols.';
          break;
        }
      }
    } else if (typeof expectedActions === 'string') {
       if (expectedActions.toLowerCase().includes(valObj) || valObj.includes(expectedActions.toLowerCase())) {
         isCorrect = true;
         feedback = 'Good decision. Action aligns with base hospital protocols.';
       }
    }

    // Store the decision
    const decision = await db.analytics.decision.create({
      data: {
        sessionId,
        anonymousHash,
        stateOrder: currentStateOrder,
        decisionType: dto.decisionType,
        decisionValue: dto.decisionValue as any,
        timeToDecisionMs: dto.timeToDecisionMs,
        isCorrect,
      },
    });

    return {
      isCorrect,
      feedback,
      decisionId: decision.id,
      stateOrder: currentStateOrder,
    };
  }

  /**
   * Compute and return the final score
   */
  async getResults(userId: string, sessionId: string) {
    const anonymousHash = await this.deident.getAnonymousHash(userId);

    const session = await db.analytics.analyticsSession.findUnique({
      where: { id: sessionId },
      include: { decisions: true },
    });

    if (!session || session.anonymousHash !== anonymousHash) {
      throw new NotFoundError('Session');
    }

    const totalDecisions = session.decisions.length;
    const correctDecisions = session.decisions.filter(d => d.isCorrect).length;
    const score = totalDecisions > 0 ? Math.round((correctDecisions / totalDecisions) * 100) : 0;

    // Mark completed if not already
    if (session.status !== 'completed') {
      await db.analytics.analyticsSession.update({
        where: { id: sessionId },
        data: { status: 'completed', completedAt: new Date(), finalScore: score },
      });
    }

    return {
      score,
      totalDecisions,
      correctDecisions,
      decisions: session.decisions,
    };
  }
}

const deidentService = new DeidentificationService(auditService);
export const sessionService = new SessionService(deidentService);
