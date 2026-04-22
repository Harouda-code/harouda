import { Eye } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import "./ReadonlyBanner.css";

/**
 * Klein, auffällig, überall einsetzbar: informiert Nur-Lesen-Nutzer:innen,
 * warum Schaltflächen deaktiviert sind. Rendert nichts, wenn der aktive
 * User Schreibzugriff hat.
 */
export default function ReadonlyBanner() {
  const { canWrite, role } = usePermissions();
  if (canWrite) return null;

  return (
    <aside className="ro-banner" role="status">
      <Eye size={14} />
      <span>
        Nur-Lesen-Zugriff ({role ?? "kein Zugriff"}) — Änderungen sind auf
        dieser Ansicht deaktiviert. Für Schreibrechte bitte an die
        Administrator:in Ihrer Firma wenden.
      </span>
    </aside>
  );
}
