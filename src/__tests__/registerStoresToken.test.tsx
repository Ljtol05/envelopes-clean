import React from 'react'; void React;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from '../context/AuthContext';
import * as authSvc from '../services/auth';
import RegisterScreen from '../screens/auth/RegisterScreen';

jest.mock('../services/auth');

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/auth/register"]}>
      <AuthProvider>
        <Routes>
          <Route path="/auth/register" element={<RegisterScreen />} />
          <Route path="/auth/verify-email" element={<div>Verify Email Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Register token persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
  });

  test('register stores token immediately (no fallback login)', async () => {
    (authSvc.register as jest.Mock).mockResolvedValue({ user: { id: '1', email: 'user@example.com' }, token: 'jwt-123' });
    renderRegister();
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123' } });
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  await waitFor(() => expect(localStorage.getItem('auth_token')).toBe('jwt-123'));
    expect(localStorage.getItem('token')).toBe('jwt-123'); // alias key
  expect(authSvc.login).not.toHaveBeenCalled();
  });
});
