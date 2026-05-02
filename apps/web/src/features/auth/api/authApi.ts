// ============================================================================
// File: apps/web/src/features/auth/api/authApi.ts
// Version: 1.0.0 — 2026-04-22
// Why: Auth API wrappers used by TanStack Query mutations and the auth store.
// Env / Identity: Web (browser runtime)
// ============================================================================

import type {
  ApiErrorResponse,
  ApiResponse,
  LoginResponse,
  PublicUser,
} from '@imedica/shared';
import type { AxiosError } from 'axios';

import { apiClient } from '@/lib/api-client.js';

import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  OnboardingFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
  VerifyEmailFormValues,
} from '../types.js';

interface AuthMessageResponse {
  message: string;
}

interface RefreshResponse {
  accessToken: string;
  expiresAt: number;
}

interface AuthResponse<T> {
  success: true;
  data: T;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.error?.message ?? fallback;
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, fallback);
}

export async function login(values: LoginFormValues): Promise<LoginResponse> {
  const { data } = await apiClient.post<AuthResponse<LoginResponse>>('/api/auth/login', values);
  return data.data;
}

export async function register(values: RegisterFormValues): Promise<AuthMessageResponse> {
  const payload = {
    email: values.email,
    password: values.password,
    firstName: values.firstName,
    lastName: values.lastName,
    consentAnalytics: values.consentAnalytics ?? false,
  };

  const { data } = await apiClient.post<AuthResponse<AuthMessageResponse>>('/api/auth/register', payload);
  return data.data;
}

export async function forgotPassword(values: ForgotPasswordFormValues): Promise<AuthMessageResponse> {
  const { data } = await apiClient.post<AuthResponse<AuthMessageResponse>>('/api/auth/forgot-password', values);
  return data.data;
}

export async function resetPassword(
  token: string,
  values: ResetPasswordFormValues,
): Promise<AuthMessageResponse> {
  const { data } = await apiClient.post<AuthResponse<AuthMessageResponse>>('/api/auth/reset-password', {
    token,
    newPassword: values.password,
    confirmPassword: values.confirmPassword,
  });

  return data.data;
}

export async function verifyEmail(values: VerifyEmailFormValues): Promise<AuthMessageResponse> {
  const { data } = await apiClient.post<AuthResponse<AuthMessageResponse>>('/api/auth/verify-email', values);
  return data.data;
}

export async function updateProfile(values: OnboardingFormValues): Promise<PublicUser> {
  const { data } = await apiClient.patch<AuthResponse<PublicUser>>('/api/users/me/profile', values);
  return data.data;
}

export async function refreshSession(): Promise<RefreshResponse> {
  const { data } = await apiClient.post<AuthResponse<RefreshResponse>>('/api/auth/refresh');
  return data.data;
}

export async function getCurrentUser(): Promise<PublicUser> {
  const { data } = await apiClient.get<ApiResponse<PublicUser>>('/api/auth/me');
  return data.data;
}

export async function logout(): Promise<AuthMessageResponse> {
  const { data } = await apiClient.post<AuthResponse<AuthMessageResponse>>('/api/auth/logout');
  return data.data;
}
