/* Authentication + health service wrappers */
import apiClient, { API_BASE_URL } from '../config/api';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
export interface RegisterResponse {
  user: { id: string; email: string; name?: string };
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  token: string;
  user?: { id: string; email: string; name?: string };
}

export interface HealthResponse {
  status: string;
}

const AUTH_PREFIX = '/api/auth';

export async function register(data: RegisterRequest) {
  const res = await apiClient.post<RegisterResponse>(`${AUTH_PREFIX}/register`, data);
  return res.data;
}

export async function login(data: LoginRequest) {
  const res = await apiClient.post<LoginResponse>(`${AUTH_PREFIX}/login`, data);
  return res.data;
}

export async function health() {
  const res = await apiClient.get<HealthResponse>('/healthz');
  return res.data;
}

export interface MeResponse {
  id: string | number;
  email: string;
  name?: string;
}

export async function getMe() {
  const res = await apiClient.get<MeResponse>(`${AUTH_PREFIX}/me`);
  return res.data;
}

export async function verifyEmail(email: string, code: string) {
  // Backend expects both email + code in payload
  const res = await apiClient.post<{ ok: boolean }>(`${AUTH_PREFIX}/verify-email`, { email, code });
  return res.data;
}

export async function resendVerification(email: string) {
  const res = await apiClient.post<{ ok: boolean }>(`${AUTH_PREFIX}/resend-verification`, { email });
  return res.data;
}

// Helper for diagnostics
export function getResolvedApiBase(): string {
  return API_BASE_URL;
}
