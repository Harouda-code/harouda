# Wartungs-Leitfaden · DSuV/DEUeV-Schema-Updates

**Erfasst:** 2026-04-24 · Sprint 15 / Schritt 7.
**Gilt fuer:** alle DEUeV-XML-/CSV-Builder unter `src/domain/sv/`.

---

## Warum dieses Dokument existiert

Die Gemeinsamen Grundsaetze des GKV-Spitzenverbandes und der ITSG
regeln den Datenaustausch zwischen Arbeitgebern, Krankenkassen und
Rentenversicherungstraegern nach §§ 28a/28b SGB IV. Sie werden
mindestens einmal jaehrlich (typisch Januar/April) aktualisiert. Ein
XML/CSV mit veraltetem Kennzahlen-Mapping oder `schemaVersion`-
Attribut wird vom SV-Meldeportal bzw. sv.net abgelehnt oder — noch
schlimmer — akzeptiert, aber wegen falscher Beitragsgruppen-Codierung
spaeter beanstandet.

Dieses Dokument legt den Update-Prozess fest, damit neue AI-Sessions
oder neue Teammitglieder die Schema-Version nicht aus Unwissenheit
„stale" lassen.

## Aktuelle Schema-Versionen im Code

| Artefakt | Schema-Version | Code-Pfad |
|---|---|---|
| DSuV-XML (DEUeV) | 2025-04 | `src/domain/sv/DsuvXmlBuilder.ts` (Konstante `DSUV_SCHEMA_VERSION`) |
| Beitragsnachweis-CSV | 2025-04 (implizit) | `src/domain/sv/DsuvCsvBuilder.ts` |
| ProduktIdentifier | `Harouda-2025.04` | `src/domain/sv/DsuvXmlBuilder.ts` (Konstante `PRODUCT_IDENTIFIER`) |

## Quellen fuer neue Schemas

Primaer:
- **gkv-datenaustausch.de** → „Arbeitgeber/Software-Ersteller" →
  „DEUeV" → Jahresupdate der Datensatzbeschreibungen.
- **ITSG-Technik-Seite** (itsg.de) → Meldeformate.

Sekundaer:
- **sv-meldeportal.de** → „Entwicklerinformationen".
- **BA-Schluesselverzeichnis 2010** — Taetigkeitsschluessel (neunstellig).

## Update-Workflow

1. **Datensatzbeschreibung-Download** (PDF + XSD, falls verfuegbar)
   vom GKV-Datenaustausch-Portal.
2. **Diff gegen bestehenden Builder**:
   - Neue Felder in `DEUeVMeldung` pruefen.
   - Abgabegruende (Code-Listen) auf Zu-/Abgaenge pruefen.
   - Personengruppen- / Beitragsgruppen-Schluessel auf Aenderungen pruefen.
   - Neue Pflichtfelder im `<arbeitnehmer>`- oder `<beschaeftigung>`-
     Block.
3. **Konstante aktualisieren**:
   ```typescript
   export const DSUV_SCHEMA_VERSION = "2025-04"; // → "2026-04"
   export const PRODUCT_IDENTIFIER = "Harouda-2026.04";
   ```
4. **Builder-Logik**: neue Felder hinzufuegen oder entfallene
   ausblenden. Defensiver Default: Felder, die unklar sind, NICHT
   automatisch befuellen — stattdessen `warnings`-Liste des Results
   ergaenzen.
5. **Tests aktualisieren**:
   - Neue Tests pro neuer Pflichtangabe.
   - Regression-Tests: historische Meldungen duerfen nicht brechen.
6. **UI-Hinweis**: im Warn-Banner von `SvMeldungenPage` kommt
   `schema_version` aus dem Builder-Result automatisch via Toast.
7. **Changelog-Eintrag** unten in diesem Dokument.

## Review-Zyklus

**Mindestens einmal jaehrlich im Januar** (vor dem ersten DEUeV-
Zeitraum des neuen Jahres):

- [ ] gkv-datenaustausch.de auf neue Version pruefen.
- [ ] Falls neu: diese Doku aktualisieren + Folge-Sprint einplanen.
- [ ] BA-Taetigkeitsschluessel-Verzeichnis auf Aktualisierung pruefen.
- [ ] sv-meldeportal.de auf neue Upload-Formate pruefen.

## Pull-Request-Checkliste pro Aenderung

- [ ] Schema-Quelle zitiert (URL + Dokument + Stand-Datum).
- [ ] `DSUV_SCHEMA_VERSION` + `PRODUCT_IDENTIFIER` aktualisiert.
- [ ] Builder-Tests gruen.
- [ ] Page-Smoke-Tests (`SvMeldungenPage.smoke.test.tsx`) gruen.
- [ ] Manueller Test: erzeugte XML im SV-Meldeportal-Test-Account
      hochladen und Validator-Rueckmeldung pruefen.
- [ ] `tsc --noEmit` clean.
- [ ] Diesen Guide um Changelog-Eintrag ergaenzen.

## Changelog

| Datum | Sprint | Aenderung |
|---|---|---|
| 2026-04-24 | Sprint 15 | DSuV-XML + Beitragsnachweis-CSV erstmalig eingefuehrt mit Schema-Stand `2025-04` · ProduktIdentifier `Harouda-2025.04`. |

## Bekannte Tech-Debts

§7 der Sprint-15-Abschluss-Doku listet auf:
- Auto-Aggregation der Beitragsnachweis-Rows aus dem Lohn-Archiv (MVP
  liefert nur Header-CSV).
- Persistenz der fehlenden DEUeV-Pflichtfelder im `Arbeitnehmer`-Type
  (Staatsangehoerigkeit, Geburtsname/-ort, Taetigkeitsschluessel,
  Mehrfachbeschaeftigung, Einzugsstelle-BBNR, Adresse).
- Persistenz einer `Client.anschrift` oder expliziter
  `Arbeitgeber-Anschrift` — aktuell im Absender-Block manuell
  erfasst und per localStorage pro Mandant gespeichert.
- BBNR-Feld an Krankenkasse-Stammdaten
  (`src/data/steuerParameter/types.ts`).
- GKV-Monatsmeldung (neue DEUeV seit 2023) — eigener Sprint.
- AAG-Erstattungsantraege (Aufwendungsausgleichsgesetz) — separater
  Bereich.

## Siehe auch

- `docs/SPRINT-15-SV-MELDUNGEN-ABSCHLUSS.md` — Sprint-Kontext.
- `docs/ELSTER-SCHEMA-UPDATE-GUIDE.md` — analoger Wartungszyklus fuer
  ELSTER-XML-Generatoren.
- `CLAUDE.md` §10 — DEUeV-Meldungen als P2-Roadmap-Item.
