// src/components/shell/StammdatenShell.tsx
//
// Module-Shell fuer den Stammdaten-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente mit
// persistierter Faltgruppen-Anzeige.

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";
import "./StammdatenShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "stammdaten",
    label: "Stammdaten",
    items: [
      { to: "/mandanten", label: "Mandanten (Kanzlei)" },
      { to: "/debitoren", label: "Debitoren (Kunden)" },
      { to: "/kreditoren", label: "Kreditoren (Lieferanten)" },
    ],
  },
];

export default function StammdatenShell() {
  return (
    <SidebarShell
      bemBlock="stammdaten-shell"
      ariaLabel="Stammdaten-Navigation"
      groups={GROUPS}
      storageKey="harouda:stammdaten:nav-expanded"
    />
  );
}
