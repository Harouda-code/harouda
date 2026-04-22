# Compliance-Guide

Für Steuerberater:innen, Wirtschaftsprüfer:innen und externe Auditor:innen.
Dieses Dokument übersetzt die **gesetzlichen Anforderungen** auf
**konkrete Code-Stellen und Mechanismen** in harouda-app. Das Ziel: ein
Prüfer soll in unter zwei Stunden nachvollziehen können, was die App tut
und wo ihre Grenzen liegen.

---

## 1. GoBD — Grundsätze ordnungsmäßiger Buchführung (digital)

### Rz. 58 — Richtigkeit / Unveränderbarkeit der Datenwerte

**Anforderung:** Buchungsbeträge dürfen nicht durch
Fließkomma-Rundungsfehler verfälscht werden.

**Implementierung:**
- `src/lib/money/Money.ts` — Wrapper über `Decimal.js` mit 41-stelliger
  Präzision.
- Keine `number`-Arithmetik auf Geldbeträgen im Domain-Layer.
- 36 Tests in `lib/money/__tests__/` decken Edge-Cases ab
  (0,1+0,2, Banker's Rounding, negative Zahlen).

### Rz. 64 — Festschreibung (Unveränderbarkeit nach Journalabschluss)

**Anforderung:** Nach Ablauf der Buchungsperiode müssen Buchungen gegen
Änderungen gesichert sein. Die Sicherung muss technisch dokumentiert und
nachvollziehbar sein.

**Implementierung:**
- `src/domain/gobd/FestschreibungsService.ts` — zentrale Logik:
  - SHA-256-Hash pro Buchungszeile (`lock_hash`-Spalte).
  - Monats-Sperre über `lsta_festschreibungen`-Tabelle (Migration 0021).
- DB-Trigger (Migration 0006 + 0021) verhindern UPDATE/DELETE auf
  festgeschriebenen Buchungen — **zweite Verteidigungslinie** auf Datenbankebene.
- Audit-Log-Eintrag bei jeder Festschreibung (Migration 0002).

**Prüfpfad:**
1. UI: `/einstellungen/audit` → zeigt alle Festschreibungen mit Zeitstempel.
2. DB: `select * from lsta_festschreibungen order by locked_at desc`.
3. Code: `FestschreibungsService.ts` — 100 % Test-Coverage, 11 Tests.

### Rz. 153-154 — Audit-Trail

**Anforderung:** Alle Änderungen an buchhaltungsrelevanten Daten müssen
nachvollziehbar sein — wer, was, wann, alter/neuer Wert.

**Implementierung:**
- `audit_log`-Tabelle (Migration 0002) mit Trigger auf allen
  schreibenden Operationen.
- **Hash-Chain** (Migration 0003): jeder Eintrag enthält SHA-256 des
  Vorgängers + eigener Payload. Manipulation bricht die Kette.
- Abfragbar über `/einstellungen/audit` (UI) oder direkt per SQL.
- `tax_auditor`-Rolle (Migration 0007): nur-lesender Zugriff für externe
  Prüfer:innen.

---

## 2. AO — Abgabenordnung

### § 147 Abs. 1 — Aufbewahrungspflicht 10 Jahre

**Anforderung:** Buchungsbelege und Rechnungen sind 10 Jahre aufzubewahren.

**Implementierung:**
- DB-Lebenszyklus: keine automatischen Löschungen. Löschung nur über
  explizite Administrations-Aktion (noch **nicht** automatisiert — siehe
  Gap in [ROADMAP.md](./ROADMAP.md)).
- Supabase-Storage für Belege: Lifecycle-Policy muss im Supabase-Projekt
  manuell konfiguriert werden.
- **Gap:** Keine automatische Prüfung „10 Jahre erreicht → nicht mehr
  löschbar". Workaround: `retention_policy`-Spalte in `documents`-Tabelle.

### § 147 Abs. 6 — Datenzugriff (Z1/Z2/Z3)

**Anforderung:** Bei Außenprüfung muss der Prüfer Zugriff in einer der
drei Varianten erhalten. Z3 = Datenträgerüberlassung.

**Implementierung:**
- `src/domain/gdpdu/Gdpdu3Exporter.ts` erzeugt Z3-konformes Paket:
  - `KONTEN.CSV`, `BUCHUNGEN.CSV`, `STAMMDATEN.CSV`
  - `INDEX.XML` (BMF-Beschreibungsstandard, reduziert)
  - `MANIFEST.XML` mit SHA-256 pro Datei
  - ISO-8859-15-Encoding (BMF-Vorgabe)
- UI: `/admin/z3-export` — Prüfzeitraum wählen → ZIP herunterladen.
- 16 Tests in `gdpdu/__tests__/`.

**Honest-Disclosure:** Das Z3-Format ist **nachgebildet**, nicht
zertifiziert. Ein offizielles IDEA-Testtool sollte vor Produktiv-Einsatz
mit einem Demo-Paket geprüft werden.

---

## 3. UStG — Umsatzsteuergesetz

### § 14 Abs. 4 — Rechnungspflichtangaben

**Implementierung:**
- `src/domain/belege/BelegValidierungsService.ts` — prüft alle 9
  Pflichtfelder (Rechnungs-Nr., Datum, Leistender, Empfänger,
  USt-ID oder Steuer-Nr., Liefer-/Leistungsdatum, Menge/Beschreibung,
  Entgelt + USt-Satz, ggf. Kleinunternehmer-Hinweis).
- 24 Tests. 100 % Coverage.

### § 18 — UStVA

- `src/domain/ustva/UstvaBuilder.ts` — Kennzahlen-Aggregation aus
  Journal (~40 Kennzahlen, darunter 81/86/35/48/66/83).
- `UstvaXmlBuilder.ts` — XML-Export in Anlehnung an ELSTER-Schema.
- **Gap:** Keine ERiC-Transmission. Der erzeugte XML-Export ist für
  Import in das ELSTER-Online-Portal oder einen zertifizierten Fachclient
  (DATEV, Taxpool, …) gedacht.

### § 18a — Zusammenfassende Meldung (ZM)

- `src/domain/ustva/ZmBuilder.ts` — Quartals-/Monats-Aggregation je
  USt-ID des Leistungsempfängers.
- **Gap:** Kein BZSt-BOP-Upload (SAML-Token benötigt).

---

## 4. EStG — Einkommensteuergesetz

### § 4 Abs. 3 — Einnahmen-Überschuss-Rechnung

- `src/domain/euer/EuerBuilder.ts` — Standard-Formular-Struktur.
- Mapping SKR03 → EÜR-Zeile in `skr03EuerMapping.ts`.
- Cross-Check gegen GuV via `EuerGuvCrossCheck.ts` (Plausibilität).

### § 5b — E-Bilanz

- `src/domain/ebilanz/EbilanzXbrlBuilder.ts` — XBRL-Generation.
- Taxonomie HGB 6.8 in `hgbTaxonomie68.ts` gemappt (~40 Kern-Elemente).
- `EbilanzValidator.ts` — interne Plausi-Checks (E001-E020).
- 21 Tests, XML well-formed, Bilanz↔GuV-Konsistenz geprüft.
- **Gap:** Keine XSD-Validierung gegen offizielles Schema. Keine
  ERiC-Transmission.

### § 38-42f — Lohnsteuer

- `src/domain/lohn/LohnabrechnungsEngine.ts` — Monats-Berechnung.
- `lohnsteuerTarif2025.ts` — Formel nach § 32a EStG, Steuerklassen I-VI.
- `vorsorgepauschaleCalculator.ts` — § 39b Abs. 4 EStG (vereinfacht, vs.
  volles BMF-PAP).
- `sozialversicherungParameter2025.ts` — aktuelle BBG + Beitragssätze.
- 27 Tests, Edge-Cases für Kinderfreibeträge, Faktorverfahren,
  pauschalierte Lohnsteuer.

### § 41a — Lohnsteuer-Anmeldung

- `src/domain/lohn/LohnsteuerAnmeldungBuilder.ts` — Monats-/Quartals-
  Aggregation. XML-Export in Anlehnung an ELSTER-Schema.

---

## 5. HGB — Handelsgesetzbuch

### § 266 — Bilanz-Gliederung (Kontoform)

- `src/domain/accounting/hgb266Structure.ts` — vollständige Struktur
  (Aktiva A-E, Passiva A-E) mit IDs für Mapping-Lookup.
- `BalanceSheetBuilder.ts` aggregiert SKR03-Konten in die Baumstruktur.

### § 275 Abs. 2 — GuV (Gesamtkostenverfahren)

- `src/domain/accounting/hgb275GkvStructure.ts` — 17 Positionen.
- `GuvBuilder.ts` aggregiert + berechnet Jahresergebnis.
- **Gap:** UKV (§ 275 Abs. 3) ist nicht implementiert.

### § 265 Abs. 2 — Vorjahresvergleich

- `VorjahresvergleichBuilder.ts` — zwei-Jahres-Vergleich mit
  Abweichung und Veränderungsprozent.
- **Gap:** Mehrjahresvergleich (3+) ist aktuell nicht verfügbar.

### § 242 — Jahresabschluss

- Kombinationsseite `/berichte/jahresabschluss` zieht Bilanz + GuV +
  ggf. Anhang (Platzhalter) in ein PDF zusammen.

---

## 6. EN 16931 / KoSIT XRechnung 3.0 — E-Rechnung B2G

**Verfahrensstand:**
- CustomizationID `urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0`
- UBL 2.1 Invoice als primäres Format (CII wird erkannt, aber nicht
  feldweise geparst).
- 15 Validator-Tests, ~20 BR-Regeln implementiert.

**Honest-Disclosure:**
- KoSIT-Prüftool kennt 200+ Regeln. Unsere Validator-Auswahl deckt die
  häufigsten formalen Fehler ab (fehlende Pflichtfelder, falsche
  Währung, ungültige Daten-Formate).
- **Empfehlung:** Vor Produktiv-Versand eine Stichprobe durch das
  öffentliche KoSIT-Validierungstool schicken.

---

## 7. ISO 19005-3 — PDF/A-3 (ZUGFeRD)

**Verfahrensstand:**
- `pdf-lib.attach(xml, "factur-x.xml", { afRelationship: Alternative })`
  bindet XRechnung-XML als Associated File ein.
- Dateiname + MIME korrekt, Struktur via `/AF` im Catalog validiert durch
  Round-Trip-Test.

**Honest-Disclosure:**
- **Kein XMP-Metadata-Stream** (Pflicht für PDF/A-3b).
- **Kein OutputIntent / ICC-Profil** (Pflicht für PDF/A-3b).
- Die erzeugten PDFs sind **funktional** ZUGFeRD-konform (jeder
  konforme Reader findet und parst das XML korrekt), aber **formal
  nicht PDF/A-3b-zertifiziert**.
- Für rechtssichere Archivierung nach 10 Jahren empfehlen wir eine
  Nachbearbeitung durch Adobe Acrobat Pro oder ein Tool wie `veraPDF`.

---

## 8. Integritäts-Verifikation

### SHA-256-Hashes

- **Journal-Hash-Chain** (Migration 0010): pro Buchungszeile.
  Manipulation einer Zeile verändert alle nachfolgenden Hashes.
- **Audit-Log-Hash-Chain** (Migration 0003): dasselbe Prinzip auf der
  Log-Ebene.
- **Festschreibungs-Hash** (Migration 0021): Monats-Summen-Hash als
  Sperrzeuge.
- **Z3-Export-Manifest**: SHA-256 pro Datei, der Prüfer rechnet bei
  Übergabe nach.

### Verifikations-Pfad

```sql
-- Kette intakt?
select id, expected_hash = actual_hash as ok
from (select id, lead(prev_hash) over (order by id) as expected_hash,
             compute_hash(id, payload, prev_hash) as actual_hash
      from audit_log) s
where not ok;
-- leere Ergebnismenge = Kette intakt
```

---

## 9. Bekannte Grenzen und Workarounds

| Thema | Grenze | Workaround |
|-------|--------|------------|
| ELSTER-Transmission | keine direkte Abgabe | XML-Export → ELSTER-Online-Portal / DATEV |
| BZSt-ZM-Upload | keine direkte Abgabe | CSV/XML-Export → BOP |
| PDF/A-3-Vollkonformität | keine XMP/OutputIntent | veraPDF-Postprocessing |
| DEÜV-Meldungen | nicht implementiert | DATEV-LODAS oder andere Lohnsoftware |
| XSD-Validierung E-Bilanz | nicht implementiert | manuelle Prüfung per externem XSD-Validator |
| 10-Jahres-Retention (auto) | nicht automatisiert | Supabase Storage Lifecycle Rules |
| SEPA / PSD2 Banking | nicht integriert | CSV-Import bleibt manuell |
| Zertifizierung IDW PS 880 | kein Audit | organisatorische Prüfung mit externem WP |

---

## 10. Für den Prüfer (Kurz-Checkliste)

Wenn Sie eine Außenprüfung durchführen:

1. **Z3-Export abfordern:** `/admin/z3-export` — wählt Zeitraum, liefert
   ZIP mit CSV + MANIFEST.
2. **Manifest prüfen:** SHA-256 jeder Datei im ZIP nachrechnen.
3. **Audit-Log einsehen:** `/einstellungen/audit` oder als
   `tax_auditor`-Rolle direkt in Supabase.
4. **Festschreibungen sichten:** welche Perioden sind gelockt?
5. **Verfahrensdokumentation anfragen:** `/einstellungen/verfahrensdoku`
   sowie diesen Compliance-Guide.
