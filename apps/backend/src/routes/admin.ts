// ============================================================================
// File: apps/backend/src/routes/admin.ts
// Version: 1.0.0 — 2026-04-24
// Why: Express router for administrative functions (User Management).
//      Protected by 'admin' or 'super_admin' roles.
// Env / Identity: Backend (Express router)
// ============================================================================

import type { Request, Response, NextFunction, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { authenticate, authorize } from '../middleware/auth.js';
import { adminAnalyticsService } from '../services/admin/AdminAnalyticsService.js';
import { adminUserService } from '../services/admin/AdminUserService.js';

const router: ExpressRouter = Router();

// Require auth and admin roles for ALL routes in this file
router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

// ─── ANALYTICS ROUTES ────────────────────────────────────────────────────────

router.get('/analytics/kpi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kpis = await adminAnalyticsService.getPlatformKPIs();
    res.status(200).json({ success: true, data: kpis });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/trends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = req.query['days'] ? parseInt(req.query['days'] as string, 10) : 30;
    const trends = await adminAnalyticsService.getSessionsOverTime(days);
    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/scenarios', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminAnalyticsService.getScenarioPerformance();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/admin/users ────────────────────────────────────────────────────
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await adminUserService.getUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/admin/users ───────────────────────────────────────────────────
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).nullable(),
  lastName: z.string().min(1).nullable(),
  role: z.enum(['paramedic', 'admin', 'super_admin', 'clinical_validator']),
});

router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createUserSchema.parse(req.body);
    const user = await adminUserService.createUser(
      req.user!.sub,
      {
        email: body.email,
        passwordRaw: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
      },
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/admin/users/:id/role ─────────────────────────────────────────
const updateRoleSchema = z.object({
  role: z.enum(['paramedic', 'admin', 'super_admin', 'clinical_validator']),
});

router.patch('/users/:id/role', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const body = updateRoleSchema.parse(req.body);
    const user = await adminUserService.updateUserRole(
      req.user!.sub,
      req.params.id,
      body.role,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
router.delete('/users/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const user = await adminUserService.deleteUser(
      req.user!.sub,
      req.params.id,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/admin/pages ────────────────────────────────────────────────────
router.get('/pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../db/clients.js');
    const pages = await prisma.pageContent.findMany({
      orderBy: { slug: 'asc' },
    });
    res.status(200).json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
});

// ─── PUT /api/admin/pages/:slug ──────────────────────────────────────────────
const updatePageSchema = z.object({
  title: z.string().min(1),
  contentJson: z.any(),
});

router.put('/pages/:slug', async (req: Request<{ slug: string }>, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const body = updatePageSchema.parse(req.body);
    const { prisma } = await import('../db/clients.js');

    const page = await prisma.pageContent.upsert({
      where: { slug },
      update: {
        title: body.title,
        contentJson: body.contentJson,
      },
      create: {
        slug,
        title: body.title,
        contentJson: body.contentJson,
      },
    });

    res.status(200).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
});

export default router;
