// src/components/shell/UmsatzsteuerShell.tsx
//
// Module-Shell fuer den Umsatzsteuer-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente.
// Konfiguriert die Gruppen und reicht sie an SidebarShell durch.

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";

import "./UmsatzsteuerShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "voranmeldungen",
    title: "Voranmeldungen",
    items: [
      { to: "/umsatzsteuer/ustva", label: "Umsatzsteuer-Voranmeldung" },
    ],
  },
  {
    id: "jahreserklaerung",
    title: "Jahreserklaerung",
    items: [],
  },
  {
    id: "zusammenfassende-meldung",
    title: "Zusammenfassende Meldung",
    items: [
      { to: "/umsatzsteuer/zm", label: "Zusammenfassende Meldung" },
    ],
  },
];

export default function UmsatzsteuerShell() {
  return (
    <SidebarShell
      bemBlock="umsatzsteuer-shell"
      ariaLabel="Umsatzsteuer-Navigation"
      groups={GROUPS}
    />
  );
}
