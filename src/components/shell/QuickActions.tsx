// src/components/shell/QuickActions.tsx
//
// "Neu"-Schnellaktionen-Dropdown im AppShell-Topbar.
// Aus AppShell.tsx extrahiert (Phase 1, Schritt b/5).
//
// Liefert die fuenf wichtigsten Erstellungs-Aktionen direkt aus
// dem Topbar erreichbar: Neue Buchung, Neuer Mandant, Beleg
// hochladen, Bankauszug importieren, E-Rechnung lesen.
//
// Click-Outside schliesst das Dropdown automatisch.
// Reine Praesentation — Routen sind hartcodiert (DATEV-typisch
// stabil) und keine Daten-Abhaengigkeiten.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  ChevronDown,
  FileText,
  Landmark,
  ListOrdered,
  Plus,
  Users,
} from "lucide-react";

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <div className="shell__dd" ref={ref}>
      <button
        type="button"
        className="shell__dd-trigger shell__dd-trigger--primary"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Schnellaktionen"
      >
        <Plus size={16} />
        <span>Neu</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="shell__dd-menu">
          <Link to="/journal" className="shell__dd-item" onClick={() => setOpen(false)}>
            <ListOrdered size={14} />
            <div>
              <strong>Neue Buchung</strong>
              <small>Soll/Haben, USt, Skonto</small>
            </div>
            <kbd>Strg+N</kbd>
          </Link>
          <Link to="/mandanten" className="shell__dd-item" onClick={() => setOpen(false)}>
            <Users size={14} />
            <div>
              <strong>Neuer Mandant</strong>
              <small>Stammdaten anlegen</small>
            </div>
          </Link>
          <Link to="/belege" className="shell__dd-item" onClick={() => setOpen(false)}>
            <FileText size={14} />
            <div>
              <strong>Beleg hochladen</strong>
              <small>PDF oder Bild mit OCR</small>
            </div>
          </Link>
          <Link to="/bankimport" className="shell__dd-item" onClick={() => setOpen(false)}>
            <Landmark size={14} />
            <div>
              <strong>Bankauszug importieren</strong>
              <small>MT940 / CAMT.053</small>
            </div>
          </Link>
          <Link to="/zugferd" className="shell__dd-item" onClick={() => setOpen(false)}>
            <BadgeCheck size={14} />
            <div>
              <strong>E-Rechnung lesen</strong>
              <small>ZUGFeRD / Factur-X / XRechnung</small>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
