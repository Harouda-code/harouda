# Tech-Debt · Employee-SV-Felder Contract-Phase

**Erfasst:** 2026-04-25 · Sprint 18.
**Status:** **OPEN** · **Priority:** Low (wartet auf 100%-Backfill).

## Kontext

Sprint 18 hat den Expand-and-Contract-Pattern **Phase 1 (Expand)**
umgesetzt: Migrationen 0032 (Employee-SV-Felder) + 0033 (Client-
Anschrift) haben die neuen Spalten als **NULLABLE** eingefuehrt.
Dieses Ticket verfolgt **Phase 2 (Contract)** — die NOT-NULL-
Migration, nachdem alle aktiven Mandanten ihre Stammdaten 100%
gepflegt haben.

## Beschreibung

Folgende Felder wurden in Sprint 18 als NULLABLE eingefuehrt und
sollen in einer Folge-Migration auf NOT NULL umgestellt werden:

### Employee (Migration 0032 → Contract-Migration 00xx)

- `staatsangehoerigkeit`
- `taetigkeitsschluessel`
- `einzugsstelle_bbnr`
- `anschrift_strasse`
- `anschrift_hausnummer`
- `anschrift_plz`
- `anschrift_ort`

(NICHT Kontrakt-Kandidaten: `geburtsname` / `geburtsort` —
DEUeV-optional.)

### Client (Migration 0033 → Contract-Migration 00xx)

- `anschrift_strasse`
- `anschrift_hausnummer`
- `anschrift_plz`
- `anschrift_ort`

## Aktivierungs-Kriterien

**Contract-Phase darf erst ausgerollt werden, wenn:**

1. Fuer alle aktiven Mandanten (`clients.*` mit `is_active=true`)
   gilt: `isClientAnschriftComplete()` → `complete=true`.
2. Fuer alle aktiven Employees gilt: `isEmployeeSvDataComplete()` →
   `complete=true`.
3. Ein Monitoring-Dashboard zeigt diese Metrik stabil ueber
   mindestens 2 Monatsabschluesse (keine neuen Luecken).

## Vorschlag zur Umsetzung

Contract-Migration (Platzhalter-Nummer):

```sql
alter table public.employees
  alter column staatsangehoerigkeit set not null,
  alter column taetigkeitsschluessel set not null,
  alter column einzugsstelle_bbnr set not null,
  alter column anschrift_strasse set not null,
  alter column anschrift_hausnummer set not null,
  alter column anschrift_plz set not null,
  alter column anschrift_ort set not null;

alter table public.clients
  alter column anschrift_strasse set not null,
  alter column anschrift_hausnummer set not null,
  alter column anschrift_plz set not null,
  alter column anschrift_ort set not null;
```

**Vor dem Run** Backfill-Verification-Query:

```sql
select count(*) from public.employees
 where is_active
   and (
     staatsangehoerigkeit is null or
     taetigkeitsschluessel is null or
     einzugsstelle_bbnr is null or
     anschrift_strasse is null or
     anschrift_hausnummer is null or
     anschrift_plz is null or
     anschrift_ort is null
   );
-- muss 0 sein, sonst Contract-Phase NICHT ausrollen.

select count(*) from public.clients
 where (
   anschrift_strasse is null or
   anschrift_hausnummer is null or
   anschrift_plz is null or
   anschrift_ort is null
 );
-- muss 0 sein.
```

## Monitoring-Anforderung

Dashboard-Metric aufnehmen (Folge-Sprint):
`sv_stammdaten_incomplete_count` aggregiert ueber alle aktiven
Mandanten. Alert wenn > 0 waehrend des Contract-Rollouts.

## Verwandte Tech-Debts

### Geburtsdatum am Employee (Sprint-18-Nebeneffekt)

Der Phase-2-`Arbeitnehmer`-Type hat `geburtsdatum`, der Employee-DB-
Type hat es NICHT. DEUeV verlangt `geburtsdatum` als Pflichtfeld.
Sprint 18 umgeht das temporaer, indem `resolveBuildContext`
das `einstellungsdatum` als Platzhalter verwendet. Folge-Sprint
sollte `geburtsdatum` als eigene Spalte ergaenzen + in Completeness-
Check aufnehmen.

### Krankenkassen-Stammdaten-Modul

Sprint 18 laesst die BBNR direkt am Employee. Ein eigenes
`krankenkassen`-Stammdatenmodul (mit BBNR-Spalte + Zusatzbeitrag +
AAG-Erstattungssatz) waere sauberer fuer Multi-Mandanten, ist aber
nicht blocker — Sprint-15-Scope-Entscheidung.

## Siehe auch

- `docs/SPRINT-18-EMPLOYEE-SV-STAMMDATEN-ABSCHLUSS.md` — Expand-Phase.
- `docs/SPRINT-15-SV-MELDUNGEN-ABSCHLUSS.md` §5.4 — Tech-Debt-
  Vorerklaerung.
- `docs/DSUV-SCHEMA-UPDATE-GUIDE.md` — jahresweise Schema-Review.
- `src/domain/employees/svCompleteness.ts` — Helpers fuer Dashboard-
  Metric + UI-Badges.
