// Backward-compatible API base URL resolution (Jest-friendly) that now also honors the
// new preferred env variable VITE_API_URL while keeping legacy VITE_API_BASE_URL support.
// This file is still referenced by legacy fetch-based utilities. The new axios-based
// configuration lives in `src/config/api.ts`. We keep this module so existing imports
// continue to work, delegating to the same precedence rules.

const PROD_API = "https://api.my-prod-domain.com"; // TODO: replace with real production host

interface MetaEnvLike { [k: string]: unknown; PROD?: boolean; VITE_API_BASE_URL?: string; VITE_API_URL?: string }
declare global { var __VITE_META_ENV: MetaEnvLike | undefined; }

function safeMetaEnv(): MetaEnvLike {
  return (globalThis as { __VITE_META_ENV?: MetaEnvLike }).__VITE_META_ENV || {};
}

export function isProd(): boolean {
  return safeMetaEnv().PROD === true;
}

function stripTrailingSlash(u: string) { return u.endsWith('/') ? u.slice(0, -1) : u; }

// Exported for tests. Precedence:
// 1. VITE_API_URL (new)
// 2. VITE_API_BASE_URL (legacy)
// 3. If PROD flag -> PROD_API
// 4. currentOrigin (dev convenience)
// 5. PROD_API fallback
export function __computeBaseUrl(env: Partial<MetaEnvLike>, currentOrigin?: string): string {
  const explicitNew = env?.VITE_API_URL && String(env.VITE_API_URL).trim();
  if (explicitNew) return stripTrailingSlash(explicitNew);
  const explicitLegacy = env?.VITE_API_BASE_URL && String(env.VITE_API_BASE_URL).trim();
  if (explicitLegacy) return stripTrailingSlash(explicitLegacy);
  if (env?.PROD) return stripTrailingSlash(PROD_API);
  if (currentOrigin) return stripTrailingSlash(currentOrigin);
  return stripTrailingSlash(PROD_API);
}

export function getApiBaseUrl(): string {
  let origin: string | undefined;
  if (typeof window !== 'undefined' && window.location) origin = window.location.origin;
  return __computeBaseUrl(safeMetaEnv(), origin);
}

export const __PROD_API_PLACEHOLDER = PROD_API;
