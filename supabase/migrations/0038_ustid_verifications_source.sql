-- ============================================================================
-- harouda-app · Sprint 20.A.2 · verification_source fuer ustid_verifications
--
-- Fuegt die Spalte `verification_source` an Migration 0037 an. Sprint 19 hat
-- ausschliesslich VIES genutzt; ab Sprint 20 routed das Frontend deutsche
-- USt-IdNr-Pruefungen an BZSt (qualifizierte Bestaetigung nach § 18e UStG) —
-- beide Abfragequellen schreiben jetzt in dieselbe Tabelle, unterschieden
-- durch dieses Feld.
--
-- Rechtlich: BZSt hat in DE Vorrang (qualifizierte Bestaetigung mit Name +
-- Anschrift), VIES ist der EU-weite Fallback. Siehe
-- docs/TECH-DEBT-SPRINT-19-BZSt-VIES-HIERARCHY.md (wird mit diesem Sprint
-- geschlossen).
-- ============================================================================

alter table public.ustid_verifications
  add column if not exists verification_source text not null default 'VIES'
    check (verification_source in ('BZST', 'VIES'));

create index if not exists uv_by_source
  on public.ustid_verifications(
    client_id, verification_source, created_at desc
  );

comment on column public.ustid_verifications.verification_source is
  'Sprint 20.A: BZST (deutsche qualifizierte Bestaetigung, § 18e UStG) oder '
  'VIES (EU-Kommission, Standard). BZST hat rechtlichen Vorrang in DE, VIES '
  'ist Fallback fuer nicht-DE-Anfragen oder BZSt-Ausfall.';
