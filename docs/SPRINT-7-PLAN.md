# Sprint 7 — Planung (6 Kandidaten aus NEXT-CLAUDE-HANDOFF)

Baseline: **932 Tests / 61 Dateien**, Stand 2026-04-20 (Sprint 6 Teil 2b
abgeschlossen). Der Plan bewertet alle 6 Kandidaten, priorisiert und
empfiehlt genau einen für Sprint 7.

---

## 1. Pre-Check-Ergebnis pro Kandidat

Grep-/Glob-basiert gegen den aktuellen Baum `D:/harouda-app/src`:

| # | Kandidat | Bereits vorhanden | Fundstellen / Kommentar |
|---|---|---|---|
| a | Anlagen-CSV-Import | **~0 %** | Keine `AnlagenCsvImportPage`, keine `anlagen/csvImport.ts`. Muster für CSV-Importer existiert in `domain/journal/csvImport.ts` (7/8/9/11-Spalten-Varianten) und `lib/datev/DatevExtfImporter.ts` — Pattern wiederverwendbar. |
| b | Wiederkehrende Buchungen | **~0 %** | Grep nach `wiederkehrend`, `recurring`, `Dauerbuchung`: keine relevanten Treffer. Echter Neubau. |
| c | Kassenbuch GoBD Rz. 111-113 | **~10 %** | Konto 1000 Kasse seeded; Demo-CSV enthält `KA-001..003` Kassen-Buchungen. Kein Kassenbuch-Page, keine fortlaufende Kassennummer, keine Kassensturz-Plausi (Saldo ≥ 0 jederzeit), kein Bargeldbestand-Tracking. |
| d | USt-Sonderfälle § 13b + IG | **~80 % ⚠️** | **Gap-Closure statt Neubau.** `ustvaStructure.ts` enthält bereits Kz 46 / 47 / 52 / 73 / 78 für § 13b Abs. 1 + Abs. 2 Nr. 1-11. `skr03UstvaMapping.ts` mapped Konten 3100-3159 auf die Kennzahlen + Vorsteuer 1577 → Kz 67. IG-Lieferung Kz 41/42/44 in `ZmBuilder.test.ts` getestet. IG-Erwerb Vorsteuer 1574 → Kz 61. Getestet im `UstvaBuilder.test.ts` (Zeile 184: „§ 13b Bauleistung Kz 73 aggregiert in Kz 47"). |
| e | Personenkonten (Debitor/Kreditor) | **~5 %** | Sammelkonten 1400 Forderungen L+L / 1600 Verbindlichkeiten L+L sind gesetzt; journal_entries hat `gegenseite`-Freitextfeld (nicht FK). Keine eigene Debitoren/Kreditoren-Entity, kein DATEV-Nummernbereich (10000-69999 / 70000-99999). Massiver Umbau: alle OPOS/Mahnwesen/GoBD-Audit-Pfade berührt. |
| f | Kombiniertes Jahresabschluss-PDF | **~30 %** | Einzel-Generatoren existieren: `BilanzPdfGenerator` + `GuvPdfGenerator` + `AnlagenspiegelPdfGenerator` (Teil 2a) auf gemeinsamer `PdfReportBase`-Infrastruktur. `JahresabschlussPage` hat nur JSON-Export + Summary-Sections + Deep-Links auf die Einzelseiten. Kein kombinierter „JahresabschlussPdfGenerator". Offen in `SPRINT-6-TEIL-2A-FRAGEN.md` Frage 1. |

### Abhängigkeiten

- **a ↔ Sprint 6**: Anlagen-Basis (Migration 0025, Repo, Types,
  UI-Verzeichnis) aus Sprint 6 Teil 1 bereit. CSV-Import hängt an
  diesen Grundlagen — arbeitet gegen `createAnlagegut`.
- **b ↔ keine**: Wiederkehrende Buchungen sind neu und unabhängig.
  Könnte gegen `createEntry` und Festschreibungs-Service laufen.
- **c ↔ Journal + Hash-Kette**: Kassenbuch erzeugt Journal-Einträge
  mit GoBD-Hash-Kette. Berührt keine Code-Dateien der Hash-Kette,
  aber neue fortlaufende Kassennummer muss in der `beleg_nr`-
  Konvention passen.
- **d ↔ UstvaBuilder + Belegerfassung**: Die meisten Pfade sind
  drin. Gap liegt bei Demo-Szenarien + UI-Unterstützung in
  `BelegerfassungPage` (USt-Art-Dropdown mit Reverse-Charge-
  Optionen) + ZM-XML-Export (ELMA5) + Dokumentation.
- **e ↔ alles**: OPOS (derived aus 1400/1600), Mahnwesen
  (Gegenseite aus Freitextfeld), Z3-Export, Bilanz-Builder, GuV-
  Builder, BWA, UStVA-Mapping, Belegerfassung-UI, Demo — alles
  würde berührt. Hoher Blast-Radius auf die 932 Tests.
- **f ↔ Bilanz + GuV + Anlagenspiegel**: Alle Teil-Generatoren
  da. Kombination ist additiv, kein Umbau.

### Blast-Radius auf die 932 Tests

| Kandidat | Risiko für Bestandstests | Begründung |
|---|---|---|
| a | sehr gering | additiv, neuer Code; bestehende Journal-CSV-Tests sind separate Datei |
| b | gering | neue Schema-Tabelle + neuer Service; keine Berührung bestehender Pfade |
| c | mittel | neuer UI-Pfad, aber Journal-Buchungen gehen durch `createEntry` wie bisher |
| d | gering-mittel | Gap-Closure in bestehenden Modulen — Risiko, dass UStVA-Tests bei Demo-Erweiterungen rot werden, falls Mapping-Regeln doch abweichen |
| e | **hoch** | OPOS-Derived-Logik, Mahnwesen, Bilanz-Mapping, Belegerfassung-Tests würden alle auf Sammel-vs-Personenkonto-Entscheidung stoßen |
| f | sehr gering | neuer Generator, bestehende 3 Generatoren unverändert |

---

## 2. Rechtslage-Check pro Kandidat (Stand April 2026)

### a) Anlagen-CSV-Import

Keine spezifische EStG-/HGB-Vorschrift. **GoBD-Kontext:**

- GoBD Rz. 99-102: Daten-Import ist zulässig, Import-Quelle muss
  dokumentiert und die Verknüpfung nachvollziehbar sein.
- GoBD Rz. 107 ff.: Stammdaten-Änderungen sind protokollierungs-
  pflichtig (bei aktiv → inaktiv / Abgang).

**Unsicherheit: keine.**

### b) Wiederkehrende Buchungen

- § 146 Abs. 1 AO: Einzelaufzeichnungspflicht — jede Buchung ist
  einzeln aufzuzeichnen. Automatische wiederkehrende Buchungen
  müssen **nachvollziehbar** bleiben (keine stille Sammelbuchung).
- § 146 Abs. 2 AO: Zeitgerechte Aufzeichnung (im Monat der
  Entstehung). Auto-Booking-Zeitpunkt muss mit dem tatsächlichen
  Leistungsdatum übereinstimmen.
- GoBD Rz. 47-48: Vollständigkeit und Unveränderbarkeit —
  wiederkehrende Buchungen müssen ebenfalls in die Hash-Kette.

**Unsicherheit: keine.**

### c) Kassenbuch (GoBD Rz. 111-113)

- § 146 Abs. 1 AO: **Einzelaufzeichnungspflicht** für alle
  Bargeschäfte (außer Branchenausnahmen).
- § 146 Abs. 2 AO: Chronologische, zeitnahe, fortlaufende Führung.
- **GoBD Rz. 111:** Kassensturzfähigkeit — der Bargeldbestand muss
  jederzeit mit dem Kassenbuch-Saldo übereinstimmen (§ 146 Abs. 1
  S. 2 AO).
- **GoBD Rz. 112:** Fortlaufende Nummerierung der Kassenbuchungen.
- **GoBD Rz. 113:** Keine negativen Kassenbestände zulässig.
- § 147 Abs. 1 AO: 10 Jahre Aufbewahrung.
- **KassenSichV + § 146a AO:** TSE-Pflicht gilt für
  **Registrierkassen mit Einzelaufzeichnung** (elektronische
  Kassensysteme). Für Handkassen-Kassenbuch (Papier oder manuelle
  Einzelbuchung) ist KassenSichV **nicht** einschlägig — das
  reicht für harouda-app als Buchhaltungs-Tool, nicht POS-System.

**Unsicherheit flag:** Die Abgrenzung „handgeführtes Kassenbuch
vs. elektronische Registrierkasse" ist in der BMF-Praxis nuanciert.
Wenn Kanzlei-Mandanten Registrierkassen benutzen, müssen sie
**eigene TSE-Geräte** betreiben; harouda-app bildet nur die
Kassenbuch-Abbildung ab.

### d) USt-Sonderfälle (§ 13b UStG + IG-Lieferungen)

- **§ 13b UStG:** Steuerschuldnerschaft des Leistungsempfängers
  (Reverse Charge). 7 Anwendungsfälle:
  - Abs. 1: sonstige Leistungen aus EU-Drittland
  - Abs. 2 Nr. 1: bestimmte Bauleistungen ausländischer Unternehmer
  - Abs. 2 Nr. 2: Bauleistungen (Inland, zwischen Bauunternehmen)
  - Abs. 2 Nr. 3: Gebäudereinigung
  - Abs. 2 Nr. 4: Lieferungen von Gas/Strom durch ausländische
    Unternehmer
  - Abs. 2 Nr. 5b: bestimmte Edelmetalle / Schrott
  - Abs. 2 Nr. 6-11: weitere Spezialfälle (Emissionszertifikate,
    Mobilfunkgeräte, Tablets, Integrierte Schaltkreise …)
- **UStVA-Kennzahlen:** Kz 46 (Abs. 1/2 Nr. 1-5 Bemessungsgrundlage),
  Kz 52 (Abs. 2 Nr. 4/5b/6-11), Kz 73 (Nr. 2 Bau), Kz 78 (Nr. 3
  Reinigung), Kz 47 (Steuer aggregiert), Kz 67 (Vorsteuer nach
  § 15 Abs. 1 Nr. 4 UStG).
- **§ 4 Nr. 1b UStG / § 6a UStG:** IG-Lieferung steuerfrei, wenn
  Abnehmer Unternehmer mit USt-ID und Ware in anderen EU-Staat
  gelangt.
- **§ 18a UStG:** Zusammenfassende Meldung monatlich/quartalsweise
  (Schwellenwert 50.000 € Quartalsumsatz). Format: ELMA5 / ERiC.
- **UStVA-Kennzahlen IG:** Kz 41 (IG-Lieferung § 4 Nr. 1b), Kz 42
  (Dreiecksgeschäft § 25b), Kz 44 (IG-Lieferung Neufahrzeug an
  Nicht-Unternehmer).

**Unsicherheit: keine in der Kennzahlen-Zuordnung.** Die in
Sprint 7 noch fehlenden Stücke sind voraussichtlich Demo +
ELMA5-Generierung + UI-Unterstützung — keine Rechts-Überraschungen.

### e) Personenkonten

- **§ 238 HGB:** Handelsbücher ordnungsgemäß führen.
- **§ 145 AO / § 146 AO:** Einzelaufzeichnungspflicht erfordert,
  dass jede Forderung / Verbindlichkeit eindeutig einem Debitor /
  Kreditor zugeordnet werden kann.
- **DATEV-SKR03-Konvention:**
  - Debitoren: **10000 – 69999** (6-stellige Nummern) bzw.
    **10000 – 69999 / 100000 – 699999** (7-stellige bei großen
    Mandanten).
  - Kreditoren: **70000 – 99999** (6-stellig) bzw.
    **700000 – 999999** (7-stellig).
- **GoBD** schreibt keine spezifische Form vor; Sammelkonten sind
  **zulässig**, wenn die Gegenseite pro Buchung dokumentiert ist.

**Unsicherheit flag:** Die Entscheidung „Sammelkonten behalten +
Personenkonten als Additiv" vs. „Sammelkonten durch Personenkonten
ersetzen" ist eine **Architektur-Frage**, die nicht autonom
entschieden werden sollte. Migration hätte hohen Blast-Radius.

### f) Kombiniertes Jahresabschluss-PDF

- **§ 242 HGB:** Jahresabschluss = Bilanz + GuV (Einzelkaufleute,
  Personengesellschaften).
- **§ 264 Abs. 1 HGB:** Bei Kapitalgesellschaften zusätzlich
  **Anhang** (§ 284 HGB Anlagenspiegel).
- **§ 325 HGB:** Offenlegungspflicht Bundesanzeiger für
  Kapitalgesellschaften (Größenklassen § 267 HGB).
- **§ 267 HGB:** Größenklassen (klein/mittel/groß) bestimmen
  Umfang des Anhangs und der Offenlegung.

**Unsicherheit: keine.** Der PDF-Generator ist reine Darstellung,
keine Steuererklärung.

---

## 3. Prioritäts-Matrix (Scoring 1-5, 5 = optimal)

| Kandidat | Nutzen | Komplexität (↓ = ↑ Score) | Abhäng. (↓ = ↑) | Bestand-Risiko (↓ = ↑) | Vorbereitung | Demo-Wert | **Σ** |
|---|---:|---:|---:|---:|---:|---:|---:|
| a Anlagen-CSV-Import | 3 | 4 | 3 | 5 | 4 | 4 | **23** |
| b Wiederkehrende Buchungen | 4 | 2 | 4 | 4 | 2 | 4 | **20** |
| c Kassenbuch GoBD | 5 | 2 | 4 | 3 | 2 | 4 | **20** |
| d USt-Sonderfälle (Gap-Closure) | 4 | **5** | 5 | 4 | **5** | 5 | **28** |
| e Personenkonten | 5 | **1** | **1** | **1** | 2 | 3 | **13** |
| f Kombiniertes Jahresabschluss-PDF | 2 | 4 | 5 | 5 | 4 | 3 | **23** |

**Scoring-Legende:**
- **Nutzen** = fachlicher Nutzen für Buchhalter/Kanzlei im Alltag
- **Komplexität** = Implementierungs-Aufwand (invers skaliert)
- **Abhängigkeiten** = Grad der Unabhängigkeit (5 = keine Abhängigkeiten)
- **Bestand-Risiko** = Risiko für 932 bestehende Tests (invers)
- **Vorbereitung** = bereits vorhandene Basis
- **Demo-Wert** = Wie gut bereichert das die Musterfirma-Demo

---

## 4. Empfehlung für Sprint 7

### Primäre Empfehlung: **Kandidat (d) USt-Sonderfälle — Gap-Closure**

**Begründung:**

1. **Höchster Gesamt-Score (28/30).** Die Matrix bevorzugt ihn auf
   allen Achsen außer Nutzen, wo (e) höher liegt.
2. **Muster aus Sprint 3/4/5** — zwischen 70-90 % der spezifizierten
   Arbeit war bei denen schon da. Hier ebenfalls: ~80 % vorhanden.
   Option-B-Gap-Closure ist der passende Modus.
3. **Fachliche Relevanz für Kanzleien hoch** — jedes B2B-Unternehmen
   mit EU-Kunden, Baubranche oder IT-Handel hat mit § 13b zu tun.
   Die UStVA-Abgabe scheitert ohne korrekte Kennzahlen-Erfassung.
4. **Minimaler Blast-Radius** — Gap-Closure berührt das
   Ustva-Mapping in additiver Weise; bestehende Tests bleiben
   grün.
5. **Demo-Wert hoch** — neue Szenarien (EU-B2B-Dienstleistung,
   Bauleistung zwischen zwei Baubetrieben, innergemeinschaftliche
   Lieferung) erweitern die Musterfirma-Demo um mindestens 3-4
   realitätsnahe Fälle.

### Alternative Empfehlung: **Kandidat (a) Anlagen-CSV-Import**

Wenn der User **Greenfield-Arbeit** bevorzugt oder die Anlagen-
buchhaltung-Sprints „abschließen" möchte: (a) ist der logische
Abschluss der Anlagenbuchhaltung. Niedrigerer Fachnutzen, aber
sauberer End-to-End-Demo-Flow (Journal-CSV-Import + Anlagen-CSV-
Import + Bank-MT940-Import = 3 Import-Pfade).

### NICHT empfohlen für Sprint 7

- **(e) Personenkonten** — Blast-Radius zu hoch (13/30 Score).
  Sollte eigener Sprint 8+ sein, nach User-Architektur-Konsultation:
  „Sammelkonten beibehalten + Personenkonten additiv" vs.
  „Sammelkonten ersetzen". Das ist eine Architektur-Frage, nicht
  autonom entscheidbar.
- **(b) Wiederkehrende Buchungen** — guter Nutzen, aber echter
  Neubau mit ~400-500 Zeilen Schema + Service + UI + Auto-Booking-
  Mechanik (Trigger vs. Button vs. Edge-Function?). Architektur-
  Frage.
- **(c) Kassenbuch** — fachlich wichtig, aber Einzelaufzeichnungs-
  und Nummerierungs-Pflicht + Plausi-Checks sind Rechts-getrieben,
  nicht nur technisch. Eigener Sprint mit präzisen GoBD-Rz.-111-113-
  Entscheidungen.
- **(f) Kombiniertes PDF** — niedriger Fachnutzen (nice-to-have),
  weil einzelne PDFs bereits funktionieren. Später möglich.

---

## 5. Phasen-Plan für den empfohlenen Sprint (d)

### Phase 0 — Detaillierter Pre-Check (zuerst!)

Muss vor Implementierung genau quantifizieren, **was konkret
fehlt** von den ~20 % Gap:

1. Grep alle SKR03-Konten im Range 3100-3159 → wie viele tatsächlich
   seeded? Welche fehlen für Demo-Szenarien?
2. Prüfen ob `BelegerfassungPage` bereits UI für Reverse-Charge-
   Buchungen hat (USt-Art-Dropdown oder Häkchen).
3. Prüfen ob ZM-Export existiert als XML (ELMA5 vs. CSV).
4. Prüfen ob UStVA-XML die Kz 46/47/52/73/78 korrekt ausgibt.
5. Demo-Szenarien in `buchungen.csv` zählen — gibt es schon einen
   Reverse-Charge-Fall?

**Wenn > 90 % fertig:** STOPP + alternativer Kandidat
(z. B. kleiner Scope mit ZM-ELMA5-Export + Demo-Szenarien + UI-
Unterstützung).

### Phase 1 — SKR03-Konten ergänzen (falls nötig)

- Prüfen + ergänzen von 3100-3159-Konten (Bezugskonten für § 13b)
  + 8125/8336/8338 (steuerfreie EU-Umsätze)
- 1574 / 1577 sind vorhanden (Vorsteuer IG-Erwerb / § 13b)
- Falls fehlend: +3-5 Konten im Seed, keine neuen Tests nötig

### Phase 2 — UI-Unterstützung in Belegerfassung

- USt-Art-Dropdown erweitern: „Regulär 19/7", „IG-Lieferung
  steuerfrei", „Reverse-Charge Empfänger", „Reverse-Charge Bau",
  „Reverse-Charge Gebäudereinigung"
- Bei Reverse-Charge: automatisches Erzeugen der Steuer-Buchung
  (sowohl Soll- als auch Haben-Seite, da Selbstbesteuerung)
- Tests: Belegvalidierungs-Service erweitern um Reverse-Charge-
  Checks

### Phase 3 — ZM-Export ELMA5-XML

- Prüfen ob `ZmBuilder.ts` schon XML erzeugt oder nur Aggregation
- ELMA5-Format nach § 18a UStG implementieren (DTD/XSD bei BZSt)
- Tests: XML-Struktur + Content-Validierung

### Phase 4 — Demo-Szenarien + Dokumentation

- `buchungen.csv` +3-5 Reverse-Charge-/IG-Szenarien:
  - EU-B2B-Dienstleistung eingekauft (Software-Lizenz aus Irland)
  - Bauleistung zwischen Baubetrieben (§ 13b Abs. 2 Nr. 2)
  - IG-Lieferung an EU-Kunden (Kz 41)
  - IG-Erwerb aus EU (Kz 89)
- README Schritt 14g mit UStVA-Erwartung: Kz 46/47/52/73/78/41/89
- `SPRINT-7-DECISIONS.md` mit Entscheidungen

### Phase 5 — Tests + Verifikation

- UstvaBuilder-Tests um 3-5 neue Fälle erweitern
- ZM-ELMA5-XML-Test
- Belegvalidierungs-Tests für Reverse-Charge
- **Erwartung: 932 → ~945-955** (+13-23 Tests)

---

## 6. Scope-Grenzen (falls Empfehlung d gewählt wird)

- **Hash-Kette unverändert**
- **Bestehende 932 Tests bleiben grün**
- **Keine neue Migration** — 3100-3159-Konten-Seed reicht
- **Keine neuen npm-Dependencies**
- **TypeScript strict + Decimal.js durchgängig**
- **Nicht in Scope:**
  - ERiC-Backend-Direktübermittlung (P1 Blocker aus CLAUDE.md §10)
  - Dreiecksgeschäfte § 25b UStG (Kz 42 existiert, komplexer Rechts-
    fall separater Sprint)
  - OSS / IOSS / MOSS (Fernverkauf an Endverbraucher)
  - Steuerberaterbescheinigung / Bestätigungsverfahren MIAS

---

## 7. Test-Erwartung (Empfehlung d)

| Phase | Ziel-Tests | Kommentar |
|---|---:|---|
| Phase 1 Seed | 0 | nur Daten, keine Logik |
| Phase 2 UI + Validierung | ~5 | BelegvalidierungsService Reverse-Charge |
| Phase 3 ZM ELMA5 | ~5 | XML-Struktur + Content |
| Phase 4 Demo/Doku | ~3 | Integrations-Tests gegen Demo-CSV |
| Phase 5 UStVA | ~5 | Builder-Tests für neue Demo-Szenarien |
| **Summe** | **~18** | konservative Schätzung |
| **Gesamt** | **932 → ~950** | |

---

## 8. Plan zur Freigabe bereit

Nach User-Entscheidung zwischen **(d) primär** oder **(a) als
Alternative** kann ein detaillierter Umsetzungs-Plan für den
gewählten Kandidaten in separatem Dokument erstellt werden
(analog `SPRINT-6-TEIL-2B-PLAN.md`).

**Status:** Plan-Dokument erstellt, wartet auf User-Review und
Auswahl des Sprint-7-Kandidaten.

**Nicht angetastet:** Code, Tests, alle anderen Dokumente.
