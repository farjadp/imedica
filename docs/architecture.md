# Imedica — Architecture Overview

> Version 1.0.0 — Phase 1 Foundation

---

## Three-Schema Privacy Architecture

This is the most important architectural decision in Imedica. It is implemented from the first commit and must be maintained throughout all phases.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL (one instance)                    │
│                                                                       │
│  ┌──────────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │  schema:identity  │   │ schema:analytics  │   │ schema:content  │  │
│  │                   │   │                   │   │                 │  │
│  │  users            │   │  paramedic_       │   │  scenarios      │  │
│  │  organizations    │   │    profile_       │   │  scenario_      │  │
│  │  anonymous_       │   │    snapshot       │   │    states       │  │
│  │    mappings       │   │  sessions         │   │  rules          │  │
│  │  refresh_tokens   │   │  decisions        │   │  feedback_      │  │
│  │                   │   │                   │   │    templates    │  │
│  │  ← PII HERE       │   │  ← NO PII         │   │  audit_logs     │  │
│  └────────┬──────────┘   └──────────────────┘   └─────────────────┘  │
│           │                        ↑                                   │
│           └────────────────────────┘                                  │
│                  DeidentificationService                              │
│                  (the ONLY authorized path)                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Schema Rules

| Schema | Contains | Allowed consumers |
|---|---|---|
| `identity` | All PII: email, name, phone, org details, tokens | `AuthService`, `DeidentificationService` |
| `analytics` | Anonymized performance data, `anonymous_hash` only | `AnalyticsService`, `DeidentificationService` |
| `content` | Scenarios, rules, templates, audit logs | Any service |

**Never cross schema boundaries in code.** The `db.identity.*`, `db.analytics.*`, and `db.content.*` namespaced accessors enforce this at code-review time.

---

## De-identification Data Flow

```
User Action
    │
    ▼
AuthService (identity schema)
    │  userId = 550e8400-...
    │
    ▼
DeidentificationService
    │  1. HMAC-SHA256(userId, DEIDENT_SECRET) → anonymousHash
    │  2. Strip: email, name, phone
    │  3. Bucket: yearsExperience → experienceBucket
    │  4. verifyNoLeakage() — throws if any PII found
    │
    ▼
AnalyticsService (analytics schema)
    │  anonymousHash = "a3f7c2..."
    │  No link back to user identity
    │
    ▼
Analytics DB / LLM API / CSV Export
```

The `anonymous_mappings` table (identity schema) stores the only link between `user_id` and `anonymous_hash`. This table is access-controlled at the application layer:

- **Read**: `DeidentificationService.getAnonymousHash()` only
- **Write**: `DeidentificationService.getAnonymousHash()` only
- **Reverse lookup**: **Intentionally not implemented** — there is no `getUser(anonymousHash)` method

---

## Auth Token Lifecycle

```
Register → Email Verification → Login
                                   │
                    ┌──────────────┴───────────────┐
                    │                               │
              Access Token                   Refresh Token
              (15 min JWT)                   (7 day JWT)
              Authorization:                 httpOnly Cookie
              Bearer <token>                 (not in body)
                    │                               │
                    ▼                               ▼
              API Requests                   Token Rotation
              (stateless)                    (old revoked on use)
```

**Rotation pattern:** Every `/api/auth/refresh` call:
1. Verifies the current refresh token (JWT signature + DB lookup + hash comparison)
2. Revokes the current token in the DB (`revokedAt = NOW()`)
3. Issues a new refresh token with a new `tokenId`
4. Sets the new token in the httpOnly cookie

**Compromise detection:** If a revoked refresh token is used, ALL tokens for that user are revoked (indicates token theft → force re-login on all devices).

---

## Feedback Engine (Phase 5 Preview)

```
Paramedic Decision
        │
        ▼ (synchronous, <50ms)
Rule Engine
        │  Evaluates JSON conditions against decision
        │  Returns: isCorrect, score, feedbackKey
        │
        ▼ (immediate)
Feedback Template
        │  Looks up template by feedbackKey
        │  Returns: baseText, detailText, references
        │
        ▼ (display immediately)
Paramedic Sees Rule-Based Feedback

        ─ (async, background job) ──────────────────────────────────
        │
        ▼
De-identification Gateway
        │  Strips PII from context before LLM call
        │
        ▼
Anthropic Claude API
        │  claude-sonnet-4-20250514
        │  Prompt: "Clinical educator voice, no hallucinations"
        │
        ▼
Output Validator
        │  Check: no hallucinated meds, doses in range, no patient advice
        │  Fallback to template if validation fails
        │
        ▼
Cache (Redis, 24h TTL)
        │
        ▼ (WebSocket push)
Paramedic Sees Enhanced Feedback
```

---

## Module Dependency Graph

```
packages/shared
      ↑  ↑  ↑
      │  │  │
apps  │  │  └── apps/mobile
web ──┘  │
         └── apps/backend
               ↑
         packages/api-client (Phase 2)
```

**Rule:** packages can only depend on other packages. Apps can depend on packages. No app-to-app dependencies.

---

## Error Handling Architecture

All errors extend `AppError`:

```typescript
AppError (base)
├── ValidationError (400) — Zod validation failures
├── AuthenticationError (401) — missing/invalid token
├── InvalidCredentialsError (401) — bad email/password (vague by design)
├── TokenExpiredError (401)
├── TokenInvalidError (401)
├── ForbiddenError (403) — insufficient role
├── EmailNotVerifiedError (403)
├── NotFoundError (404)
├── ConflictError (409) — e.g., duplicate email
├── RateLimitError (429)
├── InternalError (500)
├── PiiLeakageError (500) — programming error, never operational
└── DeidentificationError (500) — programming error
```

The global error handler in `middleware/error-handler.ts`:
- Maps `AppError` → HTTP response with consistent `ApiErrorResponse` shape
- Sends non-operational errors (programming bugs) to Sentry
- Strips stack traces + internal details in production
- Handles `ZodError` → `ValidationError` mapping automatically
