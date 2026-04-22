/**
 * StepBescheinigung (Sprint 17.5 / Schritt 7).
 *
 * Letzter Wizard-Step (nach Review). 4 Saeulen:
 *  1. Constants-File mit readonly BStBK-Texten.
 *  2. Safe-Placeholder-Substitution (Whitelist, 6 Keys).
 *  3. <textarea disabled readOnly>-Readonly-Preview.
 *  4. Optionaler BStBK-Footer-Hinweis.
 *
 * HAFTUNGSRISIKO bei Textaenderung — die Kerntexte sind NICHT
 * editierbar. Nur die 6 Felder werden vom Nutzer ausgefuellt.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { fetchClients } from "../../api/clients";
import {
  BSTBK_BESCHEINIGUNGEN,
  type BescheinigungsTyp,
} from "../../domain/jahresabschluss/bstbk/bstbkBescheinigungen";
import {
  BSTBK_PLACEHOLDER_LABELS,
  substitutePlaceholders,
  validatePlaceholderValues,
  type BstbkPlaceholderValues,
} from "../../domain/jahresabschluss/bstbk/bstbkPlaceholders";
import {
  markStepCompleted,
  updateStep,
} from "../../domain/jahresabschluss/wizardStore";
import type { StepProps } from "./stepTypes";

const TYP_OPTIONS: Array<{ value: BescheinigungsTyp; label: string }> = [
  {
    value: "ohne_beurteilungen",
    label: "Erstellung ohne Beurteilungen",
  },
  {
    value: "mit_plausibilitaet",
    label: "Erstellung mit Plausibilitätsbeurteilungen",
  },
  {
    value: "mit_umfassender_beurteilung",
    label: "Erstellung mit umfassenden Beurteilungen",
  },
];

function formatStichtagGerman(jahr: number): string {
  return `31.12.${jahr}`;
}

export function StepBescheinigung({
  state,
  mandantId,
  jahr,
  onAdvance,
}: StepProps) {
  const existing = state.data.bescheinigung;
  const stichtag = formatStichtagGerman(jahr);

  const clientsQ = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });
  const client = useMemo(
    () => (clientsQ.data ?? []).find((c) => c.id === mandantId),
    [clientsQ.data, mandantId]
  );

  const [typ, setTyp] = useState<BescheinigungsTyp>(
    existing?.typ ?? "ohne_beurteilungen"
  );
  const [mandantenName, setMandantenName] = useState<string>(
    existing?.values?.MandantenName ?? ""
  );
  const [kanzleiName, setKanzleiName] = useState<string>(
    existing?.values?.KanzleiName ?? ""
  );
  const [steuerberaterName, setSteuerberaterName] = useState<string>(
    existing?.values?.SteuerberaterName ?? ""
  );
  const [ort, setOrt] = useState<string>(existing?.values?.Ort ?? "");
  const [footerSichtbar, setFooterSichtbar] = useState<boolean>(
    existing?.footer_sichtbar ?? true
  );

  // Auto-Fill aus Client — einmalig pro Client-Lade (nicht bei jedem
  // Re-Render, sonst springt "Ort" zurueck, sobald der User es leert).
  const autofilledForClientRef = useRef<string | null>(null);
  useEffect(() => {
    if (!client) return;
    if (autofilledForClientRef.current === client.id) return;
    if (!mandantenName && client.name) setMandantenName(client.name);
    if (!ort && client.anschrift_ort) setOrt(client.anschrift_ort);
    autofilledForClientRef.current = client.id;
  }, [client, mandantenName, ort]);

  // Datum wird beim Export auf heute gesetzt; hier nur Preview.
  const datumPreview = new Date().toLocaleDateString("de-DE");

  const values: BstbkPlaceholderValues = useMemo(
    () => ({
      MandantenName: mandantenName,
      JahresabschlussStichtag: stichtag,
      KanzleiName: kanzleiName,
      Ort: ort,
      Datum: datumPreview,
      SteuerberaterName: steuerberaterName,
    }),
    [mandantenName, kanzleiName, ort, steuerberaterName, stichtag, datumPreview]
  );

  const kern = BSTBK_BESCHEINIGUNGEN[typ].kern_text;
  const sub = useMemo(
    () => substitutePlaceholders(kern, values),
    [kern, values]
  );
  const valid = useMemo(
    () => validatePlaceholderValues(values),
    [values]
  );

  function persist(overrides?: {
    typ?: BescheinigungsTyp;
    footer_sichtbar?: boolean;
  }): void {
    updateStep(mandantId, jahr, {
      data: {
        bescheinigung: {
          typ: overrides?.typ ?? typ,
          values,
          footer_sichtbar: overrides?.footer_sichtbar ?? footerSichtbar,
        },
      },
    });
  }

  function handleSave(): void {
    if (!valid.valid) {
      toast.error(
        `Pflichtfelder unvollständig: ${valid.missing.join(", ")}`
      );
      return;
    }
    persist();
    markStepCompleted(mandantId, jahr, "bescheinigung");
    toast.success(
      "Bescheinigung gespeichert. Bei Produktiv-Nutzung bitte Aktualität der BStBK-Texte durch Steuerberater prüfen lassen."
    );
    onAdvance("bescheinigung");
  }

  return (
    <section data-testid="step-bescheinigung">
      <h2>Schritt 7 — Bescheinigung</h2>

      <aside
        role="note"
        data-testid="bescheinigung-haftungs-banner"
        style={{
          background: "rgba(200, 60, 60, 0.08)",
          border: "1px solid rgba(200, 60, 60, 0.4)",
          padding: 12,
          borderRadius: 6,
          marginBottom: 12,
          fontSize: "0.86rem",
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <AlertTriangle size={18} style={{ color: "#a33", flexShrink: 0 }} />
        <div>
          <strong>⚖ Diese Bescheinigung folgt der BStBK-Verlautbarung
          (Stand 2023).</strong> Der Kerntext ist rechtlich normiert und
          NICHT editierbar. Nur die Felder unten werden ausgefüllt.
          Haftungsrisiko bei manueller Textänderung.
        </div>
      </aside>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label>
          <span>Art der Bescheinigung *</span>
          <select
            value={typ}
            onChange={(e) => {
              const nextTyp = e.target.value as BescheinigungsTyp;
              setTyp(nextTyp);
              persist({ typ: nextTyp });
            }}
            data-testid="select-bescheinigung-typ"
          >
            {TYP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Jahresabschluss-Stichtag (auto)</span>
          <input
            type="text"
            value={stichtag}
            readOnly
            disabled
            data-testid="input-bescheinigung-stichtag"
          />
        </label>

        <label>
          <span>Mandanten-Name *</span>
          <input
            type="text"
            value={mandantenName}
            onChange={(e) => setMandantenName(e.target.value)}
            onBlur={() => persist()}
            data-testid="input-bescheinigung-mandant"
          />
        </label>

        <label>
          <span>Kanzlei-Name *</span>
          <input
            type="text"
            value={kanzleiName}
            onChange={(e) => setKanzleiName(e.target.value)}
            onBlur={() => persist()}
            data-testid="input-bescheinigung-kanzlei"
          />
        </label>

        <label>
          <span>Steuerberater-Name *</span>
          <input
            type="text"
            value={steuerberaterName}
            onChange={(e) => setSteuerberaterName(e.target.value)}
            onBlur={() => persist()}
            data-testid="input-bescheinigung-steuerberater"
          />
        </label>

        <label>
          <span>Ort *</span>
          <input
            type="text"
            value={ort}
            onChange={(e) => setOrt(e.target.value)}
            onBlur={() => persist()}
            data-testid="input-bescheinigung-ort"
          />
        </label>

        <label
          style={{ gridColumn: "1 / 3", display: "flex", gap: 6 }}
          data-testid="bescheinigung-datum-info"
        >
          <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
            Datum wird beim PDF-Export auf heute gesetzt — aktuell:{" "}
            {datumPreview}.
          </span>
        </label>
      </div>

      <label
        style={{ display: "block", marginTop: 10 }}
        data-testid="bescheinigung-footer-toggle-label"
      >
        <input
          type="checkbox"
          checked={footerSichtbar}
          onChange={(e) => {
            const nextFooter = e.target.checked;
            setFooterSichtbar(nextFooter);
            persist({ footer_sichtbar: nextFooter });
          }}
          data-testid="bescheinigung-footer-toggle"
        />{" "}
        Footer-Zeile mit BStBK-Quellenangabe anzeigen
      </label>

      <h3 style={{ marginTop: 16 }}>Vorschau (nicht editierbar)</h3>
      <textarea
        disabled
        readOnly
        data-testid="bescheinigung-preview"
        value={sub.text}
        style={{
          width: "100%",
          minHeight: "300px",
          background: "#f3f3f3",
          border: "1px solid #ccc",
          padding: "12px",
          fontFamily: "serif",
          fontSize: "13px",
          lineHeight: "1.5",
          whiteSpace: "pre-wrap",
          cursor: "default",
        }}
      />
      {!valid.valid && (
        <p
          style={{ color: "var(--danger, #a33)", fontSize: "0.82rem", marginTop: 6 }}
          data-testid="bescheinigung-missing-warning"
        >
          ⚠ {valid.missing.length} Platzhalter nicht ausgefüllt:{" "}
          {valid.missing
            .map((k) => BSTBK_PLACEHOLDER_LABELS[k])
            .join(", ")}
          .
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!valid.valid}
          data-testid="btn-bescheinigung-save"
        >
          Bescheinigung speichern
        </button>
      </div>
    </section>
  );
}
