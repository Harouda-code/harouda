# Sprint 18 — Employee-SV-Stammdaten (Expand-Phase)

**Abgeschlossen:** 2026-04-25 · Autonomer Langlauf · 7 Schritte.
**End-Stand:** **1569 Tests grün / 152 Test-Dateien** · tsc clean.
**Scope:** Expand-and-Contract-Pattern, Phase 1 (Expand) — neue
NULLABLE-Felder fuer DEUeV-Pflichtangaben + UI-Sichtbarkeit der
Stammdaten-Luecken + DB-basierte SvMeldungenPage (Ersatz fuer
`prompt()`-Pfad aus Sprint 15).
**Schließt Tech-Debt aus Sprint 15 (Expand-Teil) · öffnet neuen
Tech-Debt "Contract-Phase":**
`docs/TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md`.

---

## 1. Ziel + Rechtsbasis

**Ziel:** Die in Sprint 15 als „extraAn pro Meldung via prompt()"
behandelten DEUeV-Pflichtfelder bekommen einen persistenten Platz am
Employee-Schema. Die Migration ist bewusst **nullable** — Contract
(NOT NULL) kommt separat, wenn alle aktiven Mandanten gepflegt sind.

**Rechtliche Basis:**
- **§ 28a Abs. 3 SGB IV** — Meldepflicht-Felder.
- **BA-Tätigkeitsschlüsselverzeichnis 2010** — 9-stellig.
- **DEUeV-Gemeinsame-Grundsätze** — Anschrift-Format.
- **GoBD Rz. 45** — Vollständigkeit der Stammdaten.

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Bestandsaufnahme** | Recon: Employee-Type hat 30 Felder, 17 nullable · keine SV-spezifischen Felder · EmployeesPage ist state-based (nicht react-hook-form) · Client HAT KEINE anschrift_* Spalten · Krankenkassen nur als Array (keine DB) · DEMO_EMPLOYEES-Stub in SvMeldungenPage | 0 |
| 2 | **Migrationen 0032 + 0033 + Types** | `0032_employee_sv_fields_expand.sql` (6 Semantik + 5 Anschrift-Felder, 3 soft-Check-Constraints) · `0033_client_anschrift_expand.sql` (5 Anschrift-Felder + Soft-PLZ-Check) · `src/types/db.ts` Employee + Client erweitert (alle neu NULLABLE) | 0 |
| 3 | **Service-Layer + Completeness-Helpers** | `src/domain/employees/svCompleteness.ts` mit `isEmployeeSvDataComplete` / `isClientAnschriftComplete` + Feld-Labels + `formatMissingFields` | +9 |
| 4 | **SvDataIncompleteBanner + Listen-Badge + Form-SV-Section** | `src/components/employees/SvDataIncompleteBanner.tsx` · EmployeesPage-Form: neue „SV-Stammdaten" + „Anschrift"-Sections mit Pattern-Validierung · EmployeesPage-Liste: neue Spalte „SV-Stammdaten" mit data-testid `sv-badge-ok-*` / `sv-badge-missing-*` | +4 |
| 5 | **SvMeldungBuilder-Refactor (DB-Pfad)** | `arbeitnehmerExtraFromEmployee` + `arbeitgeberFromClient` + `mergeArbeitnehmerExtra` (explicit-over-stored) + `hasOverride` + `resolveBuildContext` (Haupt-Entry-Point) · `MissingSvDataError` mit `employeeId` + Link-Hint | +11 |
| 6 | **SvMeldungenPage Pre-Flight statt prompt()** | `DEMO_EMPLOYEES` + `buildArbeitnehmerStub` + `promptExtraAn` entfernt · useQuery(`fetchEmployees` / `fetchClients`) · Pre-Flight-Banner mit Incomplete-Count · Jahresmeldungs-Button disabled bei unvollstaendigen Employees · SV-Row-Status-Badge | +3 (+4 alte adaptiert) |
| 7 | **Tech-Debts + Abschluss** | `TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md` (OPEN, Low-Prio) · Sprint-15-Addendum · diese Doku | 0 |

**Σ Sprint:** +27 Tests · +4 Test-Files · 1542 → **1569 gruen**.

## 3. Neue/geänderte Dateien

### Migrationen
- `supabase/migrations/0032_employee_sv_fields_expand.sql` — 11 neue
  Spalten (6 Semantik + 5 Anschrift), 3 soft-Check-Constraints
  (`chk_employee_taetigkeitsschluessel`, `chk_employee_einzugsstelle_bbnr`,
  `chk_employee_anschrift_plz`), 5 Spalten-Kommentare.
- `supabase/migrations/0033_client_anschrift_expand.sql` — 5 Anschrift-
  Spalten, 1 soft-PLZ-Constraint.

### Types
- `src/types/db.ts` — `Client` um 5 Anschrift-Felder erweitert · `Employee`
  um 11 SV-/Anschrift-Felder erweitert. Alle neu sind `| null | undefined`
  (keine Breaking Changes).

### Domain-Layer
- `src/domain/employees/svCompleteness.ts` — neue Datei mit:
  - `EMPLOYEE_SV_REQUIRED_FIELDS` (8 Pflichtfelder-Liste).
  - `CLIENT_ANSCHRIFT_REQUIRED_FIELDS` (4 Pflichtfelder).
  - `isEmployeeSvDataComplete` / `isClientAnschriftComplete` mit
    `CompletenessCheck<T>`-Rueckgabe.
  - `EMPLOYEE_SV_FIELD_LABELS` / `CLIENT_ANSCHRIFT_FIELD_LABELS` fuer UI.
  - `formatMissingFields` Helper.
- `src/domain/sv/SvMeldungBuilder.ts` — um 6 neue Exports erweitert:
  `arbeitnehmerExtraFromEmployee`, `arbeitgeberFromClient`,
  `mergeArbeitnehmerExtra`, `hasOverride`, `BuildFromDbOptions`,
  `resolveBuildContext`. `MissingSvDataError` um optionalen
  `employeeId`-Konstruktor-Parameter erweitert — der Message-Text
  enthält jetzt einen Reparatur-Link zum Employee-Profil.

### UI
- `src/components/employees/SvDataIncompleteBanner.tsx` — neue
  Warn-Komponente (role=note, ustva__disclaimer-Klasse).
- `src/pages/EmployeesPage.tsx` — Banner-Mount oberhalb des Edit-Forms +
  neue „SV-Stammdaten" + „Anschrift"-Sections im Form (mit pattern-
  Attribut fuer Browser-Validation) + neue Liste-Spalte „SV-Stammdaten".
- `src/pages/SvMeldungenPage.tsx` — grundlegend ueberarbeitet:
  - Ersetzt `DEMO_EMPLOYEES` durch `fetchEmployees(mandantId)` +
    `fetchClients`-Query.
  - Neuer `incompleteEmployees`-useMemo + `clientAnschriftCheck`.
  - Pre-Flight-Banner mit `data-testid="sv-preflight-warning"` +
    `data-incomplete-count` + Navigations-Links.
  - Jahresmeldungs-Buttons disabled bei `!sv.complete` +
    data-testid `sv-row-ok-*` / `sv-row-missing-*`.
  - `handleJahresmeldung(emp: Employee)` nutzt `resolveBuildContext` —
    kein prompt() mehr.
  - Override-Hinweis in Success-Toast, wenn `overrideUsed=true`.

### Tests (neu)
- `src/domain/employees/__tests__/svCompleteness.test.ts` (+9) —
  Employee/Client-Completeness, Leer-String-Handling, Labels,
  formatMissingFields.
- `src/components/employees/__tests__/SvDataIncompleteBanner.test.tsx` (+4) —
  Rendering / Nicht-Rendering, missing-Count-Attribut, Jump-Link-Href.
- `src/domain/sv/__tests__/SvMeldungBuilderFromDb.test.ts` (+11) —
  Extract-Helpers, Merge (Override-gewinnt), hasOverride, Happy-Path-
  `resolveBuildContext`, Error-Cases mit Link-Hint, Full-Integration
  mit `buildJahresmeldung`.

### Tests (modifiziert)
- `src/pages/__tests__/SvMeldungenPage.smoke.test.tsx` — 4 alte
  angepasst (+ QueryClientProvider + seedEmployees) + 3 Sprint-18-
  spezifische (vollstaendige/unvollstaendige Employees, Client-
  Anschrift-Warning).

### Dokumentation
- `docs/TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md` — neu, OPEN,
  Low-Priority. Beschreibt Contract-Phase, Aktivierungskriterien,
  Monitoring-Vorschlag.
- `docs/SPRINT-15-SV-MELDUNGEN-ABSCHLUSS.md` — Addendum am Anfang:
  Expand-Teil des Tech-Debts geschlossen via Sprint 18.
- `docs/SPRINT-18-EMPLOYEE-SV-STAMMDATEN-ABSCHLUSS.md` (diese Datei).

## 4. Architektur-Entscheidungen

1. **Expand-and-Contract statt Big-Bang-NOT-NULL.** Risiko-arme
   Migration: Bestands-Rows bleiben intakt, UI macht die Luecken
   sichtbar, User pflegt schrittweise, Contract-Migration folgt.
2. **Soft Check-Constraints.** Format-Checks (`~ '^[0-9]{9}$'`)
   greifen nur bei `NOT NULL`-Werten. Erlaubt Expand ohne Daten-
   Backfill, verhindert aber faelsch-formatiertes Pflegen.
3. **BBNR bleibt am Employee, KEINE Krankenkassen-Tabelle.** Wie in
   Sprint 15 entschieden — ein eigenes Krankenkassen-Stammdaten-Modul
   waere overkill fuer den MVP. Folge-Sprint-Kandidat.
4. **`mehrfachbeschaeftigung` mit DEFAULT false.** Konservativer
   GoBD-neutraler Default, weil 99%+ der Faelle Standard-Beschaeftigung
   sind. NULL-Handling-Risiko im Builder entfaellt.
5. **`anschrift_land` mit DEFAULT 'DE'.** 99%+ Default — kein NULL-
   Sonderfall im Builder.
6. **Builder-API ist additiv.** Existierende Sprint-15-Aufrufer mit
   `extraAn: ArbeitnehmerExtraData` funktionieren unveraendert. Neuer
   Pfad `resolveBuildContext(employee, client, options)` ist Zusatz.
7. **`explicit-over-stored`-Merge.** Override (aus UI-Prompt oder
   temporaerer Ad-hoc-Eingabe) gewinnt ueber DB-Werte. Grund: User
   kann in einem Einzelfall einen Tippfehler in den Stammdaten
   temporaer korrigieren, ohne die DB zu aendern. `overrideUsed`-Flag
   im Result → Toast-Hint "mit Absender-Override".
8. **`MissingSvDataError` mit Link-Hint.** Statt generischer
   „Feld fehlt" wird die konkrete Reparatur-URL genannt:
   `/lohn/arbeitnehmer/{id}` — User kann direkt klicken.
9. **EmployeesPage-Form minimal erweitert.** State-based (kein
   react-hook-form-Refactor). Zwei neue Sections mit Browser-native
   `pattern`-Attribut fuer Client-Side-Validation — keine
   Custom-Validation-Logik.
10. **SvMeldungenPage: prompt() → DB-basiert.** Vollstaendiger Pfad-
    Wechsel. Pre-Flight-Banner macht Luecken vorab sichtbar, der
    Jahresmeldungs-Button wird bei Unvollstaendigkeit disabled.
    Kein stilles Fallback-Prompt — User wird gezwungen, die Luecke
    im Employee-Profil zu schliessen.
11. **`geburtsdatum` NICHT im Sprint-Scope.** Spec nennt 11 neue
    Felder, `geburtsdatum` ist keines davon. `resolveBuildContext`
    nutzt `einstellungsdatum` als Fallback — als Tech-Debt in der
    Contract-Doku festgehalten.

## 5. Grenzen + bewusst verschoben

1. **Keine NOT-NULL-Constraints.** Contract-Phase in eigenem Sprint.
2. **Kein Auto-Backfill aus externen Quellen.** User pflegt manuell.
3. **Keine VSNR-Checksumme-Validierung.** 12-stellige SV-Nummer wird
   nur auf Laenge gepruef (Sprint 15). Mod-97-Checksum-Validierung ist
   Folge-Sprint.
4. **Keine Staatsangehoerigkeits-Dropdown.** Freies Textfeld mit
   ISO-Hinweis. DEUeV-Schluesselverzeichnis-Dropdown folgt.
5. **Kein Taetigkeitsschluessel-Auto-Complete.** BA-Verzeichnis
   haette 3000+ Eintraege — eigener Sprint mit Fuzzy-Search.
6. **Kein Krankenkassen-Stammdaten-Modul.** BBNR bleibt Employee-Feld.
7. **`geburtsdatum` fehlt im Employee-Type.** Baustelle-Hinweis im
   Contract-Tech-Debt-Ticket §Geburtsdatum-Abschnitt.
8. **Keine Lohn-Berechnungs-Logik-Aenderung.** Phase-2-Types intakt.
9. **`mehrfachbeschaeftigung`-Checkbox in EmployeeForm vorhanden, aber
   nicht in Completeness-Check** — der DB-Default `false` greift und
   ist GoBD-neutral.

## 6. Final-Gate-Ergebnisse

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **clean**.
- `npx vitest run` → **1569 / 1569 gruen** (152 Test-Dateien).
- Sprint-18-Tests isoliert: `npx vitest run
  src/domain/employees
  src/components/employees
  src/domain/sv/__tests__/SvMeldungBuilderFromDb.test.ts
  src/pages/__tests__/SvMeldungenPage.smoke.test.tsx` → **31 / 31 gruen**
  (9 + 4 + 11 + 7).
- Stderr-Output zur happy-dom-Script-Injection aus
  `CookieConsentContext` bleibt Begleitrauschen.

## 7. Keine neuen Open-Questions

Der Sprint lief ohne neue Unklarheiten. Offene Tech-Debts sind:
- **Contract-Phase** (dieser Sprint oeffnet sie in
  `TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md`).
- **Geburtsdatum-Feld am Employee** (im Contract-Ticket §Geburtsdatum-
  Abschnitt vermerkt).
- **Krankenkassen-Stammdaten-Modul** (Sprint-15-Follow-up, nicht dieser
  Sprint-Scope).

## 8. Cross-Referenzen

- `docs/TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md` — Phase 2.
- `docs/SPRINT-15-SV-MELDUNGEN-ABSCHLUSS.md` — Tech-Debt-Vorerklaerung.
- `docs/DSUV-SCHEMA-UPDATE-GUIDE.md` — jaehrlicher Schema-Review.
- `supabase/migrations/0016_employees.sql` — Ur-Tabelle.
- `supabase/migrations/0030_client_rechtsform_stammdaten.sql` —
  voriger Client-Erweiterungs-Precedent.

---

**Expand-Phase ist abgeschlossen. Der produktive Betrieb kann die
SV-Meldungen jetzt aus echten Stammdaten erzeugen; der `prompt()`-
Pfad ist Geschichte. Contract-Migration wartet bis zum 100%-Backfill-
Milestone — siehe Tech-Debt-Ticket.**
