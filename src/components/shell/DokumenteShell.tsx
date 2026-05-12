// src/components/shell/DokumenteShell.tsx
//
// Module-Shell fuer den Dokumente-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente mit
// persistierter Faltgruppen-Anzeige.

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";
import "./DokumenteShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "dokumente",
    label: "Dokumente",
    items: [
      { to: "/belege", label: "Belege" },
      { to: "/buchungen/e-rechnung", label: "E-Rechnung (§ 14 UStG)" },
      { to: "/zugferd", label: "E-Rechnung (ZUGFeRD)" },
      { to: "/e-rechnung/archiv", label: "E-Rechnung-Archiv" },
      { to: "/ai/scanner", label: "Dokument-Scanner (OCR)" },
      { to: "/werkzeuge/pdf", label: "PDF-Werkzeuge" },
    ],
  },
];

export default function DokumenteShell() {
  return (
    <SidebarShell
      bemBlock="dokumente-shell"
      ariaLabel="Dokumente-Navigation"
      groups={GROUPS}
      storageKey="harouda:dokumente:nav-expanded"
    />
  );
}
