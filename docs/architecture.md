# Imedica Architecture & Data Privacy

Imedica utilizes a **monorepo** structure powered by `pnpm` and `turbo`. This allows us to share validators and types between the browser UI and the backend APIs effortlessly.

```text
/apps
  /backend     # Express.js API
  /web         # React + Vite Frontend
/packages
  /shared      # Zod validation schemas & Typescript interfaces
```

## The Database Framework (Prisma Multi-Schema)

To comply with Canadian PIPEDA/PHIPA regulations, we strictly isolate user identity from training behavior. The database uses three distinct Postgres schemas:

### 1. `identity` 
**DO NOT JOIN AGAINST THIS SCHEMA.**
Contains all Personally Identifiable Information (PII): Names, Emails, Credentials, Passwords, etc.
*Access is entirely restricted to the `AuthService` and `DeidentificationService`.*

### 2. `analytics`
Contains only anonymized tracking data. User decisions are tracked against an immutable `anonymousHash` (a one-way HMAC-SHA256 hash). 
If an attacker breaches the analytics schema, they will see decisions and scores but cannot trace them back to an email address or individual. 

### 3. `content` 
Public, shared domain logic. Contains the curated clinical scenarios, the rule-engine rules for those scenarios, and generic templates. No user data enters this schema.

---

## Authentication Flow

1. **Login:** A user POSTs credentials to `/api/auth/login`.
2. **Access Token:** Backend returns a short-lived JSON Web Token (JWT) inline.
3. **Refresh Token:** Backend sets a long-lived, `HttpOnly`, `Secure` cookie representing the refresh token. This prevents XSS attacks from stealing long-term credentials.
4. **De-Identification:** Before creating a simulation session, the backend calls `DeidentificationService.getAnonymousHash()`, effectively bridging the `identity` request context to the `analytics` tracking context safely.
