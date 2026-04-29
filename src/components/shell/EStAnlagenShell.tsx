// EStAnlagenShell-Komponente.
//
// Eigener Geltungsbereich fuer ESt-Anlagen (23 Anlagen).
// Bietet einen seitlichen Navigationsbereich mit sieben thematischen
// Gruppen sowie einen Zurueck-Link zur Hauptsteuer-Uebersicht.
// Aktueller Zustand: Geruest mit Gruppen-Ueberschriften, ohne NavLinks.
// Die NavLinks fuer die einzelnen Anlagen folgen in den naechsten
// Patches.

import { Link, NavLink, Outlet } from "react-router-dom";

import "./EStAnlagenShell.css";

type GroupItem = {
  to: string;
  label: string;
};

type Group = {
  id: string;
  title: string;
  items: GroupItem[];
};

const GROUPS: Group[] = [
  {
    id: "persoenlich-familie",
    title: "Persoenlich & Familie",
    items: [
      { to: "/steuern/anlage-kind", label: "Anlage Kind" },
      { to: "/steuern/anlage-vorsorge", label: "Anlage Vorsorgeaufwand" },
      { to: "/steuern/anlage-av", label: "Anlage AV (Riester)" },
      { to: "/steuern/anlage-unterhalt", label: "Anlage Unterhalt" },
    ],
  },
  {
    id: "sonderausgaben-belastungen",
    title: "Sonderausgaben & Aussergewoehnliche Belastungen",
    items: [
      { to: "/steuern/anlage-haa", label: "Anlage Haushaltsnahe Aufwendungen" },
      { to: "/steuern/anlage-sonder", label: "Anlage Sonderausgaben" },
      { to: "/steuern/anlage-agb", label: "Anlage Aussergewoehnliche Belastungen" },
    ],
  },
  {
    id: "nichtselbststaendig",
    title: "Nichtselbststaendige Arbeit",
    items: [
      { to: "/steuern/anlage-n", label: "Anlage N" },
      { to: "/steuern/anlage-n-aus", label: "Anlage N-AUS (Ausland)" },
      { to: "/steuern/anlage-n-dhf", label: "Anlage N-DHF (Doppelte Haushaltsfuehrung)" },
      { to: "/steuern/anlage-rav-bav", label: "Anlage R-AV / bAV (Renten)" },
    ],
  },
  {
    id: "selbststaendig-gewerblich",
    title: "Selbststaendige & Gewerbliche Einkuenfte",
    items: [
      { to: "/steuern/anlage-s", label: "Anlage S (Selbststaendige Arbeit)" },
      { to: "/steuern/anlage-g", label: "Anlage G (Gewerbebetrieb)" },
      { to: "/steuern/anlage-u", label: "Anlage U (Unterhalt geschiedener Ehegatten)" },
    ],
  },
  {
    id: "kapital",
    title: "Kapital",
    items: [
      { to: "/steuern/anlage-kap", label: "Anlage KAP (Kapitalvermoegen)" },
    ],
  },
  {
    id: "vermietung",
    title: "Vermietung",
    items: [
      { to: "/steuern/anlage-v", label: "Anlage V (Vermietung & Verpachtung)" },
      { to: "/steuern/anlage-v-sonstige", label: "Anlage V-Sonstige" },
      { to: "/steuern/anlage-v-fewo", label: "Anlage V-FeWo (Ferienwohnung)" },
    ],
  },
  {
    id: "sonstige-international",
    title: "Sonstige & Internationales",
    items: [
      { to: "/steuern/anlage-so", label: "Anlage SO (Sonstige Einkuenfte)" },
      { to: "/steuern/anlage-aus", label: "Anlage AUS (Auslaendische Einkuenfte)" },
      { to: "/steuern/anlage-r", label: "Anlage R (Renten)" },
      { to: "/steuern/anlage-em", label: "Anlage Energetische Massnahmen" },
      { to: "/steuern/anlage-mobility", label: "Anlage Mobilitaetspraemie" },
    ],
  },
];

export default function EStAnlagenShell() {
  return (
    <div className="est-anlagen-shell">
      <aside className="est-anlagen-shell__sidebar">
        <Link
          to="/steuern"
          className="est-anlagen-shell__back-link"
        >
          ← Zurueck zur Hauptsteuer
        </Link>
        <nav className="est-anlagen-shell__nav">
          {GROUPS.map((group) => (
            <div
              key={group.id}
              className="est-anlagen-shell__group"
            >
              <h3 className="est-anlagen-shell__group-title">
                {group.title}
              </h3>
              <ul className="est-anlagen-shell__group-list">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        isActive
                          ? "est-anlagen-shell__link est-anlagen-shell__link--active"
                          : "est-anlagen-shell__link"
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <main className="est-anlagen-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
