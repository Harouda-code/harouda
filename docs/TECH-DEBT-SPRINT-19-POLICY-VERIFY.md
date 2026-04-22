# TECH-DEBT — Migration 0035 Policy- und Trigger-Reviews

**Sprint eröffnet:** 19 (2026-04-22)
**Priorität:** LOW (funktional ok; stilistisch/präzisionsbezogen)
**Status:** offen
**Trigger zum Abbau:** Security-Audit Sprint 20+ ODER Code-Review durch
Fachanwalt IT-Recht.

## Kontext

Migration `supabase/migrations/0035_business_partners.sql` enthält zwei
Punkte, die funktional korrekt, aber stilistisch/kommentarmässig
korrekturbedürftig sind:

### 1. RESTRICTIVE-Policy-Semantik vs. Migration 0026

Migration 0035 verwendet fuer `bp_client_belongs` / `bpv_client_belongs`
das Pattern:

```sql
create policy bp_client_belongs
  on public.business_partners
  as restrictive
  for all
  using (true)
  with check (public.client_belongs_to_company(client_id, company_id));
```

Migration 0026 (Multi-Tenancy client_id) benutzt exakt dieselbe Struktur
fuer alle anderen Tabellen — also konsistent. Die Spec 19.A schrieb
zwischenzeitlich „nur USING" vor, was jedoch in Edge-Cases (INSERTs
ohne nachfolgende SELECT-Evaluierung) schwächer gewesen wäre. Die
Implementierung folgt dem 0026-Pattern.

**Offener Punkt:** Security-Review, ob beide Varianten für GoBD
Rz. 153–154 (Mandant-Isolation) gleichwertig stark sind, insbesondere
unter service_role-Bypass (Trigger-Kontext).

### 2. Trigger-Ordering-Kommentar in Zeilen 270-273 (falsch)

Der Kommentar im Migrations-File behauptet, `trg_bp_set_updated_at`
feuere alphabetisch **nach** `trg_bp_snapshot`. ASCII-Sortierung:

```
trg_bp_set_updated_at < trg_bp_snapshot    (‹set› < ‹snapshot›)
```

Also feuert `set_updated_at` **vor** `snapshot`. Das bedeutet:
- `NEW.updated_at` wird von `tg_set_updated_at` auf `now()` gesetzt
- Danach läuft `tg_bp_snapshot_before_update` — dort wird
  `OLD.updated_at` fuer `entstehungsjahr` + `retention_until`
  ausgelesen. `OLD` ist immun gegen vorherige BEFORE-Trigger; der
  alte Wert bleibt lesbar. Das Snapshot-Insert nutzt `OLD.updated_at`
  als `valid_from`, was korrekt ist.

**Funktional:** kein Bug — der Snapshot-Zeitraum stimmt.
**Kommentar:** irreführend.

## Empfohlene Aktion

1. Kommentar in `0035_business_partners.sql` Zeilen ca. 270-273
   korrigieren: die Reihenfolge ist umgekehrt, das Verhalten ist aber
   durch OLD-Immutability robust.
2. Policy-Pattern `0035` vs. `0026` vom Security-Reviewer
   signieren lassen (GoBD Rz. 153-154).

**Aufwand:** ~1 Stunde Doku-Review.

**Blocker für Produktion?** Nein — beides ist kosmetisch bzw.
Dokumentations-Präzision, kein RLS-Loch.
