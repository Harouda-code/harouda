# Benutzerhandbuch (Kurzfassung)

Für Kanzleimitarbeiter:innen. Ausführlicher als ein Tooltip, kürzer als
ein Schulungskurs. Die langen Fassungen liegen unter
`docs/BENUTZERHANDBUCH.md` und `docs/BERATER-LEITFADEN.md`.

---

## 1. Hauptfunktionen in einer Minute

| Bereich | Wo? | Worum geht's? |
|---------|-----|---------------|
| Dashboard | `/dashboard` | Umsatz-, Ausgaben-, Ergebnis-KPIs pro Quartal |
| Buchungsjournal | `/journal` | Doppelte Buchführung, Festschreibung, DATEV-Export |
| Konten | `/konten` | SKR03-Kontenplan (~150 Konten), aktiv/inaktiv |
| Berichte | `/berichte` | GuV, BWA, Bilanz, SuSa, Vorjahresvergleich |
| Steuer | `/steuer` | UStVA, ZM, EÜR, E-Bilanz, Anlagen N/S/G/V/… |
| Lohn | `/lohn` | Kalkulator + Lohnsteuer-Anmeldung + Archiv |
| Belege | `/belege` | Beleg-Upload + OCR + Verknüpfung mit Buchung |
| E-Rechnung | `/buchungen/e-rechnung` | XRechnung & ZUGFeRD erstellen und empfangen |
| Z3-Export | `/admin/z3-export` | Betriebsprüfer-Datenpaket |
| Einstellungen | `/einstellungen` | Kanzleistamm, Benutzer, Fristen, Retention |

---

## 2. Typische Workflows

### 2.1 Monatsabschluss (Umsatzsteuer + Lohn)

1. **Journal abschließen**
   - `/journal` → Monat filtern
   - Plausi prüfen (Soll = Haben aggregiert)
   - Button „Monat festschreiben" → GoBD-Sperre aktiv
2. **UStVA erzeugen**
   - `/steuer/ustva` → Monat wählen → „XML generieren"
   - XML in ELSTER-Online-Portal hochladen **oder** an DATEV übergeben
3. **Lohnsteuer-Anmeldung**
   - `/lohn/lohnsteueranmeldung` → Monat → XML generieren → ELSTER
4. **Abrechnungen archivieren**
   - `/lohn/archiv` — GoBD-konform 10 Jahre aufbewahrt
5. **Belege kontrollieren**
   - `/belege` → Filter „ohne Buchung" → zuordnen

### 2.2 Jahresabschluss (Bilanz / GuV / E-Bilanz)

1. **Bilanz prüfen** — `/berichte/bilanz`
2. **GuV prüfen** — `/berichte/guv`
3. **Vorjahresvergleich** — `/berichte/vorjahresvergleich`
4. **E-Bilanz erzeugen** — `/steuer/ebilanz`
5. **Jahresabschluss-PDF** — `/berichte/jahresabschluss` → druckfertiges PDF
6. **Optional DATEV-Export** — `/export/datev`

### 2.3 Lohnabrechnung

1. **Mitarbeiter pflegen** — `/personal/mitarbeiter`
2. **Lauf starten** — `/personal/abrechnung`
3. **Prüfen** — Vorschau mit Brutto/Netto/Steuer/SV pro Mitarbeiter
4. **Ausführen** — Abrechnung → Journal gebucht → Archiv
5. **LSTA** siehe 2.1 Schritt 3

### 2.4 E-Rechnung empfangen

1. `/buchungen/e-rechnung` → Reiter „Empfangen"
2. PDF (ZUGFeRD) oder XML (XRechnung) hochladen
3. Parser extrahiert alle Felder, Validator warnt bei Fehlern
4. Button „Als Beleg speichern" → verknüpft mit Buchung

### 2.5 E-Rechnung erstellen

1. `/buchungen/e-rechnung` → Reiter „Erstellen"
2. Format wählen: XRECHNUNG (B2G) oder ZUGFERD (B2B-hybrid)
3. Rechnungsdaten + Positionen eingeben
4. Validator zeigt Fehler + Warnungen live
5. XML oder PDF herunterladen

### 2.6 Betriebsprüfung (Z3-Export)

1. `/admin/z3-export`
2. Prüfzeitraum eingeben
3. Firmendaten kontrollieren
4. „Als ZIP herunterladen" → 4-8 Dateien mit Manifest
5. Dem Prüfer übergeben

---

## 3. Belegerfassung Schritt-für-Schritt

### Beleg hochladen

1. `/belege` öffnen
2. Drag-&-Drop ODER Button „Beleg hochladen"
3. PDF, JPG, PNG oder HEIC werden akzeptiert

### OCR nutzen

1. Nach Upload wartet die App max. ~15 Sekunden auf Tesseract-OCR
2. Erkannter Text erscheint rechts neben dem Beleg
3. Datum, Rechnungsnummer, Summen werden heuristisch extrahiert
4. **Bitte prüfen** — OCR ist gut, aber nicht perfekt

### Buchung verknüpfen

1. Button „Buchung erstellen" → springt ins Journal
2. Pflichtfelder aus OCR vorausgefüllt
3. Konto Soll/Haben manuell setzen (oder KI-Vorschlag)
4. Speichern → Beleg ist verknüpft

### Gesetzliche Pflichten

Der Belegvalidierungs-Service warnt, wenn Pflichtangaben nach
**§ 14 Abs. 4 UStG** fehlen:
- Rechnungs-Nr.
- Rechnungs- und Leistungsdatum
- Name/Anschrift Leistender + Empfänger
- USt-ID oder Steuer-Nr.
- Menge / Art der Leistung
- Entgelt + Steuersatz + Steuerbetrag
- Ggf. Kleinunternehmerhinweis (§ 19 UStG)

---

## 4. FAQ + Fehlermeldungen

**„Ich kann einen Monat nicht mehr bearbeiten."**
Der Monat wurde festgeschrieben (GoBD Rz. 64). Nur ein Benutzer mit
Admin-Rolle kann über `/einstellungen/audit` einen dokumentierten
Gegenbeweis anlegen — die ursprünglichen Zeilen bleiben dabei erhalten.

**„UStVA-Summe passt nicht zur GuV."**
Häufige Ursachen: fehlende Beleg-Zuordnung, falscher USt-Satz in einer
Buchung, Periodenabgrenzung (Leistungsdatum ≠ Buchungsdatum). Cross-Check
unter `/berichte/susa`.

**„ELSTER-Export lädt nicht hoch."**
Die App erzeugt das XML, sendet aber **nicht** direkt. Lade das XML
manuell im ELSTER-Online-Portal hoch.

**„ZUGFeRD-PDF wird von Empfänger abgelehnt."**
Unser PDF/A-3 ist funktional, aber formal nicht zertifiziert. Bei
strikter Empfänger-Prüfung kontaktiere den Support — wir bereiten
veraPDF-Postprocessing vor.

**„Beleg-OCR erkennt Handschrift nicht."**
Tesseract ist für maschinell gedruckten Text ausgelegt. Handschriftliche
Belege bitte manuell nachtragen.

**„Demo-Daten sind verschwunden."**
Im Demo-Mode liegt alles im localStorage — wurde der Browser-Cache
gelöscht, sind Demo-Daten weg. Dashboard → „Demo-Daten laden" zum
Neuerzeugen.

**„Ich habe versehentlich einen Mandanten gelöscht."**
Alle Löschungen landen im Audit-Log (`/einstellungen/audit`). Wiederherstellung
erfolgt durch Admin per SQL aus den Audit-Daten — schreibe dem Support.

**„Gibt es eine Mobile-App?"**
Nein (noch nicht). Die Web-App ist responsive bis 375 px Breite.

---

## 5. Tastenkürzel

| Shortcut | Wo | Wirkung |
|----------|-----|---------|
| `Strg + N` | Journal | Neue Buchung |
| `Esc` | Modals | Schließen |
| `Strg + K` | überall | Suche (falls aktiviert) |
| `Strg + S` | Formulare | Speichern |
| `Strg + P` | Berichte | Drucken/PDF |

---

## 6. Wo finde ich mehr?

- **Entwickler-Doku:** [`DEVELOPER-ONBOARDING.md`](./DEVELOPER-ONBOARDING.md)
- **Compliance-Nachweis:** [`COMPLIANCE-GUIDE.md`](./COMPLIANCE-GUIDE.md)
- **Verfahrensdokumentation:** [`verfahrensdokumentation.md`](./verfahrensdokumentation.md)
- **Ausführliches Handbuch:** [`BENUTZERHANDBUCH.md`](./BENUTZERHANDBUCH.md)
- **Für Berater:** [`BERATER-LEITFADEN.md`](./BERATER-LEITFADEN.md)
- **Go-Live-Plan:** [`GO-LIVE-CHECKLIST.md`](./GO-LIVE-CHECKLIST.md)
