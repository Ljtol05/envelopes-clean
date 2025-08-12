import { createContext } from "react";

export type AuthState = {
  user: import("../lib/api").User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrated: boolean;
};

export const AuthContext = createContext<AuthState | undefined>(undefined);
