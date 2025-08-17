// Centralized endpoint resolution mapping environment variables to in-app paths.
// Backend can provide VITE_* overrides (see README / Replit AI guidance). Each variable
// is optional; we fall back to the existing hard-coded path if not supplied.

// Resolve environment in multiple runtimes (Vite browser, Jest, Node).
// Attempt to read Vite-style env with maximum Jest/Node safety.
// We avoid direct `import.meta` or `typeof import` syntax which can confuse Babel/Jest in CJS mode.
// Instead use an indirect Function constructor to probe at runtime.
const rawEnv: Record<string, string | undefined> = (() => {
  try {
    const meta = new Function('try { return import.meta; } catch { return undefined; }')();
    if (meta && typeof meta === 'object' && 'env' in (meta as Record<string, unknown>)) {
      const maybe = (meta as { env?: unknown }).env;
      if (maybe && typeof maybe === 'object') return maybe as Record<string,string|undefined>;
    }
  } catch { /* ignore */ }
  // Support tests injecting a shim
  interface GlobalWithShim { importMetaEnv?: Record<string,string|undefined> }
  const g = globalThis as unknown as GlobalWithShim;
  if (g.importMetaEnv) return g.importMetaEnv;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore process may not exist in browser
  if (typeof process !== 'undefined' && process && process.env) return process.env as Record<string,string|undefined>;
  return {} as Record<string,string|undefined>;
})();

function pick(name: string): string | undefined {
  const v = rawEnv[name];
  return (v && v.trim()) || undefined;
}
const norm = (p: string) => p.startsWith('/') ? p : '/' + p;

export const ENDPOINTS = {
  register: norm(pick('VITE_REGISTER_ENDPOINT') || '/api/auth/register'),
  login: norm(pick('VITE_LOGIN_ENDPOINT') || '/api/auth/login'),
  verifyEmail: norm(pick('VITE_VERIFY_EMAIL_ENDPOINT') || '/api/auth/verify-email'),
  resendEmail: norm(pick('VITE_RESEND_EMAIL_ENDPOINT') || '/api/auth/resend-verification'),
  startPhone: norm(pick('VITE_START_PHONE_VERIFICATION_ENDPOINT') || '/api/auth/start-phone-verification'),
  verifyPhone: norm(pick('VITE_VERIFY_PHONE_ENDPOINT') || '/api/auth/verify-phone'),
  resendPhone: norm(pick('VITE_RESEND_PHONE_ENDPOINT') || '/api/auth/resend-phone-code'),
  me: norm(pick('VITE_ME_ENDPOINT') || '/api/auth/me'),
  kycStart: norm(pick('VITE_START_KYC_ENDPOINT') || '/api/kyc/start'),
  kycStatus: norm(pick('VITE_KYC_STATUS_ENDPOINT') || '/api/kyc/status'),
  // Core domain resources
  envelopes: norm(pick('VITE_ENVELOPES_ENDPOINT') || '/api/envelopes'),
  transactions: norm(pick('VITE_TRANSACTIONS_ENDPOINT') || '/api/transactions'),
  transfers: norm(pick('VITE_TRANSFERS_ENDPOINT') || '/api/transfers'),
  cards: norm(pick('VITE_CARDS_ENDPOINT') || '/api/cards'),
  rules: norm(pick('VITE_RULES_ENDPOINT') || '/api/rules'),
  events: norm(pick('VITE_EVENTS_ENDPOINT') || '/api/events'),
  // AI features (coach conversational + setup + execute + explain routing)
  aiCoach: norm(pick('VITE_AI_COACH_ENDPOINT') || pick('VITE_AI_CHAT_ENDPOINT') || '/api/ai/coach'),
  aiSetup: norm(pick('VITE_AI_SETUP_ENDPOINT') || '/api/ai/setup-envelopes'),
  aiExecute: norm(pick('VITE_AI_EXECUTE_ENDPOINT') || '/api/ai/execute-action'),
  aiExplainRouting: norm(pick('VITE_AI_EXPLAIN_ROUTING_ENDPOINT') || pick('VITE_AI_EXPLAIN_ENDPOINT') || '/api/ai/explain-routing'),
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
export const getEndpoint = (key: EndpointKey): string => ENDPOINTS[key];
