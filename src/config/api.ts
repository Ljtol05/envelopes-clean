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

// Resolve environment variables.
// In Vite, import.meta.env is available (and statically replaced in build output).
// In Jest (CJS), import.meta is unavailable; fall back to process.env or an optional global shim.
// We avoid directly referencing `import.meta` so that transformed CJS code does not crash.
const resolvedImportMetaEnv = (() => {
  try {
    // Use dynamic function to avoid static syntax in CJS environments.
    const meta = new Function('return (typeof import !== "undefined" ? import.meta : undefined)')();
    if (meta && typeof meta === 'object' && 'env' in (meta as Record<string, unknown>)) {
      const maybeEnv = (meta as { env?: unknown }).env;
      if (maybeEnv && typeof maybeEnv === 'object') return maybeEnv as MetaEnv;
    }
    return undefined;
  } catch {
    return undefined;
  }
})();

// Allow tests to inject a shim: (globalThis as any).__VITE_JEST_ENV__
const testShimEnv: MetaEnv | undefined = (globalThis as Record<string, unknown>).__VITE_JEST_ENV__ as MetaEnv | undefined;

const env: MetaEnv = resolvedImportMetaEnv || (() => {
  // Avoid referencing process in the browser where it is undefined.
  // This block only runs when import.meta.env isn't available (e.g. Jest / Node tooling),
  // never in a normal Vite browser runtime.
  // Narrow typing: Node's process.env is Record<string,string|undefined>
  type EnvMap = { [k: string]: string | undefined };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore process global may not exist in browser
  const nodeEnv: EnvMap | undefined = (typeof process !== 'undefined' && process && process.env) ? process.env : undefined;
  const p: EnvMap = nodeEnv || {};
  return {
    VITE_API_URL: p.VITE_API_URL,
    VITE_API_BASE_URL: p.VITE_API_BASE_URL,
    MODE: p.MODE || p.NODE_ENV,
    PROD: p.NODE_ENV === 'production',
    DEV: p.NODE_ENV !== 'production'
  } as MetaEnv;
})();

// Merge in test shim (shim takes precedence if provided)
Object.assign(env, testShimEnv);

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

function readRuntimeOverride(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const qp = params.get('api') || params.get('apiBase');
    const ls = localStorage.getItem('api_base_url_override');
    let chosen = qp?.trim() || ls?.trim() || undefined;
    if (qp && qp !== ls) {
      // Persist new query param override
      localStorage.setItem('api_base_url_override', qp.trim());
      chosen = qp.trim();
    }
    if (chosen) return stripTrailingSlash(chosen.replace(/\/$/, ''));
  } catch {
    /* ignore */
  }
  return undefined;
}

// Expose a dev helper for manual override from console
declare global { interface Window { __setApiBase?: (url: string) => void } }
if (typeof window !== 'undefined' && !window.__setApiBase) {
  window.__setApiBase = (url: string) => {
    try {
      if (!url) {
        localStorage.removeItem('api_base_url_override');
        console.info('[API] override cleared');
        return;
      }
      localStorage.setItem('api_base_url_override', url);
  console.info('[API] override set ->', url, '(reload to apply)');
    } catch (e) {
      console.warn('[API] failed to persist override', e);
    }
  };
}

function computeBaseUrl(): string {
  const runtime = readRuntimeOverride();
  if (runtime) return runtime;
  const configured = (env.VITE_API_URL || env.VITE_API_BASE_URL)?.trim();
  if (configured) return stripTrailingSlash(configured);
  if (mode === 'development') return 'http://localhost:5000';
  return PROD_FALLBACK;
}

// Mutable base URL (was const). Update via setApiBase / applyRuntimeOverride.
export let API_BASE_URL = computeBaseUrl();

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

// Attach Authorization + dev headers on every request.
apiClient.interceptors.request.use((cfg) => {
  type HeaderMap = Record<string, string>;
  const headers: HeaderMap = (cfg.headers || {}) as HeaderMap;
  try {
    let t: string | null = null;
    if (typeof localStorage !== 'undefined') {
      // Prefer namespaced key but fall back to generic 'token' for compatibility with docs / external scripts.
      t = localStorage.getItem('auth_token') || localStorage.getItem('token');
    }
    if (t) headers.Authorization = `Bearer ${t}`;
  } catch { /* ignore */ }
  // Narrow access to env (build-time replaced by Vite); cast minimally.
  const metaEnv = (import.meta as unknown as { env?: Record<string,string|undefined> }).env || {};
  const uid = metaEnv.VITE_REPLIT_USER_ID;
  const uname = metaEnv.VITE_REPLIT_USER_NAME;
  if (uid) headers['x-replit-user-id'] = uid;
  if (uname) headers['x-replit-user-name'] = uname;
  // Merge back into existing Axios headers object (preserves prototype methods of AxiosHeaders)
  if (cfg.headers) {
    Object.entries(headers).forEach(([k,v]) => { (cfg.headers as Record<string, unknown>)[k] = v; });
  } else {
    cfg.headers = headers as unknown as typeof cfg.headers;
  }
  return cfg;
});

export async function testApiHealth(base: string, signal?: AbortSignal): Promise<boolean> {
  const url = base.replace(/\/$/, '') + '/healthz';
  try {
    const res = await fetch(url, { method: 'GET', mode: 'cors', signal });
    return res.ok;
  } catch { return false; }
}

export function setApiBase(next: string, opts: { persist?: boolean; silent?: boolean } = {}) {
  const clean = stripTrailingSlash(next.trim());
  if (!clean) return;
  API_BASE_URL = clean;
  apiClient.defaults.baseURL = clean;
  if (opts.persist) {
    try { localStorage.setItem('api_base_url_override', clean); } catch { /* ignore */ }
  }
  if (!opts.silent) console.info('[API] base updated at runtime ->', clean);
}

// Apply runtime override immediately if computed earlier (query/localStorage) differs from initial const fallback
// Already saved by computeBaseUrl() via readRuntimeOverride; nothing else needed here.

export function getApiBase(): string { return API_BASE_URL; }

export default apiClient;
