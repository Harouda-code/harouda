import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileBarChart,
  FileCheck2,
  FileText,
  Hash,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Plus,
  Receipt,
  Settings,
  TrendingUp,
  UserCircle2,
  Users,
  Wallet,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import { fetchClients } from "../api/clients";
import { DEMO_MODE } from "../api/supabase";
import { deriveNotifications } from "../api/notifications";
import GuidedTour from "./GuidedTour";
import { UniversalSearchModal } from "./UniversalSearchModal";
import { usePrivacy } from "../contexts/PrivacyContext";
import "./AppShell.css";

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
      { label: "Berater (alle Firmen)", to: "/berater/dashboard" },
    ],
  },
  {
    id: "buchfuehrung",
    title: "Buchführung",
    icon: BookOpen,
    items: [
      { label: "Journal", to: "/journal", icon: ListOrdered, shortcut: "Strg+J" },
      { label: "Kontenplan", to: "/konten", icon: Hash, shortcut: "Strg+K" },
      { label: "Offene Posten", to: "/opos", icon: Wallet, shortcut: "Strg+O" },
      { label: "Liquiditätsvorschau", to: "/liquiditaet", icon: TrendingUp },
      { label: "Mahnwesen", to: "/mahnwesen", icon: AlertTriangle },
      { label: "Bankimport", to: "/bankimport", icon: Landmark },
      { label: "Bank-Abstimmung", to: "/banking/reconciliation", icon: Landmark },
      { label: "Beleg-Anforderungen", to: "/banking/belegabfragen", icon: Landmark },
      { label: "EÜR-Hub", to: "/buchfuehrung", icon: FileBarChart },
      { label: "Anlagenverzeichnis", to: "/anlagen/verzeichnis", icon: FileBarChart },
      { label: "AfA-Lauf", to: "/anlagen/afa-lauf", icon: FileBarChart },
    ],
  },
  {
    id: "berichte",
    title: "Berichte",
    icon: BarChart3,
    items: [
      { label: "Bilanz", to: "/berichte/bilanz" },
      { label: "GuV", to: "/berichte/guv" },
      { label: "Jahresabschluss", to: "/berichte/jahresabschluss" },
      {
        label: "Jahresabschluss-Wizard",
        to: "/jahresabschluss/wizard",
        icon: FileCheck2,
      },
      { label: "Vorjahresvergleich", to: "/berichte/vorjahresvergleich" },
      { label: "BWA", to: "/berichte/bwa" },
      { label: "SuSa", to: "/berichte/susa" },
      { label: "Dimensionen (KST/KTR)", to: "/berichte/dimensionen" },
      { label: "Anlagenspiegel (§ 284 HGB)", to: "/berichte/anlagenspiegel" },
      { label: "EÜR", to: "/steuer/euer" },
    ],
  },
  {
    id: "steuer",
    title: "Steuerformulare",
    icon: Receipt,
    items: [
      { label: "Belegerfassung (§ 14 UStG)", to: "/buchungen/erfassung" },
      { label: "Belege-Liste", to: "/buchungen/belege" },
      { label: "Formular-Übersicht", to: "/steuer" },
      { label: "UStVA (§ 18 UStG)", to: "/steuer/ustva" },
      { label: "ZM (§ 18a UStG)", to: "/steuer/zm" },
      { label: "E-Bilanz (§ 5b EStG)", to: "/steuer/ebilanz" },
      { label: "Z3-Datenexport (§ 147 AO)", to: "/admin/z3-export" },
      { label: "ELSTER-Übertragung", to: "/steuern/elster", icon: Landmark },
    ],
  },
  {
    id: "lohn",
    title: "Lohn & Gehalt",
    icon: Receipt,
    items: [
      { label: "Kalkulator", to: "/lohn" },
      { label: "Lohnsteuer-Anmeldung (§ 41a)", to: "/lohn/lohnsteueranmeldung" },
      { label: "Abrechnungs-Archiv (GoBD)", to: "/lohn/archiv" },
    ],
  },
  {
    id: "compliance",
    title: "Compliance & Export",
    icon: Landmark,
    items: [
      { label: "Kanzlei-Dashboard", to: "/kanzlei-dashboard" },
      { label: "Audit-Trail (GoBD)", to: "/admin/audit" },
      { label: "Z3-Datenexport (§ 147 AO)", to: "/admin/z3-export" },
      { label: "Datenexport (DSGVO Art. 20)", to: "/admin/datenexport" },
      { label: "DATEV-Export", to: "/export/datev" },
    ],
  },
  {
    id: "stammdaten",
    title: "Stammdaten",
    icon: Users,
    items: [
      { label: "Mandanten (Kanzlei)", to: "/mandanten" },
      { label: "Debitoren (Kunden)", to: "/debitoren", icon: Users },
      { label: "Kreditoren (Lieferanten)", to: "/kreditoren", icon: Users },
      { label: "Artikel", to: null, badge: "in Vorbereitung" },
    ],
  },
  {
    id: "personal",
    title: "Lohn & Gehalt",
    icon: UserCircle2,
    items: [
      { label: "Mitarbeiter", to: "/personal/mitarbeiter", icon: UserCircle2 },
      { label: "Lohn-Vorschau", to: "/personal/abrechnung", icon: Calendar },
    ],
  },
  {
    id: "dokumente",
    title: "Dokumente",
    icon: FileText,
    items: [
      { label: "Belege", to: "/belege", icon: FileText },
      { label: "E-Rechnung (§ 14 UStG)", to: "/buchungen/e-rechnung", icon: BadgeCheck },
      { label: "E-Rechnung (ZUGFeRD)", to: "/zugferd", icon: BadgeCheck },
      { label: "E-Rechnung-Archiv", to: "/e-rechnung/archiv", icon: BadgeCheck },
      { label: "Dokument-Scanner (OCR)", to: "/ai/scanner", icon: FileText },
      { label: "DATEV-Export", to: "/export/datev", icon: FileText },
      { label: "PDF-Werkzeuge", to: "/werkzeuge/pdf", icon: FileText },
    ],
  },
  {
    id: "einstellungen",
    title: "Einstellungen",
    icon: Settings,
    items: [
      { label: "Firma & Datenhaltung", to: "/einstellungen" },
      { label: "Kostenstellen", to: "/einstellungen/kostenstellen" },
      { label: "Kostenträger", to: "/einstellungen/kostentraeger" },
      { label: "Benutzer & Rollen", to: "/einstellungen/benutzer" },
      { label: "Prüfer-Dashboard", to: "/pruefer" },
      { label: "Verfahrensdokumentation", to: "/einstellungen/verfahrensdoku" },
      { label: "System-Status", to: "/einstellungen/systemstatus" },
      { label: "System-Log (Technik)", to: "/einstellungen/systemlog" },
      { label: "Audit-Log", to: "/einstellungen/audit" },
      { label: "Fristenkalender", to: "/einstellungen/fristen" },
      { label: "Aufbewahrungsfristen", to: "/einstellungen/aufbewahrung" },
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

  useEffect(() => {
    for (const g of GROUPS) {
      if (!g.items) continue;
      if (isGroupActive(g, location.pathname) && !expanded[g.id]) {
        setExpanded((prev) => ({ ...prev, [g.id]: true }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

function MandantSwitch({
  active,
  clients,
  onChange,
}: {
  active: { id: string; mandant_nr: string; name: string } | null;
  clients: { id: string; mandant_nr: string; name: string }[];
  onChange: (id: string | null) => void;
}) {
  return (
    <label className="shell__mandantpill" title="Aktiver Mandant">
      <Building2 size={14} />
      <select
        value={active?.id ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Mandant wählen"
      >
        <option value="">Alle Mandanten</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.mandant_nr} · {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function YearSwitch({
  year,
  years,
  onChange,
}: {
  year: number;
  years: number[];
  onChange: (y: number) => void;
}) {
  return (
    <label className="shell__year" title="Geschäftsjahr wechseln">
      <Calendar size={14} />
      <span className="shell__year-label">Geschäftsjahr</span>
      <select
        value={year}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Geschäftsjahr wählen"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuickActions() {
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

const DISMISS_STORAGE_KEY = "harouda:notifications:dismissed";

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>): void {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage full or blocked */
  }
}

function PrivacyToggle() {
  const { isPrivate, toggle } = usePrivacy();
  return (
    <button
      type="button"
      className="shell__dd-trigger"
      onClick={toggle}
      aria-pressed={isPrivate}
      title={
        isPrivate
          ? "Privacy-Modus deaktivieren (Strg+Umschalt+P)"
          : "Privacy-Modus aktivieren (Strg+Umschalt+P)"
      }
      aria-label={
        isPrivate ? "Privacy-Modus deaktivieren" : "Privacy-Modus aktivieren"
      }
      style={
        isPrivate
          ? {
              background: "var(--gold)",
              color: "var(--navy-900)",
              borderColor: "var(--gold)",
            }
          : undefined
      }
    >
      {isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const allItems = useMemo(
    () => (open ? deriveNotifications() : []),
    [open]
  );
  const active = useMemo(
    () => allItems.filter((n) => !dismissed.has(n.id)),
    [allItems, dismissed]
  );
  const dismissedItems = useMemo(
    () => allItems.filter((n) => dismissed.has(n.id)),
    [allItems, dismissed]
  );

  const [count, setCount] = useState(0);
  useEffect(() => {
    try {
      const live = deriveNotifications();
      setCount(live.filter((n) => !dismissed.has(n.id)).length);
    } catch {
      /* ignore */
    }
  }, [open, dismissed]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  function handleItemClick(to: string) {
    setOpen(false);
    navigate(to);
  }

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  }

  function restore(id: string) {
    const next = new Set(dismissed);
    next.delete(id);
    setDismissed(next);
    saveDismissed(next);
  }

  function clearDismissed() {
    setDismissed(new Set());
    saveDismissed(new Set());
  }

  return (
    <div className="shell__dd" ref={ref}>
      <button
        type="button"
        className="shell__dd-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Benachrichtigungen"
        aria-label={`Benachrichtigungen (${count})`}
      >
        <Bell size={16} />
        {count > 0 && <span className="shell__dd-badge">{count}</span>}
      </button>
      {open && (
        <div className="shell__dd-menu shell__dd-menu--wide">
          <header className="shell__dd-head">
            <strong>Benachrichtigungen</strong>
            <small>Aus Live-Daten abgeleitet</small>
          </header>
          {active.length === 0 ? (
            <div className="shell__dd-empty">
              <Clock size={18} />
              <p>Keine offenen Hinweise — Ihre Unterlagen sind im grünen Bereich.</p>
            </div>
          ) : (
            active.map((n) => (
              <div
                key={n.id}
                className={`shell__dd-item shell__dd-notif is-${n.severity}`}
              >
                <button
                  type="button"
                  onClick={() => handleItemClick(n.to)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                >
                  <strong>{n.title}</strong>
                  <small style={{ display: "block" }}>{n.detail}</small>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss(n.id);
                  }}
                  title="Als gelesen markieren"
                  aria-label="Als gelesen markieren"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "var(--muted)",
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}

          {dismissedItems.length > 0 && (
            <div className="shell__dd-section">
              <button
                type="button"
                onClick={() => setShowDismissed((v) => !v)}
                className="shell__dd-section-toggle"
              >
                {showDismissed ? "▾" : "▸"} Gelesene Hinweise (
                {dismissedItems.length})
              </button>
              {showDismissed && (
                <>
                  {dismissedItems.map((n) => (
                    <div
                      key={n.id}
                      className="shell__dd-item shell__dd-notif"
                      style={{ opacity: 0.55 }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong>{n.title}</strong>
                        <small style={{ display: "block" }}>{n.detail}</small>
                      </div>
                      <button
                        type="button"
                        onClick={() => restore(n.id)}
                        title="Wieder anzeigen"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--navy)",
                          fontSize: "0.76rem",
                        }}
                      >
                        wiederherstellen
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={clearDismissed}
                    className="shell__dd-section-clear"
                  >
                    Alle als ungelesen markieren
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserPill({
  user,
  onSignOut,
}: {
  user: { email?: string | null } | null;
  onSignOut: () => void;
}) {
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
