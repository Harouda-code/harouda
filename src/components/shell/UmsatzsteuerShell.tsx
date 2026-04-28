// UmsatzsteuerShell-Komponente.
//
// Eigener Geltungsbereich fuer Umsatzsteuer.
// Bietet einen seitlichen Navigationsbereich mit drei thematischen
// Gruppen sowie einen Zurueck-Link zur Mandantenuebersicht.
// Aktueller Zustand: Geruest mit Gruppen-Ueberschriften, ohne NavLinks.
// Die NavLinks fuer die einzelnen Bereiche folgen in den naechsten
// Patches.

import { Link, NavLink, Outlet } from "react-router-dom";

import "./UmsatzsteuerShell.css";

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
    <div className="umsatzsteuer-shell">
      <aside className="umsatzsteuer-shell__sidebar">
        <Link
          to="/arbeitsplatz"
          className="umsatzsteuer-shell__back-link"
        >
          ← Zurueck zur Mandantenuebersicht
        </Link>
        <nav className="umsatzsteuer-shell__nav">
          {GROUPS.map((group) => (
            <div
              key={group.id}
              className="umsatzsteuer-shell__group"
            >
              <h3 className="umsatzsteuer-shell__group-title">
                {group.title}
              </h3>
              <ul className="umsatzsteuer-shell__group-list">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        isActive
                          ? "umsatzsteuer-shell__link umsatzsteuer-shell__link--active"
                          : "umsatzsteuer-shell__link"
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
      <main className="umsatzsteuer-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
