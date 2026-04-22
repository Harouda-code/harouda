-- ============================================================================
-- harouda-app · Multi-Tenancy Phase 2, Schritt 5 · lohnabrechnungen_archiv.batch_id
--
-- Verknüpft eine archivierte Lohnabrechnung mit dem Journal-Batch desselben
-- Lohn-Laufs (siehe Migration 0027 für journal_entries.batch_id und
-- src/api/journal.ts::createEntriesBatch). Damit lässt sich ein Lohn-Lauf
-- später als Ganzes referenzieren (Stapel-Storno, Audit-Querverweis).
--
-- Was diese Migration TUT:
--   • ADD COLUMN batch_id uuid NULL (nullable, keine Backfill-Pflicht,
--     Legacy-Archiv-Rows bleiben bei NULL).
--   • CREATE INDEX (partiell, WHERE NOT NULL) — kein Bloat für historische
--     Rows ohne Batch-Kontext.
--   • COMMENT auf die Spalte.
--
-- Was diese Migration NICHT tut:
--   • Kein NOT NULL.
--   • Kein FK auf journal_entries.batch_id — der ist keine PK, sondern
--     wiederholt sich N-mal pro Batch. Referentielle Integrität würde
--     `batch_id` in eine eigene Batches-Tabelle zwingen; verschoben.
--   • Kein RLS-Update (batch_id ist kein neuer Sicherheits-Vektor).
--   • Kein Backfill — der ist in Schritt 6 separat abzuwägen.
-- ============================================================================

alter table public.lohnabrechnungen_archiv
  add column if not exists batch_id uuid null;

comment on column public.lohnabrechnungen_archiv.batch_id is
  'Verknüpft Archiv-Row mit dem Journal-Batch desselben Lohn-Laufs. Ermöglicht Stapel-Storno und Audit-Querverweis. Siehe createEntriesBatch (src/api/journal.ts) und Migration 0027.';

create index if not exists lohnabrechnungen_archiv_batch_idx
  on public.lohnabrechnungen_archiv(batch_id)
  where batch_id is not null;
