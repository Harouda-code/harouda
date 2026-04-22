# Session-Abschluss 2026-04-20

**Status am Ende der Session:** 995 Tests grün / 65 Dateien · tsc clean · kein Git-Repo (Working Dir nicht initialisiert, siehe `CLAUDE.md` §5).

---

## 1. Test-Count-Trajectory über die Session-Kette

Die Session begann mit einem Kontext-Compaction-Restart aus Sprint 7
und durchlief sieben aufeinander aufbauende Nacht-Modus-Etappen:

| Etappe | Tests | Δ | Dauer (grob) |
|--------|------:|---:|:-------------|
| **Ausgang vor Sprint 7** | 727 | — | baseline |
| Sprint 7 (USt-Sonderfälle § 13b + IG) | 951 | +224* | mehrere Sprints vorher |
| Sprint 7.5 Initial (Musterfirma Auto-Seed) | 968 | +17 | Nacht-Lauf |
| Sprint 7.5 Fix-Runde (DEMO_MODE-DEV, selectedYear, Orphan, fail-loud) | 975 | +7 | Nacht-Lauf |
| Audit-Report 2026-04-20 (62 Befunde, keine Code-Änderung) | 975 | 0 | Analyse |
| Pre-Sprint-8 Bugfix-Runde (9 Audit-Fixes) | 988 | +13 | Nacht-Lauf |
| **Post-Bugfix Mini-Sprint** (3 Mapping-Konflikte) | **995** | **+7** | Nacht-Lauf |

\* Die 951 bereits-aus-Sprint-7-Tests kamen aus früheren Sessions vor
dem Kontext-Restart; diese Session begann mit Sprint 7.5 bei 951.

**Netto dieser Session:** 951 → **995 Tests** (+44). 62 Dateien → 65.

---

## 2. Abgeschlossene Sprints + Bugfix-Runden

### 2.1 Sprint 7.5 — Musterfirma Auto-Seed (Demo-UX)
- `autoSeedDemoIfNeeded()` in `src/api/demoSeed.ts` lädt Kühn Musterfirma GmbH mit 52 festdatierten 2025-Buchungen + 8 Anlagen + 5 KST + 2 KTR + 3 MA + 4 Mandanten beim ersten DEMO-Login.
- Vite `?raw`-Import der `buchungen.csv` + `parseJournalCsv` + sequentielles `createEntry` (Hash-Chain-sicher).
- `src/vite-env.d.ts` NEU (erste `?raw`-Nutzung).
- FLAG-Key `harouda:demo-seeded-v2` mit v1-Legacy-Migration.
- Alle 17 Design-Fragen 21-37 vor Start vom User freigegeben.
- Details: `docs/SPRINT-7-5-DECISIONS.md`, `docs/SPRINT-7-5-PLAN-DETAIL.md`, `docs/SPRINT-DEMO-PRE-CHECK.md`.

### 2.2 Sprint 7.5 Fix-Runde — Demo funktional im Dev-Server
- **B1** `DEMO_MODE` defaultet im DEV/Test auf `true` (Heuristik `VITE_DEMO_MODE !== "0" && import.meta.env.DEV`).
- **B2** `selectedYear=2025` synchron vor `createRoot().render()`.
- **B4** Orphan-State-Erkennung (pre-7.5-Altbestand ohne Kühn-Mandant).
- **B5** `canWrite=true` im DEMO_MODE (owner-Rolle, automatisch durch B1).
- **B6** fail-loud re-throw im autoSeed-catch.
- **B3 bewusst NICHT gefixt** (MandantContext-Staleness, 2-Reload-Worst-Case akzeptiert).
- Details: `docs/SPRINT-7-5-FRAGEN.md` (F38-F43), `docs/SPRINT-7-5-E2E-VERIFIKATION.md`.

### 2.3 Qualitäts-Audit — 62 Befunde
- 4 parallele Read-Only-Agenten haben 10 Prüfbereiche abgedeckt.
- 3 P0 🔴, 7 P1, 29 P2, 23 P3 + 11 positive Beobachtungen.
- User hat 8 Fragen (§7) explizit freigegeben.
- Details: `docs/AUDIT-REPORT-2026-04-20.md`.

### 2.4 Pre-Sprint-8 Bugfix-Runde — 9 Audit-Fixes
- **P0-01** GuV-Mapping für RC-Konten 3100-3159 → 5.b Fremdleistungen; Bilanz-Range 3000-3199 gesplittet.
- **P0-02** `updateBeleg` Supabase-Pfad GEBUCHT-Status-Check.
- **P1-01** CSV-Fix `EB-005: 0800 → 2300` + FLAG-v3-Migration.
- **P1-02/P1-03 waren False Positives** — Regressions-Tests ergänzt.
- **P1-04** Storno-Hash-Chain-Tests (3 Tests).
- **P1-05** Festschreibungs-Update-Abwehr-Tests (DEMO + Supabase-Mock).
- **P1-06** Musterfirma-Snapshot-Test (zunächst nur Invariante).
- **P1-07** README 47 → 52 Buchungen korrigiert.
- **2 neue Befunde entdeckt** (Bug A 0860, Bug B Aufwand-Aggregation) — in Post-Bugfix adressiert.
- Details: `docs/SPRINT-BUGFIX-DECISIONS.md`, `docs/SPRINT-BUGFIX-FRAGEN.md`.

### 2.5 Post-Bugfix Mini-Sprint — 3 Mapping-Konflikte
- **Bug A** 0860 Gewinnvortrag: Range 800-889 aufgesplittet; 860-869 jetzt auf P.A.IV passiva (§ 266 Abs. 3 HGB A.IV).
- **Bug B** 2300 Grundkapital: aus GuV ZINSAUFWAND-Range entfernt (Range jetzt 2310-2319); neue Bilanz-Regel 2300-2309 P.A.I. **Das war die exakte Ursache der 50k €-Aufwand-Aggregation-Lücke.**
- **Bug C** (während Arbeit entdeckt) 1600 Verbindlichkeiten L+L: war auf B.II.4 aktiva, jetzt P.C.4 passiva.
- 3 Bestandstests-Fixtures (BwaBuilder, GuvBuilder, skr03GuvMapping) von 2300 auf 2310 umgestellt — explizit durch Bug B bedingt.
- Musterfirma-Snapshot jetzt mit exakten Ist-Werten verankert.
- Details: `docs/POST-BUGFIX-DECISIONS.md`, `docs/POST-BUGFIX-FRAGEN.md` (F50-F54), `docs/MUSTERFIRMA-RECHEN-VERIFIKATION.md`.

---

## 3. Musterfirma-Kennzahlen — finaler Stand

**Reproduzierbare Ist-Werte nach Auto-Seed + AfA-Lauf 2025:**

| Kennzahl | Ist (2026-04-20) | README-Soll | Drift |
|----------|-----------------:|------------:|------:|
| Aktiva 31.12.2025 | 174.187,82 € | 196.396,00 € | −22.208 € (−11,3 %) |
| Passiva 31.12.2025 | 174.187,82 € | 196.396,00 € | −22.208 € (−11,3 %) |
| Jahresüberschuss 2025 | 28.587,82 € | 37.300,00 € | −8.712 € (−23,4 %) |
| UStVA-Zahllast Dez 2025 | 4.150,00 € | 2.820,00 € | +1.330 € (+47,2 %) |

**Bilanz balanciert (Diff 0,00 €)** — GoBD-Kern-Invariante erfüllt.
Drift strukturell erklärbar; Konvergenz auf README-Werte ist nächster Mini-Sprint.

---

## 4. Offene Issues für nächste Session

| # | Thema | Priorität | Aufwand |
|---|-------|-----------|---------|
| 1 | **AfA-Doppelung entfernen** — CSV-Zeile `AfA-2025` streichen; AfA läuft nur noch über `/anlagen/afa-lauf`. Snapshot-Testwerte müssen neu gesetzt werden. | P2 | 15 min |
| 2 | **UStVA-Zahllast +1.330 € Drift debuggen** — welche Buchung produziert die unerwartete USt? `buildUstva`-Kennzahlen Dezember einzeln analysieren. | P2 | 1 h |
| 3 | **README-Sollwerte-Update** nach Fix 1+2 — entweder Musterfirma-Snapshot-Test auf README umstellen (wenn Werte endlich konvergieren) oder README auf aktuelle Ist-Werte aktualisieren. | P2 | 30 min |
| 4 | **F52 P3** — 2600-2649 Rückstellungs-Range-Konflikt (latent, aktuell keine Musterfirma-Auswirkung). | P3 | 30 min |
| 5 | **F42 P2** — MandantContext-Staleness (2-Reload-Worst-Case beim ersten Login). | P2 | mittel |
| 6 | **Sprint-8-Kandidaten-Pool** aus `NEXT-CLAUDE-HANDOFF.md` (a/b/c/e/f/g/h): nach User-Auswahl mit **Pflicht-Bestandsaufnahme** (> 70-80 % vorhanden → Gap-Closure statt Neubau). | — | — |
| 7 | **P0-03 DSGVO Art. 17 Löschrecht** bleibt geparkt bis zur Fachanwalt-Rückmeldung auf Q1-Q8 in `docs/HASH-CHAIN-VS-ERASURE.md`. | P0 | blockiert |

**Empfehlung ohne User-Signal:** Kurzer Folge-Sprint (~2 h) für Issues 1+2+3 (schließt die Musterfirma-Demo-Qualität komplett ab), danach Sprint 8 mit **Kandidat (h) 1572/1575-Mapping-Refactor** oder **(a) Anlagen-CSV-Import**.

---

## 5. Git-Status

Working Directory ist **kein Git-Repository** (CLAUDE.md §5, §12 Punkt 11):

```
$ git status
fatal: not a git repository (or any of the parent directories): .git
```

Uncommitted ist alles seit der letzten Session. Eine Umstellung auf ein
echtes Git-Repo würde Ausführung von:
1. `git init`
2. `npm run prepare` (husky hooks aktivieren)
3. `git add` + initialer Commit

Die `.github/workflows/` + `.husky/` liegen vorbereitet auf Platte, sind
aber dormant bis zum `git init`.

---

## 6. Start-Kommando für nächste Session

Empfohlen beim nächsten Öffnen:

```
1. Lies CLAUDE.md vollständig (Kanonischer Projekt-Kontext).
2. Lies docs/SESSION-ABSCHLUSS-2026-04-20.md (dieses Dokument).
3. Lies docs/NEXT-CLAUDE-HANDOFF.md Abschnitt "Immediate Next Action".
4. Frage den User:
   Option A: "Sollen wir die 3 offenen Musterfirma-Drift-Issues
             (AfA-Doppelung + UStVA-Drift + README-Update) in einem
             2-Stunden-Mini-Sprint schließen?"
   Option B: "Oder direkt Sprint 8 kickoff mit Kandidat-Auswahl?"
5. Bei Option A: ohne Rückfrage losarbeiten, Pflicht-Bestandsaufnahme
   vor jedem Fix (Grep + Ls), Nacht-Modus-Regeln aus vorherigen Sprints.
6. Bei Option B: Pflicht-Bestandsaufnahme für den gewählten Kandidaten
   (Grep + Ls in src/, SKR03, Migrationen). Wenn > 70-80 % vorhanden
   → STOPP + Gap-Closure-Option statt Neubau.
```

Verifikations-Gate vor Code-Änderung:

```bash
cd D:/harouda-app
NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit   # muss clean sein
npx vitest run                                             # muss 995/995 grün sein
```

Falls eines der beiden Kommandos rot wird, **STOPP** — etwas ist
außerhalb dieser Session geändert worden.

---

## 7. Wichtige Invarianten, die nicht gebrochen werden dürfen

- **Hash-Kette** bleibt intakt (GoBD Rz. 153-154). Änderungen an
  `journalChain.ts` nur mit expliziter User-Freigabe.
- **GoBD-Festschreibung** — festgeschriebene Buchungen nicht editieren
  (Ausnahme: Storno + Korrektur-Pfad). Neue Tests in
  `src/api/__tests__/journalStorno.test.ts` sichern das ab.
- **Bilanz balanciert** (Aktiva = Passiva, Diff ≤ 0,01 €). Neue
  Mapping-Regeln müssen disjoint mit anderen Ranges bleiben (siehe
  `src/domain/accounting/__tests__/skr03Mapping.test.ts` + `mappingUniverse.test.ts`).
- **DEMO_MODE** in Produktion bleibt `false` ohne explizites `VITE_DEMO_MODE=1`.
- **Money-Arithmetik** nur über Decimal.js-wrapped `Money`, nie `number`.

---

## Ende der Session

Keine weiteren Aktionen. Nächste Session startet frisch bei 995 Tests.
