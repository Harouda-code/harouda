# Sprint 17 — Inventur-Modul (Anlagen + Bestaende)

**Abgeschlossen:** 2026-04-26 · Autonomer Langlauf · 8 Schritte.
**End-Stand:** **1609 Tests grün / 157 Test-Dateien** · tsc clean.
**Scope:** § 240 HGB Inventur-Pflicht — Anlagen-Inventur + manuelle
Bestands-Inventur mit GoBD-konformer Beleg-Archivierung +
Closing-Validation-Integration mit § 241a-Erleichterung.

---

## 1. Ziel + Rechtsbasis

**Ziel:** End-to-End-Inventur-Prozess pro Mandant + Jahr: Anlagen
prüfen (Vorhanden / Verlust / Schaden) mit automatisierter
Abgangs-Buchungs-Vorschlag, manuelle Bestandspositionen mit
Pflicht-Upload der Inventurliste + Delta-Buchung mit
Niederstwertprinzip-Check. Integration in `validateYearEnd` —
Jahresabschluss wird blockiert, bevor die Inventur abgeschlossen
ist.

**Rechtliche Basis:**
- **§ 240 HGB** — Inventur-Pflicht.
- **§ 241a HGB** — Erleichterung für Kleinkaufleute (Umsatz < 800k,
  Gewinn < 80k, Stand WachstumsChancenG 2024).
- **§ 253 Abs. 3 HGB** — Außerplanmäßige AfA bei dauerhafter
  Wertminderung (Anlagen-Verlust/-Schaden).
- **§ 253 Abs. 4 HGB** — Strenges Niederstwertprinzip (Bestände).
- **§ 256 HGB** — Bewertungsverfahren.
- **GoBD Rz. 50-52** — Inventur-Archivierung (Inventurlisten-Upload
  als Beleg).

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Bestandsaufnahme** | Recon: SKR nur auf `Account.skr`, kein `Client.kontenrahmen` · `AnlagenService` hat `planAbgang/buchtAbgang` als Template · `uploadDocument` localStorage Data-URL · Migration-Pattern aus 0031/0004 kopieren · keine existierenden Inventur-Stubs | 0 |
| 2 | **Migration 0034 + Types** | 3 neue Tabellen (inventur_sessions, inventur_anlagen, inventur_bestaende) mit company_id-RLS + RESTRICTIVE client_belongs_to_company + Triggers · 3 neue DB-Types in `db.ts` | 0 |
| 3 | **Konto-Filter-Helper** | `src/domain/inventur/kontoKategorien.ts` mit `VORRAT/BESTANDSVERAENDERUNG/AUSSERORDENTLICHER_AUFWAND`-Ranges für SKR03 + SKR04 · `filterVorratAccounts` / `filterBestandsveraenderungAccounts` / `filterAusserordentlicherAufwandAccounts` · `detectDominantKontenrahmen` | +13 |
| 4 | **BestandVeraenderungProposer** | `proposeBestandDelta(input)` · Mehrung (Soll=Vorrat, Haben=Veraenderung) / Minderung (umgekehrt) / unveraendert · Niederstwert-Warn-System (§ 253 Abs. 4 HGB) · kein hart codiertes Konto · deutsches Datum im buchungstext | +8 |
| 5 | **AnlagenInventurService** | `prepareAnlagenInventur({anlagen, stichtag, existingChecks})` nutzt `planAfaLauf` für Buchwert · `proposeAbgangsBuchung({grund, buchwert, anlage, aufwand_konto_nr?})` liefert Soll=null-bis-User-Auswahl + Haben=konto_anlage · § 253 Abs. 3 HGB im reasoning | +8 |
| 6 | **Service-Layer + InventurPage** | `src/api/inventur.ts` Dual-Mode (sessionS/anlagenChecks/bestaende CRUD) · `store.ts` um 3 Keys erweitert · `src/pages/InventurPage.tsx` mit 3 Tabs (Anlagen / Bestände / Abschluss) + Konto-Dropdowns + Upload-Pflicht + `MandantRequiredGuard` · Route `/inventur` in `App.tsx` | +6 |
| 7 | **Closing-Validation-Integration** | Neue Findings `CLOSING_INVENTUR_MISSING` (Warn) / `CLOSING_INVENTUR_UNVOLLSTAENDIG` (Error, blockend) / `CLOSING_INVENTUR_241A_ERLEICHTERUNG` (info, bei Einzelunternehmen unter Schwelle) · PARAG_241A_UMSATZ_SCHWELLE = 800k, PARAG_241A_GEWINN_SCHWELLE = 80k (WachstumsChancenG 2024) | +5 |
| 8 | **Abschluss + Final-Gate** | Diese Doku · tsc clean · vitest grün | 0 |

**Σ Sprint:** +40 Tests · +5 Test-Files · 1569 → **1609 gruen**.

## 3. Neue Dateien

### Migration
- `supabase/migrations/0034_inventur_tables.sql` — 3 Tabellen mit
  je 4 permissive Policies + 1 RESTRICTIVE `client_belongs_to_company`
  + `tg_set_updated_at`-Trigger. Soft-Check auf
  `niederstwert_begruendung` (Pflicht wenn Flag true).

### Types
- `src/types/db.ts` — `InventurSessionStatus` · `InventurAnlageStatus`
  · `InventurSession` · `InventurAnlage` · `InventurBestand`.
- `src/api/store.ts` — 3 neue localStorage-Keys + 6 Getter/Setter.

### Domain-Layer
- `src/domain/inventur/kontoKategorien.ts` — zentrale Range-
  Definitionen pro SKR + drei Filter-Funktionen + Dominanter-
  Kontenrahmen-Erkennung (Heuristik, Fallback SKR03).
- `src/domain/inventur/BestandVeraenderungProposer.ts` —
  `proposeBestandDelta` Pure-Function, liefert `BestandDeltaProposal`
  mit `soll_konto_nr` / `haben_konto_nr` optional-null (User-Pflicht
  Auswahl), reasoning + warnings.
- `src/domain/inventur/AnlagenInventurService.ts` —
  `prepareAnlagenInventur` + `proposeAbgangsBuchung`. Beide pure,
  kein direktes Persistieren.

### Service-Layer
- `src/api/inventur.ts` — Dual-Mode (localStorage + Supabase):
  `listSessions / getSessionForYear / createSession / updateSession
  · listAnlagenChecks / upsertAnlageCheck · listBestaende /
  upsertBestand / deleteBestand`. Niederstwert-Begruendung wird beim
  Speichern validiert (Service-Layer-Constraint, zusaetzlich zur
  DB-Check-Constraint).

### UI
- `src/pages/InventurPage.tsx` — 3-Tab-Seite:
  - **Anlagen-Inventur:** Tabelle aus `prepareAnlagenInventur`,
    3 Status-Buttons pro Zeile, Abgangs-Dialog mit Aufwand-Konto-
    Dropdown (gefiltert auf SKR-spezifische außerordentliche
    Aufwendungen).
  - **Bestands-Inventur:** Inline-Form für neue Position (Bezeichnung
    + Vorrat-Konto-Dropdown + Anfangsbestand + Endbestand +
    Niederstwert-Checkbox + Begründungs-Textarea). Pro Position:
    Upload-Button für Inventurliste (Pflicht) + Veränderungs-Konto-
    Dropdown + „Buchung erstellen"-Button (disabled ohne Upload).
  - **Abschluss:** Summary-Liste + „Session abschließen"-Button
    (disabled bis alle Anlagen geprüft + alle Bestände gebucht +
    alle Inventurlisten hochgeladen).
  - Warn-Banner oben: „Unter-Konten je nach Branche auswählen — keine
    Konten werden automatisch belegt."
- Route `/inventur` in `App.tsx`.

### Validator
- `src/domain/accounting/ClosingValidation.ts` — neuer Sektions-Block 8:
  - `CLOSING_INVENTUR_MISSING` (warning): keine Session vorhanden.
  - `CLOSING_INVENTUR_UNVOLLSTAENDIG` (error): Session offen oder
    `anlagen_inventur_abgeschlossen=false` oder
    `bestands_inventur_abgeschlossen=false`.
  - `CLOSING_INVENTUR_241A_ERLEICHTERUNG` (info): Einzelunternehmen
    unter § 241a-Schwelle — bitte mit Steuerberater prüfen.
  - Konstanten `PARAG_241A_UMSATZ_SCHWELLE = 800_000`,
    `PARAG_241A_GEWINN_SCHWELLE = 80_000`.

### Tests (neu, 5 Files)
- `src/domain/inventur/__tests__/kontoKategorien.test.ts` (+13).
- `src/domain/inventur/__tests__/BestandVeraenderungProposer.test.ts` (+8).
- `src/domain/inventur/__tests__/AnlagenInventurService.test.ts` (+8).
- `src/pages/__tests__/InventurPage.smoke.test.tsx` (+6).
- `src/domain/accounting/__tests__/ClosingValidationInventur.test.ts` (+5).

## 4. Architektur-Entscheidungen

1. **Kein hart codiertes Konto.** Sowohl der
   `BestandVeraenderungProposer` als auch der `proposeAbgangsBuchung`
   liefern `soll_konto_nr: null` (bzw. je nach Richtung
   `haben_konto_nr: null`), wenn der User noch keine Auswahl aus der
   Dropdown getroffen hat. Die UI erzwingt die Auswahl vor dem
   `createEntry`-Call. Dies ist die GoBD-Letztverantwortungs-Regel:
   der Buchhalter ist verantwortlich für die Kontenauswahl.
2. **Session pro Mandant pro Jahr (UNIQUE).** Verhindert
   Parallel-Sessions für denselben Zeitraum. `updateSession` erlaubt
   Status-Übergänge `offen → abgeschlossen → gebucht`.
3. **Anlagen-Check upsert auf `(session_id, anlage_id)`.** Der User
   kann den Status einer Anlage mehrfach ändern; Historie ist Teil
   des `updated_at`-Logs.
4. **Bestand-Upload-Pflicht als UI-Gate.** Der „Buchung erstellen"-
   Button ist disabled bis `inventurliste_document_id !== null`.
   Auf DB-Ebene gibt es keine NOT-NULL-Constraint — das ist
   bewusst (User kann eine Position anlegen, später die Datei
   nachreichen). Closing-Validation blockt trotzdem bei fehlendem
   Upload.
5. **Niederstwert-Begründung doppelt validiert.** DB-Constraint
   (soft check) + Service-Layer-Validation + UI-Disabled-Gate. Die
   Begründung landet im Buchungs-`beschreibung`-Feld für den
   GoBD-Trail.
6. **SKR-Heuristik statt User-Auswahl.** Der Kontenrahmen wird aus
   dem dominanten `Account.skr` im Mandanten-Datensatz ermittelt.
   Fallback SKR03 (Demo-Seed). Warn wenn Mix oder leer.
7. **Abgangs-Buchung nur bei Verlust/Schaden.** „Vorhanden" setzt
   nur den Status, keine Journal-Änderung. „Verlust"/„Schaden"
   öffnet einen Dialog mit Dropdown + Betrag (Restbuchwert zum
   Stichtag).
8. **Pure-Proposers.** Beide Proposer-Funktionen sind seiteneffekt-
   frei. `createEntry` wird ausschließlich von der UI nach User-
   Zustimmung aufgerufen. Keine Auto-Bookings.
9. **§ 241a-Check mit Schwellenwerten als exportierte Konstanten.**
   Umsatz/Gewinn-Schätzung ist aktuell Stub (`null`) — die Finding
   schlägt nur an, wenn spätere Integration mit `buildGuv(vorjahr)`
   echte Zahlen liefert. Konservativer Default: KEINE Befreiung.
10. **Einzelunternehmen + unter Schwelle → info, nicht warning.**
    Der User muss die Befreiung explizit beim Steuerberater
    bestätigen; die Finding ist informativ, blockiert nichts.

## 5. Grenzen + bewusst verschoben

1. **Kein Lagerverwaltungs-Modul.** Keine Wareneingang-/-ausgang-
   Buchungen, kein FIFO/LIFO, kein Bestandssatz pro Artikel.
2. **Keine OCR auf Inventurlisten.** Upload ist reines Beleg-
   Archivieren.
3. **Kein Auto-Vorjahres-Anfangsbestand-Transfer.** User gibt den
   Anfangsbestand manuell ein. Folge-Sprint kann das automatisieren,
   indem aus der Vorjahres-Bilanz die Vorrat-Kontosalden gezogen
   werden.
4. **Keine `invoices`-Schema-Änderung.** Unabhängig von Sprint 15
   (ZM-Meldung) bleibt die Invoices-Struktur unangetastet.
5. **§ 241a-Umsatz/Gewinn-Schätzung ist Stub.** Aktuell liefert
   `report_try_estimate_umsatz/gewinn` immer `null`. Folge-Sprint
   ergänzt `buildGuv(vorjahr)`-Integration.
6. **Keine Anlagen-Schema-Änderung.** Abgangs-Buchung läuft rein
   über `createEntry` + `inventur_anlagen.abgangs_buchung_id`-Link.
   Anlage bleibt zunächst `aktiv=true`; die Deaktivierung nach
   Abgangs-Buchung wäre ein Folge-Sprint.
7. **Keine Session-Auto-Create.** User startet explizit.
8. **Kein hart codiertes Bestandsveränderungs-Konto** — Pflicht aus
   dem User-Vertrag.
9. **SKR04-Konten-Seed fehlt.** Die Filter-Ranges für SKR04 sind
   definiert, aber ohne Seed finden sie keine Accounts. Der Dominant-
   Kontenrahmen fällt konsequent auf SKR03 zurück. Folge-Sprint
   ergänzt `src/api/skr04.ts`.

## 6. Final-Gate-Ergebnisse

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **clean**.
- `npx vitest run` → **1609 / 1609 gruen** (157 Test-Dateien).
- Sprint-17-Tests isoliert: `npx vitest run src/domain/inventur
  src/pages/__tests__/InventurPage.smoke.test.tsx
  src/domain/accounting/__tests__/ClosingValidationInventur.test.ts`
  → **40 / 40 grün**.
- Stderr-Output aus `CookieConsentContext` bleibt Begleitrauschen.

## 7. Keine neuen Open-Questions

Der Sprint lief ohne neue Unklarheiten. Offene Folge-Sprint-
Kandidaten sind in §5 transparent aufgeführt.

## 8. Cross-Referenzen

- `docs/SPRINT-16-BANK-RECON-PERSISTENZ-ABSCHLUSS.md` — RLS-Migrations-
  Pattern wurde hier wiederverwendet.
- `src/domain/anlagen/AnlagenService.ts` — `planAfaLauf` nutzt der
  Inventur-Service für Buchwert-Ermittlung.
- `src/api/journal.ts` — `createEntry` für Abgangs- und
  Bestandsveränderungs-Buchungen.
- `src/api/documents.ts` — `uploadDocument` für Inventurlisten.
- `CLAUDE.md` §7 — GoBD-Compliance-Status: § 240 HGB Inventur-Pflicht
  jetzt prozessunterstützend in der App verankert.

---

**Das Inventur-Modul ist MVP-komplett und produktionsreif im Rahmen
der dokumentierten Grenzen. Der Jahresabschluss-Flow blockiert jetzt
aktiv bei fehlender oder unvollständiger Inventur — GoBD Rz. 50-52
ist prozedural erzwungen.**
