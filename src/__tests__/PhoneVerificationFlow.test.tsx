import React from 'react';
void React;
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

// Ensure env flag is set before importing modules that read PHONE_VERIFICATION_REQUIRED at module scope.
process.env.VITE_REQUIRE_PHONE_VERIFICATION = 'true';

// Force phone requirement flag for guard logic
jest.mock('../lib/onboarding', () => ({ PHONE_VERIFICATION_REQUIRED: true }));

// Mock auth service functions used by phone verification page
jest.mock('../services/auth', () => ({
  startPhoneVerification: jest.fn(async () => ({ ok: true })),
  verifyPhone: jest.fn(async () => ({ ok: true })),
  resendPhoneVerification: jest.fn(async () => ({ ok: true })),
  // Other exports that some pages may import indirectly
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
  getMe: jest.fn(async () => ({ id: 1, email: 'test@example.com', emailVerified: true, phoneVerified: true })),
}));

import { startPhoneVerification, verifyPhone, resendPhoneVerification } from '../services/auth';
import VerificationGuard from '../routes/VerificationGuard';
import PhoneVerificationPage from '../screens/auth/PhoneVerificationPage';
import { AuthContext } from '../context/AuthContextBase';

function makeAuthValue(overrides: Partial<import('../context/AuthContextBase').AuthState['user']> = {}) {
  return {
    user: { id: 1, email: 'test@example.com', name: 'Tester', emailVerified: true, phoneVerified: false, ...overrides },
    token: 't',
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    hydrated: true,
  } as const;
}

function Provider({ children, userOverrides = {} }: { children: React.ReactNode; userOverrides?: Record<string, unknown> }) {
  return <AuthContext.Provider value={makeAuthValue(userOverrides)}>{children}</AuthContext.Provider>;
}

describe('Phone Verification Flow', () => {
  test('enter phone -> receive code -> verify navigates to /auth/kyc', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/verify-phone']}>
          <Routes>
            <Route path="/auth/verify-phone" element={<PhoneVerificationPage />} />
            <Route path="/auth/kyc" element={<div>KYC Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    const phoneInput = await screen.findByLabelText(/phone number/i);
  await user.type(phoneInput, '+15555555555');
    await user.click(screen.getByRole('button', { name: /send code/i }));
  await waitFor(() => expect(startPhoneVerification).toHaveBeenCalledWith('+15555555555'));

    // After code step displayed
    const codeInput = await screen.findByLabelText(/code/i);
    await user.type(codeInput, '123456');
    await user.click(screen.getByRole('button', { name: /verify phone/i }));
    await waitFor(() => expect(verifyPhone).toHaveBeenCalledWith('+15555555555', '123456'));
    expect(await screen.findByText(/kyc page/i)).toBeInTheDocument();
  });

  test('resend triggers resendPhoneVerification', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/verify-phone']}>
          <Routes>
            <Route path="/auth/verify-phone" element={<PhoneVerificationPage />} />
            <Route path="/auth/kyc" element={<div>KYC Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    const phoneInput = await screen.findByLabelText(/phone number/i);
  await user.type(phoneInput, '+14444444444');
    await user.click(screen.getByRole('button', { name: /send code/i }));
  await waitFor(() => expect(startPhoneVerification).toHaveBeenCalledWith('+14444444444'));
    await user.click(screen.getByRole('button', { name: /resend code/i }));
    await waitFor(() => expect(resendPhoneVerification).toHaveBeenCalledWith('+14444444444'));
  });

  test('formats various US inputs to E.164 before sending', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/verify-phone']}>
          <Routes>
            <Route path="/auth/verify-phone" element={<PhoneVerificationPage />} />
            <Route path="/auth/kyc" element={<div>KYC Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    const phoneInput = await screen.findByLabelText(/phone number/i);
    await user.type(phoneInput, '(689) 224-3543');
    await user.click(screen.getByRole('button', { name: /send code/i }));
    await waitFor(() => expect(startPhoneVerification).toHaveBeenCalledWith('+16892243543'));
  });

  test('adds +1 for 10 digit unformatted input', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/verify-phone']}>
          <Routes>
            <Route path="/auth/verify-phone" element={<PhoneVerificationPage />} />
            <Route path="/auth/kyc" element={<div>KYC Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    const phoneInput = await screen.findByLabelText(/phone number/i);
    await user.type(phoneInput, '6892243543');
    await user.click(screen.getByRole('button', { name: /send code/i }));
    await waitFor(() => expect(startPhoneVerification).toHaveBeenCalledWith('+16892243543'));
  });

  test('VerificationGuard redirects to /auth/verify-phone when phone not verified', async () => {
    const LocationDisplay = () => { const loc = useLocation(); return <div data-testid="loc">{loc.pathname}</div>; };
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/kyc']}>
          <Routes>
            <Route element={<VerificationGuard />}> <Route path="/auth/kyc" element={<><div>KYC Page</div><LocationDisplay /></>} /> </Route>
      <Route path="/auth/verify-phone" element={<><PhoneVerificationPage /><LocationDisplay /></>} />
      <Route path="*" element={<LocationDisplay />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toBe('/auth/verify-phone'));
  });

  test('VerificationGuard allows access when phone verified', async () => {
    render(
      <Provider userOverrides={{ phoneVerified: true }}>
        <MemoryRouter initialEntries={['/auth/kyc']}>
          <Routes>
            <Route element={<VerificationGuard />}> <Route path="/auth/kyc" element={<div>KYC Page</div>} /> </Route>
            <Route path="/auth/verify-phone" element={<div>Phone Verification Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(await screen.findByText(/kyc page/i)).toBeInTheDocument();
  });
  test('dashed US input normalizes correctly', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/verify-phone']}>
          <Routes>
            <Route path="/auth/verify-phone" element={<PhoneVerificationPage />} />
            <Route path="/auth/kyc" element={<div>KYC Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    const phoneInput = await screen.findByLabelText(/phone number/i);
    await user.type(phoneInput, '689-224-3543');
    await user.click(screen.getByRole('button', { name: /send code/i }));
    await waitFor(() => expect(startPhoneVerification).toHaveBeenCalledWith('+16892243543'));
  });

  test('shows friendly message when phone already verified by another user', async () => {
    (startPhoneVerification as jest.Mock).mockRejectedValueOnce(new Error('Phone already verified by another user'));
    const user = userEvent.setup();
    render(
      <Provider>
        <MemoryRouter initialEntries={['/auth/verify-phone']}>
          <Routes>
            <Route path="/auth/verify-phone" element={<PhoneVerificationPage />} />
            <Route path="/auth/kyc" element={<div>KYC Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    const phoneInput = await screen.findByLabelText(/phone number/i);
    await user.type(phoneInput, '+16892243543');
    await user.click(screen.getByRole('button', { name: /send code/i }));
    await waitFor(() => screen.getByText(/already verified by another account/i));
    // Ensure we did not advance to code step
    expect(screen.queryByLabelText(/code/i)).not.toBeInTheDocument();
  });
});
