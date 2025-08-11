// src/theme/index.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { darkTheme, lightTheme, type Theme } from './colors';
import { ThemeContext, type ThemeName } from './context';

// context moved to separate file for fast refresh friendliness

const STORAGE_KEY = 'owl-theme';

function applyWebCssVariables(name: ThemeName, theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', name);
  const vars: Record<string, string> = {
    '--owl-bg': theme.bg,
    '--owl-surface': theme.surface,
    '--owl-surface-alt': theme.surfaceAlt,
    '--owl-text-primary': theme.textPrimary,
    '--owl-text-secondary': theme.textSecondary,
    '--owl-border': theme.border,
    '--owl-accent': theme.accent,
  '--owl-accent-fg': theme.accentFg,
    '--owl-accent-hover': theme.accentHover,
    '--owl-success': theme.success,
    '--owl-warning': theme.warning,
    '--owl-error': theme.error,
    '--owl-focus-ring': theme.focusRing
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}

export const ThemeProvider: React.FC<React.PropsWithChildren<{ initial?: ThemeName }>> = ({ initial = 'dark', children }) => {
  // Initialize from localStorage synchronously (web) else fallback to system or provided initial.
  const initialName: ThemeName = (() => {
    if (typeof window === 'undefined') return initial;
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (stored === 'light' || stored === 'dark') return stored;
    // system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  })();

  const [name, setName] = useState<ThemeName>(initialName);

  // Listen for system changes only if user has not explicitly chosen a theme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (stored === 'light' || stored === 'dark') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setName(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Persist & broadcast changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      /* ignore write errors */
    }
  }, [name]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setName(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const theme = useMemo<Theme>(() => (name === 'dark' ? darkTheme : lightTheme), [name]);

  useEffect(() => applyWebCssVariables(name, theme), [name, theme]);

  const value = {
    name,
    theme,
    setTheme: setName,
    toggle: () => setName(n => (n === 'dark' ? 'light' : 'dark'))
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Hooks & helpers live in utils.ts (no re-export to satisfy fast refresh rule)
