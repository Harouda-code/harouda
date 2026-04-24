// Fullscreen-Arbeitsplatz (Post-Login-Einstieg).
//
// Schritt 4 des 7-stufigen Arbeitsplatz-Sprints: mittlere Spalte trägt
// jetzt Header (h2 + Plus-Icon-Button), Such-Leiste und eine
// eigenständig scrollbare Mandanten-Tabelle. Die URL-Query `?mandantId=`
// ist die einzige Wahrheit für den aktiven Mandanten innerhalb dieser
// Seite — MandantContext bleibt in diesem Schritt bewusst unberührt
// (separater späterer Sprint).

import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FileBarChart,
  FileText,
  Inbox,
  MousePointer2,
  Plus,
  Receipt,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { fetchClients } from "../api/clients";
import type { Client } from "../types/db";
import "./ArbeitsplatzPage.css";

type KanzleiNavItem = {
  label: string;
  to: string;
  icon: typeof Settings;
  testId: string;
};

const KANZLEI_NAV: KanzleiNavItem[] = [
  {
    label: "Kanzlei-Einstellungen",
    to: "/einstellungen",
    icon: Settings,
    testId: "arbeitsplatz-nav-einstellungen",
  },
  {
    label: "Mitarbeiterverwaltung",
    to: "/einstellungen/benutzer",
    icon: Users,
    testId: "arbeitsplatz-nav-mitarbeiter",
  },
];

// --- Mein Tag (linke Spalte, oberer Block) -------------------------------
//
// Drei Schnellzugriffe für den Arbeitsalltag. Fristen + Posteingang sind
// echte Routes (DeadlinesPage / DocumentsPage). Aufgaben hat aktuell keine
// Route — `to: null` markiert den Eintrag als nicht-klickbar (visueller
// Platzhalter), bis das Aufgaben-Modul in einem späteren Sprint angebunden
// wird. Badges (Anzahl offener Fristen etc.) werden in einem separaten
// Sprint aus der DB nachgeladen — bewusst hier nicht in MVP.

type MeinTagItem = {
  label: string;
  to: string | null;
  icon: typeof Settings;
  testId: string;
};

const MEIN_TAG: MeinTagItem[] = [
  {
    label: "Fristen",
    to: "/einstellungen/fristen",
    icon: AlertCircle,
    testId: "arbeitsplatz-meintag-fristen",
  },
  {
    label: "Posteingang",
    to: "/belege",
    icon: Inbox,
    testId: "arbeitsplatz-meintag-posteingang",
  },
  {
    label: "Meine Aufgaben",
    to: null,
    icon: CheckSquare,
    testId: "arbeitsplatz-meintag-aufgaben",
  },
];

const SEARCH_PLACEHOLDER = "Suche nach Name oder Mand.-Nr.";

// --- Programme-Baum (rechte Spalte) ---------------------------------------
//
// Fünf Module mit je einem Haupt-Link + einklappbarer Sub-Item-Liste.
// Das Accordion-Muster folgt `components/AppShell.tsx:235-253, 303-379`
// (inline-Copy bewusst, siehe Abschluss-Doku — Tech-Debt-Notiz). Sub-Items
// mit Status FEHLT (lt. Bestandsaufnahme Schritt 1) sind nicht enthalten
// — keine „disabled"-States, keine „Bald verfügbar"-Platzhalter. Sub-Items
// mit Status TEILWEISE (Zugänge/Abgänge ohne Umbuchungen) verlinken auf
// die bestehende Shared-Route.
//
// Modul-Icons:
//   BookOpen (Rechnungswesen)   — wie AppShell-Buchführungsgruppe Z.81
//   FileBarChart (Anlagen)      — wie AppShell-Anlagenverzeichnis Z.91-92
//   FileText (Einkommensteuer)  — Tax-Form-Konvention
//   Receipt (Umsatzsteuer)      — wie AppShell-Steuer-Gruppe Z.113
//   Users (Lohn)                — AppShell hat beides (Users + UserCircle2);
//                                 `Users` ist klarer für „Lohn und Gehalt"

type TreeSubItem = {
  label: string;
  path: string;
  testId: string;
};

type TreeModule = {
  id: string;
  title: string;
  icon: typeof BookOpen;
  mainPath: string;
  headerTestId: string;
  subItems: TreeSubItem[];
};

const TREE_MODULES: TreeModule[] = [
  {
    id: "rechnungswesen",
    title: "Kanzlei-Rechnungswesen",
    icon: BookOpen,
    mainPath: "/buchfuehrung",
    headerTestId: "arbeitsplatz-launcher-rewe",
    subItems: [
      {
        label: "Buchungsjournal",
        path: "/journal",
        testId: "arbeitsplatz-tree-rewe-journal",
      },
      {
        label: "Gewinn- und Verlustrechnung",
        path: "/berichte/guv",
        testId: "arbeitsplatz-tree-rewe-guv",
      },
      {
        label: "Bilanz",
        path: "/berichte/bilanz",
        testId: "arbeitsplatz-tree-rewe-bilanz",
      },
      {
        label: "BWA",
        path: "/berichte/bwa",
        testId: "arbeitsplatz-tree-rewe-bwa",
      },
      {
        label: "Summen- und Saldenliste",
        path: "/berichte/susa",
        testId: "arbeitsplatz-tree-rewe-susa",
      },
      {
        label: "Jahresabschluss",
        path: "/berichte/jahresabschluss",
        testId: "arbeitsplatz-tree-rewe-jahresabschluss",
      },
      {
        label: "Jahresabschluss-Wizard",
        path: "/jahresabschluss/wizard",
        testId: "arbeitsplatz-tree-rewe-jahresabschluss-wizard",
      },
    ],
  },
  {
    id: "anlagen",
    title: "Anlagenbuchführung",
    icon: FileBarChart,
    mainPath: "/anlagen/verzeichnis",
    headerTestId: "arbeitsplatz-launcher-anlagen",
    subItems: [
      {
        label: "Anlagenspiegel",
        path: "/berichte/anlagenspiegel",
        testId: "arbeitsplatz-tree-anlagen-spiegel",
      },
      {
        label: "Inventarübersicht",
        path: "/anlagen/verzeichnis",
        testId: "arbeitsplatz-tree-anlagen-inventar",
      },
      // Zugänge + Abgänge sind in AnlagenVerzeichnisPage integriert;
      // Umbuchungen (FEHLT) bewusst weggelassen (TEILWEISE-Fix).
      {
        label: "Zugänge / Abgänge",
        path: "/anlagen/verzeichnis",
        testId: "arbeitsplatz-tree-anlagen-bewegungen",
      },
      {
        label: "Abschreibungen (AfA)",
        path: "/anlagen/afa-lauf",
        testId: "arbeitsplatz-tree-anlagen-afa",
      },
    ],
  },
  {
    id: "einkommensteuer",
    title: "Einkommensteuer",
    icon: FileText,
    mainPath: "/steuer/est-1a",
    headerTestId: "arbeitsplatz-launcher-einkommensteuer",
    subItems: [
      {
        label: "Mantelbogen ESt 1 A",
        path: "/steuer/est-1a",
        testId: "arbeitsplatz-tree-est-mantel",
      },
      {
        label: "Anlage N",
        path: "/steuer/anlage-n",
        testId: "arbeitsplatz-tree-est-n",
      },
      {
        label: "Anlage G",
        path: "/steuer/anlage-g",
        testId: "arbeitsplatz-tree-est-g",
      },
      {
        label: "Anlage S",
        path: "/steuer/anlage-s",
        testId: "arbeitsplatz-tree-est-s",
      },
      {
        label: "Anlage V",
        path: "/steuer/anlage-v",
        testId: "arbeitsplatz-tree-est-v",
      },
      {
        label: "Anlage KAP",
        path: "/steuer/anlage-kap",
        testId: "arbeitsplatz-tree-est-kap",
      },
      {
        label: "Sonderausgaben",
        path: "/steuer/anlage-sonder",
        testId: "arbeitsplatz-tree-est-sonder",
      },
      {
        label: "Außergewöhnliche Belastungen",
        path: "/steuer/anlage-agb",
        testId: "arbeitsplatz-tree-est-agb",
      },
    ],
  },
  {
    id: "umsatzsteuer",
    title: "Umsatzsteuer",
    icon: Receipt,
    mainPath: "/steuer/ustva",
    headerTestId: "arbeitsplatz-launcher-umsatzsteuer",
    subItems: [
      {
        label: "UStVA",
        path: "/steuer/ustva",
        testId: "arbeitsplatz-tree-ust-ustva",
      },
      {
        label: "Zusammenfassende Meldung",
        path: "/steuer/zm",
        testId: "arbeitsplatz-tree-ust-zm",
      },
    ],
  },
  {
    id: "lohn",
    title: "Lohn und Gehalt",
    icon: Users,
    mainPath: "/lohn",
    headerTestId: "arbeitsplatz-launcher-lohn",
    subItems: [
      {
        label: "Mitarbeiter-Stammdaten",
        path: "/personal/mitarbeiter",
        testId: "arbeitsplatz-tree-lohn-mitarbeiter",
      },
      {
        label: "Lohn- und Gehaltsabrechnung",
        path: "/lohn",
        testId: "arbeitsplatz-tree-lohn-kalkulator",
      },
      {
        label: "Massen-Lauf (Abrechnung)",
        path: "/personal/abrechnung",
        testId: "arbeitsplatz-tree-lohn-massenlauf",
      },
      {
        label: "Lohnsteuer-Anmeldung",
        path: "/lohn/lohnsteueranmeldung",
        testId: "arbeitsplatz-tree-lohn-lsta",
      },
    ],
  },
];

const TREE_EXPAND_STORAGE_KEY = "harouda:arbeitsplatz-tree-expanded";

function loadTreeExpanded(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(TREE_EXPAND_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function initialTreeExpanded(): Record<string, boolean> {
  const stored = loadTreeExpanded();
  const init: Record<string, boolean> = {};
  for (const m of TREE_MODULES) {
    // Default-Expanded beim ersten Besuch; gespeicherte Werte gewinnen.
    init[m.id] = stored[m.id] ?? true;
  }
  return init;
}

function buildMandantLink(path: string, mandantId: string): string {
  return `${path}?mandantId=${encodeURIComponent(mandantId)}`;
}

function filterClients(clients: Client[], query: string): Client[] {
  const q = query.trim().toLowerCase();
  if (!q) return clients;
  return clients.filter((c) => {
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.mandant_nr.toLowerCase().includes(q)) return true;
    if (c.ust_id && c.ust_id.toLowerCase().includes(q)) return true;
    if (c.steuernummer && c.steuernummer.toLowerCase().includes(q)) return true;
    return false;
  });
}

export default function ArbeitsplatzPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const clientsQ = useQuery({
    queryKey: ["clients", "all"],
    queryFn: fetchClients,
  });

  const clients = clientsQ.data ?? [];
  const rawActiveId = searchParams.get("mandantId");
  // Nur eine real existierende ID gilt als aktiv. Unbekannte ?mandantId=…
  // werden stillschweigend ignoriert (siehe useEffect unten für console.warn).
  const activeId =
    rawActiveId && clients.some((c) => c.id === rawActiveId)
      ? rawActiveId
      : null;

  useEffect(() => {
    if (!rawActiveId) return;
    if (clientsQ.isLoading) return;
    if (clients.length === 0) return;
    if (clients.some((c) => c.id === rawActiveId)) return;
    console.warn(
      `Arbeitsplatz: ?mandantId=${rawActiveId} verweist auf keinen bekannten Mandanten — Query wird ignoriert.`
    );
  }, [rawActiveId, clients, clientsQ.isLoading]);

  const filtered = useMemo(
    () => filterClients(clients, query),
    [clients, query]
  );

  function selectMandant(id: string) {
    if (activeId === id) return; // no-op: identische Auswahl
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("mandantId", id);
        return next;
      },
      { replace: true }
    );
  }

  function onRowKeyDown(e: ReactKeyboardEvent<HTMLTableRowElement>, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectMandant(id);
    }
  }

  return (
    <div className="arbeitsplatz" data-testid="arbeitsplatz-root">
      <div className="arbeitsplatz__grid">
        <section
          className="arbeitsplatz__col arbeitsplatz__col--left"
          data-testid="arbeitsplatz-col-left"
          aria-label="Mein Arbeitsplatz"
        >
          <div
            className="arbeitsplatz__section-header"
            data-testid="arbeitsplatz-section-meintag"
          >
            Mein Tag
          </div>
          <nav aria-label="Mein-Tag-Navigation">
            <ul className="arbeitsplatz__nav">
              {MEIN_TAG.map((item) => {
                const Icon = item.icon;
                if (item.to === null) {
                  return (
                    <li key={item.testId}>
                      <span
                        className="arbeitsplatz__nav-link arbeitsplatz__nav-link--disabled"
                        data-testid={item.testId}
                        aria-disabled="true"
                        title="Bald verfügbar"
                      >
                        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                        <span>{item.label}</span>
                      </span>
                    </li>
                  );
                }
                // DATEV-Muster: Wenn ein Mandant in Arbeit ist, wird die
                // mandantId an die Zielseite mitgegeben — analog zur
                // rechten Spalte (Programme-Baum). Ohne aktiven Mandanten
                // bleibt der Link kanzleiweit. Die Zielseite (DeadlinesPage,
                // DocumentsPage) entscheidet selbst, ob sie nach mandantId
                // filtert oder den Parameter ignoriert.
                const targetTo = activeId
                  ? buildMandantLink(item.to, activeId)
                  : item.to;
                return (
                  <li key={item.testId}>
                    <NavLink
                      to={targetTo}
                      data-testid={item.testId}
                      className={({ isActive }) =>
                        `arbeitsplatz__nav-link${
                          isActive ? " arbeitsplatz__nav-link--active" : ""
                        }`
                      }
                    >
                      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div
            className="arbeitsplatz__section-header arbeitsplatz__section-header--with-spacing"
            data-testid="arbeitsplatz-section-kanzlei"
          >
            Kanzlei
          </div>
          <nav aria-label="Kanzlei-Navigation">
            <ul className="arbeitsplatz__nav">
              {KANZLEI_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      data-testid={item.testId}
                      className={({ isActive }) =>
                        `arbeitsplatz__nav-link${
                          isActive ? " arbeitsplatz__nav-link--active" : ""
                        }`
                      }
                    >
                      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </section>

        <section
          className="arbeitsplatz__col arbeitsplatz__col--center"
          data-testid="arbeitsplatz-col-center"
          aria-label="Mandantenübersicht"
        >
          <div className="arbeitsplatz__col-header">
            <h2>Mandantenübersicht</h2>
            <button
              type="button"
              className="arbeitsplatz__add-btn"
              onClick={() => navigate("/mandanten/neu")}
              aria-label="Neuen Mandanten anlegen"
              title="Neuen Mandanten anlegen"
              data-testid="arbeitsplatz-add-mandant"
            >
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <label
            className="arbeitsplatz__search"
            data-testid="arbeitsplatz-search"
          >
            <Search size={14} strokeWidth={1.75} aria-hidden="true" />
            <input
              type="search"
              className="arbeitsplatz__search-input"
              placeholder={SEARCH_PLACEHOLDER}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={SEARCH_PLACEHOLDER}
              data-testid="arbeitsplatz-search-input"
            />
          </label>

          {clientsQ.isLoading ? (
            <p
              className="arbeitsplatz__state"
              data-testid="arbeitsplatz-state-loading"
            >
              Mandanten werden geladen…
            </p>
          ) : clientsQ.isError ? (
            <p
              className="arbeitsplatz__state arbeitsplatz__state--error"
              role="alert"
              data-testid="arbeitsplatz-state-error"
            >
              Mandanten konnten nicht geladen werden.
            </p>
          ) : filtered.length === 0 ? (
            <p
              className="arbeitsplatz__state"
              data-testid="arbeitsplatz-state-empty"
            >
              {clients.length === 0
                ? "Keine Mandanten gefunden."
                : "Keine Mandanten passen zur Suche."}
            </p>
          ) : (
            <table
              className="arbeitsplatz__table"
              data-testid="arbeitsplatz-mandant-table"
            >
              <thead>
                <tr>
                  <th scope="col">Mand.-Nr.</th>
                  <th scope="col">Name</th>
                  <th scope="col">Rechtsform</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isActive = activeId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className={`arbeitsplatz__table-row${
                        isActive ? " arbeitsplatz__table-row--active" : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-selected={isActive}
                      data-testid={`arbeitsplatz-mandant-row-${c.id}`}
                      onClick={() => selectMandant(c.id)}
                      onKeyDown={(e) => onRowKeyDown(e, c.id)}
                    >
                      <td>{c.mandant_nr}</td>
                      <td>{c.name}</td>
                      <td>—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section
          className="arbeitsplatz__col arbeitsplatz__col--right"
          data-testid="arbeitsplatz-col-right"
          aria-label="Programme und Akte"
        >
          {activeId ? (
            <LauncherActive
              client={clients.find((c) => c.id === activeId)!}
              mandantId={activeId}
            />
          ) : (
            <LauncherEmpty />
          )}
        </section>
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------

function LauncherEmpty() {
  return (
    <div
      className="arbeitsplatz__launcher-empty"
      data-testid="arbeitsplatz-launcher-empty"
    >
      <MousePointer2 size={28} strokeWidth={1.5} aria-hidden="true" />
      <p>Bitte einen Mandanten aus der Liste auswählen</p>
    </div>
  );
}

function LauncherActive({
  client,
  mandantId,
}: {
  client: Client;
  mandantId: string;
}) {
  // Expanded-State pro Modul. localStorage-Persistenz: Key
  // `harouda:arbeitsplatz-tree-expanded` (eigener Key, nicht geteilt mit
  // AppShell-Nav). Initial: alle 5 Module expanded.
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    initialTreeExpanded
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        TREE_EXPAND_STORAGE_KEY,
        JSON.stringify(expanded)
      );
    } catch {
      /* ignore — localStorage ist best-effort für Persistenz */
    }
  }, [expanded]);

  function toggleModule(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div
      className="arbeitsplatz__launcher"
      data-testid="arbeitsplatz-launcher-active"
    >
      <div
        className="arbeitsplatz__mandant-card"
        data-testid="arbeitsplatz-mandant-card"
      >
        <div className="arbeitsplatz__mandant-card-nr">
          {client.mandant_nr}
        </div>
        <div className="arbeitsplatz__mandant-card-name">{client.name}</div>
      </div>

      <nav
        className="arbeitsplatz__tree"
        aria-label="Programme und Akte"
        data-testid="arbeitsplatz-tree"
      >
        {TREE_MODULES.map((module) => {
          const isOpen = expanded[module.id] ?? true;
          const ModuleIcon = module.icon;
          return (
            <section
              key={module.id}
              className={`arbeitsplatz__tree-module${
                isOpen ? " is-open" : ""
              }`}
              data-testid={`arbeitsplatz-tree-module-${module.id}`}
            >
              <div className="arbeitsplatz__tree-module-header">
                <Link
                  to={buildMandantLink(module.mainPath, mandantId)}
                  className="arbeitsplatz__tree-module-label"
                  data-testid={module.headerTestId}
                >
                  <ModuleIcon
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>{module.title}</span>
                </Link>
                <button
                  type="button"
                  className="arbeitsplatz__tree-chevron-btn"
                  onClick={() => toggleModule(module.id)}
                  aria-expanded={isOpen}
                  aria-controls={`arbeitsplatz-tree-sublist-${module.id}`}
                  aria-label={
                    isOpen
                      ? `${module.title} einklappen`
                      : `${module.title} ausklappen`
                  }
                  data-testid={`arbeitsplatz-tree-toggle-${module.id}`}
                >
                  {isOpen ? (
                    <ChevronDown
                      size={14}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronRight
                      size={14}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>

              {isOpen && (
                <ul
                  id={`arbeitsplatz-tree-sublist-${module.id}`}
                  className="arbeitsplatz__tree-sublist"
                  data-testid={`arbeitsplatz-tree-sublist-${module.id}`}
                >
                  {module.subItems.map((sub) => (
                    <li key={sub.testId}>
                      <Link
                        to={buildMandantLink(sub.path, mandantId)}
                        className="arbeitsplatz__tree-sub-link"
                        data-testid={sub.testId}
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </nav>
    </div>
  );
}
