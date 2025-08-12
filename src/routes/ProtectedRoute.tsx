import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
  const { token, hydrated } = useAuth();
  const location = useLocation();

  if (!hydrated) {
    return <div className="p-6 text-center text-[color:var(--owl-text-secondary)]">Loading…</div>;
  }

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
