# Nacht-Modus 2026-04-21 · Schritt 3 — AnlageMobilitaetspraemie

**Status:** abgeschlossen · 0 offene Fragen · nur Tests hinzugefügt.

## Deliverables

| Datei | Art |
|---|---|
| `src/pages/__tests__/AnlageMobilitaetspraemiePage.integration.test.tsx` | neu · 2 Tests |

Die Page selbst (850 LOC) war bereits voll implementiert und auf
estStorage-V3 migriert (Phase 3 Schritt 3). Keine Code-Änderung nötig.

## Stolperstein

FORM_ID der Page ist `"anlage-mobility"` (nicht `"anlage-mobi"` wie im
Test zunächst angenommen). Test-Assertion auf V3-Key entsprechend
korrigiert.

## Test-Count-Delta

`1250 → 1252` (+2), 104 Files (+1), tsc clean.

## Rechtsbasis

§ 101 EStG — Mobilitätsprämie für Steuerpflichtige unter
Grundfreibetrag. 100 % Manual Input, kein Journal-Bezug.
