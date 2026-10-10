// ============================================================================
// File: apps/backend/src/lib/logger.ts
// Version: 1.0.0 — 2026-04-20
// Why: Winston logger configured with PII-safe output.
//      In development: colored console output with full context.
//      In production: JSON structured logs (pipe to log aggregator).
//      IMPORTANT: Never log PII via this logger — the pii-filter middleware
//      provides a safety net, but the source of truth is at the call site.
// Env / Identity: Backend (Node.js)
// ============================================================================

import { PII_PATTERNS } from '@imedica/shared';
import { createLogger, format, transports } from 'winston';


const { combine, timestamp, errors, json, colorize, printf } = format;

// ─── PII Scrubber Format ──────────────────────────────────────────────────────
// Runtime safety net: scrubs PII from log messages before output.
// Application code should never produce logs with PII in the first place.

const piiScrubber = format((info) => {
  const message = typeof info.message === 'string' ? info.message : '';
  let scrubbed = message;

  for (const [patternName, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = scrubbed.match(pattern);
    if (matches && matches.length > 0) {
      scrubbed = scrubbed.replace(pattern, `[${patternName.toUpperCase()}_REDACTED]`);
      // Reset lastIndex for global regexes
      pattern.lastIndex = 0;
    }
  }

  // Also scrub any JSON stringified metadata
  if (info['meta'] && typeof info['meta'] === 'object') {
    let metaStr = JSON.stringify(info['meta']);
    for (const [patternName, pattern] of Object.entries(PII_PATTERNS)) {
      metaStr = metaStr.replace(pattern, `[${patternName.toUpperCase()}_REDACTED]`);
      pattern.lastIndex = 0;
    }
    try {
      info['meta'] = JSON.parse(metaStr) as unknown;
    } catch {
      info['meta'] = '[REDACTED_UNPARSEABLE]';
    }
  }

  info.message = scrubbed;
  return info;
});

// ─── Development Format ───────────────────────────────────────────────────────

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, ...rest }) => {
    const meta = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
    const stackTrace = typeof stack === 'string' ? `\n${stack}` : '';
    return `${String(ts)} [${level}] ${String(message)}${meta}${stackTrace}`;
  }),
);

// ─── Production Format ────────────────────────────────────────────────────────

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  piiScrubber(),
  json(),
);

// ─── Logger Instance ──────────────────────────────────────────────────────────

export const logger = createLogger({
  level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
  format: process.env['NODE_ENV'] === 'production' ? prodFormat : devFormat,
  defaultMeta: {
    service: 'imedica-backend',
    env: process.env['NODE_ENV'] ?? 'development',
  },
  transports: [
    new transports.Console({
      // Suppress logs during test runs
      silent: process.env['NODE_ENV'] === 'test',
    }),
  ],
  // Do not crash on uncaught logger errors
  exitOnError: false,
});

// ─── Child Logger Factory ─────────────────────────────────────────────────────
// Use child loggers to add consistent context to a service or request.

/**
 * Creates a child logger with additional default metadata.
 * @example
 * const log = createChildLogger({ service: 'AuthService', requestId: req.id });
 * log.info('User registered', { userId: user.id });
 */
export function createChildLogger(meta: Record<string, unknown>) {
  return logger.child(meta);
}
