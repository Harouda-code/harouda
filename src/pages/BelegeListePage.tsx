import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  journalRepo,
  type BelegFilters,
  type BelegRecord,
  type BelegStatus,
} from "../lib/db/journalRepo";
import type { Belegart } from "../domain/belege/types";
import "./ReportView.css";

const BELEGARTEN: { value: Belegart | ""; label: string }[] = [
  { value: "", label: "Alle Arten" },
  { value: "EINGANGSRECHNUNG", label: "Eingangsrechnung" },
  { value: "AUSGANGSRECHNUNG", label: "Ausgangsrechnung" },
  { value: "KASSENBELEG", label: "Kassenbeleg" },
  { value: "BANKBELEG", label: "Bankbeleg" },
  { value: "SONSTIGES", label: "Sonstiges" },
];

const STATUS_OPTIONS: { value: BelegStatus | ""; label: string }[] = [
  { value: "", label: "Alle" },
  { value: "ENTWURF", label: "Entwurf" },
  { value: "GEBUCHT", label: "Gebucht" },
  { value: "STORNIERT", label: "Storniert" },
];

function statusBadge(s: BelegStatus) {
  const colors: Record<BelegStatus, string> = {
    ENTWURF: "#b8852f",
    GEBUCHT: "#1f7a4d",
    STORNIERT: "#a03040",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: 10,
        background: `${colors[s]}15`,
        color: colors[s],
        fontSize: "0.74rem",
        fontWeight: 600,
      }}
    >
      {s}
    </span>
  );
}

export default function BelegeListePage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${today.slice(0, 4)}-01-01`;

  const [von, setVon] = useState(yearStart);
  const [bis, setBis] = useState(today);
  const [belegart, setBelegart] = useState<Belegart | "">("");
  const [status, setStatus] = useState<BelegStatus | "">("");
  const [partner, setPartner] = useState("");

  const [belege, setBelege] = useState<BelegRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<BelegRecord | null>(null);
  const [stornoFor, setStornoFor] = useState<BelegRecord | null>(null);
  const [stornoReason, setStornoReason] = useState("");

  const filters = useMemo<BelegFilters>(
    () => ({
      von,
      bis,
      belegart: belegart || undefined,
      status: status || undefined,
      partner: partner || undefined,
      limit: 500,
    }),
    [von, bis, belegart, status, partner]
  );

  async function reload() {
    setLoading(true);
    try {
      const r = await journalRepo.getBelege(filters);
      setBelege(r.belege);
      setTotal(r.total);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [von, bis, belegart, status, partner]);

  async function handleStorno() {
    if (!stornoFor) return;
    try {
      await journalRepo.stornoBeleg(stornoFor.id, stornoReason);
      toast.success(`Beleg ${stornoFor.belegnummer} storniert.`);
      setStornoFor(null);
      setStornoReason("");
      void reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const totals = useMemo(() => {
    const gebucht = belege.filter((b) => b.status === "GEBUCHT").length;
    const entwurf = belege.filter((b) => b.status === "ENTWURF").length;
    const stor = belege.filter((b) => b.status === "STORNIERT").length;
    const brutto = belege
      .filter((b) => b.status === "GEBUCHT")
      .reduce((sum, b) => sum + Number(b.brutto ?? "0"), 0);
    return { gebucht, entwurf, stor, brutto };
  }, [belege]);

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/" className="report__back">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <div className="report__head-title">
          <h1>Belege</h1>
          <p>
            Persistierte Belege inkl. Journal-Verknüpfung. Filter, Detail-
            ansicht, Storno.
          </p>
        </div>
      </header>

      <section
        className="card"
        style={{
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <label>
          <span>Von</span>
          <input
            type="date"
            value={von}
            onChange={(e) => setVon(e.target.value)}
          />
        </label>
        <label>
          <span>Bis</span>
          <input
            type="date"
            value={bis}
            onChange={(e) => setBis(e.target.value)}
          />
        </label>
        <label>
          <span>Belegart</span>
          <select
            value={belegart}
            onChange={(e) => setBelegart(e.target.value as Belegart | "")}
          >
            {BELEGARTEN.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BelegStatus | "")}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Partner</span>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 8,
                top: 10,
                color: "var(--ink-soft)",
              }}
            />
            <input
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              placeholder="Name filtern…"
              style={{ paddingLeft: 26 }}
            />
          </div>
        </label>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <Stat label="Treffer" value={String(total)} />
        <Stat label="Gebucht" value={String(totals.gebucht)} />
        <Stat label="Entwurf" value={String(totals.entwurf)} />
        <Stat label="Storniert" value={String(totals.stor)} />
        <Stat
          label="Σ Brutto (gebucht)"
          value={`${totals.brutto.toFixed(2)} €`}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <Link to="/buchungen/erfassung" className="btn btn-primary">
          <Plus size={14} /> Neuer Beleg
        </Link>
      </div>

      {loading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={24} /> Lade Belege …
        </div>
      ) : belege.length === 0 ? (
        <div className="journal__state">Keine Belege im Filter.</div>
      ) : (
        <section className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: "0.85rem" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #c3c8d1",
                  background: "rgba(0,0,0,0.02)",
                }}
              >
                <th style={{ textAlign: "left", padding: "6px 10px" }}>
                  Nr.
                </th>
                <th style={{ textAlign: "left" }}>Datum</th>
                <th style={{ textAlign: "left" }}>Art</th>
                <th style={{ textAlign: "left" }}>Partner</th>
                <th style={{ textAlign: "right" }}>Brutto</th>
                <th style={{ textAlign: "left", paddingLeft: 10 }}>
                  Status
                </th>
                <th style={{ textAlign: "left" }}>Journal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {belege.map((b) => (
                <tr
                  key={b.id}
                  style={{ borderBottom: "1px solid #eef1f6" }}
                >
                  <td style={{ padding: "6px 10px" }}>
                    <FileText size={11} /> {b.belegnummer}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>
                    {b.belegdatum}
                  </td>
                  <td>{b.belegart}</td>
                  <td>{b.partner_name}</td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {b.brutto ?? "—"}
                  </td>
                  <td style={{ paddingLeft: 10 }}>
                    {statusBadge(b.status)}
                  </td>
                  <td
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--ink-soft)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {b.journal_entry_ids.length > 0
                      ? `${b.journal_entry_ids.length}×`
                      : "—"}
                  </td>
                  <td style={{ textAlign: "right", padding: "6px 10px" }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelected(b)}
                    >
                      Details
                    </button>
                    {b.status === "GEBUCHT" && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setStornoFor(b)}
                        style={{ marginLeft: 6 }}
                      >
                        <XCircle size={12} /> Storno
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {selected && (
        <DetailsDialog
          beleg={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {stornoFor && (
        <StornoDialog
          belegnummer={stornoFor.belegnummer}
          reason={stornoReason}
          onReasonChange={setStornoReason}
          onConfirm={handleStorno}
          onCancel={() => {
            setStornoFor(null);
            setStornoReason("");
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 10 }}>
      <div style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: "1rem",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DetailsDialog({
  beleg,
  onClose,
}: {
  beleg: BelegRecord;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          padding: 16,
          maxWidth: 640,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 10px" }}>
          Beleg {beleg.belegnummer}{" "}
          <span
            style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}
          >
            · {beleg.id.slice(0, 8)}
          </span>
        </h3>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "4px 12px",
            fontSize: "0.88rem",
          }}
        >
          <dt>Art</dt>
          <dd>{beleg.belegart}</dd>
          <dt>Datum</dt>
          <dd>{beleg.belegdatum}</dd>
          <dt>Buchungsdatum</dt>
          <dd>{beleg.buchungsdatum}</dd>
          <dt>Partner</dt>
          <dd>
            {beleg.partner_name}
            {beleg.partner_ustid ? ` · ${beleg.partner_ustid}` : ""}
          </dd>
          <dt>Netto / USt / Brutto</dt>
          <dd style={{ fontFamily: "var(--font-mono)" }}>
            {beleg.netto ?? "—"} / {beleg.steuerbetrag ?? "—"} /{" "}
            {beleg.brutto ?? "—"}
          </dd>
          <dt>Status</dt>
          <dd>{statusBadge(beleg.status)}</dd>
          {beleg.storno_grund && (
            <>
              <dt>Storno-Grund</dt>
              <dd>{beleg.storno_grund}</dd>
            </>
          )}
          <dt>Journal-IDs</dt>
          <dd
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.76rem",
            }}
          >
            {beleg.journal_entry_ids.join(", ") || "—"}
          </dd>
        </dl>

        {beleg.positionen.length > 0 && (
          <>
            <h4 style={{ margin: "12px 0 6px", fontSize: "0.88rem" }}>
              Positionen
            </h4>
            <table style={{ width: "100%", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #c3c8d1" }}>
                  <th style={{ textAlign: "left" }}>Pos</th>
                  <th style={{ textAlign: "left" }}>Konto</th>
                  <th style={{ textAlign: "left" }}>S/H</th>
                  <th style={{ textAlign: "right" }}>Betrag</th>
                  <th style={{ textAlign: "right" }}>USt</th>
                </tr>
              </thead>
              <tbody>
                {beleg.positionen.map((p) => (
                  <tr
                    key={p.position}
                    style={{ borderBottom: "1px solid #eef1f6" }}
                  >
                    <td>{p.position}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>
                      {p.konto}
                    </td>
                    <td>{p.soll_haben}</td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {p.betrag}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {p.ust_satz != null
                        ? `${(p.ust_satz * 100).toFixed(0)} %`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <div style={{ textAlign: "right", marginTop: 12 }}>
          <button className="btn btn-primary" onClick={onClose}>
            <CheckCircle2 size={14} /> Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

function StornoDialog({
  belegnummer,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}: {
  belegnummer: string;
  reason: string;
  onReasonChange: (s: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ padding: 16, maxWidth: 420, width: "90%" }}
      >
        <h3 style={{ margin: "0 0 10px" }}>
          Beleg {belegnummer} stornieren
        </h3>
        <p style={{ fontSize: "0.88rem", margin: "0 0 10px" }}>
          Erzeugt automatische Gegenbuchungen für alle Journal-Einträge und
          markiert den Beleg als STORNIERT. Diese Aktion kann nicht rückgängig
          gemacht werden (GoBD).
        </p>
        <label>
          <span>Grund</span>
          <input
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="mindestens 3 Zeichen"
          />
        </label>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 12,
          }}
        >
          <button className="btn btn-outline" onClick={onCancel}>
            Abbrechen
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={reason.trim().length < 3}
          >
            <XCircle size={14} /> Stornieren
          </button>
        </div>
      </div>
    </div>
  );
}
