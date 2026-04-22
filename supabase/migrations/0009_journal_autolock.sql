-- ============================================================================
-- harouda-app · Auto-Festschreibung gebuchter Journal-Einträge
--
-- Wenn eine Buchung mit status='gebucht' angelegt wird, ohne dass der Client
-- locked_at explizit gesetzt hat, tragen wir automatisch
-- locked_at = now() + 24 Stunden ein.
--
-- Die Dauer kann pro Company angepasst werden, indem die App das gewünschte
-- locked_at beim INSERT mitliefert (siehe Einstellung
-- "Auto-Festschreibung gebuchter Einträge (Stunden)"). Der Trigger überschreibt
-- nur, wenn der Client NULL schickt — anwendungsseitige Vorgabe bleibt damit
-- verbindlich.
-- ============================================================================

create or replace function public.journal_entries_autolock()
returns trigger as $$
begin
  if NEW.status = 'gebucht' and NEW.locked_at is null then
    NEW.locked_at := now() + interval '24 hours';
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_journal_autolock on public.journal_entries;
create trigger trg_journal_autolock
  before insert on public.journal_entries
  for each row execute function public.journal_entries_autolock();

-- Die bestehende Update-Sperre aus Migration 0006 wertet locked_at bereits aus:
--   raise exception '... seit %', OLD.locked_at;
-- Sie wird damit durch den Trigger aktiviert, sobald locked_at <= now() ist.

comment on function public.journal_entries_autolock is
  'GoBD: setzt locked_at = now() + 24h für gebuchte Einträge ohne explizites locked_at.';

-- ============================================================================
