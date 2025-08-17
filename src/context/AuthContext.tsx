import React, { useCallback, useEffect, useMemo, useState } from "react";
// Migrate to axios-based auth service (services/auth) while keeping legacy User type for now.
import { login as svcLogin, register as svcRegister, getMe as svcGetMe, type VerificationStep } from '../services/auth';
import type { User } from "../lib/api"; // legacy User shape

interface AuthServiceUser { id?: string | number; email: string; name?: string; emailVerified?: boolean; phoneVerified?: boolean }
import { AuthContext, type AuthState } from "./AuthContextBase";

const TOKEN_KEY = "auth_token" as const;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const persistToken = (t: string | null) => {
    if (!t) {
      localStorage.removeItem(TOKEN_KEY);
  // Maintain compatibility with backend docs / examples referencing 'token'
  localStorage.removeItem('token');
    } else {
      localStorage.setItem(TOKEN_KEY, t);
  // Alias key so vanilla fetch examples using localStorage.getItem('token') work
  localStorage.setItem('token', t);
    }
  };

  const doLogin = useCallback(async (email: string, password: string) => {
    const { token, user, verificationStep, nextStep } = await svcLogin({ email, password });
    if (token) persistToken(token);
    setToken(token || null);
    // service user may omit name; coerce to legacy User shape if present
    if (user) {
      const svcUser = user as AuthServiceUser;
      const coerced: User & { emailVerified?: boolean; phoneVerified?: boolean } = {
        id: typeof svcUser.id === 'number' ? svcUser.id : Number(svcUser.id) || 0,
        name: svcUser.name || svcUser.email.split('@')[0],
        email: svcUser.email,
        emailVerified: (svcUser as AuthServiceUser).emailVerified,
        phoneVerified: (svcUser as AuthServiceUser).phoneVerified,
      };
      setUser(coerced);
    }
  return { verificationStep: verificationStep as VerificationStep | undefined, nextStep };
  }, []);

  const doRegister = useCallback(async (name: string, email: string, password: string) => {
    const { token, user } = await svcRegister({ name, email, password });
    if (token) persistToken(token);
    setToken(token || null);
    if (user) {
      const svcUser = user as AuthServiceUser;
      const coerced: User & { emailVerified?: boolean; phoneVerified?: boolean } = {
        id: typeof svcUser.id === 'number' ? svcUser.id : Number(svcUser.id) || 0,
        name: svcUser.name || name,
        email: svcUser.email,
        emailVerified: (svcUser as AuthServiceUser).emailVerified,
        phoneVerified: (svcUser as AuthServiceUser).phoneVerified,
      };
      setUser(coerced);
    } else {
      // Backend didn't return user; synthesize minimal user so verification flows have email context
      setUser({ id: 0, name, email });
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    persistToken(null);
  }, []);

  const applyAuth = useCallback((t: string | null, u?: Partial<User> & { emailVerified?: boolean; phoneVerified?: boolean; kycApproved?: boolean }) => {
    /*
     * Robust token + user updater used by verification flows.
     * Previous implementation: passing (null, userUpdate) cleared an existing token when a backend
     * verification endpoint returned only updated user flags (no new token). That caused the auth
     * token to be dropped after email/phone verification responses that omit `token`, leading to:
     *   1. Subsequent /api/auth/me requests without Authorization header (401)
     *   2. Redirect loops between guarded routes (navigation throttling warnings)
     * New behavior:
     *   - If t is a non-empty string, replace the token.
     *   - If t is strictly null AND no user update provided, clear the token (explicit logout intent).
     *   - If t is null BUT a user update object is provided AND an existing token is present, retain
     *     the current token (treat absence of new token as "unchanged").
     */
    setToken(prev => {
      if (t && typeof t === 'string') {
        persistToken(t);
        return t;
      }
      if (t === null && !u) { // explicit clear (no user update implies caller intends logout/reset)
        persistToken(null);
        return null;
      }
      // Else retain previous token (no new token provided but user update present)
      return prev;
    });
    if (u) {
      const coerced: User & { emailVerified?: boolean; phoneVerified?: boolean; kycApproved?: boolean } = {
        id: typeof u.id === 'number' ? u.id : Number(u?.id) || 0,
        name: u.name || (u.email ? u.email.split('@')[0] : 'user'),
        email: u.email || 'unknown',
        emailVerified: u.emailVerified,
        phoneVerified: u.phoneVerified,
        kycApproved: (u as { kycApproved?: boolean }).kycApproved,
      };
      setUser(coerced);
    }
  }, []);

  useEffect(() => {
    // restore token and hydrate user
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      setHydrated(true);
      return;
    }
    setToken(t);
    svcGetMe()
      .then((u) => {
        if (!u) return;
        const name = 'name' in u && typeof (u as { name?: unknown }).name === 'string'
          ? (u as { name: string }).name
          : u.email.split('@')[0];
        const coerced: User & { emailVerified?: boolean; phoneVerified?: boolean } = {
          id: typeof u.id === 'number' ? u.id : Number(u.id) || 0,
          name,
          email: u.email,
          emailVerified: (u as AuthServiceUser).emailVerified,
          phoneVerified: (u as AuthServiceUser).phoneVerified,
        };
        setUser(coerced);
      })
      .catch(() => {
        // token invalid; clear it
        persistToken(null);
        setToken(null);
      })
      .finally(() => setHydrated(true));
  }, []);

  const value = useMemo<AuthState>(() => ({ user, token, login: doLogin, register: doRegister, logout, hydrated, applyAuth }), [user, token, doLogin, doRegister, logout, hydrated, applyAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
 
