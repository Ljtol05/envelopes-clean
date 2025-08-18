/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KycScreen from '../screens/auth/KycScreen';
import { AuthContext } from '../context/AuthContextBase';

// Helper to set wizard flag
function enableWizard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).importMetaEnv = { VITE_KYC_WIZARD: 'true' };
}

function renderWithAuth(ui: React.ReactElement) {
  enableWizard();
  return render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <AuthContext.Provider value={{ user: { emailVerified: true }, token: 'x', setUser: ()=>{}, logout: ()=>{} } as any}>
      <MemoryRouter initialEntries={['/kyc']}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('KYC Wizard motion preference', () => {
  test('wizard step completed circle scales when motion allowed', () => {
    // no reduced motion (default matchMedia false)
    renderWithAuth(<KycScreen />);
    // Move to second step by simulating valid first step entries
    const firstName = screen.getByLabelText(/first name/i);
    const lastName = screen.getByLabelText(/last name/i);
    (firstName as HTMLInputElement).value = 'A';
    (lastName as HTMLInputElement).value = 'B';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    lastName.dispatchEvent(new Event('input', { bubbles: true }));
    screen.getByRole('button', { name: /next/i }).click();
    // After advancing, first circle should have scale-110 class (animation) when motion allowed
    const firstCircle = screen.getAllByText(/1|✓/)[0];
    expect(firstCircle.className).toContain('scale-110');
  });

  test('wizard step does not scale when reduced motion', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (q: string) => ({
        matches: q.includes('prefers-reduced-motion') ? true : false,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    renderWithAuth(<KycScreen />);
    const firstName = screen.getByLabelText(/first name/i);
    const lastName = screen.getByLabelText(/last name/i);
    (firstName as HTMLInputElement).value = 'A';
    (lastName as HTMLInputElement).value = 'B';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    lastName.dispatchEvent(new Event('input', { bubbles: true }));
    screen.getByRole('button', { name: /next/i }).click();
    const firstCircle = screen.getAllByText(/1|✓/)[0];
    expect(firstCircle.className).not.toContain('scale-110');
  });
});
