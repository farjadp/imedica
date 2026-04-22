# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows semantic versioning where applicable.

## [Unreleased] — 2026-04-22

### Added
- Added `packages/ui` for shared UI primitives and Tailwind preset.
- Added web Tailwind/PostCSS configuration for the web app.
- Added Phase 3 Scenario Engine foundation: scenario, state, rule, and feedback template models plus seed data.
- Added physician scenario authoring UI with Basic Info, States, Rules, Feedback, and Preview tabs.
- Added public scenario library and detail pages for authenticated paramedics.
- Added scenario CRUD, state CRUD/reorder, rule CRUD/reorder, and feedback template CRUD API endpoints.
- Added shared Zod validators for scenario authoring payloads.

### Changed
- Hardened auth route guards to avoid unsafe `req.user` access.
- Simplified audit and PII middleware to use `req.user` directly.
- Updated module dependency graph and project structure docs.
- Updated scenario authoring routes to support published/public scenario views and deterministic ordering.
- Updated the `/scenarios` route to serve the paramedic scenario library.

### Fixed
- Prevented PII detection false positives from `anonymousHash` values.
- Ensured email service validates environment before reading config.
- Fixed scenario state ordering, rule priority normalization, and scenario detail fetch handling.
- Fixed library and detail routing to avoid exposing unpublished scenarios.

### Documentation
- Added local `.env` setup step and seeded credentials in `README.md`.
- Documented Scenario Engine progress through the authoring and library workflows.

### Chore
- Ignored `*.tsbuildinfo` artifacts to reduce build churn in git.
- Added frontend dependencies for TipTap and dnd-kit.

## [1.0.0] — 2026-04-20

### Added
- Phase 1 foundation: auth, privacy architecture, and database scaffolding.
- Initial backend, web, and shared packages with tests and docs.
