// src/components/shell/SteuernShell.tsx
//
// Module-Shell fuer den Steuern-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente mit
// Icons und persistierter Faltgruppen-Anzeige.

import {
  Building,
  BookOpen,
  FileText,
  FileWarning,
  LayoutDashboard,
  Store,
} from "lucide-react";

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";
import "./SteuernShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "hauptformulare",
    label: "Hauptformulare",
    items: [
      { to: "/steuern", label: "\u00dcbersicht", icon: LayoutDashboard },
      { to: "/steuern/euer", label: "E\u00dcR", icon: BookOpen },
      {
        to: "/steuern/gewerbesteuer",
        label: "Gewerbesteuer",
        icon: Store,
      },
      {
        to: "/steuern/kst",
        label: "K\u00f6rperschaftsteuer",
        icon: Building,
      },
      {
        to: "/steuern/est-1a",
        label: "ESt 1A (Hauptvordruck)",
        icon: FileText,
      },
      {
        to: "/steuern/est-1c",
        label: "ESt 1C (Hauptvordruck)",
        icon: FileWarning,
      },
    ],
  },
];

export default function SteuernShell() {
  return (
    <SidebarShell
      bemBlock="steuern-shell"
      ariaLabel="Steuern-Navigation"
      groups={GROUPS}
      storageKey="harouda:steuern:nav-expanded"
    />
  );
}
