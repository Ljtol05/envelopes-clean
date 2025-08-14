// Centralized onboarding feature flags / sequence constants.
// Evaluated once at module load.
export const PHONE_VERIFICATION_REQUIRED = import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION === 'true';
