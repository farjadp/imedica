// ============================================================================
// File: apps/backend/src/routes/ai.ts
// Version: 1.0.0
// Why: Express router for AI Hub & Knowledge Base management.
//      Protected by 'admin' or 'super_admin' roles.
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { knowledgeBaseService } from '../services/ai/KnowledgeBaseService.js';
import { prisma } from '../db/clients.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Require auth and admin roles for all AI routes
router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

// ─── GET /api/ai/documents ───────────────────────────────────────────────────
router.get('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documents = await prisma.aiDocument.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });
    
    // Map _count.chunks to chunkCount for the frontend
    const mappedDocs = documents.map(doc => ({
      ...doc,
      chunkCount: doc._count.chunks,
      _count: undefined,
    }));
    
    res.status(200).json({ success: true, data: mappedDocs });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/ai/upload ─────────────────────────────────────────────────────
router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({ success: false, message: 'No file provided' });
        return;
      }
      if (!title) {
        res.status(400).json({ success: false, message: 'Title is required' });
        return;
      }

      const document = await knowledgeBaseService.processFileUpload(
        {
          buffer: file.buffer,
          mimetype: file.mimetype,
          originalname: file.originalname,
        },
        title,
        description,
        req.user?.sub
      );

      res.status(201).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /api/ai/huggingface ────────────────────────────────────────────────
const hfSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
});

router.post('/huggingface', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, description } = hfSchema.parse(req.body);

    const document = await knowledgeBaseService.processHuggingFaceUrl(
      url,
      title,
      description,
      req.user?.sub
    );

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/ai/documents/:id ────────────────────────────────────────────
router.delete('/documents/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    // Because onDelete: Cascade is set on AiDocumentChunk, deleting the doc deletes chunks
    const doc = await prisma.aiDocument.delete({
      where: { id: req.params.id },
    });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
});

export default router;
