// ============================================================================
// File: apps/backend/src/routes/scenarios.ts
// Version: 1.0.0 — 2026-04-22
// Why: Scenario authoring endpoints for Phase 3 draft creation and editing.
// Env / Identity: Backend (Express router)
// ============================================================================

import type { ApiResponse } from '@imedica/shared';
import {
  createFeedbackTemplateSchema,
  createRuleSchema,
  updateFeedbackTemplateSchema,
  updateRuleSchema,
} from '@imedica/shared';
import type { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../db/clients.js';
import { AuthenticationError } from '../lib/errors.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router: ExpressRouter = Router();

const scenarioDraftSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(500),
  category: z.enum([
    'CARDIAC',
    'RESPIRATORY',
    'TRAUMA',
    'NEUROLOGICAL',
    'PEDIATRIC',
    'OBSTETRIC',
    'TOXICOLOGY',
    'ENVIRONMENTAL',
    'BEHAVIORAL',
    'OTHER',
  ]),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  estimatedDuration: z.number().int().min(5).max(120),
  patientPresentation: z.string().min(20),
  learningObjectives: z.string().min(20),
});

const scenarioStateSchema = z.object({
  name: z.string().min(3).max(100),
  order: z.number().int().min(0).optional(),
  vitals: z.object({
    hr: z.number().int().min(0).max(300).nullable().optional(),
    bp: z.string().nullable().optional(),
    spo2: z.number().int().min(0).max(100).nullable().optional(),
    rr: z.number().int().min(0).max(60).nullable().optional(),
    temp: z.number().min(30).max(45).nullable().optional(),
    ecg: z.string().nullable().optional(),
  }),
  physicalExam: z.string().nullable().optional(),
  symptoms: z.string().nullable().optional(),
  timeLimit: z.number().int().min(10).max(600).nullable().optional(),
});

const scenarioStateReorderSchema = z.object({
  ids: z.array(z.string().min(1)),
});

const scenarioUpdateSchema = scenarioDraftSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

const scenarioRuleReorderSchema = z.object({
  ids: z.array(z.string().min(1)),
});

const scenarioFeedbackTemplateSchema = createFeedbackTemplateSchema;
const scenarioFeedbackTemplateUpdateSchema = updateFeedbackTemplateSchema;
const scenarioCategories = [
  'CARDIAC',
  'RESPIRATORY',
  'TRAUMA',
  'NEUROLOGICAL',
  'PEDIATRIC',
  'OBSTETRIC',
  'TOXICOLOGY',
  'ENVIRONMENTAL',
  'BEHAVIORAL',
  'OTHER',
] as const;
const scenarioDifficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
const scenarioLibraryQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z
    .union([z.enum(scenarioCategories), z.array(z.enum(scenarioCategories))])
    .optional()
    .transform((value) => {
      if (value === undefined) return [];
      return Array.isArray(value) ? value : [value];
    }),
  difficulty: z
    .union([z.enum(scenarioDifficulties), z.array(z.enum(scenarioDifficulties))])
    .optional()
    .transform((value) => {
      if (value === undefined) return [];
      return Array.isArray(value) ? value : [value];
    }),
  minDuration: z.coerce.number().int().min(5).max(60).optional(),
  maxDuration: z.coerce.number().int().min(5).max(60).optional(),
  sort: z.enum(['newest', 'oldest', 'title_az', 'title_za']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
}).superRefine((value, ctx) => {
  if (value.minDuration !== undefined && value.maxDuration !== undefined && value.minDuration > value.maxDuration) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Minimum duration cannot be greater than maximum duration',
      path: ['minDuration'],
    });
  }
});

const scenarioInclude = {
  states: true,
  rules: true,
  feedbackTemplates: true,
} as const;

function buildScenarioUpdateData(dto: z.infer<typeof scenarioUpdateSchema>) {
  const data: Record<string, unknown> = {};

  const title = dto['title'];
  const description = dto['description'];
  const category = dto['category'];
  const difficulty = dto['difficulty'];
  const estimatedDuration = dto['estimatedDuration'];
  const patientPresentation = dto['patientPresentation'];
  const learningObjectives = dto['learningObjectives'];

  if (title !== undefined) data['title'] = title;
  if (description !== undefined) data['description'] = description;
  if (category !== undefined) data['category'] = category;
  if (difficulty !== undefined) data['difficulty'] = difficulty;
  if (estimatedDuration !== undefined) data['estimatedDuration'] = estimatedDuration;
  if (patientPresentation !== undefined) data['patientPresentation'] = patientPresentation;
  if (learningObjectives !== undefined) data['learningObjectives'] = learningObjectives;

  return data;
}

function normalizeVitals(
  vitals: z.infer<typeof scenarioStateSchema>['vitals'],
): { hr: number | null; bp: string | null; spo2: number | null; rr: number | null; temp: number | null; ecg: string | null } {
  return {
    hr: vitals['hr'] ?? null,
    bp: vitals['bp'] ?? null,
    spo2: vitals['spo2'] ?? null,
    rr: vitals['rr'] ?? null,
    temp: vitals['temp'] ?? null,
    ecg: vitals['ecg'] ?? null,
  };
}

async function getScenarioRulePriority(scenarioId: string, requestedPriority?: number): Promise<number> {
  if (requestedPriority !== undefined) {
    const conflict = await db.content.scenarioRule.findFirst({
      where: { scenarioId, priority: requestedPriority },
      select: { id: true },
    });

    if (!conflict) {
      return requestedPriority;
    }
  }

  const maxPriority = await db.content.scenarioRule.aggregate({
    where: { scenarioId },
    _max: { priority: true },
  });

  return maxPriority._max.priority === null ? 1000 : Math.min(maxPriority._max.priority + 10, 1000);
}

async function ensureUniqueFeedbackTemplateKey(
  scenarioId: string,
  key: string,
  language: string,
  templateId?: string,
): Promise<boolean> {
  const conflict = await db.content.feedbackTemplate.findFirst({
    where: {
      scenarioId,
      key,
      language,
      ...(templateId ? { NOT: { id: templateId } } : {}),
    },
    select: { id: true },
  });

  return !conflict;
}

function buildLibraryFilters(dto: z.infer<typeof scenarioLibraryQuerySchema>) {
  return {
    ...(dto.search
      ? {
          title: { contains: dto.search, mode: 'insensitive' as const },
        }
      : {}),
    ...(dto.category.length > 0 ? { category: { in: dto.category } } : {}),
    ...(dto.difficulty.length > 0 ? { difficulty: { in: dto.difficulty } } : {}),
    ...(dto.minDuration !== undefined || dto.maxDuration !== undefined
      ? {
          estimatedDuration: {
            ...(dto.minDuration !== undefined ? { gte: dto.minDuration } : {}),
            ...(dto.maxDuration !== undefined ? { lte: dto.maxDuration } : {}),
          },
        }
      : {}),
  };
}

function mapPublicSort(sort: z.infer<typeof scenarioLibraryQuerySchema>['sort']) {
  switch (sort) {
    case 'oldest':
      return { createdAt: 'asc' as const };
    case 'title_az':
      return { title: 'asc' as const };
    case 'title_za':
      return { title: 'desc' as const };
    default:
      return { createdAt: 'desc' as const };
  }
}

router.get('/library', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = scenarioLibraryQuerySchema.parse(req.query);
    const where = {
      isPublished: true,
      ...buildLibraryFilters(dto),
    };

    const [total, scenarios] = await Promise.all([
      db.content.scenario.count({ where }),
      db.content.scenario.findMany({
        where,
        orderBy: mapPublicSort(dto.sort),
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          estimatedDuration: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const response: ApiResponse<{
      items: typeof scenarios;
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }> = {
      success: true,
      data: {
        items: scenarios,
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / dto.limit)),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/public', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const scenario = await db.content.scenario.findFirst({
      where: { id: scenarioId, isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        estimatedDuration: true,
        patientPresentation: true,
        learningObjectives: true,
        states: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            name: true,
            vitals: true,
            physicalExam: true,
            symptoms: true,
            timeLimit: true,
          },
        },
      },
    });

    if (!scenario) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scenario not found' },
      });
      return;
    }

    const response: ApiResponse<typeof scenario> = { success: true, data: scenario };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.use(authenticate, authorize('admin', 'super_admin', 'clinical_validator'));

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const dto = scenarioDraftSchema.parse(req.body);
    const authorId = String(req.user['sub']);
    const title = dto['title'];
    const description = dto['description'];
    const category = dto['category'];
    const difficulty = dto['difficulty'];
    const estimatedDuration = dto['estimatedDuration'];
    const patientPresentation = dto['patientPresentation'];
    const learningObjectives = dto['learningObjectives'];

    const scenario = await db.content.scenario.create({
      data: {
        title,
        description,
        category,
        difficulty,
        estimatedDuration,
        patientPresentation,
        learningObjectives,
        authorId,
        status: 'DRAFT',
        isPublished: false,
      },
      include: scenarioInclude,
    });

    const response: ApiResponse<typeof scenario> = { success: true, data: scenario };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const scenario = await db.content.scenario.findUnique({
      where: { id: scenarioId },
      include: scenarioInclude,
    });

    if (!scenario) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scenario not found' },
      });
      return;
    }

    const response: ApiResponse<typeof scenario> = { success: true, data: scenario };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const scenarioId = String(req.params['id']);
    const dto = scenarioUpdateSchema.parse(req.body);
    const scenario = await db.content.scenario.update({
      where: { id: scenarioId },
      data: buildScenarioUpdateData(dto),
      include: scenarioInclude,
    });

    const response: ApiResponse<typeof scenario> = { success: true, data: scenario };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/states', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const states = await db.content.scenarioState.findMany({
      where: { scenarioId },
      orderBy: { order: 'asc' },
    });

    const response: ApiResponse<typeof states> = { success: true, data: states };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/states', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const dto = scenarioStateSchema.parse(req.body);

    const maxOrderResult = await db.content.scenarioState.aggregate({
      where: { scenarioId },
      _max: { order: true },
    });
    const nextOrder = dto.order ?? (maxOrderResult._max.order === null ? 0 : maxOrderResult._max.order + 1);

    const state = await db.content.scenarioState.create({
      data: {
        scenarioId,
        order: nextOrder,
        name: dto.name,
        vitals: normalizeVitals(dto.vitals),
        physicalExam: dto.physicalExam ?? null,
        symptoms: dto.symptoms ?? null,
        timeLimit: dto.timeLimit ?? null,
      },
    });

    const response: ApiResponse<typeof state> = { success: true, data: state };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/states/:stateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const stateId = String(req.params['stateId']);
    const dto = scenarioStateSchema.partial().parse(req.body);

    const current = await db.content.scenarioState.findFirst({
      where: { id: stateId, scenarioId },
    });

    if (!current) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'State not found' },
      });
      return;
    }

    const state = await db.content.scenarioState.update({
      where: { id: stateId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.vitals !== undefined ? { vitals: normalizeVitals(dto.vitals) } : {}),
        ...(dto.physicalExam !== undefined ? { physicalExam: dto.physicalExam } : {}),
        ...(dto.symptoms !== undefined ? { symptoms: dto.symptoms } : {}),
        ...(dto.timeLimit !== undefined ? { timeLimit: dto.timeLimit } : {}),
      },
    });

    const response: ApiResponse<typeof state> = { success: true, data: state };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/states/:stateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const stateId = String(req.params['stateId']);
    const current = await db.content.scenarioState.findFirst({
      where: { id: stateId, scenarioId },
    });

    if (!current) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'State not found' },
      });
      return;
    }

    await db.content.scenarioState.delete({ where: { id: stateId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.put('/:id/states/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const { ids } = scenarioStateReorderSchema.parse(req.body);

    await db.$transaction(
      ids.map((stateId, index) =>
        db.content.scenarioState.updateMany({
          where: { id: stateId, scenarioId },
          data: { order: index },
        }),
      ),
    );

    const states = await db.content.scenarioState.findMany({
      where: { scenarioId },
      orderBy: { order: 'asc' },
    });

    const response: ApiResponse<typeof states> = { success: true, data: states };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const rules = await db.content.scenarioRule.findMany({
      where: { scenarioId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    const response: ApiResponse<typeof rules> = { success: true, data: rules };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const dto = createRuleSchema.parse(req.body);

    const scenario = await db.content.scenario.findUnique({
      where: { id: scenarioId },
      select: { id: true },
    });

    if (!scenario) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scenario not found' },
      });
      return;
    }

    const priority = await getScenarioRulePriority(scenarioId, dto.priority);

    const rule = await db.content.scenarioRule.create({
      data: {
        scenarioId,
        name: dto.name,
        description: dto.description ?? null,
        condition: dto.condition,
        points: dto.points,
        feedbackKey: dto.feedbackKey,
        priority,
        isActive: true,
      },
    });

    const response: ApiResponse<typeof rule> = { success: true, data: rule };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/rules/:ruleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const ruleId = String(req.params['ruleId']);
    const dto = updateRuleSchema.parse(req.body);

    const current = await db.content.scenarioRule.findFirst({
      where: { id: ruleId, scenarioId },
    });

    if (!current) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Rule not found' },
      });
      return;
    }

    const requestedPriority = dto.priority;
    let priority: number | undefined;

    if (requestedPriority !== undefined) {
      const conflict = await db.content.scenarioRule.findFirst({
        where: {
          scenarioId,
          priority: requestedPriority,
          NOT: { id: ruleId },
        },
        select: { id: true },
      });
      priority = conflict ? await getScenarioRulePriority(scenarioId, undefined) : requestedPriority;
    }

    const rule = await db.content.scenarioRule.update({
      where: { id: ruleId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.condition !== undefined ? { condition: dto.condition } : {}),
        ...(dto.points !== undefined ? { points: dto.points } : {}),
        ...(dto.feedbackKey !== undefined ? { feedbackKey: dto.feedbackKey } : {}),
        ...(priority !== undefined ? { priority } : {}),
      },
    });

    const response: ApiResponse<typeof rule> = { success: true, data: rule };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/rules/:ruleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const ruleId = String(req.params['ruleId']);
    const current = await db.content.scenarioRule.findFirst({
      where: { id: ruleId, scenarioId },
    });

    if (!current) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Rule not found' },
      });
      return;
    }

    await db.content.scenarioRule.delete({ where: { id: ruleId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/rules/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const { ids } = scenarioRuleReorderSchema.parse(req.body);

    await db.$transaction(
      ids.map((ruleId, index) =>
        db.content.scenarioRule.updateMany({
          where: { id: ruleId, scenarioId },
          data: { priority: 1000 - index * 10 },
        }),
      ),
    );

    const rules = await db.content.scenarioRule.findMany({
      where: { scenarioId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    const response: ApiResponse<typeof rules> = { success: true, data: rules };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/feedback-templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const dto = scenarioFeedbackTemplateSchema.parse(req.body);
    const isUnique = await ensureUniqueFeedbackTemplateKey(scenarioId, dto.key, dto.language);

    if (!isUnique) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Feedback template key must be unique within the scenario and language',
        },
      });
      return;
    }

    const template = await db.content.feedbackTemplate.create({
      data: {
        scenarioId,
        key: dto.key,
        language: dto.language,
        title: dto.title,
        message: dto.message,
      },
    });

    const response: ApiResponse<typeof template> = { success: true, data: template };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/feedback-templates/:templateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const templateId = String(req.params['templateId']);
    const dto = scenarioFeedbackTemplateUpdateSchema.parse(req.body);

    const current = await db.content.feedbackTemplate.findFirst({
      where: { id: templateId, scenarioId },
    });

    if (!current) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Feedback template not found' },
      });
      return;
    }

    const nextKey = dto.key ?? current.key;
    const nextLanguage = dto.language ?? current.language;
    const isUnique = await ensureUniqueFeedbackTemplateKey(scenarioId, nextKey, nextLanguage, templateId);

    if (!isUnique) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Feedback template key must be unique within the scenario and language',
        },
      });
      return;
    }

    const template = await db.content.feedbackTemplate.update({
      where: { id: templateId },
      data: {
        ...(dto.key !== undefined ? { key: dto.key } : {}),
        ...(dto.language !== undefined ? { language: dto.language } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.message !== undefined ? { message: dto.message } : {}),
      },
    });

    const response: ApiResponse<typeof template> = { success: true, data: template };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/feedback-templates/:templateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarioId = String(req.params['id']);
    const templateId = String(req.params['templateId']);
    const current = await db.content.feedbackTemplate.findFirst({
      where: { id: templateId, scenarioId },
    });

    if (!current) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Feedback template not found' },
      });
      return;
    }

    await db.content.feedbackTemplate.delete({ where: { id: templateId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
