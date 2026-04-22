# SKR03-Mapping: Range 1770-1779 — USt-Verbindlichkeit vs. Steuerrueckstellung

**Status:** OFFEN — StB-Ruecksprache erforderlich
**Prioritaet:** P0 (GoBD-kritisch, § 266 HGB, § 238 HGB)
**Entdeckt:** Sprint-21-Audit 2026-04-21
**Betroffene Datei:** `src/domain/accounting/skr03Mapping.ts:123`

## Problem

Die aktuelle Regel mappt den gesamten Range 1770-1779 pauschal auf
`P.B.2 STEUERRUECKSTELLUNG` (§ 266 Abs. 3 Passiva B.2 HGB):

```ts
{ from: 1770, to: 1779, reference_code: "P.B.2", tag: "STEUERRUECKSTELLUNG" },
```

Nach DATEV-SKR03-Standard liegen in diesem Range jedoch laufende
**Steuer-Verbindlichkeiten** (insbesondere Konto 1776 Umsatzsteuer,
wie im Seed-Skript verwendet), die nach § 266 Abs. 3 HGB in
**P.C.8 "Verbindlichkeiten aus Steuern"** gehoeren, nicht in
P.B.2 "Steuerrueckstellungen". Typische SKR03-Steuerrueckstellungen
liegen laut DATEV-Konventionen im Range 0950-0959 — zu verifizieren
im Rahmen des Fixes.

## Auswirkung

Jede UStVA-Zahllast eines Mandanten mit USt-Pflicht wird aktuell als
Rueckstellung statt als Verbindlichkeit ausgewiesen. Das verletzt
§ 266 Abs. 3 HGB direkt und gefaehrdet die GoBD-Konformitaet
(GoBD Rz. 58 "Richtigkeit", Rz. 111 "Nachvollziehbarkeit der
Jahresabschluss-Positionen").

**Konsequenz:** Die Software darf bis zum Fix NICHT fuer reale,
USt-pflichtige Mandanten zur Jahresabschluss-Erstellung eingesetzt
werden.

## Workaround in Sprint 21

Der Test-Mandant "Musterfirma Jahresabschluss GmbH" wurde im
`scripts/seedJahresabschlussTest.ts` auf Kleinunternehmer-Modus
(§ 19 UStG) umgestellt — alle USt-Buchungen entfallen, das
Mapping-Problem tritt im Fixture nicht auf. Das ist **kein Fix**,
nur ein Umgehen fuer die Test-Daten. Siehe Banner im Seed-Output.

## Offene Fragen fuer StB-Ruecksprache

1. Welche SKR03-Konten im Range 1770-1779 sind exakt welche
   HGB-Position? (Primaerquelle: DATEV-SKR03-Kontenrahmen-Doku)
2. Welche Konten gehoeren zu **P.C.8 Verbindlichkeiten aus Steuern**?
3. Welche (falls ueberhaupt) gehoeren zu **P.B.2 Steuerrueckstellungen**?
4. Bei gemischtem Range: Einzelkonten-Regeln oder Sub-Range-Split?
5. Sollten die tatsaechlichen Steuerrueckstellungs-Konten (vermutlich
   0950-0959) als eigener Range in skr03Mapping.ts aufgenommen werden?

## Naechster Schritt — Sprint 22 Kandidat

1. DATEV-SKR03-Dokumentation einsehen oder StB-Fachgespraech
2. Test formulieren: Mandant mit USt-Buchung → Bilanz zeigt Zahllast
   unter P.C.8, nicht P.B.2
3. Mapping-Regel anpassen (vermutlich Split 1770-1775 → P.C.8,
   1776-1778 → P.C.8, 1779 → ? — zu bestaetigen)
4. Seed-Fixture zurueck auf realistischen USt-pflichtigen Mandanten
   migrieren, Banner entfernen
5. Migration pruefen: sind in Produktions-Daten bereits Buchungen
   auf 1770-1779? (Mandanten-Impact-Check)
