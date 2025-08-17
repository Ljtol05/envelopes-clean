// Lightweight ZIP -> city/state lookup using Zippopotam.us public API with simple in-memory cache.
// NOTE: Consider moving to a server-side proxy if rate limits or privacy become concerns.

interface ZipInfo { city: string; state: string; }

const zipCache = new Map<string, ZipInfo | null>();
const MAX = 100;

function remember(zip: string, val: ZipInfo | null) {
  if (!zipCache.has(zip) && zipCache.size >= MAX) {
    const iter = zipCache.keys().next();
    if (!iter.done && iter.value) zipCache.delete(iter.value as string);
  }
  zipCache.set(zip, val);
  return val;
}

export async function lookupZip(zip: string): Promise<ZipInfo | null> {
  if (!/^[0-9]{5}$/.test(zip)) return null;
  if (zipCache.has(zip)) return zipCache.get(zip)!;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return remember(zip, null);
    const data = await res.json();
    // API returns array of places; take first
    const place = data.places && data.places[0];
    if (!place) return remember(zip, null);
    const info: ZipInfo = { city: place["place name"], state: place["state abbreviation"] };
    return remember(zip, info);
  } catch {
    return remember(zip, null);
  }
}
