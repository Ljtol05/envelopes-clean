import { useCallback, useEffect, useRef, useState } from 'react';
import type { KycFormData, KycStatusResponse } from '../types/kyc';
import { apiStartKyc, apiGetKycStatus } from '../lib/kyc';

/**
 * Custom hook managing the KYC lifecycle. Provides helpers to submit the
 * KYC form, poll for status changes, and reset or refresh the state.
 * Accepts an optional `pollMs` interval (default: 3000ms).
 */
export function useKyc(pollMs: number = 3000) {
  const [status, setStatus] = useState<KycStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await apiGetKycStatus();
      setStatus(s);
  } catch {
      // Normalize message for consistent UI/testing
      setError('Failed to fetch KYC status');
    }
  }, []);

  const submitKyc = useCallback(async (form: KycFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiStartKyc(form);
      setStatus(res);
  } catch {
      setError('KYC submission failed');
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStatus(null);
    setError(null);
  }, []);

  // Poll for updates when status is pending
  useEffect(() => {
    const shouldPoll = status?.status === 'pending';
    if (!shouldPoll) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      fetchStatus().catch(() => {});
    }, pollMs) as unknown as number;
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status?.status, pollMs, fetchStatus]);

  // Preload status on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, error, submitting, submitKyc, refresh: fetchStatus, reset };
}
