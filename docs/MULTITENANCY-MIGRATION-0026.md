# Migration 0026 — Multi-Tenancy Foundation · `client_id` für 14 Tabellen

**Status:** Schema-only, non-breaking, nullable ADD-COLUMN.
**Vorgänger:** 0025 (Anlagenbuchhaltung).
**Nachfolger (geplant, noch nicht implementiert):** 0027 (Backfill), 0028+ (NOT NULL + API-Filter).

---

## 1. Begründung

Die Sprint-1-Bestandsaufnahme (Cross-Module-Datenfluss + Multi-Tenancy-Audit,
2026-04-20) hat aufgedeckt: **53 `.eq("company_id", …)`-Calls** in 16
`api/*.ts`-Dateien, **0 `.eq("client_id", …)`-Filter** im Supabase-Read-
Layer. RLS trennt Kanzleien sauber, aber **innerhalb** einer Kanzlei mischen
sich Daten mehrerer Mandanten, weil mandantenspezifische Tabellen keine
`client_id`-Spalte hatten. Rot-Flags (harte Mandant-Trennung nötig) und
Gelb-Flags (Mandant-Bezug sinnvoll) listet der Audit-Bericht explizit.

## 2. Was diese Migration TUT

### 2.1 Helper-Funktion
```sql
public.client_belongs_to_company(p_client_id uuid, p_company_id uuid)
  returns boolean language sql stable;
```
Prüft, ob eine `client_id` tatsächlich zur übergebenen `company_id` gehört.
Nutzt implizit die RLS auf `public.clients`, so dass ein User gar keine
fremden Clients sehen (oder referenzieren) kann.

### 2.2 Spalten + Indexe + RLS-Gate pro Tabelle

Für jede der 14 Ziel-Tabellen (siehe §3):
- `ADD COLUMN client_id uuid NULL REFERENCES public.clients(id) ON DELETE RESTRICT`
- `CREATE INDEX <table>_client_idx ON <table>(client_id)`
- `CREATE POLICY <table>_client_consistency AS RESTRICTIVE FOR ALL USING (true) WITH CHECK (client_id IS NULL OR public.client_belongs_to_company(client_id, company_id))`

Die RESTRICTIVE-Policy läuft **zusätzlich** zu den bestehenden permissiven
Policies (PG-Semantik: alle RESTRICTIVE werden mit AND verkettet). Sie
blockiert INSERT/UPDATE, wenn die `client_id` nicht zur `company_id` des
Rows passt — verhindert damit, dass Kanzlei A versehentlich/absichtlich
eine Fremd-Kanzlei-client_id in ihre Rows schreibt.

## 3. Betroffene Tabellen (14 Stück)

### Rot-Flags (6 Tabellen — harte Mandant-Trennung)

| Tabelle | Herkunfts-Migration | Warum Rot? |
|---|---|---|
| `anlagegueter` | 0025 | Anlagegüter sind per Definition pro Mandant |
| `employees` | 0016 | Lohn-Mitarbeiter gehören einem Mandanten |
| `lohnarten` | 0020 | Lohn-Stammdaten pro Mandant |
| `lohnbuchungen` | 0020 | Lohn-Buchungen pro Mandant |
| `lohnabrechnungen_archiv` | 0020 | Archiv-PDFs pro Mandant |
| `lsta_festschreibungen` | 0021 | Lohnsteuer-Anmeldung pro Mandant |

### Gelb-Flags (8 Tabellen — Mandant-Bezug sinnvoll)

| Tabelle | Herkunfts-Migration |
|---|---|
| `documents` | 0001 / 0004 |
| `invoice_archive` | 0012 |
| `invoice_xml_archive` | 0012 |
| `elster_submissions` | 0013 |
| `supplier_preferences` | 0014 |
| `advisor_notes` | 0015 |
| `receipt_requests` | 0018 |
| `dunning_records` | 0005 |

### Bewusst ausgelassen: `afa_buchungen`

`afa_buchungen` hat **keine eigene `company_id`-Spalte** — der Tenant-Scope
wird transitiv über `anlage_id → anlagegueter.company_id` durchgereicht
(siehe 0025). Eine direkte `client_id` wäre denormalisiert, ohne
Company-id-Gegenstück nicht konsistent prüfbar, und der Zweck ist bereits
durch die `anlagegueter.client_id`-Erweiterung abgedeckt. Direkte
Mandant-Queries auf `afa_buchungen` erfordern einen Join auf
`anlagegueter` — identisch zum heutigen Muster für `company_id`-Queries.

## 4. Was diese Migration NICHT tut

- **Kein Backfill** — alle bestehenden Rows behalten `client_id = NULL`.
- **Kein NOT NULL** — Spalten bleiben nullable; Pflicht-Wechsel kommt in
  einer späteren Migration, sobald der Backfill-Pfad entschieden ist.
- **Kein API-Read-Filter** — `api/*.ts` liest weiterhin `.eq("company_id", …)`
  ohne `client_id`-Filter; App-Layer-Filterung bleibt Job der Folge-Sprints
  (Schritte 2–6 dieses Multi-Tenancy-Phase-1-Sprints).
- **Keine bestehenden Policies droppen** — die RESTRICTIVE-Policy kommt
  additiv dazu. Damit kein Policy-Lawine-Effekt, keine Regression auf
  bestehenden permissiven Policies.
- **Keine Drops, Renames, Datentyp-Wechsel.**

## 5. Konvention `client_id` (nicht `mandant_id`)

Begründung:
- Die FK-Zieltabelle heißt `public.clients`.
- `journal_entries.client_id` existiert seit 0001 mit genau diesem Namen
  und wird breit gelesen/geschrieben.
- Im TypeScript-Code heißt das Feld entsprechend `JournalEntry.client_id`,
  `reports.ts:22` prüft `e.client_id !== clientId`, etc.

**Historische Abweichung:** `belege` (Migration 0022) nutzt `mandant_id`.
Wird in dieser Migration **nicht** angefasst; optionaler Cleanup-Kandidat
für später (Rename in eigener Migration mit Datentyp-erhaltender Migration).

## 6. Migrations-Reihenfolge

```
… → 0024_cost_carriers.sql
   → 0025_anlagenbuchhaltung.sql
   → 0026_multitenant_client_id.sql   ← NEU
   → (0027_multitenant_backfill.sql, geplant)
   → (0028_multitenant_not_null.sql, geplant)
```

Diese Migration ist **idempotent dank `IF NOT EXISTS`** auf allen
ADD-COLUMN- und CREATE-INDEX-Statements und `DROP POLICY IF EXISTS` vor
jedem `CREATE POLICY`.

## 7. Rollback-Pfad

Falls die Migration aus dringenden Gründen zurückgerollt werden muss
(Performance-Regression, RLS-Klemme, externer Integrations-Bruch), sieht
eine Reverse-Migration so aus:

```sql
-- für jede Ziel-Tabelle:
drop policy if exists <table>_client_consistency on public.<table>;
drop index if exists public.<table>_client_idx;
alter table public.<table> drop column if exists client_id;

-- optional am Ende:
drop function if exists public.client_belongs_to_company(uuid, uuid);
```

Da `client_id` in dieser Phase nullable und ohne Backfill ist, gehen beim
Rollback keine Daten verloren.

## 8. TypeScript-Begleitung

`src/types/db.ts` bekommt in dieser Migration ein `client_id?: string | null`
auf den 10 betroffenen Interfaces (`Anlagegut`, `Employee`, `Document`,
`InvoiceArchiveEntry`, `InvoiceXmlArchiveEntry`, `ElsterSubmission`,
`SupplierPreference`, `AdvisorNote`, `DunningRecord`, `ReceiptRequest`).
Optional/nullable gewählt, damit die API-Layer-Anpassungen der folgenden
Sprint-Schritte keine massiven Initial-Werte-Migrationen im Code brauchen.

Lohn-Types (`LohnArt`, `Lohnbuchung`, `AbrechnungArchivInput`) in
`src/domain/lohn/types.ts` sind in dieser Migration **nicht** angepasst —
sie werden zusammen mit dem Lohn-API-Schritt (Schritt 4/5 dieses Sprints)
gezogen.

## 9. Risiko + Performance

- **Keine Tabellen-Rewrites**: `ADD COLUMN … NULL` ist in PostgreSQL seit
  v11 instant (Metadaten-Only, kein Zeilen-Scan).
- **RESTRICTIVE-Policy**: zusätzlicher Check-Aufwand bei INSERT/UPDATE —
  ein Index-Lookup in `clients` per Zeile. Vernachlässigbar.
- **ON DELETE RESTRICT** auf der FK: verhindert Client-Löschung, wenn
  irgendwo noch `client_id`-References existieren. Das ist in der
  nullable-Phase folgenlos (alle Werte sind NULL), wird aber später zum
  bewussten Schutz-Mechanismus.
- **Kein Mass-UPDATE**, kein Index-Rebuild auf bestehenden Daten.
