import React from 'react'; void React;
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KycScreen from '../screens/auth/KycScreen';
import { AuthContext } from '../context/AuthContextBase';

// Enable wizard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).importMetaEnv = { VITE_KYC_WIZARD: 'true' };

function Provider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = { user: { id: 55, name: 'Last Saved', email: 'ls@example.com', emailVerified: true }, token: 't', hydrated: true } as any;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

describe('KYC Last Saved indicator', () => {
  test('shows and updates after user changes a field', async () => {
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/kyc']}>
          <Routes><Route path="/auth/kyc" element={<KycScreen />} /></Routes>
        </MemoryRouter>
      </Provider>
    );

    // On first step: change first name to trigger persist
    const first = await screen.findByLabelText(/first name/i);
    await userEvent.clear(first);
    await userEvent.type(first, 'Alice');

    // Wait for throttled persist to set lastSavedText
    const { waitFor } = await import('@testing-library/react');
    await waitFor(() => {
      const el = screen.getByTestId('last-saved');
      expect(el.textContent).toMatch(/Saved/);
    });
  });
});
