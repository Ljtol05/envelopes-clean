import { useEffect, useState } from 'react';
import { API_BASE_URL, getApiBase, setApiBase } from '../../config/api';

// Dev-only banner when falling back to inferred or default API base.
export function ApiBaseBanner() {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (import.meta.env.PROD) return; // only in development builds
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const configured = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
    // Detect persisted runtime override
    let persisted: string | null = null;
    try { persisted = localStorage.getItem('api_base_url_override'); } catch { /* ignore */ }
    const active = getApiBase();
    if (persisted && active === persisted) {
      setMsg(`Runtime API override active → ${active} (query/localStorage). Clear to revert to env var.`);
      setShow(true);
      return;
    }
    if (!configured) {
      if (API_BASE_URL === origin) {
        setMsg(`API base auto-resolved to page origin (${API_BASE_URL}). Set VITE_API_URL to target a remote backend.`);
        setShow(true);
      } else if (/localhost:5000/.test(API_BASE_URL)) {
        setMsg(`API base using default dev fallback (${API_BASE_URL}). Set VITE_API_URL for remote backend or use DevApiSwitcher.`);
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] px-3 py-2 text-xs bg-[color:var(--owl-surface-alt,#222)] text-[color:var(--owl-text-secondary,#bbb)] border-t border-[color:var(--owl-border,#444)] flex flex-wrap gap-3 items-center">
      <span className="grow min-w-[200px]">{msg}</span>
      <div className="flex gap-2 items-center">
        <button onClick={() => setShow(false)} className="text-[color:var(--owl-accent,#6cf)] hover:underline">Dismiss</button>
        <button
          onClick={() => {
            try { localStorage.removeItem('api_base_url_override'); } catch {/* */}
            // Reset to env (recompute by reloading simplest)
            setApiBase(API_BASE_URL, { persist: false });
            window.location.reload();
          }}
          className="text-[color:var(--owl-accent,#6cf)] hover:underline"
        >Clear Override</button>
      </div>
    </div>
  );
}

export default ApiBaseBanner;
