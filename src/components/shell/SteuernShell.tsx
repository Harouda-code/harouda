// src/components/shell/SteuernShell.tsx
//
// Module-Shell fuer den Steuern-Bereich.
//
// Liefert die linke Sidebar mit vier vorbereiteten Gruppen
// (Voranmeldungen, Hauptformulare, ESt-Anlagen, Jahresabschluss)
// und einen <Outlet /> fuer die jeweilige Steuer-Seite.
//
// Aktueller Zustand: Sidebar-Skelett ohne NavLinks. Die Gruppen
// werden in den naechsten Patches mit den konkreten Routen
// (/steuer/ustva, /steuer/zm, /steuer/anlage-* etc.) gefuellt.

import { Outlet } from "react-router-dom";

import "./SteuernShell.css";

type NavGroup = {
  id: string;
  // Anzeigetext der Gruppen-Ueberschrift in der Sidebar.
  title: string;
};

// Reihenfolge der Gruppen entspricht der spaeter geplanten
// Reihenfolge in der Sidebar — von oben nach unten.
const GROUPS: NavGroup[] = [
  { id: "voranmeldungen", title: "Voranmeldungen" },
  { id: "hauptformulare", title: "Hauptformulare" },
  { id: "est-anlagen", title: "ESt-Anlagen" },
  { id: "jahresabschluss", title: "Jahresabschluss" },
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
              {/* NavLinks folgen in den naechsten Patches. */}
              <ul className="steuern-shell__group-list" />
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
