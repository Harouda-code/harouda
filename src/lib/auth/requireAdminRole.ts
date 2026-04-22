/**
 * Sprint 20.C.1 · Role-Gate-Helper für Admin-Routen.
 *
 * Das Integrity-Dashboard (20.C.3) + künftige Admin-Seiten dürfen nur von
 * owner, admin oder tax_auditor erreicht werden. `member`, `readonly` und
 * anonyme (null) User erhalten ein 403/Forbidden-Display.
 *
 * Keine Redirect-Logik in diesem Modul — die macht das Routing bzw. die
 * aufrufende Page-Komponente.
 */

import {
  useCompany,
  type CompanyRole,
} from "../../contexts/CompanyContext";

export type AdminRole = "owner" | "admin" | "tax_auditor";

const ADMIN_ROLES: ReadonlyArray<AdminRole> = [
  "owner",
  "admin",
  "tax_auditor",
];

/**
 * Type-Guard. `true` wenn `role` einer der drei Admin-Rollen ist.
 * Akzeptiert `null | undefined` als nicht-admin.
 */
export function isAdminRole(
  role: CompanyRole | null | undefined
): role is AdminRole {
  if (!role) return false;
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Hook: liest die aktive Company-Rolle und gibt Allowed-Flag zurück.
 * Muss innerhalb `<CompanyProvider>` aufgerufen werden (sonst wirft
 * `useCompany()`).
 */
export function useRequireAdminRole(): {
  allowed: boolean;
  role: CompanyRole | null;
} {
  const { activeRole } = useCompany();
  return {
    allowed: isAdminRole(activeRole),
    role: activeRole,
  };
}
