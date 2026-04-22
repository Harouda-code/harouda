# Tech-Debt · AV-Vertraege Supabase-Migration

**Erfasst:** 2026-04-21 · Nacht-Modus-Sprint · Schritt 1 (AnlageAV).
**Status:** offen · nicht blockierend.

## Kontext

`src/domain/est/avVertraegeStore.ts` persistiert AV-Vertrags-Stammdaten
aktuell in localStorage unter `harouda:av-vertraege:<mandantId>`.
Ausreichend für Single-Device-DEMO-Betrieb und für die Schritt-1-
Integration; **nicht** ausreichend für:

- Cross-Device-Nutzung (Mandant wechselt Gerät → Vertraege weg).
- Langzeit-Archivierung über localStorage-Quota-Risiken hinaus.
- Cross-Kanzlei-Sharing (z. B. Steuerberater → Mandant-Web-Portal).
- Audit-Log-Integration (wer hat wann welchen Vertrag angelegt).

## Ziel-Migration

Supabase-Tabelle `av_vertraege`:

```sql
create table public.av_vertraege (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  client_id           uuid null references public.clients(id) on delete restrict,
  anbieter            text not null,
  vertragsnummer      text not null,
  vertragstyp         text not null check (vertragstyp in ('riester','ruerup','sonstige-av')),
  ehepartner_referenz boolean not null default false,
  erfasst_am          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- optional: zentralisiertes Audit
  created_by          uuid null references auth.users(id) on delete set null
);

create index av_vertraege_company_client_idx on public.av_vertraege(company_id, client_id);

-- RLS analog employees/lohnarten: RESTRICTIVE client-consistency policy
-- (siehe Migration 0026-Muster).
```

Store-Schicht (`avVertraegeStore.ts`) erhält dual-mode-Verzweigung
analog zum `api/accounts.ts`-Pattern:

```ts
if (!shouldUseSupabase()) {
  // localStorage-Pfad (wie heute)
} else {
  const companyId = requireCompanyId();
  // Supabase select/insert/delete mit company_id + client_id
}
```

## Migration-Pfad für Bestandsdaten

Die LocalStorage-Keys `harouda:av-vertraege:<mandantId>` können in
einer einmaligen Client-Side-Transition-Migration nach Supabase
geschrieben werden (nach Pattern der `migrateEstFormsV1ToV2` in
Phase 1). Alternativ reines Ignorieren — die Stammdaten sind klein
genug für manuellen Re-Entry beim ersten Supabase-Use.

## Nicht enthalten in diesem Tech-Debt

- VaSt-eDaten-Bescheinigungsabruf (§ 22a EStG Datenübermittlung).
  Eigener Sprint, orthogonal zur Persistenz.
- Ehepartner-Cross-Reference über zwei Mandant-Datensätze
  (`person_b_mandant_id`). Aktuell reicht der Boolean
  `ehepartner_referenz`.

## Trigger für Umsetzung

- Sobald ein Kanzlei-Mandant auf >1 Device arbeitet.
- Sobald der Datenschutz-Officer Cross-Device-Konsistenz fordert.
- Als Teil eines breiteren „alle localStorage-Stammdaten nach
  Supabase"-Sprints (inkl. z. B. `harouda:supplierPrefs` etc.).

## Aufwand-Schätzung

- Migration + Store-Refactor: **M** (analog `anlagen.ts`-Pattern).
- RLS-Policy + Struktur-Test nach 0026-Muster: **S**.
- Bestandsdaten-Migration: **S** (Opt-in, nicht automatisch).

Zusammen ein halber Sprinttag, kein Blocker.
