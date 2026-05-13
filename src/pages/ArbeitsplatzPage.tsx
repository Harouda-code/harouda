// Fullscreen-Arbeitsplatz (Post-Login-Einstieg).
//
// Schritt 4 des 7-stufigen Arbeitsplatz-Sprints: mittlere Spalte trägt
// jetzt Header (h2 + Plus-Icon-Button), Such-Leiste und eine
// eigenständig scrollbare Mandanten-Tabelle. Quelle für den aktiven
// Mandanten ist `useMandant()` (URL-primary mit localStorage-Fallback);
// die Seite ergänzt nur eine zusätzliche Validierung gegen die
// geladene Mandantenliste.

import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMandant } from "../contexts/MandantContext";
import {
  AlertCircle,
  BookOpen,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FileBarChart,
  FileCheck2,
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
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { summarizeOpenItems } from "../api/opos";
import { countMatchesByStatus } from "../api/bankReconciliationMatches";
import type { Client } from "../types/db";
import "./ArbeitsplatzPage.css";

const EUR_FMT = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

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
// Das Accordion-Muster ist lokal in dieser Seite gekapselt. Sub-Items
// mit Status FEHLT (lt. Bestandsaufnahme Schritt 1) sind nicht enthalten
// — keine „disabled"-States, keine „Bald verfügbar"-Platzhalter. Sub-Items
// mit Status TEILWEISE (Zugänge/Abgänge ohne Umbuchungen) verlinken auf
// die bestehende Shared-Route.
//
// Modul-Icons orientieren sich an den fachlichen Modulgruppen:
//   BookOpen (Rechnungswesen)
//   FileBarChart (Anlagen)
//   FileText (Einkommensteuer)  — Tax-Form-Konvention
//   Receipt (Umsatzsteuer)
//   Users (Lohn)                — klarer für „Lohn und Gehalt"

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
    mainPath: "/buchhaltung/buchfuehrung",
    headerTestId: "arbeitsplatz-launcher-rewe",
    subItems: [
      {
        label: "Buchungsjournal",
        path: "/buchhaltung/journal",
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
    ],
  },
  {
    id: "jahresabschluss-wizard",
    title: "Jahresabschluss-Wizard",
    icon: FileCheck2,
    mainPath: "/jahresabschluss/wizard",
    headerTestId: "arbeitsplatz-launcher-jahresabschluss-wizard",
    subItems: [],
  },
  {
    id: "anlagen",
    title: "Anlagenbuchführung",
    icon: FileBarChart,
    mainPath: "/buchhaltung/anlagen/verzeichnis",
    headerTestId: "arbeitsplatz-launcher-anlagen",
    subItems: [
      {
        label: "Anlagenspiegel",
        path: "/berichte/anlagenspiegel",
        testId: "arbeitsplatz-tree-anlagen-spiegel",
      },
      {
        label: "Inventarübersicht",
        path: "/buchhaltung/anlagen/verzeichnis",
        testId: "arbeitsplatz-tree-anlagen-inventar",
      },
      // Zugänge + Abgänge sind in AnlagenVerzeichnisPage integriert;
      // Umbuchungen (FEHLT) bewusst weggelassen (TEILWEISE-Fix).
      {
        label: "Zugänge / Abgänge",
        path: "/buchhaltung/anlagen/verzeichnis",
        testId: "arbeitsplatz-tree-anlagen-bewegungen",
      },
      {
        label: "Abschreibungen (AfA)",
        path: "/buchhaltung/anlagen/afa-lauf",
        testId: "arbeitsplatz-tree-anlagen-afa",
      },
    ],
  },
  {
    id: "einkommensteuer",
    title: "Einkommensteuer",
    icon: FileText,
    mainPath: "/einkommensteuer/est-1a",
    headerTestId: "arbeitsplatz-launcher-einkommensteuer",
    subItems: [
      {
        label: "Mantelbogen ESt 1 A",
        path: "/einkommensteuer/est-1a",
        testId: "arbeitsplatz-tree-est-mantel",
      },
      {
        label: "Anlage N",
        path: "/einkommensteuer/anlage-n",
        testId: "arbeitsplatz-tree-est-n",
      },
      {
        label: "Anlage G",
        path: "/einkommensteuer/anlage-g",
        testId: "arbeitsplatz-tree-est-g",
      },
      {
        label: "Anlage S",
        path: "/einkommensteuer/anlage-s",
        testId: "arbeitsplatz-tree-est-s",
      },
      {
        label: "Anlage V",
        path: "/einkommensteuer/anlage-v",
        testId: "arbeitsplatz-tree-est-v",
      },
      {
        label: "Anlage KAP",
        path: "/einkommensteuer/anlage-kap",
        testId: "arbeitsplatz-tree-est-kap",
      },
      {
        label: "Sonderausgaben",
        path: "/einkommensteuer/anlage-sonder",
        testId: "arbeitsplatz-tree-est-sonder",
      },
      {
        label: "Außergewöhnliche Belastungen",
        path: "/einkommensteuer/anlage-agb",
        testId: "arbeitsplatz-tree-est-agb",
      },
    ],
  },
  {
    id: "umsatzsteuer",
    title: "Umsatzsteuer",
    icon: Receipt,
    mainPath: "/umsatzsteuer/ustva",
    headerTestId: "arbeitsplatz-launcher-umsatzsteuer",
    subItems: [
      {
        label: "UStVA",
        path: "/umsatzsteuer/ustva",
        testId: "arbeitsplatz-tree-ust-ustva",
      },
      {
        label: "Zusammenfassende Meldung",
        path: "/umsatzsteuer/zm",
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

// Mandanten-Tabelle: Rechtsform-Spalte. Bindet `Client.rechtsform`
// (HGB-Taxonomie-6.8-Literal-Union) auf eine UI-taugliche Darstellung.
// Neun von zehn Werten sind bereits User-facing-Strings; nur der Tech-Key
// `SonstigerRechtsform` braucht eine Klartext-Variante.
function displayRechtsform(r: Client["rechtsform"]): string {
  if (!r) return "—";
  if (r === "SonstigerRechtsform") return "Sonstige Rechtsform";
  return r;
}

export default function ArbeitsplatzPage() {
  const { selectedMandantId, setSelectedMandantId } = useMandant();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const clientsQ = useQuery({
    queryKey: ["clients", "all"],
    queryFn: fetchClients,
  });

  const clients = clientsQ.data ?? [];
  // Nur eine real existierende ID gilt als aktiv. Unbekannte mandantId-Werte
  // werden stillschweigend ignoriert (siehe useEffect unten für console.warn).
  const activeId =
    selectedMandantId && clients.some((c) => c.id === selectedMandantId)
      ? selectedMandantId
      : null;

  useEffect(() => {
    if (!selectedMandantId) return;
    if (clientsQ.isLoading) return;
    if (clients.length === 0) return;
    if (clients.some((c) => c.id === selectedMandantId)) return;
    console.warn(
      `Arbeitsplatz: mandantId=${selectedMandantId} verweist auf keinen bekannten Mandanten — Auswahl wird ignoriert.`
    );
  }, [selectedMandantId, clients, clientsQ.isLoading]);

  const filtered = useMemo(
    () => filterClients(clients, query),
    [clients, query]
  );

  function selectMandant(id: string) {
    if (activeId === id) return; // no-op: identische Auswahl
    setSelectedMandantId(id);
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
          aria-label="Kanzlei-Tagessteuerung"
        >
          <div
            className="arbeitsplatz__col-title"
            data-testid="arbeitsplatz-frame-title-left"
          >
            Kanzlei-Tagessteuerung
          </div>
          <div
            className="arbeitsplatz__section-header"
            data-testid="arbeitsplatz-section-meintag"
          >
            Mein Arbeitstag
          </div>
          <nav aria-label="Mein-Arbeitstag-Navigation">
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
                        title="Geplantes Modul"
                      >
                        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                        <span>{item.label}</span>
                      </span>
                    </li>
                  );
                }
                // Mandant-Scope-Übergabe: Wenn ein Mandant in Arbeit ist,
                // wird die mandantId an die Zielseite mitgegeben — analog
                // zur rechten Spalte (Programme-Baum). Ohne aktiven Mandanten
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
          aria-label="Mandantenportfolio"
        >
          <div className="arbeitsplatz__col-header">
            <h2>Mandantenportfolio</h2>
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
          <p
            className="arbeitsplatz__col-subline"
            data-testid="arbeitsplatz-frame-subline-center"
          >
            Mandant auswählen, Arbeitsbereich öffnen, Programme im Mandantenkontext starten.
          </p>

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
                      <td>{displayRechtsform(c.rechtsform)}</td>
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
          aria-label="Mandanten-Arbeitsbereich"
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
      <h3
        className="arbeitsplatz__launcher-empty-title"
        data-testid="arbeitsplatz-launcher-empty-title"
      >
        Mandant wählen, um Arbeitsbereich zu öffnen
      </h3>
      <p>Bitte einen Mandanten aus der Liste auswählen</p>
      <p
        className="arbeitsplatz__launcher-empty-hint"
        data-testid="arbeitsplatz-launcher-empty-hint"
      >
        Nach der Auswahl stehen Schnellzugriff, Mandanten-Schnellinfo und
        geplante Erweiterungen im Mandantenkontext zur Verfügung.
      </p>
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
  // `harouda:arbeitsplatz-tree-expanded`. Die Baum-Persistenz ist
  // seitenlokal und unabhängig vom Shell-Layout. Initial: alle 5
  // Module expanded.
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

  // --- Liquiditäts-Radar (OPOS-Live-Anbindung) --------------------------
  //
  // Cache-Keys identisch zu OposPage/MahnwesenPage/JournalPage/
  // DocumentsPage/BankReconciliationPage, damit Arbeitsplatz und diese
  // Pages denselben Tanstack-Query-Cache nutzen (kein zusätzlicher Fetch).
  // Aggregation ist rein client-side (summarizeOpenItems). Der Mandant-
  // Filter greift nach der Aggregation und schließt Posten mit gemischten
  // oder fehlenden client_ids aus (siehe api/opos.ts:118, 185).
  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", mandantId],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const liquiditaet = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    const summary = summarizeOpenItems(entriesQ.data, accountsQ.data);
    const receivables = summary.receivables.filter(
      (i) => i.client_id === mandantId
    );
    const payables = summary.payables.filter(
      (i) => i.client_id === mandantId
    );
    const overdue = receivables.filter((i) => i.ueberfaellig_tage > 0);
    return {
      receivablesCount: receivables.length,
      receivablesSum: receivables.reduce((s, i) => s + i.offen, 0),
      overdueCount: overdue.length,
      payablesCount: payables.length,
      payablesSum: payables.reduce((s, i) => s + i.offen, 0),
    };
  }, [entriesQ.data, accountsQ.data, mandantId]);

  const liquiditaetIsLoading = entriesQ.isLoading || accountsQ.isLoading;
  const liquiditaetIsError = entriesQ.isError || accountsQ.isError;
  const liquiditaetIsEmpty =
    !!liquiditaet &&
    liquiditaet.receivablesCount === 0 &&
    liquiditaet.payablesCount === 0;

  // --- Erfassungsstatus (Bank-Reconciliation-Live-Anbindung) -------------
  //
  // Eigener Query-Key, weil BankReconciliationPage `listMatches` aktuell
  // nicht via React-Query nutzt (eigene useState-Flow). Daten-Volumen ist
  // klein (Match-Records pro Mandant). Aggregation kommt aus dem purpose-
  // built Helper `countMatchesByStatus` (api/bankReconciliationMatches.ts:
  // 174–186, Mandant-Filter nativ).
  const bankReconQ = useQuery({
    queryKey: ["bank_recon_matches", "status-counts", mandantId],
    queryFn: () => countMatchesByStatus(mandantId),
  });
  const erfassungIsLoading = bankReconQ.isLoading;
  const erfassungIsError = bankReconQ.isError;
  const erfassungCounts = bankReconQ.data ?? null;
  const erfassungTotal = erfassungCounts
    ? erfassungCounts.matched +
      erfassungCounts.auto_matched +
      erfassungCounts.pending_review +
      erfassungCounts.ignored
    : 0;
  const erfassungIsEmpty = !!erfassungCounts && erfassungTotal === 0;

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

      <section
        className="arbeitsplatz__panel-group"
        data-testid="arbeitsplatz-panel-schnellzugriff"
        aria-labelledby="arbeitsplatz-panel-schnellzugriff-title"
      >
        <h3
          id="arbeitsplatz-panel-schnellzugriff-title"
          className="arbeitsplatz__panel-group-title"
          data-testid="arbeitsplatz-panel-schnellzugriff-title"
        >
          Schnellzugriff
        </h3>
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
      </section>

      {/* Mandanten-Schnellinfo — bewusst statische Hinweis-Karten ohne
          Live-Daten. Datenmodelle für diese Auswertungen existieren im
          Repo (OPOS, Belege/Inventur, Jahresabschluss-Wizard), werden
          aber erst in einem separaten Sprint mandantbezogen angebunden. */}
      <section
        className="arbeitsplatz__panel-group"
        data-testid="arbeitsplatz-panel-klienten-schnellinfo"
        aria-labelledby="arbeitsplatz-panel-klienten-schnellinfo-title"
      >
        <h3
          id="arbeitsplatz-panel-klienten-schnellinfo-title"
          className="arbeitsplatz__panel-group-title"
          data-testid="arbeitsplatz-panel-klienten-schnellinfo-title"
        >
          Mandanten-Schnellinfo
        </h3>
        <div
          className="arbeitsplatz__info-cards"
          data-testid="arbeitsplatz-info-cards-klienten"
        >
          <article
            className="arbeitsplatz__info-card arbeitsplatz__info-card--live"
            data-testid="arbeitsplatz-info-card-liquiditaet"
          >
            <h4 className="arbeitsplatz__info-card-title">Liquiditäts-Radar</h4>
            <p className="arbeitsplatz__info-card-status">Aus offenen Posten</p>
            {liquiditaetIsLoading ? (
              <p
                className="arbeitsplatz__info-card-hint"
                data-testid="arbeitsplatz-info-card-liquiditaet-loading"
              >
                wird geladen…
              </p>
            ) : liquiditaetIsError ? (
              <p
                className="arbeitsplatz__info-card-hint arbeitsplatz__info-card-hint--error"
                role="alert"
                data-testid="arbeitsplatz-info-card-liquiditaet-error"
              >
                Offene Posten aktuell nicht abrufbar.
              </p>
            ) : !liquiditaet || liquiditaetIsEmpty ? (
              <p
                className="arbeitsplatz__info-card-hint"
                data-testid="arbeitsplatz-info-card-liquiditaet-empty"
              >
                Keine offenen Posten für diesen Mandanten.
              </p>
            ) : (
              <>
                <dl
                  className="arbeitsplatz__info-card-metrics"
                  data-testid="arbeitsplatz-info-card-liquiditaet-metrics"
                >
                  <div className="arbeitsplatz__info-card-metric">
                    <dt>Offene Forderungen</dt>
                    <dd>
                      {liquiditaet.receivablesCount}
                      {liquiditaet.receivablesCount > 0
                        ? ` · ${EUR_FMT.format(liquiditaet.receivablesSum)}`
                        : ""}
                    </dd>
                  </div>
                  {liquiditaet.overdueCount > 0 ? (
                    <div className="arbeitsplatz__info-card-metric">
                      <dt>davon überfällig</dt>
                      <dd>{liquiditaet.overdueCount}</dd>
                    </div>
                  ) : null}
                  <div className="arbeitsplatz__info-card-metric">
                    <dt>Offene Verbindlichkeiten</dt>
                    <dd>
                      {liquiditaet.payablesCount}
                      {liquiditaet.payablesCount > 0
                        ? ` · ${EUR_FMT.format(liquiditaet.payablesSum)}`
                        : ""}
                    </dd>
                  </div>
                </dl>
                <p className="arbeitsplatz__info-card-foot">
                  Für diesen Mandanten zuordenbar
                </p>
              </>
            )}
          </article>
          <article
            className="arbeitsplatz__info-card arbeitsplatz__info-card--live"
            data-testid="arbeitsplatz-info-card-erfassung"
          >
            <h4 className="arbeitsplatz__info-card-title">Erfassungsstatus</h4>
            <p className="arbeitsplatz__info-card-status">Aus Bankabstimmung</p>
            {erfassungIsLoading ? (
              <p
                className="arbeitsplatz__info-card-hint"
                data-testid="arbeitsplatz-info-card-erfassung-loading"
              >
                wird geladen…
              </p>
            ) : erfassungIsError ? (
              <p
                className="arbeitsplatz__info-card-hint arbeitsplatz__info-card-hint--error"
                role="alert"
                data-testid="arbeitsplatz-info-card-erfassung-error"
              >
                Bankabstimmung aktuell nicht abrufbar.
              </p>
            ) : !erfassungCounts || erfassungIsEmpty ? (
              <p
                className="arbeitsplatz__info-card-hint"
                data-testid="arbeitsplatz-info-card-erfassung-empty"
              >
                Noch keine Bankabstimmung für diesen Mandanten.
              </p>
            ) : (
              <>
                <dl
                  className="arbeitsplatz__info-card-metrics"
                  data-testid="arbeitsplatz-info-card-erfassung-metrics"
                >
                  <div className="arbeitsplatz__info-card-metric">
                    <dt>Zur Prüfung</dt>
                    <dd>{erfassungCounts.pending_review}</dd>
                  </div>
                  <div className="arbeitsplatz__info-card-metric">
                    <dt>Auto-Treffer</dt>
                    <dd>{erfassungCounts.auto_matched}</dd>
                  </div>
                  <div className="arbeitsplatz__info-card-metric">
                    <dt>Manuell zugeordnet</dt>
                    <dd>{erfassungCounts.matched}</dd>
                  </div>
                  <div className="arbeitsplatz__info-card-metric">
                    <dt>Ignoriert</dt>
                    <dd>{erfassungCounts.ignored}</dd>
                  </div>
                </dl>
                <p className="arbeitsplatz__info-card-foot">
                  Bankabstimmungs-Treffer für diesen Mandanten
                </p>
              </>
            )}
          </article>
          <article
            className="arbeitsplatz__info-card arbeitsplatz__info-card--live"
            data-testid="arbeitsplatz-info-card-abschluss"
          >
            <h4 className="arbeitsplatz__info-card-title">Abschluss-Tracker</h4>
            <p className="arbeitsplatz__info-card-status">Pro Mandant und Jahr</p>
            <Link
              to={buildMandantLink("/jahresabschluss/wizard", mandantId)}
              className="arbeitsplatz__info-card-cta"
              data-testid="arbeitsplatz-info-card-abschluss-cta"
            >
              Wizard öffnen
            </Link>
            <p className="arbeitsplatz__info-card-hint">
              Wirtschaftsjahr wird im Wizard-Kontext übernommen.
            </p>
          </article>
        </div>
      </section>

      {/* Geplante Erweiterungen — Bereiche, die ohne Datenmodell-Erweiterung
          nicht ehrlich live darstellbar sind. Bewusst „In Vorbereitung". */}
      <section
        className="arbeitsplatz__panel-group"
        data-testid="arbeitsplatz-panel-geplant"
        aria-labelledby="arbeitsplatz-panel-geplant-title"
      >
        <h3
          id="arbeitsplatz-panel-geplant-title"
          className="arbeitsplatz__panel-group-title"
          data-testid="arbeitsplatz-panel-geplant-title"
        >
          Geplante Erweiterungen
        </h3>
        <div
          className="arbeitsplatz__info-cards"
          data-testid="arbeitsplatz-info-cards-geplant"
        >
          <article
            className="arbeitsplatz__info-card arbeitsplatz__info-card--planned"
            data-testid="arbeitsplatz-info-card-akten-todos"
            aria-disabled="true"
          >
            <h4 className="arbeitsplatz__info-card-title">Akten-To-Dos</h4>
            <p className="arbeitsplatz__info-card-status">In Vorbereitung</p>
            <p className="arbeitsplatz__info-card-hint">
              Eigenes Aufgaben-Datenmodell wird vorbereitet.
            </p>
          </article>
          <article
            className="arbeitsplatz__info-card arbeitsplatz__info-card--planned"
            data-testid="arbeitsplatz-info-card-steuer-deklaration"
            aria-disabled="true"
          >
            <h4 className="arbeitsplatz__info-card-title">
              Steuer-Deklarationsstatus
            </h4>
            <p className="arbeitsplatz__info-card-status">In Vorbereitung</p>
            <p className="arbeitsplatz__info-card-hint">
              Mandantbezogene Sicht auf laufende Deklarationen folgt nach
              Datenmodell-Klärung.
            </p>
          </article>
          <article
            className="arbeitsplatz__info-card arbeitsplatz__info-card--planned"
            data-testid="arbeitsplatz-info-card-beleg-pruefstand"
            aria-disabled="true"
          >
            <h4 className="arbeitsplatz__info-card-title">Beleg-Prüfstand</h4>
            <p className="arbeitsplatz__info-card-status">In Vorbereitung</p>
            <p className="arbeitsplatz__info-card-hint">
              Workflow-Statusmodell für Belege fehlt noch — wird separat
              ergänzt.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
