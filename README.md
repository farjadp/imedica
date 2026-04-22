# Imedica

> Decision-training platform for Canadian paramedics.

Imedica lets paramedics practice clinical decision-making through realistic scenarios — cardiac arrest, stroke, anaphylaxis, and more — then receive physician-validated feedback. Training directors see team-level analytics; individual performance stays private.

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Backend | Node.js 22 + Express + TypeScript strict |
| ORM | Prisma 5 (multiSchema) |
| Database | PostgreSQL 16 (3 schemas: identity / analytics / content) |
| Cache / Queue | Redis 7 + BullMQ |
| Web | React 18 + Vite + TypeScript + Tailwind |
| Mobile | React Native + Expo (Phase 2) |
| LLM | Anthropic Claude (claude-sonnet-4-20250514) |
| Auth | JWT (15 min access, 7 day refresh, httpOnly cookies) |
| Email | Mailhog (local) → SendGrid (production) |
| Infra | DigitalOcean Toronto (TOR1) — Canadian data residency |

---

## Privacy Architecture

Three-schema split (PIPEDA/PHIPA compliant from day one):

- **`identity`** — all PII (users, orgs, emails, names)
- **`analytics`** — anonymized data only (referenced by `anonymous_hash`, never `user_id`)
- **`content`** — scenarios, rules, templates, audit logs (no user data)

The `DeidentificationService` is the **only** path between `identity` and `analytics`. Any data leaving `identity` is sanitized and PII-stripped before use.

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker Desktop

### Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/imedica.git
cd imedica
pnpm install

# 2. Configure environment
cp .env.example .env

# 3. Start local services (PostgreSQL + Redis + Mailhog)
docker compose up -d

# 4. Run database migrations (creates all 3 schemas + tables)
pnpm db:migrate

# 5. Seed initial data
pnpm db:seed

# 6. Start all dev servers
pnpm dev
```

- **Backend API:** http://localhost:3001
- **Web app:** http://localhost:5173
- **Mailhog (email UI):** http://localhost:8025

### Seeded Accounts (local dev)

After `pnpm db:seed`, you can log in with:

- **Super admin:** `admin@imedica.local` / `Dev@dmin2026!`
- **Paramedic:** `paramedic@imedica.local` / `Paramedic2026!`

### Run Tests

```bash
pnpm test                   # all tests via Turborepo
pnpm --filter backend test  # backend only
```

### Lint & Typecheck

```bash
pnpm lint
pnpm typecheck
```

---

## Project Structure

```
imedica/
├── apps/
│   ├── backend/    # Express API
│   ├── web/        # React + Vite
│   └── mobile/     # React Native + Expo (Phase 2)
├── packages/
│   ├── shared/     # Shared types, Zod validators, constants
│   └── config/     # ESLint, TypeScript, Prettier configs
├── docker/
│   └── postgres/   # Local Postgres init scripts
├── docs/
│   ├── architecture.md
│   └── data-flows.md
└── docker-compose.yml
```

Planned for later phases, but not present in this repo yet:

- `packages/api-client/` — typed REST client for web/mobile consumers
- `packages/ui/` — shared UI primitives and design system components
- `infrastructure/terraform/` — production infrastructure as code

---

## Phase Roadmap

| Phase | Weeks | Focus |
|---|---|---|
| 1 | 1 | Foundation: auth, DB, CI/CD, privacy infrastructure |
| 2 | 2 | Design system + base UI (login, dashboard) |
| 3 | 3–4 | Scenario authoring + library |
| 4 | 4 | Session execution (runtime UI) |
| 5 | 5–6 | Feedback engine (rules + LLM) |
| 6 | 7 | Admin dashboard + team analytics |
| 7 | 8 | Testing, polish, pilot deployment |

---

## Canadian Data Residency

All data at rest and in transit stays within Canada. See [`docs/data-flows.md`](docs/data-flows.md) for a complete inventory of every data flow, including any cross-border transfers (which require de-identification).

---

## License

Proprietary — Imedica Inc. All rights reserved.
