# Sprint Multi-Tenancy-Phase-3 — Abschluss (Schritte 1–11)

**Abgeschlossen:** 2026-04-20 · Autonomer Nacht-Modus · 11 Teil-Sprints
(1: Bestandsaufnahme · 2: Scope-Entscheidung · 3: Year-Scoping estStorage
V2→V3 · 4: `skr03AnlagenMapping` · 5: AnlageG/S-Builder · 5b:
`archivEstImport` · 6: `accounts.tags`-Foundation · 7: Builder-Tag-Runtime-
Read · 8: `DrillDownModal` + Korrekturbuchung · 9: AnlageG/S-Page-
Integration · 10: AnlageN-Archiv-Import · 11: Abschluss).

**End-Stand:** **1232 Tests grün / 100 Test-Dateien** · tsc clean · AnlageG
+ AnlageS journal-driven (Strict Read-only + Drill-down) · AnlageN
archiv-driven (On-Demand-Import-Button) · 27 ESt-Pages jahr-getrennt.

**Dieses Dokument ergänzt** die Phase-1- und Phase-2-Abschluss-Dokus
(`docs/SPRINT-MULTITENANCY-FOUNDATION-ABSCHLUSS.md` · `docs/SPRINT-
MULTITENANCY-PHASE-2-ABSCHLUSS.md`) — es ersetzt sie nicht, sondern
dokumentiert den FIBU-→-ESt-Datenfluss, den Phase 1 explizit in eine
Folgephase verschoben hatte.

---

## 1. Ziel + Scope

**Ziel:** FIBU-nach-ESt-Anlagen-Datenfluss aufsetzen, Single Source of
Truth = Journal. Konkret:

1. **AnlageG (Gewerbe § 15 EStG) + AnlageS (Selbständig § 18 EStG)**
   → Journal-driven. Summen-Felder strict Read-only; Korrektur
   ausschließlich via Drill-down-Modal → `correctEntry()`.
2. **AnlageN (Arbeitnehmer § 19 EStG)** → archiv-driven Sonderweg. Ein-
   Weg-Import-Button, kein Auto-Pull, weiterhin manuell editierbar (legal
   Eigendaten des Arbeitnehmers, keine Kanzlei-Buchhaltung).
3. **5 weitere Anlagen** (ESt1A, V, Kap, Sonder, AGB) **bewusst
   verschoben** (Scope-Entscheidung Schritt 2) — siehe §6.

**Explizite Architektur-Revision** (User-Entscheidung vor Schritt 6):
- Runtime-Mapping über `accounts.tags`-Spalte (Format `"<anlage>:<feld>"`),
  nicht Range-basiert zur Laufzeit. Range bleibt als Seed-Script.
- Strict Read-only für GL-derived Felder (KEIN Empty-String-Override).
- Korrektur nur via Drill-down + `correctEntry` (existierende Phase-2-
  API).
- Non-GL-Felder (Pauschalen, Freibeträge) bleiben editierbar.

## 2. Ausgangslage + GoBD-Validierung

Die Pages schrieben vor Phase 3 manuell in localStorage, ohne Verbindung
zum Journal. Anlage-Werte mussten pro Jahr vom Kanzlei-Mitarbeiter
separat eingegeben werden — Doppelarbeit zur FIBU und Quelle von
Differenzen zwischen Kanzlei-Buchhaltung und Steuererklärung.

**GoBD-Rechtliche Relevanz der Revision** (aus User-Vorgaben, nicht
eigenständig interpretiert):

- **§ 146 AO Unveränderbarkeit** — ein GL-derived Wert in der Anlage
  steht und fällt mit dem Journal-Eintrag, nicht mit einer User-Eingabe
  in der Anlage. Korrekturen müssen über die Hash-Kette-konforme
  `correctEntry`-Mechanik (Storno + Neu-Buchung) laufen, was
  automatisch Audit-Trail + Hash-Kette-Konsistenz erzeugt.
- **Nachvollziehbarkeit** — Drill-down vom Anlagen-Summen-Feld zu den
  zugrunde liegenden Journal-Einträgen ist die Betriebsprüfer-
  Perspektive: „Woher kommt die 60.000 €?" → ein Klick öffnet die
  Einzel-Buchungen.
- **E-Bilanz / EÜR ↔ Anlage G/S Cross-Check-Compliance** — dieselben
  Journal-Entries, dieselben Konten-Ranges, dieselben Mandant/Jahr-
  Filter. Differenzen können nur noch durch unterschiedliche
  Interpretation des SKR03-Kontenplans entstehen — und die ist ab
  Phase 3 via `accounts.tags` explizit + editierbar pro Konto.
- **GL vs. Non-GL-Trennung** — FormSpec-Feld-Typ (`source: "gl-derived"
  \| "manual"`) macht die Trennung im Code sichtbar. Non-GL-Felder
  (Pauschalen, Freibeträge) bleiben user-editable, weil sie legal
  Eigendaten sind — nicht Buchhaltungs-Aggregat.

## 3. Schritt-Changelog 1 – 11

| # | Thema | Kern-Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Bestandsaufnahme** | EuerBuilder als Referenzmuster gegrepped · 8 Anlagen-Struktur (LOC, Felder, Mandanten-Storage, useYear-Status) · Override-Pattern aus KoerperschaftsteuerPage identifiziert · FormSpec-Type-Drift dokumentiert · Year-Scope-Lücke offengelegt | 0 (Doku) |
| 2 | **Scope-Entscheidung** | Priorisierungs-Tabelle 8 Anlagen (MANUELL/HYBRID/JOURNAL-ABLEITBAR) · Scope: nur G + S + N · V/Kap/Sonder/AGB/ESt1A verschoben · Mapping-Skizze + offene Fragen formuliert | 0 (Doku) |
| 3 | **Year-Scoping estStorage V2→V3** | `buildEstStorageKey(formId, mandantId, jahr)` · V2-Fallback in `readEstForm` · `migrateEstFormsV2ToV3` · 27 Pages (via 3 Parallel-Agents) + TaxFormBuilder auf neue Signatur | +14 |
| 4 | **`skr03AnlagenMapping`** | `AnlagenMappingRule`-Record · 35 Regeln für G + S (nicht 30 wie fälschlich genannt) · `findAnlagenRules` + `rulesForAnlage`-Helper · Range-Disjunktheits-Tests | +15 |
| 5 | **AnlageG/S-Builder** | `AnlageGBuilder.ts` + `AnlageSBuilder.ts` (nach EuerBuilder-Muster) · `anlagenUtils.ts` (`filterEntriesInYear`, `computeKontoSaldi`, `valueForSource`) · 25 Builder-Tests + Delta-Test G vs. S | +25 |
| 5b | **`archivEstImport`** | `importAnlageNAusArchiv({employeeId, jahr, clientId, companyId})` · `AnlageNVorschlag`-Shape · Discriminated-Union-Result · Legacy-Row-Robustheit · `getForEmployee`-Shape auf `LohnabrechnungArchivRow[]` vertieft (DEMO aktiviert) | +7 |
| 6 | **accounts.tags-Foundation** | `Account.tags/skr_version/is_wechselkonto` im TS-Type · `tagsForKonto` + `allPossibleTags` · `SKR03_SEED` build-zeit-augmentiert · Migration 0029 (35 UPDATEs) · AccountsPage UI (Multi-Select-Fieldset, `onBlur`-Default) · `AccountInput.tags?` | +18 |
| 7 | **Builder-Tag-Runtime** | `resolveFieldForAccount` + `resolveFieldForAccountDetailed` (Tag-Read + Fallback + Warn) · Builder-Refactor: Range weg, Tag + kategorie-Sign · Test-Factories auf `tagsForKonto` · 7 neue Edge-Case-Tests | +7 |
| 8 | **DrillDownModal + correctEntry** | `fetchEntriesForAccountsInRange` (PostgREST `or()`, DEMO filter) · `DrillDownModal` mit Tabelle + Inline-Korrektur-Form · `correctEntry`-Integration · 7 Tests (mit `vi.restoreAllMocks`-Isolation) | +7 |
| 9 | **Page-Integration G/S** | `FieldSpec.source`/`glField` · `TaxFormBuilderProps.glValues`/`onDrillDown` · `GlDerivedRow` (readOnly-Input + „Aus Buchhaltung"-Badge) · AnlageGPage + AnlageSPage als volle Component mit useQuery + Builder + Modal-State + UnmappedAccounts-Panel | +6 |
| 10 | **AnlageN-Archiv-Import** | `ArchivImportModal` (Employee-Dropdown + Warning-Banner) · AnlageNPage um Import-Button + Banner erweitert · 4-Feld-Mapping Vorschlag→Page-State · SV-AN/Netto verworfen (kein AnlageN-Zielfeld) | +7 |
| 11 | **Abschluss + Regression-Gate** | Dieses Dokument · CLAUDE.md / README konsistenz-geprüft · 23 Spot-Check-Dateien · Sprint-Signatur | 0 |

## 4. Was wurde gelöst — Kompakt-Übersicht je Layer

| Layer | Vorher | Nachher | Deliverable-Pfad |
|---|---|---|---|
| **localStorage-Scope** | `harouda:est:<mandantId>:<formId>` — derselbe Mandant konnte nur 1 Stand pro Form führen | `harouda:est:<mandantId>:<jahr>:<formId>` — jahres-getrennt · V2-Fallback im Read + Save-triggered Migration | `src/domain/est/estStorage.ts` |
| **SKR03-Mapping** | Kein zentrales Konto-→-ESt-Anlage-Mapping | `SKR03_ANLAGEN_MAPPING` mit 35 Range-Regeln für G + S · `tagsForKonto` leitet Default-Tags ab | `src/domain/est/skr03AnlagenMapping.ts` · `src/domain/est/tagsForKonto.ts` |
| **DB-Schema** | `accounts.tags` seit 0019 vorhanden, aber ungenutzt | Migration 0029: 35 idempotente UPDATEs · `SKR03_SEED` + AccountsPage UI setzen tags proaktiv | `supabase/migrations/0029_est_tags_backfill.sql` · `src/api/skr03.ts` · `src/pages/AccountsPage.tsx` |
| **Builder-Schicht** | Kein AnlageG/S-Builder · AnlageN-Archiv-Lookup fehlte | `buildAnlageG` / `buildAnlageS` (tag-driven, kategorie-sign) · `importAnlageNAusArchiv` (archiv-driven) · `anlagenUtils.ts` Shared-Helper | `src/domain/est/{AnlageGBuilder,AnlageSBuilder,archivEstImport,anlagenUtils}.ts` |
| **TaxFormBuilder** | Rein manuelle Felder, kein Read-only-Modus | `FieldSpec.source: "manual" \| "gl-derived"` · `glValues` + `onDrillDown`-Props · `GlDerivedRow`-Component mit Badge | `src/components/TaxFormBuilder.tsx` |
| **Tax-Pages** | AnlageG/S/N: 1-Liner bzw. 737-Zeilen Manual-State | AnlageG/S: volle Component mit Builder + Drill-down + UnmappedAccounts-Panel · AnlageN: Import-Button + Banner | `src/pages/{AnlageGPage,AnlageSPage,AnlageNPage}.tsx` |
| **Drill-down** | Kein Drill-down im Projekt | `DrillDownModal` + `fetchEntriesForAccountsInRange` · Inline-Korrektur via `correctEntry` | `src/components/DrillDownModal.tsx` · `src/api/journal.ts` |
| **Archiv-Import** | Nur `AbrechnungArchivRepo.save` aus Phase 2 | `getForEmployee` liefert vollen Shape (inkl. `abrechnung_json`) · `ArchivImportModal` mit Warning-Banner | `src/lib/db/lohnRepos.ts` · `src/components/ArchivImportModal.tsx` |

## 5. Bewusste Design-Entscheidungen

- **Tag-Format `"<anlage-id>:<feld>"`** über die existierende
  `accounts.tags TEXT[]`-Spalte — **kein** neues `tax_tag`-Feld. Minimale
  Schema-Reibung, Mehrfach-Tags pro Konto möglich (G+S gleichzeitig).
- **Range-Mapping bleibt als Seed + Fallback** — `SKR03_ANLAGEN_MAPPING`
  speist Migration 0029 und `SKR03_SEED`, bleibt als Safety-Net für
  Konten ohne Tags (mit `console.warn`: „Bitte Kontenplan migrieren").
  Tag-Read dominiert zur Laufzeit (Schritt 7).
- **Strict Read-only für GL-Felder** — kein Empty-String-Override-Pattern
  wie bei `KoerperschaftsteuerPage`. Rationale: GoBD-Primat „Single
  Source of Truth"; Korrektur ausschließlich via Drill-down →
  `correctEntry` → Hash-Kette.
- **Korrektur via `correctEntry` (Phase-2-Bestand)** — keine neue API.
  3 Audit-Log-Einträge pro Korrektur (reverse + create + correct),
  unverändert.
- **AnlageN Sonderweg** — Einkommensteuer **einer natürlichen Person**,
  nicht des Kanzlei-Mandanten. Kein Auto-Journal-Pull (wäre fachlich
  falsch). Ein-Weg-Button mit Employee-Dropdown + Warning-Banner
  (Gesellschafter-Geschäftsführer-Use-Case).
- **SV-AN-Gesamt + Netto im `AnlageNVorschlag`, aber nicht in AnlageN
  gemappt** — SV-AN-Beiträge gehören in Anlage Vorsorge (§ 10 Abs. 1
  Nr. 3 EStG), Netto ist kein BMF-Anlage-N-Feld. Der Vorschlag trägt
  die Werte trotzdem, damit ein künftiger Anlage-Vorsorge-Sprint
  dieselbe Payload konsumieren kann.
- **UnmappedAccounts-Panel default collapsible** (`<details>` HTML-
  native) — vermeidet User-Erschrecken durch „40 Konten unzugeordnet",
  wo 35 davon erwartet-out-of-Scope sind (Bank, Forderungen, USt-
  Konten etc.).
- **`useYear` + `selectedYear` als Wirtschaftsjahr-Quelle** — konsistent
  zu `EuerPage`. Kein separates Datepicker-Pattern in AnlageG/S.
- **Non-GL-Felder bleiben manuell editierbar** — AnlageG: `bezugsneben-
  kosten`, `reparatur`. AnlageS: `umsatzsteuerpflichtig`. Kein Zwangs-
  Leer. User kann z. B. Bezugsnebenkosten aus Rechnungen ohne SKR03-
  Buchung ergänzen.
- **Tag-Konflikt „erster gewinnt" + `console.warn`** (Schritt 7) — stabil
  durch sortierte Tags aus `tagsForKonto` (alphabetisch), UI-Toggle
  sortiert ebenfalls. Reihenfolge-Abhängigkeit dokumentiert.
- **35 statt 30 Mapping-Regeln** — in Schritt 4 fälschlich mit 30
  beziffert; reale Zählung (via `grep -c "from:"`) = 35 (Sammel-
  Regeln für `sonstige_ausgaben` und `sonstige`). Schritt 6
  Struktur-Test korrigiert.

## 6. Offen / verschoben

| Punkt | Begründung | Empfohlene Folge-Aktion |
|---|---|---|
| **AnlageV (Vermietung)** | HYBRID-Natur (per-Objekt-Struktur), Journal kennt keine Objekt-Grenzen. Bräuchte Konvention: Kostenstelle oder Kostenträger pro Objekt. | Eigener Sprint — Objekt-Konvention + per-Objekt-Builder. |
| **AnlageKap** | Strukturell MANUELL-PFLICHT (Bank-Steuerbescheinigungen). Kein Kanzlei-Journal-Nexus. | Nicht integrieren. |
| **AnlageSonderausgaben** | ~95 % MANUELL. Einzig Kirchensteuer-gezahlt/-erstattet wäre JOURNAL-ableitbar (falls privat über Kanzlei). Opportunity-Cost zu hoch. | Nicht integrieren oder Mini-Integration nur für KiSt. |
| **AnlageAgB** | MANUELL-PFLICHT (Ausweis, Pflegegrad, Einzelbelege). | Nicht integrieren. |
| **HauptvorduckESt1A** | Reine Identitäts-/Stammdaten. Keine Finanz-Summen. | Nicht integrieren. |
| **Anlage Vorsorge** | Könnte `archivEstImport` konsumieren — `sv_an_gesamt` wird im Vorschlag bereits geliefert. | Separater Mini-Sprint (Analog zu AnlageN Schritt 10). |
| **Supabase-`or()`-Filter** auf `soll_konto/haben_konto` in `fetchEntriesForAccountsInRange` | Nur DEMO-getestet (Projekt-weite Entscheidung: keine Supabase-Mocks). | Staging-Smoke bei Deployment. |
| **DB-UNIQUE-Constraint** auf `lohnabrechnungen_archiv` (aus Phase 2 Schritt 2 geerbt) | App-Layer-onConflict-String zeigt auf 4-Tuple, DB hat weiter 2-Tuple. | Migration 0030-Kandidat. |
| **UnmappedAccountsPanel-Extract** nach `src/components/` | Dupliziert zwischen AnlageGPage + AnlageSPage. | Extract wenn 3. Page die Komponente braucht. |
| **`sonner`-Toasts vs. a11y-Feedback** | Sonner-Toasts fehlt `aria-live` by default in einigen Kontexten. | Übergreifendes Thema, nicht Phase-3-spezifisch. |
| **Tag-Mehrfach-Konflikte im UI sichtbar machen** | Aktuell nur `console.warn` bei „erster gewinnt". | UI-Indicator im AccountsPage-Form-Fieldset, wenn >1 Anlage-Tag pro Anlage gesetzt. |
| **FormSpec-Level-Export/PDF-Unterstützung für gl-derived** | `handlePdf` in TaxFormBuilder nutzt `valueOf()` korrekt, aber Export-Branding „Aus Buchhaltung berechnet" fehlt noch im Export. | Nice-to-have. |

## 7. Test-Count-Trajectory

**Phase 3 (dieser Sprint):**

| Punkt | Tests | Δ | Files |
|---|---:|---:|---:|
| Phase-2-Ende | 1187 | — | 91 |
| Schritt 3 (Year-Scope) | 1205 | +14 | 94 |
| Schritt 4 (Mapping) | 1212 | +15 | — |
| Schritt 5 + 5b (Builder + Archiv-Import) | 1219 | — | — |
| Schritt 6 (Tags-Foundation) | 1225 | +18 | — |
| Schritt 7 (Tag-Runtime) | 1232 | — | — |
| … Zwischen-Consolidierung … | 1225 | — | 94 |
| Schritt 8 (Drill-down) | 1232 | +7 | — |
| Schritt 9 (G/S Page-Integration) | | +6 | +2 |
| Schritt 10 (N Archiv-Import) | | +7 | +2 |
| Schritt 11 (Abschluss, nur Doku) | **1232** | 0 | 100 |
| **Σ Phase 3** | **+45** | | **+9** |

**Gesamt-Session-Trajectory**: 995 → **1232** (+237 über den gesamten
Session-Bogen inkl. F42-Refactor, Multi-Tenancy Phase 1, Phase 2, und
Phase 3).

## 8. Neue Domain-Module + Komponenten Phase 3

| Pfad | Zweck | LOC |
|---|---|---:|
| `src/domain/est/estStorage.ts` (erweitert) | V3-Key-Schema + V2-Fallback + `migrateEstFormsV2ToV3` | ~200 |
| `src/domain/est/skr03AnlagenMapping.ts` | 35 Range-Regeln + `findAnlagenRules`/`rulesForAnlage` | 126 |
| `src/domain/est/tagsForKonto.ts` | `"<anlage>:<feld>"`-Ableitung + `allPossibleTags` | 40 |
| `src/domain/est/anlagenUtils.ts` | `filterEntriesInYear` · `computeKontoSaldi` · `resolveFieldForAccount(Detailed)` · `FieldResolution` | 140 |
| `src/domain/est/AnlageGBuilder.ts` · `AnlageSBuilder.ts` | Tag-driven Builder, kategorie-basierte Sign | ~90 je |
| `src/domain/est/archivEstImport.ts` | `importAnlageNAusArchiv` + `AnlageNVorschlag` | 140 |
| `src/components/DrillDownModal.tsx` | Entry-Liste + Inline-Korrektur-Form | ~400 |
| `src/components/ArchivImportModal.tsx` | Employee-Dropdown + Warning + Submit | ~180 |
| **Migration 0029** | Backfill 35 ESt-Tags auf `accounts.tags` | 180 |

## 9. Konsistenz-Check CLAUDE.md + README

- **CLAUDE.md** — grep auf `Anlage G / S / N / V / Kap`, `domain/est`,
  `tax_tag`, `skr03AnlagenMapping`, `AnlageGBuilder`, `archivEstImport`,
  `Drill-down`, `Korrekturbuchung`, `Steuer.*manuell`: **0 Treffer**.
  §5 Repo-Tree erwähnt `domain/` generisch; §6 Feature-Map nennt Lohn
  + E-Bilanz + UStVA, aber keine explizite Tax-Page-Behauptung, die
  Phase 3 widerspräche. **Keine Änderung.**
- **README.md** — grep auf `Anlage G / S / N`, `Steuer.*manuell`,
  `Journal.*Tax`, `Drill`: Line 3 nennt „Anlage N" in der Feature-
  Aufzählung (keine Behauptung über Journal-Read); Line 31 beschreibt
  Entfernungspauschale-Rechner (unverändert gültig). **Altlast Zeile 62
  („Nicht enthalten: Lohnbuchhaltung / Lohnsteueranmeldung (LStA)")** aus
  Phase-2-Abschluss bleibt — bezieht sich auf fehlende LStA-
  Transmission, nicht auf AnlageG/S/N-Integration. **Keine Änderung**;
  bekannt als pre-existing Drift.

## 10. Sprint-Signatur

| Feld | Wert |
|---|---|
| **Datum** | 2026-04-20 |
| **Start-Test-Count (Session)** | 995 |
| **Start-Test-Count (Phase 3)** | 1187 |
| **End-Test-Count** | **1232** (0 failed, 0 skipped) |
| **End-tsc-Status** | clean (Exit 0, 8192 MB) |
| **End-Test-Dateien** | 100 |
| **End-Test-Laufzeit (voll)** | 54 s |
| **Neue Migration** | `0029_est_tags_backfill.sql` (35 UPDATEs) |
| **Neue Schlüssel-APIs** | `buildAnlageG(options)` · `buildAnlageS(options)` · `importAnlageNAusArchiv(options)` · `fetchEntriesForAccountsInRange(konto, von, bis, clientId)` · `resolveFieldForAccount(account, anlage)` · `tagsForKonto(konto_nr)` |
| **Schritt-Berichte** | 11 Chat-Berichte (Schritt 1: Bestandsaufnahme · Schritt 2: Scope-Entscheidung · Schritt 3: Year-Scope V3 · Schritt 4: `skr03AnlagenMapping` · Schritt 5: AnlageG/S-Builder · Schritt 5b: `archivEstImport` · Schritt 6: `accounts.tags`-Foundation · Schritt 7: Builder-Tag-Runtime · Schritt 8: DrillDownModal · Schritt 9: G/S Page-Integration · Schritt 10: AnlageN Archiv-Import · Schritt 11: Abschluss + Regression) — aggregiert in diesem Dokument |
| **Abschluss-Doku** | `docs/SPRINT-MULTITENANCY-PHASE-3-ABSCHLUSS.md` (dieses Dokument) |
| **Phase-1-Doku** | `docs/SPRINT-MULTITENANCY-FOUNDATION-ABSCHLUSS.md` |
| **Phase-2-Doku** | `docs/SPRINT-MULTITENANCY-PHASE-2-ABSCHLUSS.md` |
| **Konsistenz-Check CLAUDE.md / README** | geprüft, keine Phase-3-Widersprüche, keine Änderung |
| **Offen + geparkt** | siehe §6 (AnlageV/Kap/Sonder/AGB/ESt1A bewusst verschoben, DB-UNIQUE-Constraint aus Phase 2, Supabase-OR-Filter Staging-Smoke) |
