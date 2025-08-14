import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './theme'
// Dev-only: validate presence of critical env vars to aid onboarding
// Expose Vite meta env to modules that avoid direct import.meta (Jest compatibility)
// Assign for apiConfig runtime (Jest-friendly) without relying on import.meta in modules.
(globalThis as unknown as { __VITE_META_ENV: unknown }).__VITE_META_ENV = import.meta.env;

if (import.meta.env.DEV) {
  // Soft guidance: prefer VITE_API_URL now. Accept legacy VITE_API_BASE_URL.
  const haveAny = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (!haveAny) {
    console.warn('[env] Neither VITE_API_URL nor VITE_API_BASE_URL set. Using origin/fallback; remote API calls may fail.');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
