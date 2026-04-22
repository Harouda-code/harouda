// Katalog aller Befehle für die Kommando-Palette (Ctrl+K / Ctrl+/).
//
// Ein Kommando ist leichtgewichtig: Label, optionale Aliases (Keywords),
// ein Navigations-Ziel (Route). Kein Parameter-Parser — die Zielseite
// nimmt ggf. über localStorage-Prefill oder URL-Params die Feinheiten auf.
//
// Die Wiederbenutzungs-Frequenz wird pro Befehl in localStorage
// mitgezählt ("harouda:cmdRecency") und beim Scoring als Boost verwendet.

export type CommandCategory =
  | "create"
  | "navigate"
  | "export"
  | "report"
  | "admin";

export type CommandEntry = {
  id: string;
  label: string;
  /** Zusatzinformation rechts. */
  hint?: string;
  /** Suchbegriffe zusätzlich zum Label (niedrigerer Gewicht). */
  keywords: string[];
  category: CommandCategory;
  /** Routen-Ziel. */
  to: string;
  /** Befehls-Boost, wenn aktuelle Route so beginnt. */
  contextPaths?: string[];
};

const CATEGORY_LABEL: Record<CommandCategory, string> = {
  create: "Erstellen",
  navigate: "Navigation",
  export: "Export",
  report: "Berichte",
  admin: "Verwaltung",
};

export function categoryLabel(c: CommandCategory): string {
  return CATEGORY_LABEL[c];
}

export const COMMANDS: CommandEntry[] = [
  // --- Erstellen ---------------------------------------------------------
  {
    id: "cmd.new.journal",
    label: "Neue Buchung",
    keywords: ["buchung", "journal", "erfassen", "nebuchen"],
    category: "create",
    to: "/journal",
    contextPaths: ["/journal"],
    hint: "Journal",
  },
  {
    id: "cmd.new.xrechnung",
    label: "Neue XRechnung erstellen",
    keywords: ["rechnung", "ausgang", "xrechnung", "neue rechnung"],
    category: "create",
    to: "/e-rechnung/erstellen",
    hint: "E-Rechnung",
  },
  {
    id: "cmd.new.employee",
    label: "Neuen Mitarbeiter anlegen",
    keywords: ["mitarbeiter", "personal", "lohn"],
    category: "create",
    to: "/personal/mitarbeiter",
    hint: "Lohn & Gehalt",
  },
  {
    id: "cmd.new.client",
    label: "Neuer Mandant",
    keywords: ["kunde", "mandant", "klient"],
    category: "create",
    to: "/mandanten",
    hint: "Stammdaten",
  },
  {
    id: "cmd.new.costcenter",
    label: "Neue Kostenstelle",
    keywords: ["kostenstelle", "kst"],
    category: "create",
    to: "/einstellungen/kostenstellen",
    hint: "Einstellungen",
  },

  // --- Navigation --------------------------------------------------------
  {
    id: "cmd.nav.dashboard",
    label: "Dashboard öffnen",
    keywords: ["übersicht", "start", "kpi"],
    category: "navigate",
    to: "/dashboard",
  },
  {
    id: "cmd.nav.journal",
    label: "Journal",
    keywords: ["buchungen", "belege"],
    category: "navigate",
    to: "/journal",
  },
  {
    id: "cmd.nav.konten",
    label: "Kontenplan",
    keywords: ["konten", "skr03", "kontenrahmen"],
    category: "navigate",
    to: "/konten",
  },
  {
    id: "cmd.nav.opos",
    label: "Offene Posten",
    keywords: ["opos", "forderungen", "verbindlichkeiten", "aging"],
    category: "navigate",
    to: "/opos",
  },
  {
    id: "cmd.nav.mahnwesen",
    label: "Mahnwesen",
    keywords: ["mahnen", "dunning", "überfällig"],
    category: "navigate",
    to: "/mahnwesen",
  },
  {
    id: "cmd.nav.liquidity",
    label: "Liquiditäts-Vorschau",
    keywords: ["cashflow", "liquidität", "prognose"],
    category: "navigate",
    to: "/liquiditaet",
  },
  {
    id: "cmd.nav.bankimport",
    label: "Bank-Import",
    keywords: ["camt", "mt940", "bank"],
    category: "navigate",
    to: "/bankimport",
  },
  {
    id: "cmd.nav.reconc",
    label: "Bank-Abstimmung",
    keywords: ["abgleich", "matching", "reconciliation"],
    category: "navigate",
    to: "/banking/reconciliation",
  },
  {
    id: "cmd.nav.archive",
    label: "E-Rechnung-Archiv",
    keywords: ["archiv", "zugferd", "facturx", "xrechnung"],
    category: "navigate",
    to: "/e-rechnung/archiv",
  },
  {
    id: "cmd.nav.scanner",
    label: "Dokument-Scanner (OCR)",
    keywords: ["ocr", "scan", "texterkennung"],
    category: "navigate",
    to: "/ai/scanner",
  },
  {
    id: "cmd.nav.advisor",
    label: "Berater-Dashboard",
    keywords: ["berater", "multi", "firmen"],
    category: "navigate",
    to: "/berater/dashboard",
  },
  {
    id: "cmd.nav.pruefer",
    label: "Prüfer-Dashboard",
    keywords: ["betriebsprüfer", "prüfung", "gdpdu"],
    category: "navigate",
    to: "/pruefer",
  },

  // --- Export ------------------------------------------------------------
  {
    id: "cmd.export.datev",
    label: "DATEV-Export",
    hint: "EXTF-CSV",
    keywords: ["datev", "extf", "csv", "buchungsstapel"],
    category: "export",
    to: "/export/datev",
  },
  {
    id: "cmd.export.elster",
    label: "ELSTER-Übertragung",
    hint: "UStVA + Register",
    keywords: ["elster", "umsatzsteuer", "ustva", "voranmeldung"],
    category: "export",
    to: "/steuern/elster",
  },

  // --- Berichte ----------------------------------------------------------
  { id: "cmd.rep.guv", label: "GuV", keywords: ["gewinn", "verlust"], category: "report", to: "/berichte/guv" },
  { id: "cmd.rep.bwa", label: "BWA", keywords: ["bwa"], category: "report", to: "/berichte/bwa" },
  { id: "cmd.rep.susa", label: "Summen- und Saldenliste", keywords: ["susa", "salden"], category: "report", to: "/berichte/susa" },
  { id: "cmd.rep.euer", label: "EÜR", keywords: ["einnahmen", "überschuss"], category: "report", to: "/steuer/euer" },
  { id: "cmd.rep.gewst", label: "Gewerbesteuer", keywords: ["gewerbe"], category: "report", to: "/steuer/gewerbesteuer" },
  { id: "cmd.rep.kst", label: "Körperschaftsteuer", keywords: ["körperschaft"], category: "report", to: "/steuer/kst" },
  { id: "cmd.rep.payroll", label: "Lohn-Vorschau", keywords: ["gehalt", "lohn", "abrechnung"], category: "report", to: "/personal/abrechnung" },

  // --- Verwaltung --------------------------------------------------------
  {
    id: "cmd.admin.audit",
    label: "Audit-Log anzeigen",
    keywords: ["audit", "protokoll", "kette"],
    category: "admin",
    to: "/einstellungen/audit",
  },
  {
    id: "cmd.admin.verfahrensdoku",
    label: "Verfahrensdokumentation erzeugen",
    keywords: ["vdoku", "gobd", "dokumentation"],
    category: "admin",
    to: "/einstellungen/verfahrensdoku",
  },
  {
    id: "cmd.admin.systemstatus",
    label: "System-Status",
    keywords: ["health", "supabase"],
    category: "admin",
    to: "/einstellungen/systemstatus",
  },
  {
    id: "cmd.admin.settings",
    label: "Einstellungen",
    keywords: ["einstellungen", "stammdaten"],
    category: "admin",
    to: "/einstellungen",
  },
  {
    id: "cmd.admin.members",
    label: "Benutzer & Rollen",
    keywords: ["rollen", "rechte", "team"],
    category: "admin",
    to: "/einstellungen/benutzer",
  },
];

// ---------------------------------------------------------------------------
// Recency-Tracking
// ---------------------------------------------------------------------------

const STORE_KEY = "harouda:cmdRecency";

type RecencyMap = Record<string, number>; // id → last-used-epoch-ms

function loadRecency(): RecencyMap {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RecencyMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveRecency(map: RecencyMap): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function markCommandUsed(id: string): void {
  const map = loadRecency();
  map[id] = Date.now();
  // Obergrenze — halte nur die letzten 50 IDs
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 50);
  saveRecency(Object.fromEntries(entries));
}

function getRecencyBoost(id: string): number {
  const map = loadRecency();
  const ts = map[id];
  if (!ts) return 0;
  const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  if (ageDays < 1) return 0.3;
  if (ageDays < 7) return 0.15;
  if (ageDays < 30) return 0.05;
  return 0;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function tokenScore(query: string, text: string): number {
  if (!text) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 1;
  if (t.startsWith(q)) return 0.88;
  if (t.includes(q)) return 0.65;
  const tokens = q.split(/\s+/).filter((x) => x.length >= 2);
  if (tokens.length > 0 && tokens.every((tok) => t.includes(tok))) return 0.45;
  return 0;
}

export type ScoredCommand = {
  cmd: CommandEntry;
  score: number;
};

export function scoreCommands(
  query: string,
  currentPath: string | null
): ScoredCommand[] {
  const q = query.trim();
  if (q.length === 0) {
    // Kein Query → häufig verwendete Befehle zeigen
    return COMMANDS.map((cmd) => ({
      cmd,
      score: getRecencyBoost(cmd.id) + 0.01,
    }))
      .filter((x) => x.score > 0.04)
      .sort((a, b) => b.score - a.score);
  }

  const out: ScoredCommand[] = [];
  for (const cmd of COMMANDS) {
    let score = tokenScore(q, cmd.label);
    for (const kw of cmd.keywords) {
      score = Math.max(score, tokenScore(q, kw) * 0.9);
    }
    if (score > 0) {
      score += getRecencyBoost(cmd.id);
      if (
        currentPath &&
        cmd.contextPaths &&
        cmd.contextPaths.some((p) => currentPath.startsWith(p))
      ) {
        score += 0.2;
      }
      out.push({ cmd, score });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}
