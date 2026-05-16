# Sprint-Abschluss: Fristen-Registry

**Datum**: 2026-05-16
**Status**: Abgeschlossen
**Migrations-Range**: 0060 bis 0071
**Test-Stand am Abschluss**: 2577 passed + 1 todo (alle gruen)
**Git-Namespace**: `feat(deadlines):`

## 1. Zielsetzung

Aufbau einer zentralen Registry fuer gesetzliche und mandantenspezifische Fristen,
inklusive Versionierung der Rechtsgrundlagen und regionaler Feiertags-Strukturen.

## 2. Umgesetzte Migrations

| Nr   | Datei                                              |
|------|----------------------------------------------------|
| 0060 | deadline_source_versions                           |
| 0061 | deadline_municipalities                            |
| 0062 | deadline_holiday_rules                             |
| 0063 | deadline_holiday_applications                      |
| 0064 | deadline_tax_offices                               |
| 0065 | deadline_tax_cash_offices                          |
| 0066 | deadline_tax_office_cash_office_assignments        |
| 0067 | client_deadline                                    |
| 0068 | deadline_status_history                            |
| 0069 | client_deadline_status_materialization             |
| 0070 | deadline_type_catalog                              |
| 0071 | deadline_source_kind_bundesgesetz                  |

Jede Migration hat einen begleitenden `migration-NNNN-structure.test.ts`.

## 3. Was im Code steht (Fakten)

- Registry-Kern fuer Frist-Definitionen mit Quell-Versionierung (`deadline_source_versions`)
- Mandantenspezifische Instanziierung (`client_deadline`)
- Status-Historie mit Materialisierungs-Cache (`deadline_status_history`, `client_deadline_status_materialization`)
- Strukturelle Vorbereitung fuer regionalisiertes Feiertagsrecht (`deadline_holiday_rules`, `deadline_holiday_applications`)
- Finanzamt- und Finanzkasse-Stammdaten mit Zuordnung
- Typ-Katalog fuer Frist-Arten (`deadline_type_catalog`)

## 4. Verknuepfung mit dokumentierten Architektur-Entscheidungen

### 4.1 D2.1 (Vorgang/Frist als Infrastructure-Service)
**Status: implementiert.**
Die Migrations 0060-0071 setzen den Infrastructure-Layer fuer Fristen um.
Vorgangs-UI-Anbindung erfolgt in spaeteren Sprints.

### 4.2 B.1 (Regionalisiertes Feiertagsrecht)
**Status: Vorbereitet (Schema only).**
Die Tabellen `deadline_holiday_rules` und `deadline_holiday_applications`
sind strukturell angelegt. Daten-Seeding (NI, BY, NW, BW, SL, RP) und vollstaendige
Test-Cases (Reformationstag, Allerheiligen, Mariae Himmelfahrt, Schaltjahre)
sind in einem Folge-Sprint zu ergaenzen.

## 5. Definition of Done

- [x] 12 Migrations erfolgreich (0060-0071)
- [x] Struktur-Tests fuer alle neuen Tabellen gruen
- [x] Test-Suite vollstaendig gruen (2577 passed + 1 todo)
- [x] Sprint-Abschluss-Doku (dieses File)
- [x] `.harouda-state.md` aktualisiert
- [x] TECH-DEBT-Liste aktualisiert
- [ ] Glossar-Update fuer Registry-Begriffe (offen - Folge-Aufgabe)

## 6. Offene Punkte / Folge-Aufgaben

- Glossar-Eintraege fuer Registry-Begriffe (`client_deadline`, `deadline_source_versions`, `deadline_type_catalog`)
- B.1 Daten-Seeding und Test-Cases (Folge-Sprint)
- Vorgangs-UI-Anbindung an Frist-Registry (Folge-Sprint)

## 7. Nicht-Scope dieses Sprints

- Bescheid-Workflow (D2.6)
- Bekanntgabe-Berechnung Detail (D2.7) - strukturell vorbereitet, nicht aktiviert
- Z2-/E-Rechnung-Themen (siehe TECH-DEBT-BMF-14072025-Z2-INTEGRATION)