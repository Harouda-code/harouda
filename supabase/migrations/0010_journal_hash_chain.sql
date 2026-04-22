-- ============================================================================
-- harouda-app · Hash-Kette auf journal_entries
--
-- Jede Buchung erhält:
--   prev_hash   — Hash der vorherigen Buchung dieser company_id
--                 (GENESIS = 64 × '0' für die erste Zeile)
--   entry_hash  — SHA-256 über ein fixes Pipe-Format
--
-- Das Pipe-Format MUSS exakt mit utils/journalChain.ts übereinstimmen, damit
-- Client und Server dieselben Hashes erzeugen und Verifikation aus dem
-- Browser möglich bleibt.
--
-- Reihenfolge im Canonical-String:
--   prev_hash | datum | beleg_nr | soll_konto | haben_konto | betrag(2-Dez) |
--   beschreibung | parent_entry_id (leer wenn NULL)
--
-- storno_status ist bewusst NICHT enthalten, weil diese Spalte legitimerweise
-- transitioniert (active → reversed). Der Audit-Log erfasst diesen Übergang.
-- ============================================================================

-- 1) Spalten --------------------------------------------------------------

alter table public.journal_entries
  add column if not exists prev_hash text,
  add column if not exists entry_hash text;

-- 2) pgcrypto für SHA-256 sicherstellen ----------------------------------

create extension if not exists pgcrypto;

-- 3) Hash-Funktion --------------------------------------------------------

create or replace function public.journal_entries_compute_hash(
  p_prev_hash text,
  p_datum date,
  p_beleg_nr text,
  p_soll_konto text,
  p_haben_konto text,
  p_betrag numeric,
  p_beschreibung text,
  p_parent_entry_id uuid
) returns text as $$
declare
  canonical text;
begin
  canonical :=
    coalesce(p_prev_hash, '') || '|' ||
    to_char(p_datum, 'YYYY-MM-DD') || '|' ||
    coalesce(p_beleg_nr, '') || '|' ||
    coalesce(p_soll_konto, '') || '|' ||
    coalesce(p_haben_konto, '') || '|' ||
    to_char(p_betrag, 'FM999999999990.00') || '|' ||
    coalesce(p_beschreibung, '') || '|' ||
    coalesce(p_parent_entry_id::text, '');
  return encode(digest(canonical, 'sha256'), 'hex');
end;
$$ language plpgsql immutable;

-- 4) Trigger: prev_hash + entry_hash beim INSERT setzen ------------------

create or replace function public.journal_entries_set_hashes()
returns trigger as $$
declare
  last_hash text;
begin
  -- Nur setzen, wenn der Client keinen Hash mitgeliefert hat.
  -- (Die App berechnet Hashes clientseitig; bei direktem SQL-Insert springt
  -- dieser Trigger ein.)
  if NEW.prev_hash is null then
    select entry_hash into last_hash
      from public.journal_entries
      where company_id = NEW.company_id
      order by created_at desc
      limit 1;
    NEW.prev_hash := coalesce(last_hash,
      '0000000000000000000000000000000000000000000000000000000000000000');
  end if;

  if NEW.entry_hash is null then
    NEW.entry_hash := public.journal_entries_compute_hash(
      NEW.prev_hash,
      NEW.datum,
      NEW.beleg_nr,
      NEW.soll_konto,
      NEW.haben_konto,
      NEW.betrag,
      NEW.beschreibung,
      NEW.parent_entry_id
    );
  end if;

  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_journal_set_hashes on public.journal_entries;
create trigger trg_journal_set_hashes
  before insert on public.journal_entries
  for each row execute function public.journal_entries_set_hashes();

-- 5) Index für Verifikation ----------------------------------------------

create index if not exists journal_company_created_idx
  on public.journal_entries(company_id, created_at);

-- 6) RPC: verify_journal_chain ------------------------------------------

create or replace function public.verify_journal_chain(p_company_id uuid)
returns table (
  ok boolean,
  total bigint,
  first_break_index bigint,
  first_break_entry_id uuid,
  message text
) as $$
declare
  r public.journal_entries%rowtype;
  expected_prev text := '0000000000000000000000000000000000000000000000000000000000000000';
  recomputed text;
  idx bigint := 0;
begin
  for r in
    select * from public.journal_entries
    where company_id = p_company_id
    order by created_at, id
  loop
    idx := idx + 1;
    if r.prev_hash is distinct from expected_prev then
      return query select false, idx, idx - 1, r.id,
        'Kette gebrochen bei Eintrag #' || idx || ' (' || r.beleg_nr || '): prev_hash stimmt nicht.';
      return;
    end if;
    recomputed := public.journal_entries_compute_hash(
      r.prev_hash, r.datum, r.beleg_nr, r.soll_konto, r.haben_konto,
      r.betrag, r.beschreibung, r.parent_entry_id
    );
    if recomputed <> r.entry_hash then
      return query select false, idx, idx - 1, r.id,
        'Hash bei Eintrag #' || idx || ' (' || r.beleg_nr || ') stimmt nicht.';
      return;
    end if;
    expected_prev := r.entry_hash;
  end loop;
  return query select true, idx, null::bigint, null::uuid,
    'Alle ' || idx || ' Einträge verifiziert.';
end;
$$ language plpgsql security definer;

comment on function public.verify_journal_chain is
  'GoBD: verifiziert die SHA-256-Kette aller Journal-Einträge einer Firma.';

-- ============================================================================
-- Migration altbestands (optionale Einmal-Aktion):
--   Für bestehende Installationen ohne Hash-Werte einmalig ausführen:
--     update journal_entries set prev_hash = NULL, entry_hash = NULL
--       where entry_hash is null;
--     -- dann in Datumsreihenfolge neu hashen (kleines Migrationsskript):
--     do $$ ... $$
--
-- Für neue Installationen tut der Trigger das automatisch.
-- ============================================================================
