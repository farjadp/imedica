# Pre/Post Assessments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a paramedic service measure the pilot metric ("15% improvement") by running the same assessment before and after training, and report the paired change per service, k-anonymously.

**Architecture:** An *assessment* is physician-authored content: a fixed set of published scenarios plus a short multiple-choice quiz, published under the same two-person rule as scenarios. A training lead opens a PRE window and later a POST window for their service. Paramedics take each phase once: the quiz, then each scenario in *assessment mode* (one attempt, no debrief or AI notes until they finish the post-test). The report pairs people who completed both phases by anonymous hash and shows cohort averages only when at least K_ANONYMITY people are paired.

**Tech Stack:** Next.js 16 app router, Prisma 7 on Postgres (identity / content / analytics schemas), Zod, Vitest (unit + `test/integration`).

**Spec:** decisions agreed with Farjad on 2026-10-10:
- Format: **both** scenario runs and a knowledge quiz.
- Content: **the same set** pre and post; the debrief is held back after the pre-test; the report flags the practice effect.
- Ownership: **the training lead opens windows** for their service; results are cohort-level, paired, k ≥ 5; no individual scores go to the service.

## Global Constraints

- No cross-schema relations (see the header of `prisma/schema.prisma`). People appear in `content`/`analytics` only as `anonymousHash` / `cohortKey` from `src/server/privacy/deidentify.ts`.
- Every write goes through a service in `src/server/<area>/service.ts`, called by route handlers (`route()` in `src/server/api.ts`) or server actions; every mutation calls `audit()`.
- Authorization: `CONTENT_ROLES` author, `ORG_MANAGER_ROLES` manage windows, `scopeOrganization()` pins instructors to their org. Two-person publish: the author can't publish their own work (admins excepted); only drafts are editable.
- k-anonymity: `K_ANONYMITY` (5) distinct people behind any figure, as in `src/server/analytics/service.ts`.
- Feature CSS goes in imported plain `.css` files, not `@layer components` in globals (Railway lesson). Values exported from `"use client"` files can't be used on the server.
- UI copy: plain, direct, no eyebrow labels; match the existing admin and learner pages.
- Every task ends green on `npm run lint && npm run typecheck && npm test && npm run test:integration`. Check CI before handing over a merge command.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `prisma/schema.prisma` + new migration | `Assessment`, `AssessmentQuestion`, `AssessmentAttempt` (content), `AssessmentWindow` (identity), `TrainingSession.attemptId` |
| `src/lib/validators/assessment.ts` | Zod schemas shared by editor and API |
| `src/server/assessments/score.ts` (+ `.test.ts`) | Pure: quiz scoring, paired-change maths |
| `src/server/assessments/authoring.ts` | Create/edit/publish assessments (physicians) |
| `src/server/assessments/windows.ts` | Open/close windows (training leads) |
| `src/server/assessments/taking.ts` | Learner flow: what's open for me, start attempt, answer quiz, start assessment-mode runs, finish |
| `src/server/assessments/report.ts` | Paired, k-anonymous report per service |
| `src/server/sessions/service.ts` | Withhold debrief/AI for PRE-phase runs; skip AI generation for assessment runs |
| `src/app/api/v1/assessments/**/route.ts` | REST for the mobile app |
| `src/app/admin/assessments/**` | Authoring UI (physicians) |
| `src/app/admin/assessment-windows/**` | Windows + report UI (training leads, admins) |
| `src/app/app/assessments/**` | Learner flow UI |
| `test/integration/assessments-*.test.ts` | Route-level authorization and flow tests |

Three PRs, each shippable on its own: **A** authoring, **B** windows + taking, **C** report.

---

## PR A — Assessment content and authoring

### Task A1: Data model

**Files:** `prisma/schema.prisma`, `prisma/migrations/<ts>_assessments/migration.sql`

- [ ] Add to the `content` schema:

```prisma
model Assessment {
  id          String         @id @default(cuid())
  title       String
  summary     String
  status      ScenarioStatus @default(DRAFT) // reuse DRAFT / IN_REVIEW / PUBLISHED / ARCHIVED
  scenarioIds String[]       @default([]) // published scenarios, run in this order
  authorId    String
  reviewerId  String?
  publishedAt DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  questions AssessmentQuestion[]
  attempts  AssessmentAttempt[]

  @@index([status])
  @@schema("content")
}

model AssessmentQuestion {
  id           String     @id @default(cuid())
  assessmentId String
  assessment   Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  order        Int
  stem         String
  options      String[] // 2–6 choices
  correctIndex Int
  rationale    String // shown only after the post-test
  reference    String?

  @@index([assessmentId, order])
  @@schema("content")
}

enum AssessmentPhase {
  PRE
  POST
  @@schema("content")
}

model AssessmentAttempt {
  id            String          @id @default(cuid())
  assessmentId  String
  assessment    Assessment      @relation(fields: [assessmentId], references: [id])
  windowId      String // identity.AssessmentWindow.id (no relation: cross-schema)
  phase         AssessmentPhase
  anonymousHash String
  cohortKey     String?
  answers       Json            @default("{}") // { [questionId]: chosenIndex }
  quizScorePct  Int?
  startedAt     DateTime        @default(now())
  completedAt   DateTime?

  @@unique([windowId, anonymousHash])
  @@index([assessmentId, cohortKey, phase])
  @@schema("content")
}
```

- [ ] Add `attemptId String?` (+ `@@index([attemptId])`) to `TrainingSession`.
- [ ] Add to the `identity` schema (org configuration, no PII):

```prisma
model AssessmentWindow {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  assessmentId   String // content.Assessment.id (no relation: cross-schema)
  phase          String // "PRE" | "POST" (enum lives in content)
  opensAt        DateTime @default(now())
  closesAt       DateTime?
  openedById     String
  createdAt      DateTime @default(now())

  @@unique([organizationId, assessmentId, phase])
  @@schema("identity")
}
```

- [ ] `npx prisma migrate dev --name assessments`, check the SQL creates nothing across schemas, `npm run typecheck`.
- [ ] Add audit actions: `assessment.create`, `assessment.update`, `assessment.submit`, `assessment.publish`, `assessment.window_open`, `assessment.window_close`, `assessment.complete`.

### Task A2: Validators and pure scoring (TDD)

**Files:** `src/lib/validators/assessment.ts`, `src/server/assessments/score.ts`, `src/server/assessments/score.test.ts`

- [ ] Failing unit tests for `quizScore(questions, answers) → pct` (unanswered = wrong, out-of-range index = wrong, zero questions → null) and `publishProblems(assessment)` (needs ≥ 1 published scenario, ≥ 5 questions, each question 2–6 non-empty options with a valid `correctIndex` and a rationale).
- [ ] Implement; Zod: `assessmentSchema` (title, summary, scenarioIds), `questionSchema` (stem, options, correctIndex refined against options length, rationale, reference), patch variants, `reorderSchema`.

### Task A3: Authoring service + API (integration tests first)

**Files:** `src/server/assessments/authoring.ts`, `src/app/api/v1/assessments/route.ts`, `[id]/route.ts`, `[id]/status/route.ts`, `[id]/questions/route.ts`, `[id]/questions/[questionId]/route.ts`, `test/integration/assessments-authoring.test.ts`

- [ ] Tests mirroring `test/integration/scenarios.test.ts`: non-authors get 403 on every write; learners can't list or read drafts or any `correctIndex`/`rationale`; scenarioIds must all be PUBLISHED scenarios (422); two-person publish; only drafts editable; an assessment with attempts can't be deleted (409, archive instead).
- [ ] Implement by following `src/server/scenarios/service.ts` (`assertAuthor`, `loadEditable`, `changeStatus` transitions).

### Task A4: Authoring UI

**Files:** `src/app/admin/assessments/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `src/components/assessments/*`, `src/components/app/admin-nav.tsx`

- [ ] List (status tabs like `/admin/scenarios`), editor with Basics (title, summary, pick + order published scenarios), Questions (add/edit/reorder, mark the correct option, rationale), Review & publish (problems list, submit / publish / back to draft, two-person copy).
- [ ] Nav item "Assessments" for `CONTENT_ROLES`.
- [ ] Verify in the browser at desktop and 375px; screenshot.

## PR B — Windows and taking an assessment

### Task B1: Windows (training leads)

**Files:** `src/server/assessments/windows.ts`, `src/app/api/v1/assessment-windows/route.ts` (+ `[id]/close`), `test/integration/assessments-windows.test.ts`

- [ ] Tests: only `ORG_MANAGER_ROLES`; instructors pinned to their org; PRE must exist and be closed (or at least opened) before POST opens; one window per org/assessment/phase (409); only PUBLISHED assessments; closing sets `closesAt`.
- [ ] Implement with `scopeOrganization()`; audit each open/close.

### Task B2: Taking (learner)

**Files:** `src/server/assessments/taking.ts`, `src/server/sessions/service.ts`, `src/app/api/v1/assessments/[id]/attempt/**`, `test/integration/assessments-taking.test.ts`

- [ ] Tests:
  - a paramedic sees only windows open for *their* org; nothing for another org;
  - one attempt per window (`@@unique`); the attempt holds `anonymousHash`, never the user id;
  - the quiz returned to the learner has no `correctIndex` or `rationale`;
  - assessment-mode runs: only the assessment's scenarios, one run per scenario per attempt, `attemptId` set;
  - **PRE runs:** `GET /sessions/:id/review` and `/explanation` → 409 "available after your post-test"; no `AiFeedback` row is created;
  - after the person completes POST, their PRE and POST debriefs and quiz rationales are available;
  - a closed window refuses new attempts and answers.
- [ ] Implement: `startSession(user, scenarioId, { attemptId })` variant; `finish()` skips `aiFeedback` + `generateExplanation` when `attemptId` is set; `getReview`/`getAiStatus` check the attempt's phase and whether that person's POST attempt is complete.

### Task B3: Learner and lead UI

**Files:** `src/app/app/assessments/**`, `src/app/app/page.tsx` (banner when a window is open for me), `src/app/admin/assessment-windows/page.tsx`, `src/components/app/admin-nav.tsx`

- [ ] Learner: intro (what it is, that results go to the service only as team totals, that the debrief comes after the post-test), quiz one question per screen, then the scenario list with run buttons, then "done" state.
- [ ] Lead: pick a published assessment, open PRE, see completion count (k-guarded: "fewer than 5" below K), close, open POST.
- [ ] Browser check at desktop and 375px.

## PR C — Paired report

### Task C1: Report (TDD on the maths, integration on access)

**Files:** `src/server/assessments/score.ts` (`pairedChange`), `src/server/assessments/report.ts`, `src/app/api/v1/assessment-windows/report/route.ts`, `test/integration/assessments-report.test.ts`

- [ ] Unit: `pairedChange(pre[], post[])` pairs by hash, returns `{ people, preAvg, postAvg, delta, relativePct }`, ignores unpaired people.
- [ ] Integration: instructors pinned to their org; < K paired people → suppressed; per-scenario and quiz breakdowns each k-guarded; another org's attempts never counted; the response contains no hashes.
- [ ] Report fields: paired people, scenario score pre/post/Δ, quiz pre/post/Δ, relative improvement vs the 15% target, per-scenario rows, and a fixed note that the same scenarios were used both times (practice effect).

### Task C2: Report UI + docs

- [ ] Report panel on `/admin/assessment-windows` with the 15% target line; print-friendly for the pilot case study.
- [ ] README section; Notion page update; board card "Pre/post assessment flow" → Done.
