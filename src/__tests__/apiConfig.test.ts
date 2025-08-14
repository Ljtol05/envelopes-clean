import { describe, it, expect } from '@jest/globals';
import { __computeBaseUrl, __PROD_API_PLACEHOLDER } from '../lib/apiConfig';

describe('__computeBaseUrl (legacy + new precedence)', () => {
  it('prefers VITE_API_URL over legacy when both provided', () => {
    expect(__computeBaseUrl({ VITE_API_URL: 'https://new.example.com', VITE_API_BASE_URL: 'https://legacy.example.com' }, 'http://localhost:5173'))
      .toBe('https://new.example.com');
  });

  it('uses explicit VITE_API_URL when provided alone', () => {
    expect(__computeBaseUrl({ VITE_API_URL: 'https://only-new.example.com/' }, 'http://localhost:5173'))
      .toBe('https://only-new.example.com');
  });

  it('falls back to VITE_API_BASE_URL when new var absent', () => {
    expect(__computeBaseUrl({ VITE_API_BASE_URL: 'https://explicit.example.com/api' }, 'http://localhost:5173'))
      .toBe('https://explicit.example.com/api');
  });

  it('returns PROD fixed constant in production when no explicit override', () => {
    expect(__computeBaseUrl({ PROD: true }, 'http://localhost:5173'))
      .toBe(__PROD_API_PLACEHOLDER.replace(/\/$/, ''));
  });

  it('returns current origin for localhost dev when no explicit override', () => {
    expect(__computeBaseUrl({ PROD: false }, 'http://localhost:5173'))
      .toBe('http://localhost:5173');
  });

  it('returns current origin for Replit dev host', () => {
    expect(__computeBaseUrl({}, 'https://myfront-end.user-name.replit.dev'))
      .toBe('https://myfront-end.user-name.replit.dev');
  });

  it('strips trailing slash from explicit override', () => {
    expect(__computeBaseUrl({ VITE_API_BASE_URL: 'https://override.example.com/' }))
      .toBe('https://override.example.com');
  });

  it('uses origin when neither new nor legacy provided and not prod', () => {
    expect(__computeBaseUrl({}, 'http://localhost:1234'))
      .toBe('http://localhost:1234');
  });
});
