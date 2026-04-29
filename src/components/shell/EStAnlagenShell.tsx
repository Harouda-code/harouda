// EinkommensteuerShell-Komponente.
//
// Shell fuer den Einkommensteuer-Bereich mit sieben thematischen
// Gruppen und insgesamt 23 Anlagen in der seitlichen Navigation.
// Verwendet den gemeinsamen SidebarShell, sodass Markup und
// Verhalten der Sidebar mit den uebrigen Modul-Shells identisch
// sind.

import SidebarShell from "./SidebarShell";
import type { SidebarNavGroup } from "./SidebarShell";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "persoenlich-familie",
    title: "Persoenlich & Familie",
    items: [
      { to: "/einkommensteuer/anlage-kind", label: "Anlage Kind" },
      { to: "/einkommensteuer/anlage-vorsorge", label: "Anlage Vorsorgeaufwand" },
      { to: "/einkommensteuer/anlage-av", label: "Anlage AV (Riester)" },
      { to: "/einkommensteuer/anlage-unterhalt", label: "Anlage Unterhalt" },
    ],
  },
  {
    id: "sonderausgaben-belastungen",
    title: "Sonderausgaben & Aussergewoehnliche Belastungen",
    items: [
      { to: "/einkommensteuer/anlage-haa", label: "Anlage Haushaltsnahe Aufwendungen" },
      { to: "/einkommensteuer/anlage-sonder", label: "Anlage Sonderausgaben" },
      { to: "/einkommensteuer/anlage-agb", label: "Anlage Aussergewoehnliche Belastungen" },
    ],
  },
  {
    id: "nichtselbststaendig",
    title: "Nichtselbststaendige Arbeit",
    items: [
      { to: "/einkommensteuer/anlage-n", label: "Anlage N" },
      { to: "/einkommensteuer/anlage-n-aus", label: "Anlage N-AUS (Ausland)" },
      { to: "/einkommensteuer/anlage-n-dhf", label: "Anlage N-DHF (Doppelte Haushaltsfuehrung)" },
      { to: "/einkommensteuer/anlage-rav-bav", label: "Anlage R-AV / bAV (Renten)" },
    ],
  },
  {
    id: "selbststaendig-gewerblich",
    title: "Selbststaendige & Gewerbliche Einkuenfte",
    items: [
      { to: "/einkommensteuer/anlage-s", label: "Anlage S (Selbststaendige Arbeit)" },
      { to: "/einkommensteuer/anlage-g", label: "Anlage G (Gewerbebetrieb)" },
      { to: "/einkommensteuer/anlage-u", label: "Anlage U (Unterhalt geschiedener Ehegatten)" },
    ],
  },
  {
    id: "kapital",
    title: "Kapital",
    items: [
      { to: "/einkommensteuer/anlage-kap", label: "Anlage KAP (Kapitalvermoegen)" },
    ],
  },
  {
    id: "vermietung",
    title: "Vermietung",
    items: [
      { to: "/einkommensteuer/anlage-v", label: "Anlage V (Vermietung & Verpachtung)" },
      { to: "/einkommensteuer/anlage-v-sonstige", label: "Anlage V-Sonstige" },
      { to: "/einkommensteuer/anlage-v-fewo", label: "Anlage V-FeWo (Ferienwohnung)" },
    ],
  },
  {
    id: "sonstige-international",
    title: "Sonstige & Internationales",
    items: [
      { to: "/einkommensteuer/anlage-so", label: "Anlage SO (Sonstige Einkuenfte)" },
      { to: "/einkommensteuer/anlage-aus", label: "Anlage AUS (Auslaendische Einkuenfte)" },
      { to: "/einkommensteuer/anlage-r", label: "Anlage R (Renten)" },
      { to: "/einkommensteuer/anlage-em", label: "Anlage Energetische Massnahmen" },
      { to: "/einkommensteuer/anlage-mobility", label: "Anlage Mobilitaetspraemie" },
    ],
  },
];

export default function EinkommensteuerShell() {
  return (
    <SidebarShell
      bemBlock="einkommensteuer-shell"
      ariaLabel="Einkommensteuer Navigation"
      groups={GROUPS}
    />
  );
}
