import React from 'react';
void React; // ensure React in scope
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
jest.mock('../lib/kyc', () => ({
  apiStartKyc: jest.fn(async (form: Record<string, unknown>) => ({ status: 'pending', providerRef: 'mock-ref', ...form })),
  apiGetKycStatus: jest.fn(async () => ({ status: 'not_started' })),
}));
import KycScreen from '../screens/auth/KycScreen';
import { apiGetKycStatus, apiStartKyc } from '../lib/kyc';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KycGuard from '../routes/KycGuard';
import VerifyEmailPage from '../screens/auth/VerifyEmailPage';
import { AuthContext } from '../context/AuthContextBase';
// Mock api module to avoid import.meta env usage in tests
jest.mock('../lib/api', () => ({
  apiVerifyEmail: jest.fn(async () => ({ ok: true })),
  apiResendVerification: jest.fn(async () => ({ ok: true })),
  // For other imports maybe used elsewhere
}));
import { apiVerifyEmail, apiResendVerification } from '../lib/api';

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
  let usingFakeTimers = false;
  beforeEach(() => {
    jest.useFakeTimers();
    usingFakeTimers = true;
  global.fetch = jest.fn();
  });

  test('email verification success navigates to /auth/kyc', async () => {
    jest.useRealTimers(); usingFakeTimers = false;
    (apiVerifyEmail as jest.Mock).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/auth/verify-email']}>
          <Routes>
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/kyc" element={<div>KYC Page</div>} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    const input = await screen.findByLabelText(/6-digit code/i);
    await user.type(input,'123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));
    expect(await screen.findByText(/kyc page/i)).toBeInTheDocument();
  });

  test('email verification failure shows error', async () => {
    jest.useRealTimers(); usingFakeTimers = false;
    (apiVerifyEmail as jest.Mock).mockRejectedValue(new Error('Bad code'));
    const user = userEvent.setup();
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/auth/verify-email']}>
          <Routes>
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    const input = await screen.findByLabelText(/6-digit code/i);
    await user.type(input,'123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));
    // toast error not directly in DOM; we can assert button re-enabled
    await waitFor(() => expect(screen.getByRole('button', { name: /verify code/i })).not.toBeDisabled());
  });

  test('resend code triggers API call', async () => {
    jest.useRealTimers(); usingFakeTimers = false;
    (apiResendVerification as jest.Mock).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/auth/verify-email']}>
          <Routes>
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    const resendBtn = await screen.findByRole('button', { name: /resend code/i });
    await user.click(resendBtn);
  expect(apiResendVerification).toHaveBeenCalled();
  });

  afterEach(() => {
    if (usingFakeTimers) {
      // Wrap pending timer flush in act to avoid React act warnings from navigation timeout
      act(() => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
    }
    jest.resetAllMocks();
  });

  function renderInApp(ui: React.ReactElement) {
    return render(<MockAuthProvider><MemoryRouter initialEntries={['/kyc']}>{ui}</MemoryRouter></MockAuthProvider>);
  }

  async function fillValidForm() {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
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

  test('successful pending -> approved flow', async () => {
  // apiGetKycStatus returns not_started on mount; after submission polling returns approved
  const sequence = ['not_started', 'pending', 'approved'];
  (apiGetKycStatus as jest.Mock).mockImplementation(async () => ({ status: sequence.shift() || 'approved' }));
  (apiStartKyc as jest.Mock).mockResolvedValue({ status: 'pending' });

  renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /><Route path="/home" element={<div>Home Screen</div>} /></Routes>);

    // Ensure form present
    expect(await screen.findByText(/identity verification/i)).toBeInTheDocument();
  const user = await fillValidForm();
  await user.click(screen.getByRole('button', { name: /submit for verification/i }));

    // Pending state appears
    expect(await screen.findByText(/being reviewed/i)).toBeInTheDocument();

    // Advance timers to trigger one poll (3000ms) + redirect delay (~200ms)
  // Need two poll cycles (pending then approved)
  await act(async () => { jest.advanceTimersByTime(6500); });

    // Expect we are no longer on the KYC screen (pending message gone) OR home content present
  await waitFor(() => expect(screen.queryByText(/being reviewed/i)).toBeNull());
  });

  test('rejected flow shows reason and allows resubmission', async () => {
    // Start -> rejected immediately
  (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
  // Make start return rejected
  (apiStartKyc as jest.Mock).mockResolvedValue({ status: 'rejected', reason: 'DOB under 18' });

    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);

  const user = await fillValidForm();
  await user.click(screen.getByRole('button', { name: /submit for verification/i }));

    expect(await screen.findByText(/couldn't verify/i)).toBeInTheDocument();
    expect(screen.getByText(/DOB under 18/)).toBeInTheDocument();

    // Click Try again -> should show form again
  await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByLabelText(/first name/i)).toBeInTheDocument();
  });

  test('shows error when initial status fetch fails', async () => {
    (apiGetKycStatus as jest.Mock).mockRejectedValue(new Error('network boom'));
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    // Error surfaced - generic message from hook
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
    const submitBtn = await screen.findByRole('button', { name: /submit for verification/i });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(submitBtn);
    // Collect all required messages
    const requiredErrors = await screen.findAllByText('Required');
    expect(requiredErrors.length).toBeGreaterThanOrEqual(4);
    const firstName = screen.getByLabelText(/first name/i);
    expect(firstName).toHaveAttribute('aria-invalid', 'true');
  });

  test('polling stops after terminal state', async () => {
    const seq = ['not_started', 'pending', 'approved'];
    (apiGetKycStatus as jest.Mock).mockImplementation(async () => ({ status: seq[0] }));
    (apiStartKyc as jest.Mock).mockImplementation(async () => ({ status: 'pending' }));
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /submit for verification/i }));
    // Move sequence forward manually on each fetch call after submission
    (apiGetKycStatus as jest.Mock).mockImplementation(async () => ({ status: seq.shift() || 'approved' }));
    // Advance two polls
    act(() => { jest.advanceTimersByTime(6500); });
    // Approved reached
    await waitFor(() => expect(apiGetKycStatus).toHaveBeenCalled());
    const callsAfterApproval = (apiGetKycStatus as jest.Mock).mock.calls.length;
    // Advance more time; no additional calls expected
    act(() => { jest.advanceTimersByTime(6000); });
    expect((apiGetKycStatus as jest.Mock).mock.calls.length).toBe(callsAfterApproval);
  });

  test('guard redirects non-approved user to /kyc', async () => {
    (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
    const ui = (
      <Routes>
        <Route element={<KycGuard />}> <Route path="/protected" element={<div>Protected Content</div>} /> </Route>
        <Route path="/kyc" element={<KycScreen />} />
      </Routes>
    );
    render(<MemoryRouter initialEntries={['/protected']}>{ui}</MemoryRouter>);
    // Wait for KYC screen after redirect
    expect(await screen.findByText(/identity verification/i)).toBeInTheDocument();
    expect(screen.queryByText(/protected content/i)).toBeNull();
  });

  test('pending persists across multiple polls without duplication', async () => {
    (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
    const statuses = ['pending','pending','pending'];
    (apiStartKyc as jest.Mock).mockResolvedValue({ status: 'pending' });
    (apiGetKycStatus as jest.Mock).mockImplementation(async () => ({ status: statuses.shift() ?? 'pending' }));
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /submit for verification/i }));
    expect(await screen.findByText(/being reviewed/i)).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(9000); }); // three poll intervals
    // Still pending
    expect(screen.getByText(/being reviewed/i)).toBeInTheDocument();
    // Ensure number of apiGetKycStatus calls ~ initial + 3 polls
    const pollCalls = (apiGetKycStatus as jest.Mock).mock.calls.length;
    expect(pollCalls).toBeGreaterThanOrEqual(3);
  });

  test('form data persists after failed submission', async () => {
    (apiGetKycStatus as jest.Mock).mockResolvedValue({ status: 'not_started' });
    (apiStartKyc as jest.Mock).mockRejectedValue(new Error('fail'));
    renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /></Routes>);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /submit for verification/i }));
    expect(await screen.findByText(/kyc submission failed/i)).toBeInTheDocument();
    // Values should remain in inputs
    expect((screen.getByLabelText(/first name/i) as HTMLInputElement).value).toBe('Jane');
    expect((screen.getByLabelText(/last name/i) as HTMLInputElement).value).toBe('Doe');
  });
});
