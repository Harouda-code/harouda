# Beobachtungsbogen — Walkthrough Kühn Musterfirma GmbH 2025

Dieses Dokument wird vom Buchhalter **während** des Walkthroughs
ausgefüllt. Es dient nicht als Bug-Tracker, sondern als UX- und
Funktions-Beobachtungs-Protokoll.

Pro Schritt aus `README.md`:

- **Schritt:** Nummer und Kurzbezeichnung.
- **Erwartung:** was laut README passieren sollte.
- **Tatsächlich:** was im Browser tatsächlich passiert ist.
- **Problem?:** *Ja* (mit Kurzbeschreibung) oder *Nein*.

---

## Walkthrough-Protokoll

| Schritt | Erwartung | Tatsächlich | Problem? |
|---|---|---|---|
| 1 — Kanzlei-/Firmenstammdaten | Werte aus `firma.json` gespeichert, Toast bestätigt | | |
| 2 — SKR03-Kontenplan laden | ~150 Konten sichtbar, alle Pflicht-Konten aus §3.2 der README vorhanden | | |
| 3 — Mitarbeiter anlegen | 3 Einträge in `/personal/mitarbeiter`, Summe Brutto ≈ 11.500 €/Monat | | |
| 4 — Debitoren/Kreditoren | optionale Erfassung in `/mandanten`; Lieferanten kein eigenes UI | | |
| 5 — Bankverbindung | IBAN aus `firma.json` gespeichert | | |
| 6a — EB-Buchungen 01-08 | 8 Buchungen auf/über Konto 9000; Saldo 9000 danach = 0 | | |
| 6b — Operative Buchungen 09-40 | 32 weitere Buchungen ohne Validierungs-Fehler erfassbar | | |
| 6c — Geschwindigkeit Erfassung | ~30-45 Min. manuell; CSV-Import falls verfügbar ~5 Min. | | |
| 7 — Plausibilitätsprüfung | Soll = Haben pro Monat; kein offener Beleg | | |
| 8 — Festschreibung Dezember | Toast, Lock-Anzeige, keine Bearbeitung mehr möglich | | |
| 9 — Saldenliste 31.12.2025 | Konten-Salden wie in README §5 Schritt 9 | | |
| 10 — Bilanz 31.12.2025 | Bilanzsumme 196.396,00 € Aktiva = Passiva | | |
| 11 — GuV 2025 | Jahresüberschuss 37.300,00 € | | |
| 12 — BWA Dezember 2025 | Dezember vs. YTD konsistent | | |
| 13 — Jahresabschluss-PDF | Kombiniertes PDF Bilanz + GuV | | |
| 14 — UStVA Dezember 2025 | Kz 81 = 20.000, Kz 86 = 5.000, Kz 66 = 1.330, Kz 83 = 2.820; XML-Download | | |

---

## Verifikationsprüfungen am Ende (Buchhalter trägt Ist-Werte ein)

| Prüfgröße | Erwarteter Soll-Wert | Tatsächlicher Ist-Wert | Abweichung? |
|---|---:|---:|---|
| Bilanzsumme Aktiva | 196.396,00 € | | |
| Bilanzsumme Passiva | 196.396,00 € | | |
| Differenz Aktiva − Passiva | 0,00 € | | |
| Jahresüberschuss | 37.300,00 € | | |
| Erlöse 19 % (8400) | 140.000,00 € | | |
| Erlöse 7 % (8300) | 10.000,00 € | | |
| Wareneingang 19 % (3400) | 35.000,00 € | | |
| Personalkosten (4120) | 60.000,00 € | | |
| Raumkosten (4210) | 10.000,00 € | | |
| Kfz-Kosten (4530) | 2.700,00 € | | |
| AfA (4830) | 4.000,00 € | | |
| Bürobedarf (4930) | 1.000,00 € | | |
| Kassenbestand 31.12. | 28.762,00 € | | |
| Bankbestand 31.12. | 38.731,00 € | | |
| Forderungen 31.12. (1400) | 105.550,00 € | | |
| VLL 31.12. (1600) | 41.796,00 € | | |
| Vorsteuer 19 % (1576) | 7.353,00 € | | |
| USt 19 % schuldig (1776) | 26.600,00 € | | |
| USt 7 % schuldig (1771) | 700,00 € | | |
| USt-Zahllast Vorperiode (1770) | 0,00 € | | |
| UStVA Dez Kz 83 | 2.820,00 € | | |

---

## Freitext-Beobachtungen

### 1. Navigation und UI

<!-- War die Navigation zwischen Routen intuitiv? Welche Seite war am schwersten zu finden? -->

### 2. Buchungserfassung

<!-- Wie aufwendig waren die 40 Einträge? Welche Pflichtfelder fehlen/stören? Wurde der USt-Satz automatisch korrekt verbucht oder musste manuell gesplittet werden? -->

### 3. Plausibilitäts- und Validierungs-Meldungen

<!-- Welche Warnungen kamen, welche haben gestört, welche waren hilfreich? -->

### 4. Festschreibung

<!-- Wie fand sich die Festschreibungs-Aktion? Wie klar ist die Sperre danach sichtbar? -->

### 5. Auswertungen

<!-- Waren die Berichts-Routen konsistent? Enthielten alle PDFs die erwarteten Werte? -->

### 6. UStVA-XML

<!-- Wurde die XML-Datei korrekt erzeugt? Stimmte das Schema mit ELSTER-Erwartungen überein (optional: im ELSTER-Validator geprüft)? -->

### 7. Auffälligste Bugs oder fehlende Funktionen

<!-- Was sollte in einem nächsten Sprint adressiert werden? Priorisierung (hoch/mittel/niedrig). -->

### 8. Gesamteindruck

<!-- Taugt das Werkzeug für einen Buchhalter im Tagesgeschäft? Was fehlt am meisten? -->

---

## Abschluss

Nach Ausfüllen dieser Datei: `BEOBACHTUNGEN.md` kann als Input-Grundlage
für den nächsten UX-/Funktions-Sprint dienen. Konkrete Bugs
(z. B. Falschberechnung von Konten-Salden, fehlende Routen) sollten
zusätzlich in `docs/NEXT-CLAUDE-HANDOFF.md` unter "Open Design Questions"
oder als separater Issue protokolliert werden.
