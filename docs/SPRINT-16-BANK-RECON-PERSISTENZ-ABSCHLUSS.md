# Sprint 16 — Bank-Reconciliation-Persistenz

**Abgeschlossen:** 2026-04-25 · Autonomer Langlauf · 7 Schritte.
**End-Stand:** **1542 Tests grün / 149 Test-Dateien** · tsc clean.
**Scope:** persistenter Bank-Journal-Match-Log (`bank_reconciliation_matches`),
konservativer Auto-Matcher, echter Bank-Gap-Check in `validateYearEnd`.
**Schliesst Tech-Debt-Ticket:** `docs/TECH-DEBT-BANK-RECONCILIATION-PERSISTENZ.md`
(offen seit Sprint E1 am 2026-04-21).

---

## 1. Ziel + Rechtsbasis

**Ziel:** Die GoBD-Rz.-45-Luecke schliessen, die bis dato dazu fuehrte,
dass `validateYearEnd()` nur einen Warn-Platzhalter ausgab. Nach Sprint 16
haben Mandanten-Bank-Transaktionen einen persistierten Matching-Status
(matched / auto_matched / ignored / pending_review), und der Closing-
Validator klassifiziert auf Basis des Anteils offener Zeilen.

**Rechtliche Basis:**
- **GoBD Rz. 45** — Vollstaendigkeit: jede Geschaeftsvorfall-Kontobewegung
  muss lueckenlos erfasst + einem Beleg zugeordnet sein.
- **§ 146 Abs. 1 AO** — Einzelaufzeichnungspflicht.
- **§ 239 Abs. 2 HGB** — Unveraenderbarkeit nach Festschreibung.
  Match-Records sind bewusst Meta-Daten, NICHT Teil der Festschreibung —
  sie bleiben editierbar mit `updated_at`-Trigger.

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Bestandsaufnahme** | Recon: BankReconciliationPage ist 1058-LOC + ephemer-State · keine bank_transactions-Tabelle · BankReconciliationGaps liefert `[]` · RLS-Muster ist `company_id`-basiert (nicht `owner_id` wie Spec) · Schema-Anpassung | 0 |
| 2 | **Migration 0031 + Types** | `supabase/migrations/0031_bank_reconciliation_matches.sql` mit `company_id` + `client_id` + Fingerprint-Unique + RLS-Policies analog 0004/0026 · `BankReconciliationMatch` + `BankReconMatchStatus` in `src/types/db.ts` | 0 |
| 3 | **Service-Layer + Fingerprint** | `src/domain/banking/bankTransactionFingerprint.ts` (SHA-256 ueber normierten kanonischen String) · `src/api/bankReconciliationMatches.ts` (Dual-Mode: localStorage + Supabase) mit `listMatches` / `upsertMatch` / `deleteMatch` / `getMatchByFingerprint` / `countMatchesByStatus` · `store.ts` um `K_BANK_RECON_MATCHES` erweitert | +6 + +7 |
| 4 | **BankAutoMatcher** | `src/domain/banking/BankAutoMatcher.ts` · konservatives Confidence-Scoring (Exact-Date+Amount=1.00, ±1 Tag=0.90, ±3 Tage=0.75, ±1 Cent=0.60) · reasoning-Array pro Regel · VWZ-Boost +0.10 (Cap 1.00) · pure function, kein Persistenz-Side-Effect | +10 |
| 5 | **BankReconciliationPage-Integration** | `src/components/banking/BankReconPersistenceBanner.tsx` minimal-invasiv in bestehende 1058-LOC-Page eingebaut · Stats-Header (Total/Matched/Ignoriert/Offen/Coverage) · "Offene als pending_review erfassen"-Bulk · "Auto-Match-Kandidaten berechnen" + Threshold-Accept (0.90) · keine stillen Writes | +6 |
| 6 | **Gaps + validateYearEnd** | `BankReconciliationGaps.ts` um `getBankReconStatusSummary()` erweitert · `BANK_RECON_PENDING_ERROR_THRESHOLD_PCT = 0.05` · `ClosingValidation.ts` klassifiziert: total=0 → `CLOSING_BANK_RECON_NOT_AUTOMATED` Warn · pending_pct ≤ 5% → `CLOSING_BANK_RECON_PENDING` Warn · pending_pct > 5% → `CLOSING_BANK_RECON_INSUFFICIENT` Error (blockt Abschluss) | +8 (inkl. 1 ClosingValidation-Update) |
| 7 | **Tech-Debt schließen + Abschluss** | `TECH-DEBT-BANK-RECONCILIATION-PERSISTENZ.md` Status → CLOSED · diese Doku | 0 |

**Σ Sprint:** +35 Tests · +5 Test-Files · 1507 → **1542 gruen**.

## 3. Neue Dateien

### Migration
- `supabase/migrations/0031_bank_reconciliation_matches.sql` — Tabelle
  mit 13 Spalten (inkl. Audit-Meta `matched_by_user_id` + `notiz`),
  Unique-Constraint `(client_id, bank_transaction_fingerprint)`,
  3 Indizes, 4 permissive Policies (select/insert/update/delete),
  1 RESTRICTIVE-Policy `bank_recon_matches_client_consistency`,
  `tg_set_updated_at`-Trigger.

### Domain-Layer
- `src/domain/banking/bankTransactionFingerprint.ts` —
  `canonicalizeBankTx()` + `bankTxFingerprint()` (async SHA-256 Hex
  via `sha256Hex` aus `src/lib/crypto/payrollHash.ts`).
- `src/domain/banking/BankAutoMatcher.ts` — `findMatchCandidates()`
  pure function mit `BankAutoMatchCandidate[]`-Output.
- `src/domain/banking/BankReconciliationGaps.ts` — um
  `getBankReconStatusSummary()` + `BANK_RECON_PENDING_ERROR_THRESHOLD_PCT`
  erweitert; historische `detectBankReconciliationGaps()`-Signatur
  bleibt (liefert weiterhin `[]`).

### Service-Layer + Types
- `src/api/bankReconciliationMatches.ts` — 5 oeffentliche Funktionen,
  Dual-Mode (DEMO + Supabase) mit `shouldUseSupabase()` / `requireCompanyId()`.
- `src/types/db.ts` — neu: `BankReconciliationMatch` + `BankReconMatchStatus`.
- `src/api/store.ts` — neuer localStorage-Key `harouda:bankReconMatches`
  + `getBankReconMatches()` / `setBankReconMatches()`.

### UI
- `src/components/banking/BankReconPersistenceBanner.tsx` —
  Stand-alone Component mit 5 Buttons (inkl. disabled-Gates bei leerer
  Eingabe) + 5 Stats-Spans.
- `src/pages/BankReconciliationPage.tsx` — ein Import + Banner-Mount
  zwischen Header und `taxcalc__hint`-Aside. Keine andere Aenderung.

### Validator
- `src/domain/accounting/ClosingValidation.ts` — Sektion 7b neu
  formuliert: 3 Pfade (NOT_AUTOMATED Warn / PENDING Warn / INSUFFICIENT
  Error) basierend auf `getBankReconStatusSummary()`.

### Tests (neu, 5 Files)
- `src/domain/banking/__tests__/bankTransactionFingerprint.test.ts` (+6) —
  Determinismus, Betrag-/VWZ-/IBAN-Normierung, Feld-Diff,
  canonical-Format.
- `src/api/__tests__/bankReconciliationMatches.test.ts` (+7) —
  list / upsert (create+update) / deleteMatch / getMatchByFingerprint /
  countMatchesByStatus / Mandant-Isolation.
- `src/domain/banking/__tests__/BankAutoMatcher.test.ts` (+10) —
  Exact/±1d/±3d/±1ct-Matching + VWZ-Boost + Cap bei 1.00 + Sortierung
  nach confidence + leere Matches.
- `src/domain/banking/__tests__/BankReconciliationGaps.test.ts` (+8) —
  null-clientId / leer / 100% matched / 3% pending / 20% pending /
  ignored-Zaehlung / Threshold-Konstante / Legacy-Stub.
- `src/components/banking/__tests__/BankReconPersistenceBanner.test.tsx` (+6) —
  null-Mandant / leere Stats / echte Stats / Mark-Pending-Bulk /
  Auto-Match-Flow mit Accept-Button / Button-Gate-Zustaende.

### Tests (modifiziert, 1 File)
- `src/domain/accounting/__tests__/ClosingValidation.test.ts` — eine
  Message-Assertion an die neue Formulierung angepasst (GoBD Rz. 45
  explizit statt "GoBD-konforme Vollstaendigkeit").

## 4. Architektur-Entscheidungen

1. **Fingerprint-Ansatz statt FK auf `bank_transactions`.** Die Tabelle
   existiert nicht; die BankReconciliationPage arbeitet rein ephemer
   mit parseBankFile-Output. Ein SHA-256-Hash ueber (datum, betrag,
   vwz, iban_gegenkonto) ist deterministisch + stable genug, um
   denselben Bank-Record ueber mehrere Sessions wiederzuerkennen.
2. **`company_id`-basiertes RLS statt Spec-vorgeschlagenem `owner_id`.**
   Das Projekt nutzt seit Migration 0004 ein `is_company_member` /
   `can_write`-Pattern. Das Spec-Beispiel war ein Phase-0-Muster.
   `client_id`-Konsistenz wird via RESTRICTIVE-Policy (Pattern aus 0026)
   zusaetzlich abgesichert.
3. **Dual-Mode Service analog anderen API-Modulen.** `shouldUseSupabase()` +
   `requireCompanyId()`. DEMO nutzt `store.getBankReconMatches`, damit
   Tests und lokaler Dev-Server ohne Supabase laufen.
4. **Konservativer Auto-Matcher, kein stilles Booking.** Der Matcher
   liefert nur Candidates mit reasoning-Array. Der User bestaetigt
   pro Row oder via Threshold-Accept; `upsertMatch` bekommt dann
   `match_status: "auto_matched"` — semantisch anders als "matched".
   Ein "matched"-Record setzt immer der menschliche User.
5. **`auto_matched` als eigener Status.** Wenn spaeter ein Auto-
   Matched-Record korrigiert wird, bleibt in der Audit-Log-Sequenz
   nachvollziehbar, dass die urspruengliche Zuordnung von der
   Maschine kam. Das ist GoBD-konformer als "matched" zu ueber-
   schreiben.
6. **5% Threshold als GoBD-Default.** Ab mehr als 5% pending-Anteil
   blockiert `validateYearEnd()`. Das ist konservativ — fuer
   spezifische Situationen Ruecksprache mit Steuerberater (in-Code
   dokumentiert).
7. **Minimal-invasive Page-Integration.** Die 1058-LOC-Page wurde
   NICHT refactored — ein Banner-Component oben + ein Mount-Aufruf.
   So bleibt das Risiko kontrolliert und die bestehenden
   Sitzungs-Matching-Flows (posted / skipped / requested) funktionieren
   weiter.
8. **Fingerprint-Collisions werfen statt zu ueberschreiben.** Die
   DB-Unique-Constraint `(client_id, bank_transaction_fingerprint)`
   stellt sicher, dass zwei identische Bank-Transaktionen desselben
   Mandanten nicht zwei Match-Records bekommen. `upsertMatch` updatet
   den existierenden — kein stilles "Gewinner-ueberschreibt-Verlierer".
9. **notiz-Feld als reasoning-Serialization.** Auto-Matcher-Reasoning
   wird als String-Join in `notiz` gespeichert. Spaetere Ermittler
   sehen genau, warum der Algorithmus vorschlug.

## 5. Grenzen + bewusst verschoben

1. **Keine CAMT.053/MT940-Parser-Anpassung.** Parser-Output wird
   unveraendert uebernommen.
2. **Keine Auto-Erstellung von Journal-Entries aus Bank-Tx.** Stilles
   Booking ist nicht GoBD-konform.
3. **Kein Schema-Upgrade an `journal_entries`.** Die
   `journal_entries.bank_ref`-Idee waere eine zukuenftige Schema-
   Erweiterung.
4. **Kein PSD2/FinTS-Zugriff.** Bleibt manueller MT940/CAMT-Upload.
5. **Keine Festschreibung der Match-Records.** Match-Records sind
   Meta-Daten, editierbar mit `updated_at`. GoBD Rz. 64 gilt fuer
   Buchungen, nicht fuer Abstimmungs-Log.
6. **Pro-Konto-Gap-Aufbruch verschoben.** `detectBankReconciliationGaps()`
   liefert weiter `[]`; eine pro-Konto-Granularitaet ist erst sinnvoll,
   wenn `bank_transactions` als eigene Tabelle persistiert wird.
7. **Keine Multi-Konto-UI-Refactors.** Banner arbeitet mit der
   aktuellen Session-Zeilen-Liste — wie die Seite ohnehin schon.
8. **Migration-Backfill ist leer.** Bestehende Bank-Transaktionen aus
   abgeschlossenen Geschaeftsjahren werden NICHT rueckwirkend als
   Match-Records angelegt. Der Closing-Validator rechnet entsprechend
   den NOT_AUTOMATED-Fallback, solange keine Records existieren.

## 6. Final-Gate-Ergebnisse

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **clean**.
- `npx vitest run` → **1542 / 1542 gruen** (149 Test-Dateien).
- Sprint-16-Tests isoliert: `npx vitest run
  src/domain/banking/__tests__
  src/api/__tests__/bankReconciliationMatches.test.ts
  src/components/banking/__tests__
  src/domain/accounting/__tests__/ClosingValidation.test.ts` →
  **37 / 37 gruen** (inkl. 8 ClosingValidation-Regression).
- Stderr-Output der happy-dom-Script-Injection aus
  `CookieConsentContext` bleibt Begleitrauschen ohne Failure.

## 7. Tech-Debt-Status

- `docs/TECH-DEBT-BANK-RECONCILIATION-PERSISTENZ.md` — **CLOSED**
  mit Changelog-Eintrag 2026-04-25 + Deliverable-Liste.

## 8. Keine neuen Open-Questions

Der Sprint lief ohne neue Unklarheiten. Die Abweichung vom Spec-
Pattern (`company_id`-RLS statt `owner_id`) ist in §4 Entscheidung #2
transparent festgehalten und entspricht dem etablierten Projekt-Muster.

## 9. Cross-Referenzen

- `supabase/migrations/0026_multitenant_client_id.sql` — Pattern fuer
  RESTRICTIVE-Policy `client_belongs_to_company`.
- `supabase/migrations/0004_multitenant.sql` — `is_company_member` /
  `can_write` / `tg_set_updated_at`.
- `src/lib/crypto/payrollHash.ts` — wiederverwendeter `sha256Hex`.
- `src/domain/accounting/ClosingValidation.ts` — neue Finding-Codes
  `CLOSING_BANK_RECON_PENDING` + `CLOSING_BANK_RECON_INSUFFICIENT`.
- `CLAUDE.md` §10 — GoBD-Compliance-Status (Rz. 45 geschlossen).
