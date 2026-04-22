# Sprint Jahresabschluss-E1 — Pre-Closing-Validation-Engine + Mandant-Stammdaten

**Abgeschlossen:** 2026-04-21 · Autonomer Nacht-Modus · 8 Schritte.
**End-Stand:** **1318 Tests grün / 114 Test-Dateien** · tsc clean.
**Scope:** E1 von 3 Jahresabschluss-Sprints (heute Validation +
Stammdaten · morgen E2 Wizard + Rules · übermorgen E3+E4 Docs + Export).

---

## 1. Ziel + Rechtsbasis

**Ziel:** Fundament für den Jahresabschluss-Wizard — Mandant-Stammdaten
um HGB-relevante Felder erweitern (Rechtsform, HRB, Gezeichnetes
Kapital, Organe, Wirtschaftsjahr-Daten) + zentraler Pre-Closing-
Validator, der alle einschlägigen Checks zu einem `darf_jahresabschluss_
erstellen`-Signal bündelt.

**Rechtliche Basis:**
- **§ 267 HGB** — Größenklassen (Kleinst / Klein / Mittel / Groß),
  Schwellenwerte 2025 aus BGBl. I 2024.
- **§ 146 AO** — Unveränderbarkeit der Buchführung.
- **GoBD Rz. 58-60** — Festschreibung vor Steuererklärung.
- **§ 264 HGB** — Jahresabschluss-Pflicht für Kapitalgesellschaften.

**Zielgruppe:** BEIDE Rechtsformen (Einzelunternehmen + GmbH). DB
trägt alle GmbH-Felder; UI-Conditional kommt in E2.

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Client-Stammdaten-Erweiterung** | Migration 0030 (7 ADD COLUMN, CHECK-Constraint auf Rechtsform) · TS-Type-Erweiterung inkl. `Geschaeftsfuehrer`-Type · `api/clients.ts` ClientInput + create/update | +14 |
| 2 | **§ 267 HGB-Klassifikator** | `HgbSizeClassifier.ts` · `HGB267_SCHWELLENWERTE_2025` · `classifyHgb267()` · `computeKriteriumFromJournal()` | +9 |
| 3 | **Trial-Balance-Check** | `TrialBalance.ts` · `computeTrialBalance()` | +6 |
| 4 | **AfA-Completeness-Detection** | `AfaCompletenessCheck.ts` · `detectAfaLuecken()` | +5 |
| 5 | **Lohn-Completeness-Detection** | `LohnCompletenessCheck.ts` · `detectLohnLuecken()` | +6 |
| 6 | **Bank-Reconciliation-Gap-API** | `BankReconciliationGaps.ts` · Headless-Schnittstelle (Persistenz folgt) | +2 |
| 7 | **Zentraler Closing-Validator** | `ClosingValidation.ts` · `validateYearEnd()` mit 9 Check-Signalen + Severity-Klassifikation | +7 |
| 8 | **Abschluss + Gate** | Diese Doku + Spot-Checks | 0 |

**Σ Sprint:** +49 Tests · +8 Test-Files · 1269 → **1318 grün**.

## 3. Neue Dateien

### Migration
- `supabase/migrations/0030_client_rechtsform_stammdaten.sql` — 7 ADD COLUMN (rechtsform, hrb_nummer, hrb_gericht, gezeichnetes_kapital, geschaeftsfuehrer JSONB, wirtschaftsjahr_beginn/ende), CHECK-Constraint auf 10 Rechtsform-Werte, JSONB-Default `'[]'`, MM-DD-Defaults für Wirtschaftsjahr. Idempotent via `IF NOT EXISTS`.

### Types
- `src/types/db.ts` — `Geschaeftsfuehrer`-Type neu (name/funktion/bestellt_am), `Client`-Type um 7 Felder erweitert (alle optional/nullable).

### API
- `src/api/clients.ts` — `ClientInput`-Type neu, `createClient()` + `updateClient()` durchreichen aller neuen Felder in DEMO und Supabase-Pfad. DEMO setzt Wirtschaftsjahr-Defaults "01-01"/"12-31".

### Domain-Layer
- `src/domain/accounting/HgbSizeClassifier.ts` — `classifyHgb267()`, `computeKriteriumFromJournal()`, Schwellenwerte 2025.
- `src/domain/accounting/TrialBalance.ts` — `computeTrialBalance()` mit Cent-Toleranz.
- `src/domain/anlagen/AfaCompletenessCheck.ts` — `detectAfaLuecken()` via `planAfaLauf` vs. `afa_buchungen`.
- `src/domain/lohn/LohnCompletenessCheck.ts` — `detectLohnLuecken()` mit Beschäftigungs-Zeitraum-Check.
- `src/domain/banking/BankReconciliationGaps.ts` — Headless-API, aktuell Empty-Return (Persistenz fehlt, OPEN-QUESTIONS Frage #1).
- `src/domain/accounting/ClosingValidation.ts` — `validateYearEnd()` aggregiert 9 Checks zu einem Report.

### Tests
- `src/__tests__/migration-0030-structure.test.ts` (8 Tests)
- `src/api/__tests__/clients.rechtsform.test.ts` (6 Tests)
- `src/domain/accounting/__tests__/HgbSizeClassifier.test.ts` (9 Tests)
- `src/domain/accounting/__tests__/TrialBalance.test.ts` (6 Tests)
- `src/domain/anlagen/__tests__/AfaCompletenessCheck.test.ts` (5 Tests)
- `src/domain/lohn/__tests__/LohnCompletenessCheck.test.ts` (6 Tests)
- `src/domain/banking/__tests__/BankReconciliationGaps.test.ts` (2 Tests)
- `src/domain/accounting/__tests__/ClosingValidation.test.ts` (7 Tests)

### Dokus
- `docs/SPRINT-JAHRESABSCHLUSS-E1-ABSCHLUSS.md` (dieses Dokument)
- `docs/OPEN-QUESTIONS-JAHRESABSCHLUSS-E1-2026-04-21.md` (2 Fragen)

## 4. Bewusste Design-Entscheidungen

- **`rechtsform` default NULL für Bestand** — keine Backfill-Migration. Der zentrale Validator wirft bei NULL → blockiert Jahresabschluss. UI-Erfassung kommt in E2 via Wizard.
- **Rechtsform-Enum aus `domain/ebilanz/hgbTaxonomie68`** — **nicht neu definiert**. Wiederverwendung des XBRL-taxonomie-konformen Enums vermeidet Drift.
- **`Groessenklasse` vs. `SizeClass`-Harmonisierung** — verschoben auf E2. `HgbSizeClassifier` liefert `Hgb267Klasse = "kleinst" | "klein" | "mittel" | "gross"` (`hgbTaxonomie68`-konsistent); `BalanceSheetBuilder.SizeClass` bleibt für Build-Zeit-Rendering unverändert.
- **§ 267 HGB als Ein-Stichtag-Klassifikation** — Mehrperioden-Regel („zwei aufeinanderfolgende Stichtage") ist Wizard-/Rules-Engine-Scope (E2). Ein-Stichtag ist GoBD-konservativ: wenn bereits 2/3 Kriterien unter Schwelle, warnt der Validator zumindest korrekt.
- **Trial-Balance mit Cent-Toleranz (< 0.01)** — spiegelt das `FinancialStatements.crossCheck`-Pattern.
- **AfA-Completeness via `planAfaLauf`-Erwartung** — ein Anlage-Eintrag ist „vollständig gebucht", wenn `Σ afa_buchungen = plan.afa_betrag ± 1 Cent`. Abgeschriebene Anlagen (Restbuchwert=0, AfA=0) werden nicht als Lücke markiert.
- **Lohn-Completeness respektiert Beschäftigungs-Zeitraum** — MA eingetreten im April bedeutet keine Lücke in Q1. Austritt im September bedeutet keine Lücke in Q4.
- **Bank-Reconciliation-Gaps minimal-Return** — keine persistierte Reconciliation-State im Projekt, daher liefert die Funktion Empty. Validator-Seite ist „still" bis Persistenz ergänzt wird (Folge-Sprint).
- **Closing-Validator robust gegen Teil-Fehler** — jeder Check läuft in try/catch; Fehler in einem Teil-Check wird als eigenes `warning`-Finding aufgenommen, blockiert aber nicht den Rest.
- **EÜR↔GuV-Cross-Check im Validator aktuell NICHT gerufen** — wird erst in E2 rechtsform-abhängig aktiviert. `buildJahresabschluss` wird stattdessen direkt gerufen (Bilanz↔GuV).

## 5. Was E2 morgen nutzt

1. **`validateYearEnd()`** als erste Wizard-Step-Check (Pre-Closing-Gate).
2. **`Client`-Stammdaten-Felder** als Basis für das Wizard-Step-2-Formular (Unternehmensdaten-Abfrage).
3. **`classifyHgb267()` + `computeKriteriumFromJournal()`** als Wizard-Step-3 (automatische Größenklassen-Klassifikation mit Bestätigungs-Override).
4. **Rechtsform × Größenklasse** als Input für die Rules-Engine, die entscheidet, welche Formular-Abschnitte sichtbar sind (Anhang-Pflicht, Lagebericht-Pflicht).

## 6. Offen / verschoben

| Punkt | Begründung |
|---|---|
| **UI für Mandant-Stammdaten-Erfassung** | Kommt in E2 als Teil des Wizards. Datenbank ist jetzt vollständig. |
| **Mehrperioden-§-267-Regel** | Zwei aufeinanderfolgende Stichtage. E2-Scope (Rules-Engine). |
| **`Groessenklasse`/`SizeClass`-Harmonisierung** | Beide Enums koexistieren; E2 entscheidet die Konsolidierung. |
| **UKV-Verfahren (§ 275 Abs. 3)** | CLAUDE.md §10 P3. Für GmbH-Default (GKV) kein Blocker. |
| **Bank-Reconciliation-Persistenz** | Folge-Sprint. OPEN-QUESTIONS Frage #1. |
| **EÜR↔GuV-Cross-Check rechtsform-abhängig** | E2-Scope. OPEN-QUESTIONS Frage #2. |
| **Closing-Lifecycle-State (wer/wann abgeschlossen)** | Bestand: `periodClosedBefore` in Settings. Vollständiger Audit-State kommt später. |

## 6b. Nachtrag (2026-04-21): Bank-Recon-Warning aktiviert

Nach Rücksprache wurde ein dediziertes Warning-Finding in
`validateYearEnd` ergänzt, das transparent auf die fehlende
Automatisierung der Bank-Reconciliation hinweist (GoBD Rz. 45
Transparenz-Prinzip):

- **Code:** `CLOSING_BANK_RECON_NOT_AUTOMATED`
- **Severity:** `warning` (blockiert nicht)
- **Immer aktiv** — unabhängig vom Mandant-State.
- **Detail** verweist auf `/bank-reconciliation` + Tech-Debt-Ticket.

Tech-Debt-Ticket: `docs/TECH-DEBT-BANK-RECONCILIATION-PERSISTENZ.md`
(Priority: Medium, ~1 Sprint Aufwand).

Test-Count-Update: 1318 → **1319** (+1 neuer Test für das immer-aktive
Warning).

## 7. Verifikations-Gate

| Gate | Status | Dauer |
|---|---|---|
| `tsc --noEmit` (8192 MB) | clean, 0 errors | — |
| `vitest run` | **1318 / 1318 grün** (0 failed, 0 skipped) · 114 files | 69 s |
| Spot-Check 10 Dateien | alle grün, 68 Tests, 6.54 s | — |

## 8. Sprint-Signatur

| Feld | Wert |
|---|---|
| **Datum** | 2026-04-21 |
| **Pre-Sprint-Count** | 1269 |
| **End-Test-Count** | **1318** (0 failed, 0 skipped) |
| **Δ Sprint** | +49 Tests, +8 Files |
| **Neue Migration** | `0030_client_rechtsform_stammdaten.sql` |
| **Neue Schlüssel-APIs** | `validateYearEnd()` · `classifyHgb267()` · `computeTrialBalance()` · `detectAfaLuecken()` · `detectLohnLuecken()` · `detectBankReconciliationGaps()` |
| **Abschluss-Doku** | `docs/SPRINT-JAHRESABSCHLUSS-E1-ABSCHLUSS.md` |
| **Open Questions** | `docs/OPEN-QUESTIONS-JAHRESABSCHLUSS-E1-2026-04-21.md` (2 Fragen, beide niedrige Dringlichkeit) |
| **End-tsc-Status** | clean (Exit 0, 8192 MB) |
