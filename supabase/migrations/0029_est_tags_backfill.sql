-- ============================================================================
-- harouda-app · Phase 3 / Schritt 6 · Backfill ESt-Anlagen-Tags auf accounts
--
-- Kein Schema-Change — die `accounts.tags TEXT[]`-Spalte existiert seit
-- Migration 0019 (HGB Balance Sheet). Diese Migration fügt pro Range-
-- Regel aus `src/domain/est/skr03AnlagenMapping.ts` einen Tag-String
-- im Format `"<anlage-id>:<feld>"` an alle passenden Konten an.
--
-- Idempotent: jeder UPDATE prüft via `NOT <tag> = ANY(COALESCE(tags,…))`,
-- dass der Tag noch nicht vorhanden ist. Re-Runs sind no-ops.
--
-- Safety: Filter auf `konto_nr ~ '^[0-9]+$'` — nicht-numerische Konto-
-- Strings (z. B. Dummy-Einträge aus Tests) bleiben unverändert.
--
-- Scope: AnlageG (16 Regeln) + AnlageS (14 Regeln) = 30 UPDATE-Statements.
-- Entspricht 1:1 dem `SKR03_ANLAGEN_MAPPING`-Array (Schritt 4).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- AnlageG
-- ----------------------------------------------------------------------------

-- Einnahmen
update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:umsaetze')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 8300 and 8499
    and not 'anlage-g:umsaetze' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:umsatzsteuerfrei')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 8100 and 8199
    and not 'anlage-g:umsatzsteuerfrei' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:umsatzsteuerfrei')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 8500 and 8599
    and not 'anlage-g:umsatzsteuerfrei' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:anlagenverkaeufe')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 2700 and 2749
    and not 'anlage-g:anlagenverkaeufe' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:sonstige_einnahmen')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 8910 and 8939
    and not 'anlage-g:sonstige_einnahmen' = any(coalesce(tags, '{}'));

-- Waren + Fremdleistungen
update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:wareneinsatz')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 3400 and 3699
    and not 'anlage-g:wareneinsatz' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:fremdleistungen')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 3700 and 3799
    and not 'anlage-g:fremdleistungen' = any(coalesce(tags, '{}'));

-- Ausgaben
update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:personal')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4100 and 4199
    and not 'anlage-g:personal' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:raum')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4210 and 4299
    and not 'anlage-g:raum' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:fahrzeug')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4500 and 4599
    and not 'anlage-g:fahrzeug' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:werbung')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4600 and 4629
    and not 'anlage-g:werbung' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:bewirtung')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4650 and 4655
    and not 'anlage-g:bewirtung' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:abschreibungen')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4800 and 4889
    and not 'anlage-g:abschreibungen' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:porto_tel')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4910 and 4929
    and not 'anlage-g:porto_tel' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:beratung')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4950 and 4959
    and not 'anlage-g:beratung' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:sonstige_ausgaben')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4900 and 4909
    and not 'anlage-g:sonstige_ausgaben' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:sonstige_ausgaben')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4930 and 4949
    and not 'anlage-g:sonstige_ausgaben' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-g:sonstige_ausgaben')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4960 and 4989
    and not 'anlage-g:sonstige_ausgaben' = any(coalesce(tags, '{}'));

-- ----------------------------------------------------------------------------
-- AnlageS
-- ----------------------------------------------------------------------------

-- Einnahmen
update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:honorare')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 8300 and 8499
    and not 'anlage-s:honorare' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:umsatzsteuerfrei')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 8100 and 8199
    and not 'anlage-s:umsatzsteuerfrei' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:umsatzsteuerfrei')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 8500 and 8599
    and not 'anlage-s:umsatzsteuerfrei' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:sonstige')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 8910 and 8939
    and not 'anlage-s:sonstige' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:sonstige')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 2700 and 2749
    and not 'anlage-s:sonstige' = any(coalesce(tags, '{}'));

-- Ausgaben
update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:personal')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4100 and 4199
    and not 'anlage-s:personal' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:raum')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4210 and 4299
    and not 'anlage-s:raum' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:fahrzeug')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4500 and 4599
    and not 'anlage-s:fahrzeug' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:reisen')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4660 and 4669
    and not 'anlage-s:reisen' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:porto_tel')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4910 and 4929
    and not 'anlage-s:porto_tel' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:fortbildung')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4670 and 4679
    and not 'anlage-s:fortbildung' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:versicherung')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4360 and 4399
    and not 'anlage-s:versicherung' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:beratung')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4950 and 4959
    and not 'anlage-s:beratung' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:abschreibungen')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4800 and 4889
    and not 'anlage-s:abschreibungen' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:sonstige_ausgaben')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4900 and 4909
    and not 'anlage-s:sonstige_ausgaben' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:sonstige_ausgaben')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4930 and 4949
    and not 'anlage-s:sonstige_ausgaben' = any(coalesce(tags, '{}'));

update public.accounts set tags = array_append(coalesce(tags, '{}'), 'anlage-s:sonstige_ausgaben')
  where konto_nr ~ '^[0-9]+$'
    and konto_nr::integer between 4960 and 4989
    and not 'anlage-s:sonstige_ausgaben' = any(coalesce(tags, '{}'));
