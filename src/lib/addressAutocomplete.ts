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

const API_BASE = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

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

export async function fetchAddressSuggestions(query: string, opts: FetchSuggestionsOptions = {}): Promise<AddressSuggestion[]> {
  const key = getApiKey();
  if (!key || !query || query.trim().length < 3) return [];
  const { country = 'us', limit = 5, signal } = opts;
  const params = new URLSearchParams({
    input: query.trim(),
    key,
    types: 'address',
    components: `country:${country}`,
  });
  const url = `${API_BASE}?${params.toString()}`;
  let res: Response;
  try { res = await fetch(url, { signal }); } catch { return []; }
  if (!res.ok) return [];
  let json: unknown; try { json = await res.json(); } catch { return []; }
  if (!json || typeof json !== 'object') return [];
  const predictionsRaw = (json as { predictions?: Array<{ place_id?: string; description?: unknown }> }).predictions;
  if (!Array.isArray(predictionsRaw)) return [];
  return predictionsRaw.slice(0, limit).map(p => {
    const description = typeof p.description === 'string' ? p.description : '';
    // Naive extraction of City, ST ZIP from tail of description
    let city: string | undefined; let state: string | undefined; let postalCode: string | undefined;
    const match = description.match(/,\s*([^,]+?),\s*([A-Z]{2})\s+(\d{5})(?:[-\d]*)?$/);
    if (match) { city = match[1]; state = match[2]; postalCode = match[3]; }
    return { id: p.place_id || description, description, city, state, postalCode } as AddressSuggestion;
  });
}

/** Merge selected suggestion values into existing form values (non-destructive). */
export function applySuggestion(current: Record<string, string>, s: AddressSuggestion): Partial<Record<string,string>> {
  const next: Partial<Record<string,string>> = { addressLine1: s.description };
  if (s.city && !current.city) next.city = s.city;
  if (s.state && !current.state) next.state = s.state;
  if (s.postalCode && !current.postalCode) next.postalCode = s.postalCode;
  return next;
}
