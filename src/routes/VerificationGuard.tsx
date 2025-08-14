import React from 'react';
void React;
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/**
 * Ensures the user has verified email (or phone) before proceeding deeper into onboarding.
 * Redirects to /auth/verify-email if neither email nor phone is verified yet.
 */
export default function VerificationGuard() {
  const { user, hydrated } = useAuth();
  const location = useLocation();
  if (!hydrated) return null; // or spinner
  const verified = !!(user?.emailVerified || user?.phoneVerified);
  if (!verified) {
    return <Navigate to="/auth/verify-email" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
