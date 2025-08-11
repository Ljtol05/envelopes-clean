import { useContext } from 'react';
import type { Theme } from './colors';
import { ThemeContext } from './context';
import type { ThemeName } from './context';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx as {
    name: ThemeName;
    theme: Theme;
    setTheme: (n: ThemeName) => void;
    toggle: () => void;
  };
}

export function getNavigationTheme(name: ThemeName, t: Theme) {
  return {
    dark: name === 'dark',
    colors: {
      primary: t.accent,
      background: t.bg,
      card: t.surface,
      text: t.textPrimary,
      border: t.border,
      notification: t.accent
    }
  };
}
