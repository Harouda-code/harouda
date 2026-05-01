// src/components/shell/SidebarShell.tsx
//
// Wiederverwendbare Sidebar-Komponente fuer Modul-Shells
// (BuchhaltungShell, SteuernShell, UmsatzsteuerShell,
// JahresabschlussShell, EinkommensteuerShell).
//
// Liefert eine linke Sidebar mit Gruppen und einen <Outlet />
// fuer die jeweilige Modul-Seite.
//
// Features:
//  - Optionale Icons pro Item (lucide-react LucideIcon).
//  - Optionale Persistenz der gefalteten Gruppen via localStorage
//    (Format: string[] der ge-OEFFNETEN Gruppen-IDs).
//  - Auto-Expand: Beim Wechsel in eine Route, deren Gruppe gefaltet
//    ist, klappt die Gruppe einmalig auf. Manuelles Falten ueberlebt
//    weitere Wechsel innerhalb derselben Gruppe.
//  - CSS-Klassen werden ueber das Prop bemBlock dynamisch gesetzt,
//    damit bestehende CSS-Dateien der einzelnen Shells unveraendert
//    weiterverwendet werden koennen.

import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  to: string;
  label: string;
  icon?: LucideIcon;
};

export type SidebarNavGroup = {
  id: string;
  label: string;
  items: SidebarNavItem[];
};

export type SidebarBackLink = {
  to: string;
  label: string;
};

export type SidebarShellProps = {
  // BEM-Praefix, z. B. "buchhaltung-shell" oder "steuern-shell".
  bemBlock: string;
  // ARIA-Label fuer den Sidebar-<aside>.
  ariaLabel: string;
  // Reihenfolge der Gruppen entspricht Reihenfolge in der UI.
  groups: SidebarNavGroup[];
  // Optionaler Schluessel fuer localStorage-Persistenz.
  // Beispiel: "harouda:buchhaltung:nav-expanded".
  // Format: string[] der ge-OEFFNETEN Gruppen-IDs.
  // Vorteil: keine verwaisten Eintraege, wenn Gruppen geloescht
  // oder umbenannt werden.
  // Wenn weggelassen: keine Persistenz, alle Gruppen starten gefaltet.
  storageKey?: string;
  // Optionaler Zurueck-Link oben in der Sidebar.
  backLink?: SidebarBackLink;
};

function loadExpanded(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return new Set(parsed);
    }
    return new Set();
  } catch {
    return new Set();
  }
}

function saveExpanded(storageKey: string, expanded: Set<string>): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...expanded]));
  } catch {
    /* storage full or blocked */
  }
}

function isGroupActive(group: SidebarNavGroup, pathname: string): boolean {
  return group.items.some((it) => pathname.startsWith(it.to));
}

export default function SidebarShell({
  bemBlock,
  ariaLabel,
  groups,
  storageKey,
  backLink,
}: SidebarShellProps) {
  const location = useLocation();
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    storageKey ? loadExpanded(storageKey) : new Set(),
  );

  // Persistenz bei jeder Aenderung (nur wenn storageKey gesetzt).
  useEffect(() => {
    if (storageKey) saveExpanded(storageKey, expanded);
  }, [expanded, storageKey]);

  // Auto-Expand beim Route-Wechsel:
  // Wechselt der Nutzer in eine Route, deren Gruppe gefaltet ist,
  // klappt die Gruppe einmalig auf. Manuelles Falten ueberlebt
  // weitere Wechsel innerhalb derselben Gruppe.
  useEffect(() => {
    setExpanded((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const g of groups) {
        if (isGroupActive(g, location.pathname) && !next.has(g.id)) {
          next.add(g.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [location.pathname, groups]);

  function toggleGroup(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeGroupId = useMemo(
    () => groups.find((g) => isGroupActive(g, location.pathname))?.id ?? null,
    [location.pathname, groups],
  );

  return (
    <div className={bemBlock}>
      <aside className={`${bemBlock}__sidebar`} aria-label={ariaLabel}>
        {backLink ? (
          <Link to={backLink.to} className={`${bemBlock}__back-link`}>
            {backLink.label}
          </Link>
        ) : null}
        <nav className={`${bemBlock}__nav`}>
          {groups.map((g) => {
            const isOpen = expanded.has(g.id);
            const isActive = activeGroupId === g.id;
            return (
              <div
                key={g.id}
                className={`${bemBlock}__group${isActive ? " is-active" : ""}`}
              >
                <button
                  type="button"
                  className={`${bemBlock}__group-head`}
                  onClick={() => toggleGroup(g.id)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>{g.label}</span>
                </button>
                {isOpen && (
                  <ul className={`${bemBlock}__group-list`}>
                    {g.items.map((it) => {
                      const Icon = it.icon;
                      return (
                        <li key={it.to}>
                          <NavLink
                            to={it.to}
                            className={({ isActive }) =>
                              isActive
                                ? `${bemBlock}__link ${bemBlock}__link--active`
                                : `${bemBlock}__link`
                            }
                            end
                          >
                            {Icon ? <Icon size={14} /> : null}
                            <span>{it.label}</span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      <section className={`${bemBlock}__main`}>
        <Outlet />
      </section>
    </div>
  );
}
