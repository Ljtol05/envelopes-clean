import React from 'react';
void React;
import { render } from '@testing-library/react';
import { useTheme, getNavigationTheme } from '../theme/utils';
import { lightTheme, darkTheme } from '../theme/colors';
import { ThemeProvider } from '../theme';

describe('theme utils', () => {
  it('getNavigationTheme maps properties correctly', () => {
    const lightNav = getNavigationTheme('light', lightTheme);
    expect(lightNav.dark).toBe(false);
    expect(lightNav.colors.background).toBe(lightTheme.bg);
    const darkNav = getNavigationTheme('dark', darkTheme);
    expect(darkNav.dark).toBe(true);
    expect(darkNav.colors.text).toBe(darkTheme.textPrimary);
  });

  it('useTheme throws outside provider', () => {
    function Bad() { useTheme(); return null; }
    expect(() => render(<Bad />)).toThrow('useTheme must be used within ThemeProvider');
  });

  it('useTheme works inside provider', () => {
    function Good() { useTheme(); return <div>ok</div>; }
    const { getByText } = render(<ThemeProvider initial="light"><Good /></ThemeProvider>);
    expect(getByText('ok')).toBeInTheDocument();
  });
});
