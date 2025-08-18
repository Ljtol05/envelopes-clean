import React from 'react'; void React;
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KycScreen from '../screens/auth/KycScreen';
import { AuthContext } from '../context/AuthContextBase';

// Enable wizard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).importMetaEnv = { VITE_KYC_WIZARD: 'true' };

function Provider({ children }: { children: React.ReactNode }) {
  // Minimal auth context stub
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = { user: { id: 1, name: 'Jane Tester', email: 'jane@example.com', emailVerified: true }, token: 't', hydrated: true } as any;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

describe('DOB segmented inputs', () => {
  test('composes YYYY-MM-DD when all segments filled and advances', async () => {
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
    const month = await screen.findByLabelText(/month/i);
    const day = screen.getByLabelText(/day/i);
    const year = screen.getByLabelText(/year/i);
    await user.type(month, '01');
    await user.type(day, '02');
    await user.type(year, '1990');
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByLabelText(/ssn/i)).toBeInTheDocument();
  });
});
