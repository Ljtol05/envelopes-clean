import { fetchAddressSuggestions, applySuggestion, fetchPlaceDetails, __addressCaches, resetPlacesSessionToken, getPlacesSessionToken } from '../lib/addressAutocomplete';

// Helper to mock global fetch
function mockFetchOnce(body: unknown, ok = true) {
  (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok,
    json: async () => body,
  });
}

describe('addressAutocomplete', () => {
  const KEY = 'test-key';
  beforeEach(() => {
    (global as unknown as { importMetaEnv: Record<string,string> }).importMetaEnv = { VITE_GOOGLE_PLACES_API_KEY: KEY };
    (global as unknown as { fetch?: unknown }).fetch = undefined;
    __addressCaches.suggestionCache.clear();
    __addressCaches.detailsCache.clear();
  resetPlacesSessionToken();
  });

  it('returns [] when query too short', async () => {
    const res = await fetchAddressSuggestions('ab');
    expect(res).toEqual([]);
  });

  it('parses suggestions and caches them', async () => {
    mockFetchOnce({ predictions: [ { place_id: 'p1', description: '123 Main St, Atlanta, GA 30301' } ]});
    const first = await fetchAddressSuggestions('123 Main');
    expect(first[0]).toMatchObject({ id: 'p1', city: 'Atlanta', state: 'GA', postalCode: '30301' });
    // Second call should hit cache, so fetch not invoked again
    const second = await fetchAddressSuggestions('123 Main');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(second).toHaveLength(1);
  });

  it('applySuggestion fills missing fields only', () => {
    const current = { city: 'Existing City', state: '', postalCode: '' } as Record<string,string>;
  const suggestion = { id: 'x', description: '123', city: 'New City', state: 'NY', postalCode: '10001' } as Parameters<typeof applySuggestion>[1];
  const merged = applySuggestion(current, suggestion);
    expect(merged.city).toBeUndefined(); // existing city preserved
    expect(merged.state).toBe('NY');
    expect(merged.postalCode).toBe('10001');
  });

  it('fetchPlaceDetails extracts structured components', async () => {
    mockFetchOnce({ result: { address_components: [
      { types: ['street_number'], long_name: '1600' },
      { types: ['route'], long_name: 'Amphitheatre Pkwy' },
      { types: ['locality'], long_name: 'Mountain View' },
      { types: ['administrative_area_level_1'], short_name: 'CA' },
      { types: ['postal_code'], long_name: '94043' },
    ], formatted_address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043' } });
    const details = await fetchPlaceDetails('place123');
    expect(details).toMatchObject({ city: 'Mountain View', state: 'CA', postalCode: '94043', addressLine1: '1600 Amphitheatre Pkwy' });
    // cached second call
    const details2 = await fetchPlaceDetails('place123');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(details2?.addressLine1).toBe('1600 Amphitheatre Pkwy');
  });

  it('returns [] on network error for suggestions', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockRejectedValue(new Error('net'));
    const res = await fetchAddressSuggestions('123 Main');
    expect(res).toEqual([]);
  });

  it('session token persists across calls until reset', async () => {
    mockFetchOnce({ predictions: [] });
    const token1 = getPlacesSessionToken();
    await fetchAddressSuggestions('123 Main');
    const token2 = getPlacesSessionToken();
    expect(token1).toBe(token2);
    resetPlacesSessionToken();
    const token3 = getPlacesSessionToken();
    expect(token3).not.toBe(token1);
  });
});
