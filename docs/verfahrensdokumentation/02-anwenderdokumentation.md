# Kapitel 2 — Anwenderdokumentation

> Status: v0.1 BEFÜLLT | Version: 0.1 | Letztes Update: 2026-04-20

## Zweck dieses Kapitels

Beschreibt, wie die Anwender:innen das Verfahren im Alltag bedienen.
Adressaten sind gemischt: **Wirtschaftsprüfer:innen nach IDW PS 880**,
die den Nachweis einer dokumentierten Anwender-Einweisung und
definierter Arbeitsabläufe erwarten, und **tatsächliche Anwender:innen**
in der Kanzlei, die eine knappe, faktische Anleitung zum Nachschlagen
benötigen. Rollen- und Prozess-Definitionen stehen in Kapitel 1 und
werden hier nicht wiederholt; technische Hintergründe in Kapitel 3,
Audit-Mechanik in Kapitel 7.

---

## 2.1 Zielgruppen und Anwendungsfälle

Die Rollen-Matrix ist in **Kapitel 1 Abschnitt 1.4** definiert. Hier
werden die typischen **Aufgaben je Rolle** beschrieben — also der
Alltag, nicht die formale Verantwortung.

### Kanzlei-Leitung (Steuerberater:in nach § 3 StBerG)

Typische Tätigkeiten im Verfahren:

- Freigabe der Monats- und Jahres-Festschreibungen nach Review.
- Final-Prüfung und Abgabe von UStVA, LStA, ZM, E-Bilanz
  (XML-Übergabe an ELSTER-Portal außerhalb des Verfahrens).
- Verifikation der Audit-Hash-Ketten vor Abgabe (siehe Kap. 7
  Abschnitt 7.3) über `/einstellungen/audit` und
  `/einstellungen/systemstatus`.
- Übergabe Z3-Datenpaket an Betriebsprüfer:innen unter `/admin/z3-export`.
- Rollen- und Berechtigungspflege unter `/einstellungen/benutzer`.

### Kanzlei-Mitarbeiter:in

Typische Tätigkeiten im Verfahren:

- Belegerfassung (manuelle Eingabe, Scanner-Upload, OCR-Nachbearbeitung).
- Laufende Buchungsarbeit im Journal.
- Erstellung und Ausdruck von Auswertungen (GuV, BWA, Bilanz,
  Vorjahresvergleich, Summen- und Saldenliste).
- Vorbereitung UStVA + ZM + LStA (XML-Erzeugung, ohne Abgabe).
- E-Rechnungs-Eingang bearbeiten, E-Rechnungs-Ausgang erstellen.
- Bank-Kontoauszüge importieren (MT940/CAMT.053) und abgleichen.

### Mandant:in (optional)

Nur relevant, wenn der Kanzlei-Betreiber das Mandanten-Selbstservice
aktiviert hat. Typische Tätigkeiten:

- Beleg-Upload über `/belege` (Drag-&-Drop oder Button).
- Einsicht in die eigenen Auswertungen und offenen Forderungen.
- Widerruf der Cookie-Einwilligung bzw. Zugriff auf den eigenen
  Datenexport nach DSGVO Art. 20 unter `/admin/datenexport`.

### Mandanten-Mitarbeiter:in

Im Verfahren **nicht als eigenständige Rolle** modelliert; Zugriff
erfolgt über den Mandanten-Account (siehe Kap. 1 Abschnitt 1.4).

### Betriebsprüfer:in (Rolle `tax_auditor`)

Read-only-Zugang auf Basis von § 193 AO, typischerweise zeitlich
befristet (`access_valid_until` in Benutzer-Stammdaten, siehe
Kap. 5 Abschnitt 5.1). Typische Tätigkeiten:

- Prüfer-Dashboard `/pruefer` — Firmen-Übersicht, Journal-Statistik,
  Kontenplan, Audit-Log-Zähler.
- Z3-Paket anfordern (Kap. 7 Abschnitt 7.5).
- Audit-Log einsehen und Hash-Ketten verifizieren (Kap. 7 Abschnitt 7.3).

### System-Administrator:in (Kanzlei-IT)

Typische Tätigkeiten im Verfahren:

- Benutzer- und Rollenverwaltung unter `/einstellungen/benutzer`.
- Überwachung des System-Status unter `/einstellungen/systemstatus`
  (inkl. manueller Kettenprüfung).
- Einspielung neuer Supabase-Migrationen (Ops-Arbeit, siehe Kap. 4).
- Konfiguration der optionalen Analyse-Dienste (GA4 oder Plausible,
  siehe Kap. 5 Abschnitt 5.6).

---

## 2.2 Bedienungskonzept

### Navigation

Das Haupt-Navigationsmenü ist entlang der fachlichen Domänen
gruppiert. Die Gruppen bleiben zwischen den Rollen gleich; sichtbar
sind je Rolle nur die Einträge, auf die Rechte bestehen.

- **Dashboard** — Firmen-Sicht (`/dashboard`) und Berater-Sicht über
  alle Firmen (`/berater/dashboard`).
- **Buchführung** — Übersicht, Journal, Kontenplan, Belegerfassung,
  Belegeliste, Mapping und Plausibilitätsprüfung.
- **Berichte** — GuV, BWA, Bilanz, Jahresabschluss-PDF,
  Vorjahresvergleich, Summen- und Saldenliste.
- **Steuer** — Formular-Übersicht, UStVA, ZM, EÜR, E-Bilanz, ESt-
  Anlagen (N, S, G, V, SO, AUS, Kind, Vorsorge, R, KAP, …),
  Hauptvordrucke ESt 1A und ESt 1C.
- **Lohn & Gehalt** — Lohn-Kalkulator, Lohnsteuer-Anmeldung,
  Abrechnungs-Archiv.
- **Compliance & Export** — Kanzlei-Dashboard, Audit-Trail,
  Z3-Datenexport (§ 147 AO), Datenexport (DSGVO Art. 20),
  DATEV-Export.
- **Einstellungen** — Kanzleistamm, Benutzer, Fristen, Aufbewahrung,
  Kostenstellen, System-Status, System-Log, Verfahrensdokumentation.

Der Firmen-/Mandanten-Umschalter liegt oben rechts in der
Navigationsleiste. Ein Wechsel aktualisiert sofort alle Ansichten,
Berichte und Audit-Log-Perspektiven. Jeder Wechsel wird im Audit-Log
der jeweiligen Firma protokolliert.

### Berechtigungs-Sicht aus Anwender-Perspektive

Was sich zwischen den Rollen sichtbar ändert (die technische
Durchsetzung über Row-Level-Security ist in Kap. 5 Abschnitt 5.1
beschrieben):

- Die Rolle `tax_auditor` sieht ausschließlich Prüfer-Dashboard,
  Z3-Export, Audit-Log — keine Schreibmasken, keine Einstellungen.
- Die Rolle Mandant sieht Beleg-Upload und die eigenen Reports des
  Mandats, keine Nachbar-Mandate.
- Die Rolle Admin (Kanzlei-Leitung / System-Admin) sieht zusätzlich
  Benutzer-Verwaltung, Retention-Ansicht, Audit-Log-Detail.

### Tastenkürzel

| Kürzel | Wo | Wirkung |
|---|---|---|
| `Strg + N` | Journal | Neue Buchung anlegen |
| `Esc` | Modale Dialoge | Schließen |
| `Strg + K` | Global (falls in Einstellungen aktiviert) | Schnellsuche |
| `Strg + S` | Formulare | Speichern |
| `Strg + P` | Berichte | Druck- oder PDF-Dialog |
| `Strg + Umschalt + P` | Global | Privacy-/Screen-Sharing-Modus (maskiert sensible Inhalte per CSS-Blur) |

---

## 2.3 Kern-Arbeitsabläufe

### 2.3.1 Belegerfassung

1. `/belege` öffnen (oder direkt `/buchungen/erfassung`).
2. Beleg hochladen per Drag-&-Drop oder Button
   *"Beleg hochladen"*; akzeptiert werden PDF, JPG, PNG, HEIC.
3. OCR läuft automatisch (lokal im Browser via Tesseract, bis zu
   ca. 15 Sekunden). Erkannter Text erscheint neben dem Beleg.
4. Heuristisch extrahierte Felder prüfen: Datum, Rechnungsnummer,
   Summen. **OCR ist nicht perfekt — manuell nachbessern.**
5. *"Buchung erstellen"* → springt in das Journal, Pflichtfelder
   sind aus dem OCR-Ergebnis vorausgefüllt.
6. Belegvalidierungs-Dienst prüft live auf Pflichtangaben nach
   **§ 14 Abs. 4 UStG** (Rechnungs-Nr., Datum, Leistender +
   Empfänger mit Anschrift, USt-ID oder Steuer-Nr., Menge/Art
   der Leistung, Entgelt, Steuersatz, Steuerbetrag, ggf.
   Kleinunternehmerhinweis nach § 19 UStG). Fehlende Pflichtfelder
   werden als Warnung angezeigt, blockieren aber den Entwurf nicht.
7. Speichern → Beleg ist mit der Buchung verknüpft.

Handschriftliche Belege werden von Tesseract nicht zuverlässig
erkannt — manuelle Erfassung erforderlich.

### 2.3.2 Buchung und Festschreibung

1. `/journal` öffnen. Gewünschten Monat filtern.
2. Neue Buchung per Button oder `Strg + N`: Datum, Beleg-Nr.,
   Soll-Konto, Haben-Konto, Betrag, Buchungstext.
3. Plausibilitätsprüfung unter `/buchfuehrung/plausi`
   durchführen (Soll = Haben auf Monatssumme).
4. Nach abgeschlossener Prüfung: Button *"Monat festschreiben"*.
   Technische Wirkung: Felder werden nach **GoBD Rz. 64**
   gesperrt; Korrektur ab diesem Zeitpunkt nur noch über
   Stornobuchung mit Verknüpfung auf die Original-Buchung
   (`parent_entry_id`).
5. Audit-Log-Eintrag wird automatisch erzeugt.

Stornobuchung: im Journal auf die zu stornierende Zeile klicken,
Kontextmenü → *"Stornobuchung anlegen"*. Die Original-Zeile bleibt
erhalten; die Stornobuchung erscheint als eigene Zeile mit Verweis.

### 2.3.3 Auswertungen und Berichte

Typische Reihenfolge vor einer Abgabe oder einem Abschluss:

1. **Summen- und Saldenliste** — `/berichte/susa`. Basis-
   Konsistenzprüfung.
2. **BWA** — `/berichte/bwa`. Monat, Vormonat und YTD im Vergleich.
3. **GuV** — `/berichte/guv`. Struktur nach **HGB § 275 Abs. 2
   (GKV)**.
4. **Bilanz** — `/berichte/bilanz`. Struktur nach **HGB § 266**.
5. **Vorjahresvergleich** — `/berichte/vorjahresvergleich` nach
   **HGB § 265 Abs. 2**.
6. Für den Jahresabschluss: `/berichte/jahresabschluss` erzeugt ein
   druckfertiges PDF über alle oben genannten Bestandteile.

Jeder Bericht bietet Druckfunktion (`Strg + P`) und PDF-Export.

### 2.3.4 UStVA-Vorbereitung (§ 18 UStG)

1. `/steuer/ustva` öffnen.
2. Zeitraum (Monat oder Quartal) wählen.
3. Ergebnis-Kennzahlen prüfen (81, 86, 35, 48, 66, 83 und weitere).
   Kleinunternehmer-Hinweis erscheint, falls in den Einstellungen
   aktiviert.
4. Button *"XML generieren"*. Die ELSTER-kompatible Datei wird im
   Download-Bereich bereitgestellt.
5. XML **manuell** im ELSTER-Online-Portal hochladen oder an die
   zertifizierte Steuer-Software der Kanzlei übergeben. Das
   Verfahren überträgt **nicht** direkt.
6. Nach Bestätigung durch die Finanzverwaltung: Status im Abgabe-
   Register auf *"Bestätigt"* setzen, Transfer-Ticket eintragen.

Analoge Abläufe für ZM (`/steuer/zm`) und LStA (`/lohn/lohnsteueranmeldung`).

### 2.3.5 Z3-Export für die Betriebsprüfung (§ 147 Abs. 6 AO)

1. `/admin/z3-export` öffnen.
2. Prüfzeitraum (Von-Bis) eingeben.
3. Firmenstammdaten kontrollieren (Name, Steuernummer, Adresse).
4. Optionale Schalter: Stammdaten, Lohndaten einschließen.
5. Button *"Als ZIP herunterladen"*. Das Paket enthält INDEX.XML,
   KONTEN.CSV, BUCHUNGEN.CSV, BELEGE.CSV, STAMMDATEN.CSV, ggf.
   LOHN.CSV und MANIFEST.XML (SHA-256 je Datei).
6. Paket der Prüferin übergeben. Integritätsprüfung ist durch die
   Prüferin mit Standard-Werkzeugen möglich.

Details in Kap. 7 Abschnitt 7.5.

### 2.3.6 Mandanten-Datenexport (DSGVO Art. 20)

1. `/admin/datenexport` öffnen.
2. Zweck wählen: *"DSGVO Art. 20 Datenübertragbarkeit"*,
   *"DSGVO Art. 15 Abs. 3 Kopie der verarbeiteten Daten"* oder
   *"Eigene Archivierung (kein rechtlicher Zweck)"*.
3. Schalter *"Audit-Log einschließen"* ist per Default aktiv.
4. Button *"ZIP erstellen und herunterladen"*. Paket enthält
   MANIFEST.json, tables/*.json und DISCLAIMER.txt.
5. Integrität prüfen: Datei im Abschnitt *"Integrität prüfen"*
   derselben Seite wieder hochladen; die SHA-256-Hashes werden neu
   berechnet und mit dem Manifest abgeglichen.

**Ausdrücklich kein Backup.** Das Banner der Seite und der
DISCLAIMER im Paket weisen darauf hin. Details in Kap. 7 Abschnitt
7.5 und in [`../BACKUP-STRATEGY.md`](../BACKUP-STRATEGY.md).

### 2.3.7 E-Rechnung empfangen und erstellen

Empfang:

1. `/buchungen/e-rechnung` → Reiter *"Empfangen"*.
2. PDF (ZUGFeRD / Factur-X) oder XML (XRechnung, UBL 2.1) hochladen.
3. Der Parser extrahiert die Strukturfelder; Validator meldet
   Verstöße gegen die ausgewählten KoSIT-BR-Regeln (~20 von > 200,
   siehe Kap. 3).
4. *"Als Beleg speichern"* → Eintrag in der Belegerfassung,
   Verknüpfung mit optionaler Buchung.

Erstellen:

1. `/e-rechnung/erstellen`.
2. Format wählen: XRechnung (B2G) oder ZUGFeRD/Factur-X (B2B-hybrid).
3. Rechnungsdaten und Positionen eingeben; der Validator meldet
   Feldfehler und Warnungen live.
4. XML (XRechnung) oder PDF mit XML-Anhang (ZUGFeRD) herunterladen.

### 2.3.8 Lohnabrechnung

1. `/personal/mitarbeiter` — Stammdaten pflegen.
2. `/personal/abrechnung` — Abrechnungslauf starten, Periode wählen.
3. Vorschau prüfen: Brutto, Netto, Lohnsteuer, Solidaritätszuschlag,
   Kirchensteuer, SV-Beiträge Arbeitnehmer und Arbeitgeber je
   Mitarbeiter.
4. Ausführen: Abrechnungen werden erzeugt, ins Journal gebucht und
   in `/lohn/archiv` abgelegt. Per-Row-Hash wird gesetzt (siehe
   Kap. 7 Abschnitt 7.2).
5. Lohnsteuer-Anmeldung: `/lohn/lohnsteueranmeldung`, Monat wählen,
   XML generieren.

---

## 2.4 Fehlerbehandlung und Support

### Typische Meldungen im Alltag

| Meldung / Situation | Ursache und Behandlung |
|---|---|
| *"Monat kann nicht mehr bearbeitet werden."* | Der Monat wurde festgeschrieben (GoBD Rz. 64). Korrektur nur über Stornobuchung. Entsperren ist fachlich ausgeschlossen; für dokumentierte Ausnahmefälle siehe Kap. 8 Abschnitt 8.4. |
| *"UStVA-Summe stimmt nicht mit GuV überein."* | Häufige Ursachen: fehlende Beleg-Zuordnung, falscher USt-Satz in einer Buchung, Periodenabgrenzung (Leistungsdatum ≠ Buchungsdatum). Cross-Check über Summen- und Saldenliste `/berichte/susa`. |
| *"ELSTER-Export wird nicht übertragen."* | Das Verfahren erzeugt die XML-Datei, überträgt sie aber nicht direkt. Abgabe erfolgt manuell im ELSTER-Portal. Siehe Kap. 1 Abschnitt 1.3. |
| *"ZUGFeRD-PDF wird von Empfänger abgelehnt."* | Die ZUGFeRD-Datei enthält den korrekten XML-Anhang nach EN 16931; formal ist sie jedoch nicht als PDF/A-3 zertifiziert (kein XMP-Stream, kein OutputIntent). Strenge Empfänger verlangen externes veraPDF-Postprocessing. |
| *"Beleg-OCR erkennt Handschrift nicht."* | Tesseract ist auf maschinellen Druck ausgelegt. Handschriftliche Belege sind manuell nachzutragen. |
| *"Demo-Daten sind verschwunden."* | Im Demo-Modus liegt der Bestand im Browser-Speicher. Wurde der Cache gelöscht, sind die Daten weg. Dashboard → *"Demo-Daten laden"* erzeugt einen neuen SKR03-Bestand mit Beispiel-Buchungen. |
| *"Hash-Kette bricht."* | Ernstzunehmender Fall. Beleg-Nr. der ersten gebrochenen Zeile notieren, Audit-Log der Zeile einsehen. Eskalation an System-Admin und ggf. Datenschutzbeauftragte:n. Ursachen siehe Kap. 7 Abschnitt 7.3 (*tamper-evidence*-Grenze). |

### Eskalationspfad

1. **Anwender:in** erkennt Fehler oder ungewöhnliche Meldung.
2. **Kanzlei-Leitung** wird informiert, wenn die Anomalie eine
   schreibende Operation oder eine Festschreibung betrifft.
3. **System-Administrator:in** wird einbezogen bei technischen
   Anzeichen (gebrochene Hash-Kette, fehlgeschlagener Export,
   anhaltende Login-Probleme).
4. **Datenschutzbeauftragte:r** bei datenschutzrelevanten Vorfällen
   (Unautorisierter Zugriff, Datenverlust, Betroffenenanfragen
   außerhalb der Standardprozesse); Meldung im Incident-Register
   unter Kap. 7 Abschnitt 7.6.

<!-- TODO(verfahrensdoku): Konkrete Kontaktpunkte (E-Mail, Telefon, Erreichbarkeit) je Eskalations-Stufe ergänzen, sobald die Kanzlei ihre interne Support-Organisation definiert hat. Diese Information liegt nicht im Software-Codebase, sondern bei der Kanzlei. -->

### Dokumentation jeder Ausnahme

Jede Abweichung vom regulären Prozess (Notfall-Zugriff, manueller
Eingriff in die Datenbank, dokumentierter Override einer Freigabe)
wird mit Begründung, Datum und Verantwortlicher im Audit-Log
festgehalten. Siehe Kap. 8 Abschnitt 8.8.

---

## 2.5 Schulungsbedarf

### Vorausgesetztes Vorwissen

Anwender:innen müssen vor dem ersten Produktivzugang über folgende
Grundkenntnisse verfügen:

- **Doppelte Buchführung** — Soll- und Haben-Buchungen,
  Periodenabgrenzung, Stornobuchung.
- **SKR03-Kontenrahmen** — Grundstruktur der verwendeten
  Kontenklassen 0-9.
- **UStG-Grundlagen** — § 14 Abs. 4 UStG (Pflichtangaben Rechnung),
  § 18 UStG (Voranmeldung), § 19 UStG (Kleinunternehmer).
- **GoBD-Grundlagen** — Prinzipien der Unveränderbarkeit
  (§ 146 Abs. 4 AO, GoBD Rz. 107 ff.) und der Festschreibung
  (GoBD Rz. 64).
- **DSGVO-Grundlagen** für Rollen, die personenbezogene Daten
  bearbeiten (insbesondere Lohn).

### Empfohlene Schulungen

- **Produkt-Einweisung** (intern, ca. 2-4 Stunden) — Navigation,
  Pflicht-Workflows aus Abschnitt 2.3, Tastenkürzel. Teilnehmer
  erhalten eine Einweisungs-Bestätigung; die Bestätigung wird von
  der Kanzlei 10 Jahre aufbewahrt (Proxy an § 147 AO bzw.
  gesellschaftsrechtliche Nachweispflichten).
- **GoBD-Auffrischung** (intern oder extern, jährlich).
- **DSGVO-Auffrischung** für Lohn-Sachbearbeitung und Admin-Rollen,
  jährlich; organisiert von Datenschutzbeauftragter:m.
- **Fachliche Weiterbildung** zu Steuerrecht und Lohnrecht gemäß
  Anforderungen der Steuerberaterkammer.

### Rolle der Anwenderdokumentation im Prüfprozess

Für eine IDW-PS-880-Prüfung ist die **dokumentierte
Anwender-Einweisung** ein eigenständiger Prüfpunkt. Dieses Kapitel
allein erfüllt die Anforderung nicht — erforderlich ist zusätzlich:

- Schriftlicher Nachweis der Teilnahme je Mitarbeiter:in an der
  Einweisung und den Auffrischungs-Schulungen.
- Eine aktuelle Fassung dieses Kapitels, die mit dem tatsächlichen
  Code-Stand übereinstimmt (siehe Hinweis zur Dokumenten-Drift
  unten).
- Ein Ablagesystem für Schulungs-Zertifikate (Kanzlei-intern, nicht
  Teil des Verfahrens).

### Dokumenten-Drift — zu überprüfen vor Go-Live

Die Quellen-Dokumente [`../USER-GUIDE-DE.md`](../USER-GUIDE-DE.md)
und [`../BERATER-LEITFADEN.md`](../BERATER-LEITFADEN.md) sind älter
als der aktuelle Code-Stand (2026-04-20). Abgleich-Ergebnisse aus
der Erstellung dieses Kapitels:

- `BERATER-LEITFADEN.md` §9 nennt Migrationen 0001-0016; Stand
  heute sind es 0001-0023.
- `USER-GUIDE-DE.md` §6 verweist auf das Vorgänger-Dokument
  `verfahrensdokumentation.md` (Singular); dieses Kapitel ist Teil
  der neuen, gegliederten Verfahrensdokumentation unter
  `docs/verfahrensdokumentation/`.
- Die Routen `/admin/datenexport` (Sprint-3, Mandanten-Datenexport)
  und `/datenschutz` / `/impressum` (Sprint-2, DSGVO-Scaffolds)
  erscheinen in den Quell-Anleitungen noch nicht; sie wurden in
  diesem Kapitel ergänzt.

<!-- TODO(verfahrensdoku): USER-GUIDE-DE.md und BERATER-LEITFADEN.md auf den aktuellen Code-Stand aktualisieren (Migrations-Nummern, Routen, Verweis auf die neue gegliederte Verfahrensdokumentation). Ergebnis in die Kanzlei-Dokumentenablage einfügen. -->

---

## Quellen & Referenzen

- **Abgabenordnung (AO):** § 146 Abs. 4 (Unveränderbarkeit, Kontext
  der Festschreibung); § 147 Abs. 6 (Z3-Datenträgerüberlassung);
  § 193 (Außenprüfung).
- **BMF-Schreiben zu den GoBD vom 28.11.2019:** Rz. 64
  (Festschreibung), Rz. 107 ff. (Unveränderbarkeit); für vertiefende
  Inhalte siehe Kap. 7.
- **Umsatzsteuergesetz (UStG):** § 14 Abs. 4 (Pflichtangaben
  Rechnung, Abschnitt 2.3.1); § 18 (Voranmeldung, Abschnitt 2.3.4);
  § 19 (Kleinunternehmer).
- **Handelsgesetzbuch (HGB):** § 265 Abs. 2 (Vorjahresvergleich,
  Abschnitt 2.3.3); § 266 (Bilanz-Gliederung); § 275 Abs. 2
  (GuV-Gliederung).
- **Steuerberatungsgesetz (StBerG):** § 3 (bestellte Rolle der
  Kanzlei-Leitung).
- **Verordnung (EU) 2016/679 (DSGVO):** Art. 15 Abs. 3, Art. 20
  (Datenexport, Abschnitt 2.3.6).
- **Europäische Norm EN 16931** (E-Rechnung, Abschnitt 2.3.7).
- **IDW PS 880** — Anforderung einer dokumentierten Anwender-
  Einweisung (Abschnitt 2.5).

### Interne Projekt-Referenzen

- [`../USER-GUIDE-DE.md`](../USER-GUIDE-DE.md) — Quelle, teilweise
  älter als der aktuelle Code-Stand (siehe Dokumenten-Drift-Hinweis).
- [`../BERATER-LEITFADEN.md`](../BERATER-LEITFADEN.md) — Quelle für
  Multi-Mandats-Workflows; teilweise älter als der aktuelle
  Code-Stand.
- [`../BENUTZERHANDBUCH.md`](../BENUTZERHANDBUCH.md) — ausführlichere
  Schritt-für-Schritt-Anleitung je Feature.
- [`../../src/pages/BelegerfassungPage.tsx`](../../src/pages/BelegerfassungPage.tsx),
  [`../../src/pages/JournalPage.tsx`](../../src/pages/JournalPage.tsx),
  [`../../src/pages/UstvaPage.tsx`](../../src/pages/UstvaPage.tsx),
  [`../../src/pages/PayrollRunPage.tsx`](../../src/pages/PayrollRunPage.tsx),
  [`../../src/pages/Z3ExportPage.tsx`](../../src/pages/Z3ExportPage.tsx),
  [`../../src/pages/DatenExportPage.tsx`](../../src/pages/DatenExportPage.tsx)
  — Code-Referenzen der beschriebenen Abläufe.
- Kap. 1 Abschnitt 1.4 (Rollendefinitionen), Abschnitt 1.5 (Prozess-
  Landkarte); Kap. 3 (Technik); Kap. 5 (Berechtigungen und DSGVO);
  Kap. 7 (Audit und Festschreibung); Kap. 8 (IKS).
