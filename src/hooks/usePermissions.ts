import { useCompany, type CompanyRole } from "../contexts/CompanyContext";

/**
 * Einheitliche Rechteprüfung.
 *
 * Rollen-Hierarchie (aufsteigend, operative Rollen):
 *   readonly < member < admin < owner
 *
 * tax_auditor ist eine ORTHOGONALE Rolle für externe Prüfer:innen:
 * vollständige Lesesicht über alle Entitäten, aber keinerlei Schreibrechte
 * und keine Verwaltungsfunktionen.
 *
 * - canRead     = Mitglied einer Firma (inkl. tax_auditor)
 * - canWrite    = member, admin oder owner
 * - canManage   = admin oder owner (Stammdaten, Mahnwesen-Stornos)
 * - canAdmin    = admin oder owner (Nutzerverwaltung, Firmeneinstellungen)
 * - canOwn      = nur owner (Firmenlöschung, Rollenänderung Owner)
 * - canAudit    = tax_auditor, admin oder owner (Zugriff auf Prüfer-Dashboard)
 * - isAuditor   = ausschließlich tax_auditor (zeigt eingeschränkte UI)
 */
export type Permissions = {
  role: CompanyRole | null;
  canRead: boolean;
  canWrite: boolean;
  canManage: boolean;
  canAdmin: boolean;
  canOwn: boolean;
  canAudit: boolean;
  isAuditor: boolean;
};

const ORDER: Record<CompanyRole, number> = {
  readonly: 0,
  tax_auditor: 0, // liest nur, wie readonly
  member: 1,
  admin: 2,
  owner: 3,
};

function atLeast(role: CompanyRole | null, min: CompanyRole): boolean {
  if (!role) return false;
  if (role === "tax_auditor") {
    // tax_auditor erreicht keine operative Write-/Admin-Ebene;
    // alles außer "readonly"-Level bleibt false.
    return ORDER["readonly"] >= ORDER[min];
  }
  return ORDER[role] >= ORDER[min];
}

function permsFor(role: CompanyRole | null): Permissions {
  const isAuditor = role === "tax_auditor";
  return {
    role,
    canRead: role !== null,
    canWrite: atLeast(role, "member"),
    canManage: atLeast(role, "admin"),
    canAdmin: atLeast(role, "admin"),
    canOwn: atLeast(role, "owner"),
    canAudit: isAuditor || atLeast(role, "admin"),
    isAuditor,
  };
}

export function usePermissions(): Permissions {
  const { activeRole } = useCompany();
  return permsFor(activeRole);
}

/** Für Code außerhalb von React-Hooks (z. B. Router-Guards). */
export function computePermissions(role: CompanyRole | null): Permissions {
  return permsFor(role);
}
