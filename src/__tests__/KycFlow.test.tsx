import React from 'react';
void React; // silence unused React for JSX transform where not auto
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
jest.mock('../lib/kyc', () => ({
  apiStartKyc: jest.fn(async (form: Record<string, unknown>) => ({ status: 'pending', providerRef: 'mock-ref', ...form })),
  apiGetKycStatus: jest.fn(async () => ({ status: 'not_started' })),
}));
import KycScreen from '../screens/auth/KycScreen';
import { apiGetKycStatus, apiStartKyc } from '../lib/kyc';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Utility to mock fetch sequences
// (No network fetch needed because API layer is mocked)

describe('KYC Flow', () => {
  jest.setTimeout(15000);
  beforeEach(() => {
    jest.useFakeTimers();
  global.fetch = jest.fn();
  });

  afterEach(() => {
    // Wrap pending timer flush in act to avoid React act warnings from navigation timeout
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  function renderInApp(ui: React.ReactElement) {
    return render(<MemoryRouter initialEntries={['/kyc']}>{ui}</MemoryRouter>);
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

  renderInApp(<Routes><Route path="/kyc" element={<KycScreen />} /><Route path="/" element={<div>Home Screen</div>} /></Routes>);

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
});
