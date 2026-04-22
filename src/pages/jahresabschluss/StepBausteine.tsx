/**
 * Wizard Step 4 — Bausteine (Rules-Engine-Output).
 */
import { useMemo } from "react";
import { Check, X as XIcon } from "lucide-react";
import { computeBausteine } from "../../domain/jahresabschluss/RulesEngine";
import {
  markStepCompleted,
  updateStep,
} from "../../domain/jahresabschluss/wizardStore";
import type {
  JahresabschlussBausteine,
} from "../../domain/jahresabschluss/WizardTypes";
import type { StepProps } from "./stepTypes";

const BAUSTEIN_LABELS: Record<keyof Omit<JahresabschlussBausteine, "begruendungen">, string> = {
  deckblatt: "Deckblatt",
  inhaltsverzeichnis: "Inhaltsverzeichnis",
  bilanz: "Bilanz (§ 266 HGB)",
  guv: "Gewinn- und Verlustrechnung (§ 275 HGB)",
  euer: "Einnahmenüberschussrechnung (§ 4 Abs. 3 EStG)",
  anlagenspiegel: "Anlagenspiegel",
  anhang: "Anhang (§§ 284-288 HGB)",
  lagebericht: "Lagebericht (§ 289 HGB)",
  bescheinigung: "Bescheinigung",
};

export function StepBausteine({ state, mandantId, jahr, onAdvance }: StepProps) {
  const rechtsform = state.data.rechtsform?.rechtsform;
  const groesse = state.data.groessenklasse?.klasse;

  const bausteine = useMemo(() => {
    if (!rechtsform || !groesse) return null;
    return computeBausteine({ rechtsform, groessenklasse: groesse });
  }, [rechtsform, groesse]);

  function handleAdvance() {
    if (!bausteine) return;
    updateStep(mandantId, jahr, { data: { bausteine } });
    markStepCompleted(mandantId, jahr, "bausteine");
    onAdvance("erlaeuterungen");
  }

  if (!bausteine) {
    return (
      <section data-testid="step-bausteine">
        <h2>Schritt 4 — Bausteine</h2>
        <p data-testid="bausteine-missing-input">
          Bitte zuerst Schritt 2 (Rechtsform) und Schritt 3 (Größenklasse)
          abschließen.
        </p>
      </section>
    );
  }

  return (
    <section data-testid="step-bausteine">
      <h2>Schritt 4 — Bausteine</h2>
      <p>
        Aus Rechtsform „{rechtsform}" und Größenklasse „{groesse}" ergeben
        sich folgende Pflicht- und Optional-Bausteine für den
        Jahresabschluss:
      </p>

      <ul
        style={{ listStyle: "none", padding: 0 }}
        data-testid="bausteine-list"
      >
        {(Object.keys(BAUSTEIN_LABELS) as Array<keyof typeof BAUSTEIN_LABELS>).map(
          (key) => {
            const aktiv = bausteine[key] as boolean;
            return (
              <li
                key={key}
                data-testid={`baustein-${key}`}
                data-aktiv={aktiv}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 10px",
                  margin: "4px 0",
                  border: `1px solid ${aktiv ? "var(--success, #1f7a4d)" : "var(--border, #c3c8d1)"}`,
                  borderRadius: 6,
                  color: aktiv ? "inherit" : "var(--muted)",
                }}
              >
                {aktiv ? (
                  <Check
                    size={18}
                    style={{ color: "var(--success, #1f7a4d)" }}
                  />
                ) : (
                  <XIcon size={18} style={{ color: "var(--muted)" }} />
                )}
                <span>{BAUSTEIN_LABELS[key]}</span>
              </li>
            );
          }
        )}
      </ul>

      <details
        data-testid="bausteine-begruendungen"
        style={{ marginTop: 12 }}
      >
        <summary style={{ cursor: "pointer", fontSize: "0.85rem" }}>
          Begründungen anzeigen ({bausteine.begruendungen.length})
        </summary>
        <ul style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
          {bausteine.begruendungen.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </details>

      <div
        role="note"
        style={{
          marginTop: 12,
          padding: 10,
          background: "var(--ivory-100, #f7f2e4)",
          border: "1px solid var(--gold, #d8b35c)",
          borderRadius: 6,
          fontSize: "0.82rem",
        }}
      >
        Diese Regeln decken die häufigsten Fälle ab. Bei Sonderfällen
        (Publizitätspflicht, Konzernmutter § 290 HGB, freiwillige
        Bilanzierung trotz § 241a HGB) bitte Steuerberater konsultieren.
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleAdvance}
        data-testid="btn-advance-bausteine"
        style={{ marginTop: 12 }}
      >
        Weiter →
      </button>
    </section>
  );
}
