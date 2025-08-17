import { parsePhoneNumberFromString, getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

export interface FormatPhoneOptions {
  /** ISO 3166-1 alpha-2 default country (e.g. 'US'). */
  defaultCountry?: CountryCode;
}

/** Return +E.164 string or null if invalid/unparseable. */
export function formatPhoneE164(raw: string, opts: FormatPhoneOptions = {}): string | null {
  if (!raw) return null;
  const { defaultCountry = 'US' as CountryCode } = opts;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Try direct parse (will accept + or national if defaultCountry provided)
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (parsed && parsed.isValid()) return parsed.number;
  // Fallback heuristic: accept +digits or national digits with default country calling code.
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D+/g,'');
    if (/^[1-9]\d{9,14}$/.test(digits)) return `+${digits}`;
    return null;
  }
  const digitsOnly = trimmed.replace(/\D+/g,'');
  if (/^\d{10,15}$/.test(digitsOnly)) {
    // Prepend country calling code when national length likely (<=10-11 depends). Use autoPrependCountry separately in caller for national forms.
    return null; // caller should call autoPrependCountry first; we don't guess here.
  }
  return null;
}

export function isLikelyE164(phone: string): boolean {
  return /^\+[1-9]\d{9,14}$/.test(phone);
}

/** Country metadata for selector (limited subset prioritized; others appended). */
export interface CountryMeta { code: CountryCode; name: string; callingCode: string; flag: string; }

// Basic static mapping for country names (extend as needed).
const PRIORITY: CountryCode[] = ['US','CA','GB','AU','FR','DE','ES','IT','IN'];
const COUNTRY_NAMES: Record<string,string> = {
  US: 'United States', CA: 'Canada', GB: 'United Kingdom', AU: 'Australia', FR: 'France', DE: 'Germany', ES: 'Spain', IT: 'Italy', IN: 'India'
};

export function getCountryOptions(): CountryMeta[] {
  const all = getCountries();
  const prioritized = PRIORITY.filter(c=>all.includes(c));
  const rest = all.filter(c=>!PRIORITY.includes(c));
  function map(code: CountryCode): CountryMeta { return { code, name: COUNTRY_NAMES[code] || code, callingCode: getCountryCallingCode(code), flag: countryFlagEmoji(code) }; }
  return [...prioritized.map(map), ...rest.map(map)];
}

function countryFlagEmoji(code: string): string { // ISO alpha2 to flag
  return code.replace(/./g, ch => String.fromCodePoint(127397 + ch.toUpperCase().charCodeAt(0)));
}

/** Prepend +countryCallingCode if user started typing national digits after selecting a country. */
export function autoPrependCountry(raw: string, country: CountryCode): string {
  if (!raw) return raw;
  if (raw.trim().startsWith('+')) return raw; // already
  const cc = getCountryCallingCode(country);
  const digits = raw.replace(/\D+/g,'');
  return `+${cc}${digits}`;
}
