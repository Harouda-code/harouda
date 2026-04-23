# 06 · Belege & Rechnung — § 14 UStG, E-Rechnung, XRechnung, ZUGFeRD

**Inhalt:** Alle Begriffe rund um die Rechnung als zentralen umsatzsteuerlichen Beleg — vom Rechnungsbegriff nach § 14 UStG über die Pflichtangaben (§ 14 Abs. 4 UStG), die vereinfachte Kleinbetragsrechnung (§ 33 UStDV), die zwei Lesarten der Gutschrift (§ 14 Abs. 2 UStG vs. umgangssprachliche Stornorechnung) und die Rechnungsberichtigung bis zum historischen Umbruch durch das Wachstumschancengesetz vom 27.03.2024: verpflichtende **E-Rechnung im B2B-Verkehr ab 2025** mit Übergangsfristen bis 2028. Dazu die technischen Normen und Formate: das europäische semantische Datenmodell **EN 16931**, die deutsche XML-Spezifikation **XRechnung** und das hybride **ZUGFeRD**-Format (PDF/A-3 + eingebettetes XML).

Baut auf auf [01-grundlagen.md](./01-grundlagen.md) (GoBD, DSGVO, Aufbewahrung),
[02-buchhaltung.md](./02-buchhaltung.md) (Beleg, Belegnummer, Geschäftsvorfall) und
[04-steuer-meldungen.md](./04-steuer-meldungen.md) (USt, Vorsteuer, UStG, USt-IdNr,
Reverse-Charge, Kleinunternehmer).

> **Modul-Metadaten**
> **Modul:** 06 · Belege & Rechnung · **Einträge:** 10 FEST · **Stand:** 2026-04-23
> **Baut auf:** [01-grundlagen.md](./01-grundlagen.md), [02-buchhaltung.md](./02-buchhaltung.md), [04-steuer-meldungen.md](./04-steuer-meldungen.md) · **Spätere Module:** 08 referenziert dieses

---

## Inhaltsverzeichnis

1. [Rechnung (§ 14 UStG)](#1-rechnung--14-ustg)
2. [Pflichtangaben einer Rechnung (§ 14 Abs. 4 UStG)](#2-pflichtangaben-einer-rechnung--14-abs-4-ustg)
3. [Kleinbetragsrechnung (§ 33 UStDV)](#3-kleinbetragsrechnung--33-ustdv)
4. [Gutschrift (§ 14 Abs. 2 UStG)](#4-gutschrift--14-abs-2-ustg)
5. [Rechnungsberichtigung / Stornorechnung](#5-rechnungsberichtigung--stornorechnung)
6. [E-Rechnung (Elektronische Rechnung)](#6-e-rechnung-elektronische-rechnung)
7. [Wachstumschancengesetz — B2B-Rechnungspflicht ab 2025](#7-wachstumschancengesetz--b2b-rechnungspflicht-ab-2025)
8. [EN 16931](#8-en-16931)
9. [XRechnung](#9-xrechnung)
10. [ZUGFeRD](#10-zugferd)

---

## 1. Rechnung (§ 14 UStG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Rechnung |
| **Synonyme (DE)** | Faktura (veraltet, süddeutsch/österreichisch), Abrechnung (weiter gefasst, umfasst auch Rechnungen i. S. v. § 14 UStG) |
| **Arabisch** | الفاتورة الضريبية الألمانية (كل وثيقة — بصرف النظر عن تسميتها التجارية — تُحتسب بها توريد سلعة أو أداء خدمة وفق § 14 Abs. 1 UStG؛ هي الأساس الوثائقي لخصم ضريبة المدخلات — Vorsteuerabzug — لدى المستلم، ولذلك تخضع لقواعد شكلية ومضمونية صارمة من حيث المحتوى والشكل ومدة الحفظ) |
| **Englisch (Code-Kontext)** | `invoice` (Standard-DB- und API-Terminologie) |
| **Kategorie** | Rechtsbegriff / Beleg-Art |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Jedes Dokument, mit dem über eine Lieferung oder sonstige Leistung abgerechnet wird, **gleichgültig, wie dieses Dokument im Geschäftsverkehr bezeichnet wird** (§ 14 Abs. 1 Satz 1 UStG). Der Begriff ist **rein funktional** — nicht die Überschrift ("Rechnung", "Quittung", "Abrechnung", "Faktura") entscheidet, sondern ob das Dokument eine Lieferung/Leistung und deren Entgelt abrechnet. Eine Rechnung kann aus mehreren Dokumenten bestehen, sofern in einem davon das Entgelt und der Steuerbetrag genannt sind und auf die anderen Dokumente eindeutig verwiesen wird (§ 14 Abs. 1 Satz 4 UStG).

**Pflicht zur Ausstellung (§ 14 Abs. 2 UStG):**

| Empfänger | Pflicht | Frist |
|---|---|---|
| Unternehmer / juristische Person (B2B) | **Ja** | 6 Monate nach Leistungserbringung |
| Privatperson bei Bauleistung / grundstücksbezogener Werklieferung | **Ja** (+ 2 Jahre Aufbewahrung beim Empfänger) | 6 Monate |
| Privatperson sonstige Leistungen (B2C) | Keine Rechnungspflicht (Kulanz möglich) | — |
| Innergemeinschaftliche Lieferung | Ja, bis zum **15. des Folgemonats** | § 14a Abs. 1 UStG |

### Rechtsgrundlage
- **§ 14 UStG** — Ausstellungspflicht, Rechnungsbegriff, Pflichtangaben, elektronische Rechnung
- **§ 14a UStG** — Zusätzliche Pflichten in besonderen Fällen (ig Lieferungen, Reverse-Charge, Reiseleistungen, Differenzbesteuerung)
- **§ 14b UStG** — Aufbewahrungspflicht: **10 Jahre** bei Unternehmern, **2 Jahre** bei Privatempfängern von Bauleistungen
- **§ 14c UStG** — Unberechtigter / unrichtiger Steuerausweis (Achtung: jede USt-Ausweisung begründet Steuerschuld, auch bei Kleinunternehmern!)
- **§ 15 UStG** — Vorsteuerabzug (setzt formell ordnungsgemäße Rechnung voraus)
- **§§ 31–34 UStDV** — Durchführungsverordnung: Ausstellung, Berichtigung, elektronische Übermittlung
- **BMF-Schreiben vom 15.10.2024** — Umfassende Verwaltungsauffassung zur E-Rechnung (Az. III C 2 - S 7287-a/23/10001 :007)

**Verwandte Begriffe:**
- [Pflichtangaben (§ 14 Abs. 4 UStG)](#2-pflichtangaben-einer-rechnung--14-abs-4-ustg) — die Pflichtbestandteile
- [Kleinbetragsrechnung](#3-kleinbetragsrechnung--33-ustdv) — Sonderfall mit reduzierten Angaben
- [Gutschrift](#4-gutschrift--14-abs-2-ustg) — Rechnung durch den Leistungsempfänger
- [E-Rechnung](#6-e-rechnung-elektronische-rechnung) — strukturiertes elektronisches Format
- [Beleg](./02-buchhaltung.md#17-beleg) — buchhalterischer Oberbegriff (jede Rechnung ist Beleg, nicht jeder Beleg Rechnung)
- [Vorsteuer](./04-steuer-meldungen.md#3-vorsteuer) — Vorsteuerabzug setzt formell korrekte Rechnung voraus

**Verwendung im Code:**
- `src/domain/invoice/` — **noch nicht implementiert**, Sprint 15+ geplant
- Klare Entitäts-Trennung: `Invoice` (formelle USt-Entität) ≠ `Receipt` / `Beleg` (allgemeiner Buchungsbeleg)
- `src/validators/invoiceValidator.ts` (geplant) — Pflichtfeld-Prüfung nach § 14 Abs. 4 UStG vor Versand
- Typen in `src/types/invoice.ts`: `Invoice`, `InvoiceItem`, `InvoiceFormat` (`paper | pdf | xrechnung | zugferd`)
- DB-Schema: Tabelle `invoices` mit `invoice_kind` Enum (`standard | kleinbetrag | gutschrift | storno | korrektur`)
- `invoice_number` als monoton wachsender, lückenloser Zähler pro Mandant → GoBD-Rz. 107 (Unveränderbarkeit und Vollständigkeit)

**Nicht verwechseln mit:**
- **Quittung** — bestätigt lediglich eine Zahlung, keine Rechnung i. S. v. § 14 UStG; allein keine Grundlage für Vorsteuerabzug
- **Lieferschein** — dokumentiert die Lieferung, ersetzt nicht die Rechnung (fehlendes Entgelt)
- **Angebot / Auftragsbestätigung** — vorvertragliche Dokumente, keine Abrechnung
- **Mahnung** — erinnert an bestehende Forderung, ist keine neue Rechnung (keine zweite Steuerentstehung)
- **Beleg** (weiter gefasst, siehe `02-buchhaltung.md`) — jede Rechnung ist Beleg, aber Kassenbons, Kontoauszüge, Buchungsbelege sind keine Rechnungen i. S. v. § 14 UStG

**Anmerkungen / Edge-Cases:**
- **§ 14c UStG (unberechtigter Steuerausweis):** Wer USt in einer Rechnung ausweist, **schuldet** diese — auch bei Kleinunternehmern (§ 19 UStG) oder steuerfreien Umsätzen. Der Validator MUSS vor Freigabe prüfen, ob der Mandant zum Steuerausweis berechtigt ist und ob der Steuersatz zur Leistungsart passt.
- **Rechnung in Fremdwährung:** zulässig, aber der Steuerbetrag muss **zusätzlich in Euro** angegeben werden (§ 14 Abs. 4 Satz 2 UStG). Umrechnung mit amtlichem Monatsdurchschnittskurs des BMF (§ 16 Abs. 6 UStG).
- **Mehrteilige Rechnung (§ 14 Abs. 1 Satz 4 UStG):** Rahmenvereinbarung + Einzelabrufe sind als verknüpfte Dokumente zulässig; Datenmodell entsprechend als Referenz-Graph vorsehen.
- **Gutscheine (§ 3 Abs. 13–15 UStG, Einführung 2019):** Einzweckgutscheine lösen Besteuerung bereits bei Ausgabe aus; die Rechnung über den Einlösevorgang ist steuerlich abweichend zu behandeln.
- **Rückwirkende Rechnungsberichtigung:** Nach EuGH C-518/14 (Senatex, 15.09.2016) und BMF-Schreiben vom 18.09.2020 rückwirkend möglich — entscheidend für den ursprünglichen Voranmeldungszeitraum des Vorsteuerabzugs (siehe #5).
- **Architektur-Entscheidung:** Das Domänenmodell `Invoice` wird als **Event-Sourcing** (unveränderliche Events) modelliert, nicht als mutable Status-Maschine — Begründung: GoBD-Unveränderbarkeit (Rz. 58 ff.) und die Tatsache, dass bei Rechnungen keine stille nachträgliche Korrektur zulässig ist. Jede Änderung muss als neuer Event (`InvoiceCorrected`, `InvoiceCancelled`) protokolliert werden, der Ursprungs-Event bleibt erhalten.

---

## 2. Pflichtangaben einer Rechnung (§ 14 Abs. 4 UStG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Pflichtangaben einer Rechnung |
| **Synonyme (DE)** | Rechnungspflichtangaben, Rechnungsbestandteile, Pflichtbestandteile (einer Rechnung) |
| **Arabisch** | البيانات الإلزامية للفاتورة (القائمة القانونية المغلقة للعناصر التي يجب أن تتضمنها كل فاتورة ألمانية وفق § 14 Abs. 4 UStG؛ غياب أي منها يُسقط حق المستلم في خصم ضريبة المدخلات — Vorsteuerabzug — حتى تتم إعادة الفاتورة بشكل صحيح أو تصحيحها) |
| **Englisch (Code-Kontext)** | `mandatoryInvoiceFields`, `invoiceRequiredFields` |
| **Kategorie** | Rechtsbegriff / Validierungsregel |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Geschlossene Liste von inhaltlichen Angaben, die eine Rechnung i. S. v. § 14 UStG zwingend enthalten MUSS, damit sie den Vorsteuerabzug (§ 15 UStG) beim Leistungsempfänger begründet. Fehlt eine Pflichtangabe, ist die Rechnung formal mangelhaft — der Vorsteuerabzug wird versagt, bis die Rechnung durch den Aussteller berichtigt wird (vgl. [Rechnungsberichtigung](#5-rechnungsberichtigung--stornorechnung)).

**Pflichtangaben im Überblick (§ 14 Abs. 4 Satz 1 Nr. 1–10 UStG):**

| Nr. | Feld | Anmerkung |
|---|---|---|
| 1 | Vollständiger Name und Anschrift des **leistenden Unternehmers** | Firmierung wie im Handelsregister |
| 2 | Vollständiger Name und Anschrift des **Leistungsempfängers** | Briefkasten-Adresse ausreichend (EuGH C-374/16, C-375/16 Geissel/Butin) |
| 3 | **Steuernummer** oder **USt-IdNr** des leistenden Unternehmers | USt-IdNr Pflicht bei ig Lieferungen |
| 4 | **Ausstellungsdatum** | nicht zwingend = Leistungsdatum |
| 5 | **Fortlaufende Rechnungsnummer** | einmalig vergeben, lückenlose Nummernserie(n) zulässig |
| 6 | **Menge** und **handelsübliche Bezeichnung** der Lieferung / Art und Umfang der sonstigen Leistung | "Beratungsleistung" allein unzureichend |
| 7 | **Zeitpunkt der Leistung** (Leistungsdatum) | Monatsangabe bei Abrechnung im Ausstellungsmonat zulässig |
| 8 | **Nettoentgelt**, ggf. aufgeschlüsselt nach Steuersätzen und Steuerbefreiungen | inkl. im Voraus vereinbarte Minderungen (Skonto-Hinweis genügt) |
| 9 | Anzuwendender **Steuersatz** bzw. Hinweis auf Steuerbefreiung | z. B. "steuerfrei nach § 4 Nr. 1a UStG" |
| 10 | Auf das Entgelt entfallender **Steuerbetrag** | bei Fremdwährung zusätzlich in Euro (§ 14 Abs. 4 Satz 2 UStG) |

**Zusätzliche Pflichthinweise in besonderen Fällen:**

| Fall | Pflichthinweis | Rechtsgrundlage |
|---|---|---|
| Rechnung durch Leistungsempfänger | Wort **„Gutschrift"** | § 14 Abs. 4 Nr. 10 UStG |
| Reverse-Charge | **„Steuerschuldnerschaft des Leistungsempfängers"** | § 14a Abs. 5 UStG |
| Ig Lieferung | Hinweis auf Steuerbefreiung + beide USt-IdNrn | § 14a Abs. 3 UStG |
| Reiseleistungen | **„Sonderregelung für Reisebüros"** | § 14a Abs. 6 UStG |
| Differenzbesteuerung (§ 25a UStG) | **„Gebrauchtgegenstände / Sonderregelung"** | § 14a Abs. 6 UStG |
| Bauleistung an Privat | Hinweis auf 2-jährige Aufbewahrungspflicht | § 14 Abs. 4 Satz 1 Nr. 9 UStG |

### Rechtsgrundlage
- **§ 14 Abs. 4 UStG** — Pflichtangaben (Nr. 1–10)
- **§ 14a UStG** — Zusatzpflichten in besonderen Fällen
- **§ 15 Abs. 1 UStG** — Vorsteuerabzug nur mit formell ordnungsgemäßer Rechnung
- **§ 31 UStDV** — Durchführung (handelsübliche Bezeichnung, mehrteilige Rechnung)
- **EuGH C-518/14 (Senatex, 15.09.2016)** — rückwirkende Berichtigung bei Mindestangaben
- **EuGH C-374/16, C-375/16 (Geissel / Butin, 15.11.2017)** — Briefkastenadresse reicht als Anschrift
- **BMF-Schreiben 18.09.2020** — Rückwirkung der Rechnungsberichtigung (Umsetzung EuGH-Rechtsprechung)

**Verwandte Begriffe:**
- [Rechnung (§ 14 UStG)](#1-rechnung--14-ustg) — Mutter-Begriff
- [Kleinbetragsrechnung (§ 33 UStDV)](#3-kleinbetragsrechnung--33-ustdv) — reduzierter Katalog
- [Rechnungsberichtigung](#5-rechnungsberichtigung--stornorechnung) — Heilung bei Mängeln
- [USt-IdNr](./04-steuer-meldungen.md#4-ust-idnr-umsatzsteuer-identifikationsnummer) — Pflichtfeld Nr. 3
- [Steuernummer](./04-steuer-meldungen.md#14-steuernummer) — Alternative zu USt-IdNr
- [Vorsteuer](./04-steuer-meldungen.md#3-vorsteuer) — Rechtsfolge formaler Mängel

**Verwendung im Code:**
- `src/validators/invoiceValidator.ts` (geplant) — Pflichtfeld-Validator mit Mapping auf § 14 Abs. 4 Nr. 1–10
- `src/domain/invoice/fieldRequirements.ts` — Regel-Matrix: welche Zusatzangaben bei welchem `invoiceKind`
- Fehler-Codes in Validator sollen direkten Bezug zur Paragraphen-Nummer haben, z. B. `ERR_UST_14_4_5_INVOICE_NUMBER_MISSING`
- UI: roter Block im Rechnungs-Formular mit Verweis auf fehlende Pflichtangabe und Paragraphen-Zitat
- E-Rechnung: Pflichtfeld-Mapping muss zusätzlich die **BT-/BG-Codes** (Business Term / Business Group) aus EN 16931 kennen — siehe `src/domain/invoice/en16931Mapping.ts`

**Nicht verwechseln mit:**
- **„Soll-Angaben"** — es gibt in § 14 UStG **keine** Soll-Angaben im engeren Sinne: alle 10 Nr. sind Muss-Angaben. Häufiger Irrtum.
- **Handelsrechtliche Bestandteile (§ 37a HGB)** — Firmenname, Rechtsform, Sitz, Registernummer sind **zusätzliche** handelsrechtliche Pflichten, nicht Teil des § 14 UStG-Katalogs
- **Zahlungsbedingungen, Skonto, Bankverbindung** — **nicht** gesetzliche Pflichtangaben nach § 14 UStG, wirtschaftlich aber üblich
- **„Leistungsbeschreibung"** als Marketing-Begriff vs. **„handelsübliche Bezeichnung"** (§ 14 Abs. 4 Nr. 5 UStG) — nur Letzteres ist gesetzlich definiert

**Anmerkungen / Edge-Cases:**
- **Handelsübliche Bezeichnung:** Der BFH stellt strenge Anforderungen — "Waren" oder "Dienstleistungen" reichen nicht. Die Angabe muss **Art der Leistung eindeutig identifizierbar** machen. Für Massenware kann ein Verweis auf den Lieferschein genügen, wenn dieser Teil der Rechnung ist (§ 14 Abs. 1 Satz 4 UStG).
- **Rechnungsnummer — lückenlose Serie:** Der BFH verlangt keine absolute Lückenlosigkeit, erlaubt aber **mehrere Nummernkreise** (Filialen, Jahre, Rechnungstypen). Dokumentation des Nummernvergabe-Systems nach GoBD Rz. 62 zwingend.
- **Rückwirkende Berichtigung:** Seit EuGH *Senatex* und BMF 18.09.2020 rückwirkend möglich, sofern die Rechnung **Mindestanforderungen** erfüllt: Aussteller, Empfänger, Leistungsbeschreibung, Entgelt, ausgewiesene USt. Fehlen dagegen diese "Kernangaben", liegt **keine berichtigungsfähige Rechnung** vor — kein rückwirkender Vorsteuerabzug.
- **E-Rechnung ab 2025:** Die EN 16931 kennt ca. 160 Business Terms. § 14 Abs. 4 UStG deckt nur den umsatzsteuerlichen Mindestumfang ab; die technische Norm verlangt zusätzliche Felder (z. B. BT-1 Invoice Number, BT-2 Issue Date etc.). Der Validator muss **beide Ebenen** prüfen.
- **Für das MVP:** Rücksprache mit Steuerberater vor Produktiv-Go über die Behandlung von Grenzfällen (Rechnungen ohne eindeutige Leistungsbeschreibung, Sammelrechnungen, Rahmenvereinbarungen mit Einzelabruf).

---

## 3. Kleinbetragsrechnung (§ 33 UStDV)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Kleinbetragsrechnung |
| **Synonyme (DE)** | Rechnung über Kleinbeträge, Barverkaufsrechnung (umgangssprachlich, nicht deckungsgleich) |
| **Arabisch** | فاتورة المبالغ الصغيرة (استثناء قانوني من البيانات الإلزامية الكاملة: كل فاتورة إجمالي مبلغها — شاملاً ضريبة القيمة المضافة — لا يتجاوز 250 يورو يُسمح فيها بقائمة مُبسَّطة من البيانات وفق § 33 UStDV؛ تحتفظ بكامل حقها في خصم ضريبة المدخلات لدى المستلم، ومع ذلك لا تنطبق على التوريدات داخل الاتحاد الأوروبي أو حالات Reverse-Charge) |
| **Englisch (Code-Kontext)** | `smallAmountInvoice`, `simplifiedInvoice` |
| **Kategorie** | Rechtsbegriff / Sonderform |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Vereinfachte Form der Rechnung für Gesamtbeträge **bis einschließlich 250 € brutto** (Entgelt + USt). Die Kleinbetragsrechnung bedarf eines reduzierten Pflichtangaben-Katalogs nach § 33 UStDV und ermöglicht dem Empfänger dennoch den vollen Vorsteuerabzug.

**Schwellenwert:**
- **Aktuell:** 250 € brutto (inkl. USt), seit 01.01.2017 (Zweites Bürokratieentlastungsgesetz)
- **Vorher:** 150 € brutto (bis 31.12.2016)
- **Konto-Hinweis:** Der Wert bezieht sich stets auf den **Bruttobetrag**, nicht das Netto-Entgelt.

**Reduzierte Pflichtangaben (§ 33 Satz 1 UStDV):**

| Nr. | Feld | vs. § 14 Abs. 4 UStG |
|---|---|---|
| 1 | Vollständiger Name und Anschrift des **leistenden Unternehmers** | ✅ identisch |
| 2 | **Ausstellungsdatum** | ✅ identisch |
| 3 | Menge und Art der Lieferung / Umfang der sonstigen Leistung | ✅ identisch |
| 4 | **Entgelt und Steuerbetrag in einer Summe (Bruttobetrag)** | ⚠️ ersetzt Nr. 8 + 10 |
| 5 | **Steuersatz** oder Hinweis auf Steuerbefreiung | ✅ identisch |

**Entfallen (!):**
- Anschrift des **Leistungsempfängers** (Nr. 2 des § 14 Abs. 4)
- **Steuernummer / USt-IdNr** des Ausstellers (Nr. 3)
- **Rechnungsnummer** (Nr. 4)
- Separater **Netto-Entgeltbetrag** (Nr. 8 — wird durch Bruttobetrag ersetzt)
- Separat ausgewiesener **Steuerbetrag** (Nr. 10)

**Nicht anwendbar auf (§ 33 Satz 2 UStDV):**
- **Innergemeinschaftliche Lieferungen** (§ 6a UStG)
- **Fernverkäufe** (§ 3c UStG)
- **Reverse-Charge-Verfahren** (§ 13b UStG)
- → In diesen Fällen gilt immer der volle Pflichtangaben-Katalog

### Rechtsgrundlage
- **§ 33 UStDV** — Vereinfachte Rechnungserteilung für Kleinbeträge
- **§ 14 Abs. 6 Nr. 3 UStG** — Ermächtigungsgrundlage für die UStDV
- **Zweites Bürokratieentlastungsgesetz vom 30.06.2017** — Anhebung 150 € → 250 €
- **A 14.6 UStAE** — Verwaltungsauffassung zur Kleinbetragsrechnung

**Verwandte Begriffe:**
- [Rechnung (§ 14 UStG)](#1-rechnung--14-ustg) — Oberbegriff
- [Pflichtangaben (§ 14 Abs. 4 UStG)](#2-pflichtangaben-einer-rechnung--14-abs-4-ustg) — voller Katalog zum Vergleich
- [E-Rechnung](#6-e-rechnung-elektronische-rechnung) — Kleinbetragsrechnungen sind **ausgenommen** von der E-Rechnungspflicht (§ 33 Satz 4 UStDV i. V. m. Wachstumschancengesetz)
- [Vorsteuer](./04-steuer-meldungen.md#3-vorsteuer) — bleibt voll abziehbar

**Verwendung im Code:**
- `src/domain/invoice/kind.ts` — Enum-Wert `kleinbetrag` mit automatischer Erkennung ab Bruttobetrag ≤ 250 €
- `src/validators/invoiceValidator.ts` — eigener Regel-Zweig mit reduziertem Pflichtfeld-Set
- UI: Toggle "Kleinbetragsrechnung" wird **automatisch aktiviert**, wenn Brutto ≤ 250 € UND keine ig Lieferung / kein Reverse-Charge erkannt
- Warnung im UI, wenn Nutzer manuell Kleinbetrag aktiviert, obwohl Brutto > 250 € oder Ausschlussgrund vorliegt
- E-Rechnungs-Pipeline: Kleinbetragsrechnung → XRechnung/ZUGFeRD **optional** (nicht pflichtig); PDF/Papier weiterhin zulässig

**Nicht verwechseln mit:**
- **Kleinunternehmer-Rechnung (§ 19 UStG)** — Kleinunternehmer wendet weder USt-Ausweis noch § 33 UStDV an; seine Rechnung enthält keinen Steuerbetrag (Hinweis "gemäß § 19 UStG keine USt")
- **Barverkaufsrechnung** — umgangssprachlicher Begriff aus dem Einzelhandel; rechtlich ist jede Barrechnung entweder normale § 14-Rechnung oder § 33 UStDV-Kleinbetragsrechnung
- **Kassenbon** — bei Einzelhandel meist Kleinbetragsrechnung, wenn Pflichtfelder vorhanden; ansonsten **Kassenbeleg** nach KassenSichV
- **Quittung** — reine Zahlungsbestätigung, keine Rechnung i. S. v. § 14 UStG

**Anmerkungen / Edge-Cases:**
- **Grenze = brutto, nicht netto:** Verwechslung mit Netto-Grenze ist häufig und führt zu Vorsteuer-Versagung. Der Validator MUSS bei Grenzwerten (249,99 € / 250,01 €) eindeutig auf Brutto prüfen.
- **Aufteilung großer Beträge:** Ein Gesamtentgelt von z. B. 1.000 € in 5 Teil-Kleinbetragsrechnungen à 200 € ist **unzulässig** (Umgehung). BFH und Finanzverwaltung prüfen den wirtschaftlichen Zusammenhang.
- **Automatische Heuristik:** Das System soll wiederkehrende Zahlungen desselben Kunden am selben Tag, die zusammen die Grenze überschreiten, als **Warnung** (nicht Fehler) markieren.
- **E-Rechnungspflicht ab 2025:** Laut Wachstumschancengesetz und BMF-Schreiben vom 15.10.2024 sind Kleinbetragsrechnungen **ausdrücklich von der E-Rechnungspflicht ausgenommen** (§ 33 Satz 4 UStDV n. F.) — können aber freiwillig als E-Rechnung ausgestellt werden, wenn der Empfänger dies wünscht.
- **Fahrausweise** nach § 34 UStDV (Bahn, ÖPNV) sind ein **separater** Sonderfall, nicht Teil von § 33 UStDV, teilen aber den Geist der Vereinfachung.

---

## 4. Gutschrift (§ 14 Abs. 2 UStG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Gutschrift (im umsatzsteuerlichen Sinne) |
| **Synonyme (DE)** | Abrechnung durch den Leistungsempfänger, Self-Billing (Anglizismus, im Code vorkommend), kaufmännische Gutschrift **NICHT** Synonym (siehe „Nicht verwechseln"!) |
| **Arabisch** | الفاتورة الصادرة من المستلم بنفسه (Self-Billing) — وفق § 14 Abs. 2 UStG: حالة استثنائية يُصدِر فيها المشتري (مستلم الخدمة أو السلعة) بنفسه الفاتورة نيابةً عن المورد، بموافقة مسبقة بين الطرفين؛ هذا المفهوم القانوني مختلف تماماً عن «Gutschrift» بالمعنى التجاري الشائع المُشيرة إلى إلغاء أو تصحيح فاتورة صادرة سابقاً — الأخيرة هي Stornorechnung أو Rechnungskorrektur، وليست Gutschrift بالمعنى الضريبي) |
| **Englisch (Code-Kontext)** | `selfBilledInvoice`, `selfBilling` (DB-Enum-Wert) — **nicht** `creditNote` (das wäre Stornorechnung!) |
| **Kategorie** | Rechtsbegriff / Rechnungsart |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Rechnung, die **nicht vom leistenden Unternehmer**, sondern vom **Leistungsempfänger** ausgestellt wird (§ 14 Abs. 2 Satz 3 UStG). Voraussetzung ist eine **vorherige Vereinbarung** zwischen beiden Parteien. Die Gutschrift ist eine vollwertige Rechnung i. S. v. § 14 UStG, muss die Angabe **„Gutschrift"** enthalten (§ 14 Abs. 4 Satz 1 Nr. 10 UStG, eingeführt 30.06.2013 durch das Amtshilferichtlinie-Umsetzungsgesetz) und kann vom leistenden Unternehmer widersprochen werden — im Fall des Widerspruchs verliert sie ihre Eigenschaft als Rechnung.

**Gegenüberstellung — umsatzsteuerliche vs. kaufmännische Gutschrift:**

| Aspekt | Gutschrift i. S. v. § 14 Abs. 2 UStG (Self-Billing) | Kaufmännische Gutschrift / Stornorechnung |
|---|---|---|
| **Rechtsnatur** | Vollwertige Rechnung durch den Leistungsempfänger | Korrektur / Stornierung einer bereits ausgestellten Rechnung |
| **Aussteller** | Leistungsempfänger | Ursprünglicher Rechnungsaussteller |
| **Pflichtkennzeichnung** | Wort **„Gutschrift"** zwingend (§ 14 Abs. 4 Nr. 10 UStG) | **„Stornorechnung"**, **„Rechnungskorrektur"** o. ä. — **NICHT** „Gutschrift" (Verwechslungsgefahr!) |
| **USt-Wirkung** | Begründet Steuerschuld beim leistenden Unternehmer + Vorsteuerabzug beim Leistungsempfänger | Mindert USt-Schuld und ggf. Vorsteuerabzug der Parteien |
| **Vorheriger Konsens** | **Erforderlich** (§ 14 Abs. 2 Satz 3 UStG) | Nicht erforderlich |
| **Widerspruch** | Möglich → verliert Rechnungs-Eigenschaft | Nicht vorgesehen |
| **Englischer Begriff** | *self-billing invoice* | *credit note* |
| **Ordnung in diesem Glossar** | **hier (§ 14 Abs. 2 UStG)** | [Rechnungsberichtigung / Stornorechnung](#5-rechnungsberichtigung--stornorechnung) |

### Rechtsgrundlage
- **§ 14 Abs. 2 Satz 3 UStG** — Zulässigkeit der Abrechnung durch den Leistungsempfänger
- **§ 14 Abs. 4 Satz 1 Nr. 10 UStG** — Pflichtangabe „Gutschrift" (seit 30.06.2013)
- **Amtshilferichtlinie-Umsetzungsgesetz (AmtshilfeRLUmsG) vom 26.06.2013** — Einführung der Pflichtkennzeichnung
- **A 14.3 UStAE** — Verwaltungsauffassung zur Gutschrift
- **EuGH C-642/11 (Stroy trans, 2013)** — Grundsätze zur Self-Billing-Rechnung

**Verwandte Begriffe:**
- [Rechnung (§ 14 UStG)](#1-rechnung--14-ustg) — Oberbegriff
- [Pflichtangaben (§ 14 Abs. 4 UStG)](#2-pflichtangaben-einer-rechnung--14-abs-4-ustg) — zusätzliche Pflichtangabe „Gutschrift"
- [Rechnungsberichtigung / Stornorechnung](#5-rechnungsberichtigung--stornorechnung) — **anderer Begriff**, oft verwechselt
- [Vorsteuer](./04-steuer-meldungen.md#3-vorsteuer) — Vorsteuerabzug aus Self-Billing setzt korrekte Kennzeichnung voraus

**Verwendung im Code:**
- `src/domain/invoice/kind.ts`:
  ```ts
  enum InvoiceKind {
    STANDARD = 'standard',
    KLEINBETRAG = 'kleinbetrag',
    GUTSCHRIFT = 'gutschrift',     // § 14 Abs. 2 UStG — Self-Billing
    STORNO = 'storno',              // Stornorechnung — NICHT Gutschrift!
    KORREKTUR = 'korrektur',        // Rechnungsberichtigung
  }
  ```
- UI-Label auf Deutsch: „Gutschrift (Self-Billing)" — mit Tooltip, der erklärt: „Dies ist **nicht** die Stornierung einer Rechnung!"
- Validator prüft bei `kind = GUTSCHRIFT`: Kennzeichnung „Gutschrift" im Rechnungstext, USt-IdNr/Steuernr. des **leistenden** Unternehmers (nicht des Ausstellers!), vorherige Vereinbarung (als Mandanten-Stammdaten-Flag).

**Nicht verwechseln mit:**
- **Stornorechnung / Kaufmännische Gutschrift** — HÄUFIGSTE VERWECHSLUNG. Umgangssprachlich heißt eine rückgängig gemachte Rechnung oft „Gutschrift", das ist im USt-Sinne **falsch** und darf im Rechnungstext **nicht so bezeichnet** werden (§ 14c UStG-Risiko!).
- **Kredit-/Bankbuchung „Gutschrift"** — Zahlungseingang auf dem Bankkonto (Haben-Buchung), nicht steuerrechtlich.
- **Rechnungskorrektur** — auch keine Gutschrift i. S. v. § 14 Abs. 2 UStG, siehe #5.
- **Rabatt / Bonus nach Rechnungsstellung** — Entgeltminderung nach § 17 UStG, führt zu Änderung der USt-Bemessungsgrundlage, **nicht** automatisch zu einer „Gutschrift".

**Anmerkungen / Edge-Cases:**
- **Falsche Verwendung der Bezeichnung „Gutschrift":** Wenn eine **Stornorechnung** fälschlich als „Gutschrift" bezeichnet wird, droht nach § 14c UStG eine **unberechtigte Steuerschuld** des falsch benennenden Unternehmers (obwohl das BMF-Schreiben vom 25.10.2013 klarstellte, dass bei erkennbarer Korrektur-Absicht keine zusätzliche Steuerschuld entsteht). Trotzdem: saubere Bezeichnung Pflicht.
- **Widerspruchsrecht (§ 14 Abs. 2 Satz 4 UStG):** Der leistende Unternehmer kann der Gutschrift widersprechen. Wirkung: Gutschrift verliert Rechnungs-Eigenschaft; Vorsteuerabzug beim Empfänger entfällt rückwirkend. UI MUSS Widerspruchs-Workflow mit Datumsverfolgung anbieten.
- **Vorherige Vereinbarung:** Das Gesetz fordert keine Schriftform, aber aus Beweisgründen und GoBD-Sicht zwingend schriftlich (Rahmenvertrag / Auftragsbestätigung). Systemseitig als Mandanten-Beziehungs-Flag (`self_billing_agreement = true`) + Upload der Vereinbarung.
- **Branchen-Typik:** Versicherungen (Provisionsabrechnung an Makler), Verlagswesen (Tantiemen-Abrechnung), Logistik (Frachtabrechnung durch Verlader) verwenden Self-Billing häufig.
- **E-Rechnung:** Eine Gutschrift i. S. v. § 14 Abs. 2 UStG ist im strukturierten Format identisch behandelbar; das Feld `BT-3 InvoiceTypeCode` in EN 16931 kennt den Code `389` für Self-Billed Invoice.
- **Bei GoBD-kritischen Grenzfällen (insbesondere fehlende oder verspätete Vereinbarung) Steuerberater konsultieren.**

---

## 5. Rechnungsberichtigung / Stornorechnung

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Rechnungsberichtigung (formal-juristisch) / Stornorechnung (praktische Form der Komplettstornierung) |
| **Synonyme (DE)** | Rechnungskorrektur, Korrekturrechnung, Berichtigungsrechnung, kaufmännische Gutschrift (umgangssprachlich — **nicht** zu verwechseln mit [Gutschrift § 14 Abs. 2 UStG](#4-gutschrift--14-abs-2-ustg)!), Stornobuchung (rein buchhalterisch) |
| **Arabisch** | تصحيح الفاتورة أو إلغاؤها (الآلية القانونية لتعديل فاتورة صادرة مسبقاً وفق § 14 Abs. 6 UStG و § 31 Abs. 5 UStDV؛ تأتي إمّا في شكل مستند تصحيحي يُشير للفاتورة الأصلية ويُعدِّل الحقل الخاطئ — Berichtigung — أو في شكل فاتورة عكسية بمبالغ سالبة + فاتورة جديدة صحيحة — Stornorechnung — ولا يجوز تسميتها «Gutschrift» بسبب خطر § 14c UStG؛ الأصل القديم يبقى محفوظاً بلا تغيير وفق GoBD-Unveränderbarkeit) |
| **Englisch (Code-Kontext)** | `invoiceCorrection` (Berichtigung), `cancellationInvoice` / `creditNote` (Storno) — **nicht** `gutschrift` |
| **Kategorie** | Rechtsbegriff / Verfahren |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Sammlung von Verfahren, mit denen eine fehlerhafte oder zu stornierende Rechnung **korrigiert oder rückgängig gemacht** werden kann. Zwei praktische Ausprägungen:

1. **Rechnungsberichtigung (Korrekturdokument):** Ein separates Dokument, das **ausdrücklich Bezug auf die ursprüngliche Rechnung nimmt** und die fehlerhafte Angabe korrigiert. Die ursprüngliche Rechnung bleibt bestehen.
2. **Stornorechnung + Neuausstellung:** Die Ursprungsrechnung wird durch eine Rechnung mit **negativen Beträgen** vollständig neutralisiert, anschließend eine neue, korrekte Rechnung ausgestellt.

In beiden Fällen bleibt die **Ursprungsrechnung physisch unverändert** (GoBD Rz. 58 ff. — Unveränderbarkeit).

**Rechtliche Wirkung — rückwirkende Berichtigung:**
Seit EuGH C-518/14 (*Senatex*, 15.09.2016) und BMF-Schreiben vom 18.09.2020 wirkt eine Berichtigung **rückwirkend auf den ursprünglichen Voranmeldungszeitraum**, wenn die Ursprungsrechnung bereits **Mindestanforderungen** enthielt:
- Rechnungsaussteller
- Rechnungsempfänger
- Leistungsbeschreibung
- Entgelt
- Gesondert ausgewiesene USt

Fehlt eine dieser Mindestangaben, ist die Rechnung **nicht berichtigungsfähig** → Vorsteuerabzug erst im Zeitraum der korrekten Neuausstellung.

### Rechtsgrundlage
- **§ 14 Abs. 6 UStG** — Verordnungsermächtigung für Berichtigung
- **§ 31 Abs. 5 UStDV** — Durchführungsvorschrift: Berichtigung durch Bezugnahme auf Ursprungsrechnung
- **§ 17 UStG** — Änderung der Bemessungsgrundlage (bei nachträglichem Entgeltminderung/Skonto/Rabatt)
- **§ 14c UStG** — unrichtiger oder unberechtigter Steuerausweis → muss berichtigt werden
- **EuGH C-518/14 (Senatex, 15.09.2016)** — Rückwirkung der Berichtigung
- **BMF-Schreiben vom 18.09.2020** — Umsetzung der EuGH-Rechtsprechung *Senatex* in deutsches Recht (Rückwirkende Rechnungsberichtigung)
- **GoBD Rz. 58 ff.** — Unveränderbarkeit bestehender Aufzeichnungen

**Verwandte Begriffe:**
- [Rechnung (§ 14 UStG)](#1-rechnung--14-ustg) — Gegenstand der Berichtigung
- [Gutschrift (§ 14 Abs. 2 UStG)](#4-gutschrift--14-abs-2-ustg) — **nicht** Synonym! Kritische Unterscheidung
- [Pflichtangaben](#2-pflichtangaben-einer-rechnung--14-abs-4-ustg) — Gegenstand typischer Korrekturen
- [Vorsteuer](./04-steuer-meldungen.md#3-vorsteuer) — wird durch Berichtigung erhalten/wiederhergestellt
- [GoBD](./01-grundlagen.md#1-gobd) — Unveränderbarkeit des Originals zwingend

**Verwendung im Code:**
- `src/domain/invoice/` — Entitätsstatus immutable (Event-Sourcing):
  ```
  Events: InvoiceIssued → InvoiceCorrected (→ CorrectionIssued)
                        → InvoiceCancelled (→ StornoIssued → NewInvoiceIssued)
  ```
- `invoices.original_invoice_id` — Fremdschlüssel auf die korrigierte / stornierte Rechnung (Pflicht bei `kind ∈ {storno, korrektur}`)
- `invoices.correction_reason` — Freitextfeld + Dropdown (Leistungsdatum falsch / Betrag falsch / Empfänger falsch / …)
- **Nummernkreise:** Stornos und Korrekturen erhalten **eigene Rechnungsnummern**, NIEMALS wiederverwendete Nummern der Ursprungsrechnung (Lückenlosigkeit § 14 Abs. 4 Nr. 4 UStG)
- UI-Hinweis beim Stornieren: "Bezeichnung im Dokument: **'Stornorechnung'** oder **'Korrektur zur Rechnung Nr. XXX'** — **NICHT** 'Gutschrift' (§ 14c UStG-Risiko)"

**Nicht verwechseln mit:**
- **Gutschrift i. S. v. § 14 Abs. 2 UStG (Self-Billing)** — völlig anderer Begriff! Siehe #4.
- **Stornobuchung** — rein buchhalterische Operation (Soll-Haben-Tausch im Journal), nicht identisch mit Stornorechnung als Dokument
- **Entgeltminderung (§ 17 UStG)** — bei Rabatt/Skonto nach Rechnungsstellung: keine neue Rechnung notwendig, Bemessungsgrundlage ändert sich automatisch (Buchung über Erlösschmälerung)
- **Rechnungs-Änderung durch Überschreiben** — **UNZULÄSSIG** nach GoBD Rz. 58; der ursprüngliche Datensatz MUSS erhalten bleiben

**Anmerkungen / Edge-Cases:**
- **Bezeichnungsfalle:** Das Wort „Gutschrift" in einer Stornorechnung kann § 14c UStG auslösen. Das BMF hat im Schreiben 25.10.2013 eingelenkt, wenn der Korrektur-Charakter offensichtlich ist, aber die Praxis empfiehlt saubere Bezeichnung. Der Validator MUSS bei `kind = STORNO` Warnung auswerfen, wenn das Wort „Gutschrift" im Text erkannt wird.
- **Mindestangaben für Rückwirkung:** Ohne die fünf oben genannten Kernangaben → **keine** Rückwirkung der Berichtigung. Der Vorsteuerabzug wandert in den Zeitraum der korrekten Neuausstellung. UI MUSS Mandanten vor Abgabe einer UStVA auf nicht-rückwirkend-berichtigungsfähige Rechnungen hinweisen.
- **Ursprungsrechnung PDF/E-Rechnung:** Bei E-Rechnung ist das Korrekturdokument ebenfalls als E-Rechnung auszustellen — mit `BT-3 InvoiceTypeCode = 384` (Corrected Invoice) oder `381` (Credit Note / Storno).
- **Zeitliche Befristung:** Die Berichtigung ist an die **Festsetzungsverjährung** (§§ 169, 170 AO — meist 4 Jahre) gebunden. Darüber hinaus ist keine Berichtigung mit steuerlicher Wirkung mehr möglich.
- **Mehrfach-Korrektur:** Eine bereits korrigierte Rechnung kann erneut korrigiert werden, aber jede Korrektur braucht eindeutige Bezugnahme auf die jeweils **zuletzt gültige** Fassung, nicht auf das Original. Im Datenmodell: verkettete Korrekturkette.
- **Für revisionssichere Umsetzung vor Produktiv-Go Rücksprache mit Steuerberater und GoBD-Dokumentation dieser Workflows (Rz. 100 ff.).**

---

## 6. E-Rechnung (Elektronische Rechnung)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Elektronische Rechnung (gesetzlich), E-Rechnung (Kurzform, im Code und UI bevorzugt) |
| **Synonyme (DE)** | Strukturierte elektronische Rechnung, digitale Rechnung (**ungenau** — PDF-Rechnung ist keine E-Rechnung nach neuer Definition!) |
| **Arabisch** | الفاتورة الإلكترونية بالمعنى القانوني الجديد (التعريف الذي أُدخل بموجب Wachstumschancengesetz اعتباراً من 1.1.2025 في § 14 Abs. 1 Satz 3 UStG: كل فاتورة تُصدَر وتُنقَل وتُستقبَل في صيغة إلكترونية مُهيكَلة تسمح بالمعالجة الآلية، ومطابقة للمعيار الأوروبي EN 16931؛ أما ملفات PDF وصور المسح والفواتير الورقية فهي — بحسب القانون الجديد — ليست «E-Rechnung» بل «sonstige Rechnung») |
| **Englisch (Code-Kontext)** | `eInvoice`, `structuredInvoice` |
| **Kategorie** | Rechtsbegriff (neu seit 2025) / Format-Kategorie |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Nach der **neuen Legaldefinition in § 14 Abs. 1 Satz 3 UStG** (eingeführt durch das Wachstumschancengesetz vom 27.03.2024, wirksam ab 01.01.2025) ist eine E-Rechnung eine Rechnung, die:

1. in einem **strukturierten elektronischen Format** ausgestellt, übermittelt und empfangen wird,
2. eine **elektronische Verarbeitung** ermöglicht, und
3. den Anforderungen der Richtlinie **2014/55/EU** und der Norm **EN 16931** entspricht.

**Alle übrigen Rechnungsformen** — Papier, PDF, Bild-Scan, Word-Dokument — gelten nach neuer Systematik als **„sonstige Rechnung"** (§ 14 Abs. 1 Satz 4 UStG n. F.) und sind ab 1.1.2025 im B2B-Inlandsverkehr nur noch im Rahmen der [Übergangsfristen](#7-wachstumschancengesetz--b2b-rechnungspflicht-ab-2025) zulässig.

**Zulässige Formate (nach BMF-Schreiben 15.10.2024):**

| Format | Syntax | EN-16931-konform? | Hinweise |
|---|---|---|---|
| **XRechnung** (CIUS) | UBL 2.1 oder UN/CEFACT CII D16B | ✅ vollständig | Deutscher Standard, KoSIT, für B2G verpflichtend seit 2020 |
| **ZUGFeRD 2.x** Profile `EN 16931` (früher in ZUGFeRD 1.0 „Comfort" genannt) und höher | CII (eingebettet in PDF/A-3) | ✅ | Profile MINIMUM / BASIC WL / BASIC sind **nicht** konform → **keine E-Rechnung** |
| **Factur-X** (FR-Gegenstück zu ZUGFeRD) | CII im PDF/A-3 | ✅ ab Profil BASIC | interoperabel mit ZUGFeRD |
| **Peppol BIS Billing 3.0** | UBL 2.1 | ✅ | internationaler Austausch über Peppol-Netzwerk |
| **EDI-Formate** (EDIFACT, VDA, …) | proprietär | ⚠️ nur mit Zusatz-vereinbarung | zulässig bis 31.12.2027 auch ohne EN 16931, falls Empfänger zustimmt |

**Abgrenzung — was E-Rechnung nicht mehr ist:**
- **PDF ohne eingebettetes XML** → „sonstige Rechnung"
- **Eingescanntes Papier** → „sonstige Rechnung"
- **Word-, Excel- oder HTML-Rechnung** → „sonstige Rechnung"
- **Bild (JPG, PNG, TIFF)** → „sonstige Rechnung"

### Rechtsgrundlage
- **§ 14 Abs. 1 Satz 3 UStG n. F.** — Legaldefinition E-Rechnung
- **§ 14 Abs. 2 UStG n. F.** — Pflicht zur E-Rechnung im B2B-Inlandsverkehr
- **Richtlinie 2014/55/EU** — EU-Rahmen für E-Rechnung im öffentlichen Auftragswesen
- **DIN EN 16931-1, 16931-2** — semantisches Datenmodell und Syntaxen
- **Wachstumschancengesetz vom 27.03.2024** — Einführung der B2B-Pflicht
- **BMF-Schreiben vom 15.10.2024** — Verwaltungsauffassung zur Umsetzung (Az. III C 2 - S 7287-a/23/10001 :007)

**Verwandte Begriffe:**
- [Rechnung (§ 14 UStG)](#1-rechnung--14-ustg) — Oberbegriff
- [Wachstumschancengesetz](#7-wachstumschancengesetz--b2b-rechnungspflicht-ab-2025) — gesetzliche Grundlage
- [EN 16931](#8-en-16931) — zwingend einzuhaltende Norm
- [XRechnung](#9-xrechnung) — deutsches Format
- [ZUGFeRD](#10-zugferd) — hybrides Format
- [Pflichtangaben (§ 14 Abs. 4 UStG)](#2-pflichtangaben-einer-rechnung--14-abs-4-ustg) — gelten technisch weiter, abgebildet über BT-/BG-Codes der EN 16931
- [Kleinbetragsrechnung](#3-kleinbetragsrechnung--33-ustdv) — ausgenommen von der E-Rechnungspflicht
- [GoBD](./01-grundlagen.md#1-gobd) — Aufbewahrung im Originalformat zwingend (10 Jahre lesbar + maschinell auswertbar)

**Verwendung im Code:**
- `src/domain/invoice/format.ts`:
  ```ts
  enum InvoiceFormat {
    PAPER = 'paper',                 // "sonstige Rechnung"
    PDF_UNSTRUCTURED = 'pdf',        // "sonstige Rechnung"
    XRECHNUNG_UBL = 'xrechnung_ubl', // E-Rechnung
    XRECHNUNG_CII = 'xrechnung_cii', // E-Rechnung
    ZUGFERD_BASIC = 'zugferd_basic', // NICHT EN-16931-konform → "sonstige"
    ZUGFERD_EN16931 = 'zugferd_en16931', // E-Rechnung
    ZUGFERD_EXTENDED = 'zugferd_extended', // E-Rechnung
    PEPPOL_BIS_3 = 'peppol_bis_3',   // E-Rechnung
  }
  ```
- `src/infrastructure/einvoice/validator/` — XML-Schema-Validierung gegen EN 16931 + KoSIT-Validator für XRechnung
- Empfangs-Pipeline (`src/infrastructure/einvoice/inbound/`) — **ab 1.1.2025 zwingend für alle Mandanten** (Empfangspflicht ohne Übergangsfrist!)
- Archivierung: Originalformat (XML / PDF+XML) muss **10 Jahre** unveränderbar und auswertbar aufbewahrt werden (§ 14b UStG + GoBD Rz. 142 ff.)

**Nicht verwechseln mit:**
- **„Digitalisierte Rechnung"** / **„Papierrechnung eingescannt"** — das ist in GoBD-Sprache ein ersetzendes Scannen, **nicht** eine E-Rechnung
- **Elektronische Übermittlung** — E-Mail-Versand einer PDF ist **keine** E-Rechnung nach neuer Definition
- **ELSTER** — elektronische Steuererklärung an Finanzamt, nicht Rechnungsverkehr zwischen Unternehmen
- **E-Rechnung an Behörden** — umgangssprachlich für XRechnung seit 2020; die neue Pflicht ab 2025 erweitert dies auf **alle B2B-Beziehungen**

**Anmerkungen / Edge-Cases:**
- **Empfangspflicht ab 1.1.2025 — keine Übergangsfrist!** Jeder deutsche Unternehmer (auch Kleinunternehmer § 19 UStG) MUSS ab diesem Datum E-Rechnungen empfangen, öffnen und archivieren können. Die Versandpflicht hingegen hat Übergangsfristen (siehe #7).
- **„Bloßes E-Mail-Postfach genügt":** Das BMF-Schreiben vom 15.10.2024 stellt klar, dass für den Empfang ein einfaches E-Mail-Postfach ausreicht — es muss keine gesonderte Empfangsinfrastruktur sein. **Zustimmung des Empfängers ist NICHT erforderlich**, wenn der Versender zur E-Rechnung verpflichtet ist.
- **Ausnahmen von der Pflicht:**
  - Kleinbetragsrechnungen (§ 33 UStDV, ≤ 250 € brutto)
  - Fahrausweise (§ 34 UStDV)
  - Rechnungen an Endverbraucher (B2C)
  - Rechnungen an ausländische Empfänger (dort gelten lokale Regeln)
  - Steuerfreie Umsätze nach § 4 Nr. 8–29 UStG — hier ist die E-Rechnungspflicht abhängig vom konkreten Befreiungstatbestand; im Zweifel Steuerberater konsultieren
- **Integritätsanforderung (§ 14 Abs. 3 UStG):** Echtheit der Herkunft, Unversehrtheit des Inhalts und Lesbarkeit müssen während der gesamten Aufbewahrungszeit gewährleistet bleiben. Bei XML-Formaten durch Schema-Validierung und kryptografische Hashes (zusätzlich zu GoBD-Audit-Log).
- **PDF im ZUGFeRD:** Das sichtbare PDF im ZUGFeRD-Container ist **rechtlich nachrangig** gegenüber dem eingebetteten XML. Bei Widersprüchen gilt das XML (!); das System soll vor Versand beide auf Konsistenz prüfen.
- **Hinweis:** Die konkrete Liste der Ausnahmen und die Detailauslegung entwickelt sich noch. **BMF-FAQs und Folgeschreiben laufend zu überwachen.** Rücksprache mit Steuerberater bei atypischen Konstellationen ist dringend empfohlen.

---

## 7. Wachstumschancengesetz — B2B-Rechnungspflicht ab 2025

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Wachstumschancengesetz (offizielle Langform: „Gesetz zur Stärkung von Wachstumschancen, Investitionen und Innovation sowie Steuervereinfachung und Steuerfairness") |
| **Synonyme (DE)** | WtChancenG (Abkürzung), E-Rechnungspflicht (verkürzt auf den für dieses Glossar relevanten Aspekt), B2B-Rechnungspflicht |
| **Arabisch** | قانون فرص النمو الألماني (القانون الفيدرالي المؤرخ 27.03.2024، المنشور في Bundesgesetzblatt 2024 الجزء الأول، العدد 108؛ الأثر الأهم بالنسبة لبرنامج الفوترة: فرض الفاتورة الإلكترونية المُهيكَلة — E-Rechnung وفق EN 16931 — كأمر إلزامي في جميع المعاملات بين الشركات داخل ألمانيا B2B اعتباراً من 1.1.2025، مع فترات انتقالية للإرسال تمتد حتى 31.12.2027، بينما تسري إلزامية الاستقبال بدون أي فترة انتقالية) |
| **Englisch (Code-Kontext)** | — (Eigenname, im Code als Kommentar `// WtChancenG § ...` referenziert) |
| **Kategorie** | Gesetz / Einführungstatbestand |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Bundesgesetz vom **27.03.2024** (BGBl. 2024 I Nr. 108), das u. a. §§ 14, 14a UStG grundlegend reformiert und die **E-Rechnungspflicht im inländischen B2B-Verkehr** schrittweise ab 01.01.2025 einführt. Hintergrund ist die europäische Initiative „VAT in the Digital Age" (ViDA) zur Harmonisierung elektronischer Rechnungsstellung.

**Einführungs-Zeitplan (Übergangsfristen):**

| Zeitraum | Empfang (B2B-Inland) | Versand (B2B-Inland) — Bedingungen |
|---|---|---|
| **Ab 01.01.2025** | **Pflicht** — alle Unternehmer müssen E-Rechnungen empfangen können | Papier und „sonstige Rechnungen" (PDF etc.) **noch zulässig** — Zustimmung des Empfängers nicht mehr erforderlich für E-Rechnung |
| **Bis 31.12.2026** | Pflicht bleibt | „Sonstige Rechnungen" (Papier, PDF) zulässig — unabhängig vom Unternehmensumsatz |
| **01.01.2027 – 31.12.2027** | Pflicht bleibt | „Sonstige Rechnungen" **nur noch** für Unternehmer mit **Vorjahres-Gesamtumsatz ≤ 800.000 €** zulässig |
| | | **EDI-Formate** (z. B. EDIFACT) zulässig bis 31.12.2027 ohne Umsatzgrenze (wenn EN-16931-Interoperabilität gewährleistet) |
| **Ab 01.01.2028** | Pflicht bleibt | **Vollständige E-Rechnungspflicht** für alle B2B-Inlandsumsätze, keine Ausnahmen für Umsatzgröße |

**Geltungsbereich:**
- ✅ **Pflicht:** B2B-Umsätze zwischen inländischen Unternehmern (§ 14 Abs. 2 Satz 2 Nr. 1 UStG n. F.)
- ❌ **Nicht erfasst:**
  - B2C-Umsätze (Endverbraucher)
  - Rechnungen mit ausländischen Empfängern
  - Kleinbetragsrechnungen (§ 33 UStDV, ≤ 250 € brutto)
  - Fahrausweise (§ 34 UStDV)
  - Steuerfreie Umsätze nach § 4 Nr. 8–29 UStG (differenzierte Behandlung je Befreiungstatbestand)

### Rechtsgrundlage
- **Wachstumschancengesetz vom 27.03.2024**, BGBl. 2024 I Nr. 108
- **§ 14 Abs. 1, 2 UStG n. F.** — Neue Rechnungsbegriffe und Versandpflicht
- **§ 27 UStG** — Übergangsregelungen
- **BMF-Schreiben vom 15.10.2024** — Verwaltungsauffassung und FAQ-Klarstellungen (Az. III C 2 - S 7287-a/23/10001 :007)
- **EU-Richtlinie „VAT in the Digital Age" (ViDA)** — europäischer Rahmen (ECOFIN-Einigung vom 05.11.2024)

**Verwandte Begriffe:**
- [E-Rechnung](#6-e-rechnung-elektronische-rechnung) — das pflichtige Format ab 2025
- [EN 16931](#8-en-16931) — zwingend einzuhaltender Standard
- [XRechnung](#9-xrechnung) — konformes Format
- [ZUGFeRD](#10-zugferd) — konformes Format ab Profil EN 16931
- [Kleinbetragsrechnung](#3-kleinbetragsrechnung--33-ustdv) — ausgenommen
- [UStG](./04-steuer-meldungen.md#1-ustg-umsatzsteuergesetz) — das geänderte Gesetz
- [GoBD](./01-grundlagen.md#1-gobd) — Aufbewahrungsregeln gelten weiter

**Verwendung im Code:**
- `src/domain/einvoice/transitionRules.ts` — zentrale Regel-Engine, die anhand von Rechnungsdatum und Mandantenstammdaten (Vorjahresumsatz) entscheidet, ob „sonstige Rechnung" noch zulässig ist
- `src/config/legalDeadlines.ts` — Konstanten:
  ```ts
  export const E_INVOICE_RECEIVE_MANDATORY_FROM = '2025-01-01';
  export const E_INVOICE_SEND_PAPER_DEADLINE    = '2026-12-31';
  export const E_INVOICE_SMB_THRESHOLD_EUR      = 800_000;
  export const E_INVOICE_SMB_DEADLINE           = '2027-12-31';
  export const E_INVOICE_EDI_DEADLINE           = '2027-12-31';
  export const E_INVOICE_FULL_MANDATE_FROM      = '2028-01-01';
  ```
- UI-Dashboard: Warn-Banner pro Mandant ab Oktober 2026 / 2027 mit Countdown zur jeweils nächsten Stufe
- Mandantenstammdaten-Feld `vorjahresumsatz_eur` — jährliche Pflege, sonst standardmäßige Annahme: E-Rechnung zwingend (safer default)

**Nicht verwechseln mit:**
- **XRechnung-Verordnung (E-Rech-VO) des Bundes vom 2017/2020** — regelt nur **B2G** (Unternehmen → Bundesbehörden), nicht B2B
- **ViDA-Richtlinie** (EU) — übergeordneter europäischer Rahmen, der nationale Gesetze (wie das WtChancenG) inspiriert, aber nicht deckungsgleich ist
- **GoBD-Verschärfung** — parallele Anforderungen an Buchführung, nicht identisch mit Rechnungsformaten
- **ELSTER / UStVA-Meldungen** — bleiben unabhängig; die E-Rechnung ändert das **Rechnungsformat**, nicht den Meldeprozess an das Finanzamt

**Anmerkungen / Edge-Cases:**
- **Empfangspflicht ohne Übergang:** Das ist die kritischste Stelle — ein Mandant, der eine E-Rechnung nicht verarbeiten kann, haftet dennoch für die korrekte Verbuchung und den rechtzeitigen Vorsteuerabzug. Die Software MUSS ab 1.1.2025 jeden XML/ZUGFeRD-Eingang parsen, validieren und archivieren.
- **800.000 €-Schwelle:** Bezieht sich auf den **Gesamtumsatz des Vorjahres** i. S. v. **§ 19 Abs. 3 UStG** — das heißt: die Summe der vom Unternehmer bewirkten steuerbaren Umsätze abzüglich bestimmter steuerfreier Umsätze (insbesondere Hilfsumsätze). Die Berechnung erfolgt auf Basis der **Nettoentgelte**. Mandantenstammdaten-Feld `vorjahres_gesamtumsatz_eur` muss diese Definition exakt abbilden, nicht den bloßen Rohumsatz.
- **EDI-Sonderregelung:** Etablierte EDI-Austauschbeziehungen (z. B. Automotive) dürfen bis 31.12.2027 fortgeführt werden, wenn die Interoperabilität mit EN 16931 gewährleistet ist. Ab 2028: zwingend EN 16931-Format (ggf. über Konverter).
- **Kleinunternehmer (§ 19 UStG):** Sind **von der Versandpflicht befreit** (Klarstellung durch BMF 2024) — müssen aber E-Rechnungen **empfangen** können!
- **Grenzüberschreitende Fälle:** Rechnungen an EU-Unternehmer unterliegen im Versand nicht der deutschen E-Rechnungspflicht, sondern dem Recht des Empfängerstaates bzw. der künftigen ViDA-Regelung. Für den Empfang ig Rechnungen gelten deutsche Aufbewahrungspflichten.
- **Zahlreiche Details der Umsetzung (Ausnahmenkatalog, Behandlung gemischter B2B/B2C-Umsätze, Dauerrechnungen, Abschlagsrechnungen) werden durch Folge-BMF-Schreiben konkretisiert. Der Status dieser Details ist vor Produktiv-Go zwingend mit einem spezialisierten Steuerberater / Fachanwalt abzustimmen.**

---

## 8. EN 16931

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | EN 16931 (europäische Norm), vollständige deutsche Titel: DIN EN 16931-1 „Elektronische Rechnungsstellung — Teil 1: Semantisches Datenmodell der Kernelemente einer elektronischen Rechnung" |
| **Synonyme (DE)** | Europäische Rechnungsnorm, Kern-Datenmodell für E-Rechnungen |
| **Arabisch** | المعيار الأوروبي الموحّد للفاتورة الإلكترونية (مجموعة المعايير EN 16931 التي أصدرتها CEN — اللجنة الأوروبية للتقييس — سنة 2017 بتفويض من Mandate 2014/55/EU؛ تُعرِّف «نموذج البيانات الدلالي الجوهري» Semantisches Datenmodell لعناصر الفاتورة الإلكترونية — حوالي 160 عنصراً يُعرَف كلٌّ منها برمزَي Business Term — BT — وBusiness Group — BG؛ لا تفرض صيغة XML بعينها بل تقبل تركيبتَين: UBL 2.1 و UN/CEFACT CII D16B؛ كل تنسيق وطني — XRechnung الألماني، Factur-X الفرنسي، إلخ — يُشتَق منها كـ CIUS أي Core Invoice Usage Specification) |
| **Englisch (Code-Kontext)** | `EN16931`, `semanticDataModel` |
| **Kategorie** | Technische Norm / EU-Standard |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Europäische Norm, die das **semantische Datenmodell** der Kernelemente einer elektronischen Rechnung festlegt. Verabschiedet durch das Europäische Komitee für Normung (**CEN**) im Jahr 2017 im Auftrag der EU-Kommission (Mandat **M/528**), als Umsetzung der Richtlinie 2014/55/EU über elektronische Rechnungsstellung im öffentlichen Auftragswesen.

**EN 16931 definiert ausschließlich Semantik (das „Was") — nicht Syntax (das „Wie"):**
- Rund **160 Business Terms (BT)** und **Business Groups (BG)**
- Beispiele: `BT-1` Invoice Number, `BT-2` Invoice Issue Date, `BT-5` Invoice Currency Code, `BG-4` Seller (Gruppe mit Untertermen `BT-27 SellerName`, `BT-35 SellerAddressLine` etc.)

**Normen-Struktur:**

| Teil | Titel | Inhalt |
|---|---|---|
| **EN 16931-1** | Semantisches Datenmodell | Die „inhaltliche" Norm — Definition aller BT/BG |
| **EN 16931-2** | Liste der zulässigen Syntaxen | UBL 2.1 und UN/CEFACT CII D16B |
| **CEN/TS 16931-3-1** | UBL-Bindung | Wie UBL-XML die Semantik abbildet |
| **CEN/TS 16931-3-2** | CII-Bindung | Wie CII-XML die Semantik abbildet |
| **CEN/TS 16931-5** | CIUS-Methodik | Wie nationale Anpassungen (XRechnung, Factur-X) zu erstellen sind |

**Zulässige Syntaxen (EN 16931-2):**

| Syntax | Herausgeber | Verwendung in DE |
|---|---|---|
| **UBL 2.1** (Universal Business Language) | OASIS | XRechnung-Variante UBL, internationaler Standard |
| **UN/CEFACT CII D16B** (Cross Industry Invoice) | UN/CEFACT | XRechnung-Variante CII, ZUGFeRD, Factur-X |

**CIUS (Core Invoice Usage Specification):**
Nationale oder branchenspezifische **Einschränkungen/Präzisierungen** von EN 16931 — nicht Erweiterungen über die Norm hinaus. Beispiele:
- **XRechnung** (Deutschland, KoSIT)
- **Factur-X** (Frankreich)
- **Peppol BIS Billing 3.0** (international)
- **FatturaPA** (Italien — Sonderfall: weicht in Syntax ab)

### Rechtsgrundlage
- **Richtlinie 2014/55/EU** des Europäischen Parlaments — „über die elektronische Rechnungsstellung bei öffentlichen Aufträgen"
- **Mandat M/528** der EU-Kommission an CEN (2014)
- **Durchführungsbeschluss (EU) 2017/1870** — Veröffentlichung der Norm im EU-Amtsblatt
- **DIN-Umsetzung** — EN 16931 ist in Deutschland als **DIN EN 16931** übernommen
- **§ 14 Abs. 1 Satz 3 UStG n. F.** — Inlandsumsetzung durch Wachstumschancengesetz

**Verwandte Begriffe:**
- [E-Rechnung](#6-e-rechnung-elektronische-rechnung) — Oberbegriff; EN 16931 ist der Maßstab, an dem „E-Rechnung" gemessen wird
- [XRechnung](#9-xrechnung) — deutsche CIUS von EN 16931
- [ZUGFeRD](#10-zugferd) — hybride Implementierung der CII-Syntax
- [Wachstumschancengesetz](#7-wachstumschancengesetz--b2b-rechnungspflicht-ab-2025) — macht EN 16931 zum nationalen Pflichtstandard
- **Factur-X** — französisches Pendant (in diesem Glossar nicht als eigener Eintrag; siehe „Nicht verwechseln")
- **Peppol BIS Billing 3.0** — internationaler CIUS (Details: künftiger Eintrag im 08-technik-architektur.md)

**Verwendung im Code:**
- `src/infrastructure/einvoice/en16931/` — Parser/Validator/Builder
- `src/domain/invoice/en16931Mapping.ts` — Mapping zwischen internem `Invoice`-Model und BT-/BG-Struktur
  ```ts
  export const BT_1_INVOICE_NUMBER  = 'BT-1';
  export const BT_2_ISSUE_DATE      = 'BT-2';
  export const BT_5_CURRENCY_CODE   = 'BT-5';
  // ... ca. 160 Konstanten
  ```
- **Keine** eigene Implementierung der EN-16931-Kernlogik im MVP — Verwendung etablierter Open-Source-Bibliotheken empfohlen (z. B. `mustangproject` für Java / Referenz, TS-Ports werden evaluiert)
- Validierungs-Pipeline: (1) XML-Schema (UBL/CII) → (2) EN 16931 Schematron-Regeln → (3) XRechnung-CIUS-spezifische Regeln (KoSIT-Validator)

**Nicht verwechseln mit:**
- **EN 16931 selbst ist kein Format!** Sie ist ein Datenmodell. Die tatsächlich übertragenen XML-Dateien sind in UBL- oder CII-Syntax, **nicht** in „EN-16931-XML"
- **XRechnung ≠ EN 16931** — XRechnung ist eine *deutsche Ausprägung* (CIUS) der Norm, EN 16931 ist der übergeordnete Rahmen
- **ZUGFeRD ≠ EN 16931** — ZUGFeRD hat sieben Profile, nur einige (ab „EN 16931") sind konform; die Profile MINIMUM und BASIC WL sind **unterhalb** des EN-16931-Kerns
- **EN 16931 ≠ Peppol** — Peppol ist ein **Übertragungsnetzwerk** + ein CIUS, nicht die Norm selbst

**Anmerkungen / Edge-Cases:**
- **Extensions:** EN 16931 erlaubt CIUS-spezifische Extensions nur in engen Grenzen (CEN/TS 16931-5). XRechnung nutzt dies z. B. für die Leitweg-ID. Factur-X und ZUGFeRD haben eigene Extensions für den „EXTENDED"-Bereich.
- **Aktualisierungen:** Die Norm wird regelmäßig überarbeitet. Aktuelle Fassung: **EN 16931-1:2017+A1:2019**. Das Code-Modul MUSS eine klar versionierte Schema-Bibliothek pflegen und beim Erscheinen neuer Fassungen einen definierten Migrations-Prozess durchlaufen.
- **Syntax-Wahl UBL vs. CII:** XRechnung erlaubt beide; der Austausch mit ausländischen Partnern hängt von deren Präferenz ab. Im internationalen Peppol-Netz dominiert UBL, im deutschsprachigen Raum (ZUGFeRD) dominiert CII. **Beide** Implementierungen sollten im System vorhanden sein.
- **Nicht jeder EN-16931-konforme Datensatz ist automatisch eine rechtlich gültige E-Rechnung:** Zusätzlich müssen die umsatzsteuerlichen Pflichtangaben (§ 14 Abs. 4 UStG) abgedeckt sein. Der Validator muss **beide Ebenen** prüfen.
- **Terminologiestandardisierung:** BT-Nummern sind sprach- und länderübergreifend stabil — ein hervorragender Schlüssel für Logging und Fehlerdiagnose. Fehlercodes sollten **immer** die BT-Nummer zitieren (z. B. `ERR_EN16931_BT_30_MISSING_SELLER_LEGAL_ID`).

---

## 9. XRechnung

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | XRechnung |
| **Synonyme (DE)** | XRechnung-Standard, deutscher E-Rechnungs-Standard (umgangssprachlich) |
| **Arabisch** | الصيغة الألمانية الرسمية للفاتورة الإلكترونية (XRechnung هي CIUS الألمانية المستندة إلى EN 16931، تُصدرها وتُطوِّرها KoSIT — Koordinierungsstelle für IT-Standards — في مدينة بريمن؛ تنسيق XML نقي — بلا أي مرفق PDF — يستخدم تركيبة UBL 2.1 أو CII D16B؛ أصبحت إلزامية للفوترة للجهات الاتحادية الألمانية منذ 27.11.2020 وفق E-Rechnungs-Verordnung — ERechV — الفيدرالية؛ تعتمد حقل Leitweg-ID لتوجيه الفاتورة للجهة الحكومية الصحيحة) |
| **Englisch (Code-Kontext)** | `xrechnung`, `xrechnungUbl`, `xrechnungCii` |
| **Kategorie** | Technisches Format / CIUS |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die **deutsche CIUS** (Core Invoice Usage Specification) der europäischen Norm EN 16931. Festgelegt und gepflegt von der **KoSIT** (Koordinierungsstelle für IT-Standards) der Freien Hansestadt Bremen im Auftrag des IT-Planungsrats. XRechnung ist ein **reines XML-Format** — es gibt **keine** eingebettete PDF-Komponente (Abgrenzung zu ZUGFeRD).

- **Aktuelle Fassung:** XRechnung **ab Version 3.0** — die seit **01.02.2024** verbindlich anzuwendende Version ist **3.0.1**; Folgeversionen (3.0.2 ff.) werden im KoSIT-Release-Zyklus veröffentlicht.
- **Zwei Syntax-Varianten** derselben Spezifikation:
  - **XRechnung UBL** — UBL 2.1 als Syntax
  - **XRechnung CII** — UN/CEFACT CII D16B als Syntax

**Anwendungspflicht:**

| Einsatzbereich | Pflichtstatus |
|---|---|
| **B2G Bund** (Rechnungen an Bundesbehörden) | **Pflicht seit 27.11.2020** (E-RechV Bund) |
| **B2G Länder / Kommunen** | **Pflicht je nach Bundesland** — uneinheitlich, die meisten Länder haben nachgezogen |
| **B2B (seit WtChancenG)** | **Optional** (eines von mehreren zulässigen EN-16931-konformen Formaten) |

**Zentrale XRechnung-spezifische Elemente:**

| Element | Beschreibung |
|---|---|
| **Leitweg-ID** (`BT-10 Buyer reference`) | Pflicht bei Rechnungen an öffentliche Auftraggeber — eindeutige Adressierung der empfangenden Stelle |
| **Sonderzeichen-Restriktionen** | Strengere Zeichensatz-Regeln als UBL/CII-Basis |
| **Ausnahmen von EN 16931** | Wenige BT-Felder werden strenger validiert oder sind in XRechnung Pflicht, obwohl EN 16931 sie optional lässt |

**Übermittlungswege:**
- **ZRE** (Zentrale Rechnungseingangsplattform des Bundes) — für oberste Bundesbehörden
- **OZG-RE** (OZG-konforme Rechnungseingangsplattform) — für Bundesverwaltung und viele Länder
- **Peppol** — internationaler Austausch
- **E-Mail**, **Upload-Portal**, **De-Mail** — je nach Empfängerbehörde

### Rechtsgrundlage
- **E-Rechnungs-Verordnung des Bundes (E-RechV)** vom 13.10.2017 (BGBl. I S. 3555), zuletzt geändert durch Art. 1 der Verordnung vom 13.10.2020
- **E-Rechnungs-Gesetz (E-RechG)** des Bundes vom 04.04.2017 — Umsetzung Richtlinie 2014/55/EU für Bund
- **IT-Planungsrat-Beschluss 2017/22** — Auftrag zur Erarbeitung von XRechnung an KoSIT
- **Länder-Verordnungen** — teils als Landesgesetz, teils als Verwaltungsvorschrift
- **Spezifikations-Dokument „XRechnung"** — offiziell veröffentlicht unter **https://xoev.de/** (XÖV — Standardisierungsrahmenwerk unter KoSIT-Zuständigkeit); das frühere Portal xrechnung.de leitet dorthin weiter
- **§ 14 UStG n. F.** — B2B-Anwendbarkeit seit Wachstumschancengesetz

**Verwandte Begriffe:**
- [EN 16931](#8-en-16931) — übergeordnete Norm
- [E-Rechnung](#6-e-rechnung-elektronische-rechnung) — rechtlicher Rahmen ab 2025
- [ZUGFeRD](#10-zugferd) — alternatives hybrides Format; ZUGFeRD-Profil `XRECHNUNG` erlaubt XRechnung-konforme Ausgabe
- [Wachstumschancengesetz](#7-wachstumschancengesetz--b2b-rechnungspflicht-ab-2025) — erweitert XRechnung von B2G auf B2B als Option
- **KoSIT-Validator** — Referenz-Implementierung zur Konformitätsprüfung (in diesem Glossar nicht separater Eintrag)
- **Leitweg-ID** — Bestandteil der XRechnung (künftiger eigener Eintrag oder Batch 2)

**Verwendung im Code:**
- `src/infrastructure/einvoice/xrechnung/` — Builder/Parser/Validator
- `src/infrastructure/einvoice/xrechnung/validator.ts` — Einbindung des KoSIT-Validator (Kommandozeilen-Tool oder Library, `.jar`) für Konformitätsprüfung
- `src/domain/einvoice/leitwegId.ts` — Leitweg-ID-Strukturprüfung (Regex + Prüfziffer)
- UI: bei B2G-Empfänger-Flag → XRechnung erzwingen; Pflichtfeld „Leitweg-ID" im Kundenstammdatensatz aktivieren
- Syntax-Wahl (UBL vs. CII) als Mandanten-Einstellung; Default: **CII** (kompatibel mit ZUGFeRD-Profil XRECHNUNG)
- Archivierung: XML-Rohdaten im Originalformat, zusätzlich lesbare HTML-Visualisierung (via XSLT) für die UI

**Nicht verwechseln mit:**
- **ZUGFeRD** — hybrides Format (PDF/A-3 + XML); XRechnung ist rein XML ohne PDF
- **E-Rechnung (allgemein)** — Oberbegriff; XRechnung ist **eine** von mehreren zulässigen E-Rechnungs-Varianten
- **EN 16931** — die Norm ist international, XRechnung ist ihre deutsche CIUS-Ausprägung
- **ELSTER** — elektronische Steuererklärung an Finanzamt, kein Rechnungsaustausch zwischen Unternehmen
- **xrechnung.de vs. xoev.de vs. xeinkauf.de** — die offizielle Bezugsquelle für die XRechnung-Spezifikation ist **xoev.de** (KoSIT/XÖV-Rahmenwerk); xrechnung.de leitet dorthin weiter; xeinkauf.de ist die Einkaufs-Plattform des Bundes (ZRE/OZG-RE) und dient dem **Versand** an Behörden, nicht der Spezifikations-Ablage

**Anmerkungen / Edge-Cases:**
- **Syntax-Entscheidung UBL vs. CII:** Empfänger können nur eine der beiden Varianten unterstützen. Im Zweifel **CII** als Default, da kompatibel mit ZUGFeRD und im deutschen Mittelstand verbreiteter. Das System soll **beide** Varianten erzeugen können und bei Empfängerpräferenz automatisch wählen.
- **Leitweg-ID-Pflicht nur B2G:** Bei B2B-Rechnungen ist die Leitweg-ID **nicht** zwingend — das Feld `BT-10 Buyer reference` bleibt optional oder kann für interne Referenzen verwendet werden.
- **Versionswechsel:** Alte XRechnung-Versionen (< 2.0) verwenden UN/CEFACT CII, aber andere Schemata. Bei Empfang historischer Rechnungen muss der Parser rückwärtskompatibel sein.
- **KoSIT-Validator-Tools:** Sollen in CI/CD-Pipeline eingebunden werden, damit jede generierte XRechnung vor Versand automatisch getestet wird. Alternative: Online-Validator-Dienste (nicht empfohlen wegen Datenabfluss + DSGVO).
- **Visualisierung für den Menschen:** XML ist für Menschen schwer lesbar; die Spezifikation liefert offizielle XSLT-Transformationen zur Darstellung. UI-Anforderung: Vorschau der XRechnung als druckbares HTML/PDF im Mandanten-Browser.
- **Pflege-Empfehlung:** Die XRechnung-Schema-Dateien werden mit jeder Minor-Version (3.0.1 → 3.0.2 → …) aktualisiert. Das Projekt muss einen festen Release-Prozess zur Übernahme neuer KoSIT-Releases vorsehen, einschließlich Regressions-Test gegen die eigene Rechnungsgenerierung.

---

## 10. ZUGFeRD

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | ZUGFeRD |
| **Synonyme (DE)** | „Zentraler User Guide des Forums elektronische Rechnung Deutschland" (Langform, wenig verwendet), hybride E-Rechnung (funktionale Beschreibung) |
| **Arabisch** | الصيغة الهجينة الألمانية للفاتورة الإلكترونية (ZUGFeRD: ملف PDF/A-3 ظاهر للإنسان يحتوي بداخله على ملف XML مُهيكَل وفق EN 16931 باستخدام تركيبة CII؛ هذا المزج «هجين» Hybrid يجمع بين قابلية القراءة البشرية — PDF — والمعالجة الآلية — XML — في ملف واحد؛ تديره FeRD — Forum elektronische Rechnung Deutschland — بالتعاون مع الشريك الفرنسي FNFE-MPE الذي يصدر الصيغة المكافئة Factur-X المتوافقة بنيوياً مع ZUGFeRD منذ الإصدار 2.0؛ يحتوي على سبعة مستويات — Profile — متدرجة في الاكتمال، ولا تُعتبر فاتورة إلكترونية قانونية وفق § 14 UStG الجديد إلا من مستوى Profil EN 16931 — وهو المسمّى الرسمي في ZUGFeRD 2.x، والمعروف تاريخياً بـ «COMFORT» في إصدار ZUGFeRD 1.0 فقط — فما فوق) |
| **Englisch (Code-Kontext)** | `zugferd`, `hybridInvoice` |
| **Kategorie** | Technisches Format / Hybrid-Format |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Hybrides Rechnungsformat, das eine **menschenlesbare PDF/A-3-Datei** mit einem **maschinenlesbaren XML-Anhang** (CII-Syntax nach EN 16931) in **einer einzigen Datei** kombiniert. Herausgegeben vom **FeRD** (Forum elektronische Rechnung Deutschland, angesiedelt bei AWV — Arbeitsgemeinschaft für wirtschaftliche Verwaltung), in enger Kooperation mit Frankreich (FNFE-MPE) — das französische Pendant **Factur-X** ist strukturell identisch zu ZUGFeRD 2.x.

**Versionsgeschichte und Profile:**

**Aktuelle Fassung:** ZUGFeRD **2.3** (aligned mit Factur-X 1.07.2)
- Abgelöste Versionen: ZUGFeRD 1.0 (2014, veraltet, nicht EN-16931-konform), ZUGFeRD 2.0/2.1/2.2

**Sieben Profile — von minimal zu maximal:**

| Profil | Umfang | EN-16931-konform? | Rechtsstatus als E-Rechnung (§ 14 UStG n. F.) |
|---|---|---|---|
| **MINIMUM** | Reine Buchhaltungsinformation | ❌ | ❌ **keine** E-Rechnung |
| **BASIC WL** (Without Lines) | Kopfdaten, keine Positionen | ❌ | ❌ **keine** E-Rechnung |
| **BASIC** | Kopf + Positionen, eingeschränkte Teilmenge von EN 16931 | ❌ (nicht vollständig EN-16931-konform) | ❌ **keine** E-Rechnung i. S. v. § 14 UStG n. F. |
| **EN 16931** (offizielle Bezeichnung ab ZUGFeRD 2.x; in ZUGFeRD 1.0 hieß dieses Profil „COMFORT") | Vollständig EN-16931-konform | ✅ | ✅ **E-Rechnung** |
| **EXTENDED** | EN 16931 + zusätzliche Branchen-/Länderinformationen | ✅ (Obermenge) | ✅ **E-Rechnung** |
| **XRECHNUNG** | Entspricht der deutschen XRechnung-CIUS | ✅ | ✅ **E-Rechnung** (mit XRechnung-Strenge) |
| **(Factur-X-Profile sind aufeinander abgestimmt)** | — | — | — |

**Technische Struktur:**
```
ZUGFeRD-Datei (.pdf)
└── PDF/A-3 Container
    ├── Sichtbares PDF (menschenlesbar)
    └── Anhang: factur-x.xml (maschinenlesbar, CII-Syntax)
```

### Rechtsgrundlage
- **ISO 19005-3** — PDF/A-3 Archivformat mit beliebigen Dateianhängen
- **EN 16931-1 / -2** — semantisches Datenmodell + CII-Syntax
- **ZUGFeRD-Spezifikation 2.3** (FeRD, öffentlich über ferd-net.de)
- **Factur-X-Spezifikation 1.07** (FNFE-MPE) — strukturgleich
- **§ 14 Abs. 1 Satz 3 UStG n. F.** — Anerkennung als E-Rechnung ab Profil EN 16931
- **BMF-Schreiben vom 15.10.2024** (Az. III C 2 - S 7287-a/23/10001 :007) — ausdrückliche Anerkennung von ZUGFeRD ab Profil EN 16931 als zulässige E-Rechnung

**Verwandte Begriffe:**
- [EN 16931](#8-en-16931) — zugrundeliegende Norm
- [XRechnung](#9-xrechnung) — „reines" XML-Gegenstück; ZUGFeRD-Profil XRECHNUNG produziert identisches XML
- [E-Rechnung](#6-e-rechnung-elektronische-rechnung) — rechtlicher Rahmen
- [Wachstumschancengesetz](#7-wachstumschancengesetz--b2b-rechnungspflicht-ab-2025) — B2B-Pflicht
- **Factur-X** — französisches Pendant, ZUGFeRD ≥ 2.0 ist damit interoperabel (in diesem Glossar nicht separater Eintrag; Kandidat für Batch 2)
- **PDF/A-3** — Archiv-PDF mit Anhang-Fähigkeit (Kandidat für eigenen Eintrag in `08-technik-architektur.md`)

**Verwendung im Code:**
- `src/infrastructure/einvoice/zugferd/` — Builder/Parser
- Bibliothek-Kandidaten (noch zu evaluieren):
  - `mustangproject` (Java; Portierung/IPC-Bridge nötig)
  - `node-zugferd` (TypeScript; Reife zu prüfen)
- Standard-Profil für neue Rechnungen: **`EN 16931`** (maximale Rechtssicherheit, kleinster gemeinsamer Nenner)
- Für öffentliche Auftraggeber: Profil **`XRECHNUNG`**
- Für Branchen mit zusätzlichen Feldern: Profil **`EXTENDED`** (nach Absprache mit Empfänger)
- Archivierung: Die ZUGFeRD-PDF wird **unverändert** gespeichert (PDF/A-3 ist selbst-archivfähig); zusätzlich wird das eingebettete XML extrahiert und in der Datenbank strukturiert gespeichert für Auswertungen.
- Prüfpriorität bei Widerspruch: **XML > PDF** — der Validator soll vor Versand beide auf semantische Konsistenz prüfen (Beträge, Daten, Empfänger), sonst Abbruch.

**Nicht verwechseln mit:**
- **XRechnung** — reines XML, **keine** PDF-Komponente. ZUGFeRD-Profil `XRECHNUNG` erzeugt zwar XRechnung-konformes XML, verpackt es aber **zusätzlich** in ein PDF — das ist ein Unterschied in der äußeren Form.
- **Factur-X** — strukturgleich zu ZUGFeRD ≥ 2.0, aber getrennt versioniert; in der Praxis werden beide Namen oft synonym verwendet (legitim bei Profilen ab EN 16931)
- **PDF-Rechnung** (ohne eingebettetes XML) — keine E-Rechnung! Nur menschenlesbar, nicht strukturiert
- **ZUGFeRD 1.0** — veraltet, **nicht** EN-16931-konform → nach neuer Legaldefinition **keine** E-Rechnung
- **ZUGFeRD BASIC / BASIC WL / MINIMUM** — sind unterhalb der EN-16931-Schwelle → **keine** E-Rechnung i. S. v. § 14 UStG n. F.

**Anmerkungen / Edge-Cases:**
- **Profil-Falle:** Nicht jede ZUGFeRD-Datei ist eine E-Rechnung! Die Profile MINIMUM und BASIC WL erfüllen **nicht** die Anforderungen von EN 16931 und gelten ab 2025 (nach Ablauf der Übergangsfrist) als „sonstige Rechnung". Der Validator MUSS das Profil prüfen (Metadatenfeld im XML-Kopf) und bei Unterprofil Warnung erzeugen.
- **Primat des XML:** Bei Widerspruch zwischen sichtbarem PDF und eingebettetem XML gilt das **XML** als rechtlich maßgeblich. Der Pre-Send-Validator MUSS:
  - Gesamtbetrag PDF vs. XML abgleichen
  - Empfängeradresse PDF vs. XML abgleichen
  - Rechnungsnummer und Datum PDF vs. XML abgleichen
  - Bei Abweichung: **Sendung abbrechen**, Fehlerprotokoll
- **PDF/A-3 ist Pflicht — nicht PDF/A-1 oder PDF/A-2:** Nur PDF/A-3 erlaubt beliebige Dateianhänge; ältere PDF/A-Versionen tun das nicht. Generator-Bibliotheken müssen explizit PDF/A-3-konform ausgeben.
- **Größe der Datei:** Das eingebettete XML erhöht die PDF-Größe um typischerweise 10–80 KB. In Hochvolumen-Archiven (Millionen Rechnungen) ist das zu berücksichtigen (Storage-Planung in `08-technik-architektur.md`).
- **Migration ZUGFeRD 1.0 → 2.x:** Bestandsarchiv darf im alten Format verbleiben (Bestandsschutz § 14b UStG), Neurechnungen müssen mindestens ZUGFeRD 2.x Profil EN 16931 sein.
- **Profilbezeichnungen (Terminologie-Notiz):**
  - Die Bezeichnung **„COMFORT"** stammt aus ZUGFeRD **1.0** (2014) und wird dort heute noch informell verwendet.
  - In **ZUGFeRD 2.x** heißt der entsprechende Profil **offiziell „EN 16931"** — nur diese Fassung ist EN-16931-konform und damit seit 01.01.2025 eine rechtlich anerkannte E-Rechnung.
  - Das Profil **BASIC** (ZUGFeRD 2.x) ist trotz seines Namens **nicht** EN-16931-vollkonform und erfüllt **nicht** die Anforderungen an eine E-Rechnung i. S. v. § 14 UStG n. F.

---

> **Modul-Footer**
> **Nächstes Modul:** [07 · Anlagen & Inventur](./07-anlagen-inventur.md) · **Übersicht:** [INDEX.md](./INDEX.md)
> **Terminology-Sprint 1 · Modul 06 · Stand 2026-04-23**
