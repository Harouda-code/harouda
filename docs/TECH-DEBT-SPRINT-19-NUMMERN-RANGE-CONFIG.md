# TECH-DEBT — Konfigurierbare Nummernkreise pro Mandant

**Sprint eröffnet:** 19 (2026-04-22)
**Priorität:** MEDIUM
**Status:** offen
**Trigger zum Abbau:** Erster Mandant mit SKR04 oder mit
abweichender Nummernkreis-Konvention (z. B. DATEV-Import mit
10000-19999 als Kasse-Debitoren-Range).

## Kontext

Migration `0035_business_partners.sql` hart-codiert zwei Ranges:

```sql
constraint bp_debitor_nummer_range check (
  debitor_nummer is null or (debitor_nummer between 10000 and 69999)
),
constraint bp_kreditor_nummer_range check (
  kreditor_nummer is null or (kreditor_nummer between 70000 and 99999)
)
```

Die beiden RPC-Functions `next_debitor_nummer(p_client_id)` und
`next_kreditor_nummer(p_client_id)` spiegeln diese Grenzen
(fehler bei > 69999 bzw. > 99999).

Dasselbe Default ist in `src/domain/partners/nummernkreisPolicy.ts`
hinterlegt (`DEBITOR_RANGE`, `KREDITOR_RANGE`).

## Problem

1. **SKR03 vs. SKR04 unterscheiden sich**:
   - SKR03 Debitor: 10000–69999, Kreditor: 70000–99999 ← unsere Defaults.
   - SKR04 Debitor: 10000–69999, Kreditor: 70000–99999 ← passt auch.
   - Manche Kanzleien nutzen aber innerhalb dieser Bereiche weitere
     Sub-Ranges (z. B. 10000–19999 Barverkauf, 20000–69999 Rechnungen).

2. **DATEV-Import** kann vorgegebene Nummern enthalten, die außerhalb
   unseres harten Bereichs liegen — dann schlägt der INSERT mit
   CHECK-Constraint-Violation fehl und der Import bricht ab.

3. **Mandant-spezifische Präferenzen** sind heute nicht ausdrückbar.

## Empfohlene Aktion (Sprint 20+)

### Schema-Erweiterung (ALTER `clients`)

```sql
alter table public.clients
  add column if not exists debitor_nummer_start integer
    check (debitor_nummer_start between 1 and 99999999),
  add column if not exists debitor_nummer_end integer
    check (debitor_nummer_end between 1 and 99999999
           and debitor_nummer_end >= debitor_nummer_start),
  add column if not exists kreditor_nummer_start integer
    check (kreditor_nummer_start between 1 and 99999999),
  add column if not exists kreditor_nummer_end integer
    check (kreditor_nummer_end between 1 and 99999999
           and kreditor_nummer_end >= kreditor_nummer_start);
```

### RPC-Upgrade

`next_debitor_nummer` liest erst `clients.debitor_nummer_start/end`
(oder fällt auf 10000-69999 zurück), bevor `max(debitor_nummer)+1`
berechnet wird. Ebenso `next_kreditor_nummer`.

### Check-Constraint auf `business_partners` entfernen

Die heutige `bp_debitor_nummer_range`-Constraint ist zu starr. Ersatz
via RESTRICTIVE-Policy-Check oder via Trigger, der dynamisch gegen
`clients.debitor_nummer_start/end` validiert.

### Migration fuer bestehende Datensätze

Alle bestehenden `business_partners` müssen in die neuen Ranges
passen — der Backfill setzt auf bestehende Clients Default 10000-69999
bzw. 70000-99999.

### UI

- PartnerEditor zeigt den gültigen Range im Debitor-Nr-Input als Hint.
- Mandant-Settings-Page erhält Range-Konfigurationsfelder mit Warnung
  „Änderung betrifft ausschließlich neue Partner — bestehende
  Nummern bleiben unverändert".

## Blocker für Produktion?

Nein, aber **vor DATEV-Import-Feature** oder vor erstem SKR04-Mandanten
mit abweichenden Ranges zwingend nötig.

## Aufwand

~1,5 Sprints (Schema + RPC + UI + Backfill + Tests).
