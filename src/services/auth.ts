/* Authentication + health service wrappers */
import apiClient, { API_BASE_URL } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';

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

// All auth endpoints now sourced from ENDPOINTS; legacy AUTH_PREFIX removed.

export async function register(data: RegisterRequest) {
  try {
    if (import.meta.env.DEV) {
      // Lightweight dev diagnostics (avoid leaking password contents fully)
      console.debug('[auth.register] payload', { ...data, password: data.password ? '***len:' + data.password.length : '' }, 'base', API_BASE_URL);
    }
  const res = await apiClient.post<RegisterResponse>(ENDPOINTS.register, data);
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
  const res = await apiClient.post<LoginResponse>(ENDPOINTS.login, data);
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
  const res = await apiClient.get<MeResponse>(ENDPOINTS.me);
  return res.data;
}

export interface VerifyEmailResponse {
  ok?: boolean; // legacy
  message?: string;
  token?: string;
  nextStep?: VerificationStep;
  verificationStep?: VerificationStep; // some backends echo current stage
  user?: { id: string | number; email: string; name?: string; emailVerified?: boolean; phoneVerified?: boolean; kycApproved?: boolean };
}
export async function verifyEmail(email: string, code: string): Promise<VerifyEmailResponse> {
  const res = await apiClient.post<VerifyEmailResponse>(ENDPOINTS.verifyEmail, { email, code });
  return res.data;
}

export async function resendVerification(email: string) {
  const res = await apiClient.post<{ ok: boolean }>(ENDPOINTS.resendEmail, { email });
  return res.data;
}

// Optional phone verification (stubs; backend must implement)
export async function startPhoneVerification(phone: string) {
  const res = await apiClient.post<{ ok: boolean }>(ENDPOINTS.startPhone, { phone });
  return res.data;
}

export interface VerifyPhoneResponse {
  ok?: boolean; // legacy simple shape
  message?: string;
  token?: string; // backend may return fresh JWT after phone verification
  nextStep?: VerificationStep;
  verificationStep?: VerificationStep;
  user?: { id: string | number; email: string; name?: string; emailVerified?: boolean; phoneVerified?: boolean; kycApproved?: boolean };
}
export async function verifyPhone(phone: string, code: string): Promise<VerifyPhoneResponse> {
  const res = await apiClient.post<VerifyPhoneResponse>(ENDPOINTS.verifyPhone, { phone, code });
  return res.data;
}
export async function resendPhoneVerification(phone: string) {
  const res = await apiClient.post<{ ok: boolean }>(ENDPOINTS.resendPhone, { phone });
  return res.data;
}

// Helper for diagnostics
export function getResolvedApiBase(): string {
  return API_BASE_URL;
}
