// src/components/shell/SteuernShell.tsx
//
// Module-Shell fuer den Steuern-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente.
// Konfiguriert die Gruppen und reicht sie an SidebarShell durch.

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";

import "./SteuernShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "hauptformulare",
    label: "Hauptformulare",
    items: [
      { to: "/steuern", label: "Übersicht" },
      { to: "/steuern/euer", label: "EÜR" },
      { to: "/steuern/gewerbesteuer", label: "Gewerbesteuer" },
      { to: "/steuern/kst", label: "Körperschaftsteuer" },
      { to: "/steuern/est-1a", label: "ESt 1A (Hauptvordruck)" },
      { to: "/steuern/est-1c", label: "ESt 1C (Hauptvordruck)" },
    ],
  },
];

export default function SteuernShell() {
  return (
    <SidebarShell
      bemBlock="steuern-shell"
      ariaLabel="Steuern-Navigation"
      groups={GROUPS}
    />
  );
}
