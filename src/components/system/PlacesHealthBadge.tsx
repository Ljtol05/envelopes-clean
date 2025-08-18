import React from 'react';

function getProxyBase(): string | undefined {
  const viteEnv = (typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string,string> }).env : undefined);
  return viteEnv?.VITE_PLACES_PROXY_BASE || (globalThis as unknown as { importMetaEnv?: Record<string,string> }).importMetaEnv?.VITE_PLACES_PROXY_BASE;
}

export default function PlacesHealthBadge() {
  const base = getProxyBase();
  const [status, setStatus] = React.useState<'idle'|'ok'|'fail'>('idle');
  React.useEffect(() => {
    if (!base) return; // nothing to show
    let cancelled = false;
  async function ping() {
      try {
    if (!base) return; // type guard
    const res = await fetch(base.replace(/\/$/, '') + '/health', { cache: 'no-store' });
        if (!cancelled) setStatus(res.ok ? 'ok' : 'fail');
      } catch { if (!cancelled) setStatus('fail'); }
    }
    ping();
    const id = setInterval(ping, 60000); // refresh every 60s
    return () => { cancelled = true; clearInterval(id); };
  }, [base]);
  if (!base) return null;
  const color = status === 'ok' ? 'bg-[color:var(--owl-success)]' : status === 'fail' ? 'bg-[color:var(--owl-error)]' : 'bg-[color:var(--owl-border)]';
  const label = status === 'ok' ? 'Places OK' : status === 'fail' ? 'Places Down' : 'Places…';
  return (
    <div className="fixed bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md border border-[color:var(--owl-border)] bg-[color:var(--owl-surface)] shadow-[var(--owl-shadow-md)] text-[10px] font-medium select-none" aria-live="polite">
      <span className={`inline-block w-2 h-2 rounded-full ${color}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
