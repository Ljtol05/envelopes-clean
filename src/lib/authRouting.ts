import type { VerificationStep } from '../services/auth';

/**
 * Determine the next client route based on backend-provided verification progression fields.
 * Priority: explicit nextStep (what user must do next) falls back to verificationStep (current achieved stage).
 * When steps are complete we land on /home.
 * When ambiguous (undefined) we default to KYC as conservative gate.
 */
export function nextRouteFromSteps(nextStep?: VerificationStep, verificationStep?: VerificationStep): string {
  const step = nextStep || verificationStep;
  switch (step) {
    case 'email': return '/auth/verify-email';
    case 'phone': return '/auth/verify-phone';
    case 'kyc': return '/auth/kyc';
    case 'complete': return '/home';
    default: return '/auth/kyc';
  }
}
