// ============================================================================
// File: apps/backend/src/index.ts
// Why: Application entry point. Imports app from app.ts, connects to DB,
//      and starts the HTTP server with graceful shutdown.
//      For Vercel serverless: see api/index.ts which imports app.ts directly.
// ============================================================================

import { app } from './app.js';
import { prisma } from './db/clients.js';
import { logger } from './lib/logger.js';
import { validateEnv } from './lib/validate-env.js';

const config = validateEnv();

// ─── Connect to database & start server ───────────────────────────────────────
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

  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
  process.exit(1);
});

export { app };
