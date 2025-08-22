import '@testing-library/jest-dom';
// Accessibility testing helpers
import 'jest-axe/extend-expect';
// Polyfill TextEncoder/TextDecoder required by react-router / underlying libs in Node test env
import { TextEncoder, TextDecoder } from 'util';
// Provide Web Crypto in Node/Jest env for AES-GCM (used by KYC persistence)
import { webcrypto as nodeWebcrypto } from 'crypto';
if (nodeWebcrypto && !(globalThis as unknown as { crypto?: Crypto }).crypto) {
  (globalThis as unknown as { crypto?: Crypto }).crypto = nodeWebcrypto as unknown as Crypto;
}
interface EncoderGlobal { TextEncoder?: typeof TextEncoder; TextDecoder?: typeof TextDecoder; }
const eg = globalThis as unknown as EncoderGlobal;
if (!eg.TextEncoder) eg.TextEncoder = TextEncoder;
if (!eg.TextDecoder) eg.TextDecoder = TextDecoder;

// Provide matchMedia if missing (jsdom doesn't implement fully)
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as unknown as MediaQueryList
  });
}

// Defensive getComputedStyle stub to avoid undefined in tests reading CSS vars
if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
  // no change
} else if (typeof global !== 'undefined') {
  // @ts-expect-error assigning polyfill
  global.getComputedStyle = () => ({ getPropertyValue: () => '' });
}

// Ensure localStorage exists (jsdom provides it; fallback for safety)
if (typeof window !== 'undefined' && !window.localStorage) {
  class LocalStorageMock {
    private store: Record<string, string> = {};
    clear() { this.store = {}; }
    getItem(k: string) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }
    setItem(k: string, v: string) { this.store[k] = String(v); }
    removeItem(k: string) { delete this.store[k]; }
  }
  // @ts-expect-error polyfill
  window.localStorage = new LocalStorageMock();
}

// Suppress noisy Node.js deprecation warnings for transitive punycode usage (DEP0040)
// so CI logs stay focused on actionable issues.
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning: unknown, ...args: unknown[]): void {
  const msg = typeof warning === 'string' ? warning : (warning as { message?: string })?.message;
  if (msg && msg.toLowerCase().includes('punycode')) return; // swallow
  return (originalEmitWarning as (w: unknown, ...a: unknown[]) => void).call(process, warning, ...args);
};

// Suppress React act() warnings originating from intentional async state updates in polling hooks
const originalError = console.error;
console.error = (...args: unknown[]): void => {
  const first = args[0];
  if (typeof first === 'string' && first.includes('not wrapped in act')) return;
  if (typeof first === 'string' && first.includes('You seem to have overlapping act')) return;
  if ((typeof first === 'string' && first.includes('Cross origin')) || (first instanceof Error && first.message.includes('Cross origin'))) return;
  (originalError as (...a: unknown[]) => void)(...args);
};

// NOTE: We intentionally do NOT stub the addressAutocomplete module here because
// its own dedicated tests exercise real parsing / caching logic. Individual test
// suites that need to avoid network should mock global.fetch themselves. For all
// other suites, any unexpected fetch to external services will simply fail fast
// (fetch() will be undefined or a jest mock) and the feature gracefully degrades.

// Patch XMLHttpRequest to quietly abort localhost cross-origin calls (prevents jsdom error spam)
try {
  if (typeof window !== 'undefined' && typeof window.XMLHttpRequest !== 'undefined') {
    const OriginalXHR = window.XMLHttpRequest;
    class QuietXHR extends OriginalXHR {
      private __suppress = false;
      open(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
        try {
          const target = typeof url === 'string' ? url : url.toString();
          if (target.startsWith('http://localhost')) {
            this.__suppress = true;
          }
        } catch { /* no-op */ }
        return super.open(method, url, async as boolean, username ?? undefined, password ?? undefined);
      }
      send(body?: Document | XMLHttpRequestBodyInit | null): void {
        if (this.__suppress) {
          try { this.abort(); } catch { /* ignore */ }
          return; // swallow
        }
        return super.send(body);
      }
    }
    // Cast to unknown first to satisfy TS structural checks
    window.XMLHttpRequest = QuietXHR as unknown as typeof window.XMLHttpRequest;
  }
} catch { /* ignore */ }

// Track timers (real timers) and clear after each test to avoid lingering open handles warnings.
type TimerId = ReturnType<typeof setTimeout> | number;
const __activeTimeouts: TimerId[] = [];
const __activeIntervals: TimerId[] = [];
// Preserve originals
const __origSetTimeout = global.setTimeout;
const __origSetInterval = global.setInterval;
const __origClearTimeout = global.clearTimeout;
const __origClearInterval = global.clearInterval;
// Patch
(global as unknown as { setTimeout: typeof setTimeout }).setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
  const id = __origSetTimeout(handler, timeout, ...(args as []));
  __activeTimeouts.push(id as TimerId);
  return id;
}) as typeof setTimeout;
(global as unknown as { setInterval: typeof setInterval }).setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
  const id = __origSetInterval(handler, timeout, ...(args as []));
  __activeIntervals.push(id as TimerId);
  return id;
}) as typeof setInterval;

afterEach(() => {
  while (__activeTimeouts.length) {
    const id = __activeTimeouts.pop();
    if (id) __origClearTimeout(id);
  }
  while (__activeIntervals.length) {
    const id = __activeIntervals.pop();
    if (id) __origClearInterval(id);
  }
});
