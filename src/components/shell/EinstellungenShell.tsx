// src/components/shell/EinstellungenShell.tsx
//
// Module-Shell fuer den Einstellungen-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente mit
// persistierter Faltgruppen-Anzeige.

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";
import "./EinstellungenShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "einstellungen",
    label: "Einstellungen",
    items: [
      { to: "/einstellungen", label: "Firma & Datenhaltung" },
      { to: "/einstellungen/kostenstellen", label: "Kostenstellen" },
      { to: "/einstellungen/kostentraeger", label: "Kostenträger" },
      { to: "/einstellungen/benutzer", label: "Benutzer & Rollen" },
      { to: "/einstellungen/verfahrensdoku", label: "Verfahrensdokumentation" },
      { to: "/einstellungen/systemstatus", label: "System-Status" },
      { to: "/einstellungen/systemlog", label: "System-Log (Technik)" },
      { to: "/einstellungen/audit", label: "Audit-Log" },
      { to: "/einstellungen/fristen", label: "Fristenkalender" },
      { to: "/einstellungen/aufbewahrung", label: "Aufbewahrungsfristen" },
    ],
  },
];

export default function EinstellungenShell() {
  return (
    <SidebarShell
      bemBlock="einstellungen-shell"
      ariaLabel="Einstellungen-Navigation"
      groups={GROUPS}
      storageKey="harouda:einstellungen:nav-expanded"
    />
  );
}
