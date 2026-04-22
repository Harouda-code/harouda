-- ============================================================================
-- harouda-app · Jahresabschluss-Sprint E1 / Schritt 1 · Client-Stammdaten-
-- Erweiterung fuer Rechtsform, HRB, Gezeichnetes Kapital, Organe,
-- Wirtschaftsjahr.
--
-- Was diese Migration TUT:
--   • ADD COLUMN fuer 7 neue Stammdaten-Felder (alle nullable bzw. mit
--     Default, kein Backfill fuer Bestand).
--   • CHECK-Constraint auf `rechtsform` gegen die HGB-Taxonomie-6.8-
--     Rechtsform-Enum (siehe `src/domain/ebilanz/hgbTaxonomie68.ts`).
--   • `geschaeftsfuehrer` als JSONB mit Default `'[]'` — enthaelt Liste
--     von Organen (Name, Funktion, optional Bestellungsdatum).
--   • `wirtschaftsjahr_beginn`/`_ende` als `MM-DD`-Strings (Default
--     01-01 / 12-31); erlaubt vom Kalenderjahr abweichende
--     Wirtschaftsjahre (z. B. 07-01 / 06-30 fuer GmbH mit Rumpfjahr).
--
-- Was diese Migration NICHT tut:
--   • Kein Backfill (rechtsform bleibt NULL fuer Bestand; der zentrale
--     Closing-Validator in Schritt 7 wirft spaeter wenn NULL).
--   • Kein NOT NULL (wuerde Bestand brechen; Validator-Schicht
--     uebernimmt die Pflicht).
--   • Kein RLS-Update (gleiche Policies wie existierende `clients`-
--     Spalten; kein neuer Sicherheits-Vektor).
--   • Kein Index — Abfragen dieser Felder sind Einzel-Row-Lookups
--     ueber die bereits indizierte id-/mandant_nr-Spalte.
--
-- Idempotenz: jeder ADD COLUMN nutzt `IF NOT EXISTS`. Re-Run ist no-op.
-- ============================================================================

alter table public.clients
  add column if not exists rechtsform text
  check (
    rechtsform is null
    or rechtsform in (
      'Einzelunternehmen',
      'GbR',
      'PartG',
      'OHG',
      'KG',
      'GmbH',
      'AG',
      'UG',
      'SE',
      'SonstigerRechtsform'
    )
  );

alter table public.clients
  add column if not exists hrb_nummer text;

alter table public.clients
  add column if not exists hrb_gericht text;

alter table public.clients
  add column if not exists gezeichnetes_kapital numeric;

alter table public.clients
  add column if not exists geschaeftsfuehrer jsonb
  default '[]'::jsonb;

alter table public.clients
  add column if not exists wirtschaftsjahr_beginn text
  default '01-01';

alter table public.clients
  add column if not exists wirtschaftsjahr_ende text
  default '12-31';

comment on column public.clients.rechtsform is
  'Rechtsform nach HGB-Taxonomie 6.8. NULL fuer Bestandsdaten; Closing-Validator blockt Jahresabschluss bei NULL.';
comment on column public.clients.geschaeftsfuehrer is
  'JSONB-Array: [{name, funktion: "geschaeftsfuehrer"|"vorstand"|"prokurist", bestellt_am?: ISO-Datum}].';
comment on column public.clients.wirtschaftsjahr_beginn is
  'MM-DD-Format. Erlaubt abweichende Wirtschaftsjahre (z. B. 07-01).';
comment on column public.clients.wirtschaftsjahr_ende is
  'MM-DD-Format. Zusammen mit wirtschaftsjahr_beginn das Geschaeftsjahr.';
