-- ============================================================================
-- harouda-app · Sprint 20.B.2 · Hash-Chain für business_partners_versions
--                                   und ustid_verifications
--
-- Zielsetzung (GoBD § 146 AO Tamper-Evidence):
--   • BPV-Chain pro partner_id, sortiert nach version_number ASC.
--   • UV-Chain pro client_id, sortiert nach created_at ASC, id ASC.
--   • Payload-Kontrakt BYTE-IDENTISCH mit src/lib/crypto/sha256Canonical.ts
--     (Sprint 20.B.1). Abweichung bricht Client/DB-Konsistenz.
--
-- Payload-Normalisierung:
--   • Canonical JSON: Keys alphabetisch sortiert, case-sensitive, KEINE
--     Whitespace. null bleibt 'null'. Strings via to_json()::text (korrektes
--     JSON-Escaping). Timestamps: YYYY-MM-DDTHH:MM:SS.ffffffZ (6 µs in UTC).
--     UUIDs: lowercase 36 Zeichen mit Bindestrichen.
--   • Kein `jsonb_build_object(...)::text` — Postgres ordnet Keys in der
--     text-Ausgabe NICHT deterministisch nach Alphabet. Stattdessen
--     expliziter String-Build plus `canonical_jsonb(jsonb)` für nested.
--   • `server_recorded_at` ist GoBD-Timestamp der DB und gehört NICHT in
--     den Payload (siehe Schritt 20.B · Spec-Kopf). `created_at` ist
--     client-gesetzt und TEIL des Payloads.
--
-- Scope 20.B.2:
--   • ALTER TABLE: prev_hash, version_hash / verification_hash,
--     server_recorded_at
--   • Canonical-Helpers: canonical_ts, canonical_jsonb
--   • Payload-Builder: canonical_json_bpv, canonical_json_uv
--   • Hash-Compute: compute_bpv_hash, compute_uv_hash (IMMUTABLE)
--   • BEFORE-INSERT-Trigger: tg_bpv_set_hash, tg_uv_set_hash
--   • BEFORE-UPDATE-Schutz-Trigger (nur bestimmte Felder blockiert)
--   • Verifier-RPCs: verify_bpv_chain, verify_uv_chain (SECURITY DEFINER)
-- ============================================================================

-- pgcrypto ist bereits seit 0001 aktiv; `if not exists` als Defensive.
create extension if not exists pgcrypto;

-- --- A. ALTER business_partners_versions -----------------------------------

alter table public.business_partners_versions
  add column if not exists prev_hash text null,
  add column if not exists version_hash text null,
  add column if not exists server_recorded_at timestamptz not null default now();

create index if not exists bpv_by_server_recorded
  on public.business_partners_versions(client_id, server_recorded_at desc);

-- --- B. ALTER ustid_verifications ------------------------------------------

alter table public.ustid_verifications
  add column if not exists prev_hash text null,
  add column if not exists verification_hash text null,
  add column if not exists server_recorded_at timestamptz not null default now();

create index if not exists uv_by_server_recorded
  on public.ustid_verifications(client_id, server_recorded_at desc);

-- --- C. canonical_ts -------------------------------------------------------

create or replace function public.canonical_ts(v timestamptz)
returns text
language sql
immutable
as $$
  -- YYYY-MM-DDTHH:MM:SS.ffffffZ (UTC, 6 Mikrosekunden-Ziffern).
  select to_char(
    v at time zone 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
  );
$$;

comment on function public.canonical_ts(timestamptz) is
  'Sprint 20.B: byte-identisches Format mit JS formatUtcTimestamp() '
  '(YYYY-MM-DDTHH:MM:SS.ffffffZ, UTC).';

-- --- D. canonical_jsonb ----------------------------------------------------

create or replace function public.canonical_jsonb(j jsonb)
returns text
language plpgsql
immutable
as $$
declare
  t text;
  k text;
  parts text[];
  elem jsonb;
begin
  if j is null then
    return 'null';
  end if;

  t := jsonb_typeof(j);

  if t = 'null' then
    return 'null';
  elsif t = 'boolean' then
    return case when (j)::boolean then 'true' else 'false' end;
  elsif t = 'number' then
    -- Zahlen: direkt ins Canonical uebernehmen (Postgres normalisiert).
    return j::text;
  elsif t = 'string' then
    -- to_json laesst JSON-Escaping korrekt; ::text gibt die Serialisierung.
    return to_json((j #>> '{}'))::text;
  elsif t = 'array' then
    parts := array[]::text[];
    for elem in select * from jsonb_array_elements(j) loop
      parts := parts || public.canonical_jsonb(elem);
    end loop;
    return '[' || array_to_string(parts, ',') || ']';
  elsif t = 'object' then
    parts := array[]::text[];
    for k in select jsonb_object_keys from jsonb_object_keys(j) order by 1 loop
      parts :=
        parts || (to_json(k)::text || ':' || public.canonical_jsonb(j -> k));
    end loop;
    return '{' || array_to_string(parts, ',') || '}';
  end if;

  raise exception 'canonical_jsonb: unsupported jsonb_typeof=%', t;
end;
$$;

comment on function public.canonical_jsonb(jsonb) is
  'Sprint 20.B: byte-identisch mit JS canonicalJson() — rekursive '
  'Key-Sortierung, keine Whitespace, null bleibt null.';

-- --- E. canonical_json_bpv --------------------------------------------------

create or replace function public.canonical_json_bpv(
  p_partner_id             uuid,
  p_version_number         integer,
  p_snapshot               jsonb,
  p_valid_from             timestamptz,
  p_aufbewahrungs_kategorie text
) returns text
language sql
immutable
as $$
  -- Explizite alphabetische Key-Reihenfolge:
  --   aufbewahrungs_kategorie, partner_id, snapshot, valid_from, version_number
  select
    '{"aufbewahrungs_kategorie":'   || to_json(p_aufbewahrungs_kategorie)::text
    || ',"partner_id":'             || to_json(lower(p_partner_id::text))::text
    || ',"snapshot":'               || public.canonical_jsonb(p_snapshot)
    || ',"valid_from":'             || to_json(public.canonical_ts(p_valid_from))::text
    || ',"version_number":'         || p_version_number::text
    || '}';
$$;

-- --- F. canonical_json_uv --------------------------------------------------

create or replace function public.canonical_json_uv(
  p_id                   uuid,
  p_partner_id           uuid,
  p_requested_ust_idnr   text,
  p_raw_response_sha256  text,
  p_verification_status  text,
  p_verification_source  text,
  p_created_at           timestamptz
) returns text
language sql
immutable
as $$
  -- Explizite alphabetische Key-Reihenfolge:
  --   created_at, id, partner_id, raw_response_sha256,
  --   requested_ust_idnr, verification_source, verification_status
  select
    '{"created_at":'                || to_json(public.canonical_ts(p_created_at))::text
    || ',"id":'                     || to_json(lower(p_id::text))::text
    || ',"partner_id":'             ||
         case
           when p_partner_id is null then 'null'
           else to_json(lower(p_partner_id::text))::text
         end
    || ',"raw_response_sha256":'    || to_json(coalesce(p_raw_response_sha256, ''))::text
    || ',"requested_ust_idnr":'     || to_json(p_requested_ust_idnr)::text
    || ',"verification_source":'    || to_json(p_verification_source)::text
    || ',"verification_status":'    || to_json(p_verification_status)::text
    || '}';
$$;

-- --- G. compute_bpv_hash ---------------------------------------------------

create or replace function public.compute_bpv_hash(
  p_prev                   text,
  p_partner_id             uuid,
  p_version_number         integer,
  p_snapshot               jsonb,
  p_valid_from             timestamptz,
  p_aufbewahrungs_kategorie text
) returns text
language sql
immutable
as $$
  select encode(
    digest(
      coalesce(p_prev, repeat('0', 64))
      || '|'
      || public.canonical_json_bpv(
           p_partner_id,
           p_version_number,
           p_snapshot,
           p_valid_from,
           p_aufbewahrungs_kategorie
         ),
      'sha256'
    ),
    'hex'
  );
$$;

-- --- H. compute_uv_hash ----------------------------------------------------

create or replace function public.compute_uv_hash(
  p_prev                  text,
  p_raw_http_response     bytea,
  p_id                    uuid,
  p_partner_id            uuid,
  p_requested_ust_idnr    text,
  p_verification_status   text,
  p_verification_source   text,
  p_created_at            timestamptz
) returns text
language sql
immutable
as $$
  select encode(
    digest(
      coalesce(p_prev, repeat('0', 64))
      || '|'
      || public.canonical_json_uv(
           p_id,
           p_partner_id,
           p_requested_ust_idnr,
           case
             when p_raw_http_response is null then ''
             else encode(digest(p_raw_http_response, 'sha256'), 'hex')
           end,
           p_verification_status,
           p_verification_source,
           p_created_at
         ),
      'sha256'
    ),
    'hex'
  );
$$;

-- --- I. Trigger tg_bpv_set_hash (BEFORE INSERT) ----------------------------

create or replace function public.tg_bpv_set_hash()
returns trigger
language plpgsql
as $$
declare
  prev_h text;
begin
  -- Letzte Version für dieselbe partner_id (prev_hash bleibt NULL bei Genesis).
  select version_hash into prev_h
    from public.business_partners_versions
    where partner_id = NEW.partner_id
    order by version_number desc
    limit 1;

  NEW.prev_hash := prev_h;
  NEW.version_hash := public.compute_bpv_hash(
    NEW.prev_hash,
    NEW.partner_id,
    NEW.version_number,
    NEW.snapshot,
    NEW.valid_from,
    NEW.aufbewahrungs_kategorie
  );
  return NEW;
end;
$$;

drop trigger if exists trg_bpv_set_hash on public.business_partners_versions;
create trigger trg_bpv_set_hash
  before insert on public.business_partners_versions
  for each row
  execute function public.tg_bpv_set_hash();

-- --- J. Trigger tg_uv_set_hash (BEFORE INSERT) -----------------------------

create or replace function public.tg_uv_set_hash()
returns trigger
language plpgsql
as $$
declare
  prev_h text;
begin
  -- Pro client_id: neueste bisherige Row per created_at DESC, id DESC.
  select verification_hash into prev_h
    from public.ustid_verifications
    where client_id = NEW.client_id
    order by created_at desc, id desc
    limit 1;

  NEW.prev_hash := prev_h;
  NEW.verification_hash := public.compute_uv_hash(
    NEW.prev_hash,
    NEW.raw_http_response,
    NEW.id,
    NEW.partner_id,
    NEW.requested_ust_idnr,
    NEW.verification_status,
    NEW.verification_source,
    NEW.created_at
  );
  return NEW;
end;
$$;

drop trigger if exists trg_uv_set_hash on public.ustid_verifications;
create trigger trg_uv_set_hash
  before insert on public.ustid_verifications
  for each row
  execute function public.tg_uv_set_hash();

-- --- K. UPDATE-Schutz: prev_hash / hash / server_recorded_at blockieren ----

create or replace function public.tg_bpv_protect_hash_fields()
returns trigger
language plpgsql
as $$
begin
  if NEW.prev_hash is distinct from OLD.prev_hash then
    raise exception 'GoBD § 146 AO: prev_hash ist unveränderlich (business_partners_versions %).', OLD.version_id;
  end if;
  if NEW.version_hash is distinct from OLD.version_hash then
    raise exception 'GoBD § 146 AO: version_hash ist unveränderlich (business_partners_versions %).', OLD.version_id;
  end if;
  if NEW.server_recorded_at is distinct from OLD.server_recorded_at then
    raise exception 'GoBD § 146 AO: server_recorded_at ist unveränderlich (business_partners_versions %).', OLD.version_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_bpv_protect_hash_fields
  on public.business_partners_versions;
create trigger trg_bpv_protect_hash_fields
  before update on public.business_partners_versions
  for each row
  execute function public.tg_bpv_protect_hash_fields();

create or replace function public.tg_uv_protect_hash_fields()
returns trigger
language plpgsql
as $$
begin
  if NEW.prev_hash is distinct from OLD.prev_hash then
    raise exception 'GoBD § 146 AO: prev_hash ist unveränderlich (ustid_verifications %).', OLD.id;
  end if;
  if NEW.verification_hash is distinct from OLD.verification_hash then
    raise exception 'GoBD § 146 AO: verification_hash ist unveränderlich (ustid_verifications %).', OLD.id;
  end if;
  if NEW.server_recorded_at is distinct from OLD.server_recorded_at then
    raise exception 'GoBD § 146 AO: server_recorded_at ist unveränderlich (ustid_verifications %).', OLD.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_uv_protect_hash_fields on public.ustid_verifications;
create trigger trg_uv_protect_hash_fields
  before update on public.ustid_verifications
  for each row
  execute function public.tg_uv_protect_hash_fields();

-- --- L. RPC verify_bpv_chain -----------------------------------------------

create or replace function public.verify_bpv_chain(p_client_id uuid)
returns table (
  partner_id uuid,
  version_number integer,
  is_valid boolean,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  current_partner uuid := null;
  expected_prev text := null;
  expected_hash text;
  chain_broken boolean := false;
begin
  for r in
    select
      v.partner_id,
      v.version_number,
      v.prev_hash,
      v.version_hash,
      v.snapshot,
      v.valid_from,
      v.aufbewahrungs_kategorie
    from public.business_partners_versions v
    where v.client_id = p_client_id
    order by v.partner_id, v.version_number asc
  loop
    -- Neue Partner-Kette? Reset Chain-Tracking.
    if current_partner is distinct from r.partner_id then
      current_partner := r.partner_id;
      expected_prev := null;   -- Genesis-Anker pro Partner
      chain_broken := false;
    end if;

    -- Wenn dieser Partner bereits broken war, die restlichen Versionen
    -- nicht mehr verifizieren (erste Bruchstelle pro Partner genügt).
    if chain_broken then
      continue;
    end if;

    if r.prev_hash is distinct from expected_prev then
      partner_id := r.partner_id;
      version_number := r.version_number;
      is_valid := false;
      reason := 'prev_hash_mismatch';
      return next;
      chain_broken := true;
      continue;
    end if;

    expected_hash := public.compute_bpv_hash(
      r.prev_hash,
      r.partner_id,
      r.version_number,
      r.snapshot,
      r.valid_from,
      r.aufbewahrungs_kategorie
    );

    if expected_hash is distinct from r.version_hash then
      partner_id := r.partner_id;
      version_number := r.version_number;
      is_valid := false;
      reason := 'hash_mismatch';
      return next;
      chain_broken := true;
      continue;
    end if;

    expected_prev := r.version_hash;
  end loop;

  -- Wenn keine Brüche gemeldet wurden, leere Ergebnismenge = ok.
  return;
end;
$$;

revoke execute on function public.verify_bpv_chain(uuid) from public;
grant execute on function public.verify_bpv_chain(uuid) to authenticated;

comment on function public.verify_bpv_chain(uuid) is
  'Sprint 20.B: GoBD § 146 AO Tamper-Evidence für BPV-Stammdaten-Snapshots. '
  'Liefert pro Partner die ERSTE Bruchstelle; leere Ergebnismenge = Kette ok.';

-- --- M. RPC verify_uv_chain ------------------------------------------------

create or replace function public.verify_uv_chain(p_client_id uuid)
returns table (
  verification_id uuid,
  is_valid boolean,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  expected_prev text := null;
  expected_hash text;
  chain_broken boolean := false;
begin
  for r in
    select
      v.id,
      v.prev_hash,
      v.verification_hash,
      v.raw_http_response,
      v.partner_id,
      v.requested_ust_idnr,
      v.verification_status,
      v.verification_source,
      v.created_at
    from public.ustid_verifications v
    where v.client_id = p_client_id
    order by v.created_at asc, v.id asc
  loop
    if chain_broken then
      continue;
    end if;

    if r.prev_hash is distinct from expected_prev then
      verification_id := r.id;
      is_valid := false;
      reason := 'prev_hash_mismatch';
      return next;
      chain_broken := true;
      continue;
    end if;

    expected_hash := public.compute_uv_hash(
      r.prev_hash,
      r.raw_http_response,
      r.id,
      r.partner_id,
      r.requested_ust_idnr,
      r.verification_status,
      r.verification_source,
      r.created_at
    );

    if expected_hash is distinct from r.verification_hash then
      verification_id := r.id;
      is_valid := false;
      reason := 'hash_mismatch';
      return next;
      chain_broken := true;
      continue;
    end if;

    expected_prev := r.verification_hash;
  end loop;

  return;
end;
$$;

revoke execute on function public.verify_uv_chain(uuid) from public;
grant execute on function public.verify_uv_chain(uuid) to authenticated;

comment on function public.verify_uv_chain(uuid) is
  'Sprint 20.B: GoBD § 146 AO Tamper-Evidence für UstID-Verifikations-Log. '
  'Leere Ergebnismenge = Kette ok.';

-- --- N. Kommentare auf den neuen Spalten ----------------------------------

comment on column public.business_partners_versions.prev_hash is
  'SHA-256 der Vorgänger-Version (pro partner_id). NULL = Genesis.';
comment on column public.business_partners_versions.version_hash is
  'SHA-256 der canonical-JSON-Payload + prev. Tamper-Evidence nach § 146 AO.';
comment on column public.business_partners_versions.server_recorded_at is
  'DB-Timestamp des Inserts (Default now()). NICHT Teil des Hashes.';

comment on column public.ustid_verifications.prev_hash is
  'SHA-256 der Vorgänger-Verifikation (pro client_id). NULL = Genesis.';
comment on column public.ustid_verifications.verification_hash is
  'SHA-256 der canonical-JSON-Payload + prev. Tamper-Evidence nach § 146 AO.';
comment on column public.ustid_verifications.server_recorded_at is
  'DB-Timestamp des Inserts (Default now()). NICHT Teil des Hashes.';
