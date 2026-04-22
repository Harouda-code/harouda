# Handoff for Next Claude Conversation

## Project State

- App: harouda-app, German tax/accounting SaaS prototype
- Location: `D:/harouda-app`
- Tests: **995 passing / 65 files**
- Readiness: **~78 %**
- Last completed: **Post-Bugfix Mini-Sprint — 3 Mapping-Konflikte behoben**. Nacht-Modus, 2 geplante Bugs + 1 während der Arbeit identifizierter (Bug C). Tests 988 → **995 / 65 Dateien** (+7). Kern: (1) Bug A — 0860 Gewinnvortrag wird nicht mehr fälschlich nach A.III.1 Aktiva gemappt; neue Range `{860-869, P.A.IV}` carvt den Gewinnvortrag aus der Beteiligungen-Range aus. (2) Bug B — 2300 Grundkapital ist nicht mehr in GuV ZINSAUFWAND-Range (verkürzt auf 2310-2319); neue Bilanz-Regel `{2300-2309, P.A.I}` bringt die 50k €-Haben-Bewegung korrekt auf Passivseite. **Das war die exakte Ursache der 50k €-Aufwand-Aggregation-Lücke.** (3) Bug C (neu entdeckt) — 1600 Verbindlichkeiten L+L war auf `B.II.4 SONSTIGE_VERMOEGEN aktiva` gemappt, jetzt korrekt auf `P.C.4 VERB_LuL_1600` (gleiche Bug-Klasse wie A+B). 4 neue Regressions-Tests, 3 Bestandstests-Fixtures (BwaBuilder, GuvBuilder, skr03GuvMapping) von 2300 auf 2310 umgestellt. Musterfirma-Snapshot-Test jetzt mit **exakten Ist-Sollwerten** (Aktiva/Passiva 174.187,82 €, JÜ 28.587,82 €, Zahllast 4.150,00 €). Drift zu README-Sollwerten (196.396/37.300/2.820) ist 11-47 %, strukturell erklärbar durch AfA-Doppelung (CSV + AfA-Lauf bucht beide) und UStVA-Detail. Details in `docs/POST-BUGFIX-DECISIONS.md` + `docs/POST-BUGFIX-FRAGEN.md` + `docs/MUSTERFIRMA-RECHEN-VERIFIKATION.md`. Davor: Pre-Sprint-8 Bugfix-Runde (9 Fixes aus Audit-Report, +13 Tests). Autonomer Nacht-Modus, 8 User-Fragen vorab freigegeben. Tests 975 → **988 / 65 Dateien** (+13). Kern-Deliverables: (1) P0-01 GuV-Mapping für RC-Konten 3100-3159 → 5.b Fremdleistungen, Bilanz-Range 3000-3199 gesplittet zu 3000-3099 + 3160-3199. (2) P1-01 CSV-Fix `EB-005: 0800 → 2300` + FLAG-v3-Migration (v1 UND v2 Legacy). (3) P0-02 `updateBeleg` Supabase-Pfad bekommt jetzt `status === "GEBUCHT"`-Check analog DEMO. (4) P1-04 Neuer `journalStorno.test.ts` mit 5 Tests (reverseEntry + correctEntry + doppel-Storno + 2× Festschreibungs-Update-Abwehr). (5) P1-06 Neuer `musterfirmaBilanz.test.ts` End-to-End-Snapshot: Aktiva = Passiva (0,00 €) erfüllt, README-Sollwerte 196.396/37.300/2.820 aber NICHT erreicht. (6) P1-07 README 47 → 52 Buchungen korrigiert. P1-02 + P1-03 waren False Positives (Code schon korrekt). **Zwei NEUE Befunde während der Fix-Runde** (siehe `docs/SPRINT-BUGFIX-FRAGEN.md` F47): P1 — Bilanz-Range 800-889 A.III.1 umschließt das Sprint-7.5-Konto 0860 Gewinnvortrag (passiva), wird fälschlich auf Aktivseite geführt. P2 — Aufwand-Aggregation im BalanceSheetBuilder verliert 50.000 € (Ursache unbestimmt, braucht Debug). Diese Befunde erklären die Musterfirma-Drift (Ist-Aktiva 78.587 € vs. README 196.396 €). Davor: Sprint 7.5 Fix-Runde (DEMO_MODE-DEV-Default, selectedYear=2025-Sync, Orphan-Cleanup, fail-loud-throw, +7 Tests). Nacht-Modus, autonome Fixes für 6 von 7 Bugs aus `SPRINT-7-5-VERIFIKATION.md`. Tests 968 → **975 / 63 Dateien** (+7). Kern: (1) B1 — `DEMO_MODE` defaultet im DEV/Test auf true (Heuristik `VITE_DEMO_MODE !== "0" && import.meta.env.DEV`), Production-Build bleibt bei false ohne explizites Flag. (2) B2 — `autoSeedDemoIfNeeded` setzt `localStorage.selectedYear="2025"` synchron im Sync-Prefix vor `createRoot().render()`, damit `YearProvider` den korrekten Init-State bekommt. (3) B4 — neuer `detectOrphanLegacyState()`-Heuristik (Entries/Clients vorhanden + kein Kühn-Mandant mit `mandant_nr="10100"`) bereinigt pre-7.5-Altbestand statt silent-skip. (4) B5 — automatisch durch B1 behoben (`CompanyContext` liefert `role="owner"` im DEMO_MODE → `canWrite=true`). (5) B6 — `autoSeed`-catch-Block wirft Exception nach `console.error` weiter (`throw err`), damit `unhandledrejection`-Handler Sentry erreicht. (6) B7 — Tests decken DEMO_MODE-Export + autoSeed-Regression ab; kein eigenes `main.integration.test.ts`. B3 (MandantContext-Staleness) bewusst nicht gefixt — P2 in Roadmap. Details: `docs/SPRINT-7-5-FRAGEN.md` (6 autonome Entscheidungen F38-F43) + `docs/SPRINT-7-5-E2E-VERIFIKATION.md` (manuelles E2E-Szenario + 7 neue Regression-Tests). Davor: Sprint 7.5 Initial — Musterfirma Auto-Seed (17 Design-Fragen 21-37, +17 Tests).

## Next Task — Sprint 8 (Kandidaten-Liste)

Sprint 7 hat Kandidat (d) USt-Sonderfälle per Gap-Closure
abgeschlossen. Die verbleibenden 5 Sprint-7-Kandidaten sind
unverändert + ggf. neue Kandidaten aus der Sprint-6-/7-Roadmap.

| # | Kandidat | Hinweis |
|---|---|---|
| a | **Anlagen-CSV-Import** | ergänzt Sprint 1+2 CSV-Muster — Inventar-Nr, Bezeichnung, AK, ND, Methode, Konten, optional Abgangsdaten. Bestehende Basis: Migration 0025 + `createAnlagegut`. |
| b | **Wiederkehrende Buchungen** | Templates mit Zeitplan (monatlich/quartalsweise/jährlich), optional Auto-Booking bei Periodenwechsel. Echter Neubau, Architektur-Entscheidung Auto-Booking-Mechanik (Trigger vs. Button vs. Edge-Function) erforderlich. |
| c | **Kassenbuch mit GoBD-Rz. 111-113** | laufende Kassennummer, Bargeld-Plausi-Check (Saldo ≥ 0), Einzelaufzeichnungspflicht § 146 AO. KassenSichV-Abgrenzung POS vs. Kassenbuch dokumentieren. |
| e | **Personenkonten** (Debitoren/Kreditoren) | eigene Konten statt Sammelkonten-Modell 1400/1600. **Architektur-Frage** (Sammelkonten beibehalten additiv vs. ersetzen) — hohe Blast-Radius auf OPOS/Mahnwesen/Bilanz-Mapping. User-Konsultation nötig. |
| f | **Kombiniertes Jahresabschluss-PDF** | `BilanzPdfGenerator` + `GuvPdfGenerator` + `AnlagenspiegelPdfGenerator` zusammenführen. Offen aus `SPRINT-6-TEIL-2A-FRAGEN.md` Frage 1. Nice-to-have, niedrige Priorität. |
| g | **Dreiecksgeschäfte § 25b UStG (Kz 42)** | Ergänzung zu Sprint 7: Detail-Validierung und Konto 8338 seeden + Demo-Szenario. |
| h | **1572/1575-Mapping-Refactor** | Seed-Label-Drift aus `SPRINT-7-FRAGEN.md` Frage 20 beheben: 1572 von „IG-Erwerb" auf „allgemeine Vorsteuer" umbenennen + Mapping-Test-Ergänzung. |

**Pflicht-Bestandsaufnahme bleibt für jeden Sprint-7-Kandidaten
aktiv** (Sprint-3/4/5-Lektion — zwischen 70-90 % der spezifizierten
Arbeit war bereits vorhanden). Vor jeder Implementierung:

1. Grep nach relevanten Keywords im `src/`-Baum.
2. Ls in betroffenen Ordnern (`src/pages/`, `src/domain/`, `src/api/`).
3. Prüfe bestehende Tabellen (`supabase/migrations/`) und SKR03-Seed.
4. **STOP und Rückfrage wenn > 70-80 % existiert** → Option B
   (Gap-Closure statt Neubau).

**Review vor Sprint 7:**
- `docs/SPRINT-6-TEIL-2A-FRAGEN.md` — 7 autonome Entscheidungen aus
  Teil-2a-Nacht-Modus (besonders Frage 1: kombinierter PDF-Generator
  = Kandidat f).
- `docs/SPRINT-6-TEIL-2B-PLAN.md` Abschnitt 9 — Teil-2b-Freigabe
  rückwirkend 2026-04-20.
- `docs/SPRINT-6-DECISIONS.md` — 13 Entscheidungen quer durch
  Sprint 6.

**Sprint 7 abgeschlossen 2026-04-20 (Nacht-Modus):** Kandidat (d)
USt-Sonderfälle § 13b + IG-Lieferungen umgesetzt. Tests 932 → 951.
Details in `docs/SPRINT-7-PLAN.md`, `docs/SPRINT-7-PLAN-DETAIL.md`,
`docs/SPRINT-7-DECISIONS.md`, `docs/SPRINT-7-FRAGEN.md` (2 autonome
Neben-Entscheidungen 19-20 zur Review beim Sprint-8-Kickoff).

**Sprint 7.5 abgeschlossen 2026-04-20 (Nacht-Modus):** Musterfirma
Auto-Seed — beim ersten DEMO-Login lädt die App die Kühn Musterfirma
GmbH mit 52 Buchungen + 8 Anlagen + 5 KST + 2 KTR + 3 MA + 3 Bestand-
Mandanten automatisch aus `demo-input/musterfirma-2025/`. Vite
`?raw`-Import + `parseJournalCsv`. Tests 951 → 968 (+17). Alle 17
Design-Fragen 21-37 vom User vor Start freigegeben; keine autonomen
Neben-Entscheidungen. Details in `docs/SPRINT-7-5-DECISIONS.md`,
`docs/SPRINT-7-5-PLAN-DETAIL.md`, `docs/SPRINT-DEMO-PRE-CHECK.md`.

**Sprint 7.5 Fix-Runde abgeschlossen 2026-04-20 (Nacht-Modus):**
Verifikations-Report deckte auf, dass der Sprint-7.5-Auto-Seed im
Nutzer-Browser nie lief (`VITE_DEMO_MODE` unset → `DEMO_MODE=false`).
Fix-Runde: DEMO_MODE defaultet in DEV auf true (B1), selectedYear
wird sync auf 2025 gesetzt (B2), Orphan-State (pre-7.5-Altbestand
ohne Kühn) wird erkannt und bereinigt (B4), fail-loud re-throw (B6).
B3 (MandantContext-Staleness) bewusst nicht gefixt (F42, P2).
Tests 968 → 975 (+7). Details in `docs/SPRINT-7-5-FRAGEN.md` (6
autonome Entscheidungen F38-F43) + `docs/SPRINT-7-5-E2E-VERIFIKATION.md`.

**Review vor Sprint 8:**
- `docs/SPRINT-7-5-FRAGEN.md` — 6 autonome Entscheidungen F38-F43
  der Fix-Runde (**F42 offen**: soll MandantContext-Staleness in
  Sprint 8 gefixt werden? Storage-Event-Listener oder anderer Pfad?).
- `docs/SPRINT-7-5-E2E-VERIFIKATION.md` — manuelles E2E-Szenario,
  nach dem ersten echten User-Test ggf. Befunde ergänzen.
- `docs/SPRINT-7-5-DECISIONS.md` — 17 + 6 Entscheidungen Sprint 7.5
  (Initial-Lauf vor Start freigegeben, Fix-Runde autonom).
- `docs/SPRINT-7-FRAGEN.md` — 2 autonome Entscheidungen (Demo-Konto
  3425 statt 3140, 1572/1575-Label-Drift dokumentiert statt behoben)
- `docs/SPRINT-6-TEIL-2A-FRAGEN.md` — 7 autonome Entscheidungen aus
  Teil-2a-Nacht-Modus (Frage 1 = Kandidat f).
- `docs/SPRINT-6-TEIL-2B-PLAN.md` Abschnitt 9 — Teil-2b-Freigabe.
- `docs/SPRINT-6-DECISIONS.md` — 13 Entscheidungen Sprint 6.

**Alternative Wartestände** (siehe unten, falls kein neuer Sprint
sofort angegangen wird):

Alle Hash-Chain-**unabhängigen** Verfahrensdoku-Kapitel sind v0.1
BEFÜLLT (Kap. 1, 2, 3, 4, 7). Die verbleibenden Kapitel 5, 6, 8
hängen an der Rechts-Freigabe von
[`HASH-CHAIN-VS-ERASURE.md`](./HASH-CHAIN-VS-ERASURE.md) (Q1-Q8 an
Fachanwalt + DSB). Drei legitime Optionen für die nächste Session,
geordnet nach Leverage:

### Option A — Warten auf Rechts-Rückmeldung

Konkret: Der User informiert, sobald die schriftliche Stellungnahme
zu Q1-Q8 aus `HASH-CHAIN-VS-ERASURE.md` vorliegt. Dann:

- Design-Entscheidung zwischen Optionen A/B/C/D (oder der in §5 des
  Design-Doks empfohlenen Kombination **K1 = C + B**) wird final
  gewählt und in `CLAUDE.md` sowie `HASH-CHAIN-VS-ERASURE.md`
  dokumentiert.
- Migrations-Entwurf 0024 (Schema-Split / `pii_erasures`-Register
  bzw. Crypto-Shredding-Infrastruktur).
- Kapitel 5 (Abschnitt 5.4 + 5.5), Kapitel 6 (Abschnitt 6.3),
  Kapitel 8 (Abschnitt 8.4) können danach befüllt werden.
- Details in §7 des Design-Doks.

### Option B — Hash-Chain-Entscheidung vorziehen

Falls der User die Design-Entscheidung **vor** der formalen Rechts-
Freigabe treffen möchte (unter Vorbehalt, dass die Rechts-Review
die Wahl bestätigt): Diskussion der 4 Optionen (Crypto-Shredding /
Tombstone / PII-Split / Merkle-Re-Root) und Vor-Entscheidung mit
explizitem *„vorbehaltlich Fachanwalt-Freigabe"*-Vermerk. Keine
Migration, nur Entscheidungs-Dokument.

### Option C — Backup-Ops-Sprint

Produktions-Reife-Maßnahme, unabhängig vom Hash-Chain-Pfad. Schließt
den P1-Blocker aus `CLAUDE.md` §10.3. Umfang: Supabase PITR
aktivieren, `pg_dump`-Edge-Function bauen, S3-Frankfurt-Bucket mit
AVV aufsetzen, Restore-Runbook verfassen, quartalsweiser Testlauf
planen. Überwiegend Ops-Arbeit, nicht TypeScript. Details in
[`BACKUP-STRATEGY.md`](./BACKUP-STRATEGY.md).

### Empfehlung

Ohne User-Signal: **Option A (Warten)**. Die Hash-Chain-Entscheidung
hat die höchste Hebelwirkung für das gesamte Verfahren (schließt
DSGVO Art. 17, vervollständigt Kap. 5/6/8, unterscheidet
Produktivbetrieb von Prototyp). Eine Vor-Entscheidung unter
Vorbehalt (Option B) spart später keine Rechts-Review ein.
Option C ist wertvoll, aber lässt sich auch nach A abarbeiten.

## Critical Lessons from Recent Sessions

1. "Backup" in browser is false security — real backup needs server-side (PITR + pg_dump + S3).
2. GoBD hash-chain (prev_hash/entry_hash in journal_entries, audit_log) prevents overwriting rows. Any "restore" must be append-only or full-DB rebuild.
3. Never inflate readiness-score claims. +1% for honest client export, not +13%.
4. Check existing infrastructure before writing new code (zipBundler.ts, Gdpdu3Exporter.ts already exist).
5. Refuse to generate copyrighted legal templates (Datenschutzerklärung, AVV Muster).
6. retention.ts has 2025-updated rules (8 years for Buchungsbelege, not 10).

## User Working Style

- User writes in Arabic, receives English commands to paste into Claude Code.
- Pattern: AI sends ready-to-paste command block + brief summary. User pastes. User returns with Claude Code output. AI analyzes and sends next command.
- User values: honest scoping, chunked execution, rejection of half-finished work.
- User prefers: brief summaries, clear next steps, proper skepticism.

## Active Files / Recent Changes

- `CLAUDE.md` (422 lines, canonical project context — read this first)
- `docs/SESSION-2026-04-20-SUMMARY.md` (today's recap)
- `docs/BACKUP-STRATEGY.md` (Sprint-3: why backup must be server-side)
- `docs/HASH-CHAIN-VS-ERASURE.md` (604 lines, design doc — **wartet auf Rechts-Freigabe Q1-Q8**)
- `src/domain/journal/csvImport.ts` (CSV-Parser + Validator, Decimal-Beträge, Kostenstelle, Fiscal-Year-Check, 7- oder 8-Spalten-Header; pure TS, keine neuen npm-Deps)
- `src/domain/journal/__tests__/csvImport.test.ts` (34 Tests: Happy-Path + Edge-Cases + Kostenstelle + Fiscal-Year + Decimal-Präzision)
- `src/lib/datev/DatevExtfImporter.ts` (Sprint 2 — DATEV-EXTF-510-Parser, Bytes oder String, Header-Validierung, Fehlertoleranz; KOST2 wird *nicht* auf KTR gemappt — DATEV-Praxis zu uneinheitlich)
- `src/lib/datev/__tests__/DatevExtfImporter.test.ts` (23 Tests inkl. semantischem + byte-identischem Round-Trip)
- `src/lib/datev/datevFormat.ts` (erweitert um `fromLatin1Bytes`, `ustSatzForBuSchluessel`, `datevDateShortToIso`, `datevDateLongToIso`, `parseDatevDecimal`, `DATEV_COLUMN_POSITIONS`)
- `src/pages/JournalCsvImportPage.tsx` (Upload + Vorschau + Format-Umschalter + EXTF-Header-Anzeige + Import-Runner; Route `/journal/import`; Sprint-3-Fix: `createEntry` erhält jetzt `kostenstelle` und `kostentraeger`)
- **Sprint 3:** `supabase/migrations/0024_cost_carriers.sql` (Tabelle + Journal-Spalte + RLS, nicht in Hash-Kette)
- **Sprint 3:** `src/api/costCarriers.ts` (symmetrisch zu `costCenters.ts`), `src/pages/CostCarriersPage.tsx` (analog `CostCentersPage.tsx`), Routes `/einstellungen/kostentraeger` + `/berichte/dimensionen`
- **Sprint 3:** `src/pages/DimensionReportPage.tsx` (KST/KTR-Umschalter, Zeitraum-Filter, Leer-Dimension-Option)
- **Sprint 3:** `demo-input/musterfirma-2025/kostenstellen.csv` + `kostentraeger.csv` + erweiterte `buchungen.csv` (9-Spalten-Header)
- **Sprint 3:** `docs/SPRINT-3-DECISIONS.md` mit 6 Entscheidungen, `docs/SPRINT-3-STOPP.md` (Stand vor Option-B-Start)
- **Sprint 4:** `src/api/__tests__/opos.test.ts` (26 Tests, Derived-OPOS-Verhalten abgesichert)
- **Sprint 4:** `docs/SPRINT-4-DECISIONS.md` mit 6 Entscheidungen (Derived-Modell, Zinsen 9 vs 8 pp, Personenkonten vertagt, keine neue Altersstruktur-Route, Überfällig-Filter-Semantik, Demo-CSV-Erweiterung)
- **Sprint 4:** `demo-input/musterfirma-2025/buchungen.csv` 40 → 47 Zeilen (7 OPOS-Szenarien), `README.md` neuer Abschnitt 14b „OPOS-Szenarien"
- **Sprint 5:** `src/utils/__tests__/bankMatch.test.ts` (22 Tests: exact/high/medium/low, Beleg-Substring, Betrags-Tolerance, Richtungs-Check, Jaccard-Fuzzy, topMatches-Sortierung/Limit/Filter)
- **Sprint 5:** `src/domain/bank/skontoCalculator.ts` + `__tests__/skontoCalculator.test.ts` (~470 Zeilen, 11 Tests: 3-Zeilen-Splittung Forderung/Verbindlichkeit, 2-Zeilen-Fall USt 0, Frist-Grenze taggenau, Schwelle-Check, rejection-Pfade)
- **Sprint 5:** `src/pages/BankReconciliationPage.tsx` erweitert (+90 Zeilen: findSkontoPlanFor, postSkontoM, ActiveSkontoPlan-Memo, Preview-Section, Skonto-Button) + CSS
- **Sprint 5:** `src/api/skr03.ts` + `8731` (gewährte Skonti 7 %), `3730` (erhaltene Skonti 7 %), `3736` (erhaltene Skonti 19 %). `8730`-Label präzisiert.
- **Sprint 5:** `src/domain/journal/csvImport.ts` erweitert um `EXPECTED_HEADER_WITH_SKONTO` (11-Spalten-Variante) + Validierung skonto_pct/skonto_tage (+6 Tests)
- **Sprint 5:** `demo-input/musterfirma-2025/buchungen.csv` (11-Spalten-Header, Skonto auf AR-2025-001/AR-2025-002/ER-2025-003)
- **Sprint 5:** `demo-input/musterfirma-2025/bankauszug.mt940` (7 Transaktionen, Eröffnung/Schluss konsistent)
- **Sprint 5:** `docs/SPRINT-5-DECISIONS.md` mit 7 Entscheidungen (Fuzzy-Matcher bleibt, Calculator separat, kein Auto-Buchen, SKR03-Konten-Mapping, CSV-11-Spalten, MT940 statt CSV, UI minimalinvasiv)
- **Sprint 5:** `demo-input/musterfirma-2025/README.md` neuer Abschnitt 14c „Bank-Ausziffern mit Skonto-Automatik"
- **Sprint 6 Teil 1:** `supabase/migrations/0025_anlagenbuchhaltung.sql` (anlagegueter + afa_buchungen, RLS, nicht in Hash-Kette)
- **Sprint 6 Teil 1:** `src/types/db.ts` Anlagegut + AfaBuchung + AfaMethode Types
- **Sprint 6 Teil 1:** `src/api/anlagen.ts` (Dual-Mode Repo, CRUD + Upsert afa_buchungen)
- **Sprint 6 Teil 1:** `src/domain/anlagen/AfaCalculator.ts` + `__tests__/AfaCalculator.test.ts` (21 Tests: Spec-Beispiel je Jahr, Rand-Monate, ND-Grenzen, Erinnerungswert, Abgang, Drift-Korrektur, Input-Validierung, summiereLineareAfa Sumcheck)
- **Sprint 6 Teil 1:** `src/domain/anlagen/AnlagenService.ts` + `__tests__/AnlagenService.test.ts` (14 Tests: planAfaLauf, getAnlagenspiegelData-Invariante, createAnlageWithOpening mit/ohne Gegenkonto, commitAfaLauf DEMO)
- **Sprint 6 Teil 1:** `src/pages/AnlagenVerzeichnisPage.tsx` (CRUD-Liste + Formular mit konditioneller AfA-Methoden-Auswahl, Dropdown 0xxx-Bestandskonten)
- **Sprint 6 Teil 1:** `src/pages/AfaLaufPage.tsx` (Jahr-Selector, Plan-Vorschau mit Summe, `confirm()`-Bestätigung, idempotent via afa_buchungen-Upsert)
- **Sprint 6 Teil 1:** Routes `/anlagen/verzeichnis` + `/anlagen/afa-lauf` in `App.tsx`, AppShell-Menü ergänzt
- **Sprint 6 Teil 1:** `demo-input/musterfirma-2025/anlagegueter.csv` (6 Anlagen: Telefonanlage, Büromöbel, PKW, Gabelstapler, Laptop, Server)
- **Sprint 6 Teil 1:** `demo-input/musterfirma-2025/README.md` Abschnitt 14d mit AfA-Erwartungs-Tabelle + Anlagenspiegel-Erwartungs-Tabelle
- **Sprint 6 Teil 1:** `docs/SPRINT-6-DECISIONS.md` mit 8 Entscheidungen (Scope-Split, Netto/Brutto-Methoden, monatsgenaue AfA, Rundungs-Drift, Erinnerungswert, planAfaLauf/commit-Split, kein CSV-Import in Teil 1, Anlagenspiegel pure Service ohne UI)
- **Sprint 6 Teil 2a:** `src/lib/pdf/AnlagenspiegelPdfGenerator.ts` (A4 Querformat, 9 Spalten HGB §284 + Totals)
- **Sprint 6 Teil 2a:** `src/lib/excel/AnlagenspiegelExcelExporter.ts` (erste ExcelJS-Nutzung, `#,##0.00 €`-Format)
- **Sprint 6 Teil 2a:** `src/pages/AnlagenspiegelPage.tsx` + Route `/berichte/anlagenspiegel` + AppShell-Menü
- **Sprint 6 Teil 2a:** `src/pages/JahresabschlussPage.tsx` erweitert (Anlagenspiegel-Summary-Sektion + JSON-Export-Block, kein kombiniertes PDF)
- **Sprint 6 Teil 2a:** `src/domain/anlagen/AnlagenService.ts` + `planAbgang` + `buchtAbgang` + `markAnlageAbgegangen` (via `patchAnlageRaw` im Repo)
- **Sprint 6 Teil 2a:** `src/api/anlagen.ts` + `patchAnlageRaw` für aktiv/abgangsdatum/abgangserloes-Patch
- **Sprint 6 Teil 2a:** `src/pages/AnlagenVerzeichnisPage.tsx` erweitert (Abgang-Button + Inline-Formular + Plan-Preview-Tabelle + Live-AfA-Vorschau im Neu-Formular, scroll-Container 320 px)
- **Sprint 6 Teil 2a:** `src/domain/anlagen/__tests__/Abgang.test.ts` (13 Tests)
- **Sprint 6 Teil 2a:** `src/domain/anlagen/__tests__/AnlagenspiegelExtra.test.ts` (7 Tests, inkl. PDF/Excel-Smoke)
- **Sprint 6 Teil 2a:** `docs/SPRINT-6-TEIL-2A-FRAGEN.md` — 7 autonome Entscheidungen im Nacht-Modus (Jahresabschluss-PDF Option B, USt Brutto-Eingabe mit Selektor, Split 2-4 Buchungen, SKR03 2700/2800, Live-Vorschau Scroll-Container, Zeit-Reihenfolge Anlagenspiegel, Inline statt Modal)
- **Sprint 6 Teil 2a:** `docs/SPRINT-6-DECISIONS.md` Nachtrag-Abschnitt mit Teil-2a-Deliverables + Grenzen
- **Sprint 6 Teil 2a:** `demo-input/musterfirma-2025/README.md` neuer Abschnitt 14e „Anlagenspiegel + Abgangs-Workflow + Live-Vorschau"
- **Sprint 7.5:** `src/api/demoSeed.ts` (~400 Zeilen Neu-Implementierung): `autoSeedDemoIfNeeded`, `seedKuehnMusterfirma`, `seedBestandsMandanten`, `seedKanzleiSettings`, `setKuehnAsDefaultMandant`, `seedMusterfirmaKostenstellen`, `seedMusterfirmaKostentraeger`, `seedMusterfirmaMitarbeiter`, `seedMusterfirmaAnlagen`, `seedMusterfirmaJournal`, `clearLegacyDemoData`. Vite `?raw`-Import der `buchungen.csv` + bestehender `parseJournalCsv` + sequentielles `createEntry` (Hash-Chain-sicher). FLAG-Keys `harouda:demo-seeded-v2` + `harouda:demo-seeded` (v1-Legacy-Marker).
- **Sprint 7.5:** `src/api/__tests__/demoSeed.test.ts` (17 Tests: SKR03 9000/0860, 4 Mandanten + Default-Selected, 5 KST/2 KTR, 3 MA Pflichtfelder, 8 Anlagen DE→ISO, 52 Journal-Einträge mit Hash-Chain, Skonto-Sprint-5, RC/IG-Sprint-7, FLAG-v2-setzen, v1→v2-Migration, Respekt-vor-User-Daten).
- **Sprint 7.5:** `src/api/skr03.ts` +`0860 Gewinnvortrag vor Verwendung` (passiva) + `9000 Eröffnungsbilanzkonto (Saldenvortrag)` (passiva) — Entscheidung 34.
- **Sprint 7.5:** `src/api/dashboard.ts` — `seedDemoData` seedet nur noch SKR03-Konten (15 hardcoded isoDaysAgo-Journal-Einträge entfernt per Entscheidung 22 A).
- **Sprint 7.5:** `src/vite-env.d.ts` NEU (`/// <reference types="vite/client" />` — erste `?raw`-Nutzung im Projekt, Entscheidung 23).
- **Sprint 7.5:** `docs/SPRINT-7-5-DECISIONS.md` mit 17 Entscheidungen (21-30 Runde 1 + 31-37 Runde 2) + Fix-Runde-Nachtrag (F38-F43).
- **Sprint 7.5:** `docs/SPRINT-7-5-PLAN-DETAIL.md` + `docs/SPRINT-DEMO-PRE-CHECK.md` (Planungs-Artefakte Phase 0).
- **Sprint 7.5 Fix-Runde:** `src/api/supabase.ts` — `DEMO_MODE` als Heuristik-IIFE: `VITE_DEMO_MODE="1"` → true, `="0"` → false, unset → `import.meta.env.DEV`. Dev-Server ohne `.env.local`-Edit landet im Demo-Pfad; Production-Build ist ohne explizites Flag in Supabase-Mode (B1).
- **Sprint 7.5 Fix-Runde:** `src/api/demoSeed.ts` — neuer `SELECTED_YEAR_KEY`-Konstante + `MUSTERFIRMA_FISCAL_YEAR = "2025"`, neue Helper `detectOrphanLegacyState()` + `ensureSelectedYearForMusterfirma()`, `clearLegacyDemoData` räumt zusätzlich `selectedYear`. `autoSeedDemoIfNeeded` hat jetzt Sync-Prefix (vor erstem `await`) für FLAG/Orphan/Year-Checks und Async-Sequenz für eigentliche Seeds. catch-Block re-throws nach `console.error` (B6). Respekt-Branch greift nur noch, wenn Kühn-Mandant existiert.
- **Sprint 7.5 Fix-Runde:** `src/api/__tests__/demoSeed.test.ts` — 7 neue Tests + 1 angepasster Test: B1-DEMO_MODE-DEV-Default, B2-selectedYear-2025, B2-User-Wahl-respektiert, B4-Orphan-Cleanup, B5-canWrite-owner, B6-fail-loud-re-throw, Idempotenz-Kontrolle, Respekt-Branch-neu-formuliert (Kühn muss existieren).
- **Sprint 7.5 Fix-Runde:** `docs/SPRINT-7-5-FRAGEN.md` NEU — 6 autonome Fix-Entscheidungen F38-F43 mit Begründung und Risiko-Analyse. F42 (MandantContext-Staleness) explizit als offene User-Frage markiert.
- **Sprint 7.5 Fix-Runde:** `docs/SPRINT-7-5-E2E-VERIFIKATION.md` NEU — manuelles E2E-Szenario (A frisch, B Bestand, C User-mit-Kühn, D Seed-Fehler), Regressions-Test-Tabelle, technischer Pfad `npm run dev → DEMO_MODE → autoSeed → createRoot`, Troubleshooting-Tabelle.
- **Sprint 6 Teil 2b:** `src/domain/anlagen/AfaCalculator.ts` erweitert um `berechneGwgAfa` + `berechneSammelpostenAfa` + `AfaGwgInput` + `AfaSammelpostenInput`-Typen
- **Sprint 6 Teil 2b:** `src/domain/anlagen/AnlagenService.ts` — `planAfaLauf` dispatch, `getAnlagenspiegelData` methoden-neutral, `planAbgang` erweitert (Sammelposten-Block, GWG-Pfad ohne Teil-AfA, indirekte Methode mit `aufloesung_kum`-Rolle), neue `AbgangLineRolle` `aufloesung_kum`
- **Sprint 6 Teil 2b:** `src/api/anlagen.ts` — Validierung ergänzt um Sammelposten-AK-Bereich + gwg_sofort/sammelposten als zulässige Methoden
- **Sprint 6 Teil 2b:** `src/pages/AnlagenVerzeichnisPage.tsx` — Dropdown neue Methoden enabled, ND-Feld konditional disabled, method-spezifische Hinweisboxen mit Grenzwert-Warnungen, Live-Vorschau dispatched je Methode
- **Sprint 6 Teil 2b:** `src/domain/anlagen/__tests__/GwgSammelposten.test.ts` (18 Tests)
- **Sprint 6 Teil 2b:** `src/domain/anlagen/__tests__/Abgang.test.ts` erweitert um 3 Indirekt-Methode-Tests + 1 GWG-Abgang-Test (altes „indirekt → Fehler" umgeschrieben)
- **Sprint 6 Teil 2b:** `demo-input/musterfirma-2025/anlagegueter.csv` +INV-2025-002 (GWG Bürostuhl 350 €) + INV-2025-003 (Sammelposten Monitor 500 €)
- **Sprint 6 Teil 2b:** `demo-input/musterfirma-2025/README.md` Abschnitt 14f (GWG + Sammelposten + Indirekte Methode)
- **Sprint 6 Teil 2b:** `docs/SPRINT-6-DECISIONS.md` Nachtrag mit 4 Entscheidungen (GWG ohne harte Grenze, Sammelposten harte Grenzen + Pool-Schutz, Degressiv NEIN mit Spec-Fallback, Indirekt-Methode-Abgang)
- **BilRUG-2015-Fix (vor Teil 2b):** `src/domain/accounting/skr03GuvMapping.ts` + 2800-Range → Posten 8; `src/api/skr03.ts` Labels 2700/2800 auf „Sonstige neutrale ..." umbenannt; `src/domain/accounting/__tests__/GuvBuilder.test.ts` +2 Regressions-Tests
- `demo-input/musterfirma-2025/` (Demo-Paket: firma.json, mitarbeiter/kunden/lieferanten.csv, buchungen.csv mit Spec-konformem Header, README.md Walkthrough, BEOBACHTUNGEN.md)
- `docs/verfahrensdokumentation/README.md` (Index + Kapitel-Tabelle + Abhängigkeits-Hinweise)
- `docs/verfahrensdokumentation/01-allgemeine-beschreibung.md` (v0.1 BEFÜLLT, 380 Zeilen, 42 Rechts-Zitate, 2 TODO-Marker)
- `docs/verfahrensdokumentation/02-anwenderdokumentation.md` (v0.1 BEFÜLLT, 432 Zeilen, 16 Rechts-Zitate, 2 TODO-Marker)
- `docs/verfahrensdokumentation/03-technische-systemdokumentation.md` (v0.1 BEFÜLLT, 396 Zeilen, 18 Rechts-Zitate, 3 TODO-Marker)
- `docs/verfahrensdokumentation/04-betriebsdokumentation.md` (v0.1 BEFÜLLT, 441 Zeilen, 15 Rechts-Zitate, 5 TODO-Marker)
- `docs/verfahrensdokumentation/05-datensicherheits-und-datenschutzkonzept.md` (STUB, Abschnitte 5.4/5.5 hängen am Hash-Chain-Entscheid)
- `docs/verfahrensdokumentation/06-aufbewahrungs-und-loeschkonzept.md` (STUB, Abschnitt 6.3 hängt am Hash-Chain-Entscheid)
- `docs/verfahrensdokumentation/07-pruefpfade-und-protokollierung.md` (v0.1 BEFÜLLT, 414 Zeilen, 16 Rechts-Zitate, 2 TODO-Marker)
- `docs/verfahrensdokumentation/08-internes-kontrollsystem.md` (STUB, Abschnitt 8.4 hängt am Hash-Chain-Entscheid)
- `src/data/retention.ts` (extended with `canDelete()` + `cookie_consent` category, 3 y TTDSG)
- `src/components/privacy/CookieConsent.tsx` (plain `<a>`, not `<Link>` — see CLAUDE.md §12.14)
- `src/pages/DatenschutzPage.tsx` + `ImpressumPage.tsx` (empty scaffolds, lawyer-warning banners)
- `src/domain/export/MandantenDatenExportService.ts` (Sprint-3: pure export logic, SHA-256 manifest)
- `src/pages/DatenExportPage.tsx` (Sprint-3: `/admin/datenexport` UI with "nicht ein Backup" banner)
- `supabase/migrations/0023_dsgvo_compliance.sql` (cookie_consents, privacy_requests, privacy_incidents)

## Do's

- Run /init or read CLAUDE.md at conversation start.
- Verify claims before fixing (grep the code first).
- Reuse existing libs (zipBundler, Gdpdu3Exporter, payrollHash).
- Propose scope cuts when a spec is unrealistic for one session.
- Cite § paragraphs for legal claims.

## Don'ts

- Don't generate legal prose (Datenschutzerklärung text, AVV body).
- Don't claim P1 blocker closure from client-side code.
- Don't break hash chains (prev_hash/entry_hash in journal/audit tables).
- Don't mutate festgeschriebene (locked) records.
- Don't use `<Link>` in components mounted outside `BrowserRouter` (e.g., CookieConsent).

## Open Design Questions (blocking future sprints)

1. **[awaiting legal review]** Hash-chain vs. anonymisation for DSGVO Art. 17 erasure. Design-Dokument fertig (`docs/HASH-CHAIN-VS-ERASURE.md`); 8 juristische Fragen (Q1-Q8) liegen Fachanwalt für Steuerrecht + DSB zur Prüfung vor. Implementierung startet nach deren Freigabe.
2. Supabase-auth wiring for `privacy_requests.user_id` + `cookie_consents.user_id` — currently client-side only.
3. Server-side backup strategy (P1 still open): Supabase PITR + pg_dump Edge Function + S3 Frankfurt. See `docs/BACKUP-STRATEGY.md`.
4. **Verfahrensdoku-Inhalte — welche Kapitel zuerst?** Empfehlung: **1, 3, 7 vor 5, 6, 8**, weil 5/6/8 teilweise auf die Hash-Chain-Entscheidung warten. Kapitel 2 und 4 können ebenfalls früh befüllt werden. Entscheidung beim nächsten User-Review.

## Immediate Next Action

**Beim nächsten User-Kontakt:**

1. **Sprint 8 Kickoff** — User wählt einen der Kandidaten (a/b/c/e/f/g/h)
   aus der Tabelle oben. Vor Start **Pflicht-Bestandsaufnahme**
   (Grep + Ls in `src/`, SKR03, Migrationen). Wenn > 70-80 % vorhanden
   → STOPP + Gap-Closure-Option B statt Neubau.

2. **Offene Post-Bugfix-Follow-Ups** (können entweder vor Sprint 8 gebündelt
   oder in Sprint 8 integriert werden):
   - **AfA-Doppelung:** CSV-Zeile `AfA-2025` streichen → AfA nur noch
     über AfA-Lauf. Kleiner Fix (~15 min), aber Musterfirma-Bilanz
     verändert sich → Snapshot-Test-Werte müssen neu gesetzt werden.
   - **UStVA-Zahllast +1.330 € Drift debuggen** (`buildUstva`-Kennzahlen
     Dezember einzeln prüfen).
   - **P3 F52** — 2600-2649 Rückstellungs-Range latenter Konflikt
     (aktuell keine Musterfirma-Auswirkung, aber falsch für Rückstellungs-
     Buchungen).

3. **Nach 2) ist Konvergenz auf README-Sollwerte möglich:**
   `musterfirmaBilanz.test.ts` auf 196.396 / 37.300 / 2.820 umstellen.

Empfehlung ohne User-Signal: **Mini-Folge-Sprint (2 h)** für AfA-
Doppelung + UStVA-Drift — beides ist kleiner Aufwand und schließt die
Musterfirma-Demo-Qualität. Danach Sprint 8 mit Kandidat (h) 1572/1575-
Mapping-Refactor (kleiner Label-Drift aus SPRINT-7-FRAGEN.md F20) oder
(a) Anlagen-CSV-Import. Kandidat (e) Personenkonten hat hohe Blast-
Radius — nur mit expliziter User-Freigabe.

Parallele Wartestände weiterhin:

- Rechts-Rückmeldung zu `HASH-CHAIN-VS-ERASURE.md` (Q1-Q8 bei
  Fachanwalt + DSB). Freischaltung von Kap. 5/6/8 der Verfahrensdoku
  + Migration 0025 (Crypto-Shredding oder Schema-Split).
- Server-side Backup-Ops (P1 Blocker, CLAUDE.md § 10.3).
