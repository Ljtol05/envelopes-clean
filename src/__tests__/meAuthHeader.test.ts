import apiClient from '../config/api';

/**
 * Dedicated coverage for GET /api/auth/me ensuring Authorization header injection
 * for both canonical key (auth_token) and alias key (token) plus precedence rules.
 */

describe('Authorization header on /api/auth/me', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  async function captureMeRequest() {
    let captured: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    await apiClient.get('/api/auth/me', {
      adapter: async (config) => {
        captured = config;
        return { data: { id: 1, email: 'x@example.com' }, status: 200, statusText: 'OK', headers: {}, config };
      }
    });
    return captured;
  }

  it('injects Authorization from auth_token', async () => {
    window.localStorage.setItem('auth_token', 'primary123');
    const cfg = await captureMeRequest();
    expect(cfg.url).toBe('/api/auth/me');
    expect(cfg.headers?.Authorization).toBe('Bearer primary123');
  });

  it('injects Authorization from alias token key when auth_token missing', async () => {
    window.localStorage.setItem('token', 'alias456');
    const cfg = await captureMeRequest();
    expect(cfg.headers?.Authorization).toBe('Bearer alias456');
  });

  it('prefers auth_token over alias token when both present', async () => {
    window.localStorage.setItem('token', 'alias456');
    window.localStorage.setItem('auth_token', 'primary789');
    const cfg = await captureMeRequest();
    expect(cfg.headers?.Authorization).toBe('Bearer primary789');
  });
});
