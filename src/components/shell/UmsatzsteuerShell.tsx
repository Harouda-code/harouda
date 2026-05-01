// src/components/shell/UmsatzsteuerShell.tsx
//
// Module-Shell fuer den Umsatzsteuer-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente mit
// Icons und persistierter Faltgruppen-Anzeige.

import { FileText, Globe } from "lucide-react";

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";
import "./UmsatzsteuerShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "voranmeldungen",
    label: "Voranmeldungen",
    items: [
      {
        to: "/umsatzsteuer/ustva",
        label: "Umsatzsteuer-Voranmeldung",
        icon: FileText,
      },
    ],
  },
  {
    id: "jahreserklaerung",
    label: "Jahreserklaerung",
    items: [],
  },
  {
    id: "zusammenfassende-meldung",
    label: "Zusammenfassende Meldung",
    items: [
      {
        to: "/umsatzsteuer/zm",
        label: "Zusammenfassende Meldung",
        icon: Globe,
      },
    ],
  },
];

export default function UmsatzsteuerShell() {
  return (
    <SidebarShell
      bemBlock="umsatzsteuer-shell"
      ariaLabel="Umsatzsteuer-Navigation"
      groups={GROUPS}
      storageKey="harouda:umsatzsteuer:nav-expanded"
    />
  );
}
