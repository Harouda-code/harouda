-- 0056_protect_gebucht_beleg_deletion.sql
--
-- Schließt die DELETE-Defense-in-depth-Lücke für gebuchte Belege.
-- Ergänzt die bestehende BEFORE-UPDATE-Immutabilität aus 0022 um
-- BEFORE-DELETE-Schutz für:
--   - public.belege            mit status = 'GEBUCHT'
--   - public.beleg_positionen  mit Eltern-belege.status = 'GEBUCHT'
--
-- GoBD Rz. 64: Korrektur- bzw. Stornobuchungen müssen auf die
-- ursprüngliche Buchung rückbeziehbar sein. Ein gebuchter Beleg darf
-- nicht durch direkten DELETE entfernt werden; stattdessen ist der
-- reguläre Korrektur- bzw. Storno-Workflow zu verwenden.
--
-- STORNIERT-Belege sind in dieser Migration nicht eingeschlossen und
-- bleiben bewusst außerhalb des Scopes.
--
-- Diese Migration ändert keine Tabellenspalten, keine Constraints,
-- keine RLS-Policies und keine GRANT/REVOKE-Privilegien.

-- =====================================================================
-- Function: public.belege_protect_delete
-- =====================================================================
create or replace function public.belege_protect_delete()
returns trigger
language plpgsql
security invoker
as $$
begin
  if old.status = 'GEBUCHT' then
    raise exception
      'Gebuchte Belege dürfen nicht gelöscht werden (GoBD Rz. 64). '
      'Beleg-ID: %. Bitte den Korrektur- bzw. Storno-Workflow verwenden.',
      old.id;
  end if;

  return old;
end;
$$;

comment on function public.belege_protect_delete() is
  'BEFORE DELETE Schutzfunktion für public.belege. Aktuelle Wachbedingung: '
  'old.status = ''GEBUCHT'' löst RAISE EXCEPTION (SQLSTATE P0001) aus. '
  'Begründung: GoBD Rz. 64 verlangt Rückbeziehbarkeit von Korrektur- bzw. '
  'Stornobuchungen auf die ursprüngliche Buchung; ein direkter DELETE auf '
  'einen gebuchten Beleg würde diese Anforderung verletzen. Schützt '
  'gebuchte Belege vor destruktiven DELETE-Pfaden auf Tabellenebene, '
  'einschließlich Owner-, BYPASSRLS-, service_role- und FK-CASCADE-Pfaden. '
  'STORNIERT-Belege sind in dieser Migration nicht eingeschlossen.';

-- =====================================================================
-- Function: public.beleg_positionen_protect_delete
-- =====================================================================
create or replace function public.beleg_positionen_protect_delete()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_parent_status text;
begin
  select b.status
    into v_parent_status
    from public.belege b
   where b.id = old.beleg_id;

  if v_parent_status = 'GEBUCHT' then
    raise exception
      'Positionen eines gebuchten Belegs dürfen nicht gelöscht werden '
      '(GoBD Rz. 64). Beleg-ID: %. Bitte den Korrektur- bzw. Storno-Workflow '
      'verwenden.',
      old.beleg_id;
  end if;

  return old;
end;
$$;

comment on function public.beleg_positionen_protect_delete() is
  'BEFORE DELETE Schutzfunktion für public.beleg_positionen. Aktuelle '
  'Wachbedingung: parent public.belege.status = ''GEBUCHT'' löst RAISE '
  'EXCEPTION (SQLSTATE P0001) aus, ermittelt über old.beleg_id. '
  'Begründung: GoBD Rz. 64 verlangt Rückbeziehbarkeit von Korrektur- bzw. '
  'Stornobuchungen; das Löschen einzelner Positionen eines gebuchten '
  'Belegs würde diese Anforderung verletzen. Schützt Positionen gebuchter '
  'Belege vor destruktiven DELETE-Pfaden auf Tabellenebene, auch wenn der '
  'Eltern-Beleg selbst unangetastet bleibt. Bei fehlender Eltern-Zeile '
  'wird hier nicht eskaliert; FK NOT NULL und ON DELETE CASCADE des '
  'Schemas behandeln unmögliche Zustände. STORNIERT-Eltern sind in dieser '
  'Migration nicht eingeschlossen.';

-- =====================================================================
-- Triggers
-- =====================================================================
drop trigger if exists trg_belege_protect_delete on public.belege;
create trigger trg_belege_protect_delete
  before delete on public.belege
  for each row
  execute function public.belege_protect_delete();

drop trigger if exists trg_beleg_positionen_protect_delete on public.beleg_positionen;
create trigger trg_beleg_positionen_protect_delete
  before delete on public.beleg_positionen
  for each row
  execute function public.beleg_positionen_protect_delete();
