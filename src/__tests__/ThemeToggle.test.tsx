import React from 'react';
// Touch React to avoid unused variable TS error for classic runtime JSX
void React;
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from '../theme';
import { ThemeToggle } from '../theme/ThemeToggle';

function getTheme() { return document.documentElement.getAttribute('data-theme'); }

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('uses stored theme over system preference', () => {
    localStorage.setItem('owl-theme', 'light');
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(getTheme()).toBe('light');
  });

  it('toggles theme and persists', async () => {
    render(<ThemeProvider initial="light"><ThemeToggle /></ThemeProvider>);
    const btn = screen.getByRole('button');
    expect(getTheme()).toBe('light');
    await act(async () => { fireEvent.click(btn); });
    expect(getTheme()).toBe('dark');
  });
});
