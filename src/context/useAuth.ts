import { useContext } from "react";
import { AuthContext, type AuthState } from "./AuthContextBase";

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
