// API utilities: existing mock endpoints for envelopes + real auth/coach wrappers.
// Delegate base URL to unified axios config (single source of truth).
import { API_BASE_URL } from '../config/api';
const EVENTS_URL = (import.meta.env.VITE_EVENTS_URL || `${API_BASE_URL}/events`).replace(/\/$/, "");
const REPLIT_USER_ID = import.meta.env.VITE_REPLIT_USER_ID || "";
const REPLIT_USER_NAME = import.meta.env.VITE_REPLIT_USER_NAME || "";
const AUTH_HEADER_KEY = "Authorization";
const TOKEN_STORAGE_KEY = "auth_token";
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getApiBaseUrl(): string { return API_BASE_URL; }
export function getEventsUrl() { return EVENTS_URL; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${normalized}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  // Replit dev headers (backend requires them for auth simulation)
  if (REPLIT_USER_ID) headers["x-replit-user-id"] = REPLIT_USER_ID;
  if (REPLIT_USER_NAME) headers["x-replit-user-name"] = REPLIT_USER_NAME;
  const token = getToken();
  if (token) headers[AUTH_HEADER_KEY] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  let body: unknown = null;
  if (isJson) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } else {
    const text = await res.text().catch(() => null);
    body = text;
  }

  if (!res.ok) {
    const maybeObj = (typeof body === "object" && body !== null) ? (body as { message?: string; error?: string }) : undefined;
    const message = maybeObj?.message || maybeObj?.error || res.statusText || "Request failed";
    const err = new Error(message) as Error & { status?: number; body?: unknown };
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body as T;
}

// ===== Types (auth & coach) =====
export type User = { id: number; name: string; email: string };
export type AuthResponse = { token: string; user: User };
export type CoachResponse = {
  response: string;
  suggestedActions?: { type: string; label: string; payload?: unknown }[];
  analytics?: Record<string, number | string>;
  isNewUser?: boolean;
};

// ===== Endpoints (non-auth) =====
const PATHS = {
  coach: "/api/ai/coach",
  ai: { setup: "/api/ai/setup-envelopes", execute: "/api/ai/execute-action" },
  auth: { verifyEmail: '/api/auth/verify-email', resendVerification: '/api/auth/resend-verification', me: '/api/auth/me' }
} as const;

// ===== Public API (auth & coach) =====
// Auth login/register/verify/resend now handled by services/auth (axios).
export async function apiGetMe(): Promise<User> {
  return request<User>(PATHS.auth.me, { method: 'GET' });
}

// (verify/resend migrated to services/auth)

export async function askCoach(question: string, context?: Record<string, unknown>): Promise<CoachResponse> {
  return request<CoachResponse>(PATHS.coach, {
    method: "POST",
    body: JSON.stringify({ question, context }),
  });
}

export async function executeAction(action: string, payload?: Record<string, unknown>): Promise<{ ok: boolean; result?: unknown }>
{
  return request(PATHS.ai.execute, {
    method: "POST",
    body: JSON.stringify({ action, payload }),
  });
}

export async function setupEnvelopes(params: Record<string, unknown>): Promise<{ ok: boolean; created?: unknown }>
{
  return request(PATHS.ai.setup, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// Also export with canonical names used in requirements
// Removed legacy named re-export (getMe) to encourage using services/auth.

// ===== Types =====
export type EnvelopeId = string;

export interface EnvelopeBalance {
  envelope_id: EnvelopeId;
  name: string;
  balance_cents: number;
}

export interface BalancesResponse {
  account_id: string;
  total_available_cents: number;
  envelopes: EnvelopeBalance[];
}

export interface TransferRequest {
  from_envelope_id: EnvelopeId;
  to_envelope_id: EnvelopeId;
  amount_cents: number;
  memo?: string;
}

export interface TransferResponse {
  ok: boolean;
  transfer_id: string;
  new_balances: BalancesResponse;
  request: TransferRequest; // echo back so callers can reconcile
}

export interface Rule {
  rule_id: string;
  name: string;
  enabled: boolean;
  predicate?: Record<string, unknown>;
  action?: { envelope_id: EnvelopeId };
}

export interface ListRulesResponse {
  user_id: string;
  rules: Rule[];
}

export interface UpsertRuleResponse {
  rule: Rule;
}

export interface ReallocateRequest {
  allocations: { envelope_id: EnvelopeId; amount_cents: number }[];
}

export interface ReallocateResponse {
  ok: boolean;
  allocations: { envelope_id: EnvelopeId; amount_cents: number }[];
}

// ===== API stubs =====
// ===== Existing mock API (kept for envelopes UI) =====
export async function getBalances(account_id: string): Promise<BalancesResponse> {
  await sleep(200);
  return {
    account_id,
    total_available_cents: 223_712,
    envelopes: [
      { envelope_id: "env_groceries", name: "Groceries", balance_cents: 42_012 },
      { envelope_id: "env_dining", name: "Dining", balance_cents: 8_650 },
      { envelope_id: "env_gas", name: "Gas", balance_cents: 11_000 },
      { envelope_id: "env_bills", name: "Bills", balance_cents: 124_500 },
      { envelope_id: "env_buffer", name: "Buffer", balance_cents: 30_000 },
      { envelope_id: "env_misc", name: "Misc", balance_cents: 7_500 },
    ],
  };
}

export async function transfer(req: TransferRequest): Promise<TransferResponse> {
  await sleep(150);
  const new_balances = await getBalances("acct_demo");
  return { ok: true, transfer_id: "tr_mock_1", new_balances, request: req };
}

export async function listRules(user_id: string): Promise<ListRulesResponse> {
  await sleep(150);
  return { user_id, rules: [] };
}

export async function upsertRule(rule: Rule): Promise<UpsertRuleResponse> {
  await sleep(150);
  return { rule: { ...rule, rule_id: rule.rule_id || "rule_mock_1" } };
}

export async function reallocate(req: ReallocateRequest): Promise<ReallocateResponse> {
  await sleep(150);
  return { ok: true, allocations: req.allocations };
}