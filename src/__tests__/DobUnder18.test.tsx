import React from 'react'; void React;
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KycScreen from '../screens/auth/KycScreen';
import { AuthContext } from '../context/AuthContextBase';

(global as unknown as { importMetaEnv: Record<string,string> }).importMetaEnv = { VITE_KYC_WIZARD: 'true' };

function Provider({ children }: { children: React.ReactNode }) {
  const value = { user: { id: 1, name: 'Jane Tester', email: 'jane@example.com', emailVerified: true }, token: 't', hydrated: true } as unknown as Parameters<typeof AuthContext.Provider>[0]['value'];
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

describe('DOB under-18 validation', () => {
  test('blocks progression for under-18 DOB', async () => {
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
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.click(screen.getByRole('button', { name: /next/i }));
    const month = await screen.findByLabelText(/month/i, {}, { timeout: 1500 });
    const day = screen.getByLabelText(/day/i);
    const year = screen.getByLabelText(/year/i);
    const underYear = (new Date().getUTCFullYear() - 1).toString();
    await user.type(month, '01');
    await user.type(day, '01');
    await user.type(year, underYear);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getAllByText(/must be 18 or older/i).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('wizard-step-ssn')).not.toBeInTheDocument();
  }, 10000);
});
