// ============================================================================
// File: packages/config/prettier/index.js
// Version: 1.0.0 — 2026-04-20
// Why: Re-exports the root Prettier config for consumption via
//      @imedica/config/prettier import path.
// Env / Identity: Development tooling (not bundled)
// ============================================================================

/** @type {import("prettier").Config} */
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};
