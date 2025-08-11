// Owllocate color scales & semantic tokens
// ---------------------------------------------------------------------------
// Scales follow 900 (darkest) -> 50 (lightest)

export const colors = {
  navy: {
    900: '#0B1423', 800: '#0E1A2B', 700: '#122239', 600: '#19304C',
    500: '#203D60', 400: '#2B527F', 300: '#3A6AA3', 200: '#5B87BD',
    100: '#90AFD5', 50: '#C7D7EA'
  },
  teal: {
    900: '#1D6F69', 800: '#228E86', 700: '#2AB3A9', 600: '#37C7BC',
    500: '#45D0C7', 400: '#68DCD4', 300: '#8EEAE1', 200: '#B6F3EC',
    100: '#D8FBF7', 50: '#EDFFFD'
  },
  gray: {
    900: '#0F1115', 800: '#1B1F2A', 700: '#2C3444', 600: '#3F4A5F',
    500: '#5A6B84', 400: '#7E8FA5', 300: '#A9B5C3', 200: '#CAD2DB',
    100: '#E3E8EE', 50: '#F5F7FA'
  }
};

// Semantic Theme tokens
export interface Theme {
  bg: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentFg: string; // NEW - foreground color for text/icons placed on accent background (light theme mainly)
  accentHover: string;
  success: string;
  warning: string;
  error: string;
  focusRing: string;
}

export const darkTheme: Theme = {
  bg: colors.navy[800],
  surface: colors.navy[700],
  surfaceAlt: colors.navy[600],
  textPrimary: '#FFFFFF',
  textSecondary: colors.gray[300],
  border: colors.navy[600],
  accent: colors.teal[500],
  accentFg: '#FFFFFF',
  accentHover: colors.teal[300],
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  focusRing: colors.teal[400]
};

export const lightTheme: Theme = {
  bg: '#FFFFFF',
  surface: colors.gray[50],
  surfaceAlt: '#FFFFFF',
  textPrimary: colors.navy[800],
  textSecondary: colors.gray[600],
  border: colors.gray[200],
  accent: colors.teal[500], // updated per spec (teal500 #45D0C7)
  accentFg: colors.navy[900], // #0B1423
  accentHover: colors.teal[600],
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  focusRing: colors.teal[800] // teal800 #228E86 for >=3:1 contrast
};

export type { Theme as OwllocateTheme };
