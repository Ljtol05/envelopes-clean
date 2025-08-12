import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './theme'
// Dev-only: validate presence of critical env vars to aid onboarding
if (import.meta.env.DEV) {
  const required = ['VITE_API_BASE_URL'] as const
  const missing = required.filter((k) => !import.meta.env[k])
  if (missing.length) {
    console.warn(
      `Missing env var(s): ${missing.join(', ')}. Copy .env.example to .env and fill them in.\n` +
      'The app will still run, but API calls may fail until configured.'
    )
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
