# Sprint 20 — Production-Readiness + GoBD-Root-Hardening · Abschlussbericht

## 1. Meta

| | |
|---|---|
| **Sprint-Start** | 2026-04-22 (Sprint 19 abgeschlossen mit 1860 Tests) |
| **Sprint-Ende** | 2026-04-22 |
| **Dauer** | 1 Kalendertag · 3 Phasen (A → B → C) |
| **Test-Count (Start)** | 1860 |
| **Test-Count (Ende)** | **1979 (+119)** |
| **Test-Dateien (Ende)** | **195 (+12)** |
| **Migrations (Ende)** | 39 (0038 + 0039 neu) |
| **`tsc --noEmit`** | clean |
| **Neue Route** | `/admin/integrity` mit Role-Gate (owner / admin / tax_auditor) |

## 2. Deltas pro Phase

| Phase | Fokus | Test-Count | Δ Tests | Δ Dateien | Δ Migrations |
|---|---|---|---|---|---|
| 20.A | Hardcoded company_id fix + BZSt-Router + Persistenz | 1891 | **+31** | +7 | +1 (0038) |
| 20.B | Hash-Chain-Core (sha256Canonical + Migration 0039 + Verifier) | 1957 | **+66** | +10 | +1 (0039) |
| **20.C** | **Integrity-Dashboard UI + Closures** | **1979** | **+22** | **+7** | **0** |
| **Sprint-Total** | | **1979** | **+119** | **+24** | **+2** |

## 3. Neue Dateien — vollständige Aufstellung

### Phase 20.A — Production-Blockers (P0)

- `docs/TECH-DEBT-SPRINT-19-HARDCODED-COMPANY-ID.md` (retrospektives Ticket, HIGH)
- `supabase/migrations/0038_ustid_verifications_source.sql`
- `src/api/ustIdRouter.ts` (BZSt/VIES-Router mit deterministischer Entscheidungstabelle + Fallback)
- Tests: `HardcodedCompanyId.regression.test.tsx`, `ustIdRouter.test.ts`, `UstIdnrStatusBadge.source.test.tsx`, `validate-ustid.persistenz.test.ts`

### Phase 20.B — Hash-Chain-Core

- `docs/tech-debt/TECH-DEBT-SPRINT-20-USE-COMPANY-ID-SEMANTIC.md` (LOW)
- `src/lib/crypto/sha256Canonical.ts` (`canonicalJson`, `sha256Hex`, `computeChainHash`, `formatUtcTimestamp`, `GENESIS_HASH`)
- `supabase/migrations/0039_hash_chain_bpv_uv.sql` (~380 Zeilen SQL: `canonical_ts`, `canonical_jsonb`, `canonical_json_bpv` / `_uv`, `compute_bpv_hash` / `_uv_hash`, Trigger, UPDATE-Schutz, RPCs `verify_bpv_chain` / `verify_uv_chain`)
- `src/domain/gobd/hashChainVerifier.ts` (`verifyBpvChain`, `verifyUvChain`, payload builders, `sha256HexOfBase64`)
- Tests: `sha256Canonical.test.ts`, `hashChainVerifier.test.ts`, `businessPartners.chain.test.ts`, `ustidVerifications.chain.test.ts`, `chain.db-client-consistency.test.ts`

### Phase 20.C — Integrity-Dashboard UI

- `docs/OPEN-QUESTIONS-SPRINT-20-C-DB-VERIFIKATION.md` (DEFERRED, Pre-Deploy-Blocker)
- `docs/tech-debt/TECH-DEBT-SPRINT-20-DB-VERIFIKATION-PRE-DEPLOY.md` (HIGH)
- `src/lib/auth/requireAdminRole.ts` (`AdminRole`, `isAdminRole`, `useRequireAdminRole`)
- `src/domain/gobd/integrityDashboard.ts` (`runIntegrityCheck` + aggregate normalization)
- `src/components/admin/Forbidden.tsx` (403-Display)
- `src/pages/admin/IntegrityDashboardPage.tsx` (Route-Component mit Role-Gate, Banner, Table, JSON-Export)
- `docs/SPRINT-20-ABSCHLUSS.md` (dieser Bericht)
- Tests: `requireAdminRole.test.ts`, `integrityDashboard.test.ts`, `IntegrityDashboardPage.test.tsx`

## 4. Modifizierte Dateien

### Phase 20.A
- `src/contexts/CompanyContext.tsx` — `DEMO_COMPANY_ID` **exportiert**, `useCompanyId()` tolerant gegen fehlenden Provider (gibt `null` statt Throw).
- `src/api/db.ts` — Re-Export der `DEMO_COMPANY_ID`-Konstante, damit Service-Layer und UI identische Quelle nutzen.
- `src/types/db.ts` — `UstIdVerificationSource` Union + `verification_source`-Feld auf `UstIdVerification`.
- `src/api/ustidVerifications.ts` — `verification_source` optional in `LogVerificationInput`, Default `'VIES'`.
- `src/api/businessPartners.ts` — `verifyUstIdnrForPartner` delegiert an `routedVerifyUstIdnr`.
- `src/components/partners/UstIdnrStatusBadge.tsx` — `source`-Prop + `SourceBadge`-Sub-Component (🛡️ BZST / 🌐 VIES).
- `src/pages/partners/PartnerListPage.tsx` — nutzt `useCompanyId()`, reicht `source` durch.
- `src/pages/ERechnungPage.tsx` — `DebitorBlock` nutzt `useCompanyId()`, Badge mit `source`.
- `src/components/partners/PartnerEditor.tsx` — `lastVerifySource`-State, `badgeSource`-Prop.
- `supabase/functions/validate-ustid/index.ts` — komplett refaktoriert: akzeptiert `clientId` + `companyId` + `partnerId`, persistiert via `service_role` in `ustid_verifications` mit `verification_source='BZST'`, BZSt-Error-Code-Mapping auf Verification-Status.
- `supabase/functions/validate-ustid/README.md` — aktualisiert auf Sprint-20.A.2-Verhalten.
- `src/types/__tests__/businessPartner-types.test.ts` — `verification_source`-Feld in Fixture.

### Phase 20.B
- `src/types/db.ts` — `BusinessPartnerVersion` + `UstIdVerification` um optional `prev_hash`, `version_hash` / `verification_hash`, `server_recorded_at` erweitert.
- `src/api/businessPartners.ts` — **DEMO-Chain-Hash in `updateBusinessPartner`:** `prev_hash`-Lookup (neueste `version_number` pro `partner_id`), Payload-Build via exportiertem `buildBpvPayload`, `version_hash = await computeChainHash(prev, payload)`, `server_recorded_at` gesetzt. Export `verifyBpvChainForClient` mit DEMO/RPC-Branch.
- `src/api/ustidVerifications.ts` — **DEMO-Chain-Hash in `logVerification`:** ID vor Payload-Build, `prev_hash`-Lookup sortiert `(created_at DESC, id DESC)`, `verification_hash` via `computeChainHash`. Export `verifyUvChainForClient`.
- `src/domain/gobd/hashChainVerifier.ts` — **Exportoberfläche erweitert:** `BpvPayload`, `BpvPayloadInput`, `UvPayload`, `UvPayloadInput`, `buildBpvPayload`, `buildUvPayload`, `sha256HexOfBase64` jetzt `export`.

### Phase 20.C
- `src/App.tsx` — Import + Route `/admin/integrity` direkt unter den bestehenden `/admin/*`-Routen.
- `docs/TECH-DEBT-SPRINT-19-BZSt-VIES-HIERARCHY.md` — Header auf **GESCHLOSSEN** + Closure-Abschnitt.

## 5. Neue Migrationen — Einzeiler

| Nr. | Datei | Zweck |
|---|---|---|
| 0038 | `ustid_verifications_source.sql` | `ADD COLUMN verification_source text NOT NULL DEFAULT 'VIES' CHECK IN ('BZST','VIES')` + Index `uv_by_source`. |
| 0039 | `hash_chain_bpv_uv.sql` | Hash-Chain-Felder (`prev_hash`, `version_hash` / `verification_hash`, `server_recorded_at`) auf BPV + UV. Canonical-JSON-Helper (`canonical_ts`, `canonical_jsonb`, `canonical_json_bpv` / `_uv`) + Compute-Funktionen (`compute_bpv_hash`, `compute_uv_hash`) + BEFORE-INSERT-Trigger (`tg_bpv_set_hash`, `tg_uv_set_hash`) + UPDATE-Schutz-Trigger + Verifier-RPCs. |

## 6. Neue RPCs

- `public.compute_bpv_hash(p_prev, p_partner_id, p_version_number, p_snapshot, p_valid_from, p_aufbewahrungs_kategorie) → text` — IMMUTABLE.
- `public.compute_uv_hash(p_prev, p_raw_http_response, p_id, p_partner_id, p_requested_ust_idnr, p_verification_status, p_verification_source, p_created_at) → text` — IMMUTABLE.
- `public.verify_bpv_chain(p_client_id uuid) → TABLE(partner_id uuid, version_number int, is_valid boolean, reason text)` — SECURITY DEFINER, GRANT TO `authenticated`. Leere Ergebnismenge = Kette ok.
- `public.verify_uv_chain(p_client_id uuid) → TABLE(verification_id uuid, is_valid boolean, reason text)` — SECURITY DEFINER, GRANT TO `authenticated`. Leere Ergebnismenge = Kette ok.
- `public.canonical_ts(timestamptz) → text` + `public.canonical_jsonb(jsonb) → text` (Helpers, IMMUTABLE).

## 7. Architektur-Entscheidungen (bindend, Sprint-20-Scope)

1. **MVP 4 Chains im Dashboard:** journal, audit, BPV, UV. `invoice_xml_archive` ist bewusst **nicht** im Scope (Sprint 21+).
2. **Role-Gate `/admin/integrity`:** owner / admin / tax_auditor. Andere Rollen → `<Forbidden />`-Display (kein Redirect).
3. **DB-SQL-Verifikation vor UI-Bau:** Schritt 20.C.0 war Production-Blocker-Check. *In dieser Sprint-Iteration DEFERRED* (Owner-Entscheidung, siehe §9).
4. **JSON-Export der Verifikations-Ergebnisse** als Betriebsprüfer-Download (`integrity-report-<clientId>-<ts>.json`).
5. **Closure TECH-DEBT-SPRINT-19-BZSt-VIES-HIERARCHY:** erreicht durch 20.A.2-Router + 20.B-Chain-Schutz + 20.C.3-UI-Sichtbarkeit.
6. **`server_recorded_at` NICHT im Hash-Payload:** DB-Timestamp per DEFAULT `now()`, schützt GoBD-Unveränderbarkeit (§ 146 AO, GoBD Rz. 58ff.) gegen client-gestempelte `created_at`-Manipulation. UPDATE-Schutz-Trigger blockt nachträgliche Mutation.

## 8. Abgeschlossene TECH-DEBT-Tickets

| Ticket | Geschlossen in | Nachweis |
|---|---|---|
| **HARDCODED-COMPANY-ID** (HIGH) | 20.A.1 | Pre-Fix-Grep bestätigte `CompanyProvider`-Mount; beide Production-Call-Sites nutzen `useCompanyId() ?? DEMO_COMPANY_ID`; Regression-Test `HardcodedCompanyId.regression.test.tsx` (5 Tests) verifiziert, dass kein `"c-demo"`-Literal mehr im UI-Baum landet. |
| **BZSt-VIES-HIERARCHY** (HIGH, rechtskritisch) | 20.A.2 + 20.B + 20.C.4 | `ustIdRouter` mit Entscheidungstabelle + Fallback, BZSt-Antworten in `ustid_verifications` persistiert, Hash-Chain schützt Source-Feld, `verifyUvChain #14` verifiziert den rechtskritischen BZST→VIES-Tamper-Fall. Closure-Abschnitt im Original-Ticket (`docs/TECH-DEBT-SPRINT-19-BZSt-VIES-HIERARCHY.md`). |

## 9. Offene TECH-DEBT-Tickets

| Ticket | Priorität | Ursprung | Datei |
|---|---|---|---|
| **DB-VERIFIKATION-PRE-DEPLOY** | **HIGH (Pre-Deploy-Blocker)** | neu aus 20.C.0 (deferred) | [`docs/tech-debt/TECH-DEBT-SPRINT-20-DB-VERIFIKATION-PRE-DEPLOY.md`](./tech-debt/TECH-DEBT-SPRINT-20-DB-VERIFIKATION-PRE-DEPLOY.md) |
| **POLICY-VERIFY** (Migration 0035 RESTRICTIVE + Trigger-Kommentar) | LOW | Sprint 19 | [`docs/TECH-DEBT-SPRINT-19-POLICY-VERIFY.md`](./TECH-DEBT-SPRINT-19-POLICY-VERIFY.md) |
| **NUMMERN-RANGE-CONFIG** | MEDIUM | Sprint 19 | [`docs/TECH-DEBT-SPRINT-19-NUMMERN-RANGE-CONFIG.md`](./TECH-DEBT-SPRINT-19-NUMMERN-RANGE-CONFIG.md) |
| **CURRENT-VERSION-POINTER** (BPV) | MEDIUM | Sprint 19 | (in [`docs/SPRINT-19-ABSCHLUSS.md`](./SPRINT-19-ABSCHLUSS.md) §9 gelistet) |
| **USE-COMPANY-ID-SEMANTIC** (null-silent Hook) | LOW | neu aus 20.B.0 | [`docs/tech-debt/TECH-DEBT-SPRINT-20-USE-COMPANY-ID-SEMANTIC.md`](./tech-debt/TECH-DEBT-SPRINT-20-USE-COMPANY-ID-SEMANTIC.md) |
| **SHA256-HELPER-CONSOLIDATION** | LOW | implizit aus 20.B (4 parallele Implementierungen bleiben bestehen) | noch kein eigenes Ticket — bei Sprint-21-Planung anlegen. |

## 10. Bewusst ausgelassen (Sprint 21+ Kandidaten)

- `invoice_xml_archive` Chain-Integration (5. Chain im Integrity-Dashboard).
- `retention_hold`-UI (Felder vorhanden auf BPV + UV, aber keine Bedien-UI).
- `current_version_pointer` auf `business_partners` (stabile Version-Referenz für Beleg-Insert; vgl. Sprint-19 VEREINFACHUNG).
- Z3-Export-Erweiterung um die 3 neuen Tabellen (BPV, UV + business_partners).
- `docs/DEBITOR-VERFAHRENSDOKUMENTATION.md` (§ 147 Abs. 6 AO).
- Nummernkreis-Konfigurierbarkeit pro Mandant.
- Audit-Trail für Duplicate-Override („Ignorieren und trotzdem speichern").
- `useRequireCompanyId()`-Variante (Throw statt Null-Silent).
- Konsolidierung der vier parallelen `sha256Hex`-Implementierungen.
- Periodic-Re-Verification der UV-Einträge (Cron-basiert).

## 11. Production-Readiness-Checkliste

- [x] `CompanyProvider` gemountet (`src/main.tsx:86–108`, Pre-Fix-Grep 20.A.1.1 bestätigt).
- [x] Keine `"c-demo"`-Literale mehr in `src/pages/` oder `src/components/` (Regression-Test 20.A.1.4).
- [x] BZSt-Calls persistent geloggt in `ustid_verifications` (Migration 0038 + Edge-Function-Refactor 20.A.2.2).
- [x] Hash-Chain auf BPV + UV (Migration 0039 DB-Trigger + Client-Side `sha256Canonical` + `hashChainVerifier`).
- [x] Integrity-Dashboard erreichbar unter `/admin/integrity` mit Role-Gate (20.C.3).
- [ ] **DB-SQL-Verifikation 5/5 PASS (20.C.0 DEFERRED)** — muss vor erstem Supabase-Deploy laufen, siehe [`TECH-DEBT-SPRINT-20-DB-VERIFIKATION-PRE-DEPLOY.md`](./tech-debt/TECH-DEBT-SPRINT-20-DB-VERIFIKATION-PRE-DEPLOY.md).
- [ ] Steuerberater-Sign-off BStBK-Bescheinigung (Sprint 21+).
- [ ] ICC-Profil + veraPDF-CI (Sprint 21+).
- [ ] Steuerberater-Sign-off zur BZSt/VIES-Routing-Logik (organisatorisch; im Closure-Abschnitt des BZSt-VIES-Tickets dokumentiert).

## 12. Rechtlicher Status nach Sprint 20

| Anforderung | Status | Nachweis |
|---|---|---|
| **§ 146 AO Unveränderbarkeit** | **erfüllt** für journal (Migration 0010), audit (0003), BPV + UV (0039). | Vier Hash-Ketten, jede mit DB-Trigger + Client-Verifier. Integrity-Dashboard macht den Status für Betriebsprüfer sichtbar und exportierbar. |
| **§ 18e UStG Nachweispflicht** | **erfüllt** | BZSt- und VIES-Antworten landen in derselben WORM-Tabelle mit `verification_source`-Discriminator. Raw-HTTP-Response als bytea für § 147 Abs. 2 Nr. 1 AO archiviert. Chain schützt Source gegen Umdeklarierung. |
| **GoBD Rz. 58ff. Tamper-Evidence** | **erfüllt** für die 4 Chains | `server_recorded_at` vom DB-Default, nicht Client-Payload; UPDATE-Schutz-Trigger blockieren nachträgliche Mutation der Chain-Felder. |
| **GoBD Rz. 44 Belegprinzip** | unverändert erfüllt (Belege-Tabelle + Journal-Link seit Sprint 16 + 19). | — |
| **§ 147 AO 10-J-Archivierung** | teilweise erfüllt | Retention-Felder auf BPV + UV gesetzt; `retention_hold`-Workflow-UI **offen** (Sprint 21+). |

## Verifikation zum Sprint-Abschluss

```
cd D:/harouda-app
NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit   # clean
NODE_OPTIONS=--max-old-space-size=8192 npx vitest run     # 1979 / 195 green
```

Kein `git commit`, kein Push — konsistent mit Sprint-Arbeitsregeln.

**Sprint 20 abgeschlossen.** Produktivbetrieb blockiert durch
einen HIGH-Punkt (DB-SQL-Verifikation auf Staging vor Deploy), alle
anderen Production-Readiness-Checks sind technisch erfüllt.
