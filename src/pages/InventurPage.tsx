/**
 * InventurPage (Sprint 17 / Schritt 6).
 *
 * Drei Tabs: Anlagen-Inventur · Bestands-Inventur · Abschluss.
 * KEINE hart codierten Konten — der Buchhalter waehlt die konkreten
 * Unter-Konten aus gefilterten Dropdowns.
 *
 * Rechtsbasis: § 240 HGB, § 241a HGB, § 253 Abs. 3/4 HGB, GoBD Rz. 50-52.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ClipboardCheck, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MandantRequiredGuard } from "../components/MandantRequiredGuard";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import { fetchAccounts } from "../api/accounts";
import { fetchAnlagegueter } from "../api/anlagen";
import { uploadDocument } from "../api/documents";
import { createEntry } from "../api/journal";
import {
  createSession,
  getSessionForYear,
  listAnlagenChecks,
  listBestaende,
  updateSession,
  upsertAnlageCheck,
  upsertBestand,
} from "../api/inventur";
import {
  detectDominantKontenrahmen,
  filterAusserordentlicherAufwandAccounts,
  filterBestandsveraenderungAccounts,
  filterVorratAccounts,
} from "../domain/inventur/kontoKategorien";
import {
  prepareAnlagenInventur,
  proposeAbgangsBuchung,
  type AnlageInventurCheck,
} from "../domain/inventur/AnlagenInventurService";
import { proposeBestandDelta } from "../domain/inventur/BestandVeraenderungProposer";
import type { InventurAnlageStatus, InventurBestand } from "../types/db";

type Tab = "anlagen" | "bestaende" | "abschluss";

function InventurInner() {
  const { selectedMandantId } = useMandant();
  const { selectedYear } = useYear();
  const qc = useQueryClient();
  const mandantId = selectedMandantId ?? "";
  const stichtag = `${selectedYear}-12-31`;

  const [tab, setTab] = useState<Tab>("anlagen");
  const [busy, setBusy] = useState(false);

  const sessionQ = useQuery({
    queryKey: ["inventur-session", mandantId, selectedYear],
    queryFn: () => getSessionForYear(mandantId, selectedYear),
    enabled: !!mandantId,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });
  const anlagenQ = useQuery({
    queryKey: ["anlagegueter", mandantId],
    queryFn: () => fetchAnlagegueter(mandantId || null),
    enabled: !!mandantId,
  });
  const sessionId = sessionQ.data?.id ?? null;
  const anlChecksQ = useQuery({
    queryKey: ["inventur-anlagen-checks", sessionId],
    queryFn: () => (sessionId ? listAnlagenChecks(sessionId) : Promise.resolve([])),
    enabled: !!sessionId,
  });
  const bestaendeQ = useQuery({
    queryKey: ["inventur-bestaende", sessionId],
    queryFn: () => (sessionId ? listBestaende(sessionId) : Promise.resolve([])),
    enabled: !!sessionId,
  });

  const kontenrahmen = useMemo(() => {
    if (!accountsQ.data) return "SKR03" as const;
    return detectDominantKontenrahmen(accountsQ.data).kontenrahmen;
  }, [accountsQ.data]);

  const vorratAccounts = useMemo(
    () =>
      accountsQ.data
        ? filterVorratAccounts(accountsQ.data, kontenrahmen)
        : [],
    [accountsQ.data, kontenrahmen]
  );
  const veraenderungAccounts = useMemo(
    () =>
      accountsQ.data
        ? filterBestandsveraenderungAccounts(accountsQ.data, kontenrahmen)
        : [],
    [accountsQ.data, kontenrahmen]
  );
  const aufwandAccounts = useMemo(
    () =>
      accountsQ.data
        ? filterAusserordentlicherAufwandAccounts(accountsQ.data, kontenrahmen)
        : [],
    [accountsQ.data, kontenrahmen]
  );

  const anlagenChecks = useMemo<AnlageInventurCheck[]>(() => {
    if (!anlagenQ.data) return [];
    return prepareAnlagenInventur({
      anlagen: anlagenQ.data,
      stichtag,
      existingChecks: anlChecksQ.data ?? [],
    });
  }, [anlagenQ.data, anlChecksQ.data, stichtag]);

  async function handleCreateSession(): Promise<void> {
    if (!mandantId) return;
    setBusy(true);
    try {
      await createSession({
        client_id: mandantId,
        jahr: selectedYear,
        stichtag,
      });
      await qc.invalidateQueries({ queryKey: ["inventur-session"] });
      toast.success(`Inventur-Session für ${selectedYear} erstellt.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAnlageStatusChange(
    check: AnlageInventurCheck,
    status: InventurAnlageStatus,
    aufwandKontoNr?: string
  ): Promise<void> {
    if (!sessionId || !anlagenQ.data) return;
    setBusy(true);
    try {
      let abgangsBuchungId: string | undefined;
      if ((status === "verlust" || status === "schaden") && aufwandKontoNr) {
        const anlage = anlagenQ.data.find((a) => a.id === check.anlage_id);
        if (!anlage) throw new Error("Anlage nicht gefunden.");
        const proposal = proposeAbgangsBuchung({
          anlage,
          buchwert_stichtag: check.buchwert_stichtag,
          grund: status,
          stichtag,
          aufwand_konto_nr: aufwandKontoNr,
        });
        if (proposal.soll_konto_nr && proposal.betrag > 0) {
          const entry = await createEntry({
            datum: stichtag,
            beleg_nr: `INV-ABGANG-${check.inventar_nr}`,
            beschreibung: proposal.buchungstext,
            soll_konto: proposal.soll_konto_nr,
            haben_konto: proposal.haben_konto_nr,
            betrag: proposal.betrag,
            ust_satz: null,
            status: "gebucht",
            client_id: mandantId,
            skonto_pct: null,
            skonto_tage: null,
            gegenseite: null,
            faelligkeit: null,
          });
          abgangsBuchungId = entry.id;
        }
      }
      await upsertAnlageCheck({
        session_id: sessionId,
        anlage_id: check.anlage_id,
        status,
        abgangs_buchung_id: abgangsBuchungId,
      });
      await qc.invalidateQueries({
        queryKey: ["inventur-anlagen-checks", sessionId],
      });
      toast.success(
        `Status '${status}' für ${check.bezeichnung} gespeichert.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveBestand(
    row: BestandRowState
  ): Promise<void> {
    if (!sessionId) return;
    setBusy(true);
    try {
      const saved = await upsertBestand({
        id: row.id,
        session_id: sessionId,
        bezeichnung: row.bezeichnung,
        vorrat_konto_nr: row.vorrat_konto_nr,
        anfangsbestand: Number(row.anfangsbestand) || 0,
        endbestand: Number(row.endbestand) || 0,
        niederstwert_aktiv: row.niederstwert_aktiv,
        niederstwert_begruendung: row.niederstwert_begruendung || undefined,
        inventurliste_document_id: row.inventurliste_document_id || undefined,
      });
      await qc.invalidateQueries({
        queryKey: ["inventur-bestaende", sessionId],
      });
      toast.success(`Bestandsposition "${saved.bezeichnung}" gespeichert.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleBookBestand(
    bestand: InventurBestand,
    veraenderungKontoNr: string
  ): Promise<void> {
    if (!sessionId) return;
    setBusy(true);
    try {
      const proposal = proposeBestandDelta({
        anfangsbestand: bestand.anfangsbestand,
        endbestand: bestand.endbestand,
        bezeichnung: bestand.bezeichnung,
        stichtag,
        vorrat_konto_nr: bestand.vorrat_konto_nr,
        veraenderungs_konto_nr: veraenderungKontoNr,
        niederstwert_aktiv: bestand.niederstwert_aktiv,
        niederstwert_begruendung: bestand.niederstwert_begruendung ?? undefined,
      });
      if (
        !proposal.soll_konto_nr ||
        !proposal.haben_konto_nr ||
        proposal.richtung === "unveraendert"
      ) {
        toast.message("Keine Buchung erforderlich (Delta = 0 oder Konto fehlt).");
        return;
      }
      const noteSuffix = bestand.niederstwert_aktiv
        ? ` — Niederstwert (§ 253 Abs. 4 HGB): ${bestand.niederstwert_begruendung}`
        : "";
      const entry = await createEntry({
        datum: stichtag,
        beleg_nr: `INV-BEST-${bestand.id.slice(0, 8)}`,
        beschreibung: proposal.buchungstext + noteSuffix,
        soll_konto: proposal.soll_konto_nr,
        haben_konto: proposal.haben_konto_nr,
        betrag: proposal.betrag,
        ust_satz: null,
        status: "gebucht",
        client_id: mandantId,
        skonto_pct: null,
        skonto_tage: null,
        gegenseite: null,
        faelligkeit: null,
      });
      await upsertBestand({
        id: bestand.id,
        session_id: sessionId,
        bezeichnung: bestand.bezeichnung,
        vorrat_konto_nr: bestand.vorrat_konto_nr,
        anfangsbestand: bestand.anfangsbestand,
        endbestand: bestand.endbestand,
        niederstwert_aktiv: bestand.niederstwert_aktiv,
        niederstwert_begruendung: bestand.niederstwert_begruendung ?? undefined,
        inventurliste_document_id: bestand.inventurliste_document_id ?? undefined,
        bestandsveraenderungs_buchung_id: entry.id,
      });
      await qc.invalidateQueries({
        queryKey: ["inventur-bestaende", sessionId],
      });
      toast.success(`Bestandsveraenderung gebucht (${proposal.richtung}).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCloseSession(): Promise<void> {
    if (!sessionQ.data) return;
    setBusy(true);
    try {
      await updateSession(sessionQ.data.id, {
        status: "abgeschlossen",
        anlagen_inventur_abgeschlossen: true,
        bestands_inventur_abgeschlossen: true,
        abgeschlossen_am: new Date().toISOString(),
      });
      await qc.invalidateQueries({ queryKey: ["inventur-session"] });
      toast.success("Inventur-Session abgeschlossen.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const allChecked =
    anlagenChecks.length > 0 &&
    anlagenChecks.every((c) => c.letzter_status && c.letzter_status !== "nicht_geprueft");
  const allBestaendeBooked =
    (bestaendeQ.data ?? []).every(
      (b) =>
        b.anfangsbestand === b.endbestand ||
        b.bestandsveraenderungs_buchung_id !== null
    );
  const allBestaendeHaveUpload =
    (bestaendeQ.data ?? []).every(
      (b) => b.inventurliste_document_id !== null
    );
  const canClose =
    sessionQ.data &&
    sessionQ.data.status === "offen" &&
    allChecked &&
    allBestaendeBooked &&
    allBestaendeHaveUpload;

  if (sessionQ.isLoading) {
    return (
      <div className="report">
        <p>Lade Inventur-Session…</p>
      </div>
    );
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/" className="report__back">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <div className="report__head-title">
          <h1>
            <ClipboardCheck size={22} style={{ verticalAlign: "-3px", marginRight: 8 }} />
            Inventur {selectedYear}
          </h1>
          <p>
            Anlagen-Inventur + Bestands-Inventur (manuell) · Stichtag{" "}
            {stichtag} · Kontenrahmen {kontenrahmen}
          </p>
        </div>
      </header>

      {!sessionQ.data ? (
        <section className="card" style={{ padding: 16 }}>
          <p>Für {selectedYear} existiert noch keine Inventur-Session.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateSession}
            disabled={busy || !mandantId}
            data-testid="btn-inventur-create-session"
          >
            Inventur-Session starten
          </button>
        </section>
      ) : (
        <>
          <aside
            className="ustva__disclaimer no-print"
            role="note"
            data-testid="inventur-disclaimer"
            style={{
              marginBottom: 12,
              padding: 12,
              background: "rgba(210,120,70,0.08)",
              border: "1px solid rgba(210,120,70,0.3)",
              borderRadius: 6,
              fontSize: "0.85rem",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle size={18} />
            <div>
              Unter-Konten je nach Branche des Mandanten auswählen (Rohstoffe /
              Handelswaren / Fertigerzeugnisse usw.). Es werden keine Konten
              automatisch belegt — die Letztverantwortung für die
              Buchungs-Zuordnung liegt beim Buchhalter.
            </div>
          </aside>

          <nav
            className="reconc__filterbar"
            data-testid="inventur-tabs"
            style={{ marginBottom: 12 }}
          >
            {(["anlagen", "bestaende", "abschluss"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                className="btn btn-outline"
                onClick={() => setTab(t)}
                style={tab === t ? { fontWeight: "bold" } : {}}
                data-testid={`tab-${t}`}
              >
                {t === "anlagen"
                  ? `Anlagen-Inventur (${
                      anlagenChecks.filter(
                        (c) => c.letzter_status && c.letzter_status !== "nicht_geprueft"
                      ).length
                    }/${anlagenChecks.length})`
                  : t === "bestaende"
                  ? `Bestands-Inventur (${(bestaendeQ.data ?? []).length})`
                  : "Abschluss"}
              </button>
            ))}
          </nav>

          {tab === "anlagen" && (
            <AnlagenTab
              checks={anlagenChecks}
              aufwandAccounts={aufwandAccounts}
              onChange={handleAnlageStatusChange}
              busy={busy}
            />
          )}
          {tab === "bestaende" && sessionId && (
            <BestaendeTab
              sessionId={sessionId}
              rows={bestaendeQ.data ?? []}
              vorratAccounts={vorratAccounts}
              veraenderungAccounts={veraenderungAccounts}
              mandantId={mandantId}
              busy={busy}
              onSaveBestand={handleSaveBestand}
              onBookBestand={handleBookBestand}
            />
          )}
          {tab === "abschluss" && (
            <AbschlussTab
              anlagenChecks={anlagenChecks}
              bestaende={bestaendeQ.data ?? []}
              canClose={!!canClose}
              onClose={handleCloseSession}
              busy={busy}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function AnlagenTab({
  checks,
  aufwandAccounts,
  onChange,
  busy,
}: {
  checks: AnlageInventurCheck[];
  aufwandAccounts: Array<{ konto_nr: string; bezeichnung: string }>;
  onChange: (
    check: AnlageInventurCheck,
    status: InventurAnlageStatus,
    aufwandKontoNr?: string
  ) => Promise<void>;
  busy: boolean;
}) {
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [selectedAufwand, setSelectedAufwand] = useState<string>("");

  if (checks.length === 0) {
    return (
      <section
        className="card"
        style={{ padding: 16 }}
        data-testid="inventur-anlagen-empty"
      >
        Keine aktiven Anlagen vorhanden.
      </section>
    );
  }

  return (
    <section data-testid="inventur-anlagen-tab">
      <table className="mono">
        <thead>
          <tr>
            <th>Inv-Nr</th>
            <th>Bezeichnung</th>
            <th className="is-num">Buchwert</th>
            <th>Status</th>
            <th>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c.anlage_id}>
              <td>{c.inventar_nr}</td>
              <td>{c.bezeichnung}</td>
              <td className="is-num">
                {c.buchwert_stichtag.toFixed(2)} €
              </td>
              <td>{c.letzter_status ?? "nicht_geprueft"}</td>
              <td>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onChange(c, "vorhanden")}
                    disabled={busy}
                    data-testid={`btn-anlage-vorhanden-${c.anlage_id}`}
                  >
                    Vorhanden
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setOpenRow(c.anlage_id)}
                    disabled={busy}
                    data-testid={`btn-anlage-verlust-${c.anlage_id}`}
                  >
                    Verlust
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setOpenRow(c.anlage_id);
                    }}
                    disabled={busy}
                    data-testid={`btn-anlage-schaden-${c.anlage_id}`}
                  >
                    Schaden
                  </button>
                </div>
                {openRow === c.anlage_id && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      background: "var(--ivory-100, #f7f8fa)",
                      borderRadius: 4,
                    }}
                    data-testid={`abgang-dialog-${c.anlage_id}`}
                  >
                    <label>
                      Aufwands-Konto (Ausserordentliche Aufw. / Sonst. betr. Aufw.):
                      <select
                        value={selectedAufwand}
                        onChange={(e) => setSelectedAufwand(e.target.value)}
                        data-testid={`select-aufwand-${c.anlage_id}`}
                      >
                        <option value="">— bitte wählen —</option>
                        {aufwandAccounts.map((a) => (
                          <option key={a.konto_nr} value={a.konto_nr}>
                            {a.konto_nr} {a.bezeichnung}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!selectedAufwand || busy}
                        onClick={async () => {
                          await onChange(c, "verlust", selectedAufwand);
                          setOpenRow(null);
                          setSelectedAufwand("");
                        }}
                        data-testid={`btn-confirm-abgang-${c.anlage_id}`}
                      >
                        Verlust + Buchung erstellen
                      </button>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────

type BestandRowState = {
  id?: string;
  bezeichnung: string;
  vorrat_konto_nr: string;
  anfangsbestand: string;
  endbestand: string;
  niederstwert_aktiv: boolean;
  niederstwert_begruendung: string;
  inventurliste_document_id: string;
};

function emptyBestandRow(): BestandRowState {
  return {
    bezeichnung: "",
    vorrat_konto_nr: "",
    anfangsbestand: "0",
    endbestand: "0",
    niederstwert_aktiv: false,
    niederstwert_begruendung: "",
    inventurliste_document_id: "",
  };
}

function BestaendeTab(props: {
  sessionId: string;
  rows: InventurBestand[];
  vorratAccounts: Array<{ konto_nr: string; bezeichnung: string }>;
  veraenderungAccounts: Array<{ konto_nr: string; bezeichnung: string }>;
  mandantId: string;
  busy: boolean;
  onSaveBestand: (row: BestandRowState) => Promise<void>;
  onBookBestand: (
    bestand: InventurBestand,
    veraenderungKontoNr: string
  ) => Promise<void>;
}) {
  const [newRow, setNewRow] = useState<BestandRowState>(emptyBestandRow());
  const [veraenderungKonto, setVeraenderungKonto] = useState<
    Record<string, string>
  >({});

  async function handleUpload(
    file: File,
    bestandId: string
  ): Promise<void> {
    try {
      const doc = await uploadDocument(file, props.mandantId);
      const row = props.rows.find((r) => r.id === bestandId);
      if (!row) return;
      await props.onSaveBestand({
        id: row.id,
        bezeichnung: row.bezeichnung,
        vorrat_konto_nr: row.vorrat_konto_nr,
        anfangsbestand: String(row.anfangsbestand),
        endbestand: String(row.endbestand),
        niederstwert_aktiv: row.niederstwert_aktiv,
        niederstwert_begruendung: row.niederstwert_begruendung ?? "",
        inventurliste_document_id: doc.id,
      });
      toast.success("Inventurliste hochgeladen.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section data-testid="inventur-bestaende-tab">
      <h2>Bestandspositionen</h2>
      <div
        className="card"
        style={{ padding: 12, marginBottom: 12 }}
        data-testid="inventur-bestand-new-form"
      >
        <h3>Neue Bestandsposition</h3>
        <label>
          Bezeichnung
          <input
            value={newRow.bezeichnung}
            onChange={(e) =>
              setNewRow({ ...newRow, bezeichnung: e.target.value })
            }
            data-testid="input-bestand-bezeichnung"
          />
        </label>
        <label>
          Vorrat-Konto
          <select
            value={newRow.vorrat_konto_nr}
            onChange={(e) =>
              setNewRow({ ...newRow, vorrat_konto_nr: e.target.value })
            }
            data-testid="select-vorrat-konto"
          >
            <option value="">— bitte wählen —</option>
            {props.vorratAccounts.map((a) => (
              <option key={a.konto_nr} value={a.konto_nr}>
                {a.konto_nr} {a.bezeichnung}
              </option>
            ))}
          </select>
        </label>
        <label>
          Anfangsbestand (€)
          <input
            type="number"
            step="0.01"
            value={newRow.anfangsbestand}
            onChange={(e) =>
              setNewRow({ ...newRow, anfangsbestand: e.target.value })
            }
          />
        </label>
        <label>
          Endbestand (€)
          <input
            type="number"
            step="0.01"
            value={newRow.endbestand}
            onChange={(e) =>
              setNewRow({ ...newRow, endbestand: e.target.value })
            }
            data-testid="input-bestand-endbestand"
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={newRow.niederstwert_aktiv}
            onChange={(e) =>
              setNewRow({ ...newRow, niederstwert_aktiv: e.target.checked })
            }
            data-testid="input-bestand-niederstwert"
          />{" "}
          Niederstwertprinzip aktiv (§ 253 Abs. 4 HGB)
        </label>
        {newRow.niederstwert_aktiv && (
          <label>
            Begründung (Pflicht)
            <textarea
              value={newRow.niederstwert_begruendung}
              onChange={(e) =>
                setNewRow({
                  ...newRow,
                  niederstwert_begruendung: e.target.value,
                })
              }
              data-testid="input-bestand-niederstwert-begruendung"
            />
          </label>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            await props.onSaveBestand(newRow);
            setNewRow(emptyBestandRow());
          }}
          disabled={
            props.busy ||
            !newRow.bezeichnung ||
            !newRow.vorrat_konto_nr ||
            (newRow.niederstwert_aktiv && !newRow.niederstwert_begruendung)
          }
          data-testid="btn-bestand-save-new"
        >
          Position anlegen
        </button>
      </div>

      {props.rows.length === 0 ? (
        <p data-testid="inventur-bestaende-empty">
          Noch keine Bestandspositionen erfasst.
        </p>
      ) : (
        props.rows.map((b) => {
          const proposal = proposeBestandDelta({
            anfangsbestand: b.anfangsbestand,
            endbestand: b.endbestand,
            bezeichnung: b.bezeichnung,
            stichtag: "",
            vorrat_konto_nr: b.vorrat_konto_nr,
            veraenderungs_konto_nr: veraenderungKonto[b.id],
            niederstwert_aktiv: b.niederstwert_aktiv,
            niederstwert_begruendung: b.niederstwert_begruendung ?? undefined,
          });
          return (
            <div
              key={b.id}
              className="card"
              style={{ padding: 12, marginBottom: 8 }}
              data-testid={`bestand-row-${b.id}`}
            >
              <strong>{b.bezeichnung}</strong> · {b.vorrat_konto_nr} ·
              Delta {proposal.delta.toFixed(2)} € ({proposal.richtung})
              {!b.inventurliste_document_id && (
                <div style={{ marginTop: 6 }}>
                  <label
                    className="btn btn-outline"
                    style={{ cursor: "pointer" }}
                  >
                    <Upload size={14} /> Inventurliste hochladen
                    <input
                      type="file"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleUpload(f, b.id);
                      }}
                      data-testid={`input-bestand-upload-${b.id}`}
                    />
                  </label>
                </div>
              )}
              {b.inventurliste_document_id && (
                <div
                  style={{ marginTop: 6, color: "var(--success, #1f7a4d)" }}
                  data-testid={`bestand-upload-ok-${b.id}`}
                >
                  ✓ Inventurliste hinterlegt
                </div>
              )}
              {proposal.richtung !== "unveraendert" &&
                !b.bestandsveraenderungs_buchung_id && (
                  <div style={{ marginTop: 6 }}>
                    <label>
                      Veraenderungs-Konto:
                      <select
                        value={veraenderungKonto[b.id] ?? ""}
                        onChange={(e) =>
                          setVeraenderungKonto({
                            ...veraenderungKonto,
                            [b.id]: e.target.value,
                          })
                        }
                        data-testid={`select-veraenderung-${b.id}`}
                      >
                        <option value="">— bitte wählen —</option>
                        {props.veraenderungAccounts.map((a) => (
                          <option key={a.konto_nr} value={a.konto_nr}>
                            {a.konto_nr} {a.bezeichnung}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        props.onBookBestand(b, veraenderungKonto[b.id] ?? "")
                      }
                      disabled={
                        props.busy ||
                        !veraenderungKonto[b.id] ||
                        !b.inventurliste_document_id
                      }
                      data-testid={`btn-book-bestand-${b.id}`}
                    >
                      Buchung erstellen
                    </button>
                  </div>
                )}
              {b.bestandsveraenderungs_buchung_id && (
                <div
                  style={{ marginTop: 6, color: "var(--success, #1f7a4d)" }}
                  data-testid={`bestand-booked-${b.id}`}
                >
                  ✓ Bereits gebucht
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function AbschlussTab(props: {
  anlagenChecks: AnlageInventurCheck[];
  bestaende: InventurBestand[];
  canClose: boolean;
  onClose: () => Promise<void>;
  busy: boolean;
}) {
  const geprueft = props.anlagenChecks.filter(
    (c) => c.letzter_status && c.letzter_status !== "nicht_geprueft"
  ).length;
  const bestaendeMitUpload = props.bestaende.filter(
    (b) => b.inventurliste_document_id !== null
  ).length;
  const bestaendeGebucht = props.bestaende.filter(
    (b) =>
      b.anfangsbestand === b.endbestand ||
      b.bestandsveraenderungs_buchung_id !== null
  ).length;

  return (
    <section data-testid="inventur-abschluss-tab" className="card" style={{ padding: 16 }}>
      <h2>Zusammenfassung</h2>
      <ul>
        <li data-testid="sum-anlagen">
          Anlagen geprüft: {geprueft} / {props.anlagenChecks.length}
        </li>
        <li data-testid="sum-bestaende-upload">
          Inventurliste hochgeladen: {bestaendeMitUpload} /{" "}
          {props.bestaende.length}
        </li>
        <li data-testid="sum-bestaende-booked">
          Bestandspositionen erledigt: {bestaendeGebucht} /{" "}
          {props.bestaende.length}
        </li>
      </ul>
      <button
        type="button"
        className="btn btn-primary"
        disabled={!props.canClose || props.busy}
        onClick={props.onClose}
        data-testid="btn-close-session"
      >
        Session abschliessen
      </button>
    </section>
  );
}

export default function InventurPage() {
  return (
    <MandantRequiredGuard>
      <InventurInner />
    </MandantRequiredGuard>
  );
}
