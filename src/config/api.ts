/*
 * Central API configuration: auto-detect base URL and expose a pre-configured axios instance.
 * Priority order (development):
 *   1. VITE_API_URL env var (if defined)
 *   2. http://localhost:5000
 * Priority order (production):
 *   1. VITE_API_URL env var (if defined)
 *   2. Hard-coded production fallback domain (PROD_FALLBACK)
 */
import axios from 'axios';
import type { AxiosInstance } from 'axios';

interface MetaEnv {
  VITE_API_URL?: string;            // new preferred (shorter)
  VITE_API_BASE_URL?: string;       // legacy variable still used elsewhere in repo
  MODE?: string;
  PROD?: boolean;
  DEV?: boolean;
}

// Vite provides import.meta.env at runtime (build-time replacement)
// Cast import.meta.env with a narrow interface; avoid any
const env = (import.meta as unknown as { env: MetaEnv }).env || {} as MetaEnv;

// TODO: Replace with your real production API hostname
const PROD_FALLBACK = 'https://api.example.com';

function detectMode(): string {
  if (env.PROD) return 'production';
  if (env.DEV) return 'development';
  return env.MODE || (process.env.NODE_ENV as string) || 'development';
}

const mode = detectMode();

function stripTrailingSlash(u: string) {
  return u.replace(/\/$/, '');
}

function computeBaseUrl(): string {
  // Prefer new var, then legacy var
  const configured = (env.VITE_API_URL || env.VITE_API_BASE_URL)?.trim();
  if (configured) return stripTrailingSlash(configured);
  if (mode === 'development') return 'http://localhost:5000';
  return PROD_FALLBACK;
}

export const API_BASE_URL = computeBaseUrl();

// One-time debug log
if (typeof console !== 'undefined' && mode !== 'test') {
  const source = env.VITE_API_URL ? 'VITE_API_URL'
    : env.VITE_API_BASE_URL ? 'VITE_API_BASE_URL'
    : mode === 'development' ? 'default-dev' : 'fallback-prod';
  console.log(`[API] base URL detected: ${API_BASE_URL} (mode=${mode}, source=${source})`);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

export default apiClient;
