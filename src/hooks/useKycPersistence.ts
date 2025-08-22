import React from 'react';
import type { KycFormData } from '../types/kyc';
import { storageKeyFor, STALE_MS_DEFAULT, encodeSensitiveAsync, decodeSensitiveAsync } from '../lib/kycPersistence';

type Status = 'not_started' | 'pending' | 'approved' | 'rejected' | undefined;

interface Params {
  userId: string | number | undefined;
  wizardEnabled: boolean;
  wizardStepsLength: number;
  watch: (cb: (values: Record<string, unknown>) => void) => { unsubscribe: () => void };
  getValues: () => Record<string, unknown>;
  setValue: (k: keyof KycFormData, v: string, opts?: unknown) => void;
  formReset: () => void;
  wizIndex: number;
  setWizIndex: React.Dispatch<React.SetStateAction<number>>;
  status: Status;
}

interface Return {
  showResumePrompt: boolean;
  resumeData: null | { step: number; data: Partial<KycFormData> };
  applyResume: () => void;
  startOver: () => void;
  lastSavedAt: number | null;
  lastSavedText: string | null;
  saveNow: (opts?: { force?: boolean }) => Promise<void>;
  dismissResume: () => void;
}

const SENSITIVE_FIELDS: (keyof KycFormData)[] = ['ssnLast4'];

export default function useKycPersistence(params: Params): Return {
  const { userId, wizardEnabled, wizardStepsLength, watch, getValues, setValue, formReset, wizIndex, setWizIndex, status } = params;
  const storageKey = React.useMemo(() => storageKeyFor(userId), [userId]);
  const [resumeData, setResumeData] = React.useState<Return['resumeData']>(null);
  const [showResumePrompt, setShowResumePrompt] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  const skipNextPersistRef = React.useRef(false);
  // Suspend persisting until the user chooses to Resume/Dismiss/Start over to avoid clobbering saved step with step 0
  const suspendPersistRef = React.useRef(false);

  // TTL (env override optional later); keep default for now
  const STALE_MS = STALE_MS_DEFAULT;

  const latestValuesRef = React.useRef<Record<string, unknown>>({});
  const persistRef = React.useRef<number | null>(null);

  // Load persisted data (decode and prompt)
  React.useEffect(() => {
    if (!wizardEnabled) return;
    (async () => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { step: number; data: Partial<KycFormData>; updated: number };
        if (!parsed || typeof parsed.step !== 'number' || !parsed.data) return;
        const isStale = !parsed.updated || (Date.now() - parsed.updated) > STALE_MS;
        if (isStale) { try { localStorage.removeItem(storageKey); } catch { /* ignore */ } skipNextPersistRef.current = true; return; }
        setLastSavedAt(parsed.updated || null);
    if (parsed.step >= 0 && parsed.step < wizardStepsLength - 1) {
          const hasValues = Object.values(parsed.data).some(v => typeof v === 'string' && v.trim().length > 0);
          if (hasValues) {
            // Surface the prompt immediately, then decode asynchronously
            setShowResumePrompt(true);
      suspendPersistRef.current = true;
            const decoded = await decodeSensitiveAsync(parsed.data as Record<string, unknown>, userId, SENSITIVE_FIELDS) as Partial<KycFormData>;
            setResumeData({ step: parsed.step, data: decoded });
          }
        }
      } catch { /* ignore invalid JSON */ }
    })();
  }, [wizardEnabled, storageKey, wizardStepsLength, userId, STALE_MS]);

  // Persist on field change (throttled)
  React.useEffect(() => {
    if (!wizardEnabled) return;
    const sub = watch((values: Record<string, unknown>) => {
  latestValuesRef.current = values;
      if (persistRef.current) cancelAnimationFrame(persistRef.current);
      persistRef.current = requestAnimationFrame(() => {
        (async () => {
          try {
    if (suspendPersistRef.current) { return; }
    if (skipNextPersistRef.current) { skipNextPersistRef.current = false; return; }
            const encoded = await encodeSensitiveAsync(values, userId, SENSITIVE_FIELDS);
            const payload = { step: wizIndex, data: encoded, updated: Date.now() };
            localStorage.setItem(storageKey, JSON.stringify(payload));
            setLastSavedAt(payload.updated);
          } catch { /* ignore */ }
        })();
      });
    });
    return () => { sub.unsubscribe(); if (persistRef.current) cancelAnimationFrame(persistRef.current); };
  }, [watch, wizIndex, wizardEnabled, storageKey, userId]);

  // Persist on step change
  React.useEffect(() => {
    if (!wizardEnabled) return;
    (async () => {
      try {
        const values = latestValuesRef.current; if (!values) return;
  if (suspendPersistRef.current) { return; }
  if (skipNextPersistRef.current) { skipNextPersistRef.current = false; return; }
        const encoded = await encodeSensitiveAsync(values, userId, SENSITIVE_FIELDS);
        const payload = { step: wizIndex, data: encoded, updated: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setLastSavedAt(payload.updated);
      } catch { /* ignore */ }
    })();
  }, [wizIndex, wizardEnabled, storageKey, userId]);

  // Clear on status change
  React.useEffect(() => {
    if (status === 'pending' || status === 'approved') {
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      setLastSavedAt(null);
    }
  }, [status, storageKey]);

  function applyResume() {
    if (resumeData) {
      // Apply known decoded data and move to saved step immediately
      suspendPersistRef.current = false;
      Object.entries(resumeData.data).forEach(([k, v]) => { if (typeof v === 'string') setValue(k as keyof KycFormData, v as string, { shouldDirty: true } as unknown); });
      setWizIndex(Math.min(resumeData.step, wizardStepsLength - 2));
      setShowResumePrompt(false);
      return;
    }
    // Fallback: if decode hasn't populated yet, read raw storage now, set step immediately,
    // then decode/apply values asynchronously.
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { step: number; data: Partial<KycFormData>; updated: number };
      if (!parsed) return;
      suspendPersistRef.current = false;
      setWizIndex(Math.min(parsed.step ?? 0, wizardStepsLength - 2));
      setShowResumePrompt(false);
      (async () => {
        try {
          const decoded = await decodeSensitiveAsync(parsed.data as Record<string, unknown>, userId, SENSITIVE_FIELDS) as Partial<KycFormData>;
          Object.entries(decoded).forEach(([k, v]) => { if (typeof v === 'string') setValue(k as keyof KycFormData, v as string, { shouldDirty: true } as unknown); });
        } catch { /* ignore */ }
      })();
    } catch { /* ignore */ }
  }
  function startOver() {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    formReset();
    setWizIndex(0);
    setResumeData(null);
    setShowResumePrompt(false);
    setLastSavedAt(null);
    suspendPersistRef.current = false;
  }
  async function saveNow(opts?: { force?: boolean }): Promise<void> {
    try {
      const values = getValues() || latestValuesRef.current; if (!values) return;
      if (suspendPersistRef.current && !opts?.force) { return; }
      const encoded = await encodeSensitiveAsync(values, userId, SENSITIVE_FIELDS);
      const payload = { step: wizIndex, data: encoded, updated: Date.now() };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setLastSavedAt(payload.updated);
    } catch { /* ignore */ }
  }

  function dismissResume() {
    setShowResumePrompt(false);
    suspendPersistRef.current = false;
  }

  const lastSavedText = React.useMemo(() => {
    if (!lastSavedAt) return null;
    const diffSec = Math.floor((Date.now() - lastSavedAt) / 1000);
    if (diffSec < 30) return 'Saved just now';
    const mins = Math.floor(diffSec / 60);
    if (mins === 1) return 'Saved 1 minute ago';
    return `Saved ${mins} minutes ago`;
  }, [lastSavedAt]);

  return { showResumePrompt, resumeData, applyResume, startOver, lastSavedAt, lastSavedText, saveNow, dismissResume };
}
