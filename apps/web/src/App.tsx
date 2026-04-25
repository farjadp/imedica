// ============================================================================
// File: apps/web/src/App.tsx
// Version: 3.0.0 — 2026-04-22
// Why: Web application router with auth bootstrap and protected routes.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/AppShell.js';
import { AuthBootstrap } from './components/AuthBootstrap.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { AnalyticsDashboardPage } from './features/admin/pages/AnalyticsDashboardPage.js';
import { UserManagementPage } from './features/admin/pages/UserManagementPage.js';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage.js';
import { LoginPage } from './features/auth/pages/LoginPage.js';
import { OnboardingPage } from './features/auth/pages/OnboardingPage.js';
import { RegisterPage } from './features/auth/pages/RegisterPage.js';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage.js';
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage.js';
import { DashboardPage } from './features/dashboard/pages/DashboardPage.js';
import { HomePage } from './features/home/pages/HomePage.js';
import { AboutUsPage } from './features/marketing/pages/AboutUsPage.js';
import { ContactUsPage } from './features/marketing/pages/ContactUsPage.js';
import { PlatformFeaturesPage } from './features/marketing/pages/PlatformFeaturesPage.js';
import { ProductPage } from './features/marketing/pages/ProductPage.js';
import { RoadmapPage } from './features/marketing/pages/RoadmapPage.js';
import { ScenarioDetailPage } from './features/scenarios/pages/ScenarioDetailPage.js';
import { ScenarioEditorShellPage } from './features/scenarios/pages/ScenarioEditorShellPage.js';
import { ScenarioLibraryPage } from './features/scenarios/pages/ScenarioLibraryPage.js';
import { ScenarioListPage } from './features/scenarios/pages/ScenarioListPage.js';
import { SessionPage } from './features/sessions/pages/SessionPage.js';
import { SessionReviewPage } from './features/sessions/pages/SessionReviewPage.js';
import { queryClient } from './lib/query-client.js';

export default function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap />
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/features" element={<PlatformFeaturesPage />} />
            <Route
              path="/scenarios"
              element={
                <ProtectedRoute>
                  <ScenarioLibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scenarios/:id"
              element={
                <ProtectedRoute>
                  <ScenarioDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions/:sessionId"
              element={
                <ProtectedRoute>
                  <SessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions/:sessionId/review"
              element={
                <ProtectedRoute>
                  <SessionReviewPage />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/admin/scenarios"
              element={
                <ProtectedRoute>
                  <ScenarioListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/scenarios/new"
              element={
                <ProtectedRoute>
                  <ScenarioEditorShellPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/scenarios/:id/edit"
              element={
                <ProtectedRoute>
                  <ScenarioEditorShellPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
