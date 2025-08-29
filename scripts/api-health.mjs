#!/usr/bin/env node
import { loadEnvLocal } from './util/load-dotenv.mjs';
loadEnvLocal();

// Small health check; prints status and first 200 chars.
const api = process.env.VITE_API_URL;
if (!api) {
  console.error('VITE_API_URL not set');
  process.exit(1);
}
(async () => {
  const res = await fetch(`${api}/healthz`);
  const txt = await res.text();
  console.log('STATUS', res.status);
  console.log(txt.slice(0, 200));
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
