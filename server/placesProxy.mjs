#!/usr/bin/env node
// Minimal Google Places proxy to keep API key server-side.
// Endpoints:
//   GET /places/autocomplete?q=QUERY&country=us&limit=5&sessiontoken=...  -> { suggestions: [...] }
//   GET /places/details/:id?sessiontoken=... -> { details: {...} }
// Env Vars: GOOGLE_PLACES_API_KEY (preferred) or VITE_GOOGLE_PLACES_API_KEY (fallback)
// Optional: PORT (default 5055)
// NOTE: This is a lightweight implementation (no external deps). For production
// consider adding rate limiting, auth, logging, and stricter error handling.

import { createServer } from 'node:http';
import { URL } from 'node:url';
// Node 18+ provides fetch / URLSearchParams globally; add minimal declarations for linters.
/* eslint-disable no-undef */

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error('[placesProxy] Missing GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const PORT = Number(process.env.PORT || 5055);
const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

// Tiny in-memory cache (time-based) to reduce duplicate calls during a session.
const cache = new Map(); // key -> { expires, data }
const TTL_MS = 2 * 60 * 1000; // 2 minutes

function remember(key, data) {
  cache.set(key, { expires: Date.now() + TTL_MS, data });
  if (cache.size > 200) { // basic pruning
    for (const [k,v] of cache) { if (v.expires < Date.now()) cache.delete(k); }
  }
  return data;
}
function recall(key) {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data;
  if (entry) cache.delete(key);
  return undefined;
}

async function handleAutocomplete(req, res, urlObj) {
  const q = urlObj.searchParams.get('q') || '';
  const country = urlObj.searchParams.get('country') || 'us';
  const limit = Number(urlObj.searchParams.get('limit') || '5');
  const sessiontoken = urlObj.searchParams.get('sessiontoken') || undefined;
  if (!q || q.trim().length < 3) return sendJson(res, 200, { suggestions: [] });
  const apiParams = new URLSearchParams({ input: q, key: API_KEY, types: 'address', components: `country:${country}` });
  if (sessiontoken) apiParams.set('sessiontoken', sessiontoken);
  const cacheKey = 'ac:' + apiParams.toString();
  const cached = recall(cacheKey);
  if (cached) return sendJson(res, 200, cached);
  try {
    const r = await fetch(`${AUTOCOMPLETE_URL}?${apiParams.toString()}`);
    if (!r.ok) return sendJson(res, r.status, { error: 'upstream_error' });
    const json = await r.json();
    const predictions = Array.isArray(json.predictions) ? json.predictions : [];
    const suggestions = predictions.slice(0, limit).map(p => ({
      id: p.place_id,
      description: p.description,
    }));
    return sendJson(res, 200, remember(cacheKey, { suggestions }));
  } catch {
    return sendJson(res, 500, { error: 'network_error' });
  }
}

async function handleDetails(req, res, placeId, urlObj) {
  if (!placeId) return sendJson(res, 400, { error: 'missing_id' });
  const sessiontoken = urlObj.searchParams.get('sessiontoken') || undefined;
  const apiParams = new URLSearchParams({ place_id: placeId, key: API_KEY, fields: 'address_component,formatted_address' });
  if (sessiontoken) apiParams.set('sessiontoken', sessiontoken);
  const cacheKey = 'det:' + apiParams.toString();
  const cached = recall(cacheKey);
  if (cached) return sendJson(res, 200, cached);
  try {
    const r = await fetch(`${DETAILS_URL}?${apiParams.toString()}`);
    if (!r.ok) return sendJson(res, r.status, { error: 'upstream_error' });
    const json = await r.json();
    return sendJson(res, 200, remember(cacheKey, { details: json.result || null }));
  } catch {
    return sendJson(res, 500, { error: 'network_error' });
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

createServer((req, res) => {
  if (!req.url) return sendJson(res, 404, { error: 'not_found' });
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'GET' && urlObj.pathname === '/places/autocomplete') return void handleAutocomplete(req, res, urlObj);
  const detMatch = urlObj.pathname.match(/^\/places\/details\/(.+)$/);
  if (req.method === 'GET' && detMatch) return void handleDetails(req, res, decodeURIComponent(detMatch[1]), urlObj);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    });
    return res.end();
  }
  return sendJson(res, 404, { error: 'not_found' });
}).listen(PORT, () => {
  console.log(`[placesProxy] listening on :${PORT}`);
});
