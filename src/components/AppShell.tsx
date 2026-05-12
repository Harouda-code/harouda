import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import { fetchClients } from "../api/clients";
import { DEMO_MODE } from "../api/supabase";
import GuidedTour from "./GuidedTour";
import { UniversalSearchModal } from "./UniversalSearchModal";
import "./AppShell.css";
import { MandantSwitch } from "./shell/MandantSwitch";
import { YearSwitch } from "./shell/YearSwitch";
import { UserPill } from "./shell/UserPill";
import { Notifications } from "./shell/Notifications";
import { QuickActions } from "./shell/QuickActions";
import { PrivacyToggle } from "./shell/PrivacyToggle";

type IconCmp = typeof LayoutDashboard;

type NavItem = {
  label: string;
  to: string | null;
  shortcut?: string;
  badge?: string;
  icon?: IconCmp;
};

type NavGroup = {
  id: string;
  title: string;
  icon: IconCmp;
  to?: string;
  items?: NavItem[];
};

const GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    title: "Arbeitsplatz",
    icon: LayoutDashboard,
    items: [
      { label: "Arbeitsplatz", to: "/arbeitsplatz" },
    ],
  },
];

const EXPAND_STORAGE_KEY = "harouda:nav-expanded";

function loadExpanded(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(EXPAND_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function isGroupActive(group: NavGroup, pathname: string): boolean {
  if (group.to) return pathname === group.to || pathname.startsWith(group.to + "/");
  return (group.items ?? []).some(
    (i) => i.to && (pathname === i.to || pathname.startsWith(i.to + "/"))
  );
}

export default function AppShell() {
  const { user, signOut } = useUser();
  const { selectedMandantId, setSelectedMandantId } = useMandant();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const navigate = useNavigate();
  const location = useLocation();

  const clientsQ = useQuery({
    queryKey: ["clients", "all"],
    queryFn: fetchClients,
  });
  const clients = clientsQ.data ?? [];
  const activeMandant = selectedMandantId
    ? clients.find((c) => c.id === selectedMandantId)
    : null;

  const [expanded, setExpanded] = useState<Record<string, boolean>>(loadExpanded);

  // Auto-Expand beim Route-Wechsel:
  // Wechselt der Nutzer in eine Route, deren Nav-Gruppe gefaltet ist,
  // klappt die Gruppe einmalig auf. Anschliessend behaelt der Nutzer die
  // Kontrolle — ein manuelles Falten ueberlebt weitere Wechsel innerhalb
  // derselben Gruppe (dieser Effect haengt nur an location.pathname).
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
        if (!g.items) continue;
        if (isGroupActive(g, location.pathname) && !next[g.id]) {
          next[g.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(EXPAND_STORAGE_KEY, JSON.stringify(expanded));
    } catch {
      /* ignore */
    }
  }, [expanded]);

  function toggleGroup(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl+1..9 → Sprung zur ersten aktiven Route der Gruppe
  // Ctrl+K / Ctrl+/ → Universelle Suche
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;

      // Universelle Suche — klappt auch, während der Nutzer tippt.
      if (e.key === "k" || e.key === "K" || e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      const n = Number(e.key);
      if (!(n >= 1 && n <= 9)) return;
      const group = GROUPS[n - 1];
      if (!group) return;
      const typingInField =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;
      if (typingInField) return;
      e.preventDefault();
      const target = group.to ?? group.items?.find((i) => i.to)?.to ?? null;
      if (target) navigate(target);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <Link to="/arbeitsplatz" className="shell__brand">
          <span className="shell__brand-mark">H</span>
          <span className="shell__brand-name">harouda</span>
        </Link>

        <nav className="shell__nav" aria-label="Hauptnavigation">
          {GROUPS.map((g, idx) => {
            const Icon = g.icon;
            const shortcut = `Strg+${idx + 1}`;
            const active = isGroupActive(g, location.pathname);

            if (g.to) {
              return (
                <NavLink
                  key={g.id}
                  to={g.to}
                  end={g.to === "/dashboard"}
                  className={({ isActive }) =>
                    `shell__nav-link${isActive ? " is-active" : ""}`
                  }
                  title={`${g.title} (${shortcut})`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span>{g.title}</span>
                </NavLink>
              );
            }

            const isOpen = expanded[g.id] ?? active;

            return (
              <div
                key={g.id}
                className={`shell__nav-group${active ? " is-active" : ""}`}
              >
                <button
                  type="button"
                  className="shell__nav-group-head"
                  aria-expanded={isOpen}
                  onClick={() => toggleGroup(g.id)}
                  title={`${g.title} (${shortcut})`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span>{g.title}</span>
                  {isOpen ? (
                    <ChevronDown size={14} className="shell__nav-chev" />
                  ) : (
                    <ChevronRight size={14} className="shell__nav-chev" />
                  )}
                </button>
                {isOpen && (
                  <ul className="shell__nav-sub">
                    {(g.items ?? []).map((it) =>
                      it.to ? (
                        <li key={it.label}>
                          <NavLink
                            to={it.to}
                            className={({ isActive }) =>
                              `shell__nav-item${isActive ? " is-active" : ""}`
                            }
                            title={it.shortcut ?? it.label}
                          >
                            <span>{it.label}</span>
                            {it.shortcut && (
                              <kbd className="shell__nav-kbd">{it.shortcut}</kbd>
                            )}
                          </NavLink>
                        </li>
                      ) : (
                        <li key={it.label} className="shell__nav-disabled">
                          <span>{it.label}</span>
                          {it.badge && (
                            <span className="shell__nav-badge">{it.badge}</span>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="shell__sidebar-foot">
          <UserPill user={user} onSignOut={handleSignOut} />
        </div>
      </aside>

      <main className="shell__main">
        <div className="shell__topbar no-print" role="toolbar" aria-label="Globalfilter">
          <MandantSwitch
            active={activeMandant ?? null}
            onChange={setSelectedMandantId}
            clients={clients}
          />

          <div className="shell__topbar-right">
            <YearSwitch
              year={selectedYear}
              years={availableYears}
              onChange={setSelectedYear}
            />
            <QuickActions />
            <PrivacyToggle />
            <Notifications />
          </div>
        </div>

        <div className="shell__content">
          <Outlet />
        </div>
      </main>

      {DEMO_MODE && <GuidedTour autoStart />}

      <UniversalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------



