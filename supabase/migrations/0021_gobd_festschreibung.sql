-- ============================================================================
-- harouda-app · GoBD Festschreibungs-Infrastruktur (§ 146 AO, GoBD Rz. 64)
--
-- Ergänzt:
--   • lohnabrechnungen_archiv um Hash-Felder + Lock-Metadaten
--   • Neue Tabelle lsta_festschreibungen für festgeschriebene
--     Lohnsteuer-Anmeldungen (quartals-/monatsweise)
--   • Trigger, die Änderungen an festgeschriebenen Daten verhindern
--
-- Umsetzungs-Hinweis:
--   Die Hash-Berechnung erfolgt in der Anwendung (Web Crypto SHA-256 über
--   kanonisches JSON, siehe src/lib/crypto/payrollHash.ts). Postgres validiert
--   nur, dass der Hash bei Lock gesetzt ist und nach Lock unverändert bleibt.
-- ============================================================================

-- ---------------- lohnabrechnungen_archiv Erweiterung -----------------------

alter table public.lohnabrechnungen_archiv
  add column if not exists lock_hash varchar(64),
  add column if not exists lock_reason text,
  add column if not exists locked_by uuid references auth.users(id),
  add column if not exists unlock_history jsonb not null default '[]'::jsonb;

-- Lock kann nur gesetzt werden wenn lock_hash gesetzt ist
alter table public.lohnabrechnungen_archiv
  drop constraint if exists lohnabr_lock_needs_hash;
alter table public.lohnabrechnungen_archiv
  add constraint lohnabr_lock_needs_hash
  check ((locked = false) or (lock_hash is not null and length(lock_hash) = 64));

-- Erweiterter Immutability-Trigger — ergänzt den existierenden aus 0020
create or replace function public.prevent_locked_abrechnungen_update()
returns trigger as $$
begin
  -- Wenn Record festgeschrieben ist UND bleibt:
  if old.locked = true and new.locked = true then
    -- Nur unlock_history und locked_at dürfen geändert werden
    if new.abrechnungsmonat != old.abrechnungsmonat
       or new.abrechnung_json != old.abrechnung_json
       or new.gesamt_brutto != old.gesamt_brutto
       or new.gesamt_netto != old.gesamt_netto
       or new.lock_hash != old.lock_hash
    then
      raise exception 'Festgeschriebene Lohnabrechnung % kann nicht geändert werden (GoBD Rz. 64, § 146 AO).', old.id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

-- ---------------- LStA Festschreibungen (separate Tabelle) ------------------

create table if not exists public.lsta_festschreibungen (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  zeitraum            text not null,             -- "2025-01", "2025-Q1", "2025-JAHR"
  zeitraum_art        text not null check (zeitraum_art in ('MONAT','QUARTAL','JAHR')),
  /** Referenz auf die Lohnabrechnungen, die in diese LStA eingeflossen sind. */
  abrechnungs_ids     uuid[] not null,
  /** Full anmeldung-Snapshot (Kennzahlen, Meta). */
  anmeldung_json      jsonb not null,
  /** Zahllast-Summe für Quick-Reporting. */
  kennzahlen_summe    numeric(15,2) not null,
  /** SHA-256 über anmeldung_json. */
  lock_hash           varchar(64) not null,
  locked_by           uuid references auth.users(id),
  locked_at           timestamptz not null default now(),
  abgabefrist         date not null,
  /** Zeitpunkt der ELSTER-Übermittlung (falls erfolgt). */
  abgegeben_am        timestamptz null,
  /** ELSTER Transfer-Ticket-Nummer. */
  elster_ref          text null,
  created_at          timestamptz not null default now(),

  constraint lsta_festschreibungen_unique unique (company_id, zeitraum, zeitraum_art)
);

create index if not exists lsta_fs_company_zeitraum_idx
  on public.lsta_festschreibungen(company_id, zeitraum);

alter table public.lsta_festschreibungen enable row level security;

drop policy if exists lsta_fs_select on public.lsta_festschreibungen;
create policy lsta_fs_select on public.lsta_festschreibungen
  for select using (true);

drop policy if exists lsta_fs_insert on public.lsta_festschreibungen
  ;
create policy lsta_fs_insert on public.lsta_festschreibungen
  for insert with check (true);

-- UPDATE nur für ELSTER-Ergänzungen (abgegeben_am, elster_ref)
drop policy if exists lsta_fs_update on public.lsta_festschreibungen;
create policy lsta_fs_update on public.lsta_festschreibungen
  for update using (true);

-- Immutability-Trigger
create or replace function public.prevent_lsta_festschreibung_modification()
returns trigger as $$
begin
  -- Kern-Felder dürfen NIE nach Lock geändert werden
  if new.zeitraum != old.zeitraum
     or new.zeitraum_art != old.zeitraum_art
     or new.kennzahlen_summe != old.kennzahlen_summe
     or new.anmeldung_json != old.anmeldung_json
     or new.lock_hash != old.lock_hash
     or new.abrechnungs_ids != old.abrechnungs_ids
  then
    raise exception 'Festgeschriebene LStA % kann nicht geändert werden (GoBD Rz. 64).', old.id;
  end if;
  -- Nur elster_ref / abgegeben_am dürfen ergänzt werden
  return new;
end;
$$ language plpgsql;

drop trigger if exists lsta_festschreibungen_immutability on public.lsta_festschreibungen;
create trigger lsta_festschreibungen_immutability
  before update on public.lsta_festschreibungen
  for each row execute function public.prevent_lsta_festschreibung_modification();

-- DELETE von festgeschriebenen LStA ist NIE erlaubt
drop policy if exists lsta_fs_no_delete on public.lsta_festschreibungen;
create policy lsta_fs_no_delete on public.lsta_festschreibungen
  for delete using (false);
