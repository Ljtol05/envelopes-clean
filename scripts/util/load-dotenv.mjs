import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnvLocal(names = ['VITE_API_URL', 'VITE_HEALTH_BASE_URL', 'VITE_API_TOKEN']) {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (names.includes(key) && !process.env[key] && val) {
      process.env[key] = val;
    }
  }
}
