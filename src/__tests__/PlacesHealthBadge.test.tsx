import React from 'react';
void React; // keep classic jsx transform happy
import { render, act, screen } from '@testing-library/react';

// Inject env for component under test
// Provide minimal typed shim
interface TestEnv { VITE_PLACES_PROXY_BASE: string }
(globalThis as unknown as { importMetaEnv: TestEnv }).importMetaEnv = { VITE_PLACES_PROXY_BASE: 'https://proxy.test' };
import PlacesHealthBadge from '../components/system/PlacesHealthBadge';

// Helper to flush microtasks
const flush = () => new Promise(r => setTimeout(r));

describe('PlacesHealthBadge', () => {
  beforeEach(() => {
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn();
  });

  it('shows ok after successful health ping', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
    render(<PlacesHealthBadge />);
    expect(screen.getByText(/Places/).textContent).toContain('Places'); // initial render
    await act(async () => { await flush(); });
    expect(screen.getByText('Places OK')).toBeInTheDocument();
  });

  it('shows fail on network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    render(<PlacesHealthBadge />);
    await act(async () => { await flush(); });
    expect(screen.getByText('Places Down')).toBeInTheDocument();
  });
});
