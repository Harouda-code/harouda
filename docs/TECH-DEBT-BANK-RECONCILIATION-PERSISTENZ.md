# Tech-Debt · Bank-Reconciliation-Persistenz

**Erfasst:** 2026-04-21 · Jahresabschluss-E1-Nachtrag.
**Geschlossen:** 2026-04-25 · Sprint 16.
**Status:** **CLOSED** · **Priority:** war Medium.

## Changelog

- **2026-04-25 · Sprint 16 schliesst das Ticket.**
  - Migration `0031_bank_reconciliation_matches.sql` legt die Tabelle
    an (company_id + client_id + Fingerprint-Unique-Key + RLS).
  - `src/api/bankReconciliationMatches.ts` Dual-Mode-Service.
  - `src/domain/banking/bankTransactionFingerprint.ts` deterministischer
    SHA-256-Hash als natuerlicher Upsert-Schluessel.
  - `src/domain/banking/BankAutoMatcher.ts` konservatives Candidate-
    Scoring mit reasoning-Array (kein stilles Auto-Booking).
  - `src/domain/banking/BankReconciliationGaps.ts` liefert jetzt
    echte `getBankReconStatusSummary()`-Zahlen; `validateYearEnd()`
    klassifiziert pro pending-Anteil (< 5% Warn, > 5% Error).
  - `src/components/banking/BankReconPersistenceBanner.tsx` in
    `BankReconciliationPage` eingebaut — Stats-Header, Mark-Pending-
    Bulk, Auto-Match-Vorschlaege mit Threshold-Accept.
  - Siehe `docs/SPRINT-16-BANK-RECON-PERSISTENZ-ABSCHLUSS.md`.
- **2026-04-21 · Eroeffnung.** Lücke identifiziert im Zuge von
  Jahresabschluss-E1, weil `validateYearEnd()` nur ein statisches
  Warn-Finding ausgeben konnte.

---

## Urspruengliche Beschreibung (historisch, zum Nachlesen)

## GoBD-Relevanz

**GoBD Rz. 45 (Vollständigkeit)** — Belegprinzip verlangt, dass jede
Kontobewegung einem Beleg zugeordnet ist. Ohne persistierten Abgleich
zwischen Bankauszug und Journal ist die Vollständigkeit nur manuell
nachprüfbar.

## Beschreibung

`src/pages/BankReconciliationPage.tsx` (1058 LOC) lädt Kontoauszüge per
Upload (MT940/CAMT.053/CSV), macht lokales Matching gegen offene Posten
— **aber persistiert weder Kontoauszugszeilen noch den Match-Status**.
Jeder Seitenwechsel oder Refresh verliert den Abgleichsstand.

Der neue `ClosingValidator` kann deshalb keinen echten Gap-Check
ausführen und gibt stattdessen ein dediziertes Warning-Finding aus
(Code `CLOSING_BANK_RECON_NOT_AUTOMATED`), das den Nutzer auf die
manuelle Pflicht hinweist.

## Vorschlag

Neue Supabase-Tabelle `bank_reconciliation_matches`:

```sql
create table public.bank_reconciliation_matches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  client_id uuid null references public.clients(id),
  konto_nr text not null,
  statement_line_ref text not null,
  journal_entry_id uuid null references public.journal_entries(id),
  gematcht_am timestamptz not null default now(),
  gematcht_von uuid null references auth.users(id)
);

create index bank_recon_matches_client_idx
  on public.bank_reconciliation_matches(company_id, client_id, konto_nr);
```

RLS-Policies analog `journal_entries`. UI-Erweiterung in
`BankReconciliationPage`: Match-Commit schreibt Row, Re-Load liest
Matches aus Tabelle. `detectBankReconciliationGaps` vergleicht dann
Statement-Zeilen vs. Matches.

## Aufwand-Schätzung

~1 Sprint (4-5 Stunden): Migration + RLS + Repo + Page-Wiring +
Validator-Anbindung + Tests.
