// ============================================================================
// File: apps/web/src/main.tsx
// Version: 2.0.0 — 2026-04-22
// Why: React 18 entry point. App-level providers now live in App.tsx.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.js';
import './styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
