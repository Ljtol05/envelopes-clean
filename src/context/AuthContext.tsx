import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiGetMe, apiLogin, apiRegister, type User } from "../lib/api";
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
    const { token, user } = await apiLogin(email, password);
    setToken(token);
    setUser(user);
    persistToken(token);
  }, []);

  const doRegister = useCallback(async (name: string, email: string, password: string) => {
    const { token, user } = await apiRegister(name, email, password);
    setToken(token);
    setUser(user);
    persistToken(token);
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
    apiGetMe()
      .then((u) => setUser(u))
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
 
