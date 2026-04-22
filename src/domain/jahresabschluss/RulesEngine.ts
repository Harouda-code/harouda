/**
 * Jahresabschluss-Rules-Engine (E2).
 *
 * Bildet die häufigsten deutschen Rechtslagen 2025 für Anhang-,
 * Lagebericht- und EÜR-Pflichten ab. Jede Regel trägt einen §-Verweis
 * im Begründungs-Array für Audit-Trail + UI-Anzeige.
 *
 * ────────────────────────────────────────────────────────────────────
 * **Scope-Limitation:** diese Regel-Engine deckt die HÄUFIGSTEN Fälle
 * ab. Edge-Cases sind NICHT abgedeckt:
 *
 *   - Publizitäts-KGaA (§ 264a HGB)
 *   - Konzernmütter nach § 290 HGB
 *   - Freiwillige Bilanzierung trotz § 241a HGB
 *   - SE-spezifische Vorgaben
 *   - Börsennotierte Gesellschaften mit zusätzlichen Kodex-Pflichten
 *
 * Für solche Fälle ist Rücksprache mit Steuerberater/Fachanwalt
 * erforderlich. Der Wizard zeigt am Ende eine Checkliste, die den
 * Nutzer auf manuelle Prüfung hinweist.
 * ────────────────────────────────────────────────────────────────────
 */

import type { Rechtsform } from "../ebilanz/hgbTaxonomie68";
import type { Hgb267Klasse } from "../accounting/HgbSizeClassifier";
import type { JahresabschlussBausteine } from "./WizardTypes";

export type RulesEngineInput = {
  rechtsform: Rechtsform;
  groessenklasse: Hgb267Klasse;
};

const KAPITALGESELLSCHAFTEN: readonly Rechtsform[] = [
  "GmbH",
  "AG",
  "UG",
  "SE",
];

const PERSONENGESELLSCHAFTEN: readonly Rechtsform[] = [
  "GbR",
  "PartG",
  "OHG",
  "KG",
];

function isKapital(rf: Rechtsform): boolean {
  return KAPITALGESELLSCHAFTEN.includes(rf);
}

function isPerson(rf: Rechtsform): boolean {
  return PERSONENGESELLSCHAFTEN.includes(rf);
}

export function computeBausteine(
  input: RulesEngineInput
): JahresabschlussBausteine {
  const { rechtsform, groessenklasse } = input;
  const begruendungen: string[] = [];

  // --- Kapitalgesellschaft (GmbH/AG/UG/SE) ---
  if (isKapital(rechtsform)) {
    // Lagebericht nur für mittel + groß (§ 264 Abs. 1 Satz 4 HGB i. V. m.
    // § 289 HGB; Kleinst/Klein befreit nach § 264 Abs. 1 Satz 5 HGB).
    const lagebericht =
      groessenklasse === "mittel" || groessenklasse === "gross";
    begruendungen.push(
      `Kapitalgesellschaft (${rechtsform}): Bilanz + GuV + Anlagenspiegel + Anhang Pflicht nach § 264 Abs. 1 HGB.`
    );
    begruendungen.push(
      lagebericht
        ? `Lagebericht Pflicht (Größenklasse "${groessenklasse}", § 289 HGB).`
        : `Lagebericht entfällt (Größenklasse "${groessenklasse}" — Befreiung nach § 264 Abs. 1 Satz 5 HGB).`
    );
    return {
      deckblatt: true,
      inhaltsverzeichnis: true,
      bilanz: true,
      guv: true,
      euer: false,
      anlagenspiegel: true,
      anhang: true,
      lagebericht,
      bescheinigung: true,
      begruendungen,
    };
  }

  // --- Personengesellschaft (GbR/PartG/OHG/KG) ---
  if (isPerson(rechtsform)) {
    begruendungen.push(
      `Personengesellschaft (${rechtsform}): Bilanz + GuV + Anlagenspiegel Pflicht nach HGB § 238 ff. (bei Kaufmannseigenschaft).`
    );
    begruendungen.push(
      `Anhang entfällt — § 264 HGB greift für Personengesellschaften grundsätzlich nicht (Ausnahme: Publizitäts-KGaA, § 264a HGB — manuelle Prüfung erforderlich).`
    );
    begruendungen.push(`Lagebericht entfällt (keine Kapitalgesellschaft).`);
    return {
      deckblatt: true,
      inhaltsverzeichnis: true,
      bilanz: true,
      guv: true,
      euer: false,
      anlagenspiegel: true,
      anhang: false,
      lagebericht: false,
      bescheinigung: true,
      begruendungen,
    };
  }

  // --- Einzelunternehmen ---
  if (rechtsform === "Einzelunternehmen") {
    // Default: § 241a-HGB-Befreiung (Umsatz ≤ 800k, Gewinn ≤ 80k in 2025).
    // Wizard kann später einen Switch "freiwillige Bilanzierung" anbieten;
    // für E2-Default wird EÜR verwendet.
    begruendungen.push(
      `Einzelunternehmen: EÜR nach § 4 Abs. 3 EStG (Default, Annahme: § 241a HGB-Befreiung greift — Umsatz/Gewinn unter Schwellen).`
    );
    begruendungen.push(
      `Bilanz/GuV entfällt (keine HGB-Buchführungspflicht bei § 241a-Befreiung). Hinweis: bei freiwilliger Bilanzierung manuell umstellen.`
    );
    begruendungen.push(
      `Anlagenspiegel als Nebenverzeichnis — empfohlen auch bei EÜR.`
    );
    return {
      deckblatt: true,
      inhaltsverzeichnis: true,
      bilanz: false,
      guv: false,
      euer: true,
      anlagenspiegel: true,
      anhang: false,
      lagebericht: false,
      bescheinigung: true,
      begruendungen,
    };
  }

  // --- SonstigerRechtsform — konservativer Fallback ---
  const lagebericht =
    groessenklasse === "mittel" || groessenklasse === "gross";
  begruendungen.push(
    `Rechtsform "SonstigerRechtsform" — konservativer Default: Bilanz + GuV + Anlagenspiegel + Anhang aktiv.`
  );
  begruendungen.push(
    lagebericht
      ? `Lagebericht aktiv (Größenklasse "${groessenklasse}").`
      : `Lagebericht inaktiv.`
  );
  begruendungen.push(
    `⚠️ Manuelle Prüfung durch Steuerberater/Fachanwalt erforderlich — die tatsächliche Rechtsform bestimmt die Pflichten.`
  );
  return {
    deckblatt: true,
    inhaltsverzeichnis: true,
    bilanz: true,
    guv: true,
    euer: false,
    anlagenspiegel: true,
    anhang: true,
    lagebericht,
    bescheinigung: true,
    begruendungen,
  };
}
