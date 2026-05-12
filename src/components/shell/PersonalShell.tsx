// src/components/shell/PersonalShell.tsx
//
// Module-Shell fuer den Personal-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente mit
// persistierter Faltgruppen-Anzeige.

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";
import "./PersonalShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "personal",
    label: "Personal",
    items: [
      { to: "/personal/mitarbeiter", label: "Mitarbeiter" },
      { to: "/personal/abrechnung", label: "Lohn-Vorschau" },
    ],
  },
];

export default function PersonalShell() {
  return (
    <SidebarShell
      bemBlock="personal-shell"
      ariaLabel="Personal-Navigation"
      groups={GROUPS}
      storageKey="harouda:personal:nav-expanded"
    />
  );
}
