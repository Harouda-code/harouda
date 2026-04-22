# Benutzerhandbuch — harouda-app

Stand: April 2026 · Deckt den aktuellen Funktionsumfang ab. Für Änderungen
siehe `CHANGELOG` bzw. die Migrationen in `supabase/migrations/`.

> **Hinweis zur Verbindlichkeit** · Diese App ist ein Hilfs-Werkzeug für
> Buchhaltung, Steuer-Vorbereitung und Lohn-Vorbereitung. Sie ist **nicht**
> zertifiziert nach ITSG (Sozialversicherungs-Meldewesen), trägt **kein**
> DATEV-Zertifikat und emittiert **keine** BMF-PAP-konforme Lohnsteuer.
> Exporte sind zur Weiterverarbeitung in zertifizierten Clients
> (ElsterOnline-Portal, DATEV, Taxpool, Lexware, ein ITSG-zertifiziertes
> Lohnprogramm) gedacht.

---

## Inhaltsverzeichnis

1. [Erste Schritte](#1-erste-schritte)
2. [Unternehmen einrichten](#2-unternehmen-einrichten)
3. [Kontenplan & Mandanten](#3-kontenplan--mandanten)
4. [Buchführung (Journal)](#4-buchführung-journal)
5. [Offene Posten & Mahnwesen](#5-offene-posten--mahnwesen)
6. [Bank-Import & Bank-Abstimmung](#6-bank-import--bank-abstimmung)
7. [E-Rechnungen](#7-e-rechnungen)
8. [Dokument-Scanner (OCR)](#8-dokument-scanner-ocr)
9. [DATEV-Export](#9-datev-export)
10. [ELSTER-Übertragung](#10-elster-übertragung)
11. [Lohn & Gehalt](#11-lohn--gehalt)
12. [Berichte](#12-berichte)
13. [Benutzer & Rollen](#13-benutzer--rollen)
14. [Compliance & Archivierung](#14-compliance--archivierung)
15. [Fehlerbehebung](#15-fehlerbehebung)
16. [Rechtliche Einordnung](#16-rechtliche-einordnung)

---

## 1. Erste Schritte

### 1.1 Anmelden

- Öffnen Sie die Startseite und klicken Sie **Anmelden**.
- Im **Demo-Modus** (`VITE_DEMO_MODE=1`) ist kein echtes Konto nötig; es
  steht eine vorbefüllte Test-Kanzlei bereit.
- Im Produktiv-Modus nutzen Sie Ihre E-Mail-Adresse + Passwort. „Passwort
  vergessen?" sendet einen Reset-Link per Supabase-Auth.

### 1.2 Sitzung

- Nach **8 Stunden Inaktivität** (Standard) werden Sie automatisch
  abgemeldet. Das Limit ist unter **Einstellungen → Sitzung & Sicherheit**
  konfigurierbar (5 Min bis 24 Std).
- Jede An-/Abmeldung wird im Audit-Log protokolliert.

### 1.3 Firmen-Kontext

Jede:r Nutzer:in ist Mitglied in einer oder mehreren Firmen
(Mehrmandantenmodell). Die aktive Firma steht oben in der Navigationsleiste
und kann dort gewechselt werden. Alle Daten (Buchungen, Belege, Mitarbeiter
usw.) sind pro Firma getrennt.

---

## 2. Unternehmen einrichten

Route: **Einstellungen** (`/einstellungen`).

### 2.1 Kanzlei-Stammdaten

Pflege Sie folgende Felder:

- **Kanzlei-Name** (Pflicht) — erscheint auf allen PDFs
- **Anschrift** (Straße, PLZ, Ort)
- **Kontakt** (Telefon, E-Mail)
- **Bankverbindung** (IBAN + BIC, für SEPA-Lohn-Überweisungen)
- **Steuernummer** & **Berater-Nummer** (für ELSTER-XML)
- **Kleinunternehmer-Flag** (§ 19 UStG)

### 2.2 Mahnwesen-Parameter

- Basiszinssatz (§ 247 BGB — halbjährlich anzupassen)
- Mahngebühren pro Stufe
- Schwellenwerte (Tage Verzug pro Stufe)

### 2.3 Lohn-GL-Konten

SKR03-Defaults: 4110 (Gehälter), 4130 (Gesetzl. soz. Aufw.),
1741 (LSt-Verb.), 1742 (SV-Verb.), 1755 (Netto-Verb.). Bei abweichendem
Kontenplan hier überschreiben.

### 2.4 Sitzungs-Sicherheit

- Auto-Logout nach X Min Inaktivität
- **Auto-Festschreibung** gebuchter Einträge nach Y Std (Default 24; 0 =
  sofort)

> **Ehrlich:** Die clientseitige Session-Dauer ersetzt NICHT eine
> serverseitige JWT-Begrenzung. Konfigurieren Sie diese zusätzlich im
> Supabase-Projekt.

---

## 3. Kontenplan & Mandanten

### 3.1 Kontenplan (`/konten`)

- Beim ersten Start kann der **SKR03-Seed** (>500 Konten) importiert
  werden.
- Kontonummern werden auf **≥ 4 Ziffern** links-gepolstert normalisiert
  (z. B. `123` → `0123`).
- Konten haben eine **Kategorie** (aktiva, passiva, aufwand, ertrag) und
  können aktiv/inaktiv geschaltet werden.

### 3.2 Mandanten (`/mandanten`)

„Mandant" bezeichnet in dieser App den **Kunden** Ihrer Kanzlei (nicht den
Firmen-Tenant). Jede Buchung kann optional einem Mandanten zugeordnet
werden; die OPOS-Liste filtert sich danach.

Felder: Mandanten-Nr., Name, Steuernummer, USt-IdNr. + Status (unchecked /
valid / invalid), IBAN.

---

## 4. Buchführung (Journal)

Route: **Journal** (`/journal`).

### 4.1 Buchung anlegen

1. Oben **Neue Buchung** klicken.
2. Datum, Beleg-Nr., Beschreibung erfassen.
3. Soll- & Haben-Konto wählen.
4. Betrag (brutto oder netto je nach Kontenbelegung), USt-Satz, Mandant.
5. **Status** `Entwurf` oder `Gebucht` wählen.
6. Speichern → Eintrag erscheint im Journal.

### 4.2 Konto-Vorschläge

Während Sie **Beschreibung** und **Gegenseite** tippen, erscheinen farbige
Chips unter dem Feld:

- Grüner Chip mit `Soll / Haben` — **„Exakter Lieferant"** oder **„Ähnlicher
  Lieferant"**: bei dieser Gegenseite haben Sie vorher schon mal gebucht
  (System merkt sich das).
- Schlichte Chips — Keyword-Treffer aus dem aktiven Kontenplan.
- SKR03-Keyword-Hinweise (nur bei SKR03-Kontenplan) — z. B.
  „Miete → 4210", „Telefon → 4920", „Reisekosten → 4670".

Pro Chip können Sie per Button „Soll" oder „Haben" zuweisen; der
Lieferanten-Chip bietet zusätzlich **„Übernehmen"** für beide Konten.

### 4.3 Festschreibung & Storno

- `Entwurf`-Buchungen können beliebig geändert oder gelöscht werden.
- Sobald eine Buchung auf `Gebucht` geht, startet die
  **Auto-Festschreibung** (Default 24 h). Danach ist die Zeile
  **gesperrt** und nur noch über eine **Stornobuchung** änderbar.
- **Stornieren**: Icon-Button in der Zeile → Stornogrund (Pflichtangabe,
  mind. 3 Zeichen) → System erzeugt die Gegenbuchung automatisch und
  markiert das Original als `storniert`.
- **Korrekturbuchung** (API-Funktion, UI ggf. pro Aufruf): Storno +
  neue korrekte Buchung in einem Schritt.

### 4.4 Hash-Kette (GoBD)

Jede Journal-Buchung erhält eine **SHA-256-Prüfsumme**, die mit dem Hash
der vorherigen Buchung verkettet ist. Manipulation einer Zeile macht die
Kette nachweisbar defekt.

- Prüfen: **Einstellungen → Audit-Log → „Journal-Kette prüfen"**.
- Der Hash wird über die **immutablen Kernfelder** gebildet (Datum,
  Beleg-Nr., Konten, Betrag, Beschreibung, parent_entry_id). Der
  Storno-Status wechselt legitim und ist deshalb **nicht** Teil des
  Hashes — Nachweis des Wechsels liegt im separaten Audit-Log.

### 4.5 Beraternotizen

Auf jeder Buchungszeile steht ein Sprechblasen-Icon mit Zähler-Badge.
Klicken öffnet ein Modal, in dem Kolleg:innen oder Berater:innen
**textuelle Notizen** hinterlassen können (append-only, maximal 4000
Zeichen, im Audit-Log protokolliert).

---

## 5. Offene Posten & Mahnwesen

### 5.1 OPOS (`/opos`)

Aus dem Journal werden automatisch offene Posten abgeleitet:

- **Forderungen** (Soll-Buchung auf 1400-Bereich ohne Ausgleich)
- **Verbindlichkeiten** (Haben-Buchung auf 1600-Bereich ohne Ausgleich)

Aging-Buckets: 0–30 / 31–60 / 61–90 / 91+ Tage. Filter nach Mandant,
Bucket, nur überfällig.

### 5.2 Mahnwesen (`/mahnwesen`)

- Automatische Einteilung in Mahnstufen 1–3 nach Tagen Verzug
  (konfigurierbar in Einstellungen).
- Mahngebühren werden pro Stufe addiert; Verzugszinsen nach § 288 BGB
  (B2B +9 Pp., B2C +5 Pp. über Basiszinssatz).
- PDF-Mahnschreiben mit Bankverbindung generierbar.

### 5.3 Liquiditätsvorschau (`/liquiditaet`)

90-Tage-Heuristik (keine ML):

- Historischer Median „Tage zwischen Rechnung & Zahlung" pro Kunde wird
  aus vollständig beglichenen Belegen berechnet.
- Forderungen werden auf (Fälligkeit + Kunden-Median − 14 Tage)
  projiziert, Verbindlichkeiten auf ihren Fälligkeitstag.
- Tägliche Saldolinie als SVG-Chart, mit Markierung des ersten
  negativen Tags.
- Spalte **Kunde-Zuverlässigkeit**: Anteil historisch verspäteter
  Zahlungen (grün `pünktlich` / amber `<50%` / rot `≥50%`).

---

## 6. Bank-Import & Bank-Abstimmung

### 6.1 Bank-Import (`/bankimport`)

Unterstützt:

- **MT940** (SWIFT-Standard, von vielen Banken)
- **CAMT.053** (SEPA-Standard)
- **CSV** — gebräuchliche deutsche Bankformate
  (Sparkasse, Volksbank, Deutsche Bank, DKB …)

Pro Zeile erhält die Transaktion einen Konto-Vorschlag (1200 Bank als
Default auf einer Seite; die andere Seite aus Heuristik).

### 6.2 Bank-Abstimmung (`/banking/reconciliation`)

Zwei-Wege-Match **Bank ↔ OPOS**:

- `exact` — Betrag identisch + Beleg-Nr. im Verwendungszweck
- `high`  — Betrag identisch + Gegenseiten-Name passt
- `medium` — nur Betrag identisch
- `low`   — passt wahrscheinlich nicht

Jeder Kandidat zeigt seine **vollständige Begründung**. Bei Auswahl und
„Buchen" wird automatisch die Ausgleichs-Buchung angelegt (Eingang:
1200/1400; Ausgang: 1600/1200).

> **Ehrlich:** Es gibt keine Drei-Wege-Abstimmung (Bestellung ↔ Rechnung ↔
> Zahlung) — es existiert kein Bestell-Objekt in dieser App.

---

## 7. E-Rechnungen

### 7.1 Eingangs-Rechnungen lesen (`/zugferd`)

Akzeptierte Formate:

- PDF/A-3 mit eingebetteter Factur-X-XML
- PDF mit ZUGFeRD-XML-Anhang
- Reine XRechnung-XML-Datei

Nach Upload wird die Datei automatisch ins Archiv übernommen (SHA-256,
Retention 10 Jahre). USt-Sätze pro Position werden gegen **0 / 7 / 19 %**
geprüft; nicht-deutsche Sätze werden rot markiert.

### 7.2 E-Rechnung-Archiv (`/e-rechnung/archiv`)

- Tabelle mit Lieferant, Rechnungs-Nr., Format (CII/UBL/XRechnung),
  Brutto, Retention-Countdown, SHA-256-Präfix
- Filter: Format / Quelle / Suchbegriff
- **Integritäts-Prüfung** pro Zeile (Prüfsummen neu berechnen und
  vergleichen)
- **Vorschau**: Modal mit PDF-iframe + ausgelesenem XML nebeneinander
- Download: Original-Datei + extrahierte XML getrennt

### 7.3 XRechnung erzeugen (`/e-rechnung/erstellen`)

Formular mit Verkäufer (vorbefüllt aus Einstellungen), Käufer, Positionen
(mehrere), USt-Kategorie pro Position (S/Z/E), Zahlungsbedingungen,
Leitweg-ID / Käufer-Referenz. Ausgabe: CII-XML im XRechnung-3.0-Profil.

> **Ehrlich:** Keine automatische XSD-Validierung gegen das offizielle
> KoSIT-Schema; Pflichtbefreiungsgrund bei `E`-Kategorie aktuell nicht in
> der XML abgebildet.

---

## 8. Dokument-Scanner (OCR)

Route: `/ai/scanner`

Lokale OCR (Tesseract.js, Deutsch + Englisch). Akzeptierte Dateien: PDF,
JPG, PNG, WEBP, max. 10 MB. Der deutsche Sprachdaten-Download (~15 MB)
erfolgt einmalig beim ersten Aufruf.

Extrahiert und mit Konfidenz-Score (hoch/mittel/niedrig) angezeigt:

- Lieferant
- USt-IdNr. (`DE[0-9]{9}`)
- Rechnungsnummer, Rechnungsdatum, Fälligkeitsdatum
- Netto / Brutto / USt-Satz

Jedes Feld ist editierbar; der OCR-Rohtext steht zur Kontrolle darunter.
„Werte ins Journal übernehmen" schreibt einen Prefill-Eintrag in den
Browser-Speicher und navigiert zum Journal.

> **Ehrlich:** OCR-Qualität hängt stark vom Scan ab. Schräge Fotos,
> niedrige Auflösung oder mehrspaltige Layouts führen zu Fehlern — bitte
> IMMER die Felder überprüfen.

---

## 9. DATEV-Export

Route: `/export/datev`

Erzeugt eine **EXTF-CSV-Datei** im öffentlichen DATEV-Standard-Buchungsstapel-
Format mit folgenden Eigenheiten:

- Dateiname: `EXTF_Buchungsstapel_YYYYMMDD-YYYYMMDD_YYYYMMDDHHMMSS.csv`
- Encoding: **Windows-1252** (nicht UTF-8) — Umlaute bleiben erhalten
- Trennzeichen Semikolon, Zeilen CRLF
- Kaufmännische Rundung (half-up), **nicht** banker's rounding
- Belegfeld1 auf 36 Zeichen, Buchungstext auf 60 Zeichen gekürzt
- Skonto-Feld leer (nicht „0") bei fehlendem Skonto
- Konto-Nummern auf 4 Ziffern links-gepolstert

**Bedienung:**

1. Zeitraum wählen (Default: Jahresanfang bis heute).
2. Optional: Format-Version anpassen (Default 700; 701 als Override,
   510 für Altsysteme).
3. **Strict-Modus** blockiert den Export, wenn Validierungs-Fehler
   gefunden werden. Permissive lässt trotzdem durch (auf eigenes Risiko).
4. Validierungs-Bericht zeigt fehlende/ungültige Felder mit
   Behebungs-Hinweisen.
5. Vorschau der ersten 10 Zeilen.
6. Download als `.csv`.

> **Ehrlich:** Shape-kompatibel, nicht zertifiziert. DATEV kann den
> Import ablehnen; in der Regel wird er aber angenommen.

---

## 10. ELSTER-Übertragung

Route: `/steuern/elster`

### 10.1 Was die App tut

- UStVA-Daten aus dem Journal zusammenrechnen
- Plausibilitäts-Prüfung (fehlende Stammdaten, künftige/überfällige
  Perioden, Drafts, Nullmeldung, Umsätze-vs.-USt-Konsistenz)
- XML im ElsterAnmeldung-Format erzeugen und herunterladen
- Abgabe-Register mit Status-Lifecycle:
  `Entwurf → Exportiert → Manuell übertragen → Bestätigt`

### 10.2 Was die App NICHT tut

- **Keine direkte ERiC-Übertragung** aus dem Browser — dafür fehlt die
  lizenzierte native Bibliothek, der Zugriff auf den OS-Zertifikatsspeicher
  (`*_sig.pfx`/`*_enc.pfx`) und eine server-seitige Infrastruktur.
- **Keine PDF-Quittung** vom Finanzamt — die kommt aus dem
  ElsterOnline-Portal nach manuellem Upload.

Die Zertifikat-Panel ist rein informativ: sie erklärt das
`_sig`/`_enc`-Konzept und verweist auf den offiziellen Portal-Login.

### 10.3 Typischer Ablauf

1. Periode wählen.
2. Plausibilitäts-Bericht prüfen — Fehler beheben.
3. „ELSTER-XML exportieren & im Register verbuchen" klicken.
4. XML beim [ElsterOnline-Portal](https://www.elster.de) hochladen.
5. Im Abgabe-Register auf „Manuell übertragen" stellen.
6. Nach Eingang der Bestätigung auf „Bestätigt" + Transfer-Ticket-Nr.
   eintragen.

---

## 11. Lohn & Gehalt

Routen:

- **Mitarbeiter** (`/personal/mitarbeiter`)
- **Lohn-Vorschau** (`/personal/abrechnung`)

### 11.1 Mitarbeiter erfassen

Pflichtfelder: Personalnummer, Vorname, Nachname, Steuerklasse,
Beschäftigungsart. Stark empfohlen: Steuer-ID (11 Ziffern),
Sozialversicherungsnummer, Krankenkasse + Zusatzbeitrag, Bundesland (für
KiSt-Satz), IBAN für SEPA.

Besonderheiten:

- **Mini-Job** (≤ 556 €/Monat) — keine Lohnsteuer vom AN, pauschale
  AG-Beiträge.
- **Midi-Job** (556,01 – 2.000 €/Monat) — reduzierte AN-Bemessung
  (Gleitzone).
- **Pflegeversicherung** — `Kinderlos & 23+` aktivieren für den
  +0,6 %-Zuschlag; `Berücksichtigte Kinder PV` für die Ermäßigung
  (0,25 % pro Kind ab dem 2., max. 1,0 %).

### 11.2 Lohn-Vorschau fahren

1. Jahr + Monat wählen.
2. System rechnet für jede:n aktive:n Mitarbeiter:in:
   - Lohnsteuer nach **§ 32a EStG 2025** (Zonen-Formeln, nicht BMF-PAP)
   - Soli 5,5 % mit Freigrenze
   - Kirchensteuer 8 % BY/BW, 9 % sonst
   - Sozialversicherungs-Beiträge 2025 (AN + AG)
   - Netto + Bruttokosten
3. Ergebnis-Tabelle zeigt pro Zeile Warnungen (z. B. Klasse V
   Approximation, Midi-Job Gleitzone).
4. Vier Aktions-Buttons:
   - **Abrechnungen verteilen (ZIP)** — PDFs aller Mitarbeiter in einem
     ZIP mit Dateiname `Abrechnung_YYYY-MM_Nachname.pdf`.
   - **SEPA erstellen** — PAIN.001-XML für die Netto-Überweisungen,
     Ausführungsdatum auf 25. des Monats (oder nächsten Werktag bei
     Feiertag). Firmen-IBAN aus Einstellungen erforderlich.
   - **Lohnsteueranmeldung** — CSV + XML-Export, Registrierung im
     ELSTER-Abgabe-Register.
   - **GL-Buchungen erzeugen** — erzeugt pro Mitarbeiter bis zu 4
     Entwurfs-Einträge im Journal, die Sie anschließend festschreiben.

### 11.3 Ehrliche Einordnung

- **Keine ITSG-Zertifizierung** → keine direkte DEÜV-/SV-Meldung.
- **Kein BMF-PAP** → Lohnsteuer-Näherung auf Cent-Basis kann abweichen.
- **Klasse V** wird stark vereinfacht gerechnet (10 % Zuschlag auf
  Ohne-Grundfreibetrag-Tarif); bei Klasse-V-Mitarbeiter:innen unbedingt
  ein zertifiziertes Lohnprogramm für die verbindliche Abrechnung
  nutzen.
- **Keine YTD-Historie** auf den PDFs — die App speichert keine
  früheren Lohnläufe.

---

## 12. Berichte

- **GuV** (`/berichte/guv`) — Erträge und Aufwendungen
- **BWA** (`/berichte/bwa`) — klassische Betriebswirtschaftliche
  Auswertung
- **SuSa** (`/berichte/susa`) — Summen- und Saldenliste
- **EÜR** (`/steuer/euer`) — Einnahmen-Überschuss-Rechnung mit
  SKR03-Zeilen-Mapping
- **Steuer-Formulare** (`/steuer`) — Anlage N / S / G / V / SO / AUS /
  Kind / Vorsorge / R / KAP / Gewerbesteuer / KSt (Vorbereitungs-
  Oberflächen, keine ELSTER-Abgabe)

Alle Berichte bieten PDF- und Excel-Export mit deutscher Formatierung.

---

## 13. Benutzer & Rollen

Route: **Einstellungen → Benutzer & Rollen** (`/einstellungen/benutzer`).

Rollen (pro Firma):

| Rolle | Kurz | Rechte |
|---|---|---|
| `owner` | Eigentümer:in | alles, inkl. Firmenlöschung |
| `admin` | Admin | alles außer Eigentümer-Übertragung |
| `member` | Mitglied | Buchen, Mahnen, Belege |
| `readonly` | Nur-Lesen | interne Einsicht |
| `tax_auditor` | Betriebsprüfer:in | Prüfer-Dashboard + GDPdU-Export |

Mitglieder werden per User-ID hinzugefügt. Rollen-Änderungen landen im
Audit-Log.

Prüfer-Zugänge können zeitlich befristet werden (`access_valid_until`,
siehe Migration `0007`) — Ablauf wird serverseitig via RLS erzwungen.

---

## 14. Compliance & Archivierung

### 14.1 Audit-Log (`/einstellungen/audit`)

- Append-only (SQL-Trigger blocken UPDATE/DELETE, siehe Migration `0006`)
- SHA-256-Hash-Kette — jede Zeile verweist auf den Hash der
  vorherigen
- Enthält: Zeitpunkt, Nutzer:in, Aktion, Entität, Vorher-/Nachher-
  Snapshot, (optional) User-Agent
- Export als CSV oder JSON, Filter nach Aktion/Entität/Zeitraum/Entität-ID
- **Integritätsprüfung** rekonstruiert die Kette aus dem Genesis-Hash

### 14.2 Retention

- **Belege & Buchungen** — 10 Jahre nach § 147 AO
- **Geschäftsbriefe** — 6 Jahre
- Konfigurierbar pro Kategorie unter **Einstellungen → Aufbewahrung**.

### 14.3 Verfahrensdokumentation (`/einstellungen/verfahrensdoku`)

- Automatisch generiertes PDF mit 9 Abschnitten:
  Unternehmen / IT / Rollen / Datenschutz / Aufbewahrung / Kennzahlen /
  Verfahrensabläufe / Systemprotokollierung / Änderungsprotokoll
- Versionierung über localStorage — die vorherige Version wird
  gespeichert, diff-fähig, bei Neuerzeugung erscheint ein
  Änderungsprotokoll im PDF.

> **Ehrlich:** Die generierte Datei ist eine **Vorlage**. Ein unabhängig
> geprüftes GoBD-Testat gibt es damit nicht.

### 14.4 GDPdU-Export

Auslösbar im **Prüfer-Dashboard** (`/pruefer`). Erzeugt ein ZIP mit
`index.xml`, Kontenplan, Journal (inkl. Storno/Korrektur), Audit-Log,
Stammdaten. Kompatibel zur IDEA-Software der Finanzverwaltung.

### 14.5 Fristenkalender (`/einstellungen/fristen`)

Generiert USt-VA, ESt-/KSt-/GewSt-Vorauszahlungen, Erklärungs-Fristen für
die gewählten Jahre. Wochenenden verschoben nach § 108 Abs. 3 AO;
Feiertage NICHT berücksichtigt (bundesländerspezifisch).

---

## 15. Fehlerbehebung

### „Sitzung wird geprüft …" hängt dauerhaft

Supabase-Auth antwortet nicht. Nach 5 Sek Fallback-Timeout landet man
auf `/login`. Prüfen:

- Browser-Konsole auf `supabase.auth.getSession failed` — URL/Anon-Key
  fehlerhaft.
- `VITE_DEMO_MODE=1` in `.env.local`, um lokal ohne Backend zu arbeiten.

### „Keine aktive Firma ausgewählt"

Nach dem ersten Login legt die App automatisch eine Default-Firma an
(siehe `bootstrapFirstCompany()` in `CompanyContext.tsx`). Wenn das
fehlschlägt, prüfen Sie die Supabase-Migrationen 0001–0004.

### DATEV-Import wird abgelehnt

- Ist die Datei **Windows-1252**-kodiert? (Nicht UTF-8.)
- Hat die Header-Zeile Format-Version **700** (oder was Ihr DATEV-
  Ansprechpartner verlangt)?
- Sind Belegfeld1 ≤ 36, Buchungstext ≤ 60 Zeichen?
- Sind Konten 4-stellig?

### ELSTER-XML wird nicht akzeptiert

- Die App erzeugt eine **shape-kompatible**, nicht zertifizierte XML.
  Nutzen Sie das ElsterOnline-Portal zum Upload, dort sehen Sie genaue
  Fehlermeldungen.
- Steuernummer + Berater-Nr. müssen im korrekten Format gesetzt sein.

### „Festgeschriebene Buchungen dürfen nicht geändert werden"

Erwartete Meldung nach Ablauf der 24-Std-Lock-Periode. Für Änderungen
eine **Stornobuchung** erstellen.

### Audit- oder Journal-Kette „defekt"

Eine Zeile wurde nachträglich direkt in der Datenbank manipuliert.
Öffnen Sie `/einstellungen/audit` und prüfen Sie, ab welcher Zeile die
Kette bricht. Im Supabase-Betrieb ist dies über die Trigger aus
Migrationen 0006/0010 normalerweise ausgeschlossen.

---

## 16. Rechtliche Einordnung

Diese App ersetzt weder Steuerberater:in noch zertifizierte
Lohnsoftware. Sie bereitet Daten für folgende Drittsysteme vor:

- **ElsterOnline-Portal** bzw. zertifizierte Steuer-Clients
  (DATEV, Taxpool, Lexware, WISO) für UStVA, Einkommensteuer, usw.
- **ITSG-zertifizierte Lohnsoftware** für SV-Meldungen (DEÜV, BEA, DSKV
  etc.)
- **Zertifizierte Archivsysteme** bei Aufbewahrungspflichten nach
  § 147 AO — die App-interne Archivierung ist GoBD-orientiert, nicht
  zertifiziert

Bei Zweifeln am Scope einer Funktion: die Hinweise oben auf jeder Seite
geben die Grenzen deutlich an.

---

*Ende des Benutzerhandbuchs.*
