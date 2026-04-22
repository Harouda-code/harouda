import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Calculator,
  Check,
  Info,
} from "lucide-react";
import { fetchAnlagegueter, fetchAfaBuchungen } from "../api/anlagen";
import {
  planAfaLauf,
  commitAfaLauf,
  type AfaLaufPlan,
} from "../domain/anlagen/AnlagenService";
import { useMandant } from "../contexts/MandantContext";
import { usePermissions } from "../hooks/usePermissions";
import "./ReportView.css";
import "./TaxCalc.css";
import "./CostCentersPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const THIS_YEAR = new Date().getFullYear();

export default function AfaLaufPage() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const { selectedMandantId } = useMandant();
  const [jahr, setJahr] = useState<number>(THIS_YEAR);

  const anlagenQ = useQuery({
    queryKey: ["anlagegueter", selectedMandantId],
    queryFn: () => fetchAnlagegueter(selectedMandantId),
  });
  const afaHistQ = useQuery({
    queryKey: ["afa_buchungen", "all", selectedMandantId],
    queryFn: () => fetchAfaBuchungen(),
  });

  const plan: AfaLaufPlan | null = useMemo(() => {
    if (!anlagenQ.data) return null;
    return planAfaLauf(jahr, anlagenQ.data);
  }, [anlagenQ.data, jahr]);

  const schonGebucht = useMemo(() => {
    const hist = afaHistQ.data ?? [];
    const ids = new Set(
      hist.filter((h) => h.jahr === jahr).map((h) => h.anlage_id)
    );
    return ids;
  }, [afaHistQ.data, jahr]);

  const commitM = useMutation({
    mutationFn: async (p: AfaLaufPlan) => commitAfaLauf(p),
    onSuccess: (res) => {
      toast.success(
        `${res.createdJournal} AfA-Buchung${
          res.createdJournal === 1 ? "" : "en"
        } erzeugt.`
      );
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      qc.invalidateQueries({ queryKey: ["afa_buchungen"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>AfA-Lauf</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff.</span>
        </aside>
      </div>
    );
  }

  const verbleibend =
    plan?.lines.filter((l) => !schonGebucht.has(l.anlage.id)) ?? [];
  const dupes = plan?.lines.filter((l) => schonGebucht.has(l.anlage.id)) ?? [];

  return (
    <div className="report kst">
      <header className="report__head">
        <Link to="/anlagen/verzeichnis" className="report__back">
          <ArrowLeft size={16} />
          Zurück zum Anlagenverzeichnis
        </Link>
        <div className="report__head-title">
          <h1>
            <Calculator
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            AfA-Lauf {jahr}
          </h1>
          <p>
            Erzeugt zum 31.12. des Jahres je aktiver Anlage einen
            AfA-Journal-Eintrag (lineare AfA, § 7 Abs. 1 EStG).
            <strong> Kein Auto-Buchen</strong> — Vorschau unten prüfen und
            explizit bestätigen.
          </p>
        </div>
        <div className="period">
          <label>
            Jahr:{" "}
            <input
              type="number"
              min={2000}
              max={2100}
              value={jahr}
              onChange={(e) => setJahr(Number(e.target.value))}
              style={{ width: 80 }}
            />
          </label>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <BadgeCheck size={14} />
        <span>
          AfA-Buchungen laufen durch die Journal-Hash-Kette (Migration 0010)
          und können bis zur Festschreibung (GoBD Rz. 64) korrigiert werden.
          Der afa_buchungen-Eintrag (Stammdaten) ist idempotent pro (Anlage,
          Jahr) — erneuter Lauf aktualisiert den bestehenden Eintrag.
        </span>
      </aside>

      {plan?.warnings.length ? (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Hinweise</h3>
          <ul>
            {plan.warnings.map((w) => (
              <li key={w.anlage.id}>
                <strong>{w.anlage.inventar_nr}</strong>: {w.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card kst__list">
        <header style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>
            Plan für {jahr} — {verbleibend.length} Buchung
            {verbleibend.length === 1 ? "" : "en"} geplant
          </h3>
          <div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                !perms.canWrite ||
                verbleibend.length === 0 ||
                commitM.isPending
              }
              onClick={() => {
                if (!plan) return;
                const subset: AfaLaufPlan = {
                  ...plan,
                  lines: verbleibend,
                };
                if (
                  confirm(
                    `${verbleibend.length} AfA-Buchung${
                      verbleibend.length === 1 ? "" : "en"
                    } für ${jahr} erzeugen?\n` +
                      `Gesamt-AfA: ${euro.format(
                        subset.lines.reduce((s, l) => s + l.afa_betrag, 0)
                      )}`
                  )
                ) {
                  commitM.mutate(subset);
                }
              }}
            >
              <Check size={14} /> AfA-Buchungen für {jahr} erzeugen
            </button>
          </div>
        </header>

        {plan === null ? (
          <p className="kst__empty">Lade Anlagen…</p>
        ) : plan.lines.length === 0 ? (
          <p className="kst__empty">
            Keine aktiven Anlagen mit linearer AfA für {jahr} gefunden.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Inventar-Nr</th>
                <th>Bezeichnung</th>
                <th>Soll / Haben</th>
                <th style={{ textAlign: "right" }}>AfA-Betrag</th>
                <th style={{ textAlign: "right" }}>Restbuchwert nach</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {plan.lines.map((l) => {
                const bereits = schonGebucht.has(l.anlage.id);
                return (
                  <tr key={l.anlage.id}>
                    <td className="mono">{l.anlage.inventar_nr}</td>
                    <td>{l.anlage.bezeichnung}</td>
                    <td className="mono">
                      {l.journal_input.soll_konto} /{" "}
                      {l.journal_input.haben_konto}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {euro.format(l.afa_betrag)}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {euro.format(l.restbuchwert)}
                    </td>
                    <td>
                      {bereits ? (
                        <span className="kst__badge">
                          bereits für {jahr} gebucht
                        </span>
                      ) : (
                        <span className="kst__badge is-active">geplant</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 600, borderTop: "2px solid var(--border)" }}>
                <td colSpan={3}>Summe geplant</td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {euro.format(
                    verbleibend.reduce((s, l) => s + l.afa_betrag, 0)
                  )}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        )}

        {dupes.length > 0 && (
          <aside className="taxcalc__hint" style={{ marginTop: 10 }}>
            <Info size={14} />
            <span>
              {dupes.length} Anlage
              {dupes.length === 1 ? "" : "n"} haben bereits einen
              afa_buchungen-Eintrag für {jahr}. Diese werden beim
              erneuten Lauf ÜBERSPRUNGEN (idempotent — doppelte
              Journal-Buchung wird vermieden).
            </span>
          </aside>
        )}
      </section>
    </div>
  );
}
