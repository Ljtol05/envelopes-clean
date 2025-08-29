#!/usr/bin/env node
import { loadEnvLocal } from './util/load-dotenv.mjs';
loadEnvLocal();

// Small envelopes check; prints status and first 300 chars.
const api = process.env.VITE_API_URL;
const token = process.env.VITE_API_TOKEN;
if (!api) {
  console.error('VITE_API_URL not set');
  process.exit(1);
}
if (!token) {
  console.error('VITE_API_TOKEN not set');
  process.exit(1);
}
(async () => {
  const res = await fetch(`${api}/api/ai/mcp/envelopes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const txt = await res.text();
  console.log('STATUS', res.status);
  console.log(txt.slice(0, 300));
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
