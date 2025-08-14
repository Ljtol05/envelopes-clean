/* Authentication + health service wrappers */
import apiClient, { API_BASE_URL } from '../config/api';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
export interface RegisterResponse {
  user: { id: string; email: string; name?: string; emailVerified?: boolean; phoneVerified?: boolean; kycApproved?: boolean };
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
export type VerificationStep = 'email' | 'phone' | 'kyc' | 'complete';
export interface LoginResponse {
  token: string;
  // Current verification step achieved (mirrors backend return). 'complete' means fully verified.
  verificationStep?: VerificationStep;
  // Explicit next action user must take (may duplicate verificationStep for clarity)
  nextStep?: VerificationStep | undefined;
  user?: { id: string; email: string; name?: string; phone?: string | null; emailVerified?: boolean; phoneVerified?: boolean; kycApproved?: boolean };
}

export interface HealthResponse {
  status: string;
}

const AUTH_PREFIX = '/api/auth';

export async function register(data: RegisterRequest) {
  try {
    if (import.meta.env.DEV) {
      // Lightweight dev diagnostics (avoid leaking password contents fully)
      console.debug('[auth.register] payload', { ...data, password: data.password ? '***len:' + data.password.length : '' }, 'base', API_BASE_URL);
    }
    const res = await apiClient.post<RegisterResponse>(`${AUTH_PREFIX}/register`, data);
    return res.data;
  } catch (err) {
    // Surface server validation details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e: any = err;
    if (import.meta.env.DEV) {
      console.error('[auth.register] failed', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
      });
    }
    throw err;
  }
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
  emailVerified?: boolean;
  phoneVerified?: boolean;
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

// Optional phone verification (stubs; backend must implement)
export async function startPhoneVerification(phone: string) {
  const res = await apiClient.post<{ ok: boolean }>(`${AUTH_PREFIX}/start-phone-verification`, { phone });
  return res.data;
}
export async function verifyPhone(phone: string, code: string) {
  const res = await apiClient.post<{ ok: boolean }>(`${AUTH_PREFIX}/verify-phone`, { phone, code });
  return res.data;
}
export async function resendPhoneVerification(phone: string) {
  const res = await apiClient.post<{ ok: boolean }>(`${AUTH_PREFIX}/resend-phone-code`, { phone });
  return res.data;
}

// Helper for diagnostics
export function getResolvedApiBase(): string {
  return API_BASE_URL;
}
