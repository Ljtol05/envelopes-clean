import React from 'react';
void React; // ensure React in scope
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
jest.mock('../lib/kyc', () => ({
  apiStartKyc: jest.fn(async (form: Record<string, unknown>) => ({ status: 'pending', providerRef: 'mock-ref', ...form })),
  apiGetKycStatus: jest.fn(async () => ({ status: 'not_started' })),
}));
import KycScreen from '../screens/auth/KycScreen';
import { apiGetKycStatus, apiStartKyc } from '../lib/kyc';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KycGuard from '../routes/KycGuard';
// Provide minimal env polyfill for components reading import.meta.env
(global as unknown as { importMetaEnv?: Record<string,string> }).importMetaEnv = { VITE_REQUIRE_PHONE_VERIFICATION: 'false' }; // explicit disable for tests
// Force PHONE_VERIFICATION_REQUIRED to false for these tests (they assert direct navigation to /auth/kyc)
jest.mock('../lib/onboarding', () => ({ PHONE_VERIFICATION_REQUIRED: false }));
import VerifyEmailPage from '../screens/auth/VerifyEmailPage';
import { AuthContext } from '../context/AuthContextBase';
// Mock new auth service module used by VerifyEmailPage
jest.mock('../services/auth', () => ({
  // Updated verifyEmail signature (email, code)
  verifyEmail: jest.fn(async () => ({ ok: true })),
  resendVerification: jest.fn(async () => ({ ok: true })),
}));
import { verifyEmail, resendVerification } from '../services/auth';

// Utility to mock fetch sequences
// (No network fetch needed because API layer is mocked)

// Simple mock auth provider to satisfy useAuth in email verification page without invoking real API/env
type MockUser = { id: number; name: string; email: string; emailVerified: boolean };
function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const value = {
    user: { id: 1, name: 'Tester', email: 'test@example.com', emailVerified: false } as MockUser,
    token: 'mock-token',
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    hydrated: true,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

describe('KYC Flow', () => {
  jest.setTimeout(15000);
  beforeEach(() => { jest.resetAllMocks(); });
  afterEach(() => { jest.resetAllMocks(); });

  function renderInApp(ui: React.ReactElement, initial: string = '/kyc') {
    return render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={[initial]}>{ui}</MemoryRouter>
      </MockAuthProvider>
    );
  }

  async function fillValidForm() {
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');
    await user.type(screen.getByLabelText(/ssn \(last 4\)/i), '1234');
    await user.type(screen.getByLabelText(/address line 1/i), '123 Main');
    await user.type(screen.getByLabelText(/address line 2/i), 'Apt 5');
    await user.type(screen.getByLabelText(/^city$/i), 'Atlanta');
    await user.type(screen.getByLabelText(/^state$/i), 'GA');
    await user.type(screen.getByLabelText(/zip code/i), '30301');
    return user;
  }

  // Email verification tests
  test('email verification success navigates to /auth/kyc', async () => {
    jest.useRealTimers();
    (verifyEmail as jest.Mock).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderInApp(<Routes><Route path="/auth/verify-email" element={<VerifyEmailPage />} /><Route path="/auth/kyc" element={<div>KYC Page</div>} /></Routes>, '/auth/verify-email');
    const code = await screen.findByLabelText(/6-digit code/i);
    await user.type(code, '123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));
    expect(await screen.findByText(/kyc page/i)).toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledWith('test@example.com', '123456');
  });

  test('email verification failure shows error', async () => {
    jest.useRealTimers();
    (verifyEmail as jest.Mock).mockRejectedValue(new Error('Bad code'));
    const user = userEvent.setup();
    renderInApp(<Routes><Route path="/auth/verify-email" element={<VerifyEmailPage />} /></Routes>, '/auth/verify-email');
    const input = await screen.findByLabelText(/6-digit code/i);
    await user.type(input, '123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /verify code/i })).not.toBeDisabled());
  });

  test('resend code triggers API call', async () => {
    jest.useRealTimers();
    const user = userEvent.setup();
    renderInApp(<Routes><Route path="/auth/verify-email" element={<VerifyEmailPage />} /></Routes>, '/auth/verify-email');
    const resendBtn = await screen.findByRole('button', { name: /resend code/i });
    await user.click(resendBtn);
    expect(resendVerification).toHaveBeenCalled();
  });

  test('email edit updates payload for verification', async () => {
    jest.useRealTimers();
    const user = userEvent.setup();
    renderInApp(<Routes><Route path="/auth/verify-email" element={<VerifyEmailPage />} /><Route path="/auth/kyc" element={<div>KYC Page</div>} /></Routes>, '/auth/verify-email');
    await user.click(await screen.findByRole('button', { name: /edit/i }));
    const emailInput = await screen.findByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');
    await user.type(screen.getByLabelText(/6-digit code/i), '654321');
    await user.click(screen.getByRole('button', { name: /verify code/i }));
    expect(verifyEmail).toHaveBeenCalledWith('new@example.com', '654321');
  });

  test('email edit updates payload for resend', async () => {
    jest.useRealTimers();
    const user = userEvent.setup();
    renderInApp(<Routes><Route path="/auth/verify-email" element={<VerifyEmailPage />} /></Routes>, '/auth/verify-email');
    await user.click(await screen.findByRole('button', { name: /edit/i }));
    const emailInput = await screen.findByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'resend@example.com');
    await user.click(screen.getByRole('button', { name: /resend code/i }));
    expect(resendVerification).toHaveBeenCalledWith('resend@example.com');
  });

  // KYC flows
  test('successful pending -> approved flow', async () => {
    const sequence = ['not_started', 'pending', 'approved'];
    (apiGetKycStatus as jest.Mock).mockImplementation(async () => ({ status: sequence.shift() || 'approved' }));
    (apiStartKyc as jest.Mock).mockResolvedValue({ status: 'pending' });
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /><Route path="/home" element={<div>Home Screen</div>} /></Routes>);
    expect(await screen.findByText(/identity verification/i)).toBeInTheDocument();
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /submit for verification/i }));
    expect(await screen.findByText(/being reviewed/i)).toBeInTheDocument();
    // Manual poll (pending -> approved)
    await user.click(screen.getByRole('button', { name: /poll now/i }));
    await user.click(screen.getByRole('button', { name: /poll now/i }));
    await waitFor(() => expect(screen.queryByText(/being reviewed/i)).toBeNull());
  });

  test('rejected flow shows reason and allows resubmission', async () => {
    (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
    (apiStartKyc as jest.Mock).mockResolvedValue({ status: 'rejected', reason: 'DOB under 18' });
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /submit for verification/i }));
    expect(await screen.findByText(/couldn't verify/i)).toBeInTheDocument();
    expect(screen.getByText(/DOB under 18/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByLabelText(/first name/i)).toBeInTheDocument();
  });

  test('shows error when initial status fetch fails', async () => {
    (apiGetKycStatus as jest.Mock).mockRejectedValue(new Error('network boom'));
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    expect(await screen.findByText(/failed to fetch kyc status/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit for verification/i })).toBeInTheDocument();
  });

  test('shows submission error when startKyc fails', async () => {
    (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
    (apiStartKyc as jest.Mock).mockRejectedValue(new Error('submit failed'));
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /submit for verification/i }));
    expect(await screen.findByText(/kyc submission failed/i)).toBeInTheDocument();
  });

  test('field-level validation errors block submission and focus first invalid', async () => {
    (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /submit for verification/i }));
    const requiredErrors = await screen.findAllByText('Required');
    expect(requiredErrors.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute('aria-invalid', 'true');
  });

  test('manual polling stops after terminal state', async () => {
  // After submission we enter pending immediately; next manual poll returns approved
  (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
  (apiStartKyc as jest.Mock).mockResolvedValue({ status: 'pending' });
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /submit for verification/i }));
  expect(await screen.findByText(/being reviewed/i)).toBeInTheDocument();
  (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'approved' });
  await user.click(screen.getByRole('button', { name: /poll now/i }));
  await waitFor(() => expect(screen.queryByText(/being reviewed/i)).toBeNull());
    const callsAfter = (apiGetKycStatus as jest.Mock).mock.calls.length;
    await new Promise(r => setTimeout(r, 5));
    expect((apiGetKycStatus as jest.Mock).mock.calls.length).toBe(callsAfter);
  });

  test('guard redirects non-approved user to /kyc', async () => {
    (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
    renderInApp(
      <Routes>
        <Route element={<KycGuard />}> <Route path="/protected" element={<div>Protected Content</div>} /> </Route>
        <Route path="/kyc" element={<KycScreen />} />
      </Routes>, '/protected'
    );
    expect(await screen.findByText(/identity verification/i)).toBeInTheDocument();
    expect(screen.queryByText(/protected content/i)).toBeNull();
  });

  test('pending persists across manual polls', async () => {
    (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
    const statuses = ['pending', 'pending', 'pending'];
    (apiStartKyc as jest.Mock).mockResolvedValue({ status: 'pending' });
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /submit for verification/i }));
    // Switch implementation only after form submission to start pending loop
    (apiGetKycStatus as jest.Mock).mockImplementation(async () => ({ status: statuses.shift() ?? 'pending' }));
    await user.click(await screen.findByRole('button', { name: /poll now/i }));
    expect(screen.getByText(/being reviewed/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /poll now/i }));
    await user.click(screen.getByRole('button', { name: /poll now/i }));
    expect(screen.getByText(/being reviewed/i)).toBeInTheDocument();
    expect((apiGetKycStatus as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  test('form data persists after failed submission', async () => {
    (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
    (apiStartKyc as jest.Mock).mockRejectedValue(new Error('fail'));
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /submit for verification/i }));
    expect(await screen.findByText(/kyc submission failed/i)).toBeInTheDocument();
    expect((screen.getByLabelText(/first name/i) as HTMLInputElement).value).toBe('Jane');
    expect((screen.getByLabelText(/last name/i) as HTMLInputElement).value).toBe('Doe');
  });
});
