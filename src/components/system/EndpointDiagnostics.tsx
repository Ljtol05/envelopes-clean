import { useEffect, useState } from 'react';
import { ENDPOINTS } from '../../config/endpoints';

interface Row { key: string; value: string; source?: string }

function safeEnv(): Record<string,string|undefined> {
  try { const meta = new Function('try { return import.meta; } catch { return undefined; }')();
    if (meta && typeof meta === 'object' && 'env' in (meta as Record<string,unknown>)) return (meta as { env: Record<string,string|undefined> }).env;
  } catch { /* ignore */ }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore process may not exist
  if (typeof process !== 'undefined' && process?.env) return process.env as Record<string,string|undefined>;
  return {};
}

function detectSource(envKey: string, value: string, env: Record<string,string|undefined>): string | undefined {
  if (env[envKey] && String(env[envKey]).trim() === value) return envKey;
  return undefined;
}

function camelToEnvSuffix(k: string): string { return k.replace(/[A-Z]/g, c => '_' + c).toUpperCase(); }

function buildRows(env: Record<string,string|undefined>): Row[] {
  const map: Record<string,string> = ENDPOINTS as unknown as Record<string,string>;
  return Object.entries(map).map(([k,v]) => ({ key: k, value: v, source: detectSource(`VITE_${camelToEnvSuffix(k)}_ENDPOINT`, v, env) }));
}

export default function EndpointDiagnostics() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    const env = safeEnv();
    setRows(buildRows(env));
    const n: string[] = [];
    if (env.VITE_AI_CHAT_ENDPOINT && !env.VITE_AI_COACH_ENDPOINT) n.push('Legacy VITE_AI_CHAT_ENDPOINT in use (prefer VITE_AI_COACH_ENDPOINT).');
    if (env.VITE_API_BASE_URL && !env.VITE_API_URL) n.push('Legacy VITE_API_BASE_URL in use (prefer VITE_API_URL).');
    setNotes(n);
  }, []);
  // Visibility: dev mode AND explicit opt-in flag. Keeps production bundles clean unless tree-shaken.
  const envAny = (import.meta as unknown as { env?: Record<string,string> }).env || {};
  const enabled = envAny.DEV && envAny.VITE_SHOW_ENDPOINT_DIAGNOSTICS === 'true';
  if (!enabled) return null;

  return (
    <div className="fixed bottom-2 left-2 z-[9999] font-mono text-[11px]">
      <button onClick={()=>setOpen(o=>!o)} className="bg-[color:var(--owl-surface)] border border-[color:var(--owl-border)] px-2 py-1 rounded text-[11px]">
        {open ? 'Endpoints ▲' : 'Endpoints ▼'}
      </button>
      {open && (
        <div className="mt-1 max-h-80 overflow-auto bg-[color:var(--owl-surface)] border border-[color:var(--owl-border)] p-2 rounded shadow-md">
          <div className="opacity-70 mb-1">Resolved endpoint paths (env source shown if overridden)</div>
          <table className="border-collapse">
            <thead><tr><th className="text-left pr-2">Key</th><th className="text-left pr-2">Path</th><th className="text-left">Env Source</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key}>
                  <td className="pr-2 align-top">{r.key}</td>
                  <td className="pr-2 align-top">{r.value}</td>
                  <td>{r.source || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {notes.length > 0 && (
            <div className="mt-2 text-[color:var(--owl-warning)]">
              {notes.map(n => <div key={n}>{n}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
