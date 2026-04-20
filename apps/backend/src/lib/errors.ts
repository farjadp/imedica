// ============================================================================
// File: apps/backend/src/lib/errors.ts
// Version: 1.0.0 — 2026-04-20
// Why: Custom error classes with HTTP status codes and machine-readable codes.
//      Centralizing errors prevents inconsistent error shapes across the API
//      and makes the error-handler middleware simple and predictable.
//      All errors extend AppError so the middleware can identify them.
// Env / Identity: Backend (Node.js)
// ============================================================================

// ─── Base Error ───────────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  /** Whether to send error details to the user (false in production for 500s). */
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── 400 Bad Request ──────────────────────────────────────────────────────────

export class ValidationError extends AppError {
  public readonly validationErrors: Record<string, string[]>;

  constructor(message: string, validationErrors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.validationErrors = validationErrors ?? {};
  }
}

// ─── 401 Unauthorized ────────────────────────────────────────────────────────

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
  }
}

export class InvalidCredentialsError extends AppError {
  // Intentionally vague message — never reveal whether email or password is wrong
  constructor() {
    super('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Token has expired', 401, 'TOKEN_EXPIRED');
  }
}

export class TokenInvalidError extends AppError {
  constructor() {
    super('Invalid token', 401, 'TOKEN_INVALID');
  }
}

// ─── 403 Forbidden ───────────────────────────────────────────────────────────

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor() {
    super('Please verify your email address before logging in', 403, 'EMAIL_NOT_VERIFIED');
  }
}

export class AccountDeletedError extends AppError {
  constructor() {
    super('This account has been deactivated', 403, 'ACCOUNT_DELETED');
  }
}

// ─── 404 Not Found ───────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

// ─── 409 Conflict ────────────────────────────────────────────────────────────

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class EmailAlreadyRegisteredError extends ConflictError {
  // Intentionally vague — prevents email enumeration attacks
  constructor() {
    super('An account with this email already exists');
  }
}

// ─── 429 Too Many Requests ───────────────────────────────────────────────────

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests — please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// ─── 500 Internal Server Error ────────────────────────────────────────────────

export class InternalError extends AppError {
  constructor(message = 'An internal error occurred') {
    // isOperational=false: do not expose details to user in production
    super(message, 500, 'INTERNAL_ERROR', false);
  }
}

// ─── Privacy-Specific Errors ─────────────────────────────────────────────────

/**
 * Thrown when PII is detected in a context where it must not appear.
 * Examples: LLM request payload, analytics query, outbound log.
 */
export class PiiLeakageError extends AppError {
  public readonly field: string;
  public readonly context: string;

  constructor(field: string, context: string) {
    // isOperational=false: this is a programming error, always a 500
    super(
      `PII leakage detected in field '${field}' during ${context}. Operation aborted.`,
      500,
      'PII_LEAKAGE_DETECTED',
      false,
    );
    this.field = field;
    this.context = context;
  }
}

/**
 * Thrown when de-identification fails for any reason.
 * Callers should treat this as a hard failure — do NOT proceed without anonymization.
 */
export class DeidentificationError extends AppError {
  constructor(reason: string) {
    super(`De-identification failed: ${reason}`, 500, 'DEIDENTIFICATION_FAILED', false);
  }
}
