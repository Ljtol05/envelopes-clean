import React, { useCallback, useEffect, useMemo, useState } from "react";
// Migrate to axios-based auth service (services/auth) while keeping legacy User type for now.
import { login as svcLogin, register as svcRegister, getMe as svcGetMe } from '../services/auth';
import type { User } from "../lib/api"; // legacy User shape

interface AuthServiceUser { id?: string | number; email: string; name?: string }
import { AuthContext, type AuthState } from "./AuthContextBase";

const TOKEN_KEY = "auth_token" as const;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const persistToken = (t: string | null) => {
    if (!t) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, t);
    }
  };

  const doLogin = useCallback(async (email: string, password: string) => {
    const { token, user } = await svcLogin({ email, password });
    if (token) persistToken(token);
    setToken(token || null);
    // service user may omit name; coerce to legacy User shape if present
    if (user) {
      const svcUser = user as AuthServiceUser;
      const coerced: User = {
        id: typeof svcUser.id === 'number' ? svcUser.id : Number(svcUser.id) || 0,
        name: svcUser.name || svcUser.email.split('@')[0],
        email: svcUser.email,
      };
      setUser(coerced);
    }
  }, []);

  const doRegister = useCallback(async (name: string, email: string, password: string) => {
    const { token, user } = await svcRegister({ name, email, password });
    if (token) persistToken(token);
    setToken(token || null);
    if (user) {
      const svcUser = user as AuthServiceUser;
      const coerced: User = {
        id: typeof svcUser.id === 'number' ? svcUser.id : Number(svcUser.id) || 0,
        name: svcUser.name || name,
        email: svcUser.email,
      };
      setUser(coerced);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    persistToken(null);
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
        const coerced: User = {
          id: typeof u.id === 'number' ? u.id : Number(u.id) || 0,
          name,
          email: u.email,
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

  const value = useMemo<AuthState>(() => ({ user, token, login: doLogin, register: doRegister, logout, hydrated }), [user, token, doLogin, doRegister, logout, hydrated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
 
