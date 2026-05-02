-- ============================================================================
-- harouda-app · Revert · RLS-Leck-Hotfix auf belege & beleg_positionen
--
-- Bezug: 0048_fix_rls_belege_leak.sql
--
-- !!! WARNUNG — KRITISCH !!!
-- ---------------------------
-- Diese Migration setzt die RLS-Policies auf den Stand von 0022 zurueck.
-- Das bedeutet: WIEDERHERSTELLUNG der Sicherheitsluecke.
--
-- Konsequenzen einer Ausfuehrung:
--   • Jeder authentifizierte Nutzer kann ALLE Belege ALLER Mandanten lesen.
--   • Verstoss gegen DSGVO Art. 32 (Sicherheit der Verarbeitung).
--   • Verstoss gegen § 203 StGB (Berufsgeheimnis Steuerberater).
--   • Verstoss gegen GoBD Rz. 100 (Datensicherheit).
--
-- Diese Datei existiert ausschliesslich zu Dokumentations- und
-- Audit-Zwecken — sie zwingt zum Durchdenken des Rollback-Pfades und liefert
-- bei akuten Produktionsproblemen mit 0048 einen klar dokumentierten,
-- nachvollziehbaren Notfall-Rollback.
--
-- !!! NIEMALS OHNE EXPLIZITE FREIGABE EINES STEUERBERATERS / FACHANWALTS
-- !!! UND DOKUMENTIERTEN KOMPENSIERENDEN MASSNAHMEN AUSFUEHREN.
--
-- Vor jeder Ausfuehrung:
--   1. Alle aktiven Sessions identifizieren (audit_log).
--   2. Mandanten ueber Sicherheitsvorfall informieren (DSGVO Art. 33).
--   3. Datenschutzbeauftragten konsultieren.
--   4. Schriftliche Freigabe von Geschaeftsfuehrung + StB einholen.
--
-- Bezug: HANDOFF Charge 9, Schuld 9-هـ
-- ============================================================================

-- ------------------------------ belege --------------------------------------

drop policy if exists belege_select on public.belege;
create policy belege_select on public.belege
  for select using (true);

drop policy if exists belege_insert on public.belege;
create policy belege_insert on public.belege
  for insert with check (true);

drop policy if exists belege_update on public.belege;
create policy belege_update on public.belege
  for update using (true);

-- belege_delete: GoBD-Schutz (status='ENTWURF') bleibt wie in 0022.
drop policy if exists belege_delete on public.belege;
create policy belege_delete on public.belege
  for delete using (status = 'ENTWURF');

-- ------------------------------ beleg_positionen ----------------------------
-- Wiederherstellung der konsolidierten "for all"-Policy aus 0022.

drop policy if exists beleg_pos_select on public.beleg_positionen;
drop policy if exists beleg_pos_insert on public.beleg_positionen;
drop policy if exists beleg_pos_update on public.beleg_positionen;
drop policy if exists beleg_pos_delete on public.beleg_positionen;

create policy beleg_pos_select on public.beleg_positionen
  for select using (true);

create policy beleg_pos_mutate on public.beleg_positionen
  for all using (true) with check (true);
