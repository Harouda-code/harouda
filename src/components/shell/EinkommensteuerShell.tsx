// EinkommensteuerShell-Komponente.
//
// Shell fuer den Einkommensteuer-Bereich mit acht thematischen
// Gruppen und insgesamt 25 Anlagen in der seitlichen Navigation.
// Verwendet den gemeinsamen SidebarShell mit Icons und
// persistierter Faltgruppen-Anzeige.

import {
  Baby,
  Briefcase,
  Building,
  Building2,
  Car,
  Coins,
  FileText,
  FileWarning,
  Globe,
  HandHeart,
  HeartPulse,
  Home,
  HousePlus,
  Leaf,
  MoreHorizontal,
  PiggyBank,
  Plane,
  Receipt,
  Shield,
  Store,
  TreePalm,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

import SidebarShell from "./SidebarShell";
import type { SidebarNavGroup } from "./SidebarShell";
import "./EinkommensteuerShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "hauptformulare",
    label: "Hauptformulare",
    items: [
      {
        to: "/einkommensteuer/est-1a",
        label: "ESt 1A (Mantelbogen)",
        icon: FileText,
      },
      {
        to: "/einkommensteuer/est-1c",
        label: "ESt 1C (beschraenkt steuerpflichtig)",
        icon: FileWarning,
      },
    ],
  },
  {
    id: "persoenlich-familie",
    label: "Persoenlich & Familie",
    items: [
      { to: "/einkommensteuer/anlage-kind", label: "Anlage Kind", icon: Baby },
      {
        to: "/einkommensteuer/anlage-vorsorge",
        label: "Anlage Vorsorgeaufwand",
        icon: Shield,
      },
      {
        to: "/einkommensteuer/anlage-av",
        label: "Anlage AV (Riester)",
        icon: PiggyBank,
      },
      {
        to: "/einkommensteuer/anlage-unterhalt",
        label: "Anlage Unterhalt",
        icon: HandHeart,
      },
    ],
  },
  {
    id: "sonderausgaben-belastungen",
    label: "Sonderausgaben & Aussergewoehnliche Belastungen",
    items: [
      {
        to: "/einkommensteuer/anlage-haa",
        label: "Anlage Haushaltsnahe Aufwendungen",
        icon: Home,
      },
      {
        to: "/einkommensteuer/anlage-sonder",
        label: "Anlage Sonderausgaben",
        icon: Receipt,
      },
      {
        to: "/einkommensteuer/anlage-agb",
        label: "Anlage Aussergewoehnliche Belastungen",
        icon: HeartPulse,
      },
    ],
  },
  {
    id: "nichtselbststaendig",
    label: "Nichtselbststaendige Arbeit",
    items: [
      { to: "/einkommensteuer/anlage-n", label: "Anlage N", icon: Briefcase },
      {
        to: "/einkommensteuer/anlage-n-aus",
        label: "Anlage N-AUS (Ausland)",
        icon: Plane,
      },
      {
        to: "/einkommensteuer/anlage-n-dhf",
        label: "Anlage N-DHF (Doppelte Haushaltsfuehrung)",
        icon: HousePlus,
      },
      {
        to: "/einkommensteuer/anlage-rav-bav",
        label: "Anlage R-AV / bAV (Renten)",
        icon: Wallet,
      },
    ],
  },
  {
    id: "selbststaendig-gewerblich",
    label: "Selbststaendige & Gewerbliche Einkuenfte",
    items: [
      {
        to: "/einkommensteuer/anlage-s",
        label: "Anlage S (Selbststaendige Arbeit)",
        icon: UserCheck,
      },
      {
        to: "/einkommensteuer/anlage-g",
        label: "Anlage G (Gewerbebetrieb)",
        icon: Store,
      },
      {
        to: "/einkommensteuer/anlage-u",
        label: "Anlage U (Unterhalt geschiedener Ehegatten)",
        icon: Users,
      },
    ],
  },
  {
    id: "kapital",
    label: "Kapital",
    items: [
      {
        to: "/einkommensteuer/anlage-kap",
        label: "Anlage KAP (Kapitalvermoegen)",
        icon: TrendingUp,
      },
    ],
  },
  {
    id: "vermietung",
    label: "Vermietung",
    items: [
      {
        to: "/einkommensteuer/anlage-v",
        label: "Anlage V (Vermietung & Verpachtung)",
        icon: Building,
      },
      {
        to: "/einkommensteuer/anlage-v-sonstige",
        label: "Anlage V-Sonstige",
        icon: Building2,
      },
      {
        to: "/einkommensteuer/anlage-v-fewo",
        label: "Anlage V-FeWo (Ferienwohnung)",
        icon: TreePalm,
      },
    ],
  },
  {
    id: "sonstige-international",
    label: "Sonstige & Internationales",
    items: [
      {
        to: "/einkommensteuer/anlage-so",
        label: "Anlage SO (Sonstige Einkuenfte)",
        icon: MoreHorizontal,
      },
      {
        to: "/einkommensteuer/anlage-aus",
        label: "Anlage AUS (Auslaendische Einkuenfte)",
        icon: Globe,
      },
      {
        to: "/einkommensteuer/anlage-r",
        label: "Anlage R (Renten)",
        icon: Coins,
      },
      {
        to: "/einkommensteuer/anlage-em",
        label: "Anlage Energetische Massnahmen",
        icon: Leaf,
      },
      {
        to: "/einkommensteuer/anlage-mobility",
        label: "Anlage Mobilitaetspraemie",
        icon: Car,
      },
    ],
  },
];

export default function EinkommensteuerShell() {
  return (
    <SidebarShell
      bemBlock="einkommensteuer-shell"
      ariaLabel="Einkommensteuer Navigation"
      groups={GROUPS}
      storageKey="harouda:einkommensteuer:nav-expanded"
    />
  );
}
