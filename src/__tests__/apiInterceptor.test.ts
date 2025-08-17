import apiClient from '../config/api';

describe('api axios interceptor', () => {
  beforeEach(() => {
    window.localStorage.removeItem('auth_token');
  });

  async function performAndCapture() {
    let captured: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    await apiClient.get('/healthz', {
      adapter: async (config) => {
        captured = config; // final config after request interceptors
        return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
      },
    });
    return captured;
  }

  it('adds Authorization header when token present', async () => {
    window.localStorage.setItem('auth_token', 'test123');
    const cfg = await performAndCapture();
    expect(cfg.headers?.Authorization).toBe('Bearer test123');
  });

  it('omits Authorization header when no token', async () => {
    const cfg = await performAndCapture();
    expect(cfg.headers?.Authorization).toBeUndefined();
  });
});
