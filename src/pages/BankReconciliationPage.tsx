import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  FileUp,
  Info,
  Landmark,
  Link2,
  Loader2,
  Mail,
  Receipt,
  SkipForward,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { createEntry } from "../api/journal";
import { summarizeOpenItems, type OpenItem } from "../api/opos";
import { BankReconPersistenceBanner } from "../components/banking/BankReconPersistenceBanner";
import { parseBankFile, type BankTx, type MT940Statement } from "../utils/bankImport";
import {
  topMatches,
  type BankMatchCandidate,
  type MatchConfidence,
} from "../utils/bankMatch";
import {
  calculateSkontoPlan,
  type SkontoPlan,
} from "../domain/bank/skontoCalculator";
import type { JournalEntry } from "../types/db";
import {
  buildMailtoUrl,
  buildReceiptRequestDraft,
  createReceiptRequest,
} from "../api/receiptRequests";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import { useUser } from "../contexts/UserContext";
import { usePermissions } from "../hooks/usePermissions";
import "./ReportView.css";
import "./TaxCalc.css";
import "./BankReconciliationPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const CONF_COLOR: Record<MatchConfidence, string> = {
  exact: "var(--success)",
  high: "var(--success)",
  medium: "var(--gold-700)",
  low: "var(--muted)",
};

const CONF_LABEL: Record<MatchConfidence, string> = {
  exact: "exakt",
  high: "hoch",
  medium: "mittel",
  low: "niedrig",
};

type RowStatus = "pending" | "posted" | "skipped" | "requested";

type Row = {
  tx: BankTx;
  candidates: BankMatchCandidate[];
  bestConfidence: MatchConfidence | null;
  selectedKey: string | null;
  status: RowStatus;
};

type FilterMode = "exceptions" | "likely" | "posted" | "skipped" | "requested" | "all";

const FILTER_LABEL: Record<FilterMode, string> = {
  exceptions: "Nur offen (Ausnahmen)",
  likely: "Mit Vorschlag",
  posted: "Gebucht",
  skipped: "Übersprungen",
  requested: "Beleg angefordert",
  all: "Alle",
};

function candidateKey(c: BankMatchCandidate): string {
  return `${c.openItem.beleg_nr}#${c.openItem.kind}`;
}

/**
 * Ermittelt für eine Bank-Zahlung + einen offenen Posten den zugehörigen
 * Skonto-Plan (oder null, falls keine Skonto-Metadaten am Rechnungsbeleg
 * hinterlegt sind). Sucht die Rechnungs-Buchung über beleg_nr +
 * Forderungs-/Verbindlichkeits-Konto.
 */
function findSkontoPlanFor(
  tx: BankTx,
  item: OpenItem,
  entries: JournalEntry[]
): SkontoPlan | null {
  const isForderung = item.kind === "forderung";
  const rechnung = entries.find((e) => {
    if (e.beleg_nr !== item.beleg_nr) return false;
    const soll = Number(e.soll_konto);
    const haben = Number(e.haben_konto);
    return isForderung
      ? soll >= 1400 && soll <= 1499
      : haben >= 1600 && haben <= 1699;
  });
  if (!rechnung) return null;
  if (rechnung.skonto_pct === null || rechnung.skonto_tage === null) return null;
  return calculateSkontoPlan({
    bankBetrag: tx.betrag,
    bankDatum: tx.datum,
    offenBetrag: item.offen,
    rechnungDatum: rechnung.datum,
    skontoPct: rechnung.skonto_pct,
    skontoTage: rechnung.skonto_tage,
    ustSatz: rechnung.ust_satz ?? 0,
    kind: item.kind,
  });
}

export default function BankReconciliationPage() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { user } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stmt, setStmt] = useState<MT940Statement | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [parsing, setParsing] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("exceptions");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [dividerPct, setDividerPct] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem("harouda:reconcDivider"));
      return Number.isFinite(v) && v >= 30 && v <= 75 ? v : 55;
    } catch {
      return 55;
    }
  });
  const [requestingFor, setRequestingFor] = useState<number | null>(null);

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const opos = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return summarizeOpenItems(entriesQ.data, accountsQ.data);
  }, [entriesQ.data, accountsQ.data]);

  const allOpenItems: OpenItem[] = useMemo(() => {
    if (!opos) return [];
    return [...opos.receivables, ...opos.payables];
  }, [opos]);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await parseBankFile(file);
      setStmt(parsed);
      const rowStates: Row[] = parsed.transaktionen.map((tx) => {
        const candidates = topMatches(tx, allOpenItems, 3);
        const best = candidates[0];
        const selectedKey =
          best && best.confidence !== "low" ? candidateKey(best) : null;
        return {
          tx,
          candidates,
          bestConfidence: best?.confidence ?? null,
          selectedKey,
          status: "pending",
        };
      });
      setRows(rowStates);
      setActiveIdx(rowStates.length > 0 ? 0 : null);
      toast.success(`${parsed.transaktionen.length} Bank-Buchungen geladen.`);
    } catch (err) {
      toast.error(`Import fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setParsing(false);
    }
  }

  const counts = useMemo(() => {
    const c = {
      all: rows.length,
      exceptions: 0,
      likely: 0,
      posted: 0,
      skipped: 0,
      requested: 0,
    };
    for (const r of rows) {
      if (r.status === "posted") c.posted++;
      else if (r.status === "skipped") c.skipped++;
      else if (r.status === "requested") c.requested++;
      else if (r.selectedKey && r.bestConfidence && r.bestConfidence !== "low") {
        c.likely++;
      } else c.exceptions++;
    }
    return c;
  }, [rows]);

  const filteredIndices = useMemo(() => {
    const out: number[] = [];
    rows.forEach((r, i) => {
      let keep = false;
      switch (filter) {
        case "exceptions":
          keep =
            r.status === "pending" &&
            (!r.selectedKey ||
              !r.bestConfidence ||
              r.bestConfidence === "low");
          break;
        case "likely":
          keep =
            r.status === "pending" &&
            !!r.selectedKey &&
            r.bestConfidence !== null &&
            r.bestConfidence !== "low";
          break;
        case "posted":
          keep = r.status === "posted";
          break;
        case "skipped":
          keep = r.status === "skipped";
          break;
        case "requested":
          keep = r.status === "requested";
          break;
        case "all":
          keep = true;
          break;
      }
      if (keep) out.push(i);
    });
    return out;
  }, [rows, filter]);

  // Wenn der aktive Index aus dem Filter fällt, auf die erste sichtbare Zeile
  useEffect(() => {
    if (
      activeIdx !== null &&
      !filteredIndices.includes(activeIdx) &&
      filteredIndices.length > 0
    ) {
      setActiveIdx(filteredIndices[0]);
    } else if (filteredIndices.length === 0) {
      setActiveIdx(null);
    }
  }, [filteredIndices, activeIdx]);

  const postM = useMutation({
    mutationFn: async (idx: number) => {
      const row = rows[idx];
      const candidate = row.candidates.find(
        (c) => candidateKey(c) === row.selectedKey
      );
      if (!candidate) throw new Error("Keine Auswahl getroffen.");
      const item = candidate.openItem;
      const isInflow = row.tx.typ === "H";
      const soll = isInflow ? "1200" : "1600";
      const haben = isInflow ? "1400" : "1200";
      await createEntry({
        datum: row.tx.datum,
        beleg_nr: item.beleg_nr,
        beschreibung: (
          `Zahlungsabgleich Bank → ${item.gegenseite}` +
          (row.tx.verwendungszweck ? ` (${row.tx.verwendungszweck})` : "")
        ).slice(0, 140),
        soll_konto: soll,
        haben_konto: haben,
        betrag: row.tx.betrag,
        ust_satz: null,
        status: "gebucht",
        client_id: selectedMandantId,
        skonto_pct: null,
        skonto_tage: null,
        gegenseite: row.tx.gegenseite_name ?? item.gegenseite,
        faelligkeit: null,
      });
      return idx;
    },
    onSuccess: (idx) => {
      setRows((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], status: "posted" };
        return copy;
      });
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Zahlung verbucht.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Skonto-Automatik: bucht 2-3 Zeilen (Zahlung + Skonto-Netto + ggf.
  // USt-Korrektur) mit derselben beleg_nr. Wird nur aus der UI aufgerufen,
  // wenn `activeSkontoPlan.applicable === true` UND der Nutzer den Split-
  // Button bestätigt.
  const postSkontoM = useMutation({
    mutationFn: async (args: { idx: number; plan: SkontoPlan }) => {
      if (!args.plan.applicable) {
        throw new Error("Skonto-Plan nicht anwendbar.");
      }
      const row = rows[args.idx];
      const candidate = row.candidates.find(
        (c) => candidateKey(c) === row.selectedKey
      );
      if (!candidate) throw new Error("Keine Auswahl getroffen.");
      const item = candidate.openItem;
      for (const line of args.plan.lines) {
        await createEntry({
          datum: row.tx.datum,
          beleg_nr: item.beleg_nr,
          beschreibung: (
            `${line.beschreibung} — ${item.gegenseite}`
          ).slice(0, 140),
          soll_konto: line.soll_konto,
          haben_konto: line.haben_konto,
          betrag: line.betrag,
          ust_satz: null,
          status: "gebucht",
          client_id: selectedMandantId,
          skonto_pct: null,
          skonto_tage: null,
          gegenseite: row.tx.gegenseite_name ?? item.gegenseite,
          faelligkeit: null,
        });
      }
      return args.idx;
    },
    onSuccess: (idx) => {
      setRows((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], status: "posted" };
        return copy;
      });
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Zahlung mit Skonto verbucht.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const requestM = useMutation({
    mutationFn: async (args: {
      idx: number;
      email: string;
      name: string;
      openMailto: boolean;
    }) => {
      const r = rows[args.idx];
      const req = await createReceiptRequest(
        {
          bank_datum: r.tx.datum,
          bank_betrag: r.tx.betrag,
          bank_verwendung: r.tx.verwendungszweck,
          bank_gegenseite: r.tx.gegenseite_name,
          bank_iban: r.tx.gegenseite_iban ?? null,
          recipient_email: args.email || null,
          recipient_name: args.name || null,
        },
        selectedMandantId
      );
      if (args.openMailto && args.email) {
        const { subject, body } = buildReceiptRequestDraft(
          {
            bank_datum: r.tx.datum,
            bank_betrag: r.tx.betrag,
            bank_verwendung: r.tx.verwendungszweck,
            bank_gegenseite: r.tx.gegenseite_name,
            bank_iban: r.tx.gegenseite_iban ?? null,
            recipient_name: args.name,
          },
          {
            kanzleiName: settings.kanzleiName,
            replyEmail: user?.email ?? settings.kanzleiEmail,
          }
        );
        window.location.href = buildMailtoUrl(args.email, subject, body);
      }
      return { idx: args.idx, req };
    },
    onSuccess: ({ idx }) => {
      setRows((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], status: "requested" };
        return copy;
      });
      qc.invalidateQueries({ queryKey: ["receipt_requests"] });
      setRequestingFor(null);
      toast.success("Beleg-Anforderung angelegt.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function updateSelection(rowIdx: number, key: string | null) {
    setRows((prev) => {
      const copy = [...prev];
      copy[rowIdx] = { ...copy[rowIdx], selectedKey: key };
      return copy;
    });
  }

  function skip(rowIdx: number) {
    setRows((prev) => {
      const copy = [...prev];
      copy[rowIdx] = { ...copy[rowIdx], status: "skipped" };
      return copy;
    });
  }

  // Keyboard-Shortcuts im linken Panel
  function onListKey(e: KeyboardEvent<HTMLDivElement>) {
    if (filteredIndices.length === 0) return;
    const currentPos =
      activeIdx !== null ? filteredIndices.indexOf(activeIdx) : -1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next =
        currentPos < filteredIndices.length - 1 ? currentPos + 1 : 0;
      setActiveIdx(filteredIndices[next]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = currentPos > 0 ? currentPos - 1 : filteredIndices.length - 1;
      setActiveIdx(filteredIndices[next]);
    } else if (e.key === "Enter" && activeIdx !== null) {
      const r = rows[activeIdx];
      if (r.status === "pending" && r.selectedKey && perms.canWrite) {
        e.preventDefault();
        postM.mutate(activeIdx);
      }
    } else if ((e.key === "s" || e.key === "S") && activeIdx !== null) {
      const r = rows[activeIdx];
      if (r.status === "pending") {
        e.preventDefault();
        skip(activeIdx);
      }
    }
  }

  // Divider-Drag
  const dragging = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const startDrag = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
  }, []);
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current || !gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(30, Math.min(75, pct));
      setDividerPct(clamped);
    }
    function onUp() {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = "";
        try {
          localStorage.setItem("harouda:reconcDivider", String(dividerPct));
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dividerPct]);

  const activeRow = activeIdx !== null ? rows[activeIdx] : null;

  const activeSkontoPlan = useMemo<SkontoPlan | null>(() => {
    if (!activeRow || !activeRow.selectedKey || !entriesQ.data) return null;
    const cand = activeRow.candidates.find(
      (c) => candidateKey(c) === activeRow.selectedKey
    );
    if (!cand) return null;
    return findSkontoPlanFor(activeRow.tx, cand.openItem, entriesQ.data);
  }, [activeRow, entriesQ.data]);

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>Bank-Abstimmung</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff.</span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report reconc">
      <header className="report__head">
        <Link to="/bankimport" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Bank-Import
        </Link>
        <div className="report__head-title">
          <h1>
            <Link2
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Bank-Abstimmung
          </h1>
          <p>
            Split-Screen: links Bank-Transaktionen, rechts Vorschläge zum
            Abgleich. Standard-Filter zeigt nur <strong>offene Ausnahmen</strong>;
            bestätigte Matches werden ausgeblendet.
          </p>
        </div>
        <div className="period">
          <input
            ref={fileRef}
            type="file"
            accept=".mt940,.sta,.txt,.xml,.csv"
            onChange={handleFile}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
          >
            {parsing ? (
              <>
                <Loader2 size={16} className="login__spinner" />
                Lade …
              </>
            ) : (
              <>
                <FileUp size={16} />
                Kontoauszug laden
              </>
            )}
          </button>
        </div>
      </header>

      <BankReconPersistenceBanner
        mandantId={selectedMandantId}
        bankTx={rows.map((r, idx) => ({
          id: `reconc-row-${idx}`,
          datum: r.tx.datum,
          betrag: r.tx.typ === "H" ? r.tx.betrag : -r.tx.betrag,
          vwz: r.tx.verwendungszweck,
          iban_gegenkonto: r.tx.gegenseite_iban ?? undefined,
        }))}
        journalEntries={(entriesQ.data ?? []).map((e) => ({
          id: e.id,
          datum: e.datum,
          betrag: Number(e.betrag),
          buchungstext: e.beschreibung,
          belegnr: e.beleg_nr,
        }))}
      />

      <aside className="taxcalc__hint">
        <Info size={14} />
        <span>
          <strong>Tastatur:</strong> ↑/↓ im linken Panel navigieren,{" "}
          <kbd>↵</kbd> bucht die aktuelle Auswahl, <kbd>S</kbd> überspringt.
          Klicken auf eine Bank-Zeile zeigt die Kandidaten rechts.
        </span>
      </aside>

      {stmt && (
        <nav className="reconc__filterbar">
          {(["exceptions", "likely", "posted", "skipped", "requested", "all"] as FilterMode[]).map(
            (f) => {
              const n =
                f === "all"
                  ? counts.all
                  : f === "exceptions"
                    ? counts.exceptions
                    : f === "likely"
                      ? counts.likely
                      : f === "posted"
                        ? counts.posted
                        : f === "skipped"
                          ? counts.skipped
                          : counts.requested;
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={active ? "is-active" : ""}
                  disabled={n === 0 && f !== "exceptions"}
                >
                  {FILTER_LABEL[f]}
                  <span className="reconc__filter-count">{n}</span>
                </button>
              );
            }
          )}
        </nav>
      )}

      {rows.length === 0 ? (
        <section className="card reconc__empty">
          <span>
            Noch kein Kontoauszug geladen. MT940, CAMT.053 oder CSV oben
            auswählen.
          </span>
        </section>
      ) : (
        <div
          className="reconc__grid"
          ref={gridRef}
          style={{ gridTemplateColumns: `${dividerPct}fr 6px ${100 - dividerPct}fr` }}
        >
          <div
            className="reconc__left"
            tabIndex={0}
            onKeyDown={onListKey}
            aria-label="Bank-Transaktionen"
          >
            {filteredIndices.length === 0 ? (
              <p className="reconc__muted" style={{ padding: 20 }}>
                Keine Zeilen im Filter „{FILTER_LABEL[filter]}".
              </p>
            ) : (
              <ul className="reconc__list">
                {filteredIndices.map((i) => {
                  const r = rows[i];
                  const isActive = i === activeIdx;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        className={`reconc__row is-${r.status} ${
                          isActive ? "is-focus" : ""
                        }`}
                        onClick={() => setActiveIdx(i)}
                        onMouseEnter={() => {
                          /* do not steal focus */
                        }}
                      >
                        <div className="reconc__row-top">
                          <span className="mono">
                            {new Date(r.tx.datum).toLocaleDateString("de-DE")}
                          </span>
                          <span
                            className={`reconc__amount ${
                              r.tx.typ === "H" ? "is-in" : "is-out"
                            }`}
                          >
                            {r.tx.typ === "H" ? "+" : "−"}
                            {euro.format(r.tx.betrag)}
                          </span>
                        </div>
                        {r.tx.gegenseite_name && (
                          <div className="reconc__row-name">
                            {r.tx.gegenseite_name}
                          </div>
                        )}
                        <div className="reconc__row-zweck">
                          {r.tx.verwendungszweck || "— kein Verwendungszweck —"}
                        </div>
                        <div className="reconc__row-foot">
                          <StatusPill row={r} />
                          {r.bestConfidence && r.status === "pending" && (
                            <span
                              className="reconc__conf"
                              style={{
                                color: CONF_COLOR[r.bestConfidence],
                              }}
                            >
                              Match: {CONF_LABEL[r.bestConfidence]}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div
            className="reconc__divider"
            role="separator"
            aria-orientation="vertical"
            onMouseDown={startDrag}
            title="Trennlinie verschieben"
          />

          <div className="reconc__right">
            {activeRow === null ? (
              <p className="reconc__muted" style={{ padding: 20 }}>
                Links eine Zeile auswählen.
              </p>
            ) : (
              <ActiveRowPanel
                row={activeRow}
                rowIdx={activeIdx as number}
                canWrite={perms.canWrite}
                skontoPlan={activeSkontoPlan}
                onSelect={(key) => updateSelection(activeIdx as number, key)}
                onPost={() => postM.mutate(activeIdx as number)}
                onPostWithSkonto={() =>
                  activeSkontoPlan &&
                  postSkontoM.mutate({
                    idx: activeIdx as number,
                    plan: activeSkontoPlan,
                  })
                }
                onSkip={() => skip(activeIdx as number)}
                onRequestOpen={() => setRequestingFor(activeIdx)}
                isPosting={postM.isPending}
                isPostingSkonto={postSkontoM.isPending}
                requestPending={requestM.isPending}
                requestingFor={requestingFor}
                onRequestSubmit={(email, name, openMailto) =>
                  requestM.mutate({
                    idx: activeIdx as number,
                    email,
                    name,
                    openMailto,
                  })
                }
                onRequestCancel={() => setRequestingFor(null)}
              />
            )}
          </div>
        </div>
      )}

      {!perms.canWrite && stmt && (
        <aside className="taxcalc__hint">
          <Landmark size={14} />
          <span>Als Nur-Lese-Nutzer:in können Sie keine Buchungen anlegen.</span>
        </aside>
      )}
    </div>
  );
}

function StatusPill({ row }: { row: Row }) {
  if (row.status === "posted")
    return (
      <span className="reconc__pill is-ok">
        <Check size={11} /> Gebucht
      </span>
    );
  if (row.status === "skipped")
    return <span className="reconc__pill">Übersprungen</span>;
  if (row.status === "requested")
    return (
      <span className="reconc__pill is-warn">
        <Receipt size={11} /> Beleg angefordert
      </span>
    );
  return <span className="reconc__pill">Offen</span>;
}

function ActiveRowPanel({
  row,
  rowIdx,
  canWrite,
  skontoPlan,
  onSelect,
  onPost,
  onPostWithSkonto,
  onSkip,
  onRequestOpen,
  isPosting,
  isPostingSkonto,
  requestPending,
  requestingFor,
  onRequestSubmit,
  onRequestCancel,
}: {
  row: Row;
  rowIdx: number;
  canWrite: boolean;
  skontoPlan: SkontoPlan | null;
  onSelect: (key: string | null) => void;
  onPost: () => void;
  onPostWithSkonto: () => void;
  onSkip: () => void;
  onRequestOpen: () => void;
  isPosting: boolean;
  isPostingSkonto: boolean;
  requestPending: boolean;
  requestingFor: number | null;
  onRequestSubmit: (email: string, name: string, openMailto: boolean) => void;
  onRequestCancel: () => void;
}) {
  const showRequestForm = requestingFor === rowIdx;

  return (
    <div className="reconc__active">
      <header className="reconc__active-head">
        <div>
          <div className="reconc__muted">
            {new Date(row.tx.datum).toLocaleDateString("de-DE")} ·{" "}
            {row.tx.typ === "H" ? "Eingang" : "Ausgang"}
          </div>
          <div className="reconc__active-amount">
            {row.tx.typ === "H" ? "+" : "−"}
            {euro.format(row.tx.betrag)}
          </div>
          {row.tx.gegenseite_name && (
            <div className="reconc__active-name">
              {row.tx.gegenseite_name}
            </div>
          )}
          {row.tx.verwendungszweck && (
            <div className="reconc__muted" style={{ maxWidth: 500 }}>
              „{row.tx.verwendungszweck}"
            </div>
          )}
        </div>
      </header>

      <section className="reconc__candidates-section">
        <h3>Kandidaten</h3>
        {row.candidates.length === 0 ? (
          <p className="reconc__muted">
            Kein OPOS-Match gefunden. Beleg anfordern oder überspringen.
          </p>
        ) : (
          <ul className="reconc__candidates">
            {row.candidates.map((c) => {
              const key = candidateKey(c);
              const selected = row.selectedKey === key;
              return (
                <li key={key}>
                  <label
                    className={`reconc__cand ${selected ? "is-selected" : ""}`}
                    title={c.reasons.join(" ")}
                  >
                    <input
                      type="radio"
                      name={`cand-${rowIdx}`}
                      checked={selected}
                      onChange={() => onSelect(key)}
                      disabled={row.status !== "pending"}
                    />
                    <span>
                      <strong>{c.openItem.beleg_nr}</strong>{" "}
                      {c.openItem.gegenseite}
                      <em
                        style={{
                          color: CONF_COLOR[c.confidence],
                          marginLeft: 6,
                          fontStyle: "normal",
                          fontWeight: 700,
                        }}
                      >
                        [{CONF_LABEL[c.confidence]} · {c.score.toFixed(2)}]
                      </em>
                      <span className="reconc__reason">
                        {c.reasons.join(" ")}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {row.status === "pending" && skontoPlan?.applicable && (
        <section className="reconc__skonto">
          <h4>
            Skonto-Automatik ({skontoPlan.lines.length}-Zeilen-Vorschlag)
          </h4>
          <p className="reconc__muted">
            Skonto-Brutto {euro.format(skontoPlan.skontoBrutto)} · netto{" "}
            {euro.format(skontoPlan.skontoNetto)}
            {skontoPlan.skontoUst > 0
              ? ` · USt-Korrektur ${euro.format(skontoPlan.skontoUst)}`
              : ""}{" "}
            · Skonto-Frist bis {skontoPlan.skontoFristBis}
          </p>
          <table className="reconc__skonto-table">
            <thead>
              <tr>
                <th>Soll</th>
                <th>Haben</th>
                <th style={{ textAlign: "right" }}>Betrag</th>
                <th>Beschreibung</th>
              </tr>
            </thead>
            <tbody>
              {skontoPlan.lines.map((line, i) => (
                <tr key={i}>
                  <td className="mono">{line.soll_konto}</td>
                  <td className="mono">{line.haben_konto}</td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {euro.format(line.betrag)}
                  </td>
                  <td>{line.beschreibung}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <small className="reconc__muted">
            Kein Auto-Buchen: Sie müssen den Split-Button unten explizit
            bestätigen.
          </small>
        </section>
      )}

      {row.status === "pending" && (
        <div className="reconc__active-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onPost}
            disabled={!row.selectedKey || !canWrite || isPosting || isPostingSkonto}
          >
            <Check size={14} />{" "}
            {skontoPlan?.applicable ? "Direkt buchen (1 Zeile)" : "Buchen"}
          </button>
          {skontoPlan?.applicable && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onPostWithSkonto}
              disabled={!row.selectedKey || !canWrite || isPosting || isPostingSkonto}
              title="Erzeugt 2-3 Buchungen: Zahlung, Skonto-Netto, USt-Korrektur"
            >
              <Check size={14} /> Mit Skonto buchen ({skontoPlan.lines.length} Zeilen)
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline"
            onClick={onSkip}
          >
            <SkipForward size={14} /> Überspringen
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onRequestOpen}
            disabled={!canWrite}
          >
            <Mail size={14} /> Beleg anfordern
          </button>
        </div>
      )}

      {showRequestForm && (
        <ReceiptRequestForm
          onSubmit={onRequestSubmit}
          onCancel={onRequestCancel}
          pending={requestPending}
          defaultName={row.tx.gegenseite_name ?? ""}
        />
      )}

      {row.status === "posted" && (
        <div className="reconc__active-info is-ok">
          <Check size={14} /> Buchung erzeugt.
        </div>
      )}
      {row.status === "skipped" && (
        <div className="reconc__active-info">
          Übersprungen — wieder auf „Offen" setzen, um nochmal zu prüfen.
        </div>
      )}
      {row.status === "requested" && (
        <div className="reconc__active-info is-warn">
          <Receipt size={14} /> Beleg-Anforderung angelegt.{" "}
          <Link to="/banking/belegabfragen">
            Zur Liste der offenen Anforderungen →
          </Link>
        </div>
      )}
    </div>
  );
}

function ReceiptRequestForm({
  onSubmit,
  onCancel,
  pending,
  defaultName,
}: {
  onSubmit: (email: string, name: string, openMailto: boolean) => void;
  onCancel: () => void;
  pending: boolean;
  defaultName: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState(defaultName);
  return (
    <form
      className="reconc__rcpt-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email.trim(), name.trim(), !!email.trim());
      }}
    >
      <label className="form-field">
        <span>Empfänger-Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Meyer GmbH"
        />
      </label>
      <label className="form-field">
        <span>E-Mail (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="buchhaltung@meyer.de"
        />
      </label>
      <div className="reconc__rcpt-actions">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={pending}
        >
          <Mail size={14} />
          {email.trim()
            ? "Anfrage speichern & E-Mail öffnen"
            : "Anfrage speichern"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onCancel}
        >
          Abbrechen
        </button>
      </div>
      <small className="reconc__muted">
        Kein automatischer Versand: bei eingetragener E-Mail wird nur das
        Standard-Mailprogramm mit Entwurf geöffnet.
      </small>
    </form>
  );
}
