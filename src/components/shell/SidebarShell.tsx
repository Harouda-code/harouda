// src/components/shell/SidebarShell.tsx
//
// Wiederverwendbare Sidebar-Komponente fuer Modul-Shells
// (SteuernShell, UmsatzsteuerShell, JahresabschlussShell).
//
// Liefert eine linke Sidebar mit Gruppen und einen <Outlet />
// fuer die jeweilige Modul-Seite.
//
// CSS-Klassen werden ueber das Prop bemBlock dynamisch gesetzt,
// damit die bestehenden CSS-Dateien der einzelnen Shells
// unveraendert weiterverwendet werden koennen.

import { Link, NavLink, Outlet } from "react-router-dom";

export type SidebarNavItem = {
  to: string;
  label: string;
};

export type SidebarNavGroup = {
  id: string;
  title: string;
  items: SidebarNavItem[];
};

export type SidebarBackLink = {
  to: string;
  label: string;
};

export type SidebarShellProps = {
  // BEM-Praefix, z. B. "steuern-shell" oder "umsatzsteuer-shell".
  bemBlock: string;
  // ARIA-Label fuer den Sidebar-<aside>.
  ariaLabel: string;
  // Reihenfolge der Gruppen entspricht der Reihenfolge in der Sidebar.
  groups: SidebarNavGroup[];
  // Optionaler Zurueck-Link oben in der Sidebar.
  backLink?: SidebarBackLink;
};

export default function SidebarShell({
  bemBlock,
  ariaLabel,
  groups,
  backLink,
}: SidebarShellProps) {
  return (
    <div className={bemBlock}>
      <aside
        className={`${bemBlock}__sidebar`}
        aria-label={ariaLabel}
      >
        {backLink ? (
          <Link to={backLink.to} className={`${bemBlock}__back-link`}>
            {backLink.label}
          </Link>
        ) : null}

        <nav className={`${bemBlock}__nav`}>
          {groups.map((group) => (
            <div key={group.id} className={`${bemBlock}__group`}>
              <h3 className={`${bemBlock}__group-title`}>{group.title}</h3>
              <ul className={`${bemBlock}__group-list`}>
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        isActive
                          ? `${bemBlock}__link ${bemBlock}__link--active`
                          : `${bemBlock}__link`
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

      <section className={`${bemBlock}__main`}>
        <Outlet />
      </section>
    </div>
  );
}
