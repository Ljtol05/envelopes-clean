import type { KycFormData } from '../types/kyc';

export type KycProgress = { step: number; data: Partial<KycFormData> | Record<string, unknown>; updated: number };

export const ENC_PREFIX = 'enc:';
export const AES_PREFIX = 'aes:'; // Web Crypto AES-GCM prefix

export const STALE_MS_DEFAULT = 7 * 24 * 60 * 60 * 1000;

export function storageKeyFor(userId: string | number | undefined) {
  return `kyc_wizard_progress_v1_${userId ?? 'anon'}`;
}

export function deriveKey(userId: string | number | undefined): string {
  return String(userId ?? 'anon') + '|kyc|v1|salt';
}

export function xorBase64(str: string, key: string): string {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const kc = key.charCodeAt(i % key.length);
    out.push(str.charCodeAt(i) ^ kc);
  }
  if (typeof btoa !== 'undefined') {
    return btoa(String.fromCharCode(...out));
  }
  // Node fallback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Buffer may be undefined in browser
  return (typeof Buffer !== 'undefined' ? Buffer.from(Uint8Array.from(out)).toString('base64') : '');
}

export function xorDecode(b64: string, key: string): string {
  try {
    const bin = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    let res = '';
    for (let i = 0; i < bin.length; i++) {
      const kc = key.charCodeAt(i % key.length);
      res += String.fromCharCode(bin.charCodeAt(i) ^ kc);
    }
    return res;
  } catch {
    return '';
  }
}

// Base64 helpers for Uint8Array <-> string
function b64encode(bytes: Uint8Array): string {
  if (typeof btoa !== 'undefined') {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  // Node fallback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Buffer may be undefined in browser
  return (typeof Buffer !== 'undefined' ? Buffer.from(bytes).toString('base64') : '');
}
function b64decode(s: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Buffer may be undefined in browser
  return (typeof Buffer !== 'undefined' ? new Uint8Array(Buffer.from(s, 'base64')) : new Uint8Array());
}

function getSubtle(): SubtleCrypto | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (globalThis as any).crypto || (typeof window !== 'undefined' ? (window as unknown as { crypto?: Crypto }).crypto : undefined);
    return c && c.subtle ? c.subtle : null;
  } catch { return null; }
}

async function deriveAesKey(userId: string | number | undefined): Promise<CryptoKey> {
  const subtle = getSubtle();
  if (!subtle) throw new Error('WebCrypto unavailable');
  const enc = new TextEncoder();
  const material = enc.encode(deriveKey(userId));
  const hash = await subtle.digest('SHA-256', material);
  return subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function aesEncrypt(plain: string, userId: string | number | undefined): Promise<string> {
  const subtle = getSubtle();
  if (!subtle) throw new Error('WebCrypto unavailable');
  const key = await deriveAesKey(userId);
  const iv = (globalThis.crypto || (window as unknown as { crypto: Crypto }).crypto).getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plain);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const ctBytes = new Uint8Array(ct);
  const packed = new Uint8Array(iv.length + ctBytes.length);
  packed.set(iv, 0); packed.set(ctBytes, iv.length);
  return AES_PREFIX + b64encode(packed);
}

async function aesDecrypt(aesPayload: string, userId: string | number | undefined): Promise<string> {
  const subtle = getSubtle();
  if (!subtle) throw new Error('WebCrypto unavailable');
  const key = await deriveAesKey(userId);
  const packed = b64decode(aesPayload);
  if (packed.length < 13) throw new Error('Invalid AES payload');
  const iv = packed.slice(0, 12);
  const ct = packed.slice(12);
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

export function encodeSensitive(
  data: Record<string, unknown>,
  userId: string | number | undefined,
  fields: (keyof KycFormData)[]
): Record<string, unknown> {
  const key = deriveKey(userId);
  const clone: Record<string, unknown> = { ...data };
  fields.forEach((f) => {
    const v = clone[f as string];
    if (typeof v === 'string' && v) {
      // Default to XOR+base64 obfuscation with prefix; reserved for AES later
      clone[f as string] = ENC_PREFIX + xorBase64(v, key);
    }
  });
  return clone;
}

export function decodeSensitive(
  data: Record<string, unknown>,
  userId: string | number | undefined,
  fields: (keyof KycFormData)[]
): Record<string, unknown> {
  const key = deriveKey(userId);
  const clone: Record<string, unknown> = { ...data };
  fields.forEach((f) => {
    const raw = clone[f as string];
    if (typeof raw === 'string') {
      if (raw.startsWith(ENC_PREFIX)) {
        const enc = raw.slice(ENC_PREFIX.length);
        const dec = xorDecode(enc, key);
        if (dec) clone[f as string] = dec; else delete clone[f as string];
      }
      // If not prefixed, treat as legacy plaintext; leave as-is for form but will be re-encoded on next save.
    }
  });
  return clone;
}

// Async AES-first variants (fallback to XOR if AES unavailable or fails)
export async function encodeSensitiveAsync(
  data: Record<string, unknown>,
  userId: string | number | undefined,
  fields: (keyof KycFormData)[]
): Promise<Record<string, unknown>> {
  const clone: Record<string, unknown> = { ...data };
  const subtle = getSubtle();
  for (const f of fields) {
    const v = clone[f as string];
    if (typeof v === 'string' && v) {
      if (subtle) {
        try {
          clone[f as string] = await aesEncrypt(v, userId);
          continue;
        } catch { /* fall back */ }
      }
      const key = deriveKey(userId);
      clone[f as string] = ENC_PREFIX + xorBase64(v, key);
    }
  }
  return clone;
}

export async function decodeSensitiveAsync(
  data: Record<string, unknown>,
  userId: string | number | undefined,
  fields: (keyof KycFormData)[]
): Promise<Record<string, unknown>> {
  const clone: Record<string, unknown> = { ...data };
  for (const f of fields) {
    const raw = clone[f as string];
    if (typeof raw === 'string') {
      if (raw.startsWith(AES_PREFIX)) {
        const payload = raw.slice(AES_PREFIX.length);
        try {
          clone[f as string] = await aesDecrypt(payload, userId);
          continue;
        } catch {
          // If AES decryption fails, drop the field for safety
          delete clone[f as string];
          continue;
        }
      }
      if (raw.startsWith(ENC_PREFIX)) {
        const key = deriveKey(userId);
        const dec = xorDecode(raw.slice(ENC_PREFIX.length), key);
        if (dec) clone[f as string] = dec; else delete clone[f as string];
      }
      // else legacy plain text remains as-is
    }
  }
  return clone;
}

export function isStale(updated: number | undefined, maxAgeMs = STALE_MS_DEFAULT) {
  if (!updated) return true;
  return Date.now() - updated > maxAgeMs;
}

export function readProgress(key: string): KycProgress | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as KycProgress; } catch { return null; }
}

export function writeProgress(key: string, progress: KycProgress) {
  try { localStorage.setItem(key, JSON.stringify(progress)); } catch { /* ignore quota */ }
}

export function clearProgress(key: string) {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}
