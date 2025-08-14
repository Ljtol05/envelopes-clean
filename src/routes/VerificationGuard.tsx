import React from 'react';
void React;
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { PHONE_VERIFICATION_REQUIRED } from '../lib/onboarding';

/**
 * Sequential onboarding guard enforcing:
 * 1. Email verification
 * 2. Phone verification (if enabled via VITE_REQUIRE_PHONE_VERIFICATION !== 'false')
 * Downstream routes (KYC + app) only render after both complete.
 */
export default function VerificationGuard() {
  const { user, hydrated } = useAuth();
  const location = useLocation();
  const requirePhone = PHONE_VERIFICATION_REQUIRED;
  if (!hydrated) return null;
  if (!user?.emailVerified) {
    return <Navigate to="/auth/verify-email" replace state={{ from: location }} />;
  }
  if (requirePhone && !user?.phoneVerified) {
    return <Navigate to="/auth/verify-phone" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
