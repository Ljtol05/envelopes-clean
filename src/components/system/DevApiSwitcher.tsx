import { useEffect, useState } from 'react';
import { API_BASE_URL, setApiBase, testApiHealth, getApiBase } from '../../config/api';

// Dev-only floating panel to view/change API base (for dynamic Replit URLs)
export function DevApiSwitcher() {
  const isProd = import.meta.env.PROD;
  const [current, setCurrent] = useState(getApiBase());
  const [input, setInput] = useState(getApiBase());
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (isProd) return; // still mount but no effect
    try { setSaved(localStorage.getItem('api_base_url_override')); } catch { /* ignore */ }
  }, [isProd]);

  if (isProd) return null; // after hooks so order is stable

  async function apply(persist: boolean) {
    const base = input.trim();
    if (!base) return;
    setChecking(true); setStatus('');
    const ok = await testApiHealth(base);
    if (!ok) {
      setStatus('Health check failed');
      setChecking(false);
      return;
    }
    setApiBase(base, { persist });
    setCurrent(base); setChecking(false); setStatus('Active');
    try { if (persist) localStorage.setItem('api_base_url_override', base); } catch { /* ignore */ }
  }

  function clearOverride() {
    try { localStorage.removeItem('api_base_url_override'); } catch { /* */ }
    setStatus('Override cleared (reload)');
  }

  return (
    <div className="fixed top-2 right-2 z-[1100] text-[10px] font-mono">
      <details className="[&_summary]:cursor-pointer">
        <summary>API: {current}</summary>
        <div className="mt-1 w-[340px] space-y-2 rounded-md border border-[color:var(--owl-border,#444)] bg-[color:var(--owl-surface,#222)] p-2 text-[color:var(--owl-text-secondary,#ccc)]">
          <label className="block text-[11px]">Set Base URL</label>
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="https://<replit>.dev/api" className="w-full rounded border border-[color:var(--owl-border,#555)] bg-[color:var(--owl-field-bg,#111)] p-1 text-[11px] text-[color:var(--owl-text-primary,#eee)]" />
          <div className="flex gap-2 text-[11px]">
            <button disabled={checking} onClick={()=>apply(false)} className="flex-1 rounded bg-[color:var(--owl-accent,#3576f6)] px-1 py-1 text-white disabled:opacity-50">Test + Use</button>
            <button disabled={checking} onClick={()=>apply(true)} className="flex-1 rounded bg-[color:var(--owl-accent,#555)] px-1 py-1 text-white disabled:opacity-50">Persist</button>
          </div>
          {saved && <div className="opacity-70 text-[10px]">Saved override: {saved}</div>}
          <div className="flex gap-2 text-[11px]">
            <button onClick={clearOverride} className="flex-1 rounded border border-[color:var(--owl-border,#555)] px-1 py-1">Clear</button>
            <button onClick={()=>setInput(API_BASE_URL)} className="flex-1 rounded border border-[color:var(--owl-border,#555)] px-1 py-1">Reset</button>
          </div>
          {checking && <div className="text-[10px]">Checking…</div>}
          {status && !checking && <div className="text-[10px]">{status}</div>}
          <div className="pt-1 text-[10px] leading-tight">
            <strong>Hint:</strong> use ?api=&lt;base&gt; or window.__setApiBase('url'). Dev only.
          </div>
        </div>
      </details>
    </div>
  );
}

export default DevApiSwitcher;
