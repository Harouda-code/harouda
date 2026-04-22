/**
 * Erlaeuterungsbericht-Phrasen-Bibliothek (Sprint 17.5 / Schritt 1).
 *
 * 4 Standard-Phrasen als Click-to-Insert-Chips im TipTap-Editor
 * des Erlaeuterungsberichts. Der Editor selbst ist free-form; die
 * Phrasen sind nur Vorschlaege, keine Pflicht-Bausteine.
 *
 * GoBD-RECHTSFLAGGE: Phrasen sind als konservative Formulierungen
 * gemeint — Platzhalter [X] im Text werden NICHT automatisch
 * ersetzt; der User passt sie manuell im Editor an. Aenderung der
 * Phrasen erfordert Steuerberater-Freigabe (analog BStBK-Texte).
 *
 * Rechtsbasis: § 264 Abs. 2 Satz 2 HGB — Erlaeuterungen zur
 * Vermoegens- und Ertragslage sind freiwillig.
 */

export type ErlaeuterungsPhrase = {
  readonly id: string;
  readonly label: string;
  readonly text: string;
  readonly version_stand: string;
};

export const ERLAEUTERUNGS_PHRASEN: readonly ErlaeuterungsPhrase[] =
  Object.freeze([
    Object.freeze({
      id: "umsatzerloese_entwicklung",
      label: "Umsatzentwicklung",
      text: "Die Umsatzerloese sind gegenueber dem Vorjahr um [X]% gestiegen/gesunken. Wesentliche Ursache war [Grund].",
      version_stand: "2025-04",
    }),
    Object.freeze({
      id: "ergebnissituation",
      label: "Ergebnissituation",
      text: "Das Jahresergebnis wurde massgeblich durch [Faktor] beeinflusst. Eine ausfuehrliche Analyse zeigt [Bewertung].",
      version_stand: "2025-04",
    }),
    Object.freeze({
      id: "besondere_ereignisse",
      label: "Besondere Ereignisse",
      text: "Im abgelaufenen Geschaeftsjahr haben folgende besondere Ereignisse Einfluss auf die Vermoegens- und Ertragslage gehabt: [Beschreibung].",
      version_stand: "2025-04",
    }),
    Object.freeze({
      id: "ausblick",
      label: "Ausblick",
      text: "Fuer das kommende Geschaeftsjahr rechnen wir mit [Prognose]. Wesentliche Risiken und Chancen betreffen [Bereich].",
      version_stand: "2025-04",
    }),
  ] as const);

export function getErlaeuterungsPhrasen(): readonly ErlaeuterungsPhrase[] {
  return ERLAEUTERUNGS_PHRASEN;
}

export function getErlaeuterungsPhraseById(
  id: string
): ErlaeuterungsPhrase | undefined {
  return ERLAEUTERUNGS_PHRASEN.find((p) => p.id === id);
}
