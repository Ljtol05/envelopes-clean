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

// (Legacy direct Google endpoints removed; proxy usage is now required.)

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
  const raw = viteEnv?.VITE_PLACES_PROXY_BASE || (globalThis as unknown as { importMetaEnv?: Record<string,string> }).importMetaEnv?.VITE_PLACES_PROXY_BASE;
  if (!raw) return undefined;
  return raw.replace(/\/$/, ''); // normalize trailing slash if present
}

// Deprecated direct API key path removed; proxy is mandatory for suggestions/details.

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
  if (!proxyBase || !query || query.trim().length < 3) return [];
  const { country = 'us', limit = 5, signal } = opts;
  const normalizedQ = `${country}:${query.trim().toLowerCase()}`;
  if (suggestionCache.has(normalizedQ)) return suggestionCache.get(normalizedQ)!;
  let mapped: AddressSuggestion[] = [];
  {
    const proxUrl = `${proxyBase}/places/autocomplete?` + new URLSearchParams({ q: query.trim(), country, limit: String(limit), sessionToken: getPlacesSessionToken() }).toString();
    try {
      const res = await fetch(proxUrl, { signal });
      if (!res.ok) return [];
      const json = await res.json();
      const arr = (json as { suggestions?: AddressSuggestion[] }).suggestions;
      if (Array.isArray(arr)) mapped = arr.slice(0, limit);
    } catch { return []; }
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
  if (!proxyBase) return null;
  {
    const url = `${proxyBase}/places/details/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(getPlacesSessionToken())}`;
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
}

// Expose caches for potential debugging (not documented publicly)
export const __addressCaches = { suggestionCache, detailsCache };
