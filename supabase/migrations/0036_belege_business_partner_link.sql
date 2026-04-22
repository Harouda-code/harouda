-- ============================================================================
-- harouda-app · Sprint 19.A · belege ↔ business_partners (Expand-Phase)
--
-- Fuegt NULLABLE FK-Spalten an `public.belege` an, damit Ausgangs- und
-- Eingangsrechnungen optional auf einen Stammdaten-Partner + die zum
-- Buchungszeitpunkt gueltige Version verweisen koennen.
--
-- Greenfield-Strategie (Architektur-Entscheidung Sprint 19):
--   • KEIN Backfill der partner_*-Denormalisierung. Legacy-Belege
--     behalten NULL in beiden neuen Spalten und weiterhin ihren
--     partner_*-Textsnapshot aus Migration 0022.
--   • Neue Belege mit ausgewaehltem Stammdaten-Partner befuellen beide
--     FKs PLUS partner_*-Snapshot (fuer GoBD-Rz.-64-Unveraenderlichkeit —
--     ein spaeteres Update der Stammdaten darf die historische Buchung
--     nicht mutieren).
--
-- Contract-Phase (NOT-NULL) ist explizit KEIN Sprint-19-Scope.
-- ============================================================================

alter table public.belege
  add column if not exists business_partner_id uuid null
    references public.business_partners(id) on delete set null,
  add column if not exists business_partner_version_id uuid null
    references public.business_partners_versions(version_id) on delete set null;

create index if not exists belege_by_partner
  on public.belege(business_partner_id)
  where business_partner_id is not null;

comment on column public.belege.business_partner_id is
  'Sprint 19: Expand-Phase. Nullable. Legacy-Belege behalten NULL + partner_*-Denormalisierung.';

comment on column public.belege.business_partner_version_id is
  'Sprint 19: GoBD Rz. 64 — verweist auf Stammdaten-Snapshot zum Buchungszeitpunkt.';
