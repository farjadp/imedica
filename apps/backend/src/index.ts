// ============================================================================
// File: apps/backend/src/index.ts
// Version: 1.0.0 — 2026-04-20
// Why: Application entry point. Initializes Sentry first (catches startup errors),
//      validates environment variables, creates the Express app with all middleware,
//      connects to databases, and starts the HTTP server with graceful shutdown.
//
//      Startup order is important:
//        1. Sentry (catch startup errors)
//        2. Env validation (fail fast on missing config)
//        3. Express app setup
//        4. DB connection
//        5. Listen
//
// Env / Identity: Backend (Node.js entry point)
// ============================================================================

import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { Express } from 'express';
import express from 'express';
import * as helmet from 'helmet';

import { prisma } from './db/clients.js';
import { logger } from './lib/logger.js';
import { initSentry } from './lib/sentry.js';
import { validateEnv } from './lib/validate-env.js';
import { auditLogMiddleware } from './middleware/audit-log.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { attachRequestId, devPiiGuard, piiSafeRequestLogger } from './middleware/pii-filter.js';
import { apiLimiter } from './middleware/rate-limit.js';
import apiRouter from './routes/index.js';

// ─── Step 1: Initialize Sentry (before everything else) ──────────────────────
// Importing env() here won't work yet — read from process.env directly
initSentry(process.env['SENTRY_DSN'], process.env['NODE_ENV'] ?? 'development');

// ─── Step 2: Validate environment ────────────────────────────────────────────
const config = validateEnv();

// ─── Step 3: Create Express app ──────────────────────────────────────────────
const app: Express = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet.default({
  // Allow inline scripts for health checks
  contentSecurityPolicy: config.NODE_ENV === 'production',
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? [config.APP_URL]
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:19006'],
  credentials: true, // Required for cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ─── Request Middleware ───────────────────────────────────────────────────────
app.use(attachRequestId);           // Unique ID for every request
app.use(piiSafeRequestLogger);      // Log requests without PII
app.use(devPiiGuard);               // Dev-mode PII guard on analytics routes
app.use('/api', apiLimiter);        // General rate limit on all /api routes
app.use(auditLogMiddleware);        // Audit log every request

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);
app.use(notFoundHandler);           // 404 for unmatched routes
app.use(errorHandler);              // Global error handler (must be last)

// ─── Step 4: Connect to database & start server ───────────────────────────────

const server = app.listen(config.PORT, () => {
  void prisma.$connect()
    .then(() => {
      logger.info(`Imedica backend listening`, {
        port: config.PORT,
        env: config.NODE_ENV,
        pid: process.pid,
      });
    })
    .catch((error: unknown) => {
      logger.error('Failed to connect to database', { error });
      process.exit(1);
    });
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// Give in-flight requests up to 10 seconds to complete before shutting down.

function shutdown(signal: string): void {
  logger.info(`Received ${signal} — starting graceful shutdown`);

  server.close(() => {
    void prisma.$disconnect()
      .then(() => {
        logger.info('Database disconnected — shutdown complete');
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  });

  // Force-kill if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled promise rejections — log and exit (let the orchestrator restart)
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
  process.exit(1);
});

export { app };
