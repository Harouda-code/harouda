# Verfahrensdokumentation

**Kanzlei:** _[Name einsetzen]_
**Stand:** _[JJJJ-MM-TT]_
**Version:** 1.0
**Verantwortlich:** _[Name, Rolle]_

> **Hinweis:** Dies ist eine Vorlage. Die Verfahrensdokumentation nach
> GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von
> Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum
> Datenzugriff, BMF-Schreiben vom 28.11.2019) muss die tatsächlichen
> Prozesse in Ihrer Kanzlei beschreiben. Füllen Sie jede Passage aus;
> vage Formulierungen werden bei einer Betriebsprüfung beanstandet.
>
> Ein zertifiziertes Dokument ersetzt diese Vorlage nicht — sie ist nur
> ein Gerüst. Für eine GoBD-konforme Dokumentation empfiehlt sich eine
> externe Prüfung (z. B. IDW PS 880 oder Kammerprüfung).

---

## 1. Allgemeine Beschreibung

### 1.1 Unternehmen und Geschäftsprozesse
_[Beschreibung der Kanzlei: Größe, Anzahl Mandanten, Geschäftsbereiche.]_

### 1.2 Rolle der Software `harouda-app`
`harouda-app` wird zur Finanzbuchhaltung, USt-Voranmeldung, Belegverwaltung
und für steuerliche Nebenrechnungen eingesetzt. Es ist **kein
zertifiziertes Produkt** im Sinne des IDW PS 880 und ersetzt keine
DATEV-Installation. Produktive Verwendung erfordert ergänzende
organisatorische Maßnahmen (siehe Abschnitte 6–8).

---

## 2. Anwendungsdokumentation

### 2.1 Benutzer und Rollen

| Rolle         | Berechtigung                              | Person(en) |
|---------------|--------------------------------------------|-----------|
| Admin         | Vollzugriff, Stammdatenpflege              | _[…]_     |
| Sachbearbeiter| Buchungen anlegen/ändern                   | _[…]_     |
| Lese          | Auswertungen lesen, nicht schreiben        | _[…]_     |

_Hinweis: Die aktuelle Version der App kennt pro Supabase-Account einen
Benutzer mit Vollzugriff (Row Level Security pro `owner_id`). Eine echte
mehrstufige Rollenlogik (RBAC) muss auf Supabase-Ebene ergänzt werden,
falls mehrere Personen auf denselben Mandantenbestand zugreifen._

### 2.2 Zugriffskonzept
- Anmeldung über Supabase-Auth (E-Mail + Passwort).
- Passwortrichtlinie: mindestens 8 Zeichen (Supabase-Standard).
- MFA: _[aktiv / nicht aktiv — anpassen]_
- Sessions: Supabase verwaltet JWTs mit Ablauf; Details siehe Supabase
  Dokumentation.

### 2.3 Funktionsbereiche der Software
- Dashboard mit KPIs aus dem Buchungsjournal
- Buchungsjournal mit Soll/Haben, USt-Satz, Skonto, Audit-Trail
- Kontenplan SKR03 (ca. 150 Standardkonten)
- Berichte: GuV, BWA, SuSa mit Periodenfilter
- Steuerformulare: UStVA (ELSTER-XML-Export), EÜR (automatisch aus
  Journal), Gewerbesteuer, KSt, Anlagen N/S/G/V/SO/AUS (manuell)
- Belege: Upload mit OCR (`deu+eng`), Verknüpfung mit Buchungen
- Bankimport: MT940 / CAMT.053-Datei-Import
- Mandantenverwaltung mit USt-ID-Prüfung via BZSt-Edge-Function
- Audit-Log (hash-verkettete SHA-256-Einträge)
- GDPdU/IDEA-Export für Betriebsprüfer
- Fristenkalender

---

## 3. Technische Systemdokumentation

### 3.1 Architektur
- Client: Browser-basierte Single-Page-Application (React + TypeScript + Vite)
- Auth: Supabase (Hosted Postgres + Auth-Service)
- Daten (aktuell): Browser-`localStorage` pro Supabase-Account
- Daten (Ziel): Supabase-Postgres mit Row Level Security (Migrations in
  `supabase/migrations/`)
- Speicher: Belege aktuell als Data-URLs im `localStorage`; Ziel:
  Supabase-Storage-Bucket (siehe Migration 0001)
- Externe Dienste:
  - Supabase (Authentifizierung)
  - BZSt evatr (USt-ID-Prüfung, via Edge Function)
  - Tesseract.js (OCR, clientseitig)
  - pdfjs-dist (PDF-Parsing, clientseitig)

### 3.2 Datenfluss

1. Nutzer meldet sich per Supabase-Auth an.
2. Daten werden lokal im Browser gespeichert (oder via Supabase, wenn
   entsprechend migriert).
3. Bei Änderungen am Journal wird ein Audit-Eintrag geschrieben,
   hashverkettet mit dem vorherigen Eintrag.
4. Externe Calls nur bei:
   - USt-ID-Prüfung → Supabase Edge Function → BZSt
   - OCR: läuft clientseitig, kein externer Call

### 3.3 Schnittstellen

| Schnittstelle   | Zweck                       | Format                       |
|-----------------|-----------------------------|------------------------------|
| MT940 / CAMT    | Bankimport                  | SWIFT-Text / ISO 20022 XML   |
| ZUGFeRD/XRechnung| E-Rechnung einlesen        | PDF/A-3 + CII-XML oder UBL   |
| ELSTER-XML      | UStVA-Export                | ELSTER XSD (nur Auszug)      |
| DATEV-CSV       | Buchungsstapel-Export       | EXTF v700 (öffentlicher Spec)|
| GDPdU-ZIP       | Betriebsprüfung             | Index-XML + CSV              |
| PDF / XLSX      | Berichte                    | jspdf / exceljs              |

---

## 4. Betriebsdokumentation

### 4.1 Datensicherung
- **Aktuell:** `localStorage` wird NICHT automatisch gesichert. Export
  über GDPdU-ZIP bei Bedarf. → **Dringend anpassen**, wenn produktiv.
- **Ziel:** Supabase macht tägliche Backups (Point-in-Time Recovery je
  nach Plan). Frequenz und Aufbewahrung hier dokumentieren.
- Verantwortlich: _[…]_
- Prüfung der Wiederherstellbarkeit: _[Frequenz, letzter Testlauf]_

### 4.2 Protokollierung
- Audit-Log (hashverkettet) erfasst create/update/delete von
  Journalbuchungen automatisch. Kette kann in der App verifiziert werden.
- Anmelde-Logs: siehe Supabase Audit-Log.
- Beleg-Uploads: Timestamp + Dateiname + Größe + MIME, keine Prüfsumme
  (**Gap**, siehe Abschnitt 8).

### 4.3 Änderungs- und Fehlermanagement
- Fehler in der Anwendung: Supabase-Logs + Browser-Console.
- Änderungsanforderungen an der Software werden dokumentiert in:
  _[Ticket-System / Confluence-Seite / …]_
- Releases: _[Strategie einfügen]_

### 4.4 Hosting
- Infrastruktur: _[lokal / On-Premise / Cloud — bitte konkretisieren]_
- Standort der Daten: Supabase-Region _[eu-central-1 / …]_

---

## 5. Datenzugriff (Z1, Z2, Z3)

Nach § 147 Abs. 6 AO muss die Finanzverwaltung auf die steuerrelevanten
Daten zugreifen können:

- **Z1 — unmittelbarer Lesezugriff**: _[Wer hat ggf. Remote-Zugriff? Welche
  Verträge / Dokumentation existieren?]_
- **Z2 — mittelbarer Lesezugriff** (Prüfer bedient sich durch einen
  Mitarbeiter der Kanzlei): Standardfall. Die App erlaubt Filter,
  Berichte und Drilldown pro Konto/Buchung.
- **Z3 — Datenträgerüberlassung**: GDPdU-Export als ZIP aus
  _Einstellungen → Betriebsprüfung_. Enthält `index.xml` und CSV-Dateien
  für Journal, Konten, Mandanten, Belege und Audit-Log.

---

## 6. Aufbewahrung

- Bücher, Jahresabschlüsse, Inventare: 10 Jahre (§ 147 Abs. 3 AO).
- **Buchungsbelege: 8 Jahre** (ab 1.1.2025 durch Wachstumschancengesetz,
  zuvor 10 Jahre).
- Handelsbriefe: 6 Jahre.
- Fristbeginn: Ende des Kalenderjahres, in dem das Dokument erstellt /
  empfangen wurde.

In der App zeigt _Einstellungen → Aufbewahrungsfristen_ den Status aller
Buchungen und Belege. **Löschung erfolgt nicht automatisch** und
erfordert eine manuelle, dokumentierte Entscheidung.

---

## 7. Löschkonzept

1. Nach Ablauf der Aufbewahrungsfrist prüft _[Rolle]_ Datensätze auf
   bestehende Löschsperren (laufende Betriebsprüfung, Rechtsstreit, …).
2. Bei Zustimmung wird _[per Funktion X / manuell]_ gelöscht.
3. Der Löschvorgang erzeugt automatisch einen Audit-Eintrag.
4. Abgeleitete Auswertungen (Berichte, Steuererklärungen) werden im PDF-
   oder XML-Archiv belassen.

---

## 8. Bekannte Lücken / Anpassungsbedarf

Dokumentieren Sie hier offene Punkte:

- [ ] Migration von `localStorage` auf Supabase-Postgres (ausstehend).
- [ ] WORM- oder externe Sicherung des Audit-Logs (aktuell nur Browser-
      lokal; Hash-Kette macht Änderungen erkennbar, nicht verhindert).
- [ ] Qualifizierte elektronische Signatur für PDF-Archive (Anbieter:
      D-Trust / Bundesdruckerei; erfordert Hardware-Token).
- [ ] Rollen-basierte Rechte für mehrere Mitarbeiter (RBAC).
- [ ] Belege mit SHA-256-Prüfsumme versehen.
- [ ] Regelmäßiger Test-Restore der Sicherung dokumentieren.
- [ ] _[Weitere …]_

---

## 9. Änderungshistorie dieser Dokumentation

| Datum | Version | Änderung                         | Verantwortlich |
|-------|---------|----------------------------------|----------------|
|       | 1.0     | Erstanlage                       |                |
|       |         |                                  |                |
