// src/components/shell/BuchhaltungShell.tsx
//
// Module-Shell fuer den Buchhaltung-Bereich.
//
// Nutzt die wiederverwendbare SidebarShell-Komponente mit
// Icons und persistierter Faltgruppen-Anzeige.
//
// Migration in PR #27: Konsolidierung — der frueher
// eigenstaendige Komponent (mit eigener Auto-Expand-Logik
// und Persistenz) ist nun ein Konfigurationsobjekt + Aufruf
// von SidebarShell. Die gesamte Verhaltensschicht (Faltung,
// localStorage, Auto-Expand, aria-expanded) lebt in
// SidebarShell. storageKey bleibt unveraendert, damit
// existierende Nutzerpraeferenzen erhalten bleiben.

import {
  BookOpen,
  FileText,
  Hash,
  Landmark,
  ListOrdered,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";
import "./BuchhaltungShell.css";

const GROUPS: SidebarNavGroup[] = [
  {
    id: "erfassung",
    label: "Erfassung",
    items: [
      { to: "/buchhaltung/journal", label: "Journal", icon: ListOrdered },
      {
        to: "/buchhaltung/buchungen/erfassung",
        label: "Belegerfassung (\u00a7 14 UStG)",
        icon: FileText,
      },
      {
        to: "/buchhaltung/buchungen/belege",
        label: "Belege-Liste",
        icon: FileText,
      },
      { to: "/buchhaltung/konten", label: "Kontenplan", icon: Hash },
    ],
  },
  {
    id: "pruefen",
    label: "Buchungen pruefen",
    items: [
      { to: "/buchhaltung/opos", label: "Offene Posten", icon: BookOpen },
      { to: "/buchhaltung/mahnwesen", label: "Mahnwesen", icon: Receipt },
    ],
  },
  {
    id: "bank",
    label: "Bank",
    items: [
      { to: "/buchhaltung/bankimport", label: "Bankimport", icon: Landmark },
      {
        to: "/buchhaltung/banking/reconciliation",
        label: "Bank-Abstimmung",
        icon: Wallet,
      },
      {
        to: "/buchhaltung/banking/belegabfragen",
        label: "Beleg-Anforderungen",
        icon: Receipt,
      },
    ],
  },
  {
    id: "anlagen",
    label: "Anlagen",
    items: [
      {
        to: "/buchhaltung/anlagen/verzeichnis",
        label: "Anlagenverzeichnis",
        icon: Hash,
      },
      {
        to: "/buchhaltung/anlagen/afa-lauf",
        label: "AfA-Lauf",
        icon: TrendingUp,
      },
    ],
  },
  {
    id: "auswertung",
    label: "Auswertung",
    items: [
      {
        to: "/buchhaltung/liquiditaet",
        label: "Liquidit\u00e4tsvorschau",
        icon: TrendingUp,
      },
      {
        to: "/buchhaltung/buchfuehrung",
        label: "E\u00dcR-Hub",
        icon: BookOpen,
      },
    ],
  },
];

export default function BuchhaltungShell() {
  return (
    <SidebarShell
      bemBlock="buchhaltung-shell"
      ariaLabel="Buchhaltungs-Navigation"
      groups={GROUPS}
      storageKey="harouda:buchhaltung:nav-expanded"
    />
  );
}
