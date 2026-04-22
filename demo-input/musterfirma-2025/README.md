# Demo-Walkthrough — Kühn Musterfirma GmbH (Geschäftsjahr 2025)

Zweck: End-to-End-Demonstration des Buchführungs-Zyklus in der harouda-app.
Dieses Verzeichnis enthält **Eingabedaten** und eine **Schritt-für-Schritt-
Anleitung** für einen manuellen Durchlauf im Browser. Keine Ausgabe-Dateien
werden durch diese Dokumentation erzeugt — der Buchhalter löst im Browser
selbst aus und sammelt seine Beobachtungen in `BEOBACHTUNGEN.md`.

> Alle Namen, Adressen, IBANs, USt-IdNrn. und Steuernummern in diesem
> Verzeichnis sind **fiktiv und bewusst nicht prüfsummenvalid**, damit
> sie nicht versehentlich als reale Stammdaten missverstanden werden.

---

## 0. Übersicht der Eingabedateien

| Datei | Inhalt |
|---|---|
| `firma.json` | Stammdaten Kühn Musterfirma GmbH, inkl. Eröffnungsbilanz zum 01.01.2025 |
| `mitarbeiter.csv` | 3 Angestellte (1 Geschäftsführerin Vollzeit, 1 Sachbearbeiter Vollzeit, 1 Teilzeit) |
| `kunden.csv` | 5 Debitoren mit fiktiven USt-IdNrn. |
| `lieferanten.csv` | 5 Kreditoren (Bürobedarf, Waren 19%, Waren 7%, Kfz, Reinigung) |
| `kostenstellen.csv` | 5 Kostenstellen (Verwaltung, Vertrieb, Einkauf, Produktion, IT) — Sprint 3 |
| `kostentraeger.csv` | 2 Kostenträger (Webshop-Relaunch, Kunde-Müller-Auftrag) — Sprint 3 |
| `buchungen.csv` | 52 Journal-Einträge verteilt über 2025 (8 Eröffnungsbilanz + Basis-Geschäft + OPOS-Szenarien inkl. Skonto + Sprint-7 Reverse-Charge/IG-Lieferung), 11-Spalten-Header mit optionalen Feldern **kostenstelle** (8.), **kostentraeger** (9.), **skonto_pct** (10.), **skonto_tage** (11.) |
| `bankauszug.mt940` | SWIFT-MT940-Bankauszug (7 Transaktionen) für Demo des Bank-Ausziffern inkl. Skonto-Automatik — Sprint 5 |
| `anlagegueter.csv` | 6 Anlagegüter (PKW, Büromöbel, Laptop, Server, Telefonanlage, Gabelstapler) für Demo des Anlagenverzeichnisses — Sprint 6 |
| `BEOBACHTUNGEN.md` | Leere Beobachtungstabelle — der Buchhalter füllt sie während des Walkthroughs aus |

### Rechnerische Konsistenz (Verifikation vor Beginn)

- **Eröffnungsbilanz:** Aktiva 100.000,00 € = Passiva 100.000,00 € ✓
- **Eröffnungsbilanz über Konto 9000:** Soll 100.000,00 = Haben 100.000,00, Saldo 9000 danach = 0 ✓
- **Bilanzsumme zum 31.12.2025 (erwartet):** 196.396,00 € Aktiva = 196.396,00 € Passiva
- **Jahresüberschuss 2025 (erwartet):** 37.300,00 €
- **UStVA-Zahllast Dezember 2025 (erwartet):** 2.820,00 €

Die einzelnen Werte sind unten pro Auswertung präzisiert (Abschnitt 5).

---

## 1. Voraussetzungen

1. Node 20+ und npm installiert.
2. Arbeitsverzeichnis: `D:/harouda-app`.
3. `npm install` einmalig ausgeführt.
4. `.env.local` mit Supabase-Credentials **oder** Demo-Modus (automatisch, wenn
   keine `.env.local` vorhanden ist).

Start:

```
npm run dev
```

Aufruf im Browser: `http://localhost:5173`. Im Demo-Modus erscheint der
Demo-Banner oben.

---

## 2. Anmeldung

1. Navigation zu `/login`.
2. Demo-Zugangsdaten (aus `CLAUDE.md`): `admin@harouda.de` /
   `password123`.

**Sprint 7.5 — Auto-Seed (seit 2026-04-20):** Beim ersten DEMO-Login
lädt die App diesen Musterfirma-Datensatz **automatisch** aus
`buchungen.csv` + `anlagegueter.csv` + `kostenstellen.csv` +
`kostentraeger.csv` + `mitarbeiter.csv` + `firma.json` ins
localStorage. Kühn wird als selektierter Mandant gesetzt. Die
folgenden Schritte 1-9 sind deshalb als **manueller Walkthrough**
zu verstehen (falls man den Auto-Seed umgeht oder den Ablauf
didaktisch nachvollziehen will) — der Dashboard-Button
*„Demo-Daten laden"* seedet seither nur noch SKR03-Konten.
Der Auto-Seed-Pfad markiert sich über den localStorage-Key
`harouda:demo-seeded-v2`; zum Re-Seed: Key entfernen und App
neu laden.

**Erwartetes Ergebnis:** Dashboard unter `/dashboard` zeigt die
Kühn-KPIs direkt nach dem Login (nicht leer). Mandanten-Umschalter
zeigt Kühn selektiert, Schulz/Meyer/Roth zusätzlich verfügbar.

---

## 3. Stammdaten-Einrichtung (Schritte 1-5)

### Schritt 1 — Kanzlei-/Firmenstammdaten

Route: `/einstellungen`.

Felder aus `firma.json` übernehmen:

- Kanzleiname: **Kühn Musterfirma GmbH**
- Anschrift: Klosterstraße 12, 49074 Osnabrück
- Steuernummer: 66/123/45678
- USt-IdNr.: DE999888777
- Kleinunternehmerregelung: **nein**
- Voranmeldungszeitraum USt: monatlich

Speichern. **Erwartung:** Toast *"Einstellungen gespeichert"*, Werte
bleiben nach Neuladen erhalten.

### Schritt 2 — Kontenplan SKR03 laden

Route: `/konten`.

Button *"SKR03-Standard laden"* (falls nicht bereits geladen).

**Erwartung:** ~150 Konten in der Liste sichtbar; darunter mindestens:

- 0440 BGA, 0800 Gezeichnetes Kapital, 0860 Gewinnvortrag, 9000 Saldovortragskonto
- 1000 Kasse, 1200 Bank
- 1400 Forderungen aus L+L, 1600 Verbindlichkeiten aus L+L
- 1576 Abziehbare Vorsteuer 19 %, 1770 Umsatzsteuer-Zahllast,
  1771 USt 7 %, 1776 USt 19 %
- 3400 Wareneingang 19 %
- 4120 Gehälter, 4210 Raumkosten, 4530 Kfz-Kosten, 4830 AfA, 4930 Bürobedarf
- 8300 Erlöse 7 %, 8400 Erlöse 19 %

### Schritt 3 — Mitarbeiter anlegen

Route: `/personal/mitarbeiter`.

Für jede Zeile aus `mitarbeiter.csv` einen Eintrag erzeugen. Pro
Mitarbeiter:in: PersNr, Name, Vorname, Position, Beschäftigungsart
(Voll-/Teilzeit), Brutto/Monat, Eintrittsdatum, Steuerklasse,
Kinderfreibetrag, Krankenkasse. Drei Zeilen insgesamt.

**Erwartung:** Nach dem dritten Eintrag: Listenansicht mit 3 Mitarbeiter:innen,
Summe Brutto ≈ 11.500 €/Monat.

### Schritt 4 — Debitoren und Kreditoren

Hinweis: harouda-app arbeitet mit Sammelkonten 1400 (Debitoren) und 1600
(Kreditoren). Debitoren- und Kreditoren-Stammdaten werden in den
Buchungsbeschreibungen namentlich referenziert, aber nicht als eigene
Konten geführt.

Falls die UI eine Mandanten-Stammdatenansicht bietet (`/mandanten`),
können die 5 Kunden aus `kunden.csv` dort optional erfasst werden — rein
informativ, sie wirken sich auf Buchungen/Bilanz nicht aus. Die 5
Lieferanten aus `lieferanten.csv` haben im Standardfluss keine eigene
Stammdatenansicht; sie erscheinen nur in den Buchungstexten.

### Schritt 5 — Bankverbindung hinterlegen

Route: `/einstellungen` (Abschnitt Bankverbindung, falls vorhanden).
Werte aus `firma.json → bank`.

**Erwartung:** IBAN gespeichert, wird bei späteren Zahlungsausgängen
vorgeschlagen.

---

## 4. Buchungserfassung (Schritt 6)

### Schritt 6 — 40 Journal-Einträge eintragen

Route: `/journal`.

Jede Zeile aus `buchungen.csv` als eigene Buchung erfassen. Pflichtfelder
pro Zeile:

- Datum (Feld akzeptiert deutsches Datum DD.MM.YYYY oder ISO; bei Zweifel
  ISO 2025-MM-DD)
- Beleg-Nr.
- Soll-Konto
- Haben-Konto
- Betrag (Netto)
- USt-Satz (0, 7, 19)
- Buchungstext

Tastenkürzel: `Strg + N` öffnet das Neuerfassungs-Modal
(siehe `CLAUDE.md` / `USER-GUIDE-DE.md`).

**Hinweis zur Erfassungs-Reihenfolge:**

1. **Zuerst die Eröffnungsbilanz (Nr. 01-08)** am 02.01.2025. Nach diesen
   8 Buchungen soll Konto 9000 Saldo = 0 haben; auf `/berichte/susa` die
   Zeile zu 9000 kontrollieren.
2. **Dann die 32 operativen Buchungen** in chronologischer Reihenfolge
   Nr. 09-40.

**Erwartung pro Buchung:**

- Belegvalidierungs-Service warnt bei Pflichtfeld-Lücken (§ 14 Abs. 4 UStG).
- Journal listet die neue Zeile mit Soll/Haben/Betrag und markiert
  *"Entwurf"* oder direkt *"Gebucht"* je nach UI-Konfiguration.

**Geschätzter Zeitaufwand:** 30-45 Minuten bei manueller Eingabe
(40 × ~45 Sekunden). Falls eine CSV-Import-Funktion existiert
(häufig in `/buchungen/erfassung` oder via DATEV-Import), kann
`buchungen.csv` nach Anpassung des Trennzeichens und Kopfzeilen-Mappings
importiert werden — das **reduziert den Aufwand auf ~5 Minuten**, ist
aber implementierungsabhängig. Beobachtung notieren.

---

## 5. Auswertungen und Export (Schritte 7-13)

Reihenfolge: Plausibilität → Festschreibung → Auswertungen.

### Schritt 7 — Plausibilitätsprüfung

Route: `/buchfuehrung/plausi`.

**Erwartung:**
- Soll = Haben je Monat stimmt (Demo-Buchungen sind ausbalanciert).
- Konto 9000 Saldo nach allen 8 EB-Buchungen = 0.
- Keine ungebuchten Belege im Prüfzeitraum (Demo hat keine Beleg-Uploads
  ohne Buchung).

### Schritt 8 — Monats-Festschreibung Dezember 2025

Route: `/journal` → Monatsfilter Dezember 2025 → Button *"Monat
festschreiben"* (oder vergleichbare UI-Aktion).

**Erwartung:**
- Toast *"Monat Dezember 2025 festgeschrieben"*.
- Dezember-Buchungen im Journal erscheinen als gesperrt (Lock-Icon o. ä.).
- Versuch, eine Dezember-Buchung zu bearbeiten → App lehnt ab mit
  Hinweis auf GoBD Rz. 64.

### Schritt 9 — Saldenliste 31.12.2025

Route: `/berichte/susa` → Stichtag 31.12.2025.

**Erwartete Schlüsselwerte:**

| Konto | Bezeichnung | Saldo 31.12.2025 |
|---|---|---:|
| 0440 | BGA | 16.000,00 (Soll) |
| 1000 | Kasse | 28.762,00 (Soll) |
| 1200 | Bank | 38.731,00 (Soll) |
| 1400 | Forderungen | 105.550,00 (Soll) |
| 1576 | VSt 19 % (abziehbar) | 7.353,00 (Soll) |
| 0800 | Gezeichnetes Kapital | 50.000,00 (Haben) |
| 0860 | Gewinnvortrag | 40.000,00 (Haben) |
| 1600 | VLL | 41.796,00 (Haben) |
| 1770 | USt-Vorperiode | 0,00 |
| 1771 | USt 7 % | 700,00 (Haben) |
| 1776 | USt 19 % | 26.600,00 (Haben) |
| 8400 | Erlöse 19 % | 140.000,00 (Haben) |
| 8300 | Erlöse 7 % | 10.000,00 (Haben) |
| 3400 | Wareneingang 19 % | 35.000,00 (Soll) |
| 4120 | Gehälter | 60.000,00 (Soll) |
| 4210 | Miete | 10.000,00 (Soll) |
| 4530 | Kfz | 2.700,00 (Soll) |
| 4830 | AfA | 4.000,00 (Soll) |
| 4930 | Bürobedarf | 1.000,00 (Soll) |
| 9000 | EBK | 0,00 |

Drucken/PDF-Export (`Strg + P` oder Button).

### Schritt 10 — Bilanz 31.12.2025

Route: `/berichte/bilanz`.

**Erwartete Bilanzsumme:** 196.396,00 €.

**Struktur nach HGB § 266 (Kontoform):**

- Aktiva A. Anlagevermögen: BGA 16.000,00
- Aktiva B. Umlaufvermögen: Bank 38.731,00 + Kasse 28.762,00 +
  Forderungen 105.550,00 + Vorsteuer 7.353,00
- Passiva A. Eigenkapital: Gezeichnetes Kapital 50.000,00 +
  Gewinnvortrag 40.000,00 + Jahresüberschuss 37.300,00
- Passiva C. Verbindlichkeiten: VLL 41.796,00 + Umsatzsteuer 27.300,00 (1771 + 1776)

PDF-Export.

### Schritt 11 — GuV 2025 (HGB § 275 Abs. 2 GKV)

Route: `/berichte/guv`.

**Erwartete Werte:**
- Umsatzerlöse: 150.000,00 (140.000 + 10.000)
- Materialaufwand (Wareneingang): 35.000,00
- Personalaufwand: 60.000,00
- Abschreibungen: 4.000,00
- Sonstige betriebliche Aufwendungen: 10.000 + 2.700 + 1.000 = 13.700,00
- **Jahresüberschuss:** 37.300,00

PDF-Export.

### Schritt 12 — BWA Dezember 2025

Route: `/berichte/bwa` → Monat Dezember 2025.

**Erwartung:** Gegenüberstellung Dezember vs. Vormonat vs. YTD; im
Dezember Erlöse 25.000 (20.000 19 % + 5.000 7 %), Aufwand u. a.
Gehälter 15.000, Wareneingang 7.000, AfA 4.000, Kasse 300.

PDF-Export.

### Schritt 13 — Jahresabschluss-PDF

Route: `/berichte/jahresabschluss`.

**Erwartung:** Kombiniertes PDF mit Bilanz + GuV + ggf. Anhang-Platzhalter.

### Schritt 14 — UStVA Dezember 2025

Route: `/steuer/ustva` → Zeitraum Dezember 2025.

**Erwartete Kennzahlen:**

| Kennzahl | Bedeutung | Netto | Steuer |
|---|---|---:|---:|
| 81 | Lieferungen/Leistungen zu 19 % | 20.000,00 | 3.800,00 |
| 86 | Lieferungen/Leistungen zu 7 % | 5.000,00 | 350,00 |
| 66 | Abziehbare Vorsteuer (Leistungsbezüge Inland) | — | 1.330,00 |
| 83 | verbleibende Umsatzsteuer-Zahllast | — | **2.820,00** |

Button *"XML generieren"*. **Erwartung:** Datei-Download mit Datei
`ustva-2025-12.xml` (genauer Dateiname kann abweichen). XML enthält
die oben genannten Kennzahlen und das ELSTER-Schema.

### Schritt 14b — OPOS-Szenarien (`/opos`)

Nach dem Import enthält das Journal **7 OPOS-Szenarien**, die sich im
Offene-Posten-Bericht (`/opos`) prüfen lassen:

| Beleg-Nr. | Typ | Datum | Status | Offener Rest |
|---|---|---|---|---:|
| AR-2025-001 | Forderung | 15.01. | offen | 20.000,00 |
| AR-2025-002 | Forderung | 17.02. | offen | 20.000,00 |
| AR-2025-004 | Forderung | 22.06. | offen | 20.000,00 |
| AR-2025-006 | Forderung | 10.11. | offen | 20.000,00 |
| AR-2025-008 | Forderung | 15.04. | **bezahlt** (erscheint NICHT in OPOS) | 0,00 |
| AR-2025-009 | Forderung | 12.06. | **teilbezahlt** (2.000 von 5.000 gezahlt) | 3.000,00 |
| AR-2025-010 | Forderung | 10.07. | offen (lange überfällig) | 1.500,00 |
| AR-2025-101 | Forderung 7 % | 05.05. | offen | 5.000,00 |
| ER-2025-001 | Verbindlichkeit | 20.01. | offen | 7.000,00 |
| ER-2025-002 | Verbindlichkeit | 25.03. | offen | 7.000,00 |
| ER-2025-003 | Verbindlichkeit | 15.07. | offen | 7.000,00 |
| ER-2025-005 | Verbindlichkeit | 22.12. | offen | 7.000,00 |
| ER-2025-006 | Verbindlichkeit | 05.08. | **bezahlt** (erscheint NICHT in OPOS) | 0,00 |

**Erwartete Beobachtungen unter `/opos`:**

1. **Forderungen-Tab:** 7 offene Posten (nicht 8 — AR-2025-008 ist
   bezahlt und verschwindet durch Netting per Beleg-Nr.). AR-2025-009
   erscheint mit offenem Rest 3.000,00 €. AR-2025-010 steht in Bucket
   „über 90 Tage überfällig" (weil `heute` laut Code 2026-04-20 ist und
   die Default-Fälligkeit = datum + 14 Tage).
2. **Verbindlichkeiten-Tab:** 4 offene Eingangsrechnungen.
   ER-2025-006 erscheint nicht, weil die Zahlung (ER-2025-006 1600/1200)
   mit identischer Beleg-Nr. saldiert.
3. **Altersstruktur-Sektion:** Da alle Belege aus 2025 und „heute" in
   2026 liegt, landen sämtliche offene Posten im Bucket 91+.
4. **Schnell-Filter „Nur überfällig":** sollte die gleiche Liste
   liefern wie ohne Filter (alle sind überfällig).

Das Derived-Modell leitet OPOS automatisch aus dem Journal ab — es
gibt keine separate OPOS-Tabelle zu pflegen. Eine **Korrektur durch
Stornobuchung** wird sofort reflektiert (nächster Aufruf von `/opos`).

### Schritt 14c — Bank-Ausziffern mit Skonto-Automatik (Sprint 5)

Route: `/banking/reconciliation`. Datei `bankauszug.mt940` hochladen.

Die MT940-Datei enthält **7 Bank-Transaktionen**, die die vollen
Fähigkeiten des Fuzzy-Matchers + der Skonto-Automatik zeigen:

| # | Typ | Betrag | Verwendungszweck | Erwartetes Verhalten |
|---|---|---:|---|---|
| 1 | Eingang | 19.600,00 | AR-2025-001 Gauss GmbH Skonto 2 % | Match AR-2025-001 · **Skonto-Button erscheint** (2 %, 14 Tage, innerhalb Frist). 3-Zeilen-Buchung: 19.600 + 336,13 Netto + 63,87 USt = 20.000 |
| 2 | Eingang | 19.400,00 | AR-2025-002 Riemann OHG Skonto 3 % | Match AR-2025-002 · **Skonto-Button erscheint** (3 %, 10 Tage). 3-Zeilen-Buchung: 19.400 + 504,20 Netto + 95,80 USt = 20.000 |
| 3 | Eingang | 1.234,56 | Unklare Zahlung ohne Belegbezug | **Kein OPOS-Match.** Auswahl-Panel zeigt keine Kandidaten → „Beleg anfordern" oder „Überspringen" |
| 4 | Ausgang | 7.000,00 | ER-2025-001 Zahlung Beta KG | Exact-Match Verbindlichkeit ER-2025-001 · **1-Zeilen-Buchung** (1600 an 1200), kein Skonto |
| 5 | Ausgang | 895,50 | Versicherungsbeitrag Mai 2025 | Kein OPOS-Match; **Direktbuchung** auf Aufwandskonto (via „Überspringen" und später separate Buchung in `/belege`) |
| 6 | Ausgang | 6.860,00 | ER-2025-003 Zahlung Beta KG Skonto 2 % | Match ER-2025-003 (Verbindlichkeit) · **Skonto-Button erscheint** (2 %, 14 Tage). 3-Zeilen-Buchung: 1600 an 1200 6.860 + 1600 an 3736 117,65 + 1600 an 1576 22,35 = 7.000 |
| 7 | Eingang | 20.000,00 | AR-2025-006 Riemann OHG Zahlung | Exact-Match AR-2025-006 · **1-Zeilen-Buchung** (1200 an 1400), kein Skonto (skonto_pct nicht gesetzt) |

**Erwartete Beobachtungen:**

1. **Filter „Vorschlag"** zeigt alle Zeilen, für die der Fuzzy-Matcher
   einen Kandidaten mit Konfidenz ≠ `low` vorschlägt (Zeile 1, 2, 4,
   6, 7).
2. **Filter „Ausnahmen"** zeigt Zeilen ohne Match (Zeile 3, 5).
3. **Skonto-Panel erscheint nur** bei Zeilen 1, 2, 6 — dort hatte die
   Rechnungs-Buchung `skonto_pct` + `skonto_tage` in der CSV. Für die
   übrigen Zeilen bleibt der Skonto-Button unsichtbar.
4. **Preview-Tabelle im Skonto-Panel** listet die 2-3 Buchungszeilen
   mit Soll/Haben/Betrag/Beschreibung. Der Button *„Mit Skonto buchen
   (3 Zeilen)"* ist explizit zu bestätigen — kein Auto-Buchen.
5. Nach Bestätigung erzeugt die App **2-3 separate Journal-Einträge**
   mit identischer Beleg-Nr.; Hash-Kette bleibt intakt, OPOS-Posten
   schließt sich (offen = 0).
6. **Skonto-Frist-Check:** würde das Bank-Datum über der Frist liegen
   (z. B. Zeile 2 mit Bankdatum nach 27.02.), verschwindet der Skonto-
   Button und die App schlägt nur die Direktbuchung vor.

### Schritt 14d — Anlagenverzeichnis + AfA-Lauf (Sprint 6 Teil 1)

Route: `/anlagen/verzeichnis`. Datei `anlagegueter.csv` als
Eingabe-Referenz — die 6 Anlagen werden **manuell** über „Neue Anlage"
im Verzeichnis angelegt. Danach `/anlagen/afa-lauf` für den
jahresbezogenen AfA-Lauf 2025.

**Eingabe-Tabelle (pro Zeile aus `anlagegueter.csv`):**

| Inventar-Nr | Bezeichnung | Kaufdatum | AK | ND | Anlage-Konto | AfA-Konto |
|---|---|---|---:|---:|---|---|
| INV-2022-001 | Telefonanlage Kanzlei | 15.05.2022 | 4.200,00 | 8 | 0440 | 4830 |
| INV-2023-001 | Büromöbel Konferenzraum | 01.06.2023 | 8.500,00 | 13 | 0420 | 4830 |
| INV-2024-001 | PKW Firmenwagen Skoda Octavia | 15.03.2024 | 35.000,00 | 6 | 0670 | 4830 |
| INV-2024-002 | Gabelstapler Linde H16D | 01.06.2024 | 22.000,00 | 8 | 0300 | 4830 |
| INV-2024-003 | Laptop Geschäftsführung | 01.07.2024 | 1.800,00 | 3 | 0440 | 4830 |
| INV-2025-001 | Server-Schrank + USV | 02.01.2025 | 12.000,00 | 5 | 0440 | 4830 |

**Erwartete AfA 2025 (lineare AfA, § 7 Abs. 1 EStG, monatsgenau):**

| Inventar-Nr | Monats-AfA | AfA 2025 | RBW Ende 2025 |
|---|---:|---:|---:|
| INV-2022-001 | 43,75 | 525,00 | 2.275,00 |
| INV-2023-001 | 54,49 | 653,85 | 6.810,89 |
| INV-2024-001 | 486,11 | 5.833,33 | 24.305,56 |
| INV-2024-002 | 229,17 | 2.750,00 | 17.645,83 |
| INV-2024-003 | 50,00 | 600,00 | 900,00 |
| INV-2025-001 | 200,00 | 2.400,00 | 9.600,00 |
| **Summe** | — | **12.762,18** | **61.537,28** |

**Erwartete Anlagenspiegel-Aggregation (`getAnlagenspiegelData(2025, ...)`),
Stand 31.12.2025, ohne UI in Teil 1:**

| Konto | Anz. | AK-Start 01.01. | Zugänge | Abgänge | AK-Ende 31.12. | AfA kumuliert | BW-Start | BW-Ende |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 0300 | 1 | 22.000 | 0 | 0 | 22.000 | 4.354,17 | 20.395,83 | 17.645,83 |
| 0420 | 1 | 8.500 | 0 | 0 | 8.500 | 1.689,11 | 7.464,74 | 6.810,89 |
| 0440 | 3 | 6.000 | 12.000 | 0 | 18.000 | 5.225,00 | 4.300,00 | 12.775,00 |
| 0670 | 1 | 35.000 | 0 | 0 | 35.000 | 10.694,44 | 30.138,89 | 24.305,56 |
| **TOTAL** | **6** | **71.500** | **12.000** | **0** | **83.500** | **21.962,72** | **62.299,46** | **61.537,28** |

Invariante: `BW-Ende = AK-Ende − AfA-kumuliert` → 83.500 − 21.962,72 = 61.537,28 ✓

**Erwartete Beobachtungen:**

1. **Nach manuellem Anlegen aller 6 Anlagen** im Verzeichnis: Liste zeigt
   AK-Summe 83.500,00 €, aktuelle Buchwert-Summe ~61.537,28 €.
2. **AfA-Lauf 2025:** 6 Plan-Zeilen, Summe AfA 12.762,18 €.
   Jede Zeile zeigt Soll 4830 / Haben 0xxx, Betrag und Restbuchwert.
3. **Nach Bestätigung:** 6 neue Journal-Einträge mit Beleg-Nr
   `AfA-2025-INV-xxxxx` erscheinen im Journal. Die Summe entspricht der
   Plan-Summe; `afa_buchungen`-Historie hat 6 neue Einträge.
4. **Erneuter AfA-Lauf 2025:** Plan zeigt alle 6 Anlagen, aber jede mit
   „bereits für 2025 gebucht" (idempotent — Doppel-Buchung wird
   vermieden, Bestätigung erzeugt 0 neue Einträge).
5. **AfA-Lauf 2031 für den Laptop** (INV-2024-003, ND 3, Kauf 01.07.2024):
   Restjahr — nur 6 Monate × 50 = 300 € AfA, RBW 0 danach.

**Grenzen Teil 1 (Sprint 7):**

- Keine Anlagenspiegel-UI — die Daten sind per
  `getAnlagenspiegelData()` abrufbar, aber ohne fertige HGB-§-284-
  Druckansicht.
- Kein Abgangs-Workflow — das Feld `abgangsdatum` im Schema ist
  vorhanden, aber die UI bucht noch keine Ausbuchung mit Erlös.
- Keine degressive AfA, kein GWG-Sofortaufwand, kein Sammelposten —
  diese kommen in Sprint 7.
- Kein Live-Excel-Vorschau-Diagramm im Formular — die Liste zeigt nur
  AfA des aktuellen Jahres; der Jahresverlauf wird per AfA-Lauf-Seite
  jahrweise abgerufen.

### Schritt 14e — Anlagenspiegel + Abgangs-Workflow + Live-Vorschau (Sprint 6 Teil 2a)

**Anlagenspiegel-UI:** Route `/berichte/anlagenspiegel`. Nach dem
Anlegen der 6 Demo-Anlagen und AfA-Lauf 2025 zeigt der Spiegel:

- Gruppen-Tabelle pro `konto_anlage` (0300 / 0420 / 0440 / 0670).
- Spalten: Anzahl · AK 01.01. · Zugänge · Abgänge · AK 31.12. ·
  Abschreibungen kumuliert · BW 01.01. · BW 31.12.
- Totals-Zeile unten mit erwarteten Werten aus Abschnitt 14d.
- **PDF-Export** A4 Querformat (8 Spalten), DIN-konformes Layout.
- **Excel-Export** (XLSX via ExcelJS) mit Kopfzeile + Zahlenformat
  `#,##0.00 €`.

**Jahresabschluss-Integration:** Der Seite `/berichte/jahresabschluss`
zeigt jetzt zusätzlich eine Anlagenspiegel-Summary-Sektion, wenn
Anlagen im Bestand sind. Der JSON-Export enthält die
`anlagenspiegel`-Daten als eigenen Block.

**Abgangs-Workflow:** Im Anlagenverzeichnis hat jede aktive Anlage
jetzt neben „Bearbeiten" und „Löschen" auch einen Abgangs-Button
(Symbol „Tür mit Pfeil"). Klick öffnet ein Inline-Formular mit:

- Abgangsdatum (Default heute, min = Anschaffungsdatum)
- Erlös **brutto** in Euro (0 = Verschrottung)
- USt-Satz (0 / 7 / 19 %)
- Notizen (optional)

Der Service berechnet **live** den Plan:

1. **Teil-AfA** bis Abgangsmonat (pro-rata monatsgenau), `konto_afa /
   konto_anlage` — aktualisiert `afa_buchungen` für das Jahr
   idempotent.
2. **Erlös-Ausbuchung:** `1200 / konto_anlage`, Betrag = min(netto,
   RBW am Abgang). Bei Verschrottung (Erlös 0) entfällt.
3. **Gewinn-Zeile** (wenn Netto > RBW): `1200 / 2700`, Differenz =
   Buchgewinn (Außerordentliche Erträge).
   **Verlust-Zeile** (wenn Netto < RBW): `2800 / konto_anlage`,
   Differenz = Buchverlust (Außerordentliche Aufwendungen).
   Bei **Verschrottung**: `2800 / konto_anlage` auf Höhe RBW.
4. **USt-Zeile** (wenn USt-Satz > 0): `1200 / 1776` bei 19 % bzw.
   `1200 / 1771` bei 7 %.

Nach Bestätigung erzeugt der Service 2–4 Journal-Einträge (alle
mit identischer Beleg-Nr `ABG-<inventar_nr>`) und setzt die Anlage
auf `aktiv = false`, `abgangsdatum`, `abgangserloes`.

**Demo-Szenario (empfohlen):** Verkauf der alten Telefonanlage
INV-2022-001 (AK 4.200 € ND 8 Jahre, gekauft 15.05.2022) am
30.06.2025 an einen Händler für 500 € brutto (inkl. 19 % USt).

| Rolle | Soll | Haben | Betrag | Erläuterung |
|---|---|---|---:|---|
| teil_afa | 4830 | 0440 | 262,50 | Teil-AfA Jan–Jun 2025 |
| erloes | 1200 | 0440 | 420,17 | Netto-Erlös bis RBW |
| verlust | 2800 | 0440 | 2.117,33 | Buchverlust (RBW 2.537,50 − 420,17) |
| ust | 1200 | 1776 | 79,83 | USt 19 % auf Verkaufspreis |
| **Summe Bank-Eingang** | | | **500,00** | = Brutto-Erlös ✓ |
| **Summe Aufwand** | | | **2.379,83** | = Teil-AfA 262,50 + Verlust 2.117,33 ✓ |

Invariante nach Abgang: Anlage-Konto 0440 hat für INV-2022-001 Saldo
0 (Netto-Methode — AK 4.200 abgebaut durch laufende AfA 2022–24
+ Teil-AfA 2025 + Erlös-Ausbuchung 420,17 + Verlust-Ausbuchung
2.117,33 = 4.200,00 Haben-Summe).

**Live-AfA-Vorschau:** Im Neu-Anlage-Formular zeigt sich automatisch
unter den Feldern eine scrollbare Tabelle mit Jahr / AfA /
Kumuliert / Restbuchwert für die gesamte Nutzungsdauer, sobald AK
+ ND + Anschaffungsdatum + AfA-Methode „linear" gesetzt sind.
Aktualisiert sich live bei jeder Feld-Änderung.

**Grenzen Teil 2a (durch Teil 2b ergänzt, siehe Schritt 14f):**

- Kein automatisches Jahresabschluss-PDF mit integriertem Anlagen-
  spiegel als Seite (wird als separates PDF unter `/berichte/
  anlagenspiegel` erzeugt).
- ~~Abgang nur bei direkter Netto-Methode~~ — **in Teil 2b
  geöffnet:** indirekte Brutto-Methode löst bei Abgang die
  kumulierte Wertberichtigung auf und bucht den Rest gegen das
  Anlage-Konto.
- ~~Degressive AfA, GWG, Sammelposten~~ — **GWG + Sammelposten in
  Teil 2b implementiert**; Degressiv bleibt disabled (§ 7 Abs. 2
  EStG ausgelaufen 31.12.2024).

### Schritt 14f — GWG + Sammelposten + Indirekte Brutto-Methode (Sprint 6 Teil 2b)

**Drei neue AfA-Methoden verfügbar** im Anlage-Formular:

| Methode | Rechtsgrundlage | AK-Grenze | Nutzungsdauer |
|---|---|---|---|
| Linear | § 7 Abs. 1 EStG | keine | 1-50 J. frei wählbar |
| **GWG Sofort** | § 6 Abs. 2 EStG | ≤ 800 € netto | **fest 1** (Sofortabschreibung) |
| **Sammelposten** | § 6 Abs. 2a EStG | **> 250 €** und **≤ 1.000 €** netto | **fest 5** (Pool-AfA, volle Jahresrate) |
| Degressiv | § 7 Abs. 2 EStG | — | — (**aktuell disabled** — Gesetzliche Zulässigkeit ausgelaufen 31.12.2024) |

**GWG-Besonderheit:** Die volle AK wird im Anschaffungsjahr abgeschrieben,
unabhängig vom Kaufmonat. Die 800-€-Grenze prüft **nur die UI** (Warnung
bei Überschreitung); der Calculator selbst rechnet auch mit höheren AK,
damit Altbestände aus Vor-2018-Rechtslage (410 €) oder Vor-1990 (800 DM)
abgebildet werden können.

**Sammelposten-Besonderheit:** **Volle Jahresrate auch im Erstjahr**
(kein Monatsanteil, anders als lineare AfA). § 6 Abs. 2a Satz 3 EStG
verhindert **Einzelabgänge** aus dem Pool — der Abgang-Button löst bei
Sammelposten-Anlagen einen expliziten Fehler aus. Wer den Pool vorzeitig
auflösen will, muss manuell buchen und die Anlage löschen.

**Indirekte Brutto-Methode bei Abgang:** Wenn die Anlage ein
`konto_abschreibung_kumuliert` gesetzt hat (z. B. `0480`), bucht der
Abgangs-Workflow jetzt zusätzlich eine **Auflösungs-Zeile** für die
kumulierte Wertberichtigung:

```
4830 soll / 0480 haben  (Teil-AfA, wie bei laufender AfA)
0480 soll / 0440 haben  (Auflösung kumulierte Wertberichtigung)
1200 soll / 0440 haben  (Erlös bis RBW)
... (Gewinn/Verlust + USt wie bei direkter Methode)
```

Nach dem Abgang ist der Saldo auf `0480` (Wertberichtigung) **0**
und auf `0440` (Anlage-Konto) **0** — das Anlage-Konto wurde korrekt
in AK- und Wertberichtigungs-Anteil aufgelöst.

**Erweiterte Demo-CSV:** `anlagegueter.csv` enthält jetzt 8 Anlagen
(6 + 2 neu):

| Inventar-Nr | Methode | AK | Vorgang |
|---|---|---:|---|
| … (6 Linear-Anlagen unverändert) | linear | — | AfA 2025 unverändert |
| INV-2025-002 | gwg_sofort | 350,00 € | **Sofort-AfA 350 im Anschaffungsjahr** (0480 soll / 4840 haben als Buchung durch AfA-Lauf) |
| INV-2025-003 | sammelposten | 500,00 € | **Pool-AfA 100 € × 5 Jahre** (2025-2029); ab 2030 = 0 |

Erwartete Gesamt-AfA 2025 jetzt: 12.762,18 (alt Linear) + 350 (GWG) +
100 (Sammelposten) = **13.212,18 €**.

**Live-Vorschau im Formular:** Zeigt automatisch die methoden-
spezifische Anzahl Zeilen:
- GWG: **1 Zeile** (Anschaffungsjahr = AK, RBW 0)
- Sammelposten: **5 Zeilen** (gleiche Rate je Jahr, RBW sinkt linear)
- Linear: wie bisher (N + ggf. 1 Restjahr)

### Schritt 14g — USt-Sonderfälle § 13b + IG-Lieferungen (Sprint 7)

Die `buchungen.csv` enthält jetzt **5 neue USt-Sonderfall-Szenarien**,
die die UStVA-Kennzahlen Kz 41/46/47/73/78/89 exerzieren:

| Beleg-Nr | Datum | Soll/Haben | Betrag | Kz | Szenario |
|---|---|---|---:|---|---|
| RC-2025-001 | 15.03.2025 | 3100 / 1600 | 2.500,00 | 46 | EU-B2B-Dienstleistung (Softwarelizenz IE), § 13b Abs. 1 UStG |
| RC-2025-002 | 12.05.2025 | 3120 / 1600 | 8.000,00 | 73 | Bauleistung Rohbau, § 13b Abs. 2 Nr. 2 UStG |
| RC-2025-003 | 20.07.2025 | 3130 / 1600 | 1.200,00 | 78 | Gebäudereinigung, § 13b Abs. 2 Nr. 3 UStG |
| IG-2025-001 | 15.06.2025 | 1400 / 8125 | 15.000,00 | 41 | IG-Lieferung an EU-Kunde FR SARL, § 4 Nr. 1b UStG |
| IG-2025-002 | 22.09.2025 | 3425 / 1600 | 7.500,00 | 89 | IG-Erwerb aus EU CZ, Bemessungsgrundlage 19 % |

**Neue SKR03-Konten** (Sprint 7 Seed-Ergänzung):
- `1574` Abziehbare Vorsteuer aus innergem. Erwerb (Kz 61)
- `3120` Bauleistungen § 13b Abs. 2 Nr. 2 UStG
- `3130` Gebäudereinigung § 13b Abs. 2 Nr. 3 UStG
- `3425` Innergemeinschaftlicher Erwerb 19 % Bemessungsgrundlage

**Erwartete UStVA-Summen für Demo-Jahr 2025** (nur neue Sonderfall-
Beiträge, reguläre Umsätze aus den Basis-Buchungen ungeachtet):

| Kz | Bedeutung | Netto / Bemessung | USt |
|---|---|---:|---:|
| 41 | IG-Lieferungen (§ 4 Nr. 1b UStG) | 15.000,00 | steuerfrei |
| 46 | § 13b Abs. 1 / Nr. 1-5 Bemessungsgrundlage | 2.500,00 | — |
| 73 | § 13b Abs. 2 Nr. 2 Bauleistungen | 8.000,00 | — |
| 78 | § 13b Abs. 2 Nr. 3 Gebäudereinigung | 1.200,00 | — |
| 47 | § 13b-Steuer (Selbstbesteuerung 19 %) | — | 2.223,00 |
| 89 | IG-Erwerb Bemessungsgrundlage 19 % | 7.500,00 | 1.425,00 |
| 61 | Vorsteuer IG-Erwerb | — | 1.425,00 |

**Neue ZM-Ausgabe** (`/steuer/zm`): nach Erfassen des IG-2025-001
erscheint eine ZM-Meldung Kz 41 = 15.000 € für FR SARL (USt-ID
einzutragen über den Empfänger-Stammdaten-Block auf der Page).

**Neuer XML-Export** (`/steuer/zm` Button „XML"): ELMA5-ähnliches
Preview-XML zum Kopieren in das BOP-Online-Formular des BZSt. Der
Button ist explizit als *Preview* gekennzeichnet — keine
direkte Übermittlung.

**Reverse-Charge-Validierung:** Wenn im Belegerfassungs-Formular
(`/buchungen/erfassung`) die „Reverse Charge"-Checkbox aktiv ist,
aber ein falsches Aufwandskonto gewählt wurde (z. B. 4100 statt
3100-3159), erscheinen die neuen Warnings W105/W106/W107:

- W105: RC ohne Konto im 3100-3159-Bereich
- W106: RC + 3120-3129 aber Beschreibung ohne „Bau"
- W107: RC + 3130-3139 aber Beschreibung ohne „Reinigung"/„Gebäude"
- W108: IG-Lieferung ohne Erlöskonto im 8120-8199-Bereich

Die Warnings sind **keine Blocker** — der Buchhalter kann im Einzel-
fall begründet abweichen; sie dienen als Plausi-Hinweis bei der
§-13b-Subsumtion.

### Schritt 15 — EÜR (bewusst nicht durchgeführt)

Für eine GmbH ist die Einnahmen-Überschuss-Rechnung nach § 4 Abs. 3
EStG **fachlich nicht einschlägig**; eine GmbH bilanziert nach § 242
HGB. Der Aufruf `/steuer/euer` wird in dieser Demo daher **bewusst
ausgelassen**. Falls versehentlich aufgerufen: Ergebnis notieren, aber
nicht als Teil des Musterlaufs werten.

---

## 6. Hinweise und bewusste Vereinfachungen

- **Personalkosten in Journal vs. Mitarbeiter-Stammdaten:** Die
  Quartalsbuchungen auf Konto 4120 mit je 15.000,00 € sind eine
  pädagogische Vereinfachung. Sie entsprechen **nicht** der Summe der
  drei Mitarbeiter-Bruttos × 3 Monate × AG-SV. Dieser Demo-Lauf
  demonstriert Buchungsfluss, nicht die vollständige Lohnabrechnung.
  Für eine echte Lohnabrechnung: `/personal/abrechnung` mit den
  Stammdaten aus `mitarbeiter.csv` durchlaufen — dabei werden
  Vorsorgepauschale, SV-Beiträge, Lohnsteuer automatisch berechnet.
- **Kleinunternehmer:** Flag in Einstellungen ist **nein**. Umsatzsteuer
  wird ausgewiesen und geschuldet.
- **Jahresabgrenzung:** Keine aktive Rechnungsabgrenzung (ARAP/PRAP)
  in diesem Demo-Lauf.
- **Debitoren-/Kreditoren-Einzelbuchungen:** Alle Forderungen und
  Verbindlichkeiten laufen über die Sammelkonten 1400 bzw. 1600;
  keine Einzel-Sub-Ledger pro Kunde/Lieferant.
- **USt-Automatik:** Das Feld `USt_Satz_Prozent` je Buchung signalisiert
  der App, dass neben dem Soll/Haben-Paar der USt-Anteil automatisch auf
  1576 (Vorsteuer) bzw. 1771/1776 (Ausgangs-USt) gebucht werden soll.
  Sollte die UI dieses Feld nicht akzeptieren, sind pro USt-behafteter
  Buchung zwei Einträge nötig (Netto + USt-Anteil getrennt) — dies als
  Beobachtung aufnehmen.

---

## 7. Reihenfolge der Beobachtungs-Erfassung

Der Buchhalter arbeitet Schritt 1 bis Schritt 14 sequentiell ab und
trägt pro Schritt in `BEOBACHTUNGEN.md` ein:

- **Schritt** (Nummer)
- **Erwartung** (aus diesem README übernommen)
- **Tatsächlich** (was im Browser passiert ist)
- **Problem?** (Ja/Nein + Kurzbeschreibung; leer wenn wie erwartet)

Das Protokoll dient als Input für spätere UX- und
Funktions-Verbesserungs-Sprints. Es ist ausdrücklich **nicht** die
Bug-Dokumentation — Bugs werden bei Bedarf separat erfasst (Issues,
`docs/NEXT-CLAUDE-HANDOFF.md`-Anmerkungen).

---

## 8. Abschluss des Walkthroughs

Nach Schritt 14:

- Dateien im Browser-Download-Ordner: 6 PDFs + 1 XML.
- `BEOBACHTUNGEN.md` ausgefüllt.
- Eventuell entdeckte Bugs / UX-Probleme zusammenfassen (Abschnitt
  am Ende von `BEOBACHTUNGEN.md`).

Die Ergebnisse können anschließend in den nächsten Handoff an eine
neue Session einfließen, insbesondere:

- Probleme bei der manuellen Erfassung von 40 Buchungen → Anforderung
  für CSV-Import.
- Unklarheiten bei USt-Automatik → Präzisierung in User-Guide.
- Festschreibungs-Abläufe → Klärung mit FestschreibungsService.
