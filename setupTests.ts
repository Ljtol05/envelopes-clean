import '@testing-library/jest-dom';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost' });
// @ts-ignore
global.window = dom.window as any;
// @ts-ignore
global.document = dom.window.document as any;
// @ts-ignore
global.HTMLElement = dom.window.HTMLElement;
// @ts-ignore
global.navigator = { userAgent: 'node.js' } as any;

// getComputedStyle mock
// @ts-ignore
global.getComputedStyle = (el: Element) => ({
  getPropertyValue: () => ''
});

// localStorage mock
class LocalStorageMock {
  store: Record<string,string> = {};
  clear(){ this.store = {}; }
  getItem(k:string){ return this.store[k] ?? null; }
  setItem(k:string,v:string){ this.store[k]=String(v); }
  removeItem(k:string){ delete this.store[k]; }
}
// @ts-ignore
global.localStorage = new LocalStorageMock();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
});
