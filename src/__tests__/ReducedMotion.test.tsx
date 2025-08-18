/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthProgress from '../components/auth/AuthProgress';
import { AuthContext } from '../context/AuthContextBase';

// Mock matchMedia to simulate prefers-reduced-motion: reduce
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? true : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

function wrap(ui: React.ReactElement) {
  const ctx = { user: { id: 1, email: 'u@example.com', emailVerified: true, phoneVerified: true }, token: 'x', login: jest.fn(), register: jest.fn(), logout: jest.fn(), hydrated: true, applyAuth: jest.fn() } as unknown as React.ContextType<typeof AuthContext>;
  return render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter initialEntries={['/verify-phone']}>
        {ui}
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Reduced motion', () => {
  test('AuthProgress does not apply scale animation class when reduced motion', () => {
    wrap(<AuthProgress />);
    const stepElems = screen.getAllByText(/1|2|3|✓/);
    stepElems.forEach(el => {
      expect(el.className).not.toContain('scale-110');
    });
  });
  test('AuthProgress includes scale animation class when motion allowed', () => {
    // Remock matchMedia to report no-preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion') ? false : false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    wrap(<AuthProgress />);
    const anyScale = screen.getAllByText(/1|2|3|✓/).some(el => el.className.includes('scale-110'));
    expect(anyScale).toBe(true);
  });
});
