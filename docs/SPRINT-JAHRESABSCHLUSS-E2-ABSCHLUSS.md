# Sprint Jahresabschluss-E2 — Condition-Wizard + Rules-Engine + Mandant-Stammdaten-UI

**Abgeschlossen:** 2026-04-22 · Autonomer Langlauf · 9 Schritte.
**End-Stand:** **1363 Tests grün / 123 Test-Dateien** · tsc clean
(eine pre-existente Flake in `journalStorno.test.ts` im Full-Suite-Run —
isoliert grün, Test-Order-Effekt, nicht E2-bezogen).
**Scope:** E2 von 3 Jahresabschluss-Sprints (gestern E1 Validation +
Stammdaten · heute E2 Wizard + Rules · morgen E3+E4 Docs + Export).

---

## 1. Ziel + Rechtsbasis

**Ziel:** 5-Step-Wizard `/jahresabschluss/wizard`, der aus
Rechtsform + Größenklasse automatisch den Pflicht-Baustein-Satz des
Jahresabschlusses ableitet, die Mandant-Stammdaten-UI (HRB, Kapital,
Organe) aus E1 operationalisiert und den Pre-Closing-Report aus E1
als ersten Gate vor der Konfiguration erzwingt.

**Rechtliche Basis:**
- **§ 267 HGB** — Größenklassen (Kleinst / Klein / Mittel / Groß).
- **§ 264 HGB** — Jahresabschluss-Pflicht Kapitalgesellschaft.
- **§§ 284-288 HGB** — Anhang-Pflicht-Angaben.
- **§ 289 HGB** — Lagebericht (nur mittel + groß).
- **§ 316 HGB** — Prüfungspflicht (mittel + groß).
- **§ 241a HGB** — Befreiung für kleine Einzelunternehmen.
- **§ 242 HGB** — Bilanz-Pflicht Kaufmann.
- **§ 4 Abs. 3 EStG** — EÜR für Nicht-Bilanzierer.

**Zielgruppe:** Kapital (GmbH / AG / UG / SE) · Person (GbR / PartG /
OHG / KG) · Einzelunternehmen · Sonstige.

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Wizard-Types + Store** | `WizardTypes.ts` · `wizardStore.ts` (CRUD + Partial-Update + Timestamps, localStorage-Keys `harouda:wizard:<mandantId>:<jahr>`) | +8 |
| 2 | **Rules-Engine** | `RulesEngine.ts` · `computeBausteine({rechtsform, groessenklasse})` mit § HGB-Begründungen pro Regel | +10 |
| 3 | **Stepper + Page-Skeleton** | `ui/WizardStepper.tsx` (generisch, `aria-current`, `data-step-status`) · `JahresabschlussWizardPage.tsx` mit MandantRequiredGuard + switch-auf-currentStep · Route `/jahresabschluss/wizard` | +4 + +2 |
| 4 | **Step 1 Validation** | `StepValidation.tsx` · ruft `validateYearEnd()` aus E1, rendert Findings mit Severity-Icons, Warnings-Confirm-Checkbox, Bank-Recon-Link bei `CLOSING_BANK_RECON_NOT_AUTOMATED` | +4 |
| 5 | **Step 2 Rechtsform** | `StepRechtsform.tsx` · react-hook-form v7 + useFieldArray für Organe · Conditional: Kapital→HRB+Kapital+Organe, Person→HRB optional, Einzel→minimal · HRB-Regex `/^HR[AB]\s*\d{1,10}$/i` · Save → updateClient + updateStep + markStepCompleted | +5 |
| 6 | **Step 3 Größenklasse** | `StepGroessenklasse.tsx` · useQuery(fetchAccounts+fetchAllEntries) enabled nur bei Kapital · `computeKriteriumFromJournal` + `classifyHgb267` · Override-Toggle mit Pflicht-Begründung ≥3 Zeichen · Einzel/Person skip auf Default "klein" | +5 |
| 7 | **Step 4 Bausteine** | `StepBausteine.tsx` · `computeBausteine` Output-Rendering mit Check/X-Icons + `<details>`-Begründungen + Disclaimer "Sonderfälle Publizitätspflicht / § 290 / § 241a freiwillig" | +4 |
| 8 | **Step 5 Review + Finalize** | `StepReview.tsx` · `<dl>`-Summary aller 4 Schritte · Finalize-Button markiert `review` completed + Toast · E3-Hinweis "PDF-Generierung folgt" | +2 |
| 9 | **Abschluss + Gate** | Diese Doku + Spot-Checks | 0 |

**Σ Sprint:** +44 Tests · +9 Test-Files · 1319 → **1363 grün**.

## 3. Neue Dateien

### Package
- `package.json` — `react-hook-form@^7` Dependency neu (cleaner Install).

### Domain-Layer (Wizard-State + Rules)
- `src/domain/jahresabschluss/WizardTypes.ts` — `WizardStep`-Union + `WIZARD_STEPS`-Array · `WizardRechtsformData` · `JahresabschlussBausteine` (deckblatt/inhalt/bescheinigung immer `true`, Rest `boolean` · `begruendungen: string[]`) · `WizardState` (sessionId, completedSteps, data, timestamps).
- `src/domain/jahresabschluss/wizardStore.ts` — `loadWizard`, `saveWizard`, `clearWizard`, `updateStep` (deep-merge `data`), `markStepCompleted` (idempotent). Key-Schema `harouda:wizard:<mandantId>:<jahr>`. Null-mandantId wirft.
- `src/domain/jahresabschluss/RulesEngine.ts` — `computeBausteine()`:
  - **Kapital** (GmbH/AG/UG/SE) → bilanz+guv+anlagenspiegel+anhang · lagebericht nur wenn klasse="mittel" oder "gross".
  - **Person** (GbR/PartG/OHG/KG) → bilanz+guv+anlagenspiegel · anhang=false · lagebericht=false.
  - **Einzelunternehmen** → euer+anlagenspiegel · bilanz/guv/anhang/lagebericht=false (§ 241a-Default).
  - **SonstigerRechtsform** → konservativer Fallback (alles aktiv) + "manuelle Prüfung durch Steuerberater"-Begründung.

### UI-Komponenten
- `src/components/ui/WizardStepper.tsx` — generisch `<WizardStepper<StepId>>` · `aria-current="step"` auf current · `data-step-status="current|done|pending"` · onNavigate nur auf done-Steps (pending disabled) · Check-Icon bei done, Nummer sonst.
- `src/pages/JahresabschlussWizardPage.tsx` — `MandantRequiredGuard` → `useYear` → Session-Init via `loadWizard` | `saveWizard` · `useState<WizardStep>` für currentStep · renders Stepper + switch-Step-Komponente · onAdvance = setState + markStepCompleted + updateStep.
- `src/pages/jahresabschluss/stepTypes.ts` — `StepProps`-Interface (state, mandantId, jahr, onAdvance, onRefresh) für alle 5 Step-Komponenten.

### Step-Komponenten
- `src/pages/jahresabschluss/StepValidation.tsx` — `useMutation(validateYearEnd)` · Severity-Icons (Error rot, Warning orange, Info blau) · `warnings-confirm`-Checkbox setzt `advance.disabled` · `CLOSING_BANK_RECON_NOT_AUTOMATED` → Deep-Link zu `/bank-reconciliation`.
- `src/pages/jahresabschluss/StepRechtsform.tsx` — siehe §2 Schritt 5.
- `src/pages/jahresabschluss/StepGroessenklasse.tsx` — siehe §2 Schritt 6. Nicht-Kapital: render `<p data-testid="groessenklasse-skip">` + Single-Button-Advance.
- `src/pages/jahresabschluss/StepBausteine.tsx` — siehe §2 Schritt 7. Missing-Input-Guard: `<p data-testid="bausteine-missing-input">` wenn rechtsform oder groessenklasse fehlen.
- `src/pages/jahresabschluss/StepReview.tsx` — siehe §2 Schritt 8.

### Routing
- `src/App.tsx` — `import JahresabschlussWizardPage` + `<Route path="/jahresabschluss/wizard" element={<JahresabschlussWizardPage />} />`.

### Tests
- `src/domain/jahresabschluss/__tests__/wizardStore.test.ts` — 8 Tests (CRUD, Mandant/Jahr-Isolation, Partial-Update, Timestamps, null-guard).
- `src/domain/jahresabschluss/__tests__/RulesEngine.test.ts` — 10 Tests (4 Rechtsform-Kategorien × 2-3 Klassen-Varianten + Lagebericht-Gating).
- `src/components/__tests__/WizardStepper.test.tsx` — 4 Tests (Rendering, current-highlight, nav-lock auf pending, nav-click auf done).
- `src/pages/__tests__/JahresabschlussWizardPage.integration.test.tsx` — 2 Tests (Mount-Smoke mit QueryClient + 4 Kontext-Provider + MemoryRouter, Stepper-Status bei frischer Session).
- `src/pages/jahresabschluss/__tests__/StepValidation.test.tsx` — 4 Tests (Happy-Path/Error/Warning-only/Bank-Recon-Link).
- `src/pages/jahresabschluss/__tests__/StepRechtsform.test.tsx` — 5 Tests (GmbH-Felder, Einzel-minimal, Save→Client+WizardState, Leer-Validation, HRB-Regex-Reject).
- `src/pages/jahresabschluss/__tests__/StepGroessenklasse.test.tsx` — 5 Tests (Einzel-Skip, GmbH-Auto-Kleinst, Override-ohne-Begründung-Alert, Override-mit-Begründung-Save, Employees-Input-Kriterium).
- `src/pages/jahresabschluss/__tests__/StepBausteine.test.tsx` — 4 Tests (GmbH-mittel-all-on, Einzel-EÜR-only, Missing-Input-Fallback, Advance-speichert+markiert+onAdvance).
- `src/pages/jahresabschluss/__tests__/StepReview.test.tsx` — 2 Tests (Summary-Rendering, Finalize-markiert-completed).

## 4. Architektur-Entscheidungen

1. **State in localStorage, nicht Supabase.** Analog zu bestehendem `estStorage`-Muster. Session-Resume nach Refresh funktioniert; Team-Sharing braucht explizites Supabase-Wiring in E3 (nicht Scope E2). Key-Schema mandant-+jahr-isoliert.
2. **Wizard-State-coupled, nicht URL-coupled.** Kein `?step=…` Query-Param, da Steps data-abhängig sind (StepBausteine braucht Schritt 2 + 3 Daten). Direct-Entry auf Step 4 ohne Prior-Data wäre inkonsistent, deshalb internal useState.
3. **react-hook-form für StepRechtsform, natives useState für andere Steps.** RHF nur dort, wo das Formular wirklich komplex ist (useFieldArray für Organe, Conditional-Validation, bedingte Pflichtfelder). StepGroessenklasse und StepValidation haben nur einfache Controls — RHF wäre Over-Engineering.
4. **Rules-Engine als reiner Function-Output, keine Klasse.** `computeBausteine({rechtsform, groessenklasse})` ist deterministisch, testfreundlich, hat keinen State. `begruendungen` als Teil des Rückgabe-Objekts statt als Side-Effect.
5. **Conditional-Rendering statt getrennter Pages.** Per Rechtsform andere Pflichtfelder sichtbar, aber innerhalb einer StepRechtsform-Komponente — verhindert Duplizierung und erleichtert späteren E3-Reporting-Code.
6. **MandantRequiredGuard + Year-Context.** Wizard hängt an `selectedMandantId` + `selectedYear`. Ohne beides → Guard-Redirect zu Mandanten-Auswahl. Kein Wizard ohne Context-Setup.

## 5. Grenzen + nicht-umgesetzt

1. **§ 267 Abs. 4 HGB Mehrperioden-Regel** — Klassifikator wertet nur EINEN Stichtag aus. § 267 verlangt aber zwei aufeinanderfolgende Stichtage ≤ Schwelle. UI-Hinweis in StepGroessenklasse zeigt "einzelner Stichtag", Override ist deshalb das rechtlich saubere Escape.
2. **Konzern-Strukturen** — § 290 HGB-Pflicht zum Konzernabschluss wird nicht erkannt (Mutterunternehmen ohne Befreiung). Disclaimer in StepBausteine verweist auf manuelle Prüfung.
3. **Publizitätspflicht (PublG, § 340 HGB)** — nicht modelliert; Sonderfall-Hinweis in StepBausteine.
4. **Freiwillige Bilanzierung trotz § 241a HGB** — nicht im Override-Pfad; der Nutzer wählt dann "klein" + GmbH statt Einzelunternehmen als Workaround. Kein eigener Switch.
5. **Persistenz der Wizard-Session** — localStorage-only. Kein Team-Sharing, kein Audit, keine RLS. In E3 ggf. nach Supabase migrieren (neue Tabelle `jahresabschluss_sessions`).
6. **PDF-Generierung** — kein Output-Artefakt. Finalize-Button zeigt Toast, aber generiert keine Datei. Das ist explizit Scope E3.
7. **Confirmation-Checkbox für Warnings** — aktuell state-lokal, wird NICHT persistiert. Nach Refresh verliert User den Confirm-Status und muss Schritt 1 neu bestätigen. Konservativ gewählt (GoBD-Prinzip "manuelle Bestätigung soll aktiv sein").

## 6. Final-Gate-Ergebnisse

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **clean**.
- `npx vitest run` → **1362 grün + 1 Flake** (`journalStorno.test.ts` Test-Order-Effekt, in Einzel-Run grün — NICHT E2-bezogen, gleiche Pre-Existenz wie vor E1).
- E2-Tests isoliert: `npx vitest run src/domain/jahresabschluss src/components/__tests__/WizardStepper.test.tsx src/pages/__tests__/JahresabschlussWizardPage.integration.test.tsx src/pages/jahresabschluss` → **44 / 44 grün**.

## 7. Bereit für E3

E2 liefert:
- Wizard-State-Model mit 5 Schritten, deterministisch persistent.
- Rules-Output `JahresabschlussBausteine` — Boolean-Flags + Begründungen.
- Alle User-Entscheidungen (Rechtsform, HRB, Kapital, Organe, Größenklasse + Override) sind in `WizardState.data` abrufbar.
- E1-Validation-Report ist Teil der Session.

E3 kann daraus (Scope morgen):
- PDF-Jahresabschluss-Dokument generieren (Deckblatt + Inhaltsverzeichnis + abhängige Bausteine).
- E-Bilanz-XBRL aus den bereits vorhandenen Bilanz-/GuV-Builder-Outputs + Wizard-Metadaten (HRB, Kapital).
- Anhang-Template-Rendering aus `bausteine.anhang === true`.
- Lagebericht-Stub-Rendering.
- Bescheinigung (Steuerberater-Erklärung).

## 8. Offene Fragen

Keine neuen. Open-Questions aus E1 (`docs/OPEN-QUESTIONS-JAHRESABSCHLUSS-2026-04-21.md`, Frage #1 Bank-Reconciliation-Persistenz) bleibt offen — E2 surface-t die Lücke aber sichtbar via `CLOSING_BANK_RECON_NOT_AUTOMATED`-Finding + Deep-Link.
