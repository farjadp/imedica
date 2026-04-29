# AI Memory & Context: Imedica (v2)

> **Dear AI Assistant:** Please read this document before making any changes to the codebase. This file contains the essential context, architectural decisions, and privacy boundaries for the Imedica project.

## 1. Project Overview
**Imedica** is a decision-training platform for Canadian paramedics. It allows paramedics to practice clinical decision-making through realistic scenarios (cardiac arrest, stroke, anaphylaxis, etc.) and receive physician-validated feedback. Training directors can see team-level analytics, but individual performance remains private.

## 2. Tech Stack & Architecture
- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend (Web):** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend (API):** Node.js 22 + Express + TypeScript strict
- **Database:** PostgreSQL 16
- **ORM:** Prisma 5 (using `multiSchema` preview feature)
- **Cache/Queue:** Redis 7 + BullMQ
- **Mobile (Planned):** React Native + Expo

## 3. 🚨 CRITICAL: Privacy Architecture & Database Schemas
To comply with Canadian privacy laws (PIPEDA/PHIPA), the database is strictly divided into three logical schemas using Prisma's `multiSchema` feature. 
**NEVER cross these boundaries in application code or direct joins:**

1. **`identity`**: Contains ALL PII (Personally Identifiable Information) such as `users`, `organizations`, emails, and auth tokens.
2. **`analytics`**: Contains ONLY anonymized data (`ParamedicProfileSnapshot`, `AnalyticsSession`, `Decision`). This schema MUST NOT contain any PII. It connects to users solely via a one-way `anonymous_hash`.
3. **`content`**: Contains scenarios, rules, feedback templates, runtime sessions, and audit logs. No user data is stored here.

**Rule of Thumb:** The `DeidentificationService` is the **only** authorized bridge between `identity` and `analytics`. Do not create relations between `identity` and `analytics` schemas.

## 4. Project Structure (Monorepo)
```text
imedica/
├── apps/
│   ├── backend/    # Express API (contains Prisma schema in src/db/prisma/schema.prisma)
│   ├── web/        # React + Vite frontend (Feature-based structure in src/features)
│   └── mobile/     # React Native + Expo (Future phase)
├── packages/
│   ├── shared/     # Shared Zod validators, types, and constants
│   ├── ui/         # Shared React UI components and Tailwind config
│   └── config/     # ESLint, Prettier, TypeScript configs
```

## 5. Frontend (`apps/web`) Feature-Based Structure
The React app uses a strict feature-based folder structure inside `src/features`:
- `admin/`: Organization and user management.
- `auth/`: Login, registration, token handling.
- `dashboard/`: Paramedic performance and available scenarios.
- `marketing/`: Public landing pages.
- `scenarios/`: Scenario browsing and details.
- `sessions/`: The core runtime engine where scenarios are played out.

## 6. Backend (`apps/backend`) Structure
- `src/routes/`: API routes (`admin.ts`, `auth.ts`, `scenarios.ts`, `sessions.ts`, `users.ts`).
- `src/db/`: Prisma initialization, migrations, and seeds.
- `src/services/`: Business logic, especially the `DeidentificationService` and `AdminAnalyticsService`.

## 7. Current Progress & Focus
- Core infrastructure, Auth, Privacy boundaries, and Database schema are established.
- Scenario creation and Session execution engines are actively being developed/refined.
- We are currently working on Admin Analytics and the Session feedback loop.

## 8. Executed Phases (Implementation History)
Based on the project roadmap, the following phases have been successfully implemented:

- **Phase 1: Foundation**
  - **What we did:** Initialized the Turborepo monorepo. Set up the complex 3-schema PostgreSQL database (`identity`, `analytics`, `content`) using Prisma `multiSchema`. Implemented strict privacy boundaries for PIPEDA/PHIPA compliance via `DeidentificationService`. Built the base Authentication system (JWT, refresh tokens, auth routes).
- **Phase 2: Base UI & Design System**
  - **What we did:** Configured Tailwind CSS, built shared UI primitives in `packages/ui`. Implemented the Marketing landing pages, Auth pages (Login/Register), and the main Paramedic Dashboard for browsing available scenarios.
- **Phase 3: Scenario Architecture**
  - **What we did:** Designed and implemented the backend models and routes for clinical scenarios (`scenarios.ts`). Created the frontend scenario browser and detailed view pages in the `scenarios` feature.
- **Phase 4 & 5: Session Execution & Feedback Engine**
  - **What we did:** Built the core simulation engine where paramedics execute scenarios. Implemented `sessions.ts` to track state changes, decisions, and time limits. Integrated the rule-based feedback system (`Decision` and `SessionDecision` models) to evaluate paramedic actions and calculate scores.
- **Phase 6 (In Progress): Admin & Analytics**
  - **What we did:** Currently building the Admin panel (`admin.ts` and `AdminAnalyticsService`) to allow training directors to manage organizations, users, and view team-level, de-identified analytics without breaching the privacy boundaries.
