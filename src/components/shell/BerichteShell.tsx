// src/components/shell/BerichteShell.tsx
//
// Module-Shell fuer den Berichte-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente mit
// persistierter Faltgruppen-Anzeige.

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";
import "./BerichteShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "berichte",
    label: "Berichte",
    items: [
      { to: "/berichte/bilanz", label: "Bilanz" },
      { to: "/berichte/guv", label: "GuV" },
      { to: "/berichte/bwa", label: "BWA" },
      { to: "/berichte/jahresabschluss", label: "Jahresabschluss" },
      { to: "/berichte/vorjahresvergleich", label: "Vorjahresvergleich" },
      { to: "/berichte/susa", label: "SuSa" },
      { to: "/berichte/dimensionen", label: "Dimensionen (KST/KTR)" },
      { to: "/berichte/anlagenspiegel", label: "Anlagenspiegel (§ 284 HGB)" },
    ],
  },
];

export default function BerichteShell() {
  return (
    <SidebarShell
      bemBlock="berichte-shell"
      ariaLabel="Berichte-Navigation"
      groups={GROUPS}
      storageKey="harouda:berichte:nav-expanded"
    />
  );
}
