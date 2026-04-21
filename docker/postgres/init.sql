-- ============================================================================
-- File: docker/postgres/init.sql
-- Version: 1.0.0 — 2026-04-20
-- Why: Creates the three logical schemas in the local dev PostgreSQL instance
--      and grants the imedica user full access to each.
--      These schemas mirror the privacy architecture:
--        identity   → PII (users, orgs, tokens)
--        analytics  → anonymized performance data (no PII)
--        content    → scenarios, rules, feedback templates, audit logs
-- PRODUCTION NOTE: In production these may become separate managed databases.
-- ============================================================================

-- Create the three schemas (idempotent — safe to run again)
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS content;

-- Grant privileges to the application user
GRANT ALL PRIVILEGES ON SCHEMA identity TO imedica;
GRANT ALL PRIVILEGES ON SCHEMA analytics TO imedica;
GRANT ALL PRIVILEGES ON SCHEMA content TO imedica;

-- Ensure future tables in each schema are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA identity GRANT ALL ON TABLES TO imedica;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON TABLES TO imedica;
ALTER DEFAULT PRIVILEGES IN SCHEMA content GRANT ALL ON TABLES TO imedica;

ALTER DEFAULT PRIVILEGES IN SCHEMA identity GRANT ALL ON SEQUENCES TO imedica;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON SEQUENCES TO imedica;
ALTER DEFAULT PRIVILEGES IN SCHEMA content GRANT ALL ON SEQUENCES TO imedica;
