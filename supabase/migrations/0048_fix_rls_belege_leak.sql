-- ============================================================================
-- harouda-app · Sicherheits-Hotfix · RLS-Leck auf belege & beleg_positionen
--
-- Bezug: HANDOFF Charge 9, Schuld 9-هـ
-- Vorgaenger: 0022_belege_persistence.sql (using (true) — kritischer Defekt)
-- Konsumenten-Audit: PR 3 (chore/documents-consumer-audit) — kein Blast Radius
--   auf Documents-API.
--
-- Problem
-- -------
-- 0022 hat sechs RLS-Policies mit "using (true)" / "with check (true)" angelegt:
--
--   • belege_select        : using (true)         ← Mandanten-Leck
--   • belege_insert        : with check (true)    ← Mandanten-Leck
--   • belege_update        : using (true)         ← Mandanten-Leck
--   • belege_delete        : using (status = 'ENTWURF') ← schützt GoBD Rz. 64,
--                            aber kein Mandanten-Schutz
--   • beleg_pos_select     : using (true)         ← Mandanten-Leck
--   • beleg_pos_mutate     : for all using (true) with check (true) ← Leck
--
-- Konsequenz: Jeder authentifizierte Nutzer konnte ALLE Belege ALLER Mandanten
-- lesen, anlegen, aktualisieren und (sofern noch ENTWURF) loeschen. Verstoss
-- gegen DSGVO Art. 32 (Sicherheit der Verarbeitung) und § 203 StGB
-- (Berufsgeheimnis Steuerberater).
--
-- Loesung
-- -------
-- Anpassung an das in 0004_multitenant.sql etablierte Muster:
--   • is_company_member(company_id) für SELECT
--   • can_write(company_id)         für INSERT/UPDATE/DELETE
--
-- Fuer beleg_positionen: Filterung ueber den FK auf belege.beleg_id, da
-- beleg_positionen keine eigene company_id hat (Designentscheidung aus 0022).
--
-- belege_delete kombiniert Mandanten-Schutz und GoBD-Schutz (status='ENTWURF').
--
-- GoBD-Hinweis
-- ------------
-- Der Immutability-Trigger `belege_immutability` auf belege bleibt unveraendert.
-- GoBD Rz. 64 (Unveraenderbarkeit gebuchter Belege) wird weiterhin durchgesetzt.
--
-- Rollback
-- --------
-- Siehe 0049_revert_rls_belege_leak.sql.
-- ============================================================================

-- ------------------------------ belege --------------------------------------

drop policy if exists belege_select on public.belege;
create policy belege_select on public.belege
  for select using (public.is_company_member(company_id));

drop policy if exists belege_insert on public.belege;
create policy belege_insert on public.belege
  for insert with check (public.can_write(company_id));

drop policy if exists belege_update on public.belege;
create policy belege_update on public.belege
  for update using (public.can_write(company_id))
  with check (public.can_write(company_id));

-- belege_delete: doppelter Schutz — Mandant + GoBD-Status.
drop policy if exists belege_delete on public.belege;
create policy belege_delete on public.belege
  for delete using (
    public.can_write(company_id)
    and status = 'ENTWURF'
  );

-- ------------------------------ beleg_positionen ----------------------------
-- beleg_positionen besitzt keine eigene company_id. Filterung erfolgt ueber
-- den FK auf belege. Vier separate Policies (select, insert, update, delete),
-- damit Lese-Rechte (Member) von Schreib-Rechten (Writer) sauber getrennt sind.

drop policy if exists beleg_pos_select on public.beleg_positionen;
create policy beleg_pos_select on public.beleg_positionen
  for select using (
    exists (
      select 1 from public.belege b
      where b.id = beleg_positionen.beleg_id
        and public.is_company_member(b.company_id)
    )
  );

-- mutate-Policy aus 0022 wird durch drei spezifische Policies ersetzt.
drop policy if exists beleg_pos_mutate on public.beleg_positionen;

create policy beleg_pos_insert on public.beleg_positionen
  for insert with check (
    exists (
      select 1 from public.belege b
      where b.id = beleg_positionen.beleg_id
        and public.can_write(b.company_id)
    )
  );

create policy beleg_pos_update on public.beleg_positionen
  for update using (
    exists (
      select 1 from public.belege b
      where b.id = beleg_positionen.beleg_id
        and public.can_write(b.company_id)
    )
  )
  with check (
    exists (
      select 1 from public.belege b
      where b.id = beleg_positionen.beleg_id
        and public.can_write(b.company_id)
    )
  );

create policy beleg_pos_delete on public.beleg_positionen
  for delete using (
    exists (
      select 1 from public.belege b
      where b.id = beleg_positionen.beleg_id
        and public.can_write(b.company_id)
        and b.status = 'ENTWURF'
    )
  );
