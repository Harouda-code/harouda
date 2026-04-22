# Sprint Nacht-Modus 2026-04-21 — Abschluss

**Abgeschlossen:** 2026-04-21 · Autonomer Langlauf · 5 Teil-Schritte.
**End-Stand:** **1254 Tests grün / 105 Test-Dateien** · tsc clean.
**Scope:** B (AnlageAV, Anlage Vorsorge, Mobilitätsprämie, Cross-Module-Smoke).

Dieses Dokument ergänzt `docs/SPRINT-MULTITENANCY-PHASE-3-ABSCHLUSS.md` (Phase 3) — es setzt die Phase-3-Infrastruktur (estStorage V3, archivEstImport, ArchivImportModal) in zwei weiteren Anlagen fort und prüft die Cross-Module-Konsistenz.

---

## 1. Ziel

Phase 3 hat AnlageG/S/N angeschlossen. Dieser Sprint erweitert den ESt-Anlagen-Fuhrpark um drei weitere Pages und verankert mit einem Relational-Consistency-Test, dass die Datenflüsse Lohn → FIBU → AnlageG intakt sind.

## 2. Schritt-Changelog

| # | Thema | Kern-Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **AnlageAV Stammdaten-Store** | `avVertraegeStore.ts` (CRUD, jahr-unabhängiger Key) · AnlageAVPage: Vertraege-Sektion + Modal · `docs/TECH-DEBT-AV-VERTRAEGE-SUPABASE.md` | +10 |
| 2 | **Anlage Vorsorge SV-AN-Breakdown** | `importAnlageVorsorgeAusArchiv` + `AnlageVorsorgeVorschlag` · ArchivImportModal mit `variant`-Prop · AnlageVorsorgePage: Import-Button + Banner + 5-Feld-Mapping | +8 |
| 3 | **AnlageMobilitätspraemie** | Page war voll implementiert (Phase 1 Schritt 3b), nur Integration-Tests ergänzt | +2 |
| 4 | **Cross-Module-Smoke** | `cross-module-lohn-to-anlage-g.smoke.test.tsx` · Relational-Consistency-Checks (keine hartkodierten Euro-Zahlen) | +2 |
| 5 | **Abschluss + Regression-Gate** | Dieses Dokument + OPEN-QUESTIONS + Spot-Check-Tabelle | 0 |

## 3. Test-Count-Trajectory

| Punkt | Tests | Δ | Files |
|---|---:|---:|---:|
| Phase-3-Ende | 1232 | — | 100 |
| Schritt 1 (AnlageAV) | 1242 | +10 | 102 |
| Schritt 2 (Vorsorge) | 1250 | +8 | 103 |
| Schritt 3 (Mobilität) | 1252 | +2 | 104 |
| Schritt 4 (Cross-Module) | 1254 | +2 | 105 |
| Schritt 5 (Abschluss) | **1254** | 0 | 105 |
| **Σ Sprint** | **+22** | | **+5** |

**Gesamt-Session-Trajectory:** `995 → 1254` (+259 Tests, F42 + Multi-Tenancy Phase 1 + Phase 2 + Phase 3 + Nacht-Modus).

## 4. Neue Module + Komponenten

| Pfad | Zweck | LOC |
|---|---|---:|
| `src/domain/est/avVertraegeStore.ts` | Jahr-unabhängiger Stammdaten-Store · CRUD · Mandant-Isolation | 92 |
| `src/domain/est/__tests__/avVertraegeStore.test.ts` | 8 Tests (CRUD, Fallback, Safety) | 108 |
| `src/domain/est/archivEstImport.ts` | +`importAnlageVorsorgeAusArchiv` + `AnlageVorsorgeVorschlag` | +85 |
| `src/components/ArchivImportModal.tsx` | `variant`-Prop + diskriminierte Props-Union | +20 |
| `src/pages/AnlageAVPage.tsx` | Vertraege-Stammdaten-Sektion + Add-Modal | +160 |
| `src/pages/AnlageVorsorgePage.tsx` | Import-Button + Banner + 5-Feld-Mapping | +70 |
| Tests für neue + bestehende Pages | 3 neue Integration-Test-Files | 430+ |
| `src/__tests__/cross-module-lohn-to-anlage-g.smoke.test.tsx` | Relational-Consistency-Smoke (API-Only) | 330 |
| **Dokus** | 5 Schritt-Berichte + Abschluss + Tech-Debt + OPEN-QUESTIONS | — |

## 5. Bewusste Design-Entscheidungen

- **AnlageAV Stammdaten-Store ist additiv** — die bestehende BMF-Kz-Struktur in `PersonData.optout_v1/v2/widerruf_v` bleibt unberührt. Der neue Store ist die „jahr-stabile persönliche Vertrags-Akte"; die inline-Vertragsnummern bleiben BMF-Kz-gebunden.
- **Modal-Variant als diskriminierte Props-Union** — TypeScript erzwingt, dass bei `variant="anlage-vorsorge"` nur `AnlageVorsorgeVorschlag` als `onImport`-Payload akzeptiert wird. Interner Cast beim Dispatch auf die generische Runtime-Union.
- **Relational-Consistency statt Snapshot-Assertions** — Cross-Module-Test rechnet alle Summen zur Laufzeit aus Seeds. Keine hartkodierten Euro-Zahlen → überlebt jede Refactor-Welle, solange die Pipeline-Mechanik intakt bleibt.
- **`status="entwurf"`-Simulation im Cross-Module-Test** — Lohn-Entries werden laut Phase-2-Design als Entwurf geschrieben; der Builder filtert auf „gebucht". Der Test setzt den Status explizit auf „gebucht" (simuliert Admin-Freigabe) — offene Frage #2.

## 6. Rechtsbasis

- AnlageAV: § 10 Abs. 1 Nr. 2 + 3a EStG · Bescheinigungen nach § 22a EStG.
- Anlage Vorsorge: § 10 Abs. 1 Nr. 2a (Basisvorsorge) + Nr. 3 (KV/PV) EStG.
- Mobilitätsprämie: § 101 EStG.
- Cross-Module-Consistency: § 146 AO (GoBD-Unveränderbarkeit), Konsistenz FIBU ↔ Steuererklärung.

## 7. Offene Fragen

Dokumentiert in `docs/OPEN-QUESTIONS-NACHT-2026-04-21.md`:

| # | Thema | Dringlichkeit |
|---|---|---|
| 1 | KV-Zusatzbeitrag-Mapping in AnlageVorsorge (Summe vs. separater Slot) | niedrig |
| 2 | Entwurf-vs-Gebucht-Filterung in Anlage G (UX vs. GoBD) | mittel |

Beide mit defensiven Default-Annahmen umgesetzt; Review durch Steuerberater empfohlen.

## 8. Offen / verschoben

| Punkt | Begründung |
|---|---|
| **AV-Vertraege Supabase-Migration** | Dokumentiert in `docs/TECH-DEBT-AV-VERTRAEGE-SUPABASE.md`. Nicht blockierend. |
| **VaSt-eDaten-Bescheinigungsabruf (§ 22a EStG)** | Orthogonal zur Persistenz. Eigener Sprint. |
| **Ehepartner-Cross-Reference über zwei Mandant-Datensätze** | Aktuell Boolean-Flag; späterer FK. |
| **Anlage Vorsorge: Anlage AV als „bereits erfasst"-Indikator** | Cross-Page-UX, orthogonal. |
| **AnlageV (Vermietung)** | Phase-3-Altlast. Objekt-Konvention nötig. |
| **AnlageKap / AnlageSonder / AnlageAgB** | Strukturell MANUELL-PFLICHT (Phase-3-Entscheidung). |

## 9. Konsistenz-Check CLAUDE.md + README

**CLAUDE.md** — Grep auf `avVertraegeStore`, `importAnlageVorsorge`, `AnlageMobilit`, `Cross-Module-Smoke`: **0 Treffer**. §5-Repo-Tree erwähnt `domain/` generisch, §6-Feature-Map ist weiterhin korrekt. **Keine Änderung.**

**README.md** — Grep auf `Anlage AV`, `Anlage Vorsorge`, `Mobilitätsprämie`, `Cross-Module`: **0 Treffer**. Line 3 nennt „Anlage N" im Feature-Text — keine Kollision. **Keine Änderung.**

## 10. Spot-Check-Tabelle

| # | Datei | Status |
|---|---|---|
| 1 | `src/pages/__tests__/AnlageGPage.integration.test.tsx` (Phase-3-Altlast) | ✓ |
| 2 | `src/pages/__tests__/AnlageNPage.integration.test.tsx` (Phase-3-Altlast) | ✓ |
| 3 | `src/components/__tests__/DrillDownModal.test.tsx` (Phase-3-Altlast) | ✓ |
| 4 | `src/pages/__tests__/AnlageAVPage.integration.test.tsx` (neu) | ✓ |
| 5 | `src/domain/est/__tests__/avVertraegeStore.test.ts` (neu) | ✓ |
| 6 | `src/pages/__tests__/AnlageVorsorgePage.integration.test.tsx` (neu) | ✓ |
| 7 | `src/pages/__tests__/AnlageMobilitaetspraemiePage.integration.test.tsx` (neu) | ✓ |
| 8 | `src/__tests__/cross-module-lohn-to-anlage-g.smoke.test.tsx` (neu) | ✓ |

**Σ Spot-Check:** 8 Files · 28 Tests · 6.57 s · **0 failed, 0 skipped**.

## 11. Sprint-Signatur

| Feld | Wert |
|---|---|
| **Datum** | 2026-04-21 |
| **Start-Test-Count** | 1232 (Phase-3-Ende) |
| **End-Test-Count** | **1254** (0 failed, 0 skipped) |
| **Δ Sprint** | +22 Tests, +5 Files |
| **Δ Session (gesamt, seit 995)** | **+259 Tests** |
| **Neue Migrationen** | 0 |
| **Neue Module / Komponenten** | `avVertraegeStore.ts` · `AnlageVorsorgeVorschlag` + Importer · `ArchivImportModal`-Variant |
| **Schritt-Berichte** | `docs/SPRINT-NACHT-2026-04-21-SCHRITT-{1..4}.md` |
| **Abschluss-Doku** | `docs/SPRINT-NACHT-2026-04-21-ABSCHLUSS.md` (dieses Dokument) |
| **Tech-Debt** | `docs/TECH-DEBT-AV-VERTRAEGE-SUPABASE.md` |
| **Open Questions** | `docs/OPEN-QUESTIONS-NACHT-2026-04-21.md` (2 Fragen) |
| **End-tsc-Status** | clean (Exit 0, 8192 MB) |
| **End-Test-Laufzeit (voll)** | 59.57 s |
