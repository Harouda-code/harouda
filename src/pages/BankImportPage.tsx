import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  FileUp,
  Info,
  Landmark,
  Loader2,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { createEntry } from "../api/journal";
import { lookupBank } from "../data/blz";
import {
  parseBankFile,
  suggestKonto,
  type BankTx,
  type MT940Statement,
} from "../utils/bankImport";
import { useMandant } from "../contexts/MandantContext";
import "./BankImportPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type RowState = {
  tx: BankTx;
  soll: string;
  haben: string;
  beleg: string;
  beschreibung: string;
  status: "pending" | "posted" | "skipped";
};

export default function BankImportPage() {
  const qc = useQueryClient();
  const { selectedMandantId } = useMandant();
  const [stmt, setStmt] = useState<MT940Statement | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });
  const accountOptions = useMemo(
    () =>
      (accountsQ.data ?? [])
        .filter((a) => a.is_active)
        .sort((a, b) => a.konto_nr.localeCompare(b.konto_nr)),
    [accountsQ.data]
  );

  const bankInfo = useMemo(
    () => (stmt?.konto_iban ? lookupBank(stmt.konto_iban) : null),
    [stmt?.konto_iban]
  );

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await parseBankFile(file);
      setStmt(parsed);
      const rowStates: RowState[] = parsed.transaktionen.map((tx, i) => {
        const suggest = suggestKonto(tx);
        return {
          tx,
          soll: suggest.soll ?? "",
          haben: suggest.haben ?? "1200",
          beleg:
            tx.reference ??
            `BANK-${new Date(tx.datum).toISOString().slice(0, 10)}-${String(
              i + 1
            ).padStart(3, "0")}`,
          beschreibung:
            tx.verwendungszweck.slice(0, 120) ||
            tx.gegenseite_name ||
            "Bankbuchung",
          status: "pending",
        };
      });
      setRows(rowStates);
      toast.success(
        `${parsed.transaktionen.length} Transaktion(en) eingelesen.`
      );
    } catch (err) {
      toast.error(`Import fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  }

  const postM = useMutation({
    mutationFn: async (idx: number) => {
      const r = rows[idx];
      await createEntry({
        datum: r.tx.datum,
        beleg_nr: r.beleg,
        beschreibung: r.beschreibung,
        soll_konto: r.soll,
        haben_konto: r.haben,
        betrag: r.tx.betrag,
        ust_satz: null,
        status: "gebucht",
        client_id: selectedMandantId,
        skonto_pct: null,
        skonto_tage: null,
        gegenseite: r.tx.gegenseite_name,
        faelligkeit: null,
      });
      return idx;
    },
    onSuccess: (idx) => {
      setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, status: "posted" } : r)));
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Buchung angelegt.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const postAllM = useMutation({
    mutationFn: async () => {
      let ok = 0;
      let skipped = 0;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (r.status !== "pending") continue;
        if (!r.soll || !r.haben) {
          skipped++;
          continue;
        }
        try {
          await createEntry({
            datum: r.tx.datum,
            beleg_nr: r.beleg,
            beschreibung: r.beschreibung,
            soll_konto: r.soll,
            haben_konto: r.haben,
            betrag: r.tx.betrag,
            ust_satz: null,
            status: "gebucht",
            client_id: selectedMandantId,
            skonto_pct: null,
            skonto_tage: null,
            gegenseite: r.tx.gegenseite_name,
            faelligkeit: null,
          });
          ok++;
          setRows((rs) =>
            rs.map((row, idx) =>
              idx === i ? { ...row, status: "posted" } : row
            )
          );
        } catch {
          skipped++;
        }
      }
      return { ok, skipped };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      if (r.skipped === 0) toast.success(`${r.ok} Buchungen angelegt.`);
      else
        toast.warning(
          `${r.ok} angelegt, ${r.skipped} übersprungen (fehlendes Konto).`
        );
    },
  });

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const totalIn = rows
    .filter((r) => r.tx.typ === "H")
    .reduce((s, r) => s + r.tx.betrag, 0);
  const totalOut = rows
    .filter((r) => r.tx.typ === "S")
    .reduce((s, r) => s + r.tx.betrag, 0);

  return (
    <div className="bankimport">
      <header className="bankimport__head">
        <div>
          <h1>Bankimport</h1>
          <p>
            MT940 oder CAMT.053 Kontoauszug hochladen, Transaktionen prüfen,
            als Journalbuchungen anlegen.
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".sta,.txt,.mt940,.xml,.camt,.camt053"
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
                Lese Datei …
              </>
            ) : (
              <>
                <FileUp size={16} />
                Datei auswählen
              </>
            )}
          </button>
        </div>
      </header>

      {!stmt && (
        <div className="card bankimport__empty">
          <div className="docs__empty-icon">
            <Landmark size={28} strokeWidth={1.5} />
          </div>
          <h2>Noch keine Datei geladen</h2>
          <p>
            Laden Sie einen Kontoauszug im Format MT940 (SWIFT) oder
            CAMT.053 (ISO 20022 XML) hoch. Die Dateien exportiert Ihre Bank
            im Online-Banking-Portal.
          </p>
          <p className="bankimport__hint">
            <Info size={14} />
            Diese App liest Kontoauszüge <strong>aus Dateien</strong>. Eine
            direkte Bank-Anbindung (PSD2, Open Banking) benötigt einen
            TPP-Vertrag oder einen Aggregator und ist nicht enthalten.
          </p>
        </div>
      )}

      {stmt && (
        <>
          <section className="card bankimport__stmt">
            <div className="bankimport__stmt-head">
              <div>
                <h2>Kontoauszug</h2>
                <p className="mono" style={{ margin: 0 }}>
                  {stmt.konto_iban ?? "—"}
                </p>
                {bankInfo && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "var(--muted)",
                      fontSize: "0.88rem",
                    }}
                  >
                    {bankInfo.name}
                    {bankInfo.bic ? ` · BIC ${bankInfo.bic}` : ""}
                  </p>
                )}
              </div>
              <dl className="bankimport__stats">
                <div>
                  <dt>Eröffnung</dt>
                  <dd className="mono">
                    {stmt.eroeffnung !== null
                      ? euro.format(stmt.eroeffnung)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Abschluss</dt>
                  <dd className="mono">
                    {stmt.abschluss !== null
                      ? euro.format(stmt.abschluss)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Eingänge</dt>
                  <dd className="mono" style={{ color: "var(--success)" }}>
                    + {euro.format(totalIn)}
                  </dd>
                </div>
                <div>
                  <dt>Ausgänge</dt>
                  <dd className="mono" style={{ color: "var(--danger)" }}>
                    − {euro.format(totalOut)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="card bankimport__actions">
            <div>
              <strong>{pendingCount}</strong> von {rows.length} noch
              offen
            </div>
            <button
              type="button"
              className="btn btn-navy"
              disabled={pendingCount === 0 || postAllM.isPending}
              onClick={() => postAllM.mutate()}
            >
              {postAllM.isPending ? (
                <>
                  <Loader2 size={16} className="login__spinner" />
                  Buche …
                </>
              ) : (
                <>
                  <Check size={16} />
                  Alle offenen übernehmen
                </>
              )}
            </button>
          </section>

          <div className="card bankimport__tablewrap">
            <table className="bankimport__table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Art</th>
                  <th>Gegenseite</th>
                  <th>Verwendungszweck</th>
                  <th>Soll</th>
                  <th>Haben</th>
                  <th>Beleg-Nr.</th>
                  <th className="is-num">Betrag</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={
                      r.status === "posted"
                        ? "is-posted"
                        : r.status === "skipped"
                        ? "is-skipped"
                        : ""
                    }
                  >
                    <td className="mono">
                      {new Date(r.tx.datum).toLocaleDateString("de-DE")}
                    </td>
                    <td>
                      {r.tx.typ === "H" ? (
                        <span
                          className="bankimport__typ is-in"
                          title="Eingang (Haben)"
                        >
                          <ArrowDownRight size={12} /> Ein
                        </span>
                      ) : (
                        <span
                          className="bankimport__typ is-out"
                          title="Ausgang (Soll)"
                        >
                          <ArrowUpRight size={12} /> Aus
                        </span>
                      )}
                    </td>
                    <td>
                      {r.tx.gegenseite_name || (
                        <span className="journal__cell-muted">—</span>
                      )}
                      {r.tx.gegenseite_iban && (
                        <span className="journal__cell-sub mono">
                          {r.tx.gegenseite_iban}
                        </span>
                      )}
                    </td>
                    <td>
                      <input
                        value={r.beschreibung}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((row, idx) =>
                              idx === i
                                ? { ...row, beschreibung: e.target.value }
                                : row
                            )
                          )
                        }
                        disabled={r.status !== "pending"}
                      />
                    </td>
                    <td>
                      <select
                        value={r.soll}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((row, idx) =>
                              idx === i
                                ? { ...row, soll: e.target.value }
                                : row
                            )
                          )
                        }
                        disabled={r.status !== "pending"}
                      >
                        <option value="">—</option>
                        {accountOptions.map((a) => (
                          <option key={a.konto_nr} value={a.konto_nr}>
                            {a.konto_nr} {a.bezeichnung}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={r.haben}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((row, idx) =>
                              idx === i
                                ? { ...row, haben: e.target.value }
                                : row
                            )
                          )
                        }
                        disabled={r.status !== "pending"}
                      >
                        <option value="">—</option>
                        {accountOptions.map((a) => (
                          <option key={a.konto_nr} value={a.konto_nr}>
                            {a.konto_nr} {a.bezeichnung}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="mono"
                        value={r.beleg}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((row, idx) =>
                              idx === i
                                ? { ...row, beleg: e.target.value }
                                : row
                            )
                          )
                        }
                        disabled={r.status !== "pending"}
                      />
                    </td>
                    <td
                      className="is-num mono"
                      style={{
                        color:
                          r.tx.typ === "H" ? "var(--success)" : "var(--danger)",
                        fontWeight: 600,
                      }}
                    >
                      {r.tx.typ === "H" ? "+ " : "− "}
                      {euro.format(r.tx.betrag)}
                    </td>
                    <td>
                      {r.status === "posted" ? (
                        <span className="dash__pill is-ok">gebucht</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={!r.soll || !r.haben || postM.isPending}
                          onClick={() => postM.mutate(i)}
                        >
                          Buchen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
