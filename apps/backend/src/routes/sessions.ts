// ============================================================================
// File: apps/backend/src/routes/sessions.ts
// Version: 1.0.0 — 2026-04-22
// Why: Session execution endpoints for Phase 4 runtime and decision capture.
// Env / Identity: Backend (Express router)
// ============================================================================

import type { ApiResponse } from '@imedica/shared';
import type { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../db/clients.js';
import { AuthenticationError, ForbiddenError } from '../lib/errors.js';
import { authenticate } from '../middleware/auth.js';

const router: ExpressRouter = Router();

const createSessionSchema = z.object({
  scenarioId: z.string().min(1),
});

const createDecisionSchema = z.object({
  actionType: z.string().min(1),
  actionValue: z.string().nullable().optional(),
  timestamp: z.number().int().nonnegative().optional(),
});

function getCurrentTimeSeconds(sessionStartedAt: Date, timestampMs?: number): number {
  const effectiveTimestamp = timestampMs ?? Date.now();
  return Math.max(0, Math.floor((effectiveTimestamp - sessionStartedAt.getTime()) / 1000));
}

function parseRuleCondition(condition: unknown): {
  action: string;
  stateOrder: number;
  maxTime: number | null;
  minTime: number | null;
} {
  const value = (condition ?? {}) as Record<string, unknown>;

  return {
    action: String(value['action'] ?? ''),
    stateOrder: Number(value['stateOrder'] ?? -1),
    maxTime: value['maxTime'] === null || value['maxTime'] === undefined ? null : Number(value['maxTime']),
    minTime: value['minTime'] === null || value['minTime'] === undefined ? null : Number(value['minTime']),
  };
}

function evaluateDecision(args: {
  actionType: string;
  stateOrder: number;
  timeFromStart: number;
  rules: Array<{
    id: string;
    action: string;
    stateOrder: number;
    maxTime: number | null;
    minTime: number | null;
    points: number;
    feedbackKey: string;
    priority: number;
  }>;
}): { matchedRule: (typeof args.rules)[number] | null; pointsAwarded: number; feedbackKey: string | null; isCorrect: boolean | null } {
  const matchedRule = args.rules
    .slice()
    .sort((left, right) => right.priority - left.priority)
    .find((rule) => {
      if (rule.action !== args.actionType) return false;
      if (rule.stateOrder !== args.stateOrder) return false;
      if (rule.maxTime !== null && args.timeFromStart > rule.maxTime) return false;
      if (rule.minTime !== null && args.timeFromStart < rule.minTime) return false;
      return true;
    });

  if (!matchedRule) {
    return { matchedRule: null, pointsAwarded: 0, feedbackKey: null, isCorrect: null };
  }

  return {
    matchedRule,
    pointsAwarded: matchedRule.points,
    feedbackKey: matchedRule.feedbackKey,
    isCorrect: matchedRule.points > 0,
  };
}

router.use(authenticate);

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const dto = createSessionSchema.parse(req.body);
    const scenarioId = dto.scenarioId;
    const userId = String(req.user['sub']);

    const scenario = await db.content.scenario.findFirst({
      where: { id: scenarioId, isPublished: true },
      include: {
        states: {
          orderBy: { order: 'asc' },
        },
        rules: {
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        },
        feedbackTemplates: true,
      },
    });

    if (!scenario) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scenario not found' },
      });
      return;
    }

    const session = await db.content.session.create({
      data: {
        userId,
        scenarioId,
        status: 'RUNNING',
        currentStateOrder: 0,
        totalScore: 0,
      },
    });

    const initialState = scenario.states[0] ?? null;

    const response: ApiResponse<{
      sessionId: string;
      session: typeof session;
      scenario: {
        id: string;
        title: string;
        description: string;
        category: typeof scenario.category;
        difficulty: typeof scenario.difficulty;
        estimatedDuration: number;
        patientPresentation: string;
        learningObjectives: string;
        states: typeof scenario.states;
        feedbackTemplates: typeof scenario.feedbackTemplates;
      };
      initialState: typeof initialState;
      vitals: unknown;
    }> = {
      success: true,
      data: {
        sessionId: session.id,
        session,
        scenario: {
          id: scenario.id,
          title: scenario.title,
          description: scenario.description,
          category: scenario.category,
          difficulty: scenario.difficulty,
          estimatedDuration: scenario.estimatedDuration,
          patientPresentation: scenario.patientPresentation,
          learningObjectives: scenario.learningObjectives,
          states: scenario.states,
          feedbackTemplates: scenario.feedbackTemplates,
        },
        initialState,
        vitals: initialState ? initialState.vitals : null,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const sessionId = String(req.params['sessionId']);
    const userId = String(req.user['sub']);

    const session = await db.content.session.findFirst({
      where: { id: sessionId, userId },
      include: {
        decisions: {
          orderBy: { timestamp: 'asc' },
        },
        scenario: {
          include: {
            states: { orderBy: { order: 'asc' } },
            rules: { orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] },
            feedbackTemplates: true,
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
      return;
    }

    const response: ApiResponse<typeof session> = { success: true, data: session };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/:sessionId/decisions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const sessionId = String(req.params['sessionId']);
    const userId = String(req.user['sub']);
    const dto = createDecisionSchema.parse(req.body);

    const session = await db.content.session.findFirst({
      where: { id: sessionId, userId },
      include: {
        scenario: {
          include: {
            states: { orderBy: { order: 'asc' } },
            rules: { orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] },
            feedbackTemplates: true,
          },
        },
        decisions: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
      return;
    }

    if (session.status !== 'RUNNING') {
      throw new ForbiddenError();
    }

    const currentState = session.scenario.states.find((state) => state.order === session.currentStateOrder) ?? session.scenario.states[0] ?? null;
    const timeFromStart = getCurrentTimeSeconds(session.startedAt, dto.timestamp);
    const decisionPayload = {
      actionType: dto.actionType,
      actionValue: dto.actionValue ?? null,
      stateOrder: currentState?.order ?? session.currentStateOrder,
      timeFromStart,
    };

    const evaluation = evaluateDecision({
      actionType: decisionPayload.actionType,
      stateOrder: decisionPayload.stateOrder,
      timeFromStart: decisionPayload.timeFromStart,
      rules: session.scenario.rules.map((rule) => ({
        id: rule.id,
        ...parseRuleCondition(rule.condition),
        points: rule.points,
        feedbackKey: rule.feedbackKey,
        priority: rule.priority,
      })),
    });

    const nextStateOrder =
      evaluation.matchedRule && evaluation.pointsAwarded > 0 && currentState
        ? Math.min(currentState.order + 1, session.scenario.states.length > 0 ? session.scenario.states.length - 1 : 0)
        : session.currentStateOrder;

    const decision = await db.content.sessionDecision.create({
      data: {
        sessionId,
        actionType: decisionPayload.actionType,
        actionValue: decisionPayload.actionValue,
        stateOrder: decisionPayload.stateOrder,
        timestamp: new Date(dto.timestamp ?? Date.now()),
        timeFromStart: decisionPayload.timeFromStart,
        isCorrect: evaluation.isCorrect,
        pointsAwarded: evaluation.pointsAwarded,
        feedbackKey: evaluation.feedbackKey,
        ruleMatched: evaluation.matchedRule?.id ?? null,
      },
    });

    const updatedSession = await db.content.session.update({
      where: { id: session.id },
      data: {
        currentStateOrder: nextStateOrder,
        totalScore: { increment: evaluation.pointsAwarded },
      },
      include: {
        decisions: { orderBy: { timestamp: 'asc' } },
        scenario: {
          include: {
            states: { orderBy: { order: 'asc' } },
            feedbackTemplates: true,
          },
        },
      },
    });

    const nextState = updatedSession.scenario.states.find((state) => state.order === updatedSession.currentStateOrder) ?? null;
    const nextVitals = nextState?.vitals ?? null;
    const feedbackTemplate = evaluation.feedbackKey
      ? updatedSession.scenario.feedbackTemplates.find((template) => template.key === evaluation.feedbackKey)
      : null;

    const response: ApiResponse<{
      decision: typeof decision;
      feedback: { key: string; message: string; title: string } | null;
      stateChange: { currentStateOrder: number; nextState: typeof nextState } | null;
      newVitals: typeof nextVitals;
      session: typeof updatedSession;
    }> = {
      success: true,
      data: {
        decision,
        feedback:
          evaluation.feedbackKey !== null
            ? {
                key: evaluation.feedbackKey,
                message: feedbackTemplate?.message ?? evaluation.feedbackKey,
                title: feedbackTemplate?.title ?? evaluation.feedbackKey,
              }
            : null,
        stateChange:
          nextState && nextState.order !== session.currentStateOrder
            ? { currentStateOrder: updatedSession.currentStateOrder, nextState }
            : null,
        newVitals: nextVitals,
        session: updatedSession,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/:sessionId/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const sessionId = String(req.params['sessionId']);
    const userId = String(req.user['sub']);

    const session = await db.content.session.findFirst({
      where: { id: sessionId, userId },
      include: {
        decisions: { orderBy: { timestamp: 'asc' } },
        scenario: {
          include: {
            rules: { orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] },
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
      return;
    }

    if (session.status !== 'RUNNING') {
      const response: ApiResponse<{
        session: typeof session;
        totalScore: number;
        grade: string;
      }> = {
        success: true,
        data: {
          session,
          totalScore: session.totalScore,
          grade: session.totalScore >= 90 ? 'A' : session.totalScore >= 80 ? 'B+' : session.totalScore >= 70 ? 'B' : session.totalScore >= 60 ? 'C' : session.totalScore >= 50 ? 'D' : 'F',
        },
      };

      res.status(200).json(response);
      return;
    }

    const totalScore = session.decisions.reduce((sum, decision) => sum + decision.pointsAwarded, 0);
    const maxPossibleScore = session.scenario.rules.filter((rule) => rule.points > 0).reduce((sum, rule) => sum + rule.points, 0);

    const completedSession = await db.content.session.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalScore,
        maxPossibleScore,
      },
      include: {
        decisions: { orderBy: { timestamp: 'asc' } },
        scenario: true,
      },
    });

    const response: ApiResponse<{
      session: typeof completedSession;
      totalScore: number;
      grade: string;
    }> = {
      success: true,
      data: {
        session: completedSession,
        totalScore,
        grade: totalScore >= 90 ? 'A' : totalScore >= 80 ? 'B+' : totalScore >= 70 ? 'B' : totalScore >= 60 ? 'C' : totalScore >= 50 ? 'D' : 'F',
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
