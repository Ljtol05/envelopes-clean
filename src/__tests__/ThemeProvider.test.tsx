import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '../theme';
import { useTheme } from '../theme/utils';

function Consumer() {
  const { name, toggle } = useTheme();
  return (
    <div>
      <span data-testid="theme-name">{name}</span>
      <button onClick={toggle}>toggle</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  it('toggles theme value', () => {
  // ensure React symbol referenced for classic runtime
  expect(React).toBeDefined();
    render(<ThemeProvider initial="dark"><Consumer /></ThemeProvider>);
    const span = screen.getByTestId('theme-name');
    const first = span.textContent;
    act(() => { screen.getByText('toggle').click(); });
    expect(screen.getByTestId('theme-name').textContent).not.toBe(first);
  });
});
