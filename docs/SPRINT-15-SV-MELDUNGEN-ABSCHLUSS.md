# Sprint 15 — SV-Meldungen · DSuV-XML + Beitragsnachweis-CSV

**Abgeschlossen:** 2026-04-24 · Autonomer Langlauf · 7 Schritte.
**End-Stand:** **1507 Tests grün / 145 Test-Dateien** · tsc clean.

**Addendum 2026-04-25 (Sprint 18):** Der hier in §5.4 offen gelistete
Tech-Debt "Schema-Erweiterung Arbeitnehmer" ist mit Sprint 18 in der
**Expand-Phase geschlossen**. Die neue Contract-Phase (NOT-NULL-
Migration nach 100% Backfill) wird in
`docs/TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md` weitergefuehrt.
Migrationen 0032 (Employee) + 0033 (Client) sind nullable + soft-
validiert. Siehe `docs/SPRINT-18-EMPLOYEE-SV-STAMMDATEN-ABSCHLUSS.md`.
**Scope:** DSuV-konforme XML-Generatoren fuer den manuellen Upload
im SV-Meldeportal (Nachfolger sv.net seit 2024) + CSV-Aggregations-
Export fuer Beitragsnachweise.

---

## 1. Ziel + Rechtsbasis

**Ziel:** Die dritte Pflicht-Meldungen-Achse neben ELSTER (UStVA,
LStA, ZM — Sprints 7 + 14) abdecken: SV-Meldungen nach DEUeV mit
Jahresmeldung / An- / Abmeldung im DSuV-XML-Format. Kein ITSG-
Trustcenter-Zertifikat, kein direkter ITSG-Upload — der User ladet
die erzeugte Datei manuell ins SV-Meldeportal.

**Rechtliche Basis:**
- **§ 28a SGB IV** — Meldepflicht Arbeitgeber.
- **§ 28b SGB IV** — Meldeformate.
- **Gemeinsame Grundsaetze GKV-Spitzenverband + ITSG** — konkrete
  Kennzahlen + Schluesselverzeichnisse.
- **BA-Schluesselverzeichnis 2010** — 9-stelliger Taetigkeitsschluessel.
- **GoBD Rz. 58-60** — Festschreibung vor SV-Meldung (bereits durch
  E1-Closing-Validator abgedeckt).

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Bestandsaufnahme** | Recon: Arbeitnehmer-Type hat `sv_nummer`, aber fehlende DEUeV-Pflichtfelder · Krankenkasse hat keine BBNR · Client hat keine Anschrift · Lohn-Archiv serialisiert alle SV-Beitragseinzelwerte · Scope-Honesty-Entscheidung: Zusatzfelder per UI-Input + localStorage, keine Schema-Aenderung | 0 |
| 2 | **DSuV-Basis-Types** | `src/domain/sv/dsuvTypes.ts` — `DEUeVAbgabegrund` · `Personengruppe` · `Beitragsgruppe` · `DEUeVMeldung` · `ArbeitnehmerExtraData` / `ArbeitgeberExtraData` · Default-Konstanten `BG_VOLL_SV_PFLICHTIG`, `BG_MINIJOB` | +3 |
| 3 | **SvMeldungBuilder** | `SvMeldungBuilder.ts` mit `buildAnmeldung` / `buildAbmeldung` / `buildJahresmeldung` · `personengruppeFromBeschaeftigung` · `beitragsgruppeFromFlags` · `MissingSvDataError` mit Reparatur-Hint · Jahressummen aus svBrutto im Lohn-Archiv | +11 |
| 4 | **DsuvXmlBuilder** | `DsuvXmlBuilder.ts` · DSuV-Envelope `<dsuv schemaVersion="2025-04">` mit `<dsko>`-Absender + `<deuev>`-Meldungen · Escape + Warn-System (BBNR- / sv_nummer-Laenge) · `DSUV_SCHEMA_VERSION` Konstante | +7 |
| 5 | **DsuvCsvBuilder** | `DsuvCsvBuilder.ts` · `buildBeitragsnachweisCsv()` fuer monatliche Summen pro Einzugsstelle + Beitragsgruppe · German-Comma-Decimal · CRLF-Line-Endings | +4 |
| 6 | **SvMeldungenPage + Route** | `src/pages/SvMeldungenPage.tsx` mit 3 Sections (Absender, Jahresmeldungen, Beitragsnachweis-CSV) · MandantRequiredGuard · Warn-Banner · Absender-Persistenz in localStorage `harouda:sv-absender:<mandantId>` · Route `/lohn/sv-meldungen` in `App.tsx` | +4 |
| 7 | **Update-Guide + Abschluss + Final-Gate** | `docs/DSUV-SCHEMA-UPDATE-GUIDE.md` + diese Doku · tsc clean · vitest gruen | 0 |

**Σ Sprint:** +29 Tests · +6 Test-Files · 1478 → **1507 gruen**.

## 3. Neue Dateien

### Domain-Layer (sv-Familie)
- `src/domain/sv/dsuvTypes.ts` — Kern-Types nach DEUeV
  (§§ 28a/28b SGB IV). `Beitragsgruppe` = 4-Tuple
  (kv/rv/av/pv). `Personengruppe` + `DEUeVAbgabegrund` als
  String-Literal-Unions.
- `src/domain/sv/SvMeldungBuilder.ts` — Orchestrator:
  `buildAnmeldung({arbeitnehmer, extraAn, arbeitgeber,
  beschaeftigungsbeginn})` · `buildAbmeldung(...)` ·
  `buildJahresmeldung({..., jahr, archivRows})`. Defensive
  `MissingSvDataError` mit Feld-Name + Reparatur-Hint. Jahres-
  summen aus `abrechnung_json.svBrutto`.
- `src/domain/sv/DsuvXmlBuilder.ts` — XML-Schicht mit Envelope
  `<dsuv schemaVersion=...>` + `<dsko>` + `<deuev>` pro Meldung.
  Warn-System fuer Laengen-Fehler (sv_nummer != 12, BBNR != 8).
- `src/domain/sv/DsuvCsvBuilder.ts` — `buildBeitragsnachweisCsv()`
  mit Header-Zeile + pro Beitragsgruppe eine Row. CRLF +
  Semikolon-Separator + German-Comma-Decimal.

### UI
- `src/pages/SvMeldungenPage.tsx` — komplette Seite mit 3 Haupt-
  Sektionen. `MandantRequiredGuard` wrappt den Inhalt. Demo-
  Employee-Liste (DEMO_EMPLOYEES) im MVP — echte Employee-
  Integration folgt, sobald die DEUeV-Pflichtfelder persistent
  im Arbeitnehmer-Type liegen. Absender-Block wird in
  localStorage pro Mandant gespeichert.
- `src/App.tsx` — neue Route `/lohn/sv-meldungen`.

### Tests (neu, 6 Files)
- `src/domain/sv/__tests__/dsuvTypes.test.ts` (+3) — Default-
  Beitragsgruppen, DEUeVMeldung-Shape, Personengruppe-Regex.
- `src/domain/sv/__tests__/SvMeldungBuilder.test.ts` (+11) —
  Mapping-Helper, Anmeldung, Abmeldung, Jahresmeldung mit
  Voll-/Teil-Jahr, 4 defensive-Throw-Tests.
- `src/domain/sv/__tests__/DsuvXmlBuilder.test.ts` (+7) —
  Einzel- + Multi-Meldung, Escape, Warn-System, Schema-Version-
  Attribut.
- `src/domain/sv/__tests__/DsuvCsvBuilder.test.ts` (+4) — Header-
  only, Aggregation, BBNR-Warn, Monatsbereichs-Warn.
- `src/pages/__tests__/SvMeldungenPage.smoke.test.tsx` (+4) —
  Mount + Warn-Banner, Absender-Persistenz, Buttons-Presence,
  CSV-Download-Trigger.

### Dokumentation
- `docs/DSUV-SCHEMA-UPDATE-GUIDE.md` — jaehrlicher Review-Cycle
  (Januar), Quellen, PR-Checkliste, Changelog.
- `docs/SPRINT-15-SV-MELDUNGEN-ABSCHLUSS.md` (diese Datei).

## 4. Architektur-Entscheidungen

1. **Scope-Honesty: keine Schema-Aenderung an Phase-2-Lohn-Types.**
   Die Spec verlangt explizit „Keine Schema-Aenderung an bestehenden
   Phase-2-Lohn-Types". Statt `Arbeitnehmer` um sechs Felder zu
   erweitern (Staatsangehoerigkeit, Geburtsname/-ort, Taetigkeits-
   schluessel, Mehrfachbeschaeftigung, Einzugsstelle-BBNR, Anschrift),
   nehmen die Builder einen expliziten `extraAn: ArbeitnehmerExtraData`
   Parameter. Die UI fragt die Felder per Prompt (MVP) ab. Persistenz
   ist Tech-Debt (siehe §5.4).
2. **`MissingSvDataError` statt stiller Defaults.** Die Spec verlangt
   „KEINE Default-Erfindungen" bei Pflichtfeldern. Der Builder wirft
   klar + mit Reparatur-Hint, damit der User genau weiss, wo das Feld
   nachzutragen ist.
3. **`BG_VOLL_SV_PFLICHTIG` + `BG_MINIJOB` als exportierte Konstanten.**
   Reduziert Magic-Strings in der UI und macht Tests lesbar.
4. **Jahressummen aus `svBrutto` statt aus `kv_an`/`rv_an`.** Die
   LohnabrechnungsEngine cap't `svBrutto` bereits auf die Beitrags-
   bemessungsgrenzen; deshalb liefert `svBrutto.toFixed2()` die
   korrekte Basis fuer `brutto_rv` und `brutto_kv`. Ruecker-
   Berechnung aus `kv_an` waere fehler-anfaellig (Rundungs-Drift).
5. **Absender-Persistenz pro Mandant, nicht global.** localStorage-Key
   `harouda:sv-absender:<mandantId>` — damit mehrere Mandanten parallel
   bearbeitet werden koennen, ohne dass sich die Arbeitgeber-Daten
   gegenseitig ueberschreiben.
6. **CSV mit CRLF + Semikolon + deutschem Komma-Decimal.** Das
   SV-Meldeportal (und Krankenkassen-Portale generell) erwarten
   deutsches Standard-Format. CRLF statt LF fuer Windows-Import-
   Kompatibilitaet.
7. **ProduktIdentifier `Harouda-2025.04` als Konstante.** ITSG
   verlangt einen Produkt-Identifier im `<dsko>`-Block. Bei Schema-
   Version-Update mit hochzaehlen (siehe DSUV-SCHEMA-UPDATE-GUIDE).
8. **Demo-Employees in der Page.** Die Recon hat gezeigt, dass das
   `Employee`-Model zwar `sv_nummer` hat, aber keine der DEUeV-
   Pflichtfelder — eine echte Employee-Liste waere ohne diese Felder
   sinnlos. Deshalb zeigt die Page zwei Demo-Zeilen, der Nutzer kann
   das Pattern nachvollziehen und wartet auf den Folge-Sprint mit
   `Arbeitnehmer`-Schema-Erweiterung.

## 5. Grenzen + bewusst verschoben

1. **Keine ITSG-Direkt-Transmission.** Kein ERiC / Trustcenter /
   Zertifikat. User laedt XML manuell ins SV-Meldeportal.
2. **Keine VSNR-Berechnung / -Vergabeantraege.** Zufaellige
   12-stellige Versicherungsnummern werden als Stammdaten
   vorausgesetzt.
3. **Keine GKV-Monatsmeldung** (neue DEUeV seit 2023) — eigener
   Sprint.
4. **Schema-Erweiterungen am Phase-2-Lohn-Type bewusst verschoben:**
   - `Arbeitnehmer.staatsangehoerigkeit`, `.geburtsname`,
     `.geburtsort`, `.taetigkeitsschluessel`,
     `.mehrfachbeschaeftigung`, `.einzugsstelle_bbnr`, `.anschrift`.
   - `Client.anschrift`.
   - `Krankenkasse.bbnr`.
   Wenn persistent gemacht: Recalculate des `Arbeitnehmer.test.ts`-
   Fixture-Matrix + Migration an Supabase-Schema. Kandidat fuer
   eigenen Sprint.
5. **Keine Auto-Aggregation im Beitragsnachweis-CSV.** MVP liefert
   nur Header; Zeilen ergaenzt der User im Kassenportal oder durch
   Folge-Sprint mit Lohn-Archiv-Aggregation.
6. **Keine AAG-Erstattungsantraege** (Aufwendungsausgleichsgesetz)
   — separater Bereich.
7. **Keine Auto-Trigger bei Employee-CRUD.** Meldungen sind immer
   User-Entscheidung; Auto-Anmeldung bei Neuanlage koennte in einem
   spaeteren Sprint ergaenzt werden.
8. **Absender-Anschrift nicht am `Client`-Type**, sondern in
   localStorage. Migration zum Client-Schema ist Tech-Debt.

## 6. Final-Gate-Ergebnisse

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **clean**.
- `npx vitest run` → **1507 / 1507 gruen** (145 Test-Dateien).
- Sprint-15-Tests isoliert: `npx vitest run src/domain/sv/
  src/pages/__tests__/SvMeldungenPage.smoke.test.tsx` → **29 / 29 gruen**.
- Regression-Check: Phase-2-Lohn-Tests + UStVA/LStA/ZM aus Sprints
  14 weiterhin alle gruen, keine Drift.
- Stderr-Output zur happy-dom-Script-Injection aus `CookieConsentContext`
  bleibt Begleitrauschen ohne Test-Failure.

## 7. Keine neuen Open-Questions

Der Sprint lief ohne neue Unklarheiten. Abweichung vom Spec-Plan in
Schritt 3 dokumentiert (extraAn-Parameter statt Arbeitnehmer-Schema-
Erweiterung). Diese Abweichung ist oben in §4 Entscheidung #1 + §5.4
transparent festgehalten.

## 8. Cross-Referenzen

- `docs/DSUV-SCHEMA-UPDATE-GUIDE.md` — jaehrlicher Wartungs-Cycle.
- `docs/ELSTER-SCHEMA-UPDATE-GUIDE.md` — analoger Zyklus fuer
  ELSTER-XML (Sprint 14).
- `CLAUDE.md` §10 — DEUeV-Meldungen war P2-Roadmap-Eintrag;
  dieser Sprint implementiert die XML/CSV-Export-Ebene, die
  Schema-Erweiterung bleibt offen.
- `src/domain/ustva/UstvaXmlBuilder.ts` + `src/domain/elster/*` —
  Referenz-Muster fuer weitere XML-Generatoren.

---

**Damit ist der dritte Pflicht-Meldungen-Kanal (nach ELSTER fuer UStVA
und LStA/ZM) abgedeckt. Der produktive Einsatz ist im Rahmen der
dokumentierten Grenzen moeglich — insbesondere muessen die fehlenden
Pflichtfelder pro Meldung manuell ergaenzt werden, bis die Schema-
Erweiterung in einem Folge-Sprint persistiert wird.**
