// Centralized API base URL resolution logic.
// Production uses a fixed constant (edit PROD_API when real host is known).
// Development auto-detects origin (Replit *.replit.dev or localhost) so we avoid manual .env churn.

const PROD_API = "https://api.my-prod-domain.com"; // TODO: replace with real production host

// We avoid direct `import.meta.env` (breaks Jest CJS). Instead we rely on a global snapshot
// assigned once in the app entry (`main.tsx`): `globalThis.__VITE_META_ENV = import.meta.env`.
interface MetaEnvLike { [k: string]: unknown; PROD?: boolean; VITE_API_BASE_URL?: string }
declare global { var __VITE_META_ENV: MetaEnvLike | undefined; }

function safeMetaEnv(): MetaEnvLike {
  return (globalThis as { __VITE_META_ENV?: MetaEnvLike }).__VITE_META_ENV || {};
}

export function isProd(): boolean {
  const env = safeMetaEnv();
  return env.PROD === true;
}

function stripTrailingSlash(u: string) {
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

// Internal pure function so tests can exercise logic without relying on import.meta (which Jest CJS can't evaluate at runtime)
export function __computeBaseUrl(env: Partial<MetaEnvLike>, currentOrigin?: string): string {
  const explicit = env?.VITE_API_BASE_URL && String(env.VITE_API_BASE_URL).trim();
  if (explicit) return stripTrailingSlash(explicit);

  if (env?.PROD) return stripTrailingSlash(PROD_API);

  if (currentOrigin) return stripTrailingSlash(currentOrigin);

  return stripTrailingSlash(PROD_API);
}

export function getApiBaseUrl(): string {
  let origin: string | undefined;
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    origin = window.location.origin;
  }
  return __computeBaseUrl(safeMetaEnv(), origin);
}

// Optionally expose the production constant if needed elsewhere.
export const __PROD_API_PLACEHOLDER = PROD_API;
