// Minimal KYC API wrapper. Expects a `VITE_API_BASE_URL` environment variable.

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

type JsonObject = Record<string, unknown> | null;

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) },
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data: JsonObject | string = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);
  if (!res.ok) {
    const message = (data && typeof data === 'object' && ('message' in data || 'error' in data))
      ? String((data as Record<string, unknown>).message || (data as Record<string, unknown>).error)
      : res.statusText || 'Request failed';
    const error = new Error(message) as Error & { status?: number; body?: unknown };
    error.status = res.status;
    error.body = data;
    throw error;
  }
  return data as T;
}

import type { KycFormData, KycStatusResponse } from '../types/kyc';

export async function apiStartKyc(form: KycFormData): Promise<KycStatusResponse> {
  return request<KycStatusResponse>('/api/kyc/start', {
    method: 'POST',
    body: JSON.stringify(form),
  });
}

export async function apiGetKycStatus(): Promise<KycStatusResponse> {
  return request<KycStatusResponse>('/api/kyc/status', { method: 'GET' });
}

export const startKyc = apiStartKyc;
export const getKycStatus = apiGetKycStatus;
