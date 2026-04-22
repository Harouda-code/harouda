# Berater-Leitfaden — harouda-app

Für Steuerberater:innen, Bilanzbuchhalter:innen und externe Prüfer:innen,
die **mehrere Mandanten** oder **fremde Firmen** betreuen.

> Dieses Dokument ergänzt das [Benutzerhandbuch](BENUTZERHANDBUCH.md).
> Dort sind alle Feature-Details beschrieben; hier geht es um
> Multi-Mandats-Workflows und Zusammenarbeit.

---

## 1. Zweck und Scope

Die App ersetzt kein zertifiziertes Kanzleiverwaltungssystem (DATEV,
Addison, ADDISON OneClick, Stotax). Sie eignet sich als:

- **Zweit-Tool** neben einer DATEV-/Addison-Kanzlei für
  Mandant:innen, die selbst buchen und Daten zur Weiterverarbeitung
  übergeben.
- **Review-Tool** für externe Prüfer:innen (eigene Rolle
  `tax_auditor` inklusive GDPdU-Export und zeitlich befristbarem
  Zugang).
- **Lehr-/Lernumgebung** für Buchführung, EÜR-Konten-Mapping,
  E-Rechnung.

Was die App **nicht** ist:

- Keine direkte ELSTER-/ERiC-Übertragung
- Keine ITSG-zertifizierte Lohnsoftware
- Kein zertifiziertes Archivsystem nach GoBD (wohl aber
  „GoBD-orientiert")
- Keine Lohnbuchhaltung im Vollumfang (Kein Lohnkonto, kein
  Lohnjournal, keine DEÜV-XML)

---

## 2. Multi-Mandats-Modell

### 2.1 Firma vs. Mandant

- **Firma** (`companies`-Tabelle, Migration 0004) = Tenant. Jede Kanzlei
  oder jedes Unternehmen, das Sie betreuen, ist eine eigene Firma.
  Daten sind zwischen Firmen strikt getrennt (RLS über `company_id`).
- **Mandant** (`clients`-Tabelle) = Kunde **innerhalb** einer Firma.
  Also z. B.: Firma „Kanzlei Muster", darin Mandanten „Bäckerei Schmid",
  „Klempner Weber" usw.

Als Berater:in sind Sie typischerweise **Owner oder Admin** in Ihrer
eigenen Kanzlei-Firma UND gleichzeitig **Admin** (oder `tax_auditor`)
in den Firmen Ihrer Mandant:innen, falls diese die App selbst nutzen.

### 2.2 Firmen wechseln

- Die aktive Firma steht oben rechts in der Navigationsleiste.
- Wechsel aktualisiert sofort alle Daten, Reports, Archive, Audits.
- Jeder Wechsel wird im Audit-Log der jeweiligen Firma protokolliert.

---

## 3. Berater-Dashboard

Route: **Dashboard → Berater (alle Firmen)** (`/berater/dashboard`).

### 3.1 Was es zeigt

Pro Firma, in der Sie Mitglied sind:

| Spalte | Bedeutung |
|---|---|
| Firma | Anzeigename + Rolle |
| Buchungen | Gesamtzahl Journal-Einträge |
| Entwürfe | Noch nicht festgeschriebene — gelb hervorgehoben |
| Offene Forderungen | Summe aller OPOS-Forderungen |
| davon überfällig | Anzahl + Summe, rot bei > 0 |
| Verbindlichkeiten | Summe offener Verbindlichkeiten |
| Letzte Buchung | Datum; rot ab > 30 Tagen Inaktivität |
| Aktion | „Wechseln" springt in die Firma |

Oben: **aggregierte KPIs** über alle Firmen (Anzahl Firmen, Total
Forderungen, Total überfällig, Total Verbindlichkeiten, Total Entwürfe).

### 3.2 Tägliche Routine

1. Frühmorgens Berater-Dashboard öffnen.
2. Firmen mit **roter Spalte** (Überfälligkeiten, lange Inaktivität)
   priorisiert prüfen.
3. Firmen mit **gelber Entwurfs-Spalte** durchsehen — Entwürfe abklären
   und festschreiben.
4. Bei Bedarf Firma wechseln, Fragen via **Beraternotizen** auf der
   betreffenden Buchung hinterlegen, Mandant:in kontaktieren.

---

## 4. Beraternotizen (Kollaboration)

Jede Journal-Buchung hat ein Sprechblasen-Icon mit Zähler-Badge
(`/journal`). Klicken öffnet ein Modal:

- **Append-only** — einmal geschrieben, nicht editierbar. Korrekturen
  werden als neue Notiz hinzugefügt; alte Notizen bleiben sichtbar.
- **4000 Zeichen** pro Notiz.
- Anzeige mit Autor (E-Mail), Zeitstempel.
- **Owner/Admin** kann einzelne Notizen löschen; jede Löschung wird im
  Audit-Log vermerkt.
- Scope: eine Notiz gehört immer zu einer Entität (`journal_entry`,
  `client`, `invoice_archive`, …) und zu einer Firma — d. h. Notizen
  sind nicht zwischen Firmen sichtbar.

> **Ehrlich:** Es gibt **keine** Ende-zu-Ende-Verschlüsselung.
> Supabase bietet TLS in-transit + at-rest-Verschlüsselung; der
> Inhalt der Notizen ist für alle Mitglieder der Firma lesbar.

---

## 5. Externe Prüfer:innen einbinden

Wenn eine Betriebsprüfung ansteht, legen Sie ein:e Prüfer:in mit Rolle
`tax_auditor` in der betroffenen Firma an:

1. **Einstellungen → Benutzer & Rollen** (`/einstellungen/benutzer`).
2. „Nutzer:in hinzufügen" — User-ID der Prüfer:in eintragen, Rolle
   `tax_auditor`.
3. **Optional (DB-SQL)**: `access_valid_until` auf das Prüfungsende
   setzen — die RLS-Policy (Migration 0007) sperrt danach automatisch
   den Lesezugriff.

Die Prüfer:in hat ausschließlich Zugriff auf:

- **Prüfer-Dashboard** (`/pruefer`) — Firmenübersicht, Journal-Statistik,
  Kontenplan-Count, Audit-Log-Count
- **GDPdU-ZIP-Export** — kompletter Datenabzug mit `index.xml`
- **Audit-Log** — vollständig, inkl. Hash-Ketten-Verifikation

Keine Schreibrechte, keine Einstellungen, keine Nutzerverwaltung.

---

## 6. Handoff an DATEV / zertifizierte Clients

### 6.1 DATEV-Buchungsstapel

`/export/datev` — siehe [Benutzerhandbuch §9](BENUTZERHANDBUCH.md#9-datev-export).
Kurze Faustregeln für Berater:innen:

- Vor dem Export **Kontenplan sichten**: passen die Konten-Nummern zum
  DATEV-Kontenrahmen Ihrer Kanzlei?
- Vor dem Export **Entwürfe festschreiben** (der Export nimmt nur
  `gebucht` mit).
- **Strict-Modus nutzen** — wenn der Bericht Fehler zeigt, diese
  beheben, nicht ignorieren.
- Format-Version **700** ist der öffentliche DATEV-Standard. Wenn Ihre
  DATEV-Installation 701 verlangt, im Dropdown anpassen.
- Die erzeugte CSV ist **Windows-1252**; beim manuellen Öffnen in Excel
  die Kodierung beachten.

### 6.2 ELSTER-Abgabe

`/steuern/elster` — die App erzeugt **nur** die XML, **nicht** die
Übertragung. Übliche Vorgehensweise:

1. UStVA im Formular prüfen (Plausi-Bericht).
2. XML exportieren.
3. Bei ElsterOnline-Portal hochladen (mit Ihrem
   `_sig.pfx`/`_enc.pfx`-Zertifikat) — oder in Ihrer zertifizierten
   Steuer-Software importieren.
4. Nach Bestätigung durch die Finanzverwaltung den Status im
   Abgabe-Register auf „Bestätigt" und das Transfer-Ticket eintragen.

### 6.3 Lohn-Handoff

Die App bietet keine ITSG-Meldungen. Wenn Sie als Berater:in die
Lohnabrechnung **extern** machen (Sie im DATEV-LODAS, Addison-Lohn etc.),
nutzen Sie den **CSV-Export der Lohn-Vorschau** als Kontrollinstrument
oder als Quelle für eine eigene Import-Brücke. Die Werte sind
**Planungsgrad**, nicht verbindlich.

---

## 7. Qualitätssicherung

### 7.1 Vor jedem Monatsabschluss

- **Audit-Ketten prüfen** (`/einstellungen/audit` → zwei grüne
  Ketten-Haken). Bei Fehler: welcher Eintrag bricht? Direkt mit
  Admin-Rolle in Supabase recherchieren.
- **SuSa erstellen** (`/berichte/susa`) — auf Konsistenz prüfen.
- **OPOS-Aging-Liste**: unüblich hohe 91+-Beträge?
- **Entwurfs-Buchungen** (Berater-Dashboard) — alle adressiert?

### 7.2 Vor ELSTER-Abgabe

- **USt-VA-Plausibilität** grün.
- **Kleinunternehmer-Flag** in Einstellungen passt zur Mandant:in.
- **Steuernummer** in Einstellungen ist gepflegt.
- Für Jahresabschluss: **Verfahrensdokumentation** erzeugt und mit
  Mandant:in besprochen.

### 7.3 Bei Verdacht auf Manipulation

- Journal-Hash-Kette läuft `defekt` → Beleg-Nr. der ersten gebrochenen
  Zeile notieren, im Audit-Log die Änderungshistorie dieser Zeile
  nachvollziehen.
- Audit-Log-Kette läuft `defekt` → ernsthafter Fall. Supabase-Trigger
  schützen normalerweise davor; ein Kettenbruch bedeutet, dass jemand
  direkten DB-Zugriff mit ausreichenden Rechten hatte.

---

## 8. Grenzen und Verweise

Wenn eine Mandats-Situation die App überfordert, diese Anker helfen:

| Thema | Verweis |
|---|---|
| Lohnabrechnung mit > 5 Sonderkonstellationen | ITSG-zertifiziertes Lohnprogramm (sv.net Komfort, DATEV-LODAS, Lexware-Lohn+Gehalt) |
| Größere Bilanz nach HGB | Es gibt keine Bilanzrechnung in dieser App — nur EÜR |
| Jahresabschluss-Veröffentlichung (§ 325 HGB) | Externe Dienstleister (DATEV, publikationsplattform.de) |
| Kassenführung (TSE) | Nicht enthalten; KassenSichV-konforme Kassensoftware nötig |
| Branche-Fachprogramme (z. B. Arzt, Anwalt) | Diese App ist generisch |

---

## 9. Übung — Erstmandat aufsetzen

Für ein neues Mandat, das die App selbst nutzen soll:

1. **Kanzlei-Firma** — falls noch nicht vorhanden. Stammdaten ausfüllen
   (`/einstellungen`).
2. **Mandant in der Kanzlei-Firma anlegen** (`/mandanten`) — für
   Filter- und Reporting-Zwecke.
3. **Kontenplan importieren** (`/konten`) — SKR03-Seed.
4. **Supabase-Migrationen** einspielen (0001–0016), Supabase-Projekt für
   die Mandant:in einrichten.
5. In dieser neuen Firma:
   - Stammdaten (Firma = Mandat)
   - Mandant:in als User mit Rolle `admin` einladen
   - Sie selbst als `admin` oder `owner`
6. Erste Buchungen (z. B. Anfangsbestand) erfassen und festschreiben.
7. **Verfahrensdokumentation v1** erzeugen und ablegen.

---

*Ende des Berater-Leitfadens.*
