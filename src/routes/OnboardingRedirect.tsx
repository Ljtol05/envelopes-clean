import React, { useEffect, useRef } from 'react';
void React;
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { apiGetKycStatus } from '../lib/kyc';
import { PHONE_VERIFICATION_REQUIRED } from '../lib/onboarding';

/**
 * Central redirect logic used after login/registration or when user hits '/' root.
 * Decides next step in sequence: verify email -> verify phone -> KYC -> home.
 */
export default function OnboardingRedirect() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navigatedRef = useRef(false);
  useEffect(() => {
    if (!hydrated || navigatedRef.current) return;
    const go = (to: string) => { if (!navigatedRef.current) { navigatedRef.current = true; navigate(to, { replace: true, state: { from: location } }); } };
    if (!user) { go('/auth/login'); return; }
    if (!user.emailVerified) { go('/auth/verify-email'); return; }
    if (PHONE_VERIFICATION_REQUIRED && !user.phoneVerified) { go('/auth/verify-phone'); return; }
    let cancelled = false;
    (async () => {
      try {
        const s = await apiGetKycStatus();
        if (cancelled || navigatedRef.current) return;
        if (s.status !== 'approved') go('/auth/kyc'); else go('/home');
      } catch {
        if (!cancelled) go('/auth/kyc');
      }
    })();
    return () => { cancelled = true; };
  }, [user, hydrated, navigate, location]);
  return null;
}
