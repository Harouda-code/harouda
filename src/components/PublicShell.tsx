import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import "./PublicShell.css";

type NavEntry = { to: string; label: string };

const NAV: NavEntry[] = [
  { to: "/ueber-uns", label: "Über uns" },
  { to: "/funktionen", label: "Funktionen" },
  { to: "/ablauf", label: "Ablauf" },
  { to: "/werkzeuge", label: "Werkzeuge" },
  { to: "/vergleich", label: "Vergleich" },
  { to: "/roi", label: "ROI" },
  { to: "/kontakt", label: "Kontakt" },
];

/**
 * Gemeinsame Hülle für alle öffentlichen Info-Seiten
 * (LandingPage + Über uns / Funktionen / Ablauf / Werkzeuge / Kontakt).
 * Die App-Navigation liegt in `AppShell.tsx` hinter dem Login.
 */
export default function PublicShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Menü bei Routenwechsel automatisch schließen
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Body-Scroll sperren, solange das Menü offen ist
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="pub">
      <header className="pub__nav">
        <div className="container pub__nav-inner">
          <Link to="/" className="pub__brand" aria-label="harouda-app Startseite">
            <span className="pub__brand-mark">H</span>
            <span className="pub__brand-name">harouda</span>
          </Link>

          <nav className="pub__nav-links" aria-label="Hauptnavigation">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `pub__nav-link${isActive ? " is-active" : ""}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="pub__nav-actions">
            <Link to="/login" className="btn btn-ghost pub__login-link">
              Anmelden
            </Link>
            <Link to="/login" className="btn btn-primary">
              Kostenlos testen
              <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              className="pub__burger"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="pub-mobile-menu"
              aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="pub-mobile-menu"
        className={`pub__drawer${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="pub__drawer-panel">
          <nav className="pub__drawer-nav">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `pub__drawer-link${isActive ? " is-active" : ""}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="pub__drawer-actions">
            <Link to="/login" className="btn btn-outline btn-block">
              Anmelden
            </Link>
            <Link to="/login" className="btn btn-primary btn-block">
              Kostenlos testen
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <main className="pub__main">{children}</main>

      <footer className="pub__footer">
        <div className="container pub__footer-inner">
          <div>
            <span className="pub__brand">
              <span className="pub__brand-mark">H</span>
              <span className="pub__brand-name">harouda</span>
            </span>
            <p className="pub__footer-tag">
              Kanzlei-Software für Steuerberater:innen.
            </p>
          </div>
          <nav
            className="pub__footer-nav"
            aria-label="Footer-Navigation"
          >
            {NAV.map((n) => (
              <Link key={n.to} to={n.to}>
                {n.label}
              </Link>
            ))}
          </nav>
          <nav
            className="pub__footer-nav"
            aria-label="Rechtliches"
          >
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
          </nav>
          <small>
            &copy; {new Date().getFullYear()} harouda-app · Kapazitäts-
            Demonstration · keine zertifizierte Abgabesoftware
          </small>
        </div>
      </footer>
    </div>
  );
}
