/**
 * Google Places Autocomplete helper (minimal) for address line 1 suggestions.
 *
 * Design goals:
 * - No external SDK script tag (pure fetch) keeping bundle lean.
 * - Graceful degradation when the key is absent or request fails (returns []).
 * - Light parsing to extract city/state/ZIP for prefill convenience; this is
 *   heuristic and can be replaced with a Place Details request for accuracy.
 */

export interface AddressSuggestion {
  id: string; // place_id
  description: string; // full suggestion text
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface PlaceDetailsResult {
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  formattedAddress?: string;
}

const API_BASE = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_BASE = 'https://maps.googleapis.com/maps/api/place/details/json';

// A single session token improves billing grouping & relevance. Resettable.
let sessionToken: string | null = null;
export function getPlacesSessionToken(): string {
  if (!sessionToken) {
    const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
    const rnd = g.crypto && typeof g.crypto.randomUUID === 'function'
      ? g.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    sessionToken = rnd || Math.random().toString(36).slice(2);
  }
  return sessionToken as string;
}
export function resetPlacesSessionToken() { sessionToken = null; }

function getProxyBase(): string | undefined {
  const viteEnv = (typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string,string> }).env : undefined);
  return viteEnv?.VITE_PLACES_PROXY_BASE || (globalThis as unknown as { importMetaEnv?: Record<string,string> }).importMetaEnv?.VITE_PLACES_PROXY_BASE;
}

function getApiKey(): string | undefined {
  // Vite runtime: import.meta.env; tests polyfill global.importMetaEnv
  const viteEnv = (typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string,string> }).env : undefined);
  return viteEnv?.VITE_GOOGLE_PLACES_API_KEY || (globalThis as unknown as { importMetaEnv?: Record<string,string> }).importMetaEnv?.VITE_GOOGLE_PLACES_API_KEY;
}

export interface FetchSuggestionsOptions {
  country?: string; // Restrict to a country (e.g. 'us')
  limit?: number;   // Max number to return
  signal?: AbortSignal;
}

// Simple in-session caches (LRU not necessary for small usage)
const suggestionCache = new Map<string, AddressSuggestion[]>();
const detailsCache = new Map<string, PlaceDetailsResult>();
const MAX_ENTRIES = 50;
function setCache<K,V>(map: Map<K,V>, key: K, val: V) {
  if (map.size >= MAX_ENTRIES) { // delete oldest entry
    const first = map.keys().next(); if (!first.done) map.delete(first.value);
  }
  map.set(key,val);
}

export async function fetchAddressSuggestions(query: string, opts: FetchSuggestionsOptions = {}): Promise<AddressSuggestion[]> {
  const proxyBase = getProxyBase();
  const key = getApiKey();
  if ((!key && !proxyBase) || !query || query.trim().length < 3) return [];
  const { country = 'us', limit = 5, signal } = opts;
  const normalizedQ = `${country}:${query.trim().toLowerCase()}`;
  if (suggestionCache.has(normalizedQ)) return suggestionCache.get(normalizedQ)!;
  let mapped: AddressSuggestion[] = [];
  if (proxyBase) {
    const proxUrl = `${proxyBase.replace(/\/$/, '')}/places/autocomplete?` + new URLSearchParams({ q: query.trim(), country, limit: String(limit), sessiontoken: getPlacesSessionToken() }).toString();
    try {
      const res = await fetch(proxUrl, { signal });
      if (!res.ok) return [];
      const json = await res.json();
      const arr = (json as { suggestions?: AddressSuggestion[] }).suggestions;
      if (Array.isArray(arr)) mapped = arr.slice(0, limit);
    } catch { return []; }
  } else {
    const params = new URLSearchParams({
      input: query.trim(),
      key: key!,
      types: 'address',
      components: `country:${country}`,
      sessiontoken: getPlacesSessionToken(),
    });
    const url = `${API_BASE}?${params.toString()}`;
    let res: Response;
    try { res = await fetch(url, { signal }); } catch { return []; }
    if (!res.ok) return [];
    let json: unknown; try { json = await res.json(); } catch { return []; }
    if (!json || typeof json !== 'object') return [];
    const predictionsRaw = (json as { predictions?: Array<{ place_id?: string; description?: unknown }> }).predictions;
    if (!Array.isArray(predictionsRaw)) return [];
    mapped = predictionsRaw.slice(0, limit).map(p => {
      const description = typeof p.description === 'string' ? p.description : '';
      let city: string | undefined; let state: string | undefined; let postalCode: string | undefined;
      const match = description.match(/,\s*([^,]+?),\s*([A-Z]{2})\s+(\d{5})(?:[-\d]*)?$/);
      if (match) { city = match[1]; state = match[2]; postalCode = match[3]; }
      return { id: p.place_id || description, description, city, state, postalCode } as AddressSuggestion;
    });
  }
  setCache(suggestionCache, normalizedQ, mapped);
  return mapped;
}

/** Merge selected suggestion values into existing form values (non-destructive). */
export function applySuggestion(current: Record<string, string>, s: AddressSuggestion): Partial<Record<string,string>> {
  const next: Partial<Record<string,string>> = { addressLine1: s.description };
  if (s.city && !current.city) next.city = s.city;
  if (s.state && !current.state) next.state = s.state;
  if (s.postalCode && !current.postalCode) next.postalCode = s.postalCode;
  return next;
}

/** Fetch structured place details (street, city, state, postal). */
export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
  if (!placeId) return null;
  if (detailsCache.has(placeId)) return detailsCache.get(placeId)!;
  const proxyBase = getProxyBase();
  const key = getApiKey();
  if (!proxyBase && !key) return null;
  if (proxyBase) {
    const url = `${proxyBase.replace(/\/$/, '')}/places/details/${encodeURIComponent(placeId)}?sessiontoken=${encodeURIComponent(getPlacesSessionToken())}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json();
  const container = json as { details?: PlaceDetailsResult; result?: PlaceDetailsResult };
  const details = container.details || container.result || (json as Record<string, unknown>);
  if (!details || typeof details !== 'object') return null;
  setCache(detailsCache, placeId, details as PlaceDetailsResult);
  return details as PlaceDetailsResult;
    } catch { return null; }
  }
  const params = new URLSearchParams({ place_id: placeId, key: key!, fields: 'address_component,formatted_address', sessiontoken: getPlacesSessionToken() });
  const url = `${DETAILS_BASE}?${params.toString()}`;
  let res: Response;
  try { res = await fetch(url); } catch { return null; }
  if (!res.ok) return null;
  let json: unknown; try { json = await res.json(); } catch { return null; }
  if (!json || typeof json !== 'object') return null;
  const addr = (json as { result?: { address_components?: Array<{ types?: string[]; long_name?: string; short_name?: string }>; formatted_address?: string } }).result;
  if (!addr) return null;
  const components = addr.address_components || [];
  let streetNumber = ''; let route = ''; let city: string | undefined; let state: string | undefined; let postal: string | undefined;
  for (const c of components) {
    const types = c.types || [];
    if (types.includes('street_number') && c.long_name) streetNumber = c.long_name;
    if (types.includes('route') && c.long_name) route = c.long_name;
    if (types.includes('locality') && c.long_name) city = c.long_name;
    if (types.includes('administrative_area_level_1') && c.short_name) state = c.short_name;
    if (types.includes('postal_code') && c.long_name) postal = c.long_name;
  }
  const addressLine1 = [streetNumber, route].filter(Boolean).join(' ').trim();
  const result: PlaceDetailsResult = { addressLine1: addressLine1 || undefined, city, state, postalCode: postal, formattedAddress: addr.formatted_address };
  setCache(detailsCache, placeId, result);
  return result;
}

// Expose caches for potential debugging (not documented publicly)
export const __addressCaches = { suggestionCache, detailsCache };
