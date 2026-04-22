# Sprint 19 — Debitor-/Kreditor-Modul · Abschlussbericht

## 1. Meta

| | |
|---|---|
| **Sprint-Start** | 2026-04-21 (Sprint 18 abgeschlossen mit 1656 Tests) |
| **Sprint-Ende** | 2026-04-22 |
| **Dauer** | 2 Kalendertage · 3 Phasen (A → B → C) |
| **Test-Count (Start)** | 1656 |
| **Test-Count (Ende)** | **1860 (+204 netto)** |
| **Test-Dateien (Ende)** | **183 (+18)** |
| **Migrations (Ende)** | 37 (0035–0037) |
| **`tsc --noEmit`** | clean |
| **Neue Routen** | `/debitoren`, `/kreditoren`, `/partners/:id/history` |

## 2. Deltas pro Phase

| Phase | Fokus | Test-Count | Δ Tests | Δ Dateien | Neue Migrations |
|---|---|---|---|---|---|
| 19.A | Schema + Types + Services | 1706 | **+50** | +8 | 0035, 0036, 0037 |
| 19.B | VIES-Edge + Domain-Validatoren + Duplicate | 1781 | **+75** | +8 | — |
| **19.C** | **UI: Dialog-basierte Editoren, DebitorAuswahl, Badges, Override** | **1860** | **+79** | **+~12 (nach Refactor-Entfernungen)** | — |
| **Sprint-Total** | | **1860** | **+204** | **≈ +28** | **3** |

## 3. Neue Dateien — vollständige Aufstellung

### Migrationen (Phase 19.A)
- `supabase/migrations/0035_business_partners.sql`
- `supabase/migrations/0036_belege_business_partner_link.sql`
- `supabase/migrations/0037_ustid_verifications.sql`

### Supabase Edge Functions (Phase 19.B)
- `supabase/functions/verify-ust-idnr/index.ts`
- `supabase/functions/verify-ust-idnr/README.md`

### API-Services (Phase 19.A)
- `src/api/businessPartners.ts`
- `src/api/ustidVerifications.ts`

### Domain-Module (Phase 19.B)
- `src/domain/partners/ustIdValidation.ts`
- `src/domain/partners/duplicateCheck.ts`
- `src/domain/partners/ibanValidation.ts`
- `src/domain/partners/leitwegIdValidation.ts`
- `src/domain/partners/nummernkreisPolicy.ts`

### Shared UI-Komponenten (Phase 19.C)
- `src/components/partners/UstIdnrStatusBadge.tsx` (6-Zustands-Mapping)
- `src/components/partners/DuplicateWarningBanner.tsx` (Soft-Warning + Override)
- `src/components/partners/DebitorAuswahl.tsx` (Dropdown + Suche + Freitext)
- `src/components/partners/PartnerEditor.tsx` (Dialog-basiert, 7 Sections)

### Pages + Wrappers (Phase 19.C)
- `src/pages/DebitorenPage.tsx` (Wrapper)
- `src/pages/KreditorenPage.tsx` (Wrapper)
- `src/pages/partners/PartnerListPage.tsx` (shared list + inline Dialog)
- `src/pages/partners/PartnerVersionHistory.tsx` (Diff-View)

### Tests (alle Phasen)
- `src/types/__tests__/businessPartner-types.test.ts`
- `src/api/__tests__/businessPartners.test.ts`
- `src/api/__tests__/businessPartners.duplicate.test.ts`
- `src/api/__tests__/ustidVerifications.test.ts`
- `src/api/__tests__/belege.partner-link.test.ts`
- `src/domain/partners/__tests__/ustIdValidation.test.ts`
- `src/domain/partners/__tests__/duplicateCheck.test.ts`
- `src/domain/partners/__tests__/ibanValidation.test.ts`
- `src/domain/partners/__tests__/leitwegIdValidation.test.ts`
- `src/domain/partners/__tests__/nummernkreisPolicy.test.ts`
- `src/components/partners/__tests__/UstIdnrStatusBadge.test.tsx`
- `src/components/partners/__tests__/DuplicateWarningBanner.test.tsx`
- `src/components/partners/__tests__/DebitorAuswahl.test.tsx`
- `src/components/partners/__tests__/PartnerEditor.test.tsx`
- `src/pages/__tests__/DebitorenPage.test.tsx`
- `src/pages/__tests__/KreditorenPage.test.tsx`
- `src/pages/partners/__tests__/PartnerVersionHistory.test.tsx`
- `src/pages/__tests__/ERechnungPage.partner-integration.test.tsx`

### Dokumentation (Phase 19.C)
- `docs/SPRINT-19-ABSCHLUSS.md` (dieser Bericht)
- `docs/TECH-DEBT-SPRINT-19-POLICY-VERIFY.md`
- `docs/TECH-DEBT-SPRINT-19-BZSt-VIES-HIERARCHY.md`
- `docs/TECH-DEBT-SPRINT-19-NUMMERN-RANGE-CONFIG.md`

## 4. Modifizierte Dateien

- `src/types/db.ts` — `BusinessPartner`, `BusinessPartnerVersion`,
  `UstIdVerification` + 4 Discriminator-Unions (~110 Zeilen).
- `src/lib/db/journalRepo.ts` — `BelegRecord` um `business_partner_id?`
  und `business_partner_version_id?` erweitert; `createJournalFromBeleg`
  akzeptiert und persistiert die neuen Felder; Drift-Warnung via
  `console.warn`; **19.C-VEREINFACHUNG:** version_id wird nicht
  automatisch aus der Historie aufgelöst (nur explizit gesetzt wird
  durchgereicht).
- `src/api/store.ts` — 3 neue localStorage-Keys + 6 Getter/Setter-Paare.
- `src/api/businessPartners.ts` — erweitert (19.B) um
  `DuplicatePartnerError`, `checkDuplicatesForInput`,
  `verifyUstIdnrForPartner`, sowie Duplicate-Check + Nummernkreis-Check
  in `createBusinessPartner`.
- `src/App.tsx` — 3 neue Routen eingehängt
  (`/debitoren`, `/kreditoren`, `/partners/:id/history`);
  `PartnerEditor` ist ab 19.C Dialog-basiert (keine eigene Route).
- `src/components/AppShell.tsx` — Stammdaten-Navigationsgruppe
  erweitert (Legacy-„in Vorbereitung"-Badges ersetzt durch
  Debitoren + Kreditoren).
- `src/pages/ERechnungPage.tsx` — `DebitorBlock` mit `DebitorAuswahl`,
  `UstIdnrStatusBadge`, „Zurücksetzen auf Freitext"-Link;
  „Als Debitor speichern" öffnet inline-`PartnerEditor`-Dialog
  mit Prefill aus Party-State.

## 5. Migrations-Einzeiler

| Nr. | Zweck |
|---|---|
| 0035 | `business_partners` + `business_partners_versions` inkl. Hybrid-Versioning-Trigger, partielle UNIQUE-Indizes für Duplicate-Hard-Blocks, RLS (permissive + RESTRICTIVE client-Isolation), Retention-Block-Trigger, RPCs `next_debitor_nummer` / `next_kreditor_nummer`. |
| 0036 | `belege` Expand-Phase: `business_partner_id` + `business_partner_version_id` (beide NULLABLE) + Index. |
| 0037 | `ustid_verifications` — WORM-Log mit bytea-Raw-Response, Retention-Felder, RLS, Delete-Block-Trigger. |

## 6. Neue RPC-Functions (Supabase)

- `public.next_debitor_nummer(p_client_id uuid) returns integer`
- `public.next_kreditor_nummer(p_client_id uuid) returns integer`

Hard-coded Ranges 10000–69999 bzw. 70000–99999. Konfigurierbarkeit
pro Mandant siehe `docs/TECH-DEBT-SPRINT-19-NUMMERN-RANGE-CONFIG.md`.

## 7. Architektur-Entscheidungen (bindend)

1. **Unified Table** `business_partners` mit `partner_type IN ('debitor','kreditor','both')` statt zweier getrennter Tabellen.
2. **Hybrid Versioning** — `business_partners` (current) + `business_partners_versions` (immutable snapshots). DB-Trigger kopiert OLD-Row bei UPDATE.
3. **VIES via Edge Function** (`verify-ust-idnr`), **nicht** BZSt für die UI-Integration (Hierarchy-Klärung als Tech-Debt HIGH).
4. **Hard-Blocks application-seitig + partielle UNIQUE-Indizes DB-seitig** (zweifache Verifikation).
5. **Mandant-Isolation** via RESTRICTIVE-Policy analog Migration 0026.
6. **Greenfield für `belege`**: NULL-FK, kein Backfill der `partner_*`-Denormalisierung.
7. **Dialog-basierter PartnerEditor** (19.C) statt eigener Route: Listen-State bleibt sauber, Navigation lenkt nicht ab.
8. **VEREINFACHUNG für 19.C**: `business_partner_version_id` wird beim Beleg-Insert NICHT aus der Snapshot-Historie aufgelöst (siehe Kommentar in `journalRepo.ts`). Grund: Die Versions-Tabelle enthält ausschließlich Pre-Update-Snapshots, nicht den aktuellen Zustand. Ein „current-version-pointer" kommt Sprint 20+.

## 8. Abgeschlossene Tech-Debt-Tickets

**Keine** — Sprint 19 hat ausschließlich **neue** Tech-Debt aufgemacht.

## 9. Offene Tech-Debt-Tickets (aus Sprint 19)

| Ticket | Priorität | Kurzbeschreibung |
|---|---|---|
| [`TECH-DEBT-SPRINT-19-POLICY-VERIFY.md`](./TECH-DEBT-SPRINT-19-POLICY-VERIFY.md) | LOW | RESTRICTIVE-Policy-Review + Trigger-Ordering-Kommentar-Korrektur in Migration 0035. |
| [`TECH-DEBT-SPRINT-19-BZSt-VIES-HIERARCHY.md`](./TECH-DEBT-SPRINT-19-BZSt-VIES-HIERARCHY.md) | **HIGH (rechtskritisch)** | Routing-Logik BZSt (DE-qualifiziert) vs. VIES (EU-weit), doppelte Log-Persistenz, Steuerberater-Sign-off vor Produktion. |
| [`TECH-DEBT-SPRINT-19-NUMMERN-RANGE-CONFIG.md`](./TECH-DEBT-SPRINT-19-NUMMERN-RANGE-CONFIG.md) | MEDIUM | Konfigurierbarkeit der Nummernkreise pro Mandant (blockt DATEV-Import + SKR04-Spezialitäten). |

## 10. Bewusst ausgelassen (Sprint-20-Kandidaten)

- Hash-Chain auf `business_partners_versions` + `ustid_verifications`
  (§ 146 AO Tamper-Evidence).
- `retention_hold`-UI + Workflow (Felder in DB vorhanden).
- Z3-Export-Erweiterung für die drei neuen Tabellen
  (Betriebsprüfer-Lesbarkeit).
- `docs/DEBITOR-VERFAHRENSDOKUMENTATION.md` (§ 147 AO Abs. 6
  Nachweispflicht für den Verfahrensablauf).
- Nummern-Range-Konfigurierbarkeit (siehe Tech-Debt).
- BZSt/VIES-Hierarchy-Service-Refactor (siehe Tech-Debt, HIGH).
- Edge-Function-Unit-Tests in Deno-Runtime (heute kein Deno-Harness
  in CI).
- Periodic-Re-Verification (Cron / Scheduled Function) für
  verfallende VIES-Bestätigungen.
- `invoice_xml_archive` um strukturierte Buyer-Felder erweitern
  (heute nur `buyer_name text`).
- `dunning_records.gegenseite` + `receipt_requests.bank_gegenseite`
  FK auf `business_partners` (Portfolio-Sicht „offene Forderungen je Kunde").
- `belege.mandant_id` → `client_id`-Rename + richtige FK.
- `customer_preferences`-Tabelle analog `supplier_preferences`
  (Konto-Vorschläge je Debitor).
- Audit-Trail für Duplicate-Override („Ignorieren und trotzdem
  speichern"-Klick).
- Current-Version-Pointer in `business_partners` (stabile
  version_id-Auflösung beim Beleg-Insert).

## 11. GoBD / Steuerberater Sign-off-Checkliste (vor Produktion)

- [ ] `retention_until`-Policy für `business_partners_versions` =
      10 Jahre (Default in Trigger-Funktion `tg_bp_snapshot_before_update`):
      Fachanwalt-Freigabe für Kategorie `ORGANISATIONSUNTERLAGE_10J`.
- [ ] `retention_until`-Policy für `ustid_verifications` =
      10 Jahre (Service-seitig berechnet, spiegelt GENERATED-Column):
      Freigabe als Nachweis nach § 147 Abs. 2 Nr. 1 AO.
- [ ] `BYTEA` als Format für `raw_http_response` akzeptiert (Alternative
      wäre Supabase Storage mit `storage_path`-Referenz — heute
      bytea inline).
- [ ] Hierarchie **BZSt (DE qualifiziert)** vs. **VIES (EU einfach)** für
      § 18e UStG-Nachweis final geklärt und dokumentiert — siehe
      `TECH-DEBT-SPRINT-19-BZSt-VIES-HIERARCHY.md`.
- [ ] `retention_hold`-Workflow dokumentiert (heute ist das Feld
      vorhanden, aber keine UI-Bedienung — Prozess via DBA manuell
      möglich, Sprint 20 schließt die UI-Lücke).
- [ ] Nummernkreis-Konvention 10000–69999 / 70000–99999 passt zur
      Kanzlei-Praxis (SKR03-Default); ggf. Override vor Produktion
      festlegen (Sprint 20).
- [ ] Duplicate-Override („Ignorieren und trotzdem speichern") ist
      **nicht auditierbar** in Sprint 19 — Audit-Trail kommt Sprint 20+.
      Bis dahin: prozessuale Absprache in der Kanzlei.
- [ ] CORS-Konfiguration der Edge Functions im Production-Projekt
      überprüft (heute `*`, vor Produktion ggf. enger).

## 12. Verifikation zum Sprint-Abschluss

```
cd D:/harouda-app
NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit   # clean
NODE_OPTIONS=--max-old-space-size=8192 npx vitest run     # 1860 / 183 green
```

Kein `git commit`, kein Push — konsistent mit Sprint-Arbeitsregeln.
