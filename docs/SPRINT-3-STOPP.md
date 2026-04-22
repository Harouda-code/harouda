# Sprint 3 — STOPP-Bericht

> Autonomer Nacht-Modus: Sprint nach Phase 1 eingefroren.
> Keine Code-Änderungen. 784 Tests unverändert. tsc + vitest grün.

## Welche Phase erreicht

**Phase 1 (Vorab-Prüfung, max. 15 Min.)** — abgeschlossen innerhalb der
Zeitgrenze. Phasen 2-6 **nicht begonnen**.

## Welche Stopp-Bedingung ausgelöst

**Stopp-Bedingung C** (Architektur-Entscheidung mit dauerhafter Auswirkung)
in Verbindung mit der Meta-Regel „Wenn unsicher, STOPP".

## Grund in einem Satz

Der Sprint-Auftrag setzt einen „Neubau" eines Kostenstellen-Moduls
voraus; Phase 1 hat gezeigt, dass dieses Modul bereits zu ~95 % im
Produktivcode existiert (Migration 0017 + Repository + UI + Journal-
Form-Dropdown + CSV-Import-Integration + DATEV-EXTF-Import mit
KOST1/KOST2), und ein autonomer Neubau oder eine Umdeutung des Scopes
hätte entweder die 784-Test-Schutzgrenze oder die „keine Spontan-
Verbesserungen"-Scope-Grenze verletzt.

## Was funktioniert, was nicht

### Funktioniert (schon vor diesem Sprint)

- **Stammdaten:** Route `/einstellungen/kostenstellen` mit voller CRUD,
  Aktiv/Inaktiv-Toggle, Code-Uniqueness, Audit-Log-Einträge bei
  Anlage/Änderung/Löschung.
- **Journal-Integration:** Beim Anlegen/Bearbeiten einer Buchung ist
  das KST-Feld als Dropdown vorhanden (Code + Name, Filter auf aktive
  KST, Default „— ohne —").
- **Import-Pfade:**
  - CSV (Sprint 1): optionale 8. Spalte `kostenstelle` wird erkannt.
  - DATEV EXTF 510 (Sprint 2): KOST1 wird übernommen, KOST2 mit Warnung
    verworfen (JournalEntry hat nur ein kostenstelle-Feld).
- **Hash-Kette-Integrität:** Migration 0017 fügt nur einen zusätzlichen
  Spalteneintrag an `journal_entries` an und kommentiert in der DB
  explizit, dass die Spalte nicht Teil von `journal_entries_compute_hash`
  ist (Migration 0010 unverändert).
- **Reports:** Die Domain-Builder für Bilanz, GuV, BWA, EÜR, UStVA,
  ZM, E-Bilanz und Z3-Export tragen KST in ihren Fixtures mit —
  sie sind also auf Daten-Ebene KST-aware, auch wenn das UI-Formular
  sie nicht primär als Dimension anzeigt.

### Funktioniert nicht / fehlt

1. **Kostenträger (KTR)** — zweite Dimension neben KST, in DATEV-Welt
   als „Wofür" (Projekt/Produkt) parallel zu KST („Wo"/Abteilung)
   üblich. **Existiert nicht** im Codebase. Weder Tabelle noch
   Repository noch UI noch Import-Mapping.
2. **Dedizierte KST-Auswertung** — keine `/berichte/kst`-Seite, die
   KST-Salden zeigt. Die bestehenden Builder sind KST-aware, aber im
   UI gibt es keinen sichtbaren KST-Filter oder eine Kost-Bericht-
   Seite.
3. **Demo-Daten** — `demo-input/musterfirma-2025/buchungen.csv` hat
   keine KST-Spalte (7-Spalten-Header). `src/api/demoSeed.ts`
   enthält keine KST-Stammdaten. Für einen End-to-End-Test mit KST
   fehlt die Grundlage.

## Empfehlung für den nächsten Start

Drei Optionen für den User beim Morgen-Wiedereintritt. Jede ist in
sich abgeschlossen und schließt die existierenden 95 % nicht kaputt.

### Option A — Sprint 3 als erledigt markieren, zu Sprint 4 (OPOS)

Begründung: die ursprünglichen Sprint-3-Ziele (Stammdaten, Repository,
UI, Journal-Form, Import-Integration) sind produktiv. Der
Sprint-Fortschritt ist in der Sprint-Planung korrekt vermerkt — der
Auftrag war nur nicht informiert über den bestehenden Stand.

Aufwand: ~5 Minuten. Handoff und PROJEKT-STATUSBERICHT auf
„Sprint 3 = Bestandscode" korrigieren.

### Option B — Sprint 3 erweitern um die drei Lücken

- **KTR-Modul** (neue Migration 0024): Tabelle `cost_carriers`
  analog `cost_centers`, Repository, UI, Journal-Spalte
  `kostentraeger`. KTR ebenfalls nicht in der Hash-Kette.
- **Dedizierte KST-Bericht-Seite** (`/berichte/kst`): Summen pro KST
  über gewählten Zeitraum, optional pro Aufwandskonto gruppiert.
- **Demo-Daten**: 5 KST + 2 KTR anlegen, Journal-CSV-Demo-Datei auf
  8- bzw. 9-Spalten-Header erweitern.

Aufwand-Schätzung: 2-3 echte Sprint-Phasen, ~400-600 Zeilen Code +
15-25 neue Tests. Kein Eingriff in bestehende 784 Tests.

### Option C — Nur Demo-Daten + KST-Bericht, KTR verschieben

Falls KTR zu viel Scope für diese Runde ist:

- `/berichte/kst`-Seite implementieren (kein Schema-Change, rein
  abgeleiteter Report aus bestehenden `kostenstelle`-Feldern in
  `journal_entries`).
- Demo-Daten erweitern.

Aufwand: ~1 Sprint-Phase, ~150-250 Zeilen Code + 5-10 Tests.

## Code-Zustand

Alle Änderungen dieser Sprint-3-Runde sind **nicht-destruktiv und
ausschließlich dokumentarisch**:

- Neue Dateien: `docs/SPRINT-3-DECISIONS.md`, `docs/SPRINT-3-STOPP.md`.
- Keine Code-Dateien angefasst.
- Keine Migration angelegt.
- Keine Test-Datei angelegt oder geändert.

tsc und vitest bleiben im selben Stand wie Ende Sprint 2:
**tsc clean, 784 Tests grün, 53 Test-Dateien**.

## Für den nächsten Claude

Beim Lesen von `NEXT-CLAUDE-HANDOFF.md` sieht die nächste Session
den Stopp-Status unter „Last completed" und kann gezielt eine der
Optionen A/B/C anstoßen, ohne die Bestandsaufnahme aus Phase 1 neu
machen zu müssen. `SPRINT-3-DECISIONS.md` enthält die vollständige
Inventarliste der KST-Artefakte mit Dateipfaden.
