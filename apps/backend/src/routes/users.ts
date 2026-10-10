// ============================================================================
// File: apps/backend/src/routes/users.ts
// Version: 1.0.0 — 2026-04-22
// Why: Minimal authenticated user profile route used by the Phase 2 onboarding
//      page to persist clinical training preferences.
// Env / Identity: Backend (Express router)
// ============================================================================

import type { Request, Response, NextFunction, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../db/clients.js';
import { AuthenticationError } from '../lib/errors.js';
import { authenticate } from '../middleware/auth.js';
import { auditService } from '../services/audit/AuditService.js';
import { authService } from '../services/auth/AuthService.js';
import { DeidentificationService } from '../services/deidentification/DeidentificationService.js';

const router: ExpressRouter = Router();
const deidentificationService = new DeidentificationService(auditService);

const onboardingSchema = z.object({
  paramedicLevel: z.enum(['PCP', 'ACP', 'CCP', 'student']),
  experienceBucket: z.enum(['0-2_years', '3-5_years', '5-10_years', '10+_years']),
  province: z.string().length(2),
  serviceType: z.enum(['public_large', 'public_small', 'private', 'training_program']),
  organizationName: z.string().trim().max(255).optional(),
});

const EXPERIENCE_BUCKET_MAP: Record<z.infer<typeof onboardingSchema>['experienceBucket'], 'years_0_2' | 'years_3_5' | 'years_5_10' | 'years_10_plus'> = {
  '0-2_years': 'years_0_2',
  '3-5_years': 'years_3_5',
  '5-10_years': 'years_5_10',
  '10+_years': 'years_10_plus',
};

// ─── PATCH /api/users/me/profile ─────────────────────────────────────────────

router.patch('/me/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      next(new AuthenticationError());
      return;
    }

    const body = onboardingSchema.parse(req.body);
    const anonymousHash = await deidentificationService.getAnonymousHash(req.user.sub);

    await db.analytics.paramedicProfile.upsert({
      where: { anonymousHash },
      create: {
        anonymousHash,
        paramedicLevel: body.paramedicLevel,
        experienceBucket: EXPERIENCE_BUCKET_MAP[body.experienceBucket],
        region: body.province.toUpperCase(),
        serviceType: body.serviceType,
      },
      update: {
        paramedicLevel: body.paramedicLevel,
        experienceBucket: EXPERIENCE_BUCKET_MAP[body.experienceBucket],
        region: body.province.toUpperCase(),
        serviceType: body.serviceType,
      },
    });

    await auditService.log({
      actorType: 'user',
      actorId: req.user.sub,
      action: 'profile_onboarded',
      resourceType: 'user_profile',
      resourceId: req.user.sub,
      result: 'success',
      metadata: {
        organizationName: body.organizationName ?? null,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const user = await authService.getMe(req.user.sub);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
