// JahresabschlussShell-Komponente.
//
// Eigener Geltungsbereich fuer Jahresabschluss.
// Bietet einen seitlichen Navigationsbereich mit drei thematischen
// Gruppen sowie einen Zurueck-Link zur Mandantenuebersicht.
// Aktueller Zustand: Geruest mit Gruppen-Ueberschriften, ohne NavLinks.
// Die NavLinks fuer die einzelnen Bereiche folgen in den naechsten
// Patches.

import { Link, NavLink, Outlet } from "react-router-dom";

import "./JahresabschlussShell.css";

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
    id: "bilanzierung",
    title: "Bilanzierung",
    items: [],
  },
  {
    id: "offenlegung",
    title: "Offenlegung",
    items: [],
  },
  {
    id: "pruefung",
    title: "Pruefung",
    items: [],
  },
];

export default function JahresabschlussShell() {
  return (
    <div className="jahresabschluss-shell">
      <aside className="jahresabschluss-shell__sidebar">
        <Link
          to="/arbeitsplatz"
          className="jahresabschluss-shell__back-link"
        >
          ← Zurueck zur Mandantenuebersicht
        </Link>
        <nav className="jahresabschluss-shell__nav">
          {GROUPS.map((group) => (
            <div
              key={group.id}
              className="jahresabschluss-shell__group"
            >
              <h3 className="jahresabschluss-shell__group-title">
                {group.title}
              </h3>
              <ul className="jahresabschluss-shell__group-list">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        isActive
                          ? "jahresabschluss-shell__link jahresabschluss-shell__link--active"
                          : "jahresabschluss-shell__link"
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
      <main className="jahresabschluss-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
