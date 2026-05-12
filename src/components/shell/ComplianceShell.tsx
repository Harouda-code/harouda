// src/components/shell/ComplianceShell.tsx
//
// Module-Shell fuer den Compliance-Bereich (Kanzlei-Dashboard,
// Audit-Trail, Datenexport, DATEV-Export).
//
// Nutzt die wiederverwendbare SidebarShell-Komponente mit
// persistierter Faltgruppen-Anzeige.

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";
import "./ComplianceShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "compliance",
    label: "Compliance & Export",
    items: [
      { to: "/kanzlei-dashboard", label: "Kanzlei-Dashboard" },
      { to: "/admin/audit", label: "Audit-Trail (GoBD)" },
      { to: "/admin/z3-export", label: "Z3-Datenexport (§ 147 AO)" },
      { to: "/admin/datenexport", label: "Datenexport (DSGVO Art. 20)" },
      { to: "/export/datev", label: "DATEV-Export" },
    ],
  },
];

export default function ComplianceShell() {
  return (
    <SidebarShell
      bemBlock="compliance-shell"
      ariaLabel="Compliance-Navigation"
      groups={GROUPS}
      storageKey="harouda:compliance:nav-expanded"
    />
  );
}
