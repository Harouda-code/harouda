// src/components/shell/SteuernShell.tsx
//
// Module-Shell fuer den Steuern-Bereich.
//
// Liefert die linke Sidebar mit vier vorbereiteten Gruppen
// (Voranmeldungen, Hauptformulare, ESt-Anlagen, Jahresabschluss)
// und einen <Outlet /> fuer die jeweilige Steuer-Seite.
//
// Aktueller Zustand: erster NavLink fuer UStVA in Voranmeldungen.
// Die uebrigen Gruppen folgen in den naechsten Patches.

import { NavLink, Outlet } from "react-router-dom";

import "./SteuernShell.css";

type NavItem = {
  // Ziel-Route, absolute Pfade.
  to: string;
  // Anzeigetext des NavLink.
  label: string;
};

type NavGroup = {
  id: string;
  // Anzeigetext der Gruppen-Ueberschrift in der Sidebar.
  title: string;
  // Vorerst nur Voranmeldungen befuellt; andere Gruppen folgen.
  items: NavItem[];
};

// Reihenfolge der Gruppen entspricht der spaeter geplanten
// Reihenfolge in der Sidebar — von oben nach unten.
const GROUPS: NavGroup[] = [
  {
    id: "voranmeldungen",
    title: "Voranmeldungen",
    items: [
      { to: "/steuern/ustva", label: "Umsatzsteuer-Voranmeldung" },
      { to: "/steuern/zm", label: "Zusammenfassende Meldung" },
    ],
  },
  {
    id: "hauptformulare",
    title: "Hauptformulare",
    items: [
      { to: "/steuern", label: "Übersicht" },
    ],
  },
  { id: "est-anlagen", title: "ESt-Anlagen", items: [] },
  { id: "jahresabschluss", title: "Jahresabschluss", items: [] },
];

export default function SteuernShell() {
  return (
    <div className="steuern-shell">
      <aside
        className="steuern-shell__sidebar"
        aria-label="Steuern-Navigation"
      >
        <nav className="steuern-shell__nav">
          {GROUPS.map((g) => (
            <div key={g.id} className="steuern-shell__group">
              <h3 className="steuern-shell__group-title">{g.title}</h3>
              {g.items.length === 0 ? (
                // Platzhalter fuer noch leere Gruppen — NavLinks folgen.
                <ul className="steuern-shell__group-list" />
              ) : (
                <ul className="steuern-shell__list">
                  {g.items.map((it) => (
                    <li key={it.to}>
                      <NavLink
                        to={it.to}
                        className={({ isActive }) =>
                          isActive
                            ? "steuern-shell__link steuern-shell__link--active"
                            : "steuern-shell__link"
                        }
                      >
                        {it.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <section className="steuern-shell__main">
        <Outlet />
      </section>
    </div>
  );
}
