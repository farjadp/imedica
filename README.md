# Imedica

Decision training for Canadian paramedics. Physicians write emergency scenarios and the rules that grade them; paramedics run them against the clock; a deterministic engine scores every decision and Claude explains the result. Services see team readiness, never individual scores.

Imedica is a training tool, not a medical device.

## Stack

One Next.js 16 app (App Router, React 19, Tailwind 4) with Prisma 7 on PostgreSQL 16. No separate backend: server components, server actions and a versioned REST API (`/api/v1`) share one service layer in `src/server`.

## Run it locally

Requires Node 22+ and Docker.

```bash
cp .env.example .env            # then set DEIDENTIFICATION_SECRET: openssl rand -base64 48
npm install
npm run db:up                   # Postgres on 127.0.0.1:54329
npm run db:migrate
npm run db:seed
npm run dev                     # http://localhost:3000
```

The seed creates a fictional service, Lakeshore Paramedic Services, three scenarios and de-identified history. All accounts use the password `Imedica-dev-2026` (local only):

| Email | Role |
| --- | --- |
| `admin@imedica.test` | Imedica admin |
| `physician@imedica.test` | Physician, author of the seed scenarios |
| `reviewer@imedica.test` | Second physician (publishes; authors can't publish their own) |
| `instructor@lakeshore.test` | Training lead at Lakeshore |
| `medic1@lakeshore.test` … `medic6@` | Paramedics |

Without `ANTHROPIC_API_KEY` runs still score and debrief; only the AI notes are skipped. Without `RESEND_API_KEY`, invitation and reset links are printed to the server log.

```bash
npm test          # unit tests: rule engine, publish checks, hashing, AI guard
npm run lint
npm run typecheck
```

## How it's built

### Privacy model

The database has three Postgres schemas with no relations between them (`prisma/schema.prisma`):

- `identity`: people, organizations, logins, invitations, audit log. The only schema with PII.
- `content`: scenarios and training runs. Runs are keyed by `HMAC-SHA256(DEIDENTIFICATION_SECRET, user id)`, never a user id.
- `analytics`: de-identified copies written when a run ends: no names, experience as a range, dates truncated to the week, a cohort key per organization.

`src/server/privacy/deidentify.ts` is the only bridge. Team reporting (`src/server/analytics/service.ts`) withholds any figure behind fewer than five people. Treat `DEIDENTIFICATION_SECRET` like an encryption key: rotating it severs every existing link.

### Scoring

`src/server/engine/rules.ts` is pure and tested. In state X, action Y has outcome Z (correct, acceptable, suboptimal, harmful, critical) with points and an optional transition. State-specific rules beat "any state" rules; lower priority wins ties; a right action after its time window is marked late at half points; credit is earned once; critical outcomes and terminal states end the run. The maximum score is the sum of required steps.

### Scenario workflow

Draft → in review → published, with readiness checks (one start state, an end state, enough actions, a required rule, every state reachable). The author can't publish their own scenario. Published scenarios are locked until unpublished.

### AI debrief

`src/server/ai/feedback.ts` sends the scenario, the decisions and the physicians' rationales (nothing that identifies the paramedic) to Claude Opus 5.5 with structured output, server-side refusal fallback (`fallbacks: "default"`), and a guard that withholds anything resembling PII or a claim to change the score. Tokens and cost are stored per run; physicians approve or flag explanations in Admin → AI review.

## REST API (`/api/v1`)

Cookie auth for the web app; `Authorization: Bearer <token>` from `POST /auth/login` for mobile. Errors are `{ error: { message, fields? } }`.

| Method | Path | |
| --- | --- | --- |
| POST | `/auth/login`, `/auth/logout` | Bearer tokens |
| GET | `/me` | Signed-in user |
| GET, POST | `/scenarios` | List (published for learners, all for physicians) / create |
| GET, PATCH, DELETE | `/scenarios/:id` | Learners never receive rules |
| POST | `/scenarios/:id/status` | `{ action: submit \| publish \| unpublish \| archive \| restore }` |
| GET, POST | `/scenarios/:id/{states,actions,rules,feedback}` | |
| PATCH, DELETE | `/scenarios/:id/{collection}/:itemId` | |
| PUT | `/scenarios/:id/{states,actions}/order` | `{ ids: [...] }` |
| GET, POST | `/sessions` | Your runs / start `{ scenarioId }` |
| GET | `/sessions/:id` | Live state, no answers |
| POST | `/sessions/:id/decisions` | `{ actionId }` → verdict |
| POST | `/sessions/:id/end` | Hand over care |
| GET | `/sessions/:id/review`, `/sessions/:id/explanation` | Debrief, AI notes |
| GET | `/analytics?organizationId=&days=` | Team readiness (instructors, admins) |

## Deployment

The claim on the website is that Imedica is designed to run entirely in Canada, so keep it true:

- App: a Canadian region (Vercel `yul1` Montréal, or a container in Toronto or Montréal).
- Database: managed Postgres in the same Canadian region. Run `npm run db:deploy` on release.
- Secrets: `DATABASE_URL`, `DEIDENTIFICATION_SECRET`, `APP_URL`, and optionally `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`.
- Rate limiting is in memory (`src/server/rate-limit.ts`); move it to Redis or Postgres before running more than one instance.

## History

The previous monorepo (Express + Vite + Expo) is preserved on the `archive/v2-pre-rebuild` branch and the `v2-archive` tag.
