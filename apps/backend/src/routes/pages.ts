// ============================================================================
// File: apps/backend/src/routes/pages.ts
// Why: Public API for fetching dynamic marketing pages (CMS content).
// Env / Identity: Backend (Express router)
// ============================================================================

import type { Request, Response, NextFunction, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { prisma } from '../db/clients.js';

const router: ExpressRouter = Router();

// ─── GET /api/pages/:slug ────────────────────────────────────────────────────
router.get('/:slug', async (req: Request<{ slug: string }>, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    
    const page = await prisma.pageContent.findUnique({
      where: { slug },
    });

    if (!page) {
      res.status(404).json({ success: false, message: 'Page not found' });
      return;
    }

    res.status(200).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
});

export default router;
