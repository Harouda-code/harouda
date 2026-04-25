// src/components/shell/BuchhaltungShell.tsx
//
// Module-Shell fuer Buchhaltung. Phase 1, Schritt a/2.
//
// Liefert die linke Sidebar mit den buchhaltungsspezifischen Bereichen
// (Erfassung, Buchungen pruefen, Bank, Anlagen, Auswertung) und einen
// <Outlet /> fuer die jeweilige Buchhaltungs-Seite. Wird innerhalb von
// BaseShell gerendert (verschachtelte Layout-Routes).
//
// Auto-Expand-Verhalten der Sub-Gruppen (Patch 1.7, Variante γ):
// Beim Wechsel in eine Route, deren Sub-Gruppe gefaltet ist, wird die
// Gruppe einmalig aufgeklappt. Anschliessend behaelt der Nutzer die
// Kontrolle (manuelles Falten ueberlebt weitere Wechsel).
//
// Persistenz: localStorage["harouda:buchhaltung:nav-expanded"] —
// eigener Key pro Modul, kein Shared State mit AppShell.

import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Hash,
  Landmark,
  ListOrdered,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import "./BuchhaltungShell.css";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const GROUPS: NavGroup[] = [
  {
    id: "erfassung",
    label: "Erfassung",
    items: [
      { to: "/buchhaltung/journal", label: "Journal", icon: ListOrdered },
      { to: "/buchhaltung/buchungen/erfassung", label: "Belegerfassung (§ 14 UStG)", icon: FileText },
      { to: "/buchhaltung/buchungen/belege", label: "Belege-Liste", icon: FileText },
      { to: "/buchhaltung/konten", label: "Kontenplan", icon: Hash },
    ],
  },
  {
    id: "pruefen",
    label: "Buchungen prüfen",
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
      { to: "/buchhaltung/banking/reconciliation", label: "Bank-Abstimmung", icon: Wallet },
      { to: "/buchhaltung/banking/belegabfragen", label: "Beleg-Anforderungen", icon: Receipt },
    ],
  },
  {
    id: "anlagen",
    label: "Anlagen",
    items: [
      { to: "/buchhaltung/anlagen/verzeichnis", label: "Anlagenverzeichnis", icon: Hash },
      { to: "/buchhaltung/anlagen/afa-lauf", label: "AfA-Lauf", icon: TrendingUp },
    ],
  },
  {
    id: "auswertung",
    label: "Auswertung",
    items: [
      { to: "/buchhaltung/liquiditaet", label: "Liquiditätsvorschau", icon: TrendingUp },
      { to: "/buchhaltung/buchfuehrung", label: "EÜR-Hub", icon: BookOpen },
    ],
  },
];

const STORAGE_KEY = "harouda:buchhaltung:nav-expanded";

function loadExpanded(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, boolean>;
    }
    return {};
  } catch {
    return {};
  }
}

function saveExpanded(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked */
  }
}

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((it) => pathname.startsWith(it.to));
}

export default function BuchhaltungShell() {
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => loadExpanded());

  // Persistenz bei jeder Aenderung
  useEffect(() => {
    saveExpanded(expanded);
  }, [expanded]);

  // Auto-Expand beim Route-Wechsel (Variante γ):
  // Wechselt der Nutzer in eine Route, deren Sub-Gruppe gefaltet ist,
  // klappt die Gruppe einmalig auf. Anschliessend behaelt der Nutzer
  // die Kontrolle — ein manuelles Falten ueberlebt weitere Wechsel
  // innerhalb derselben Gruppe (dieser Effect haengt nur an pathname).
  //
  // Bewusst akzeptierter cascading render: eine reine Derivation per
  // useMemo kann "expand-once + allow user collapse" nicht modellieren,
  // weil sie die Trennung zwischen automatischer Aufklappung und
  // expliziter Nutzeraktion verliert.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded((prev) => {
      let changed = false;
      const next: Record<string, boolean> = { ...prev };
      for (const g of GROUPS) {
        if (isGroupActive(g, location.pathname) && !next[g.id]) {
          next[g.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [location.pathname]);

  function toggleGroup(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const activeGroupId = useMemo(
    () => GROUPS.find((g) => isGroupActive(g, location.pathname))?.id ?? null,
    [location.pathname],
  );

  return (
    <div className="buchhaltung-shell">
      <aside className="buchhaltung-shell__sidebar" aria-label="Buchhaltungs-Navigation">
        <nav className="buchhaltung-shell__nav">
          {GROUPS.map((g) => {
            const isOpen = expanded[g.id] ?? false;
            const isActive = activeGroupId === g.id;
            return (
              <div
                key={g.id}
                className={`buchhaltung-shell__group${isActive ? " is-active" : ""}`}
              >
                <button
                  type="button"
                  className="buchhaltung-shell__group-head"
                  onClick={() => toggleGroup(g.id)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>{g.label}</span>
                </button>
                {isOpen && (
                  <div className="buchhaltung-shell__items">
                    {g.items.map((it) => {
                      const Icon = it.icon;
                      return (
                        <NavLink
                          key={it.to}
                          to={it.to}
                          className={({ isActive }) =>
                            "buchhaltung-shell__item" + (isActive ? " is-active" : "")
                          }
                          end
                        >
                          <Icon size={14} />
                          <span>{it.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <section className="buchhaltung-shell__content">
        <Outlet />
      </section>
    </div>
  );
}
