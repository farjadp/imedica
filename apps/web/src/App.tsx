// ============================================================================
// File: apps/web/src/App.tsx
// Version: 3.0.0 — 2026-04-22
// Why: Web application router with auth bootstrap and protected routes.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { queryClient } from '@/lib/query-client.js';

import { AppShell } from './components/AppShell.js';
import { AuthBootstrap } from './components/AuthBootstrap.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage.js';
import { LoginPage } from './features/auth/pages/LoginPage.js';
import { OnboardingPage } from './features/auth/pages/OnboardingPage.js';
import { RegisterPage } from './features/auth/pages/RegisterPage.js';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage.js';
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage.js';
import { DashboardPage } from './features/dashboard/pages/DashboardPage.js';

export default function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap />
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
