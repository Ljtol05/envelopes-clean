// Minimal phone formatting utilities for E.164 compliance (Twilio friendly)
// We intentionally keep this lightweight; if future international edge cases arise,
// consider swapping to `libphonenumber-js`.

export interface FormatPhoneOptions {
  /** Default country country code to assume when user enters a national 10‑digit number (US by default). */
  defaultCountryCode?: string; // e.g. '1' for US / Canada
}

// Returns a normalized +[country][number] string OR null if cannot confidently format.
export function formatPhoneE164(raw: string, opts: FormatPhoneOptions = {}): string | null {
  const { defaultCountryCode = '1' } = opts;
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Preserve leading + if present, strip everything else that is not a digit
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D+/g, '');
    if (!digits) return null;
    return `+${digits}`;
  }

  // Remove all non digits
  const digitsOnly = trimmed.replace(/\D+/g, '');
  if (!digitsOnly) return null;

  // Heuristic: 10 digits => assume default country code (US/CA). >10 digits => treat as already including CC.
  if (digitsOnly.length === 10) {
    return `+${defaultCountryCode}${digitsOnly}`;
  }
  if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
    // ITU max length for international numbers is 15 digits (excluding +)
    return `+${digitsOnly}`;
  }
  return null; // ambiguous or invalid length
}

// Very lightweight validation matching what we produce. Does not guarantee number is dialable.
export function isLikelyE164(phone: string): boolean {
  return /^\+[1-9]\d{9,14}$/.test(phone); // + followed by 10-15 total digits (country + national)
}
