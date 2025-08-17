import { createContext } from "react";

export type AuthState = {
  user: import("../lib/api").User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ verificationStep?: 'email' | 'phone' | 'kyc' | 'complete'; nextStep?: 'email' | 'phone' | 'kyc' | 'complete' }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrated: boolean;
  /** Apply a freshly issued token and/or updated user flags (email/phone/KYC). */
  applyAuth?: (token: string | null, user?: Partial<import('../lib/api').User> & { emailVerified?: boolean; phoneVerified?: boolean; kycApproved?: boolean }) => void;
};

export const AuthContext = createContext<AuthState | undefined>(undefined);
