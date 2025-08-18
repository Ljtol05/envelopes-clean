import React from 'react'; void React;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ForgotPassword from '../screens/auth/ForgotPassword';
import * as authSvc from '../services/auth';

jest.mock('../services/auth');

function renderForgot(start: string = '/auth/forgot') {
  return render(
    <MemoryRouter initialEntries={[start]}>
      <Routes>
        <Route path="/auth/forgot" element={<ForgotPassword />} />
        <Route path="/auth/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Forgot/Reset Password Flow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('submits email then advances to reset step', async () => {
    (authSvc.forgotPassword as jest.Mock).mockResolvedValue({ message: 'If account exists we sent a code.' });
    renderForgot();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send code/i }));
    await screen.findByText(/6‑digit code/i);
    expect(authSvc.forgotPassword).toHaveBeenCalledWith('user@example.com');
  });

  test('password mismatch shows error and blocks API call', async () => {
    (authSvc.forgotPassword as jest.Mock).mockResolvedValue({ message: 'generic' });
    renderForgot();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send code/i }));
    await screen.findByText(/6‑digit code/i);
    fireEvent.change(screen.getByLabelText(/^code$/i), { target: { value: '123456' } });
  fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'Different123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(authSvc.resetPassword).not.toHaveBeenCalled();
  });

  test('successful reset goes to done step', async () => {
    (authSvc.forgotPassword as jest.Mock).mockResolvedValue({ message: 'generic' });
    (authSvc.resetPassword as jest.Mock).mockResolvedValue({ message: 'Password reset successfully.' });
    renderForgot();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send code/i }));
    await screen.findByText(/6‑digit code/i);
    fireEvent.change(screen.getByLabelText(/^code$/i), { target: { value: '123456' } });
  fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'Password123' } });
  fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
  await waitFor(() => expect(screen.getByRole('heading', { name: /^password reset$/i })).toBeInTheDocument());
    expect(authSvc.resetPassword).toHaveBeenCalledWith('user@example.com', '123456', 'Password123');
  });

  test('invalid code surfaces server error and stays on reset step', async () => {
    (authSvc.forgotPassword as jest.Mock).mockResolvedValue({ message: 'generic' });
    (authSvc.resetPassword as jest.Mock).mockRejectedValue({ response: { data: { message: 'Invalid code' } } });
    renderForgot();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send code/i }));
    await screen.findByText(/6‑digit code/i);
    fireEvent.change(screen.getByLabelText(/^code$/i), { target: { value: '654321' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByText(/invalid code/i)).toBeInTheDocument();
    // Ensure we did not advance to done step
    expect(screen.queryByRole('heading', { name: /^password reset$/i })).not.toBeInTheDocument();
    expect(authSvc.resetPassword).toHaveBeenCalled();
  });
});
