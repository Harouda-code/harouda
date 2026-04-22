# Nacht-Modus 2026-04-21 · Schritt 4 — Cross-Module-Consistency-Smoke

**Status:** abgeschlossen · 1 weitere offene Frage (Lohn-Entry-Status-Default).

## Deliverable

| Datei | Art |
|---|---|
| `src/__tests__/cross-module-lohn-to-anlage-g.smoke.test.tsx` | neu · 2 Tests |

## Szenario

**Test #1 — Happy-Path Relationaler Check:**
1. Seed 1 GF-Employee + SKR03-Konten (4110, 4130, 1741, 1742, 1755) mit Tags via `tagsForKonto`.
2. `postPayrollAsJournal` erzeugt einen Journal-Batch für März 2025.
3. Test-Simulation: Status `entwurf → gebucht` (s. Stolperstein unten).
4. Archiv-Write pro processedRow.
5. **Assertions** (alle relational, keine hartkodierten Eur-Zahlen):
   - Alle `batch_id`-Entries tragen `client_id === KUEHN`.
   - Summe der Soll-Seiten auf 4110/4130 (Lohn-Aufwand) == `buildAnlageG(...).summen.personal`.
   - Archiv hat genau 1 Row für (employee, jahr) mit `batch_id === res.batchId`.
   - `importAnlageNAusArchiv(...)`.vorschlag.bruttoLohn == `archiv-row.gesamt_brutto`.
   - `abrechnungen_gefunden` == Anzahl Archiv-Rows.

**Test #2 — Mandanten-Isolation:**
- Zusätzlicher Fremd-Entry (`client_id="client-fremd"`, 9999 €) auf 4110.
- `buildAnlageG` für Kühn liefert Personal-Summe **ohne** den Fremd-Entry.

## Stolperstein

`postPayrollAsJournal` schreibt Lohn-Entries als `status="entwurf"` (per Phase-2-Design: Admin-Freigabe als separater Schritt). `buildAnlageG` filtert aber auf `status === "gebucht"` (via `filterEntriesInYear`). Der Test simuliert die Admin-Freigabe via direktem `store.setEntries(... status: "gebucht" ...)`. In Produktion läuft dieser Übergang über einen separaten Festschreibungs-Workflow.

**Offene Frage #2** in OPEN-QUESTIONS dokumentiert: ob Anlage G fachlich auch Entwürfe zeigen sollte, oder ob die strikte `"gebucht"`-Filterung (= nur festgeschriebene Buchungen) die richtige GoBD-Semantik ist.

## Test-Count-Delta

`1252 → 1254` (+2), 105 Files (+1), tsc clean.
