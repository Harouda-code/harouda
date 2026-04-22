-- ============================================================================
-- harouda-app · Multi-Tenancy Phase 2, Schritt 3 · journal_entries.batch_id
--
-- Ergänzt eine nullable `batch_id`-Spalte auf `journal_entries`, damit
-- atomare Buchungsstapel (Lohn-Läufe, Import-Batches) als Gruppe erkennbar
-- bleiben. Ohne Backfill: Legacy-Einzel-Buchungen bleiben bei NULL — das
-- IST die Semantik.
--
-- Was diese Migration TUT:
--   • ADD COLUMN batch_id uuid NULL (keine FK — Batches sind keine
--     eigene Entität, die UUID ist nur Gruppierungs-Label).
--   • CREATE INDEX auf (batch_id) WHERE NOT NULL — damit
--     „alle Entries eines Batches finden" schnell bleibt, ohne Index-
--     Bloat für Einzel-Buchungen.
--   • COMMENT mit Verweis auf `createEntriesBatch`.
--
-- Was diese Migration NICHT tut:
--   • Kein NOT NULL (Einzel-Buchungen via `createEntry` dürfen weiter
--     NULL haben).
--   • Kein RLS-Update — `batch_id` ist kein neuer Sicherheits-Vektor,
--     der Scope folgt `company_id` / `client_id` der Zeile selbst.
--   • Kein Backfill.
--   • Kein Unique-Constraint (eine batch_id gruppiert N Einträge,
--     ist also bewusst nicht unique).
-- ============================================================================

alter table public.journal_entries
  add column if not exists batch_id uuid null;

comment on column public.journal_entries.batch_id is
  'Gruppiert atomar gebuchte Stapel (z. B. Lohn-Läufe, Import-Batches). Null für Einzel-Buchungen aus createEntry. Wird von createEntriesBatch (src/api/journal.ts) gesetzt.';

create index if not exists journal_entries_batch_idx
  on public.journal_entries(batch_id)
  where batch_id is not null;
