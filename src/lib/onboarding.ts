// Centralized onboarding feature flags / sequence constants.
// Evaluated once at module load.
// Phone verification now required by default; set VITE_REQUIRE_PHONE_VERIFICATION='false' to disable.
export const PHONE_VERIFICATION_REQUIRED = (import.meta as unknown as { env?: Record<string,string|undefined> }).env?.VITE_REQUIRE_PHONE_VERIFICATION !== 'false';
