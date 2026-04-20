# Imedica

Imedica is a high-fidelity, decision-training platform for paramedics in Canada. It provides immersive clinical scenarios (such as cardiac arrest, stroke, and anaphylaxis) where paramedics must make critical decisions under time pressure and receive physician-validated feedback.

The platform is designed with a strict, privacy-first architecture to comply with Canadian health privacy laws (PIPEDA/PHIPA).

## Quick Links
- [About Imedica](ABOUT.md)
- [Architecture & Data Privacy](docs/architecture.md)
- [How to Run / Developer Guide](docs/how-to-use.md)

## Tech Stack Overview

### Backend Core
- **Node.js (v22+)** with **Express**
- **PostgreSQL** (Multi-schema: `identity`, `analytics`, `content`)
- **Prisma ORM** (Typesafe database client)
- **Zod** (Request/Response validation)

### Frontend Core
- **React 18** (Vite build system)
- **React Router**
- **Tailwind CSS** (Styling & Glassmorphism)
- **Framer Motion** (Animations & Interactions)
- **Axios** (API Client)

### Sub-Packages
- `@imedica/shared` (Zod schemas, shared interfaces, and constants used by both frontend and backend)

## The Philosophy
“Ugly but functional” during MVP data-flow structuring, shifting to a “highly immersive, premium dark-mode aesthetic” once technical validation is complete. 

Imedica is NOT a medical device, it is a clinical training tool.

---
© 2026 Imedica. All rights reserved.
