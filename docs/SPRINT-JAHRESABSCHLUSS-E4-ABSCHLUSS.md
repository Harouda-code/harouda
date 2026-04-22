# Sprint Jahresabschluss-E4 — Real-Builder-Adapters + XBRL-Multi-Version + PDF/A-3 + End-to-End

**Abgeschlossen:** 2026-04-23 · Autonomer Langlauf · 5 Schritte.
**End-Stand:** **1460 Tests grün / 137 Test-Dateien** · tsc clean.
**Scope:** E4 — letzter Sprint der Jahresabschluss-Serie (E1 + E2 + E3a +
E3b + E4). Nach diesem Sprint ist der Generator produktions-ready
im Rahmen der dokumentierten Grenzen (siehe `docs/JAHRESABSCHLUSS-SERIE-
GESAMT-ABSCHLUSS.md`).

---

## 1. Ziel + Rechtsbasis

**Ziel:** Schluss der Implementation:
1. Die Platzhalter-Tabellen aus E3b durch echte Adapter-Layer ersetzen,
   die Bilanz/GuV/Anlagenspiegel aus den bestehenden Domain-Buildern
   nutzen.
2. Taxonomie-Version-Infrastruktur für Multi-Version-XBRL einführen
   (6.6/6.7/6.8/6.9).
3. PDF/A-3 als opt-in-Langzeitarchivierung per pdf-lib-Post-Processing
   (Synergie mit bestehendem ZUGFeRD-Pattern).
4. End-to-End-Smoke-Tests für 3 Hauptflüsse.

**Rechtliche Basis:**
- **§ 147 AO** — Aufbewahrungspflicht 10 Jahre (PDF/A-3 ist das
  anerkannte Format für elektronische Archivierung).
- **§ 5b EStG** — E-Bilanz-Pflicht mit jeweils gültiger Taxonomie.
- **§ 266/275 HGB** — strukturelle Darstellung der Bilanz/GuV
  (bereits in den Domain-Buildern implementiert; E4 reicht sie
  ins PDF durch).
- **GoBD Rz. 58** — Selectable-Text (bleibt durch pdfmake-Vector
  erhalten, auch nach pdf-lib-Post-Processing).
- **GoBD-Prinzip "Unveränderbarkeit"** — PDF/A-3 mit eingebettetem
  Zeitstempel + Metadata liefert die dokumentarische Basis.

**Zielgruppe:** unverändert — volle Abdeckung für Kapitalgesellschaften
mittel + groß. Einzelunternehmen bekommt EÜR-Platzhalter-Pfad (nicht
Scope E4).

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **FinancialStatementsAdapter** | `pdf/FinancialStatementsAdapter.ts` · 3 Adapter-Funktionen (Bilanz, GuV, Anlagenspiegel) · Integration in `DocumentMergePipeline` über optionale `*Report`-Felder · Threading in `StepReview.buildPdfInputFromWizardState` via neuen `reports`-Parameter | +9 |
| 2 | **XBRL-Multi-Version-Infrastruktur** | `ebilanz/hgbTaxonomie.ts` · `HGB_TAXONOMIE_VERSIONEN` Register · `pickTaxonomieFuerStichtag()` · `getTaxonomieMetadata()` · `docs/TECH-DEBT-XBRL-MULTI-VERSION.md` Wartungs-Ticket | +8 |
| 3 | **PdfA3Converter + Integration** | `pdf/PdfA3Converter.ts` + `pdf/assets/README.md` ICC-Placeholder · `pdfDownloadService` erweitert um `archivMode` + Lazy-Import · StepReview-Checkbox "PDF/A-3" · `docs/DEPLOYMENT-VERAPDF-VALIDATION.md` veraPDF-Guide | +5 |
| 4 | **End-to-End-Smoke-Tests** | `src/__tests__/jahresabschluss-e2e.smoke.test.ts` mit 4 Tests: GmbH-klein-Happy-Path, Einzelunternehmen, GmbH-mittel-Lagebericht, PDF/A-3-Integration | +4 |
| 5 | **Abschluss + Gesamt-Abschluss** | Diese Doku + `docs/JAHRESABSCHLUSS-SERIE-GESAMT-ABSCHLUSS.md` + Final-Gate | 0 |

**Σ Sprint:** +26 Tests · +4 Test-Files · 1434 → **1460 grün**.

## 3. Neue Dateien

### Adapter + Pipeline
- `src/domain/jahresabschluss/pdf/FinancialStatementsAdapter.ts` —
  `bilanzToPdfmakeContent(BalanceSheetReport)` liefert zwei Tabellen
  (Aktiva + Passiva untereinander) mit Einrückung pro Depth, EUR-
  Formatierung de-DE. `guvToPdfmakeContent(GuvReport)` rendert die
  Staffelform mit Subtotal-Fettschrift und Final-Result-Unterstreichung;
  UKV-Verfahren liefert klar markierten Fallback-Block.
  `anlagenspiegelToPdfmakeContent(AnlagenspiegelData)` baut die
  7-Spalten-Tabelle nach § 268 Abs. 2 HGB mit Summenzeile.
- `src/domain/jahresabschluss/pdf/DocumentMergePipeline.ts` erweitert
  um `bilanzReport` / `guvReport` / `anlagenspiegelReport` — echte
  Reports haben Prio vor Platzhalter-Content.
- `src/pages/jahresabschluss/StepReview.tsx` erweitert um optionalen
  `reports`-Parameter in `buildPdfInputFromWizardState()` +
  Checkbox "PDF/A-3 (Langzeit-Archivierung)" + `archivMode`-Integration.

### XBRL-Taxonomie-Orchestrator
- `src/domain/ebilanz/hgbTaxonomie.ts` — `HgbTaxonomieVersion`-Union
  (6.6/6.7/6.8/6.9) · `TaxonomieMetadata` · Register mit status
  ("stable" | "deprecated" | "future") + BMF-Quelle-URL ·
  `pickTaxonomieFuerStichtag(ISO-Datum)` mit defensiven Fallbacks und
  Console-Warn bei out-of-range-Stichtagen.
- `docs/TECH-DEBT-XBRL-MULTI-VERSION.md` — dokumentiert, dass die
  konkrete XBRL-Struktur-Unterschiede zwischen Versionen noch nicht
  implementiert sind (6.8 ist der Referenz-Baseline für alle Picks).

### PDF/A-3-Post-Processor
- `src/domain/jahresabschluss/pdf/PdfA3Converter.ts` —
  `convertToPdfA3(input): Promise<Uint8Array>` baut aus pdfmake-Bytes
  ein PDF/A-3-kandidat via pdf-lib. Setzt Title/Author/Subject/Keywords
  /Producer/CreationDate. `AFRelationship.Source` für XBRL-Attachment
  (analog ZUGFeRD's `AFRelationship.Alternative`). ICC-Profil wird als
  ergänzendes Attachment angehängt (bis pdf-lib native OutputIntent-API
  bietet). `useObjectStreams: false` für PDF/A-3-kompatiblere Struktur.
  `PdfA3IccMissingError` wirft klar, wenn keine ICC-Bytes übergeben.
- `src/domain/jahresabschluss/pdf/assets/README.md` — erklärt den
  `sRGB2014.icc`-Download + Lizenzhinweis + Tech-Debt zur Integration
  ins Build-System.
- `src/domain/jahresabschluss/pdf/pdfDownloadService.ts` erweitert um
  `archivMode` / `pdfA3Metadata` / `xbrlAttachment` / `iccProfileBytes`
  in `DownloadPdfOptions`. Bei `archivMode: true` holt der Service den
  pdfmake-Buffer via `getBuffer()`, konvertiert mit `PdfA3Converter`,
  lädt mit `-pdfa.pdf`-Suffix.
- `docs/DEPLOYMENT-VERAPDF-VALIDATION.md` — veraPDF-Setup-Anleitung,
  Docker-Nutzung, bekannte Gaps (OutputIntent, XMP-pdfaid).

### Tests
- `src/domain/jahresabschluss/pdf/__tests__/FinancialStatementsAdapter.test.ts`
  — 9 Tests: Bilanz-Tabellen + Summen + EUR-Format + Einrückung;
  GuV-Staffelform + UKV-Warn; Anlagenspiegel-Tabelle + Leer-Daten;
  Crash-Resistenz bei leeren Entries.
- `src/domain/ebilanz/__tests__/hgbTaxonomie.test.ts` — 8 Tests:
  Register-Shape; Stichtag-Mapping pro Jahr; Future-Stichtag-Fallback
  mit Warn; ungültiger Stichtag → 6.8 + Warn; Metadata-Getter.
- `src/domain/jahresabschluss/pdf/__tests__/PdfA3Converter.test.ts` —
  5 Tests: Happy-Path-Bytes; Metadata-Roundtrip; XBRL-Attachment sichtbar
  im Output-String; fehlendes ICC-Profil; Keywords in Metadata.
- `src/__tests__/jahresabschluss-e2e.smoke.test.ts` — 4 Tests:
  GmbH-klein mit echten Reports; Einzelunternehmen ohne Bilanz/GuV/
  Anhang/Lagebericht; GmbH-mittel-Lagebericht; PDF/A-3-Konvertierung
  eines pdf-lib-Minimal-PDFs.

## 4. Architektur-Entscheidungen

1. **Adapter-Pattern trennt Domain von PDF-Layer.**
   `FinancialStatementsAdapter` hat null Business-Logik — er übernimmt
   nur die Views aus den Builders und formatiert sie pdfmake-gerecht.
   Das bedeutet: eine Änderung der § 266-Struktur in
   `BalanceSheetBuilder` propagiert automatisch, ohne den Adapter
   anzufassen.
2. **`*Report`-Felder haben Prio vor Platzhalter-Content.**
   Die bestehenden Platzhalter-Paths (E3b-Stand) bleiben, damit
   Tests ohne vollen Datenfluss funktionieren. Produktionspfad geht
   über die Reports.
3. **XBRL-Multi-Version: Infrastruktur zuerst, Schemas später.**
   Der Picker ist schon da; die konkreten Strukturen 6.6/6.7/6.9 sind
   als Tech-Debt markiert. Rationale: ein Stichtag-falsches-Tag ist
   besser als kein Versions-Tag, und die konkreten Schemas müssen
   per Version jeweils ein eigener Sprint werden (BMF-Diff-Analyse).
4. **PDF/A-3 als opt-in, nicht default.** Die Konvertierung kostet
   extra Bytes + Rendering-Zeit; nicht jeder Download muss archiv-
   fähig sein. Der Nutzer entscheidet per Checkbox in StepReview.
5. **ICC-Profil als `throw` bei Fehlen.** Alternative wäre ein stiller
   Fallback — das würde aber die PDF/A-3-Konformität still brechen.
   `PdfA3IccMissingError` mit klarer Hilfstext (Verweis auf assets/
   README.md) ist ehrlicher.
6. **veraPDF extern.** Implementierung im Code wäre massiver
   Zusatz-Aufwand (Java-Bridge oder WASM-Port). Als Deployment-Check
   reicht das CLI ad-hoc — dokumentiert, nicht automatisiert.
7. **Lazy-Import für pdf-lib-Konverter.** `import("./PdfA3Converter")`
   erst beim tatsächlichen archivMode-Call. Erspart dem Einstiegs-
   bundle pdf-lib-Payload wenn der Nutzer nur normale PDFs exportiert.
8. **UKV-GuV bewusst nicht implementiert.** Die bestehenden Guv-Tests
   und Domain-Logik sind GKV-only. Der Adapter zeigt das ehrlich:
   UKV-Report → Fallback-Block mit klarer Kennzeichnung.

## 5. Grenzen + bewusst verschoben

1. **§ 290 HGB Konzern-Jahresabschluss** — eigener Scope, keine E4.
2. **§ 289a + § 289b-e HGB Nichtfinanzielle Erklärung** — keine E4
   (für mittelstand-Mandanten selten pflichtig).
3. **Freiwilliger Lagebericht für klein-GmbH** — nicht modelliert.
4. **Wizard-Editor-Integration für Anhang/Lagebericht-Overrides** —
   die Pipeline akzeptiert die Overrides (API bereit seit E3b), aber
   der Wizard bietet keinen Edit-Step. Default-Templates werden
   verwendet. Folge-Sprint-Kandidat.
5. **UKV-GuV** — Struktur nach § 275 Abs. 3 HGB; in E4 als Fallback-
   Warning im Adapter, aber nicht implementiert.
6. **ELSTER-Transmission für E-Bilanz** — XBRL wird erzeugt, aber
   nicht übermittelt (siehe CLAUDE.md §10 P1-Blocker).
7. **ICC-Profil im Repository** — die Datei ist als Placeholder im
   `assets/README.md` dokumentiert, aber nicht eingecheckt (Lizenz-
   Review erforderlich vor Release-Build).
8. **Konkrete 6.6/6.7/6.9-XBRL-Strukturen** — Infrastruktur steht,
   Structure-Mapping ist Tech-Debt (`docs/TECH-DEBT-XBRL-MULTI-VERSION.md`).
9. **`PDFDocument.setProducer`** wird von pdf-lib beim Save durch den
   eigenen "pdf-lib (...)" Producer-String überschrieben. Der vom
   User gesetzte `producer` landet stattdessen im `Creator`-Feld.
   Für veraPDF-Prüfung irrelevant, aber beim Nachlesen des PDFs
   zu beachten.

## 6. Final-Gate-Ergebnisse

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **clean**.
- `npx vitest run` → **1460 / 1460 grün** (137 Test-Dateien).
- E4-Tests isoliert: `npx vitest run src/domain/jahresabschluss/pdf/
  __tests__/FinancialStatementsAdapter.test.ts src/domain/ebilanz/
  __tests__/hgbTaxonomie.test.ts src/domain/jahresabschluss/pdf/
  __tests__/PdfA3Converter.test.ts src/__tests__/jahresabschluss-
  e2e.smoke.test.ts` → **26 / 26 grün**.
- Stderr-Output zu `happy-dom`-Script-Injection aus
  `CookieConsentContext` bleibt Begleitrauschen, kein Failure.
- Die pre-existente `journalStorno.test.ts`-Flake vom E2-Ende war in
  diesem Run grün.

## 7. Keine neuen Open-Questions

Sprint lief ohne neue Unklarheiten. Vorbestehende Fragen:
- E1-Frage #1 zur Bank-Reconciliation-Persistenz bleibt offen.
- XBRL-Multi-Version-Schemas sind als Tech-Debt dokumentiert
  (`docs/TECH-DEBT-XBRL-MULTI-VERSION.md`), nicht als Open-Question.

## 8. Damit ist die Jahresabschluss-Serie abgeschlossen

Siehe `docs/JAHRESABSCHLUSS-SERIE-GESAMT-ABSCHLUSS.md` für den
stakeholder-tauglichen Gesamt-Abschluss aller 5 Sprints.
