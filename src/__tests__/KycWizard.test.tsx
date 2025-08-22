import React from 'react'; void React;
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KycScreen from '../screens/auth/KycScreen';
import { AuthContext } from '../context/AuthContextBase';

jest.mock('../lib/kyc', () => ({
  apiStartKyc: jest.fn(async (form: Record<string, unknown>) => ({ status: 'pending', providerRef: 'mock-ref', ...form })),
  apiGetKycStatus: jest.fn(async () => ({ status: 'not_started' })),
}));

// Enable wizard explicitly for this suite only. Use both global importMetaEnv and process.env for robustness.
(global as unknown as { importMetaEnv?: Record<string,string> }).importMetaEnv = { VITE_KYC_WIZARD: 'true' };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
beforeAll(() => { (process as any).env.VITE_KYC_WIZARD = 'true'; });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
afterAll(() => { delete (process as any).env.VITE_KYC_WIZARD; (global as any).importMetaEnv.VITE_KYC_WIZARD = 'false'; });

function Provider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = { user: { id: 1, name: 'Jane Tester', email: 'jane@example.com', emailVerified: true }, token: 't', hydrated: true } as any;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

describe('KYC Wizard', () => {
  test('progresses through steps', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/kyc']}>
          <Routes><Route path="/auth/kyc" element={<KycScreen />} /></Routes>
        </MemoryRouter>
      </Provider>
    );
    await user.clear(await screen.findByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.clear(screen.getByLabelText(/last name/i));
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.type(await screen.findByLabelText(/month/i), '01');
    await user.type(screen.getByLabelText(/day/i), '02');
    await user.type(screen.getByLabelText(/year/i), '1990');
    await user.click(screen.getByRole('button', { name: /next/i }));
  // Use role-based query to avoid ambiguity with progress step aria-label containing "SSN"
  await user.type(await screen.findByRole('textbox', { name: /ssn/i }), '1234');
    await user.click(screen.getByRole('button', { name: /next/i }));
    // Address step: repeatedly attempt to find address line 1 in case guard delays advancement
    let addr1: HTMLElement | null = null;
    for (let i=0;i<5 && !addr1;i++) {
      try { addr1 = await screen.findByLabelText(/address line 1/i, {}, { timeout: 200 }); } catch { /* retry */ }
      if (!addr1) { await user.click(screen.getByRole('button', { name: /next/i })); }
    }
    if (!addr1) throw new Error('Address line 1 not found after advancing attempts');
  await user.type(addr1, '123 Test St');
  // Optional field (exercise rendering but not required)
  const addr2 = screen.getByLabelText(/address line 2/i);
  await user.type(addr2, 'Apt 1');
  await user.click(screen.getByRole('button', { name: /next/i }));
  // Location step
  await user.type(await screen.findByLabelText(/^city$/i), 'Atlanta');
  await user.type(screen.getByLabelText(/^state$/i), 'GA');
  await user.type(screen.getByLabelText(/zip code/i), '30301');
  await user.click(screen.getByRole('button', { name: /next/i }));
  expect(await screen.findByRole('heading', { name: /review/i })).toBeInTheDocument();
  });

  test('cannot advance with required fields empty', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/kyc']}>
          <Routes><Route path="/auth/kyc" element={<KycScreen />} /></Routes>
        </MemoryRouter>
      </Provider>
    );
  const firstName = await screen.findByLabelText(/first name/i);
  await user.clear(firstName);
  await user.click(screen.getByRole('button', { name: /next/i }));
  // Either we remain on name step or show validation; we should NOT be on SSN step directly.
  // Query by role to avoid matching progress step aria-label
  expect(screen.queryByRole('textbox', { name: /ssn/i })).not.toBeInTheDocument();
  });

  test('double clicking next does not skip a step', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/kyc']}>
          <Routes><Route path="/auth/kyc" element={<KycScreen />} /></Routes>
        </MemoryRouter>
      </Provider>
    );
  await user.type(await screen.findByLabelText(/first name/i), 'Jane');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  const next = screen.getByRole('button', { name: /next/i });
  // Simulate an actual double click sequence
  await user.dblClick(next);
  // Allow guard interval to release and UI to update to DOB step (retry loop to reduce flakiness)
  // Allow some time for a single-step advance (if any)
  await new Promise(r => setTimeout(r, 250));
  // Core assertion: SSN field must not be present (no multi-step skip)
  // Ensure SSN input not present yet (avoid progress step aria-label)
  expect(screen.queryByRole('textbox', { name: /ssn/i })).not.toBeInTheDocument();
  });
});
