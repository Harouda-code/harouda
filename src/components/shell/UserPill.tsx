// src/components/shell/UserPill.tsx
//
// Benutzer-Menü im AppShell-Sidebar-Footer.
// Aus AppShell.tsx extrahiert (Phase 1, Schritt b/3).
//
// Zeigt Avatar (erster Buchstabe der E-Mail), aufklappbares Menü
// mit Einstellungen-Link und Abmelden-Button. Click-Outside schließt
// das Menü automatisch.
//
// Reine Präsentations-Komponente: User-Daten und Sign-Out-Handler
// kommen über Props.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LogOut, Settings, UserCircle2 } from "lucide-react";

export type UserPillProps = {
  user: { email?: string | null } | null;
  onSignOut: () => void;
};

export function UserPill({ user, onSignOut }: UserPillProps) {
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

  const email = user?.email ?? "demo@harouda.local";
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="shell__user" ref={ref}>
      <button
        type="button"
        className="shell__user-btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Benutzer-Menü"
      >
        <span className="shell__user-avatar">{initial}</span>
        <span className="shell__user-meta">
          <strong>{email}</strong>
          <span>Steuerberater:in</span>
        </span>
        <ChevronDown size={14} className="shell__user-chev" />
      </button>
      {open && (
        <div className="shell__user-menu">
          <div className="shell__user-info">
            <UserCircle2 size={20} />
            <div>
              <strong>{email}</strong>
              <small>Rolle: owner · Demo-Konto</small>
            </div>
          </div>
          <div className="shell__user-divider" />
          <Link
            to="/einstellungen"
            className="shell__user-action"
            onClick={() => setOpen(false)}
          >
            <Settings size={14} />
            Einstellungen
          </Link>
          <button
            type="button"
            className="shell__user-action shell__user-action--danger"
            onClick={onSignOut}
          >
            <LogOut size={14} />
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
}
