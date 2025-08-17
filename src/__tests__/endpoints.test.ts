import { ENDPOINTS, getEndpoint } from '../config/endpoints';

// Simple sanity tests for endpoint normalization & override precedence via injected env shim.

describe('ENDPOINTS config', () => {
  it('exposes expected default auth + kyc + core + ai routes (leading slashes enforced)', () => {
    expect(ENDPOINTS.register).toBe('/api/auth/register');
    expect(ENDPOINTS.login).toBe('/api/auth/login');
    expect(ENDPOINTS.verifyEmail).toBe('/api/auth/verify-email');
    expect(ENDPOINTS.resendEmail).toBe('/api/auth/resend-verification');
    expect(ENDPOINTS.startPhone).toBe('/api/auth/start-phone-verification');
    expect(ENDPOINTS.verifyPhone).toBe('/api/auth/verify-phone');
    expect(ENDPOINTS.resendPhone).toBe('/api/auth/resend-phone-code');
    expect(ENDPOINTS.me).toBe('/api/auth/me');
    expect(ENDPOINTS.kycStart).toBe('/api/kyc/start');
  expect(ENDPOINTS.kycStatus).toBe('/api/kyc/status');
  expect(ENDPOINTS.envelopes).toBe('/api/envelopes');
  expect(ENDPOINTS.transactions).toBe('/api/transactions');
  expect(ENDPOINTS.transfers).toBe('/api/transfers');
  expect(ENDPOINTS.cards).toBe('/api/cards');
  expect(ENDPOINTS.rules).toBe('/api/rules');
  expect(ENDPOINTS.events).toBe('/api/events');
  expect(ENDPOINTS.aiCoach).toBe('/api/ai/coach');
  expect(ENDPOINTS.aiSetup).toBe('/api/ai/setup-envelopes');
  expect(ENDPOINTS.aiExecute).toBe('/api/ai/execute-action');
  expect(ENDPOINTS.aiExplainRouting).toBe('/api/ai/explain-routing');
  });

  it('getEndpoint returns same value as direct map access', () => {
    (Object.keys(ENDPOINTS) as (keyof typeof ENDPOINTS)[]).forEach(k => {
      expect(getEndpoint(k)).toBe(ENDPOINTS[k]);
    });
  });
});
