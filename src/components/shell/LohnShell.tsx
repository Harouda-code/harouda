// src/components/shell/LohnShell.tsx
//
// Module-Shell fuer den Lohn-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente mit
// persistierter Faltgruppen-Anzeige.

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";
import "./LohnShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "lohn",
    label: "Lohn & Gehalt",
    items: [
      { to: "/lohn", label: "Kalkulator" },
      {
        to: "/lohn/lohnsteueranmeldung",
        label: "Lohnsteuer-Anmeldung (§ 41a)",
      },
      { to: "/lohn/archiv", label: "Abrechnungs-Archiv (GoBD)" },
    ],
  },
];

export default function LohnShell() {
  return (
    <SidebarShell
      bemBlock="lohn-shell"
      ariaLabel="Lohn-Navigation"
      groups={GROUPS}
      storageKey="harouda:lohn:nav-expanded"
    />
  );
}
