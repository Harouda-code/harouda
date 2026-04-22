/**
 * Wizard Step 5 — Review + Abschluss + PDF-Export (E3b / Schritt 6).
 *
 * HAFTUNGSHINWEIS: Dieses Dokument ist eine Vorlage-basierte Ausgabe.
 * Rechtliche Verantwortung fuer Inhalt + gesetzliche Aktualitaet liegt
 * beim Nutzer. Siehe docs/TEXTBAUSTEINE-UPDATE-GUIDE.md.
 */
import { useState } from "react";
import { toast } from "sonner";
import { markStepCompleted } from "../../domain/jahresabschluss/wizardStore";
import {
  buildJahresabschlussDocument,
  tableFromRows,
  type JahresabschlussDocumentInput,
} from "../../domain/jahresabschluss/pdf/DocumentMergePipeline";
import {
  buildBalanceSheet,
  type BalanceSheetReport,
} from "../../domain/accounting/BalanceSheetBuilder";
import { buildGuv, type GuvReport } from "../../domain/accounting/GuvBuilder";
import {
  getAnlagenspiegelData,
  type AnlagenspiegelData,
} from "../../domain/anlagen/AnlagenService";
import {
  downloadJahresabschlussPdf as defaultDownload,
  type DownloadPdfFn,
} from "../../domain/jahresabschluss/pdf/pdfDownloadService";
import { fetchClients } from "../../api/clients";
import { fetchAllEntries } from "../../api/dashboard";
import { fetchAccounts } from "../../api/accounts";
import { fetchAnlagegueter } from "../../api/anlagen";
import type { SizeClass } from "../../domain/accounting/hgb266Structure";
import type { StepProps } from "./stepTypes";

/** Format ISO "YYYY-MM-DD" -> "DD.MM.YYYY". Fallback gibt Input zurueck. */
function toGermanDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/** Pruefe, ob Step 7 (Bescheinigung) praktisch ausgefuellt ist. Echte
 *  Pflichtfelder aus Step 7: KanzleiName, SteuerberaterName, Ort.
 *  MandantenName + JahresabschlussStichtag + Datum setzt das System
 *  auto-fallback; sie sind kein Indikator fuer User-Input. */
function isBescheinigungConfigured(
  b:
    | {
        values?: {
          KanzleiName?: string;
          SteuerberaterName?: string;
          Ort?: string;
        };
      }
    | undefined
): boolean {
  if (!b?.values) return false;
  return Boolean(
    b.values.KanzleiName?.trim() &&
      b.values.SteuerberaterName?.trim() &&
      b.values.Ort?.trim()
  );
}

/**
 * Pure-Function: sammelt Wizard-Daten → TDocumentDefinitions-Input.
 * Separat fuer Tests (ohne React-Mount) aufrufbar.
 */
export type PdfReports = {
  bilanzReport?: BalanceSheetReport;
  guvReport?: GuvReport;
  anlagenspiegelReport?: AnlagenspiegelData;
};

export function buildPdfInputFromWizardState(
  state: StepProps["state"],
  opts: {
    entwurf: boolean;
    erstelltAm?: string;
    reports?: PdfReports;
    archivMode?: boolean;
  }
): JahresabschlussDocumentInput | null {
  const rf = state.data.rechtsform;
  const gk = state.data.groessenklasse;
  const bs = state.data.bausteine;
  if (!rf || !gk || !bs) return null;

  // Stichtag: 31.12.<jahr>. Geschaeftsjahr 01.01.–31.12.
  const stichtagIso = `${state.jahr}-12-31`;
  const geschaeftsjahrVonIso = `${state.jahr}-01-01`;

  return {
    cover: {
      firmenname: rf.rechtsform === "Einzelunternehmen" ? "" : "",
      // Firmenname wird vom Aufrufer reingereicht; dieser Builder
      // kennt nur den WizardState, den tatsaechlichen Client-
      // Namen holt die Komponente. Platzhalter-Leerstring, damit
      // StepReview ihn befuellt (siehe Konstruktor unten).
      rechtsform: rf.rechtsform,
      hrb_nummer: rf.hrb_nummer ?? null,
      hrb_gericht: rf.hrb_gericht ?? null,
      steuernummer: null,
      geschaeftsjahr_von: toGermanDate(geschaeftsjahrVonIso),
      geschaeftsjahr_bis: toGermanDate(stichtagIso),
      stichtag: toGermanDate(stichtagIso),
      groessenklasse: gk.klasse === "kleinst" ? "klein" : gk.klasse,
      berichtsart: opts.entwurf ? "Entwurf" : "Jahresabschluss",
      erstellt_am:
        opts.erstelltAm ??
        toGermanDate(new Date().toISOString().slice(0, 10)),
    },
    bausteine: bs,
    // E4: echte Reports haben Prio; ohne Reports bleibt der
    // Platzhalter-Pfad (z.B. fuer Smoke-Tests ohne Journal-Daten).
    bilanzReport: opts.reports?.bilanzReport,
    guvReport: opts.reports?.guvReport,
    anlagenspiegelReport: opts.reports?.anlagenspiegelReport,
    bilanz:
      bs.bilanz && !opts.reports?.bilanzReport
        ? [
            tableFromRows(
              ["Position", "Betrag (€)"],
              [
                ["[Aus BilanzBuilder einfügen]", ""],
                ["Summe Aktiva", ""],
              ]
            ),
          ]
        : undefined,
    guv:
      bs.guv && !opts.reports?.guvReport
        ? [
            tableFromRows(
              ["Position", "Betrag (€)"],
              [
                ["[Aus GuvBuilder einfügen]", ""],
                ["Jahresüberschuss", ""],
              ]
            ),
          ]
        : undefined,
    anlagenspiegel:
      bs.anlagenspiegel && !opts.reports?.anlagenspiegelReport
        ? [
            tableFromRows(
              ["AfA-Position", "Betrag (€)"],
              [["[Aus Anlagenspiegel-Builder einfügen]", ""]]
            ),
          ]
        : undefined,
    // Sprint 17.5: Erlaeuterungen + BStBK-Bescheinigung.
    erlaeuterungen_text:
      state.data.erlaeuterungen?.aktiv && state.data.erlaeuterungen?.text
        ? state.data.erlaeuterungen.text
        : undefined,
    bescheinigungInput: sprint17_5BescheinigungInput(state),
  };
}

function sprint17_5BescheinigungInput(
  state: StepProps["state"]
): import("../../domain/jahresabschluss/pdf/DocumentMergePipeline").JahresabschlussDocumentInput["bescheinigungInput"] {
  const b = state.data.bescheinigung;
  if (!b) return undefined;
  // Nur vollstaendig gefuellte Values durchreichen — sonst keine
  // Substitution ausloesen (Preview bleibt {{VAR}}).
  const needed = [
    "MandantenName",
    "JahresabschlussStichtag",
    "KanzleiName",
    "Ort",
    "Datum",
    "SteuerberaterName",
  ] as const;
  const finalized: Record<string, string> = {};
  // Datum wird beim Export auf heute gesetzt (nicht aus State).
  const today = new Date().toLocaleDateString("de-DE");
  for (const k of needed) {
    if (k === "Datum") {
      finalized[k] = today;
      continue;
    }
    if (k === "JahresabschlussStichtag" && !b.values?.[k]) {
      finalized[k] = `31.12.${state.jahr}`;
      continue;
    }
    const v = b.values?.[k] ?? "";
    finalized[k] = v;
  }
  return {
    typ: b.typ,
    values: finalized as import("../../domain/jahresabschluss/bstbk/bstbkPlaceholders").BstbkPlaceholderValues,
    footer_sichtbar: b.footer_sichtbar,
  };
}

export type StepReviewExtraProps = {
  /** Dependency-Injection fuer Tests — ueberschreibt den Default-
   *  Download-Service. */
  downloadImpl?: DownloadPdfFn;
  firmenname?: string;
};

export function StepReview({
  state,
  mandantId,
  jahr,
  onAdvance,
  downloadImpl = defaultDownload,
  firmenname,
}: StepProps & StepReviewExtraProps) {
  const validation = state.data.validation;
  const rechtsform = state.data.rechtsform;
  const groesse = state.data.groessenklasse;
  const bausteine = state.data.bausteine;

  const [entwurf, setEntwurf] = useState(false);
  const [archivMode, setArchivMode] = useState(false);
  const [generating, setGenerating] = useState(false);

  const errors =
    validation?.findings.filter((f) => f.severity === "error").length ?? 0;
  const warnings =
    validation?.findings.filter((f) => f.severity === "warning").length ?? 0;

  function handleFinalize() {
    markStepCompleted(mandantId, jahr, "review");
    toast.success("Konfiguration gespeichert.");
    // Sprint 17.5: naechster Step ist die Bescheinigung.
    onAdvance("bescheinigung");
  }

  async function handleGeneratePdf() {
    setGenerating(true);
    try {
      // E4-Real-Builder-Pfad: Journal + Accounts + Anlagen laden,
      // Entries auf Mandant filtern, die drei Reports bauen. Schlaegt
      // die Daten-Phase fehl, greift die Platzhalter-Fallback-Pipeline
      // in buildPdfInputFromWizardState (entspricht altem Verhalten).
      // Wenn firmenname als Prop gesetzt ist (Tests / DI), gewinnt der
      // Prop — kein Client-Fetch noetig.
      let resolvedFirmenname = firmenname;
      let resolvedSteuernummer: string | null = null;
      let reports: PdfReports | undefined;
      try {
        const [clients, allEntries, accounts, anlagegueter] =
          await Promise.all([
            fetchClients(),
            fetchAllEntries(),
            fetchAccounts(),
            fetchAnlagegueter(mandantId),
          ]);
        const client = clients.find((c) => c.id === mandantId);
        if (!resolvedFirmenname && client?.name) {
          resolvedFirmenname = client.name;
        }
        resolvedSteuernummer = client?.steuernummer ?? null;

        const stichtagIso = `${jahr}-12-31`;
        const periodStartIso = `${jahr}-01-01`;
        // Groessenklasse auf Builder-SizeClass mappen. "kleinst" faellt
        // auf "klein" zurueck (Builder kennen nur klein/mittel/gross/ALL).
        const gk = state.data.groessenklasse?.klasse;
        const sizeClass: SizeClass =
          gk === "kleinst" || gk === "klein"
            ? "KLEIN"
            : gk === "mittel"
            ? "MITTEL"
            : gk === "gross"
            ? "GROSS"
            : "ALL";

        const mandantEntries = allEntries.filter(
          (e) => e.client_id === mandantId
        );
        const bilanzReport = buildBalanceSheet(accounts, mandantEntries, {
          stichtag: stichtagIso,
          sizeClass,
        });
        const guvReport = buildGuv(accounts, mandantEntries, {
          periodStart: periodStartIso,
          stichtag: stichtagIso,
          sizeClass,
          verfahren: "GKV",
        });
        const anlagenspiegelReport = getAnlagenspiegelData(
          jahr,
          anlagegueter
        );
        reports = { bilanzReport, guvReport, anlagenspiegelReport };
      } catch (dataErr) {
        // Fetch- oder Builder-Fehler: PDF-Export bleibt moeglich, zeigt
        // aber Platzhalter-Tabellen. Warn-Toast statt harter Stop.
        toast.warning(
          `Bilanz/GuV/Anlagen konnten nicht gebaut werden — PDF enthält Platzhalter. (${
            dataErr instanceof Error ? dataErr.message : String(dataErr)
          })`
        );
      }

      const input = buildPdfInputFromWizardState(state, {
        entwurf,
        reports,
      });
      if (!input) {
        toast.error(
          "Konfiguration unvollständig — bitte vorherige Schritte abschließen."
        );
        return;
      }
      // Firmenname + Steuernummer setzen. Kein UUID-Fallback mehr;
      // Platzhalter-Text macht das Problem sichtbar statt zu kaschieren.
      input.cover = {
        ...input.cover,
        firmenname: resolvedFirmenname || "[Firmenname nicht gesetzt]",
        steuernummer: resolvedSteuernummer,
      };

      try {
        const doc = buildJahresabschlussDocument(input);
        const safeName = (input.cover.firmenname || "Jahresabschluss").replace(
          /[^a-z0-9äöüß\-_]/gi,
          "-"
        );
        const fileName = `Jahresabschluss-${safeName}-${jahr}${
          entwurf ? "-ENTWURF" : ""
        }.pdf`;
        const downloadOptions = archivMode
          ? {
              archivMode: true,
              pdfA3Metadata: {
                title: `Jahresabschluss ${jahr} – ${input.cover.firmenname}`,
                author: input.cover.firmenname,
                subject: `Jahresabschluss zum ${input.cover.stichtag}`,
                keywords: [
                  "Jahresabschluss",
                  "HGB",
                  input.cover.rechtsform,
                  String(jahr),
                ],
                producer: "Harouda",
                creation_date: new Date(),
              },
            }
          : undefined;
        await downloadImpl(doc, fileName, downloadOptions);
        const mode = archivMode
          ? "PDF/A-3-Archiv-Dokument"
          : entwurf
          ? "Entwurfs-PDF"
          : "Jahresabschluss-PDF";
        toast.success(`${mode} erzeugt.`);
      } catch (err) {
        toast.error(
          `PDF-Generation fehlgeschlagen: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    } finally {
      setGenerating(false);
    }
  }

  const canGenerate =
    !!rechtsform && !!groesse && !!bausteine && !generating;

  return (
    <section data-testid="step-review">
      <h2>Schritt 5 — Zusammenfassung</h2>

      <section data-testid="review-validation">
        <h3>1. Pre-Closing-Prüfung</h3>
        {validation ? (
          <p>
            {errors} Fehler · {warnings} Warnungen ·{" "}
            {validation.darf_jahresabschluss_erstellen
              ? "freigegeben"
              : "BLOCKIERT"}
          </p>
        ) : (
          <p>Keine Prüfung durchgeführt.</p>
        )}
      </section>

      <section data-testid="review-rechtsform">
        <h3>2. Rechtsform + Stammdaten</h3>
        {rechtsform ? (
          <dl>
            <dt>Rechtsform</dt>
            <dd>{rechtsform.rechtsform}</dd>
            {rechtsform.hrb_nummer && (
              <>
                <dt>HRB</dt>
                <dd>
                  {rechtsform.hrb_nummer}
                  {rechtsform.hrb_gericht
                    ? ` (${rechtsform.hrb_gericht})`
                    : ""}
                </dd>
              </>
            )}
            {typeof rechtsform.gezeichnetes_kapital === "number" && (
              <>
                <dt>Gezeichnetes Kapital</dt>
                <dd>{rechtsform.gezeichnetes_kapital.toFixed(2)} €</dd>
              </>
            )}
            {rechtsform.geschaeftsfuehrer &&
              rechtsform.geschaeftsfuehrer.length > 0 && (
                <>
                  <dt>Organe</dt>
                  <dd>
                    <ul>
                      {rechtsform.geschaeftsfuehrer.map((g, i) => (
                        <li key={i}>
                          {g.name} ({g.funktion})
                        </li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
          </dl>
        ) : (
          <p>Nicht erfasst.</p>
        )}
      </section>

      <section data-testid="review-groessenklasse">
        <h3>3. Größenklasse</h3>
        {groesse ? (
          <p>
            {groesse.klasse} · {groesse.erfuellte_kriterien}/3 Kriterien
            erfüllt
          </p>
        ) : (
          <p>Nicht erfasst.</p>
        )}
      </section>

      <section data-testid="review-bausteine">
        <h3>4. Bausteine</h3>
        {bausteine ? (
          <ul>
            {bausteine.bilanz && <li>Bilanz</li>}
            {bausteine.guv && <li>GuV</li>}
            {bausteine.euer && <li>EÜR</li>}
            {bausteine.anlagenspiegel && <li>Anlagenspiegel</li>}
            {bausteine.anhang && <li>Anhang</li>}
            {bausteine.lagebericht && <li>Lagebericht</li>}
          </ul>
        ) : (
          <p>Nicht erfasst.</p>
        )}
      </section>

      {bausteine?.bescheinigung &&
        !isBescheinigungConfigured(state.data.bescheinigung) && (
          <div
            role="alert"
            data-testid="review-bescheinigung-missing"
            style={{
              marginTop: 12,
              padding: 10,
              background: "rgba(200, 60, 60, 0.08)",
              border: "1px solid rgba(200, 60, 60, 0.4)",
              borderRadius: 6,
              fontSize: "0.86rem",
            }}
          >
            ⚠ Die <strong>Bescheinigung (Schritt 7)</strong> ist noch
            nicht ausgefüllt. Das PDF zeigt in dem Fall den BStBK-
            Standardtext ohne eingesetzten Kanzlei-Namen, Ort, Datum und
            Steuerberater-Namen. Bitte Schritt 7 ausfüllen und speichern,
            bevor du das PDF generierst.
          </div>
        )}

      <div
        role="note"
        style={{
          marginTop: 12,
          padding: 10,
          background: "var(--ivory-100, #eef4fb)",
          border: "1px solid var(--info, #4c7caf)",
          borderRadius: 6,
          fontSize: "0.85rem",
        }}
      >
        Das generierte PDF nutzt HGB-Vorlagen (Stand 04/2025). Bei
        rechtssicherer Verwendung bitte Rücksprache mit Steuerberater
        oder Fachanwalt.
      </div>

      <label
        style={{ display: "block", marginTop: 12 }}
        data-testid="entwurf-toggle-label"
      >
        <input
          type="checkbox"
          checked={entwurf}
          onChange={(e) => setEntwurf(e.target.checked)}
          data-testid="entwurf-toggle"
        />{" "}
        Entwurfs-Modus (PDF bekommt „ENTWURF"-Wasserzeichen)
      </label>

      <label
        style={{ display: "block", marginTop: 4 }}
        data-testid="archiv-toggle-label"
      >
        <input
          type="checkbox"
          checked={archivMode}
          onChange={(e) => setArchivMode(e.target.checked)}
          data-testid="archiv-toggle"
        />{" "}
        PDF/A-3 (Langzeit-Archivierung, benötigt ICC-Profil — siehe
        Deployment-Guide)
      </label>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGeneratePdf}
          disabled={!canGenerate}
          data-testid="btn-generate-pdf"
        >
          {generating ? "Generiere PDF …" : "PDF generieren"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={handleFinalize}
          data-testid="btn-finalize"
        >
          Konfiguration speichern
        </button>
      </div>
    </section>
  );
}
