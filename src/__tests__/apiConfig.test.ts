import { describe, it, expect } from '@jest/globals';
import { __computeBaseUrl, __PROD_API_PLACEHOLDER } from '../lib/apiConfig';

describe('__computeBaseUrl', () => {
  it('uses explicit VITE_API_BASE_URL when provided', () => {
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
});
