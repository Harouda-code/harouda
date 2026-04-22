# Wartungs-Leitfaden · ELSTER-XML-Schema-Updates

**Erfasst:** 2026-04-24 · Sprint 14 / Schritt 5.
**Gilt fuer:** alle XML-Generatoren unter `src/domain/elster/` +
`src/domain/ustva/UstvaXmlBuilder.ts` + `src/domain/ustva/ZmXmlBuilder.ts`.

---

## Warum dieses Dokument existiert

BMF und ELSTER aktualisieren die XSD-Schemas der drei Pflicht-Meldungen
UStVA, LStA und ZM jaehrlich zum Februar/Maerz. Ein XML, das mit
veralteten Kennzahlen oder falschem `version="..."`-Attribut erzeugt
wurde, wird vom ELSTER-Portal abgelehnt oder — schlimmer — vom
BZSt-Backend als "syntaktisch gueltig" akzeptiert, obwohl inhaltlich
fehlerhaft (Kz-Umcodierung).

Dieses Dokument legt den Update-Prozess fest, damit neue AI-Sessions
oder neue Teammitglieder die Schema-Versionen nicht aus Unwissenheit
"stale" lassen.

## Aktuelle Schema-Versionen im Code

| Meldung | Schema-Version | Code-Pfad |
|---|---|---|
| UStVA | 2025 (version-Attribut im Root) | `src/domain/ustva/UstvaXmlBuilder.ts` |
| LSt-Anmeldung | 2025-04 | `src/domain/elster/LstAnmeldungXmlBuilder.ts` (Konstante `LSTA_ELSTER_SCHEMA_VERSION`) |
| ZM (ELSTER-Style) | 2025-04 | `src/domain/elster/ZmElsterXmlBuilder.ts` (Konstante `ZM_ELSTER_SCHEMA_VERSION`) |
| ZM (ELMA5-Style) | 2025 | `src/domain/ustva/ZmXmlBuilder.ts` |
| E-Bilanz XBRL | HGB-Taxonomie 6.8 | `src/domain/ebilanz/hgbTaxonomie.ts` + `hgbTaxonomie68.ts` |

Die E-Bilanz-Taxonomie hat einen eigenen Update-Leitfaden:
`docs/TECH-DEBT-XBRL-MULTI-VERSION.md`.

## Quelle fuer neue Schemas

Primaer: **ELSTER-Entwicklerbereich**
- https://www.elster.de/elsterweb/infoseite/entwickler
- Downloads: `ElsterLohnAnmeldung_*.xsd` · `ElsterUStVA_*.xsd` ·
  `ElsterZM_*.xsd`.
- Versionshinweise ("ReleaseNotes") werden pro Jahr gepflegt.

Sekundaer: **BMF-Datensatzbeschreibungen**
- https://www.bzst.de → "Steuern International" → "Umsatzsteuer" →
  "Zusammenfassende Meldung" / "Datensatzbeschreibungen".
- Gibt Hinweise auf Kz-Aenderungen ohne XSD-Diff.

## Update-Workflow pro Meldung

1. **XSD-Download** vom Entwicklerbereich in ein temporaeres Verzeichnis.
2. **Diff gegen bestehenden Builder**:
   - Neue Kennzahlen mit Pflichtfeld-Flag pruefen.
   - Entfallene Kennzahlen markieren.
   - Aenderungen an Element-Namen (z. B. `Kz81_STEUER` → `Kz81_USt`).
   - Neue Root-Attribute (z. B. Anbieter-ID, Vollmachts-ID).
3. **Constant aktualisieren**:
   ```typescript
   export const LSTA_ELSTER_SCHEMA_VERSION = "2025-04"; // → "2026-04"
   ```
4. **Version-Attribut** im `<Anmeldungssteuern version="...">`-Root
   anpassen.
5. **Builder-Logik**: neue Felder hinzufuegen oder entfallene
   ausblenden. Defensiver Default: Felder, die unklar sind, NICHT
   automatisch befuellen — stattdessen `warnings`-Liste des Results
   ergaenzen.
6. **Tests aktualisieren**:
   - Neue Tests fuer hinzugefuegte Kennzahlen.
   - Regression-Tests: fruehere Zeitraeume muessen weiterhin gruen
     bleiben (historische Meldungen duerfen nicht brechen).
7. **UI-Hinweis**: im `StepReview` (Jahresabschluss) bzw. in
   `LohnsteuerAnmeldungPage`/`ZmPage` den Text "Schema-Stand ..."
   pruefen — die Toast-Message liefert diese Information aktuell
   automatisch aus `result.schema_version`.
8. **Changelog-Eintrag** unten in diesem Dokument.

## Review-Zyklus

**Mindestens einmal jaehrlich zum Februar** (vor dem ersten LStA-
Zeitraum des neuen Jahres):

- [ ] Alle drei Schemas bei ELSTER auf neue Version pruefen.
- [ ] Falls neu: diese Doku aktualisieren + Folge-Sprint einplanen.
- [ ] BMF-Schreiben zu Kz-Codes filter ("Lohnsteueranmeldung" +
      aktuelles Jahr).
- [ ] VIES/BZSt-Portal auf Aenderungen an der ZM-Datensatzbeschreibung
      pruefen.

## Pull-Request-Checkliste pro Aenderung

- [ ] Schema-Quelle zitiert (URL + XSD-Dateiname + Stand-Datum).
- [ ] Alle drei Konstanten `*_SCHEMA_VERSION` aktualisiert (falls
      mehrere betroffen).
- [ ] Builder-Tests gruen.
- [ ] Integration-Smoke (`src/pages/__tests__/ElsterXmlButtons.smoke.test.tsx`)
      gruen.
- [ ] Manueller Upload-Test: erzeugte XML im ELSTER-Entwickler-
      Validator (Online-Tool) pruefen.
- [ ] `tsc --noEmit` clean.
- [ ] Diesen Guide um Changelog-Eintrag ergaenzen.

## Changelog

| Datum | Sprint | Aenderung |
|---|---|---|
| 2025-04-* | Frueh | UStVA-Schema auf `version="2025"` gesetzt (siehe `UstvaXmlBuilder.ts` Kommentar). |
| 2026-04-24 | Sprint 14 | LStA-ELSTER-XML + ZM-ELSTER-XML erstmalig eingefuehrt mit Schema-Stand `2025-04`. |

## Siehe auch

- `docs/TECH-DEBT-XBRL-MULTI-VERSION.md` — HGB-E-Bilanz-Taxonomie.
- `CLAUDE.md` §10 — ELSTER-Transmission (P1-Blocker).
- `src/domain/elster/xmlHelpers.ts` — gemeinsame Helper (xmlEscape,
  germanDecimal, zeitraumCode).
