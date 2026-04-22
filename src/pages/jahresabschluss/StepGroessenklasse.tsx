/**
 * Wizard Step 3 — Größenklasse § 267 HGB.
 *
 * Nur für Kapitalgesellschaften relevant. Personengesellschaft +
 * Einzelunternehmen: defaultet auf "klein" und User kann überspringen.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAccounts } from "../../api/accounts";
import { fetchAllEntries } from "../../api/dashboard";
import {
  classifyHgb267,
  computeKriteriumFromJournal,
  HGB267_SCHWELLENWERTE_2025,
  type Hgb267Klasse,
  type Hgb267Klassifikation,
} from "../../domain/accounting/HgbSizeClassifier";
import {
  markStepCompleted,
  updateStep,
} from "../../domain/jahresabschluss/wizardStore";
import type { StepProps } from "./stepTypes";

const KLASSEN: Hgb267Klasse[] = ["kleinst", "klein", "mittel", "gross"];

function fmt(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function StepGroessenklasse({
  state,
  mandantId,
  jahr,
  onAdvance,
}: StepProps) {
  const rechtsform = state.data.rechtsform?.rechtsform;
  const isKapital =
    rechtsform === "GmbH" ||
    rechtsform === "AG" ||
    rechtsform === "UG" ||
    rechtsform === "SE";

  const [employeesCount, setEmployeesCount] = useState<number>(
    state.data.groessenklasse?.erfuellte_kriterien !== undefined ? 0 : 0
  );
  const [overrideActive, setOverrideActive] = useState(false);
  const [overrideKlasse, setOverrideKlasse] = useState<Hgb267Klasse>(
    state.data.groessenklasse?.klasse ?? "klein"
  );
  const [overrideBegruendung, setOverrideBegruendung] = useState("");

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", mandantId],
    queryFn: fetchAllEntries,
    enabled: isKapital,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
    enabled: isKapital,
  });

  const kriterium = useMemo(() => {
    if (!isKapital) return null;
    if (!entriesQ.data || !accountsQ.data) return null;
    return computeKriteriumFromJournal(
      accountsQ.data,
      entriesQ.data.filter((e) => e.client_id === mandantId),
      `${jahr}-12-31`,
      employeesCount
    );
  }, [isKapital, entriesQ.data, accountsQ.data, jahr, mandantId, employeesCount]);

  const autoKlassifikation = useMemo(() => {
    if (!kriterium) return null;
    return classifyHgb267(kriterium);
  }, [kriterium]);

  function handleAdvance() {
    let finalKlassifikation: Hgb267Klassifikation;
    if (!isKapital) {
      finalKlassifikation = {
        klasse: "klein",
        erfuellte_kriterien: 3,
        gilt_als_erfuellt: true,
        schwellenwerte_verwendet: HGB267_SCHWELLENWERTE_2025,
        begruendung: [
          `Nicht-Kapitalgesellschaft (${rechtsform ?? "unbekannt"}): Default-Klasse "klein" (keine § 267-Relevanz).`,
        ],
      };
    } else if (overrideActive) {
      if (overrideBegruendung.trim().length < 3) {
        alert("Begründung für Override ist Pflicht (≥ 3 Zeichen).");
        return;
      }
      finalKlassifikation = {
        klasse: overrideKlasse,
        erfuellte_kriterien: 0,
        gilt_als_erfuellt: false,
        schwellenwerte_verwendet: HGB267_SCHWELLENWERTE_2025,
        begruendung: [
          `Manueller Override auf "${overrideKlasse}" — Grund: ${overrideBegruendung}`,
        ],
      };
    } else {
      if (!autoKlassifikation) {
        alert("Automatische Klassifikation noch nicht geladen.");
        return;
      }
      finalKlassifikation = autoKlassifikation;
    }
    updateStep(mandantId, jahr, {
      data: { groessenklasse: finalKlassifikation },
    });
    markStepCompleted(mandantId, jahr, "groessenklasse");
    onAdvance("bausteine");
  }

  if (!isKapital) {
    return (
      <section data-testid="step-groessenklasse">
        <h2>Schritt 3 — Größenklasse</h2>
        <p data-testid="groessenklasse-skip">
          Rechtsform „{rechtsform}": Größenklassen nach § 267 HGB gelten nur
          für Kapitalgesellschaften. Default „klein" wird verwendet.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAdvance}
          data-testid="btn-skip-groessenklasse"
        >
          Weiter →
        </button>
      </section>
    );
  }

  return (
    <section data-testid="step-groessenklasse">
      <h2>Schritt 3 — Größenklasse § 267 HGB</h2>

      <label style={{ display: "block", marginBottom: 12 }}>
        <span>Arbeitnehmer-Durchschnitt (§ 267 Abs. 5 HGB)</span>
        <input
          type="number"
          min={0}
          value={employeesCount}
          onChange={(e) =>
            setEmployeesCount(Math.max(0, Number(e.target.value) || 0))
          }
          data-testid="input-employees-count"
        />
      </label>

      {kriterium && (
        <div data-testid="auto-kriterium" style={{ margin: "12px 0" }}>
          <strong>Bilanzsumme:</strong> {fmt(kriterium.bilanzsumme)} <br />
          <strong>Umsatzerlöse:</strong> {fmt(kriterium.umsatzerloese)} <br />
          <strong>Arbeitnehmer:</strong> {kriterium.arbeitnehmer_durchschnitt}
        </div>
      )}

      {autoKlassifikation && (
        <div
          data-testid="auto-klassifikation"
          style={{
            padding: 12,
            border: "2px solid var(--navy)",
            borderRadius: 6,
            margin: "12px 0",
            background: "var(--ivory-100, #f7f8fa)",
          }}
        >
          <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            Klassifikation: {autoKlassifikation.klasse}
          </div>
          <ul>
            {autoKlassifikation.begruendung.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <label
        style={{ display: "block", marginBottom: 8 }}
        data-testid="override-label"
      >
        <input
          type="checkbox"
          checked={overrideActive}
          onChange={(e) => setOverrideActive(e.target.checked)}
          data-testid="override-toggle"
        />{" "}
        Klassifikation manuell übersteuern
      </label>

      {overrideActive && (
        <div data-testid="override-block">
          <select
            value={overrideKlasse}
            onChange={(e) =>
              setOverrideKlasse(e.target.value as Hgb267Klasse)
            }
            data-testid="override-select"
          >
            {KLASSEN.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Begründung (Pflicht, ≥ 3 Zeichen)"
            value={overrideBegruendung}
            onChange={(e) => setOverrideBegruendung(e.target.value)}
            data-testid="override-reason"
            rows={2}
            style={{ width: "100%", marginTop: 6 }}
          />
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleAdvance}
        disabled={!autoKlassifikation && !overrideActive}
        data-testid="btn-advance-groessenklasse"
      >
        Weiter →
      </button>
    </section>
  );
}
