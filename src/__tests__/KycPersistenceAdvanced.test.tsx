import React from 'react'; void React;
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KycScreen from '../screens/auth/KycScreen';
import { AuthContext } from '../context/AuthContextBase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).importMetaEnv = { VITE_KYC_WIZARD: 'true' };

function Provider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = { user: { id: 77, name: 'Alice Persist', email: 'alice@example.com', emailVerified: true }, token: 't', hydrated: true } as any;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const KEY = 'kyc_wizard_progress_v1_77';

function writeRaw(step: number, data: Record<string, unknown>, updated: number){
  localStorage.setItem(KEY, JSON.stringify({ step, data, updated }));
}

describe('KYC persistence advanced', () => {
  test('stale data (older than expiry) auto-clears and no prompt shown', async () => {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    writeRaw(2, { legalFirstName: 'Old', ssnLast4: '1234' }, Date.now() - weekMs - 1000);
    render(<Provider><MemoryRouter initialEntries={['/auth/kyc']}><Routes><Route path="/auth/kyc" element={<KycScreen />} /></Routes></MemoryRouter></Provider>);
    // Prompt should not appear
    expect(screen.queryByTestId('resume-prompt')).toBeNull();
    // Storage cleared
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  test('encryption applied to sensitive field', async () => {
    // Seed with plain text; component load should not decode since not prefixed, but we want to ensure when it saves it encodes.
    writeRaw(1, { ssnLast4: '9999' }, Date.now());
    render(<Provider><MemoryRouter initialEntries={['/auth/kyc']}><Routes><Route path="/auth/kyc" element={<KycScreen />} /></Routes></MemoryRouter></Provider>);
    // Accept prompt to load
    const resume = await screen.findByTestId('resume-continue');
    await userEvent.click(resume);
    // Stored step=1 (dob). If still on Name (step 0) add minimal data then advance.
    const maybeFirst = screen.queryByLabelText(/first name/i);
    if (maybeFirst) {
      await userEvent.type(maybeFirst, 'Alice');
      const maybeLast = screen.getByLabelText(/last name/i);
      await userEvent.type(maybeLast, 'Persist');
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
    }
  // Now on DOB step: Provide DOB parts
  const month = await screen.findByLabelText(/month/i); await userEvent.type(month, '01');
  const day = screen.getByLabelText(/day/i); await userEvent.type(day, '02');
  const year = screen.getByLabelText(/year/i); await userEvent.type(year, '1990');
  await userEvent.click(screen.getByRole('button', { name: /next/i })); // to ssn
  // Change SSN value to trigger a persist cycle with encoding
  const ssn = await screen.findByLabelText(/ssn \(last 4\)/i);
  await userEvent.clear(ssn);
  await userEvent.type(ssn, '8888');
    await screen.findByTestId('wizard-step-ssn');
    await new Promise(r => setTimeout(r, 0));
    // Wait for the encoded marker to be persisted (rAF throttled)
    await (async () => {
      const { waitFor } = await import('@testing-library/react');
      await waitFor(() => {
        const raw = localStorage.getItem(KEY) || '';
        expect(raw).toMatch(/aes:/);
      });
    })();
  });

  test('Save & Exit persists and navigates to login', async () => {
    render(<Provider><MemoryRouter initialEntries={['/auth/kyc']}><Routes><Route path="/auth/kyc" element={<KycScreen />} /><Route path="/auth/login" element={<div>Login Page</div>} /></Routes></MemoryRouter></Provider>);
    const first = await screen.findByLabelText(/first name/i);
    await userEvent.clear(first); await userEvent.type(first, 'Savey');
    // Click save & exit while on first step
    await userEvent.click(screen.getByTestId('save-exit-btn'));
    // Should land at login route content
    expect(await screen.findByText(/login page/i)).toBeInTheDocument();
    const stored = localStorage.getItem(KEY)!;
    expect(stored).toMatch(/Savey/);
  });
});
