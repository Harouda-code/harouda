# TECH-DEBT: BMF 14.07.2025 - Z2-Integration

**Erstellt**: 2026-05-16
**Prioritaet**: niedrig
**Charakter**: Beobachtungs-Ticket
**Bezug**: BMF-Schreiben vom 14.07.2025 (2. Aenderung GoBD, IV D 2 - S 0316/00128/005/088)

## Worum geht es?

Das BMF-Schreiben vom 14.07.2025 erweitert die GoBD-Vorgaben. Themen u.a.:
- Z2-Datenzugriff (mittelbare Datentraegerueberlassung)
- E-Rechnung-Archivierung
- Geaenderte Anforderungen an Verfahrensdokumentation

## Was ist offen?

Eine systematische Pruefung, welche bestehenden Module von Harouda betroffen sind,
und welche Anpassungen ggf. erforderlich werden. Dies ist eine **Analyse-Aufgabe**,
keine konkrete Implementierungs-Aufgabe.

## Was wurde noch NICHT geleistet?

- Keine Verifikation des BMF-Schreibens gegen Originaltext (Bundessteuerblatt)
- Keine Auswirkungsanalyse auf bestehende Migrations / Module
- Keine Aenderung am Code

## Naechster Schritt (wenn Ticket bearbeitet wird)

1. BMF-Schreiben im Originaltext (Bundessteuerblatt) abrufen und lesen
2. Relevante Aenderungen extrahieren
3. Module identifizieren, die potentiell betroffen sind
4. Eigenen Sprint planen oder als nicht relevant abschliessen

## Verweis

In `.harouda-state.md` unter "Open TECH-DEBT" referenziert.