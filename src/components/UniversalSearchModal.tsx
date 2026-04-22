import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bolt,
  FileArchive,
  FileSearch,
  FileText,
  Hash,
  ReceiptText,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { fetchAllEntries } from "../api/dashboard";
import { fetchAccounts } from "../api/accounts";
import { fetchClients } from "../api/clients";
import { fetchEmployees } from "../api/employees";
import { fetchInvoiceArchive } from "../api/invoiceArchive";
import {
  categoryLabel,
  markCommandUsed,
  scoreCommands,
  type CommandEntry,
} from "./commandPalette";
import { parseNlQuery, NL_EXAMPLES } from "../utils/nlSearch";
import "./UniversalSearchModal.css";

type ResultGroup = "journal" | "client" | "account" | "employee" | "invoice";

type ResultItem = {
  group: ResultGroup;
  id: string;
  title: string;
  subtitle?: string;
  to: string;
  score: number;
};

const GROUP_LABEL: Record<ResultGroup, string> = {
  journal: "Buchungen",
  client: "Mandanten",
  account: "Konten",
  employee: "Mitarbeiter",
  invoice: "E-Rechnungen",
};

const GROUP_ICON: Record<ResultGroup, typeof Search> = {
  journal: ReceiptText,
  client: Users,
  account: Hash,
  employee: UserRound,
  invoice: FileArchive,
};

const MAX_PER_GROUP = 5;

function scoreString(query: string, text: string): number {
  if (!text) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 1;
  if (t.startsWith(q)) return 0.85;
  if (t.includes(q)) return 0.6;
  // Token match
  const tokens = q.split(/\s+/).filter((x) => x.length >= 2);
  if (tokens.length > 0 && tokens.every((tok) => t.includes(tok))) return 0.4;
  return 0;
}

function scoreMax(query: string, ...texts: (string | null | undefined)[]): number {
  let max = 0;
  for (const t of texts) {
    if (!t) continue;
    const s = scoreString(query, t);
    if (s > max) max = s;
  }
  return max;
}

function useDebounced<T>(value: T, ms = 150): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function UniversalSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 150);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Befehls-Palette: bewertet Befehle anhand des Query-Strings und der
  // aktuellen Route. Score-Boost für kürzlich genutzte Befehle.
  const commands = useMemo(() => {
    const scored = scoreCommands(debounced.trim(), location.pathname);
    // Obergrenze damit die Liste nicht zu lang wird.
    return scored.slice(0, 8);
  }, [debounced, location.pathname]);

  // Natural-Language-Parser: zieht Betrag/Datum/Status/Gegenseite aus der
  // Query. Rein regelbasiert, deutsche Phrasen. Siehe utils/nlSearch.ts.
  const nl = useMemo(() => parseNlQuery(debounced), [debounced]);

  const journalQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
    enabled: open,
  });
  const clientsQ = useQuery({
    queryKey: ["clients", "all"],
    queryFn: fetchClients,
    enabled: open,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
    enabled: open,
  });
  // UniversalSearch ist Kanzlei-weit — clientId=null zieht alle Mitarbeiter
  // über alle Mandanten der aktiven Kanzlei.
  const employeesQ = useQuery({
    queryKey: ["employees", null],
    queryFn: () => fetchEmployees(null),
    enabled: open,
  });
  // Kanzlei-weite Suche: clientId=null liefert alle Archiv-Einträge.
  const archiveQ = useQuery({
    queryKey: ["invoice_archive", null],
    queryFn: () => fetchInvoiceArchive(null),
    enabled: open,
  });

  const results = useMemo<ResultItem[]>(() => {
    const q = debounced.trim();
    // NL-Filter können auch ohne 2-Zeichen-Minimum wirken (z. B. "heute").
    const hasNlFilters =
      nl.filters.amountMin !== undefined ||
      nl.filters.amountMax !== undefined ||
      nl.filters.dateFrom ||
      nl.filters.status ||
      nl.filters.gegenseite;
    if (!hasNlFilters && (!q || q.length < 2)) return [];
    const out: ResultItem[] = [];

    const textQueryForJournal = nl.filters.residual || q;
    const needTextMatch = textQueryForJournal.length >= 2;

    for (const e of journalQ.data ?? []) {
      // NL-Filter anwenden
      const betrag = Number(e.betrag);
      if (nl.filters.amountMin !== undefined && betrag < nl.filters.amountMin)
        continue;
      if (nl.filters.amountMax !== undefined && betrag > nl.filters.amountMax)
        continue;
      if (nl.filters.dateFrom && e.datum < nl.filters.dateFrom) continue;
      if (nl.filters.dateTo && e.datum > nl.filters.dateTo) continue;
      if (nl.filters.status === "entwurf" && e.status !== "entwurf") continue;
      if (nl.filters.status === "gebucht" && e.status !== "gebucht") continue;
      // "offen" und "überfällig" sind OPOS-Konzepte — hier nur rudimentär
      // als "status != gebucht" bzw. "fällig in der Vergangenheit" behandelt.
      if (nl.filters.status === "offen" && e.storno_status === "reversed")
        continue;
      if (nl.filters.status === "ueberfaellig") {
        if (!e.faelligkeit || e.faelligkeit >= new Date().toISOString().slice(0, 10))
          continue;
      }
      if (
        nl.filters.gegenseite &&
        !(e.gegenseite ?? "")
          .toLowerCase()
          .includes(nl.filters.gegenseite.toLowerCase())
      )
        continue;

      // Wenn NL-Filter aktiv sind und kein Freitext übrig, alle übrigen
      // Einträge als Treffer zulassen (mit niedrigem Base-Score).
      let s: number;
      if (needTextMatch) {
        s = scoreMax(
          textQueryForJournal,
          e.beleg_nr,
          e.beschreibung,
          e.gegenseite,
          e.soll_konto,
          e.haben_konto
        );
        if (s === 0) continue;
      } else {
        s = 0.4; // akzeptabler Treffer ohne Text-Score (NL-Filter waren entscheidend)
      }
      out.push({
        group: "journal",
        id: e.id,
        title: `${e.beleg_nr} — ${e.beschreibung}`,
        subtitle: `${new Date(e.datum).toLocaleDateString("de-DE")} · ${e.soll_konto}/${e.haben_konto} · ${Number(e.betrag).toFixed(2)} €`,
        to: "/journal",
        score: s,
      });
    }

    // Für Entitäten außerhalb Journal: benutze Freitext-Rest ODER Gegenseite
    // ODER originale Query.
    const qEntity = nl.filters.residual || nl.filters.gegenseite || q;

    for (const c of clientsQ.data ?? []) {
      const s = qEntity ? scoreMax(qEntity, c.name, c.mandant_nr, c.steuernummer, c.ust_id) : 0;
      if (s > 0) {
        out.push({
          group: "client",
          id: c.id,
          title: c.name,
          subtitle: `Mandant ${c.mandant_nr}${c.ust_id ? ` · USt-IdNr ${c.ust_id}` : ""}`,
          to: "/mandanten",
          score: s,
        });
      }
    }

    for (const a of accountsQ.data ?? []) {
      const s = qEntity ? scoreMax(qEntity, a.konto_nr, a.bezeichnung) : 0;
      if (s > 0) {
        out.push({
          group: "account",
          id: a.id,
          title: `${a.konto_nr} — ${a.bezeichnung}`,
          subtitle: `${a.kategorie}${a.ust_satz != null ? ` · ${a.ust_satz} %` : ""}${a.is_active ? "" : " · inaktiv"}`,
          to: "/konten",
          score: s,
        });
      }
    }

    for (const emp of employeesQ.data ?? []) {
      const s = qEntity
        ? scoreMax(
            qEntity,
            emp.personalnummer,
            emp.vorname,
            emp.nachname,
            `${emp.vorname} ${emp.nachname}`,
            emp.krankenkasse
          )
        : 0;
      if (s > 0) {
        out.push({
          group: "employee",
          id: emp.id,
          title: `${emp.nachname}, ${emp.vorname}`,
          subtitle: `Pers-Nr ${emp.personalnummer} · ${emp.beschaeftigungsart}`,
          to: "/personal/mitarbeiter",
          score: s,
        });
      }
    }

    for (const r of archiveQ.data ?? []) {
      const s = qEntity
        ? scoreMax(
            qEntity,
            r.original_filename,
            r.xml?.supplier_name,
            r.xml?.invoice_number,
            r.content_sha256.slice(0, 12)
          )
        : 0;
      if (s > 0) {
        out.push({
          group: "invoice",
          id: r.id,
          title:
            r.xml?.supplier_name ?? r.original_filename,
          subtitle: `${r.xml?.invoice_number ?? "ohne Nr."} · ${r.original_filename}`,
          to: "/e-rechnung/archiv",
          score: s,
        });
      }
    }

    return out.sort((a, b) => b.score - a.score);
  }, [debounced, nl, journalQ.data, clientsQ.data, accountsQ.data, employeesQ.data, archiveQ.data]);

  // Nach Gruppe begrenzen + flach sortieren für Navigation.
  // Befehle werden als eigener "Kommando"-Block VOR den Entitäts-Treffern
  // einsortiert — so landet man mit ↓ + ↵ am schnellsten auf einer Aktion.
  const visible = useMemo(() => {
    const perGroup = new Map<ResultGroup, ResultItem[]>();
    for (const r of results) {
      const arr = perGroup.get(r.group) ?? [];
      if (arr.length < MAX_PER_GROUP) arr.push(r);
      perGroup.set(r.group, arr);
    }
    const flatCommands = commands.map((c) => c.cmd);
    const flatEntities: ResultItem[] = [];
    for (const g of ["journal", "client", "account", "employee", "invoice"] as ResultGroup[]) {
      for (const r of perGroup.get(g) ?? []) flatEntities.push(r);
    }
    return { perGroup, flatCommands, flatEntities };
  }, [results, commands]);

  const totalFlatLength =
    visible.flatCommands.length + visible.flatEntities.length;

  // Reset beim Öffnen
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Reset des aktiven Index wenn Ergebnisse wechseln
  useEffect(() => {
    setActiveIdx(0);
  }, [totalFlatLength]);

  const go = useCallback(
    (item: ResultItem) => {
      onClose();
      navigate(item.to);
    },
    [navigate, onClose]
  );

  const goCommand = useCallback(
    (cmd: CommandEntry) => {
      markCommandUsed(cmd.id);
      onClose();
      navigate(cmd.to);
    },
    [navigate, onClose]
  );

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, totalFlatLength - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx < visible.flatCommands.length) {
        const cmd = visible.flatCommands[activeIdx];
        if (cmd) goCommand(cmd);
      } else {
        const entityIdx = activeIdx - visible.flatCommands.length;
        const item = visible.flatEntities[entityIdx];
        if (item) go(item);
      }
    }
  }

  if (!open) return null;

  const emptyState = debounced.trim().length < 2;
  const groupsWithHits = (
    ["journal", "client", "account", "employee", "invoice"] as ResultGroup[]
  ).filter((g) => (visible.perGroup.get(g) ?? []).length > 0);

  return (
    <div className="usearch__backdrop" onClick={onClose}>
      <div
        className="usearch__modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Universelle Suche"
      >
        <div className="usearch__head">
          <Search size={16} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Suche nach Buchungen, Mandanten, Konten, Mitarbeitern, Rechnungen…"
          />
          <button
            type="button"
            className="usearch__close"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={14} />
          </button>
        </div>

        <div className="usearch__body">
          {/* Befehls-Palette: immer sichtbar, wenn Treffer existieren. */}
          {visible.flatCommands.length > 0 && (
            <section className="usearch__group">
              <header>
                <Bolt size={12} />
                <span>
                  {debounced.trim().length === 0
                    ? "Zuletzt verwendet"
                    : "Befehle"}
                </span>
                <small>{visible.flatCommands.length}</small>
              </header>
              {visible.flatCommands.map((cmd, i) => (
                <button
                  key={cmd.id}
                  type="button"
                  className={`usearch__item usearch__item--cmd ${
                    i === activeIdx ? "is-active" : ""
                  }`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => goCommand(cmd)}
                >
                  <div className="usearch__title">
                    <span className="usearch__cmd-cat">
                      {categoryLabel(cmd.category)}
                    </span>
                    {cmd.label}
                  </div>
                  {cmd.hint && (
                    <div className="usearch__sub">{cmd.hint}</div>
                  )}
                </button>
              ))}
            </section>
          )}

          {emptyState && visible.flatCommands.length === 0 && (
            <div className="usearch__empty">
              <p>
                Mindestens 2 Zeichen eingeben oder einen Befehl tippen
                (z. B. „datev", „neue rechnung", „mitarbeiter").
              </p>
              <p style={{ marginTop: 6, fontSize: "0.82rem" }}>
                Natürliche Suche:{" "}
                {NL_EXAMPLES.map((ex, i) => (
                  <span key={ex}>
                    <button
                      type="button"
                      className="usearch__example"
                      onClick={() => setQuery(ex)}
                    >
                      „{ex}"
                    </button>
                    {i < NL_EXAMPLES.length - 1 && "  "}
                  </span>
                ))}
              </p>
            </div>
          )}

          {nl.translation && !emptyState && (
            <div className="usearch__nl-chip">
              <span className="usearch__nl-label">Übersetzt als:</span>{" "}
              {nl.translation}
            </div>
          )}

          {!emptyState &&
            visible.flatCommands.length === 0 &&
            visible.flatEntities.length === 0 && (
              <p className="usearch__empty">
                Keine Treffer für „{debounced}".
              </p>
            )}

          {!emptyState &&
            groupsWithHits.map((group) => {
              const items = visible.perGroup.get(group) ?? [];
              const Icon = GROUP_ICON[group];
              return (
                <section key={group} className="usearch__group">
                  <header>
                    <Icon size={12} />
                    <span>{GROUP_LABEL[group]}</span>
                    <small>
                      {items.length}
                      {results.filter((r) => r.group === group).length > items.length &&
                        ` von ${results.filter((r) => r.group === group).length}`}
                    </small>
                  </header>
                  {items.map((it) => {
                    const entityIdx = visible.flatEntities.indexOf(it);
                    const flatIdx = visible.flatCommands.length + entityIdx;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        className={`usearch__item ${
                          flatIdx === activeIdx ? "is-active" : ""
                        }`}
                        onMouseEnter={() => setActiveIdx(flatIdx)}
                        onClick={() => go(it)}
                      >
                        <div className="usearch__title">{it.title}</div>
                        {it.subtitle && (
                          <div className="usearch__sub">{it.subtitle}</div>
                        )}
                      </button>
                    );
                  })}
                </section>
              );
            })}
        </div>

        <footer className="usearch__foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigieren
          </span>
          <span>
            <kbd>↵</kbd> öffnen
          </span>
          <span>
            <kbd>Esc</kbd> schließen
          </span>
        </footer>
      </div>
    </div>
  );
}
