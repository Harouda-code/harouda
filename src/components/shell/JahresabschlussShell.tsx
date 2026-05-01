// src/components/shell/JahresabschlussShell.tsx
//
// Module-Shell fuer den Jahresabschluss-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente.
// Konfiguriert die Gruppen und reicht sie an SidebarShell durch.

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";

import "./JahresabschlussShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "bilanzierung",
    label: "Bilanzierung",
    items: [
      { to: "/jahresabschluss/ebilanz", label: "E-Bilanz" },
    ],
  },
  {
    id: "offenlegung",
    label: "Offenlegung",
    items: [],
  },
  {
    id: "pruefung",
    label: "Pruefung",
    items: [],
  },
];

export default function JahresabschlussShell() {
  return (
    <SidebarShell
      bemBlock="jahresabschluss-shell"
      ariaLabel="Jahresabschluss-Navigation"
      groups={GROUPS}
    />
  );
}
