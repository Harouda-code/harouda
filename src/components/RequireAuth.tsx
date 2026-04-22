import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useUser } from "../contexts/UserContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          gap: "0.75rem",
          color: "var(--ink-soft)",
        }}
      >
        <Loader2 size={28} className="login__spinner" />
        <p>Sitzung wird geprüft …</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
