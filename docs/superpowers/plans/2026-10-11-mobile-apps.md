# Mobile apps (iOS + Android) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paramedic-only iPhone and Android apps on `/api/v1`: sign in, scenario library, decision player, debrief and history, PRE/POST assessments, push when a window opens, Face ID / fingerprint lock, in-app account deletion.

**Architecture:** One Expo (React Native, TypeScript) app in `mobile/`, built and submitted with EAS. It talks only to `/api/v1` with the bearer token from `POST /auth/login`, kept in SecureStore. Grading stays on the server; the app never sees rules it could leak. Backend additions are small and land first, each with integration tests.

**Tech stack:** Expo SDK (latest stable), expo-router, expo-secure-store, expo-local-authentication, expo-notifications, TanStack Query, zod. Backend: Next.js 16 route handlers, Prisma 7, Postgres.

**Spec:** decisions agreed with Farjad on 2026-10-11 (this conversation): Oct 20 = TestFlight + Play internal testing, public release ~Nov 3; developer accounts under Ashavid Inc; Expo; v1 includes scenarios, debrief, assessments, push and biometrics. Screen mockups: sign in (monitor dark), library (paper), decision moment (dark vitals header, paper choices), debrief (paper, triage tag, physician quote).

## Global constraints

- Bundle id / package: `ca.imedica.app`. Display name: `Imedica`.
- Roles: the app is for `PARAMEDIC`. Other roles get "Use Imedica on the web" after sign-in.
- Privacy: push text never carries scores, outcomes or scenario content. Nothing identifying is logged on the device.
- Design: DESIGN.md tokens (paper, ink, pine, signal, triage tags), Source Serif 4 / IBM Plex Sans / IBM Plex Mono. Dark monitor surfaces only on sign-in and the live decision header.
- Copy: sentence case, no "please", no "successfully", Canadian spelling.
- API base URL comes from `EXPO_PUBLIC_API_URL` (staging for beta). Production needs the Canadian host first.

---

## Phase 1 — Backend (branch `feat/mobile-backend`)

### Task 1: Shared rate limiter
The in-memory limiter breaks once Railway runs more than one instance, and the app adds a second client hitting login.
- [ ] Model `RateLimitBucket { key @id, count, resetAt }` in `identity`; the key is a SHA-256 of the raw key, so no email is stored.
- [ ] `limited()` becomes async: one atomic `INSERT … ON CONFLICT DO UPDATE … RETURNING count`. Stale rows pruned occasionally.
- [ ] Update the five callers to `await`.
- [ ] Integration test: the 9th login for one email in the window gets 429; a different email still gets through.

### Task 2: Delete my account
Apple 5.1.1(v) requires deletion to be startable in the app.
- [ ] `DELETE /api/v1/me` with `{ password }`. Paramedics only (others: 403, contact support, because they author content).
- [ ] Verify the password, audit `account.delete`, delete the user. Sessions, reset tokens and push devices cascade. Training runs are keyed by anonymous hash, so they stay de-identified and are no longer linkable.
- [ ] Tests: wrong password → 403 and the user remains; physician → 403; paramedic → 200, the token stops working, the row is gone.

### Task 3: Push devices and the window-opened notification
- [ ] Model `PushDevice { id, userId → User cascade, token @unique, platform, createdAt, lastSeenAt }`.
- [ ] `POST /api/v1/me/devices { token, platform }`: upsert by token (a token moves to whoever signed in last). `DELETE /api/v1/me/devices { token }`: remove the token when the caller owns it.
- [ ] `src/server/push.ts`: `notifyUsers(userIds, message)` sends to the Expo push API in chunks of 100, optional `EXPO_ACCESS_TOKEN`, drops tokens reported as `DeviceNotRegistered`, logs failures, never throws.
- [ ] `openWindow` notifies the service's active paramedics: "Your pre-test is open" / "Your post-test is open". Fire-and-forget.
- [ ] Tests: register, re-register moves the token, deleting someone else's token does nothing, deleting a user removes their devices.

## Phase 2 — App core (`mobile/`)
Expo scaffold, theme tokens and fonts, API client with typed errors and 401 → sign-out, sign-in, library, scenario player, debrief, history.

## Phase 3 — Completion
Assessments (window list, scenario runs inside an attempt, quiz), push registration, biometric lock on resume, profile, sign-out, account deletion.

## Phase 4 — Beta (Oct 20)
`eas.json`, icons and splash, EAS builds, TestFlight, Play internal testing, demo account for App Review, `/download` copy says beta.

## Phase 5 — Public (~Nov 3)
Screenshots, privacy labels / Data safety, age rating, store listings, submission, store URLs in `src/lib/site.ts`.
