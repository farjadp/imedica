// ============================================================================
// File: apps/backend/src/app.ts
// Why: Creates the Express app with all middleware and routes.
//      Separated from index.ts so it can be exported for Vercel serverless.
// ============================================================================

import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { Express, RequestHandler } from 'express';
import express from 'express';
import type { HelmetOptions } from 'helmet';
import { createRequire } from 'node:module';

import { initSentry } from './lib/sentry.js';
import { validateEnv } from './lib/validate-env.js';
import { auditLogMiddleware } from './middleware/audit-log.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { attachRequestId, devPiiGuard, piiSafeRequestLogger } from './middleware/pii-filter.js';
import { apiLimiter } from './middleware/rate-limit.js';
import apiRouter from './routes/index.js';

const require = createRequire(import.meta.url);
const helmet = require('helmet') as (options?: Readonly<HelmetOptions>) => RequestHandler;

// ─── Step 1: Initialize Sentry ───────────────────────────────────────────────
initSentry(process.env['SENTRY_DSN'], process.env['NODE_ENV'] ?? 'development');

// ─── Step 2: Validate environment ────────────────────────────────────────────
const config = validateEnv();

// ─── Step 3: Create Express app ──────────────────────────────────────────────
const app: Express = express();

app.use(helmet({
  contentSecurityPolicy: config.NODE_ENV === 'production',
}));

app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? [config.APP_URL]
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:19006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(attachRequestId);
app.use(piiSafeRequestLogger);
app.use(devPiiGuard);
app.use('/api', apiLimiter);
app.use(auditLogMiddleware);
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
