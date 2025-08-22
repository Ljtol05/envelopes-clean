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
  const value = { user: { id: 42, name: 'Jane Tester', email: 'jane@example.com', emailVerified: true }, token: 't', hydrated: true } as any;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Helper to pre-populate localStorage to simulate partial progress */
function seed(step: number, data: Record<string, unknown>) {
  const payload = { step, data, updated: Date.now() };
  localStorage.setItem('kyc_wizard_progress_v1_42', JSON.stringify(payload));
}

describe('KYC Wizard persistence', () => {
  test('shows resume prompt when stored progress exists', async () => {
    seed(2, { legalFirstName: 'Jane', legalLastName: 'Doe', dob: '1990-01-02' });
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/kyc']}>
          <Routes><Route path="/auth/kyc" element={<KycScreen />} /></Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(await screen.findByTestId('resume-prompt')).toBeInTheDocument();
  });

  test('resume applies stored data and advances to stored step (not review)', async () => {
    seed(3, { legalFirstName: 'Jane', legalLastName: 'Doe', dob: '1990-01-02', ssnLast4: '1234' });
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/kyc']}>
          <Routes><Route path="/auth/kyc" element={<KycScreen />} /></Routes>
        </MemoryRouter>
      </Provider>
    );
  await user.click(await screen.findByTestId('resume-continue'));
  // Should be on address step (step index 3)
  expect(await screen.findByTestId('wizard-step-address1', undefined, { timeout: 3000 })).toBeInTheDocument();
  // Name and SSN fields are from earlier steps and not currently rendered; ensure those step containers are absent.
  expect(screen.queryByTestId('wizard-step-name')).not.toBeInTheDocument();
  expect(screen.queryByTestId('wizard-step-ssn')).not.toBeInTheDocument();
  });

  test('start over clears persistence and resets to first step', async () => {
    seed(2, { legalFirstName: 'Jane', legalLastName: 'Doe', dob: '1990-01-02' });
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/kyc']}>
          <Routes><Route path="/auth/kyc" element={<KycScreen />} /></Routes>
        </MemoryRouter>
      </Provider>
    );
    await user.click(await screen.findByTestId('resume-start-over'));
    expect(screen.queryByTestId('resume-prompt')).not.toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-name')).toBeInTheDocument();
    // Storage key removed
    expect(localStorage.getItem('kyc_wizard_progress_v1_42')).toBeNull();
  });

  test('dismiss hides prompt without applying values (still persisted)', async () => {
    seed(2, { legalFirstName: 'Persisted', legalLastName: 'User' });
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/kyc']}>
          <Routes><Route path="/auth/kyc" element={<KycScreen />} /></Routes>
        </MemoryRouter>
      </Provider>
    );
    await user.click(await screen.findByTestId('resume-dismiss'));
    expect(screen.queryByTestId('resume-prompt')).not.toBeInTheDocument();
    // Still on first step name (not auto advanced)
    expect(screen.getByTestId('wizard-step-name')).toBeInTheDocument();
    // Data not yet applied to inputs (they may be auto-filled by user.name but not overridden with 'Persisted' if different) - check first name retains default 'Jane'
  expect((screen.getByRole('textbox', { name: /first name/i }) as HTMLInputElement).value).toBe('Jane');
    // Persistence still present
    expect(localStorage.getItem('kyc_wizard_progress_v1_42')).not.toBeNull();
  });
});
