import '@testing-library/jest-dom';
// Accessibility testing helpers
import 'jest-axe/extend-expect';

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
process.emitWarning = function (warning: unknown, ...args: unknown[]) {
  const msg = typeof warning === 'string' ? warning : (warning as { message?: string })?.message;
  if (msg && msg.toLowerCase().includes('punycode')) return;
  return originalEmitWarning.call(process, warning, ...args);
};
