# Sprint 14 — LSt-Anmeldung + ZM · ELSTER-XML-Generatoren

**Abgeschlossen:** 2026-04-24 · Autonomer Langlauf · 6 Schritte.
**End-Stand:** **1478 Tests grün / 140 Test-Dateien** · tsc clean.
**Scope:** zwei ELSTER-XML-Generatoren im gleichen Muster wie der
bestehende UStVA-XmlBuilder, jeweils mit Schema-Version-Tag und
Update-Workflow.

---

## 1. Ziel + Rechtsbasis

**Ziel:** Die beiden neben UStVA wichtigsten Pflicht-Meldungen an die
deutsche Finanzverwaltung bekommen eine konsistente ELSTER-XML-Preview:
- **LSt-Anmeldung** (§ 41a EStG) — monatlich/quartalsweise.
- **ZM** (§ 18a UStG) — monatlich/quartalsweise fuer EU-B2B-Umsaetze.

Kein ERiC-Integration (P1-Blocker im Gesamtprojekt, CLAUDE.md §10).
Der User exportiert die XML und laedt sie ins ELSTER-Portal oder das
BZSt-BOP-Portal hoch.

**Rechtliche Basis:**
- **§ 41a EStG** — monatliche Lohnsteueranmeldung.
- **§ 18a UStG** — Zusammenfassende Meldung.
- **GoBD Rz. 58-60** — Festschreibung vor Einreichung (bereits durch
  E1 Closing-Validator abgedeckt).

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Bestandsaufnahme** | Recon: UStVA-XmlBuilder-Muster · existierende LohnsteuerAnmeldungBuilder + ZmBuilder (kein XML-Layer) · Scope-Honesty-Entscheidung: keine neuen Pages, existierende erweitern | 0 |
| 2 | **LstAnmeldungXmlBuilder** | `src/domain/elster/LstAnmeldungXmlBuilder.ts` + `xmlHelpers.ts` · wrappt `LohnsteuerAnmeldungReport` in ELSTER-Schema-XML · defensive Warnings · `LSTA_ELSTER_SCHEMA_VERSION = "2025-04"` | +8 |
| 3 | **ZmElsterXmlBuilder** | `src/domain/elster/ZmElsterXmlBuilder.ts` · wrappt `ZmReport` in ELSTER-Schema-XML mit eigenem `<Anmeldungssteuern art="ZM" version="2025">`-Envelope · USt-IdNr-Validierung via bestehendem `validateUstId` | +7 |
| 4 | **UI-Integration** | `LohnsteuerAnmeldungPage` + `ZmPage` je um "ELSTER-XML"-Button erweitert · Smoke-Tests fuer Button-Presence + Download-Trigger | +3 |
| 5 | **Schema-Update-Guide** | `docs/ELSTER-SCHEMA-UPDATE-GUIDE.md` mit Quellen, PR-Checkliste, jaehrlichem Review-Zyklus, Changelog-Tabelle | 0 |
| 6 | **Abschluss + Final-Gate** | Diese Doku · tsc clean · vitest gruen | 0 |

**Σ Sprint:** +18 Tests · +3 Test-Files · 1460 → **1478 grün**.

## 3. Neue Dateien

### Domain-Layer (elster-Familie)
- `src/domain/elster/xmlHelpers.ts` — zentrale Helper fuer die neue
  elster-Familie: `xmlEscape()`, `germanDecimal()`, `moneyToElster()`,
  `zeitraumCode()`. Absichtlich neu statt Import aus UstvaXmlBuilder —
  die Helper liegen dort als lokale Funktionen und sollen nicht als
  cross-module-Abhaengigkeit auftauchen.
- `src/domain/elster/LstAnmeldungXmlBuilder.ts` —
  `buildLstAnmeldungXml(LohnsteuerAnmeldungReport, {steuernummer, dauerfrist?})`
  liefert `{xml, schema_version, generated_at, warnings}`. Output-Envelope
  `<Anmeldungssteuern art="LStA" version="2025">` analog UStVA.
- `src/domain/elster/ZmElsterXmlBuilder.ts` —
  `buildZmElsterXml(ZmReport, {eigene_ust_id})` liefert denselben
  Result-Shape + `summe_gesamt` + `eintraege_count`. Envelope
  `<Anmeldungssteuern art="ZM" version="2025">`, pro Empfaenger eine
  `<Meldung art="W|S|D">` mit UStId/Land/Betrag.

### UI (existierende Pages erweitert)
- `src/pages/LohnsteuerAnmeldungPage.tsx` — neuer Button
  `data-testid="btn-lsta-elster-xml"`. Fragt via `prompt()` die
  Steuernummer ab, erzeugt XML, loest Download aus. Toast mit
  Schema-Version + Warn-Count.
- `src/pages/ZmPage.tsx` — neuer Button
  `data-testid="btn-zm-elster-xml"`. Fragt via `prompt()` die eigene
  USt-IdNr ab, erzeugt ELSTER-style XML parallel zum bestehenden
  ELMA5-ähnlichen Pfad (`buildZmXml`).

### Tests (neu)
- `src/domain/elster/__tests__/LstAnmeldungXmlBuilder.test.ts` —
  8 Tests: Nullmeldung, Kz10/Kz41/Kz42, Steuernummer + Betriebsnummer,
  Dauerfrist-Attribut, Quartal-Zeitraumcode, KiSt-Konfession-Routing,
  well-formed-Check, Minijob-Kz47.
- `src/domain/elster/__tests__/ZmElsterXmlBuilder.test.ts` —
  7 Tests: Nullmeldung, FR-IGL-Lieferung mit Art="W", Monats-Zeitraum,
  ungueltige UStId-Warn, UStId-Steuerfall-Attribut, Mix IGS/Dreieck,
  well-formed.
- `src/pages/__tests__/ElsterXmlButtons.smoke.test.tsx` —
  3 Tests: LohnsteuerAnmeldungPage-Button-Rendering, prompt-Cancel
  verhindert Download, ZmPage-Button-Rendering.

### Dokumentation
- `docs/ELSTER-SCHEMA-UPDATE-GUIDE.md` — Wartungsleitfaden fuer alle
  ELSTER-XML-Generatoren inkl. UStVA und E-Bilanz (Cross-Referenz).

## 4. Architektur-Entscheidungen

1. **Scope-Honesty: keine neuen Pages.** Die Recon hat gezeigt, dass
   sowohl `LohnsteuerAnmeldungPage` als auch `ZmPage` mit Demo-Input
   bereits produktiv sind — sie hatten nur keinen ELSTER-XML-Export.
   Neue Pages unter `/elster/*` waeren Duplikation. Stattdessen wurden
   die existierenden Pages um zwei `data-testid`-markierte Buttons
   erweitert.
2. **Adapter statt Duplikat der Aggregation.** Der Spec-Input
   `{mandantId, steuernummer, anmeldungszeitraum}` waere ein neuer
   Aggregations-Orchestrator gewesen — aber `buildLohnsteuerAnmeldung`
   und `buildZm` aggregieren bereits. Die neuen Builder nehmen den
   Report als Input und liefern nur die XML-Schicht.
3. **Parallel-Builder zu ZmXmlBuilder.** Der alte `ZmXmlBuilder` bleibt
   (er produziert ELMA5-aehnliches XML fuer den BZSt-BOP-Upload);
   `ZmElsterXmlBuilder` liefert das ELSTER-Envelope. Beides kann der
   User exportieren — je nachdem welches Portal er benutzt.
4. **xmlHelpers.ts eigen statt Import.** UstvaXmlBuilder hat die
   Helper lokal, ebilanz hat eigene, datev auch. Statt fremde Local-
   Helpers zu re-exportieren, hat die neue `elster/`-Familie ihren
   eigenen Helpers-Satz. Das verhindert, dass eine Aenderung in UStVA
   stillschweigend ZM oder LStA bricht.
5. **Schema-Version als Konstante + Output-Attribut.** Jeder Builder
   trägt `*_SCHEMA_VERSION = "2025-04"` und emittiert das im XML. Der
   Update-Guide zieht den Thread durch alle drei Meldungen.
6. **prompt() fuer Steuernummer / eigene USt-IdNr.** Defensiv: die
   beiden sensiblen Identifier sollen nicht in localStorage liegen
   (GoBD-relevant, Teil der Mandant-Stammdaten). Ein Wizard-Step
   waere die langfristige Loesung — fuer diesen Sprint genuegt ein
   `prompt()`-Dialog, analog zu anderen einmaligen Identifiern.
7. **Minijob-Routing in LStA.** Der bestehende
   `LohnsteuerAnmeldungBuilder` routet Minijob-LSt bereits auf Kz47.
   Der neue XML-Builder filter dann mit `emit()` die nicht-null-
   Kennzahlen — Minijob-only-Monat liefert daher nur `Kz10` + `Kz47`,
   kein `Kz42`.
8. **USt-IdNr-Warn statt -Throw.** Fehlerhaft formatierte USt-IdNr
   (eigene oder Empfaenger) landet als Warning im Result, nicht als
   Exception. Begruendung: ELSTER wird den Upload ablehnen; der User
   korrigiert dann. Blockieren im Client waere zu strikt (z. B. bei
   provisorischen IDs im Test-Mandanten).

## 5. Grenzen + bewusst verschoben

1. **Keine ERiC-Integration** (bleibt P1-Blocker gesamt).
2. **Kein XSD-Validator im Code** — Upload in ELSTER-Online-Validator
   ist manueller Schritt, im Schema-Update-Guide dokumentiert.
3. **Keine Zertifikats-Verwaltung** — out of scope.
4. **Keine VIES-API-Abfrage** der USt-IdNr — nur Regex-Format-Check.
5. **Keine Lohnsteuerbescheinigung-XML** (§ 41b EStG jaehrlich) —
   eigener Sprint-Kandidat.
6. **Kein ELStAM-Abruf** — eigener Sprint-Kandidat.
7. **Keine Auto-Aggregation aus `invoices`-Tabelle fuer ZM** — aktuell
   aggregiert `buildZm` aus Accounts+JournalEntries, das ist bereits
   produktiv. Eine `invoices`-Tabelle mit ZM-spezifischen Feldern
   (`eu_empfaenger_ust_id`, `empfaenger_land`, `leistungsart_code`)
   existiert nicht — ein Schema-Migration-Sprint waere erforderlich.

## 6. Final-Gate-Ergebnisse

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **clean**.
- `npx vitest run` → **1478 / 1478 gruen** (140 Test-Dateien).
- Sprint-14-Tests isoliert: `npx vitest run src/domain/elster/
  src/pages/__tests__/ElsterXmlButtons.smoke.test.tsx` → **18 / 18 gruen**.
- Regression-Check: existierende UStVA/ZM/LohnsteuerAnmeldung-Tests
  weiterhin alle gruen, keine Drift.
- Stderr-Output zur happy-dom-Script-Injection aus `CookieConsentContext`
  bleibt Begleitrauschen ohne Test-Failure.

## 7. Keine neuen Open-Questions

Der Sprint lief ohne neue Unklarheiten. Abweichung vom Spec-Plan:
keine neuen `/elster/*`-Routen — stattdessen Buttons in den existierenden
Pages (Scope-Honesty). Diese Abweichung ist oben in §4 Entscheidung #1
dokumentiert.

## 8. Cross-Referenzen

- `docs/ELSTER-SCHEMA-UPDATE-GUIDE.md` — jaehrlicher Wartungs-Cycle.
- `docs/TECH-DEBT-XBRL-MULTI-VERSION.md` — E-Bilanz-Taxonomie
  (verwandter Update-Prozess).
- `CLAUDE.md` §10 — ELSTER-ERiC-Transmission bleibt P1-Blocker.
- `src/domain/ustva/UstvaXmlBuilder.ts` — Referenz-Muster fuer alle
  ELSTER-XML-Generatoren.
