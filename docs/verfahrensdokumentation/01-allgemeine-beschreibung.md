# Kapitel 1 — Allgemeine Beschreibung

> Status: v0.1 BEFÜLLT | Version: 0.1 | Letztes Update: 2026-04-20

## Zweck dieses Kapitels

Überblick über Produkt, Anwendungsbereich, rechtliche Einordnung,
beteiligte Rollen, Prozess-Landkarte und Systemabgrenzung. Adressaten
sind Wirtschaftsprüfer:innen nach IDW PS 880 und Betriebsprüfer:innen
des Finanzamts. Dieses Kapitel stellt den Kontext her, in dem die
folgenden Kapitel (Anwendung, Technik, Betrieb, Datenschutz,
Retention, Prüfpfade, IKS) zu lesen sind.

---

## 1.1 Zweck und Gegenstand des Verfahrens

**harouda-app** ist eine Softwareanwendung zur Unterstützung der
Finanzbuchhaltung und angrenzender steuerlicher Pflichten für deutsche
Steuerberatungs-Kanzleien. Sie wird über den Browser bedient und stützt
sich serverseitig auf eine Postgres-Datenbank mit Row-Level-Security
(technische Details in Kapitel 3).

### Gegenstand

Das Verfahren umfasst:

- **Finanzbuchhaltung** — Kontenplan nach SKR03, doppelte Buchführung
  mit Soll-/Haben-Konten, Buchungsjournal mit fortlaufender Nummer.
- **Belegerfassung** — Eingangs- und Ausgangsbelege mit Pflichtfeldern
  nach § 14 Abs. 4 UStG; OCR-Unterstützung für eingescannte Belege.
- **Festschreibung** — Sperrung des Bestands nach einem definierten
  Zeitraum gemäß GoBD-Rz. 64; ab Festschreibung sind Änderungen nur
  über Stornobuchung möglich.
- **Periodische Auswertungen** — Bilanz (HGB § 266), Gewinn-und-
  Verlustrechnung (HGB § 275 Abs. 2, Gesamtkostenverfahren),
  Betriebswirtschaftliche Auswertung (BWA) in Anlehnung an den
  DATEV-Standard, Summen- und Saldenliste.
- **Steuerliches Meldewesen** — Umsatzsteuer-Voranmeldung
  (UStG § 18), Zusammenfassende Meldung (UStG § 18a),
  Lohnsteuer-Anmeldung (EStG § 41a), Einnahmen-Überschuss-Rechnung
  (EStG § 4 Abs. 3), E-Bilanz (EStG § 5b).
  Die Erstellung der XML-Datensätze erfolgt im Verfahren; die
  Übertragung an die Finanzverwaltung liegt außerhalb des Systems
  (siehe Abschnitt 1.3).
- **Lohn- und Gehaltsabrechnung** — Lohnabrechnung nach Tarifwerk 2025,
  Lohnsteuer-Anmeldung, Archivierung nach GoBD.
- **B2B-E-Rechnung** — Erstellung von XRechnung (UBL 2.1) und
  ZUGFeRD-PDF sowie Verarbeitung eingehender E-Rechnungen nach
  EN 16931; siehe Grenzen in Kapitel 3.
- **Außenprüfungs-Schnittstelle** — Z3-Datenexport nach AO § 147
  Abs. 6 und DATEV-EXTF-510-Export.
- **Audit-Trail** — lückenlose Protokollierung aller schreibenden
  Vorgänge mit Hash-Kette gemäß GoBD-Rz. 153-154 (Details in
  Kapitel 7).

### Zielgruppe

Steuerberaterinnen und Steuerberater im Sinne von § 3 StBerG, deren
Kanzlei-Mitarbeitende, und optional deren Mandant:innen zur
Beleg-Einreichung. Die Nutzung durch Betriebsprüfer:innen im Rahmen
einer Außenprüfung (AO § 193) ist als Leserolle mit
Z3-Export-Funktionalität vorgesehen.

### Ausdrücklich nicht Gegenstand des Verfahrens

- **Keine Direktübertragung** an ELSTER oder BZSt. Das System erzeugt
  die jeweils vorgeschriebenen XML-Dateien; die Übertragung erfolgt
  durch die nutzende Kanzlei über die amtlichen Portale (siehe
  Abschnitt 1.3).
- **Keine Zahlungsdienstleistung** im Sinne von § 1 Abs. 1 ZAG. Es
  werden weder Gelder bewegt noch SEPA-Lastschriften ausgelöst.
- **Keine DATEV-Zertifizierung.** Der DATEV-EXTF-510-Export ist nach
  dem öffentlich dokumentierten Format nachgebildet; er ist nicht
  durch DATEV e.G. zertifiziert.
- **Keine IDW-PS-880-Zertifizierung.** Eine förmliche
  Softwareprüfung nach IDW PS 880 hat nicht stattgefunden. Die
  vorliegende Verfahrensdokumentation ist die Grundlage, auf der eine
  solche Prüfung beauftragt werden könnte.

---

## 1.2 Rechtliche Einordnung

Das Verfahren unterstützt die nutzende Kanzlei bei der Erfüllung der
Pflichten, die aus den folgenden Normen resultieren. Die Pflicht zur
ordnungsmäßigen Buchführung bleibt in jedem Fall bei der buchführungs-
pflichtigen Person (§ 140 AO) bzw. dem sie beauftragenden Mandanten;
das Verfahren ist das Werkzeug, nicht der Pflichtenträger.

### Handelsrechtliche Grundlagen

- **§ 238 HGB** — Pflicht zur Buchführung für Kaufleute.
- **§ 239 HGB** — Anforderungen an die Führung der Handelsbücher
  (Vollständigkeit, Richtigkeit, Zeitgerechtigkeit, Ordnung,
  Unveränderbarkeit). Umsetzung im System: Belegerfassungs- und
  Festschreibungs-Workflows (Kapitel 2 und Kapitel 7).
- **§§ 242, 266, 275 HGB** — Bilanz und GuV. Strukturelle Gliederung
  nach § 266 (Aktiva/Passiva) und § 275 Abs. 2 (GKV) ist voll
  abgebildet. Das Umsatzkostenverfahren (§ 275 Abs. 3) ist nicht
  implementiert.
- **§ 257 HGB** — Aufbewahrungspflichten für Handelsunterlagen
  (ergänzt durch § 147 AO; Details siehe Kapitel 6).

### Abgabenrechtliche Grundlagen

- **§§ 140, 141 AO** — Buchführungspflicht.
- **§ 146 AO** — Ordnungsvorschriften für die Buchführung,
  insbesondere § 146 Abs. 4 zur Unveränderbarkeit.
- **§ 147 AO** — Aufbewahrungsfristen. Die im Verfahren hinterlegten
  Fristen berücksichtigen die seit 2025 geltende Verkürzung für
  Buchungsbelege auf 8 Jahre durch das Wachstumschancengesetz (siehe
  Kapitel 6).
- **§ 147 Abs. 6 AO** — Datenzugriff der Außenprüfung; das Verfahren
  stellt hierfür den Z3-Export bereit (Kapitel 7).
- **§ 193 AO** — Außenprüfung.

### Spezialgesetzliche Pflichten, die das Verfahren berührt

- **UStG § 14 Abs. 4** — Pflichtangaben in Rechnungen; im Verfahren
  durch einen Validierungs-Service bei der Belegerfassung abgebildet.
- **UStG § 18** — Umsatzsteuer-Voranmeldung; das Verfahren erzeugt
  das ELSTER-konforme XML, ohne es zu übertragen.
- **UStG § 18a** — Zusammenfassende Meldung; analog zu § 18, XML-
  Erzeugung ohne BZSt-BOP-Direktübertragung.
- **EStG § 4 Abs. 3** — Einnahmen-Überschuss-Rechnung (EÜR).
- **EStG § 5b** — E-Bilanz; das System erzeugt wohlgeformtes XBRL
  nach HGB-Taxonomie 6.8; eine XSD-Validierung gegen das amtliche
  Schema findet im Verfahren nicht statt.
- **EStG §§ 41, 41a** — Lohnkonten und Lohnsteuer-Anmeldung.
- **§ 3 StBerG** — Tätigkeitsbereich der Steuerberater:in; das
  Verfahren bildet die Vorbehaltsaufgaben nach § 3 StBerG technisch
  ab, ersetzt aber nicht die fachliche Verantwortung der bestellten
  Steuerberater:in.

### Ordnungsgemäßigkeit elektronischer Buchführung

- **GoBD (BMF-Schreiben vom 28.11.2019, IV A 4 - S 0316/19/10003 :001)**
  in der jeweils aktuellen Fassung. Einzelne Randziffern, die das
  Verfahren direkt adressiert:
  - **Rz. 58** — Präzision bei Geldbeträgen; im Verfahren durch den
    `Money`-Typ (Decimal.js mit 41-stelliger Präzision) sichergestellt.
  - **Rz. 64** — Festschreibung; realisiert über Auto-Lock und
    manuellen Festschreibungsdienst (Kapitel 7).
  - **Rz. 99-102** — Buchungstext, internes Kontrollsystem (Kapitel 8).
  - **Rz. 107 ff.** — Unveränderbarkeit; Hash-Kette auf
    `journal_entries` und `audit_log` (Kapitel 7).
  - **Rz. 151-155** — Inhaltliche Anforderungen an die
    Verfahrensdokumentation; diese Gliederung folgt dem AWV-Muster
    und deckt die genannten Randziffern ab.
  - **Rz. 153-154** — Hash-Verfahren als anerkannte Methode zur
    Sicherung der Unveränderbarkeit.

### Datenschutzrechtliche Grundlagen

- **Verordnung (EU) 2016/679 (DSGVO)**, insbesondere:
  - Art. 5 (Grundsätze), Art. 6 (Rechtmäßigkeit),
  - Art. 15-22 (Betroffenenrechte; Behandlung im Verfahren in
    Kapitel 5),
  - Art. 28 (Auftragsverarbeitung),
  - Art. 32 (Technische und organisatorische Maßnahmen),
  - Art. 33/34 (Meldepflichten bei Datenpannen).
- **BDSG-neu (2018)**, insbesondere § 38 BDSG (Verpflichtung zur
  Benennung einer:s Datenschutzbeauftragten oberhalb bestimmter
  Schwellen).
- **TTDSG § 25** (Einwilligungspflicht für nicht-essentielle Cookies).

Die konkrete Umsetzung im Verfahren ist in Kapitel 5 beschrieben. Die
offene Design-Frage zur Löschung nach DSGVO Art. 17 im Spannungs-
verhältnis zu § 146 Abs. 4 AO und GoBD-Rz. 107 ff. ist im separaten
Dokument [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md)
dokumentiert und wartet auf abschließende fachanwaltliche und
datenschutzrechtliche Freigabe.

---

## 1.3 Systemabgrenzung und Schnittstellen

### Innerhalb des Verfahrens

- **Client-Anwendung** im Browser (Single-Page-Anwendung auf
  TypeScript/React-Basis). Technische Details in Kapitel 3.
- **Serverseitige Datenhaltung** in einer Postgres-Datenbank mit
  Row-Level-Security, Authentifizierung und Objekt-Storage
  (Supabase-Plattform). Technische Details in Kapitel 3.
- **Lokale Speicherung** im Browser im Demonstrations-Modus; in diesem
  Modus verlassen keine Daten das Endgerät. Der Demonstrations-Modus
  ist nicht Produktivbetrieb.

<!-- TODO(verfahrensdoku): Tatsächlicher Hosting-Provider des Frontends ergänzen, sobald festgelegt (Produktiv-Deployment hat noch nicht stattgefunden). -->


### Außerhalb des Verfahrens (explizit abgegrenzte externe Systeme)

Die folgenden Systeme sind nicht Bestandteil von harouda-app. Die
Zuverlässigkeit dieser Systeme ist nicht Gegenstand der vorliegenden
Verfahrensdokumentation.

- **Arbeitsplatz-Umgebung der Kanzlei** — Betriebssystem, Browser,
  Netzwerkanbindung, Virenschutz. Verantwortung: Kanzlei-IT.
- **E-Mail-System** der Kanzlei bzw. der Mandant:innen —
  Kommunikationskanal für Belege und Korrespondenz; keine Integration
  ins Verfahren.
- **DATEV-Empfangssysteme** — der DATEV-EXTF-510-Export wird als
  Datei erzeugt und nach DATEV übergeben; die Verarbeitung in DATEV-
  Systemen liegt außerhalb.
- **ELSTER-Gateway** der Finanzverwaltung — das Verfahren erzeugt das
  XML; die Übertragung erfolgt durch die Kanzlei über ELSTER-Online
  oder einen zertifizierten Dritten. Eine direkte ERiC-Anbindung
  besteht nicht.
- **BZSt-BOP** — Zusammenfassende Meldung; Abgabe erfolgt manuell
  durch die Kanzlei.
- **Bank-Systeme** — Kontoauszüge im MT940- oder CAMT.053-Format
  werden importiert; eine PSD2-basierte Echtzeit-Anbindung oder
  Zahlungsauslösung existiert nicht.
- **Peppol-Netzwerk** — Übertragung von E-Rechnungen über Peppol ist
  nicht angebunden.
- **ELStAM / DEÜV-Meldeportal** — Elektronische Lohnsteuer-Abzugs-
  Merkmale und DEÜV-Meldungen an Krankenkassen sind nicht integriert.

### Schnittstellen des Verfahrens (I/O)

Alle Schnittstellen werden als Datei-basiert realisiert; es gibt keine
offenen Programmierschnittstellen für Dritte.

| Richtung | Format | Rechtsgrundlage | Zweck |
|---|---|---|---|
| Export | DATEV EXTF 510 CSV | DATEV-Spezifikation (nicht zertifiziert) | Übergabe an DATEV |
| Export | UStVA-XML (ELSTER-Schema) | UStG § 18 | Abgabe durch manuellen Upload |
| Export | ZM-CSV | UStG § 18a | manuelle Abgabe an BZSt |
| Export | LStA-XML | EStG § 41a | manuelle Abgabe |
| Export | E-Bilanz XBRL (HGB-Taxonomie 6.8) | EStG § 5b | manuelle Abgabe |
| Export | Z3 / GDPdU Paket | AO § 147 Abs. 6 | Außenprüfung |
| Export | XRechnung (UBL 2.1) | EN 16931 | B2B-Rechnungsausgang |
| Export | ZUGFeRD 2.3 (PDF mit XML-Anhang) | EN 16931 + ISO 19005-3 | hybride Rechnung |
| Export | Mandanten-Datenexport (ZIP+JSON) | DSGVO Art. 20 | Datenübertragbarkeit |
| Import | MT940 | ZKA-Format | Bank-Kontoauszug |
| Import | CAMT.053 | ISO 20022 | Bank-Kontoauszug |
| Import | XRechnung (UBL 2.1) | EN 16931 | B2B-Rechnungseingang |
| Import | Belege (PDF, Bild) | — | Belegerfassung mit OCR |

Details zu den Zertifizierungs-Ständen und bekannten Abweichungen der
Export-Formate finden sich in Kapitel 7 (Prüfpfade).

---

## 1.4 Rollen und Verantwortlichkeiten

Die folgende Matrix beschreibt Rollen auf Verfahrens-Ebene. Die
technische Umsetzung über Row-Level-Security und Authentifizierung
ist in Kapitel 5 (Datensicherheit) dokumentiert.

| Rolle | Kernaufgaben im Verfahren | Verantwortungsbereich |
|---|---|---|
| **Kanzlei-Leitung** (bestellte:r Steuerberater:in nach § 3 StBerG) | Freigabe Festschreibungen, Abgabe UStVA / LStA / Jahresabschluss, Genehmigung von Stornobuchungen nach Festschreibung, Überwachung des Internen Kontrollsystems | Gesamtverantwortung für die ordnungsgemäße Buchführung der betreuten Mandate (§§ 140, 146 AO) |
| **Kanzlei-Mitarbeiter:in** | Belegerfassung, laufende Buchungen, Erstellung von Auswertungen, Vorbereitung Meldungen | Ausführung nach Vorgabe und internen Standards |
| **Mandant:in** (optional) | Beleg-Upload, Einsicht in eigene Auswertungen | Richtigkeit der eingereichten Belege und Daten |
| **Mandanten-Mitarbeiter:in** | — (nicht als eigenständige Rolle im System; Zugriff erfolgt über Mandant:in) | — |
| **Betriebsprüfer:in** | Lesezugriff im Prüfzeitraum, Abruf von Z3-Exporten | Außenprüfung nach §§ 193, 200 AO |
| **System-Admin** (Kanzlei-IT) | Benutzer- und Rollenverwaltung, Backup/Restore (sobald produktiv, siehe Kapitel 4), Release-Einspielung, Überwachung | Technische Verfügbarkeit des Verfahrens |
| **Datenschutzbeauftragte:r** | Bearbeitung von Betroffenenanfragen, Überwachung DSGVO-Prozesse, Datenpannen-Register | Einhaltung DSGVO in der Kanzlei; Benennungspflicht nach § 38 BDSG prüfen |

**Rollentrennung:** Die Person, die eine Buchung erfasst, soll sie
nicht auch festschreiben; die Person, die eine Lohnabrechnung erzeugt,
soll sie nicht allein abgeben. Die konkreten Inkompatibilitäten und
Kontrollen sind in Kapitel 8 (IKS) beschrieben.

<!-- TODO(verfahrensdoku): Konkrete Rolleninhaber:innen (Namen/Positionen) der nutzenden Kanzlei ergänzen, sobald bekannt. Die Verfahrensdokumentation ist ein lebendiges Dokument der Kanzlei, nicht des Software-Herstellers. -->


---

## 1.5 Prozess-Landkarte

Die folgenden Haupt-Geschäftsvorfälle bilden den Kern des Verfahrens.
Detaillierte Workflows pro Rolle finden sich in Kapitel 2; technische
Umsetzung in Kapitel 3; Prüfpfade in Kapitel 7.

### Kernprozesse

1. **Belegerfassung** (§ 14 UStG, GoBD Rz. 99-102)
   - Eingangskanäle: manuelle Erfassung, PDF-/Bild-Upload mit OCR,
     Import von E-Rechnungen (XRechnung/ZUGFeRD).
   - Plausibilitätsprüfung durch den Belegvalidierungsdienst
     (Pflichtangaben nach § 14 Abs. 4 UStG).
   - Ergebnis: Beleg mit Status `ENTWURF` oder `GEBUCHT`; nach
     `GEBUCHT` sind Kern-Felder unveränderlich.

2. **Buchungsjournal** (HGB § 239, GoBD Rz. 107 ff.)
   - Doppelte Buchführung, Soll/Haben-Konten nach SKR03.
   - Fortlaufende Hash-Kette über die Buchungseinträge
     (GoBD Rz. 153-154); Details in Kapitel 7.
   - Storno ausschließlich über Gegenbuchung mit
     `parent_entry_id`-Verknüpfung, nicht durch Mutation.

3. **Festschreibung** (GoBD Rz. 64)
   - Automatische Sperrung nach einem in den Einstellungen
     hinterlegten Zeitraum seit Buchungsdatum (Auto-Lock).
   - Manuelle Festschreibung von Zeiträumen durch die
     Kanzlei-Leitung über den Festschreibungsdienst.
   - Ab Festschreibung: Änderungen nur noch durch Stornobuchung;
     DB-Trigger verhindern Mutation als zweite Verifikationslinie.

4. **Periodische Auswertung**
   - Bilanz (HGB § 266), GuV (HGB § 275 Abs. 2 GKV), BWA,
     Vorjahresvergleich (HGB § 265 Abs. 2), Summen- und Saldenliste.
   - EÜR (EStG § 4 Abs. 3) für Freiberufler:innen und Kleinbetriebe.

5. **Meldewesen**
   - UStVA (UStG § 18) und ZM (UStG § 18a): XML-Erzeugung, manuelle
     Abgabe.
   - Lohnsteuer-Anmeldung (EStG § 41a): XML-Erzeugung.
   - E-Bilanz (EStG § 5b): XBRL-Erzeugung, manuelle Abgabe über
     ELSTER.

6. **Lohn- und Gehaltsabrechnung** (EStG §§ 38-42f)
   - Stammdaten-Pflege, monatlicher Lohnlauf mit Tarif 2025,
     Sozialversicherungsberechnung, Vorsorgepauschale in Grundform.
   - Archivierung mit Per-Row-Hash nach GoBD Rz. 64 und festem
     Festschreibungsprozess (siehe Kapitel 7, Abschnitt 7.5).

7. **E-Rechnung** (EN 16931, ISO 19005-3)
   - Ausgang: Erzeugung von XRechnung (UBL 2.1) und ZUGFeRD-PDF mit
     eingebettetem XML-Anhang. Grenzen der Compliance siehe Kapitel 7.
   - Eingang: Parser für XRechnung, Validierung ausgewählter
     BR-Regeln, Übernahme in die Belegerfassung.

8. **Archivierung und Datenübergabe**
   - Z3-Datenexport (AO § 147 Abs. 6) als ZIP-Paket mit INDEX.XML,
     CSV-Dateien und MANIFEST.XML (SHA-256 je Datei).
   - DATEV-EXTF-510-Export als CSV-Batch.
   - Mandanten-Datenexport nach DSGVO Art. 20 als ZIP mit JSON-
     Dateien und Manifest; ausdrücklich kein Datensicherungs-Backup
     (Details in Kapitel 7, Abschnitt 7.8).

9. **Aufbewahrung und Löschung** — siehe Kapitel 6.
   Konkrete technische Umsetzung der DSGVO-Art.-17-Löschung ist
   aktuell Gegenstand der offenen Design-Entscheidung (siehe
   [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md)).

### Cross-Referenzen zu folgenden Kapiteln

Bedienung pro Rolle → Kap. 2 · Architektur + Datenmodell → Kap. 3 ·
Datensicherung + Change-Management → Kap. 4 · Berechtigungen + DSGVO →
Kap. 5 · Aufbewahrung + Löschung → Kap. 6 · Audit-Trail + Hash-Kette +
Festschreibung + Z3-Export → Kap. 7 · IKS + Rollentrennung → Kap. 8.

---

## Quellen & Referenzen

- Abgabenordnung (AO): § 140, § 141, § 146, § 147, § 193, § 200.
- Handelsgesetzbuch (HGB): § 238, § 239, § 242, § 257, § 265, § 266,
  § 275.
- Umsatzsteuergesetz (UStG): § 14 Abs. 4, § 18, § 18a.
- Einkommensteuergesetz (EStG): § 4 Abs. 3, § 5b, §§ 38-42f, § 41,
  § 41a.
- Steuerberatungsgesetz (StBerG): § 3.
- Bundesdatenschutzgesetz (BDSG-neu 2018): § 38.
- Telekommunikation-Telemedien-Datenschutz-Gesetz (TTDSG): § 25.
- Verordnung (EU) 2016/679 (DSGVO): Art. 5, 6, 15-22, 28, 32, 33, 34.
- Zahlungsdienste-Aufsichtsgesetz (ZAG): § 1 Abs. 1.
- BMF-Schreiben zu den GoBD vom 28.11.2019 (IV A 4 - S 0316/19/10003 :001)
  in der jeweils aktuellen Fassung: Rz. 58, Rz. 64, Rz. 99-102,
  Rz. 107 ff., Rz. 151-155, Rz. 153-154.
- Europäische Norm EN 16931 (E-Rechnung, Stammelemente).
- ISO 19005-3 (PDF/A-3).
- Wachstumschancengesetz 2025 (Verkürzung Aufbewahrungsfrist für
  Buchungsbelege auf 8 Jahre, § 147 Abs. 3 AO n.F.).

### Interne Projekt-Referenzen

- [`../../CLAUDE.md`](../../CLAUDE.md) §1 (Projekt-Übersicht), §6
  (Feature-Map), §7 (Compliance-Status).
- [`../PROJEKT-INVENTAR.md`](../PROJEKT-INVENTAR.md) (Feature-Matrix,
  Test-Statistiken, Compliance-Landschaft).
- [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md)
  (offene Design-Entscheidung zu Art. 17 DSGVO vs. § 146 Abs. 4 AO).
- [`../BACKUP-STRATEGY.md`](../BACKUP-STRATEGY.md) (offene Ops-Arbeit
  zur Datensicherung).
