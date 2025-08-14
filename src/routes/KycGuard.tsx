import React from 'react';
void React; // ensure React import retained for jsx in test env
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useKyc } from '../hooks/useKyc';

/**
 * Route guard ensuring only users with an approved KYC status may
 * access nested routes. Redirects to `/kyc` otherwise, preserving the
 * intended destination in route state.
 */
export default function KycGuard() {
  const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  const { status, refresh } = useKyc(isTest ? { autoPoll: false } : undefined);
  const location = useLocation();

  // Ensure we have the latest status when this guard first renders
  if (!status) {
    refresh().catch(() => {});
    return null; // could render a skeleton
  }

  if (status.status !== 'approved') {
    return <Navigate to="/kyc" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
