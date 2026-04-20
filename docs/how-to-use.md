# Developer Setup & How to Use

Follow this guide to get Imedica up and running on your local machine.

## Prerequisites
- **Node.js**: v22+
- **pnpm**: v9+ (`npm install -g pnpm`)
- **Docker** & Docker Compose (for the local Postgres database)

## 1. Environment Setup

Copy the example environment variables to create your local `.env` file at the root.

```bash
cp .env.example .env
```

The default variables are safely configured for local development.

## 2. Boot up Infrastructure

Start the Postgres database and Mailhog (for capturing test emails).

```bash
docker compose up -d
```

## 3. Install Dependencies

Install all node modules at the root using pnpm.

```bash
pnpm install
```

## 4. Database Migrations & Seeding

Imedica uses Prisma. You need to push the schema to your fresh database and then seed the initial user accounts and clinical scenarios.

```bash
pnpm turbo db:migrate
```

*Note: This runs Prisma migrations and then executes the `seed.ts` script in the `apps/backend` package.*

**Seed Accounts:**
- `demo@imedica.ca` / `SuperSecretDemo$123` (Paramedic)
- `admin@imedica.ca` / `SuperSecretDemo$123` (Super Admin)

## 5. Run the Local Development Servers

Start the application using turbo. This will spin up the `web` frontend (Vite) and the `backend` API (Express) concurrently.

```bash
pnpm run dev
```

### Access Points
- **Web App:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`
- **Mailhog:** `http://localhost:8025` (Check here for verification and password reset emails)

---

## 6. Project Commands Reference

- `pnpm turbo build` - Build all packages for production
- `pnpm turbo lint` - Run ESLint across the monorepo
- `pnpm turbo db:studio` - Open Prisma Studio to manually inspect the database.
