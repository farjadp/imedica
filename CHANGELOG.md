# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows semantic versioning where applicable.

## [Unreleased] — 2026-04-22

### Added
- Added `packages/ui` for shared UI primitives and Tailwind preset.
- Added web Tailwind/PostCSS configuration for the web app.

### Changed
- Hardened auth route guards to avoid unsafe `req.user` access.
- Simplified audit and PII middleware to use `req.user` directly.
- Updated module dependency graph and project structure docs.

### Fixed
- Prevented PII detection false positives from `anonymousHash` values.
- Ensured email service validates environment before reading config.

### Documentation
- Added local `.env` setup step and seeded credentials in `README.md`.

### Chore
- Ignored `*.tsbuildinfo` artifacts to reduce build churn in git.

## [1.0.0] — 2026-04-20

### Added
- Phase 1 foundation: auth, privacy architecture, and database scaffolding.
- Initial backend, web, and shared packages with tests and docs.
