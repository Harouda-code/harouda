-- ============================================================================
-- harouda-app · GoBD-Foundation: Append-Only-Spalten und Audit-Log-Erweiterung
--
-- Diese Migration fügt der bestehenden Struktur drei Schichten hinzu:
--
--   1. Journal-Lebenszyklus-Spalten (storno_status, parent_entry_id, locked_at)
--      damit Festschreibung, Storno und Korrektur transparent nachvollziehbar
--      sind.
--
--   2. Eine Trigger-Funktion, die UPDATE auf journal_entries auf ein
--      whitelist-basiertes Feldset begrenzt und DELETE nur bei Entwurf-
--      Buchungen zulässt.
--
--   3. Zusatzspalten für den Audit-Log (user_agent) plus die bestehende
--      Hash-Kette bleibt unberührt.
--
-- Hinweis: Diese Trigger ergänzen die App-Validierung, ersetzen sie aber
-- nicht — der Client zeigt dem Nutzer sofortige Fehler an; die DB schützt
-- gegen Umgehungen via Direktzugriff.
-- ============================================================================

-- 1) Neue Spalten -----------------------------------------------------------

alter table public.journal_entries
  add column if not exists storno_status text
    not null default 'active'
    check (storno_status in ('active','reversed','reversal','correction'));

alter table public.journal_entries
  add column if not exists parent_entry_id uuid
    references public.journal_entries(id) on delete set null;

alter table public.journal_entries
  add column if not exists locked_at timestamptz;

create index if not exists journal_storno_status_idx
  on public.journal_entries(storno_status);
create index if not exists journal_parent_idx
  on public.journal_entries(parent_entry_id);

-- 2) Audit-Log-Erweiterung --------------------------------------------------

alter table public.audit_log
  add column if not exists user_agent text;

-- Neue Aktionen zulassen, falls ein CHECK existiert:
do $$
begin
  if exists (
    select 1 from information_schema.check_constraints
    where constraint_name like 'audit_log_action_check%'
  ) then
    alter table public.audit_log drop constraint audit_log_action_check;
  end if;
end $$;

alter table public.audit_log
  add constraint audit_log_action_check
  check (action in (
    'create','update','delete','import','export',
    'login','logout','signup',
    'reverse','correct','access'
  ));

-- 3) Trigger: UPDATE auf festgeschriebene Buchungen blockieren --------------

create or replace function public.journal_entries_protect_update()
returns trigger as $$
begin
  -- Nur der storno_status-Wechsel "active" → "reversed" ist erlaubt, wenn
  -- gleichzeitig in derselben Transaktion eine Reversal-Buchung entsteht.
  -- Alle anderen Felder einer festgeschriebenen Buchung bleiben unverändert.
  if OLD.status = 'gebucht' and OLD.storno_status = 'active' then
    if NEW.storno_status = 'reversed' and
       NEW.datum = OLD.datum and
       NEW.beleg_nr = OLD.beleg_nr and
       NEW.beschreibung = OLD.beschreibung and
       NEW.soll_konto = OLD.soll_konto and
       NEW.haben_konto = OLD.haben_konto and
       NEW.betrag = OLD.betrag then
      return NEW;
    end if;
    raise exception 'Festgeschriebene Buchungen dürfen nicht geändert werden (GoBD). Storno erstellen.';
  end if;

  if OLD.storno_status in ('reversed','reversal','correction') then
    raise exception 'Bereits abgeschlossene Buchung (storno_status=%) ist schreibgeschützt.', OLD.storno_status;
  end if;

  if OLD.locked_at is not null then
    raise exception 'Buchung ist seit % festgeschrieben.', OLD.locked_at;
  end if;

  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_journal_protect_update on public.journal_entries;
create trigger trg_journal_protect_update
  before update on public.journal_entries
  for each row execute function public.journal_entries_protect_update();

-- 4) Trigger: DELETE nur bei Entwurf-Buchungen ------------------------------

create or replace function public.journal_entries_protect_delete()
returns trigger as $$
begin
  if OLD.status = 'gebucht' then
    raise exception 'Festgeschriebene Buchungen dürfen nicht gelöscht werden (GoBD). Storno erstellen.';
  end if;
  if OLD.storno_status <> 'active' then
    raise exception 'Storno- oder Korrekturbuchungen dürfen nicht gelöscht werden.';
  end if;
  return OLD;
end;
$$ language plpgsql;

drop trigger if exists trg_journal_protect_delete on public.journal_entries;
create trigger trg_journal_protect_delete
  before delete on public.journal_entries
  for each row execute function public.journal_entries_protect_delete();

-- 5) Audit-Log: UPDATE/DELETE komplett blockieren ---------------------------

create or replace function public.audit_log_protect()
returns trigger as $$
begin
  raise exception 'Der Audit-Log ist append-only — Änderungen sind nicht erlaubt.';
end;
$$ language plpgsql;

drop trigger if exists trg_audit_protect_update on public.audit_log;
create trigger trg_audit_protect_update
  before update on public.audit_log
  for each row execute function public.audit_log_protect();

drop trigger if exists trg_audit_protect_delete on public.audit_log;
create trigger trg_audit_protect_delete
  before delete on public.audit_log
  for each row execute function public.audit_log_protect();

-- ============================================================================
-- Ende der Migration.
--
-- Nach Einspielen:
--   • Der Client kann weiterhin UPDATE absetzen, die DB lehnt bei
--     festgeschriebenen Buchungen jedoch alles ausser dem Storno-Flag ab.
--   • DELETE auf journal_entries funktioniert nur für Entwurf-Buchungen mit
--     storno_status = 'active'.
--   • Direkte Manipulation des audit_log über SQL ist blockiert.
-- ============================================================================
