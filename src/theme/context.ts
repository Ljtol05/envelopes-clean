import { createContext } from 'react';
import type { Theme } from './colors';

export type ThemeName = 'dark' | 'light';
export type ThemeCtx = {
  name: ThemeName;
  theme: Theme;
  setTheme: (name: ThemeName) => void;
  toggle: () => void;
} | null;

export const ThemeContext = createContext<ThemeCtx>(null);
