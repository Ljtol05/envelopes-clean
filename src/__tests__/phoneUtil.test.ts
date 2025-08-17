import { formatPhoneE164, isLikelyE164, autoPrependCountry } from '../lib/phone';

describe('phone utils', () => {
  test('formats already international number', () => {
    expect(formatPhoneE164('+1 689 224 3543')).toBe('+16892243543');
  });
  test('national number uses default country', () => {
    expect(formatPhoneE164('6892243543', { defaultCountry: 'US' })).toBe('+16892243543');
  });
  test('handles parentheses/dashes', () => {
    expect(formatPhoneE164('(689) 224-3543', { defaultCountry: 'US' })).toBe('+16892243543');
  });
  test('rejects too short', () => {
    expect(formatPhoneE164('12345')).toBeNull();
  });
  test('validation matches output', () => {
    const v = formatPhoneE164('(689)224-3543', { defaultCountry: 'US' });
    expect(v && isLikelyE164(v)).toBe(true);
  });
  test('autoPrependCountry builds E.164 skeleton', () => {
    expect(autoPrependCountry('6892243543', 'US')).toBe('+16892243543');
  });
});
