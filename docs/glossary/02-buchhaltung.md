# 02 · Buchhaltung — Kontenrahmen & Buchführungs-Grundstrukturen

**Inhalt:** Die operative Grundlage der Buchhaltung — von den
Methodenprinzipien (doppelte Buchführung) über Kontenrahmen (SKR03/04),
Buchungsstrukturen (Buchungssatz, Buchungsstapel, Journal, Hauptbuch)
und Abschlussmechanik (Saldo, Eröffnungs-/Schlussbilanz, Saldenvortrag,
Eröffnungs-/Abschlussbuchung) bis zu den Belegen und dem Zeitrahmen
(Wirtschaftsjahr).

Baut auf auf [01-grundlagen.md](./01-grundlagen.md) (HGB, AO, GoBD).

> **Modul-Metadaten**
> **Modul:** 02 · Buchhaltung · **Einträge:** 20 FEST · **Stand:** 2026-04-23
> **Baut auf:** [01-grundlagen.md](./01-grundlagen.md) · **Spätere Module:** 03–09 referenzieren dieses

---

## Inhaltsverzeichnis

### Batch 1 — Methodik & Basisstrukturen

1. [Doppelte Buchführung](#1-doppelte-buchführung)
2. [Soll / Haben](#2-soll--haben)
3. [Konto (Sachkonto)](#3-konto-sachkonto)
4. [Kontenrahmen](#4-kontenrahmen)
5. [SKR03](#5-skr03)
6. [SKR04](#6-skr04)
7. [Buchungssatz](#7-buchungssatz)
8. [Buchungsstapel](#8-buchungsstapel)
9. [Debitor / Kreditor](#9-debitor--kreditor)
10. [Journal (Grundbuch)](#10-journal-grundbuch)

### Batch 2 — Abschlussmechanik, Belege & Zeitrahmen

11. [Hauptbuch](#11-hauptbuch)
12. [Saldo](#12-saldo)
13. [Eröffnungsbilanz / Schlussbilanz](#13-eröffnungsbilanz--schlussbilanz)
14. [Eröffnungsbuchung / Abschlussbuchung](#14-eröffnungsbuchung--abschlussbuchung)
15. [Saldenvortrag](#15-saldenvortrag)
16. [Kontenrahmen-Klasse](#16-kontenrahmen-klasse)
17. [Beleg](#17-beleg)
18. [Belegnummer](#18-belegnummer)
19. [Geschäftsvorfall](#19-geschäftsvorfall)
20. [Wirtschaftsjahr / Geschäftsjahr](#20-wirtschaftsjahr--geschäftsjahr)

---

## 1. Doppelte Buchführung

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Doppelte Buchführung |
| **Synonyme (DE)** | Doppik (im öffentlichen Sektor), doppelte kaufmännische Buchführung |
| **Arabisch** | القيد المزدوج (نظام محاسبي يُسجَّل فيه كل حدث مالي مرتين: مرة في الجانب المدين ومرة في الجانب الدائن من حسابين مختلفين بنفس المبلغ) |
| **Englisch (Code-Kontext)** | double-entry bookkeeping (konzeptuell); im Code direkt als `soll`/`haben` abgebildet |
| **Kategorie** | Rechtsbegriff / Methodenprinzip |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Buchführungsmethode, bei der jeder Geschäftsvorfall auf zwei Konten gleichzeitig gebucht wird — einmal im Soll, einmal im Haben — mit identischem Betrag. Liefert automatisch zwei voneinander unabhängige Ergebnisse (Gewinn aus GuV, Vermögenslage aus Bilanz), die sich gegenseitig kontrollieren (Bilanzgleichung).

### Rechtsgrundlage
- § 238 Abs. 1 HGB — "Jeder Kaufmann ist verpflichtet, Bücher zu führen und in diesen seine Handelsgeschäfte und die Lage seines Vermögens nach den Grundsätzen ordnungsmäßiger Buchführung ersichtlich zu machen."
- Grundsätze ordnungsmäßiger Buchführung (GoB), als ungeschriebenes Recht durch Rechtsprechung konkretisiert
- [GoBD](./01-grundlagen.md#1-gobd) — digitale Umsetzungsvorschriften

**Verwandte Begriffe:**
- [Soll / Haben](#2-soll--haben) — die zwei Buchungsseiten
- [Buchungssatz](#7-buchungssatz) — die konkrete Abbildung eines Vorfalls
- [Konto (Sachkonto)](#3-konto-sachkonto) — Träger der Soll/Haben-Salden
- [Journal](#10-journal-grundbuch) — chronologische Sammlung der Buchungen
- [Bilanz](./05-jahresabschluss.md#2-bilanz) — Resultat der doppelten Buchführung

**Verwendung im Code:**
- Kern-Konvention im gesamten Projekt: `journal_entry_lines` hat immer gepaarte Zeilen mit `soll_konto` und `haben_konto` (Migration `0001_init.sql`)
- `src/domain/accounting/` implementiert durchgängig Soll/Haben, niemals „Betrag + Vorzeichen"
- `src/types/db.ts` → Typ `JournalEntryLine` mit expliziten `soll_konto_id` / `haben_konto_id`
- Validator: `unbalanced_entries`-View kontrolliert die Summengleichheit (Σ Soll = Σ Haben)

**Nicht verwechseln mit:**
- **Einnahmen-Überschuss-Rechnung (EÜR)** — vereinfachte Gewinnermittlung ohne doppelte Buchführung (§ 4 Abs. 3 EStG), nur für Freiberufler und Kleingewerbetreibende
- **Kameralistik** — einfache Buchführung, historisch im öffentlichen Sektor
- **Single-entry bookkeeping** — keine zweiseitige Erfassung, unzulässig für Kaufleute

**Anmerkungen / Edge-Cases:**
- harouda-app speichert **niemals** vorzeichenbehaftete Beträge. Jeder Buchungssatz produziert mindestens zwei Zeilen in `journal_entry_lines`. Das ist kein Design-Vorschlag, sondern architektonische Invariante.
- Bei komplexen Vorfällen (z. B. Splittbuchungen) können mehrere Soll-Zeilen mehreren Haben-Zeilen gegenüberstehen, solange Σ Soll = Σ Haben gilt.

---

## 2. Soll / Haben

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Soll / Haben |
| **Synonyme (DE)** | Debet / Credit (international, im deutschen Alltag selten), linke / rechte Kontoseite |
| **Arabisch** | المدين / الدائن (الجانبان المتقابلان لكل حساب محاسبي؛ المدين يقع يساراً والدائن يقع يميناً في شكل حرف T التقليدي) |
| **Englisch (Code-Kontext)** | `soll` / `haben` (nicht übersetzt im Code, um Verwechslung mit allgemeinem debit/credit zu vermeiden) |
| **Kategorie** | Fachbegriff / Datenstruktur |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die beiden Seiten eines Kontos in der [doppelten Buchführung](#1-doppelte-buchführung). "Soll" ist die linke Seite, "Haben" die rechte. Welche Seite einen Zugang oder Abgang bedeutet, hängt vom Kontentyp ab:

| Kontentyp | Zugang | Abgang |
|---|---|---|
| Aktivkonto (z. B. Bank, Kasse, Anlagen) | Soll | Haben |
| Passivkonto (z. B. Darlehen, Lieferantenverbindlichkeit) | Haben | Soll |
| Aufwandskonto (z. B. Mieten, Löhne) | Soll | Haben |
| Ertragskonto (z. B. Umsatzerlöse) | Haben | Soll |

### Rechtsgrundlage
- § 238 HGB i. V. m. GoB (ungeschriebenes Recht)
- Keine explizite Legaldefinition — etablierter Fachterminus

**Verwandte Begriffe:**
- [Doppelte Buchführung](#1-doppelte-buchführung) — Methodenprinzip
- [Buchungssatz](#7-buchungssatz) — konkrete Anwendung („Soll an Haben")
- [Konto (Sachkonto)](#3-konto-sachkonto) — Träger der Seiten
- Saldo (wird in Batch 2 definiert) — Differenz Soll − Haben

**Verwendung im Code:**
- `journal_entry_lines.soll_konto_id` und `journal_entry_lines.haben_konto_id` — direkte DB-Spalten (Migration 0001)
- Type in `src/types/db.ts`: `JournalEntryLine` mit beiden Feldern Pflicht
- Journal-Hash-Chain (`src/utils/journalChain.ts`) nimmt beide Konten in den Canonical-Input: `datum | beleg_nr | soll_konto | haben_konto | betrag | ...`
- Konto-Saldo-Berechnung in `src/domain/accounting/` summiert getrennt nach Soll und Haben, nie als „signed amount"

**Nicht verwechseln mit:**
- **Plus / Minus** — kein mathematisches Vorzeichen, sondern Kontenseite
- **Debit / Credit** (engl.) — gleiche Bedeutung, aber im deutschen Code-Kontext wird konsequent Soll/Haben verwendet
- **Einnahme / Ausgabe** — cash-flow-Begriffe, bei EÜR verwendet, nicht bei doppelter Buchführung

**Anmerkungen / Edge-Cases:**
- Die Soll/Haben-Logik ist **kontenartabhängig**, nicht absolut. Ein Zugang ist im Soll auf Aktivkonten, im Haben auf Passivkonten. Das ist die häufigste Verwechslungsquelle bei Nicht-Buchhaltern.
- Umgangssprachlich „Ich habe Soll auf dem Konto" (negativer Kontostand bei Bank) ist ein Bankbegriff und **nicht** identisch mit dem Buchhaltungs-Soll — hier beschreibt "Soll" einen Negativsaldo aus Bankkundensicht, aus Banksicht wiederum eine Forderung (Passivkonto der Bank).

---

## 3. Konto (Sachkonto)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Konto |
| **Synonyme (DE)** | Sachkonto (zur Abgrenzung von Personenkonten), Buchungskonto |
| **Arabisch** | الحساب (الوحدة الأساسية لتصنيف المعاملات المحاسبية؛ يجمع كل الحركات المتعلقة بنوع محدد من الأصول أو الخصوم أو الإيرادات أو المصروفات) |
| **Englisch (Code-Kontext)** | `account` (Tabellenname + Typ) |
| **Kategorie** | Datenobjekt / Fachbegriff |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Sammel- und Strukturierungseinheit der Buchführung. Jedes Konto hat eine Nummer (gemäß [Kontenrahmen](#4-kontenrahmen)), einen Namen, einen Typ (Aktiv/Passiv/Aufwand/Ertrag) und zwei Seiten ([Soll / Haben](#2-soll--haben)). Jede Buchung verändert den Saldo auf mindestens zwei Konten.

### Rechtsgrundlage
- § 239 Abs. 2 HGB — Grundsatz der geordneten Aufzeichnung
- GoBD Rz. 44 ff. — Belegprinzip
- Keine gesetzliche Vorschrift der konkreten Kontonummern; Kontenrahmen sind Branchen-Standards

**Verwandte Begriffe:**
- [Kontenrahmen](#4-kontenrahmen) — die Gesamtstruktur aller Konten
- [SKR03](#5-skr03) / [SKR04](#6-skr04) — konkrete Kontenrahmen-Varianten
- [Debitor / Kreditor](#9-debitor--kreditor) — Personenkonten (Unterart)
- [Journal](#10-journal-grundbuch) — zeitliche Aufzeichnung; Konten sind die sachliche Zuordnung

**Verwendung im Code:**
- Datenbank-Tabelle: `public.accounts` (Migration `0001_init.sql`)
- TypeScript-Typ: `Account` in `src/types/db.ts`
- Seed: `src/seeds/skr03Seed.ts` — 130+ Konten für SKR03 (SKR04-Seed strukturell vorbereitet, nicht aktiv)
- Pages: `src/pages/KontenPage.tsx`, `src/pages/KontoDetailPage.tsx`
- `chart_of_accounts` — alternative Benennung in Supabase (neu seit Sprint 19 für Mehrsprachigkeit vorbereitet)

**Nicht verwechseln mit:**
- **Bankkonto** — ein konkretes Bank-Girokonto; im Kontenrahmen nur eine Unterart (z. B. SKR03 1200)
- **User-Account** (Login) — hat mit Buchhaltungs-Konto nichts zu tun, außer homonymer Begriff
- **Kostenstelle / Kostenträger** — zusätzliche Dimensionen (wo/wofür), keine Konten

**Anmerkungen / Edge-Cases:**
- harouda-app unterscheidet technisch nicht zwischen Sach- und Personenkonten auf DB-Ebene — beide liegen in `accounts`, aber Personenkonten (Debitoren 10000–69999 in SKR03) werden zusätzlich über `business_partners` verknüpft (Sprint 19).
- Kontensperren (z. B. nach Festschreibung einer Periode) werden über den Festschreibungs-Service geregelt, nicht über ein Feld am Konto selbst.

---

## 4. Kontenrahmen

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Kontenrahmen |
| **Synonyme (DE)** | Standardkontenrahmen (SKR, wenn branchenneutral), Kontengliederung |
| **Arabisch** | دليل الحسابات النمطي (هيكل هرمي موحّد يحدد أرقام الحسابات ومسمياتها بشكل معياري لفرع اقتصادي معين؛ يُلزم اتباعه عملياً لضمان التوافق مع برامج المحاسبة وقواعد الضرائب الألمانية) |
| **Englisch (Code-Kontext)** | `chart of accounts`; im DB-Schema als `chart_of_accounts` gespiegelt |
| **Kategorie** | Struktur / Standard |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Hierarchisch strukturiertes Verzeichnis aller potentiellen Konten eines Unternehmens, geordnet in Kontenklassen (0–9). Legt fest, welche Nummer für welche Art von Geschäftsvorfall vergeben wird, und ermöglicht damit branchenweit vergleichbare Bilanzen und GuV. Die beiden in Deutschland dominierenden Rahmen sind [SKR03](#5-skr03) (prozessorientiert) und [SKR04](#6-skr04) (abschlussgliederungsorientiert).

### Rechtsgrundlage
- Nicht gesetzlich vorgeschrieben — de-facto-Standard durch DATEV eG und die BStBK-Arbeitskreise
- § 238 Abs. 1 HGB + GoB fordern "ordnungsmäßige" Gliederung; SKR-Konformität erfüllt diese Forderung pauschal
- Für E-Bilanz (§ 5b EStG): das Mapping auf die [Taxonomie](./04-steuer-meldungen.md#17-kern-taxonomie) muss eindeutig sein

**Verwandte Begriffe:**
- [SKR03](#5-skr03) — Handelsbetriebe, Dienstleister, kleinere Unternehmen
- [SKR04](#6-skr04) — Industrie, größere Unternehmen, abschluss-gliedernd
- [Konto (Sachkonto)](#3-konto-sachkonto) — Einzelelement
- [E-Bilanz-Taxonomie](./04-steuer-meldungen.md#17-kern-taxonomie) — Übersetzung Kontenrahmen → XBRL

**Verwendung im Code:**
- Seed-Datei `src/seeds/skr03Seed.ts` — 130+ SKR03-Konten; SKR04-Seed strukturell vorbereitet
- Kontenrahmen-Auswahl bei Mandanten-Anlage: Feld `clients.kontenrahmen` (Werte: `'SKR03'`, `'SKR04'`)
- Bilanz- und GuV-Builder (`src/domain/accounting/BalanceSheetBuilder.ts`, `GuvBuilder.ts`) mappen Konten anhand ihrer Nummer auf HGB-Gliederungspositionen
- Migration `0019_hgb_balance_sheet.sql` — Closure-Table für SKR→HGB-Bilanz-Mapping

**Nicht verwechseln mit:**
- **Kontenplan** — der tatsächlich vom einzelnen Unternehmen genutzte Auszug aus dem Kontenrahmen (individualisiert)
- **Kontenklasse** — die oberste Hierarchiestufe (0–9) innerhalb eines Kontenrahmens
- **Kontengruppe** — zweite Hierarchiestufe (z. B. 12 = „Geldkonten" in SKR03)

**Anmerkungen / Edge-Cases:**
- Ein Wechsel des Kontenrahmens (SKR03 → SKR04) ist betriebswirtschaftlich möglich, aber ein Major-Projekt: alle historischen Buchungen müssen remapped werden. harouda-app unterstützt den Wechsel aktuell nicht (TECH-DEBT).
- Branchenspezifische Kontenrahmen (z. B. IKR für Industrie nach DIN, SKR14 für Land-/Forstwirtschaft, SKR49 für Vereine) sind in harouda-app nicht implementiert.

---

## 5. SKR03

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | SKR03 |
| **Synonyme (DE)** | Standardkontenrahmen 03, Prozessgliederungsprinzip |
| **Arabisch** | دليل الحسابات النمطي رقم 03 (الدليل الأكثر انتشاراً في ألمانيا للشركات التجارية الصغيرة والمتوسطة، مبني على منطق تسلسل العمليات التجارية: المشتريات ثم المخزون ثم المبيعات) |
| **Englisch (Code-Kontext)** | `'SKR03'` (String-Literal, als Enum-Wert) |
| **Kategorie** | Konkreter Kontenrahmen / Standard |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Der in Deutschland am weitesten verbreitete Kontenrahmen, herausgegeben von der DATEV eG. Gliedert die Konten nach dem **Prozessgliederungsprinzip** (Geldfluss/Beschaffung → Produktion → Absatz). Bevorzugt von Einzelunternehmen, Personengesellschaften, Handelsbetrieben und Dienstleistern.

### Rechtsgrundlage
- DATEV-Standard, keine gesetzliche Normung
- HGB-konforme Ableitbarkeit für Bilanz + GuV durch feste Kontennummern-Bereiche

**Kontenklassen SKR03:**

| Klasse | Bereich | Inhalt |
|---|---|---|
| 0 | 0000–0999 | Anlagevermögen, Kapital |
| 1 | 1000–1999 | Finanz- und Privatkonten |
| 2 | 2000–2999 | Abgrenzung (neutrale Aufwendungen/Erträge) |
| 3 | 3000–3999 | Wareneingang, Roh-/Hilfs-/Betriebsstoffe |
| 4 | 4000–4999 | Betriebliche Aufwendungen |
| 5–6 | unbelegt / Sonderkonten | |
| 7 | 7000–7999 | unbelegt / Bestandsveränderungen |
| 8 | 8000–8999 | Erlöse |
| 9 | 9000–9999 | Vortragskonten, Statistische Konten |

**Verwandte Begriffe:**
- [Kontenrahmen](#4-kontenrahmen) — Oberbegriff
- [SKR04](#6-skr04) — Alternative nach Abschlussgliederung
- [Debitor / Kreditor](#9-debitor--kreditor) — SKR03-Personenkontenbereiche 10000–69999 (Debitoren) und 70000–99999 (Kreditoren)

**Verwendung im Code:**
- Seed: `src/seeds/skr03Seed.ts` — 130+ aktive Konten, aktiver Default
- Konstanten in `src/api/businessPartners.ts`: `DEBITOR_MIN = 10000`, `DEBITOR_MAX = 69999`
- Type-Union in `src/types/db.ts`: `Kontenrahmen = 'SKR03' | 'SKR04'`
- UStVA-Mapping-Tabelle geht von SKR03-Nummern aus

**Nicht verwechseln mit:**
- **SKR04** — anderes Gliederungsprinzip, andere Nummern für dieselben Konten
- **SKR13, SKR14, SKR49, SKR99** — branchenspezifische Varianten (Einzelhandel, Landwirtschaft, Vereine, Konzerne) — in harouda-app nicht implementiert
- **IKR** (Industriekontenrahmen) — DIN-basiert, eigene Logik, nicht DATEV

**Anmerkungen / Edge-Cases:**
- SKR03 ist im **Kleinbetrieb und Mittelstand** dominierend. Großbetriebe und Industrieunternehmen bevorzugen SKR04.
- Historische Besonderheit: SKR03 hat mehrere Kontennummern „unbesetzt" (z. B. Klasse 5–7 teilweise), was Platz für individuelle Erweiterungen lässt.

---

## 6. SKR04

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | SKR04 |
| **Synonyme (DE)** | Standardkontenrahmen 04, Abschlussgliederungsprinzip |
| **Arabisch** | دليل الحسابات النمطي رقم 04 (دليل بديل مبني على منطق عرض البنود في الحسابات الختامية مباشرة، مفضّل لدى الشركات الصناعية والكبيرة) |
| **Englisch (Code-Kontext)** | `'SKR04'` (String-Literal, als Enum-Wert) |
| **Kategorie** | Konkreter Kontenrahmen / Standard |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Der zweite große DATEV-Kontenrahmen. Gliedert Konten nach dem **Abschlussgliederungsprinzip** — die Kontennummer folgt der Reihenfolge, in der das Konto später in Bilanz oder GuV erscheint. Erleichtert damit die direkte Ableitung des Jahresabschlusses. Bevorzugt von Industrieunternehmen, Konzernen und größeren Kapitalgesellschaften.

### Rechtsgrundlage
- DATEV-Standard, keine gesetzliche Normung
- Stärker an § 266 HGB (Bilanzgliederung) und § 275 HGB (GuV-Gliederung) ausgerichtet als SKR03

**Kontenklassen SKR04:**

| Klasse | Bereich | Inhalt |
|---|---|---|
| 0 | 0000–0999 | Immaterielle Vermögensgegenstände, Sachanlagen |
| 1 | 1000–1999 | Finanzanlagen, Vorräte |
| 2 | 2000–2999 | Forderungen, Wertpapiere, Liquide Mittel |
| 3 | 3000–3999 | Eigenkapital, Rückstellungen, Verbindlichkeiten |
| 4 | 4000–4999 | Umsatzerlöse |
| 5 | 5000–5999 | Materialaufwand |
| 6 | 6000–6999 | Personalaufwand, Abschreibungen, Sonstige Aufwendungen |
| 7 | 7000–7999 | Finanzergebnis, Steuern |
| 8 | unbelegt | |
| 9 | 9000–9999 | Vortrags- und Statistische Konten |

**Verwandte Begriffe:**
- [Kontenrahmen](#4-kontenrahmen) — Oberbegriff
- [SKR03](#5-skr03) — Alternative nach Prozessgliederung
- [Bilanz](./05-jahresabschluss.md#2-bilanz) / [GuV](./05-jahresabschluss.md#3-gewinn--und-verlustrechnung-guv) — SKR04 folgt deren Gliederung direkt

**Verwendung im Code:**
- Type-Union in `src/types/db.ts`: `Kontenrahmen = 'SKR03' | 'SKR04'`
- Seed strukturell vorbereitet (`src/seeds/`), aber **nicht aktiv befüllt** (TECH-DEBT — bei erstem SKR04-Mandanten zu aktivieren)
- Bilanz-/GuV-Builder funktionieren für SKR04 grundsätzlich, aber ohne konkreten Seed nicht getestet

**Nicht verwechseln mit:**
- **SKR03** — andere Kontennummern für identische Geschäftsvorfälle
- **Umstellung von SKR03 auf SKR04** — in harouda-app nicht unterstützt, wäre Migrationsprojekt

**Anmerkungen / Edge-Cases:**
- Bei der Wahl SKR03 vs. SKR04 gibt es keine „richtige" Antwort — beides ist HGB-konform. Die Wahl folgt Unternehmensgröße, Branche und Steuerberater-Präferenz.
- Unterschiedliche Kontenrahmen zwischen Mandanten einer Kanzlei sind normal; harouda-app unterstützt das, hat aber aktuell nur den SKR03-Seed aktiv.

---

## 7. Buchungssatz

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Buchungssatz |
| **Synonyme (DE)** | Buchungszeile (bei einzeiligem Buchungssatz), Buchungstext (eigentlich nur die Erläuterung) |
| **Arabisch** | القيد المحاسبي (الصياغة المختصرة لعملية محاسبية واحدة على شكل "حساب مدين × إلى حساب دائن × بمبلغ × بتاريخ ×"، وهي الوحدة الأساسية للتسجيل في دفتر اليومية) |
| **Englisch (Code-Kontext)** | kein direktes Äquivalent; im Code zerlegt in `JournalEntry` + `JournalEntryLine` |
| **Kategorie** | Fachbegriff / Daten-Einheit |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die formalisierte Erfassung eines Geschäftsvorfalls nach dem Schema **"Soll-Konto an Haben-Konto"** mit Betrag und Beleg-Referenz. Jeder Buchungssatz verändert mindestens zwei Konten. Einfacher Buchungssatz: ein Soll-Konto gegen ein Haben-Konto. Zusammengesetzter (gesplitteter) Buchungssatz: mehrere Konten auf einer oder beiden Seiten.

**Beispiel (einfach):**
```
Bank 1200 an Forderungen aus L&L 1400   1.190,00 EUR
```
Lies: „Die Bank wird im Soll gebucht (Zugang), gegen Haben auf Forderungen (Abgang, die Forderung ist erloschen)."

### Rechtsgrundlage
- § 239 Abs. 2 HGB — Zeitgerechte, vollständige, ordnungsgemäße Aufzeichnung
- GoBD Rz. 50 — Zeitgerechtigkeit (10-Tage-Regel für laufende Geschäftsvorfälle)

**Verwandte Begriffe:**
- [Doppelte Buchführung](#1-doppelte-buchführung) — Methodengrundlage
- [Soll / Haben](#2-soll--haben) — die zwei Seiten jedes Satzes
- [Journal](#10-journal-grundbuch) — chronologische Aufzeichnung aller Sätze
- [Buchungsstapel](#8-buchungsstapel) — Gruppe von Buchungssätzen
- Beleg — Pflicht-Referenz jedes Buchungssatzes

**Verwendung im Code:**
- DB-Abbildung: **zweiteilig** — ein Eintrag pro Buchungssatz in `journal_entries` (Metadaten: Datum, Beleg-Nr, Buchungstext) + ein oder mehr Zeilen in `journal_entry_lines` (Betrag, Konten, Soll/Haben)
- Types: `JournalEntry` und `JournalEntryLine` in `src/types/db.ts`
- Erfassung: `src/pages/BelegerfassungPage.tsx`
- Hash-Chain-Input (Migration 0010): `datum | beleg_nr | soll_konto | haben_konto | betrag | beschreibung | parent_entry_id`
- Atomare Batch-Erzeugung (z. B. Lohn-Lauf): Migration `0027_journal_batch.sql` — alle Zeilen einer Quellaktion in einer Transaktion

**Nicht verwechseln mit:**
- **Buchungsstapel** — Container für viele Buchungssätze, ist DATEV-spezifisches Austauschformat
- **Buchungstext** — reiner Beschreibungstext (Feld `buchungstext` am `JournalEntry`), nicht der ganze Satz
- **Geschäftsvorfall** — das reale Ereignis; der Buchungssatz ist dessen buchhalterische Abbildung

**Anmerkungen / Edge-Cases:**
- Stornos werden nicht durch Löschung, sondern durch Gegen-Buchungssatz (Soll/Haben vertauscht) umgesetzt. Die GoBD-Unveränderbarkeit und die Hash-Chain hängen davon ab.
- Korrekturen laufen über Stornobuchung + Neuerfassung. Migration `0006_gobd_append_only.sql` erzwingt das DB-seitig.

---

## 8. Buchungsstapel

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Buchungsstapel |
| **Synonyme (DE)** | DATEV-Buchungsstapel, CSV-Buchungsstapel, ASCII-Buchungsstapel |
| **Arabisch** | حزمة قيود محاسبية (ملف منظّم بصيغة محددة يحتوي على مجموعة من القيود لنقلها بين برامج المحاسبة؛ الصيغة القياسية الألمانية هي "DATEV-Buchungsstapel" المستخدمة في تبادل البيانات مع مكاتب الاستشارة الضريبية) |
| **Englisch (Code-Kontext)** | im Code meist nur kontextuell als „DATEV export/import" |
| **Kategorie** | Austauschformat / Datei-Struktur |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Standardisiertes Datei-Format für den Austausch von Buchungssätzen zwischen Buchhaltungssoftware (typischerweise: Mandant → Steuerberater oder zwischen Systemen desselben Mandanten). Von DATEV eG definiert und de-facto-Standard in Deutschland. Eine CSV-Datei mit strengem Header-Format (Versionskennung, Kontenrahmen, Wirtschaftsjahr, DATEV-Beraternummer) und einem Datenblock mit einer Zeile pro Buchungssatz.

### Rechtsgrundlage
- Kein Gesetz; **BStBK-Empfehlung** für Kanzlei-Mandanten-Schnittstelle
- GoBD Rz. 129–134 — Anforderungen an Datenträgerüberlassung
- DATEV-Format-Spezifikation (öffentlich zugänglich, aktuelle Version 7.0 „EXTF")

**Struktur (vereinfacht):**
```
"EXTF";700;21;"Buchungsstapel";7;...;"SKR03";...
Umsatz;Soll/Haben-Kennzeichen;WKZ Umsatz;Kurs;Basisumsatz;...
1190,00;S;EUR;;;1200;1400;;"Rechnung 2026-001";...
```

Die Integrität des Stapels ist durch Header-Prüfsumme und strikte Spalten-Reihenfolge gesichert. Abweichung → Import-Fehler.

**Verwandte Begriffe:**
- [Buchungssatz](#7-buchungssatz) — Einzelelement im Stapel
- [Journal](#10-journal-grundbuch) — Ziel-Struktur nach Import
- DATEV-Schnittstelle — technische Umsetzung
- [SKR03](#5-skr03) / [SKR04](#6-skr04) — obligatorischer Header-Parameter

**Verwendung im Code:**
- Export: `src/pages/DatevExport.tsx` und zugehöriger Service in `src/domain/export/`
- Import: angedacht, derzeit nicht produktiv
- Atomare Batch-Schreibung: Migration `0027_journal_batch.sql` sichert, dass ein importierter Stapel **als Ganzes** erfolgreich oder gar nicht landet
- Kodierung: CP1252 (Windows-Latin-1) — **nicht** UTF-8 (historische DATEV-Festlegung); Kompatibilitätsfalle

**Nicht verwechseln mit:**
- **Buchungssatz** (Singular) — die einzelne Buchung
- **ZUGFeRD-Datei** — E-Rechnungs-Format, nicht Buchungsexport
- **Z3-Export** — Betriebsprüfer-Datenträgerüberlassung, anderer Use-Case
- **XBRL/E-Bilanz** — strukturierte Abschlussmeldung ans Finanzamt, kein Buchungsstapel

**Anmerkungen / Edge-Cases:**
- Der DATEV-Buchungsstapel ist Kern-Schnittstelle jeder deutschen Kanzlei. Fehlerhafte Stapel-Exporte sind der häufigste Reibungspunkt mit externen Steuerberatern.
- Die erwartete Kodierung CP1252 statt UTF-8 führt bei Umlauten zu Problemen, wenn man das Format mit modernen Tools generiert. harouda-app dokumentiert das explizit.

---

## 9. Debitor / Kreditor

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Debitor / Kreditor |
| **Synonyme (DE)** | Kunde / Lieferant (umgangssprachlich); Forderungen aus L&L / Verbindlichkeiten aus L&L (als Sachkonto-Seite) |
| **Arabisch** | المدين / الدائن كأطراف تجارية (حسابات شخصية: العملاء المدينون [Debitor] والموردون الدائنون [Kreditor]؛ تختلف عن "المدين/الدائن" كجانبي القيد) |
| **Englisch (Code-Kontext)** | `business_partner` mit `type: 'debitor' \| 'kreditor'` |
| **Kategorie** | Fachbegriff / Datenobjekt (Personenkonto) |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
- **Debitor:** Geschäftspartner, dem das Unternehmen Leistungen/Waren auf Rechnung verkauft hat — also ein **Schuldner** des Unternehmens (Forderung offen). Im SKR03 im Nummernbereich **10000–69999**.
- **Kreditor:** Geschäftspartner, von dem das Unternehmen Leistungen/Waren auf Rechnung bezogen hat — also ein **Gläubiger** des Unternehmens (Verbindlichkeit offen). Im SKR03 im Nummernbereich **70000–99999**.

Jeder Debitor/Kreditor hat ein eigenes Personenkonto, das parallel zu den Sammelkonten „Forderungen aus L&L" (SKR03 1400) bzw. „Verbindlichkeiten aus L&L" (SKR03 1600) geführt wird.

### Rechtsgrundlage
- § 240 Abs. 1 HGB — Pflicht zur Inventarisierung (inkl. offene Posten)
- § 266 Abs. 2 B.II HGB — Forderungen; § 266 Abs. 3 C HGB — Verbindlichkeiten
- § 14 UStG — Rechnungsanforderungen (inkl. USt-IdNr von Leistungsempfänger bei B2B-EU)

**Verwandte Begriffe:**
- [Konto (Sachkonto)](#3-konto-sachkonto) — Oberbegriff (Debitoren/Kreditoren sind Personenkonten)
- [SKR03](#5-skr03) — Nummernbereich-Definition
- `business_partners` — technische Tabelle (seit Migration 0035)
- [USt-IdNr](./04-steuer-meldungen.md#4-ust-idnr--umsatzsteuer-identifikationsnummer) — Pflichtattribut bei B2B-EU
- [BZSt](./04-steuer-meldungen.md#5-bzst--bundeszentralamt-für-steuern) / [VIES](./04-steuer-meldungen.md#6-vies--vat-information-exchange-system) — Prüfsysteme für USt-IdNr (Sprint 20.A.2)

**Verwendung im Code:**
- Datenbank-Tabelle: `public.business_partners` (Migration `0035_business_partners.sql`, seit Sprint 19)
- TypeScript-Typ: `BusinessPartner` + Feld `type: BusinessPartnerType` (Werte: `'debitor'`, `'kreditor'`, `'neutral'`)
- Versionierung: `business_partners_versions` mit Hash-Chain (Sprint 20.B, Migration 0039)
- Nummern-Validierung: `DEBITOR_MIN = 10000`, `DEBITOR_MAX = 69999` in `src/api/businessPartners.ts`
- Pages: `src/pages/DebitorenPage.tsx`, `src/pages/KreditorenPage.tsx`, `src/pages/partners/PartnerListPage.tsx`

**Nicht verwechseln mit:**
- **Debitor/Kreditor als Kontoseite** (Soll/Haben) — selber Wortstamm, völlig andere Bedeutung! Die Seiten heißen eigentlich Soll/Haben im Deutschen, „Debet/Credit" ist international
- **Mandant** — Kunde der **Kanzlei**; ein Debitor ist Kunde des **Mandanten** (also des Unternehmens, dessen Buchhaltung geführt wird)
- **Kreditor** ≠ **Kreditgeber** (Bank) — der Kreditor ist ein normaler Lieferant, kein Finanzierungspartner

**Anmerkungen / Edge-Cases:**
- Ein Geschäftspartner kann gleichzeitig Debitor und Kreditor sein (wenn das Unternehmen ihm Waren verkauft und gleichzeitig von ihm Leistungen bezieht). In harouda-app modelliert als zwei separate `business_partners`-Rows oder als `type: 'neutral'` + Kontext-abhängige Nutzung.
- Bei EU-B2B-Geschäften ist die Prüfung der USt-IdNr des Debitors Pflicht (§ 18e UStG, dokumentiert über `ustid_verifications` + Hash-Chain seit Sprint 20.B).

---

## 10. Journal (Grundbuch)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Journal |
| **Synonyme (DE)** | Grundbuch, Tagebuch (historisch), Journalbuch |
| **Arabisch** | دفتر اليومية (السجل المحاسبي الأولي الذي تُدوَّن فيه جميع القيود بالترتيب الزمني لوقوعها، قبل ترحيلها إلى دفتر الأستاذ العام؛ وهو الأساس القانوني لضمان الترتيب الزمني للحركات المالية) |
| **Englisch (Code-Kontext)** | `journal` (Tabellenpräfix: `journal_entries`, `journal_entry_lines`) |
| **Kategorie** | Datenstruktur / Fachbegriff |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die **chronologisch** geordnete Aufzeichnung aller Buchungssätze eines Unternehmens in der Reihenfolge ihres Entstehens. Gegenstück zum Hauptbuch (sachliche Gliederung nach Konten). Im Journal entsteht die „Zeitreihe", die GoBD-Konformität technisch prüfbar macht — Manipulationen sind durch Verkettung benachbarter Einträge (Hash-Chain) erkennbar.

### Rechtsgrundlage
- § 239 Abs. 2 HGB — „Die Eintragungen … müssen … zeitgerecht … erfolgen"
- § 146 Abs. 1 AO — Ordnungsvorschriften
- GoBD Rz. 50 (Zeitgerechtigkeit), Rz. 58 ff. (Unveränderbarkeit), Rz. 154 (Hash-Chain implizit)

**Verwandte Begriffe:**
- [Buchungssatz](#7-buchungssatz) — Einzelelement im Journal
- [Doppelte Buchführung](#1-doppelte-buchführung) — Methode, die das Journal füllt
- Festschreibung — macht Journaleinträge unveränderbar
- [Hash-Chain](./08-technik-architektur.md#7-hash-chain--audit-log) — technische Manipulationserkennung
- Hauptbuch (folgt in Batch 2) — sachliche Gegenperspektive

**Verwendung im Code:**
- Haupt-Datenbank-Tabellen: `journal_entries` + `journal_entry_lines` (Migration `0001_init.sql`)
- Hash-Chain: `entry_hash` + `prev_hash` auf `journal_entries` (Migration `0010_journal_hash_chain.sql`)
- Client-Verifier: `src/utils/journalChain.ts` → `verifyJournalChain(entries)`
- DB-Verifier: RPC `verify_journal_chain(p_company_id)` in Migration 0010
- Atomare Batch-Erzeugung: Migration `0027_journal_batch.sql` (Lohn-Lauf, CSV-Import)
- Festschreibung: Migration `0009_journal_autolock.sql` (nach UStVA-Abgabe) + `0021_gobd_festschreibung.sql` (zentraler Service)
- Integrity-Dashboard: `/admin/integrity` (Sprint 20.C.3) verifiziert die Journal-Chain als eine von vier Ketten

**Nicht verwechseln mit:**
- **Hauptbuch** — gleiche Buchungen, aber nach Konten gruppiert statt chronologisch
- **Kassenbuch** — spezielles Nebenbuch nur für Bargeldbewegungen (§ 146 Abs. 1 AO)
- **Log-Datei** / **Audit-Log** — Anwendungslogs, kein buchhalterisches Journal. harouda-app hat beides: `journal_entries` (buchhalterisch) und `audit_log` (technisch, Migration 0002/0003)

**Anmerkungen / Edge-Cases:**
- Das Journal ist die **rechtskritischste Datenstruktur** in harouda-app. Jede Veränderung vor Abschluss der Entwicklung muss mit besonderer Sorgfalt erfolgen — die Hash-Chain-Integrität darf nie durch Refactoring kompromittiert werden.
- Storno-Buchungen erzeugen **neue** Journaleinträge mit Referenz auf den ursprünglichen Eintrag (`parent_entry_id`), niemals Löschungen.
- Die Journal-Hash-Chain nutzt das **Pipe-delimited-Format** (historisch seit Sprint 10), nicht Canonical-JSON — anders als die neueren Chains aus Sprint 20.B (BPV, UV). Das bleibt als bewusste Design-Entscheidung (TECH-DEBT LOW: Konsolidierung erst, wenn wirklich nötig).

---

## 11. Hauptbuch

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Hauptbuch |
| **Synonyme (DE)** | Sachkontenbuch, Ledger (international, nicht im deutschen Code) |
| **Arabisch** | دفتر الأستاذ العام (السجل الذي تُرحَّل إليه القيود من دفتر اليومية، مُرتّبةً بحسب كل حساب على حدة لعرض رصيده في أي وقت) |
| **Englisch (Code-Kontext)** | im Projekt nicht als eigene Tabelle; implizit über `journal_entry_lines` + `accounts` via View/Query abgebildet |
| **Kategorie** | Fachbegriff / Daten-Sicht |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die **sachlich** geordnete Darstellung aller Buchungssätze, gruppiert nach Konten. Gegenstück zum chronologisch geordneten [Journal](#10-journal-grundbuch). Jedes Konto im Hauptbuch zeigt alle Soll- und Haben-Bewegungen des Kontos sowie den daraus resultierenden [Saldo](#12-saldo). Zusammen mit dem Journal erfüllt das Hauptbuch die GoB-Anforderung „sowohl zeitliche als auch sachliche Nachvollziehbarkeit".

### Rechtsgrundlage
- § 238 Abs. 1 HGB i. V. m. GoB — sachliche Ordnung der Aufzeichnungen
- § 239 Abs. 2 HGB — Ordnungsmäßigkeit
- GoBD Rz. 37 ff. — Ordnungsmäßigkeitsanforderungen

**Verwandte Begriffe:**
- [Journal](#10-journal-grundbuch) — zeitliche Aufzeichnung (Gegenperspektive)
- [Konto (Sachkonto)](#3-konto-sachkonto) — Einzelelement im Hauptbuch
- [Saldo](#12-saldo) — Ergebnis der Hauptbuch-Aggregation pro Konto
- Summen- und Saldenliste (SuSa) (wird in späterer Batch definiert) — Periodenauswertung des Hauptbuchs

**Verwendung im Code:**
- **Keine eigene Tabelle** — das Hauptbuch wird in harouda-app als **Query-Sicht** auf `journal_entry_lines` realisiert, gruppiert nach `soll_konto_id` bzw. `haben_konto_id`.
- Relevante Builder: `src/domain/accounting/AccountLedgerBuilder.ts` (falls vorhanden) bzw. ad-hoc-Queries in Konten-Detail-Pages
- Pages: `src/pages/KontoDetailPage.tsx` — zeigt effektiv die Hauptbuch-Sicht eines einzelnen Kontos
- Keine eigene Hash-Chain; die Integrität folgt aus der Journal-Chain (das Hauptbuch ist eine Ableitung, keine Datenquelle)

**Nicht verwechseln mit:**
- **Journal / Grundbuch** — gleiche Buchungen, aber chronologisch statt sachlich
- **Hauptbuch im HGB-Sinn** (= "Konten aller Mandanten einer Bank") — banken-spezifische Alt-Bedeutung, hier irrelevant
- **Nebenbuch** — spezialisierte Teil-Bücher (z. B. Kassenbuch, Debitorenbuch), die parallel zum Hauptbuch geführt werden

**Anmerkungen / Edge-Cases:**
- Bei der Architektur-Entscheidung „Hauptbuch als View vs. eigene Tabelle" wurde bewusst die View-Variante gewählt: eine redundante Tabelle wäre GoBD-Risiko (zwei Wahrheitsquellen), die View ist immer konsistent mit dem Journal.
- Historisch war das Hauptbuch ein **physisches Buch** — daher die Bezeichnung. In jedem modernen System ist es eine reine Query-Perspektive.

---

## 12. Saldo

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Saldo |
| **Synonyme (DE)** | Kontostand, Bilanzwert (kontextabhängig), Salden (Plural) |
| **Arabisch** | الرصيد (الفرق بين مجموع الجانب المدين ومجموع الجانب الدائن لحساب ما؛ يُسمّى "مديناً" إذا كان المدين أكبر، و"دائناً" إذا كان الدائن أكبر) |
| **Englisch (Code-Kontext)** | `balance` (konzeptuell); im Code häufig `saldo` oder `accountBalance` |
| **Kategorie** | Fachbegriff / Berechneter Wert |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die Differenz zwischen Soll- und Haben-Summe eines Kontos zu einem bestimmten Stichtag. Je nachdem, welche Seite überwiegt, spricht man von **Soll-Saldo** (Soll > Haben) oder **Haben-Saldo** (Haben > Soll). Der Saldo ist die Grundeinheit jeder Auswertung (Kontenblatt, SuSa, Bilanz, GuV) und muss mit dem Stichtag eindeutig datiert sein.

**Berechnung:**
```
Saldo = Σ Soll-Bewegungen − Σ Haben-Bewegungen
(Vorzeichen-Konvention: Aktiv-/Aufwandskonto positiv bei Soll-Saldo;
 Passiv-/Ertragskonto positiv bei Haben-Saldo)
```

### Rechtsgrundlage
- Kein gesetzlich definierter Begriff — etablierter Fachterminus
- Indirekt § 242 HGB — Jahresabschluss-Pflicht setzt periodisch ermittelte Salden voraus
- GoBD Rz. 50 — Zeitgerechtigkeit: Salden müssen zeitgerecht fortgeschrieben werden

**Verwandte Begriffe:**
- [Soll / Haben](#2-soll--haben) — Basis der Saldo-Berechnung
- [Hauptbuch](#11-hauptbuch) — Quelle der Einzelbewegungen
- [Saldenvortrag](#15-saldenvortrag) — Übertrag des Schluss-Saldos in neue Periode
- Summen- und Saldenliste (SuSa) — periodische Aggregation aller Salden

**Verwendung im Code:**
- Keine DB-Spalte „Saldo" — **immer berechnet**, nie gespeichert (Single-Source-of-Truth-Prinzip)
- Berechnungs-Funktionen in `src/domain/accounting/` (z. B. `computeAccountBalance(kontoId, bisDatum)`)
- `Money`-Wrapper (Decimal.js, Banker's Rounding) — alle Saldo-Berechnungen nutzen ausschließlich Decimal, niemals Float
- Verwendung: Konten-Detail-View, Bilanz-Builder, GuV-Builder, USt-VA-Berechnung

**Nicht verwechseln mit:**
- **Umsatz** — die Summe aller Bewegungen einer Seite (ohne Saldierung); Saldo ist die Differenz
- **Volumen** / **Verkehrszahlen** — Soll-Umsatz + Haben-Umsatz (Gesamtaktivität); Saldo ist die Netto-Differenz
- **Bilanzwert** — ein Saldo, der in die Bilanz eingeht; nicht jeder Saldo ist ein Bilanzwert (z. B. GuV-Konten-Salden werden ins Eigenkapital überführt, erscheinen nicht als Bilanz-Posten)

**Anmerkungen / Edge-Cases:**
- Saldo-Berechnungen müssen **stichtag-genau** sein. Ein Konto hat unendlich viele Salden — einen pro möglichem Stichtag. In Code und UI ist der Stichtag IMMER Pflichtparameter.
- **Float-Fehler** sind bei Saldo-Berechnungen unzulässig: 0,1 + 0,2 ≠ 0,3 in Float-Arithmetik. harouda-app verwendet deshalb ausschließlich Decimal.js mit 28 signifikanten Stellen.

---

## 13. Eröffnungsbilanz / Schlussbilanz

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Eröffnungsbilanz / Schlussbilanz |
| **Synonyme (DE)** | EB / SB (Abkürzungen im Kontext); "Schlussbilanz" auch "Abschlussbilanz" genannt |
| **Arabisch** | الميزانية الافتتاحية / الختامية (صورة الأصول والخصوم في أول/آخر يوم من السنة المالية؛ الختامية تصبح افتتاحية السنة التالية بموجب مبدأ "وحدة الميزانية" — Bilanzidentität) |
| **Englisch (Code-Kontext)** | im Code primär über `fiscal_years`-Tabelle + Bilanz-Builder abgedeckt |
| **Kategorie** | Fachbegriff / Abschlussdokument |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
- **Eröffnungsbilanz:** Stichtag-Bilanz zum **Anfang** eines [Wirtschaftsjahres](#20-wirtschaftsjahr--geschäftsjahr) (01.01. bei Kalenderjahr). Übernimmt per **Bilanzidentität** die Salden aus der Schlussbilanz des Vorjahres. Bei Unternehmensgründung ist die Eröffnungsbilanz die **Gründungsbilanz** — erstmalige Ermittlung aller Vermögens- und Schuldwerte.
- **Schlussbilanz:** Stichtag-Bilanz zum **Ende** eines Wirtschaftsjahres (31.12. bei Kalenderjahr). Ergebnis aller Geschäftsvorfälle des Jahres + des GuV-Ergebnisses.

**Bilanzidentität (Prinzip):**
> Die Werte der Schlussbilanz eines Jahres = die Werte der Eröffnungsbilanz des Folgejahres. Keine „Lücke" zwischen Perioden erlaubt.

### Rechtsgrundlage
- § 242 Abs. 1 HGB — Pflicht zur Aufstellung einer Eröffnungsbilanz (bei Beginn des Handelsgewerbes) und einer Schlussbilanz (zu jedem Schluss eines Geschäftsjahrs)
- § 252 Abs. 1 Nr. 1 HGB — **Grundsatz der Bilanzidentität**
- §§ 266, 268 HGB — Gliederungsvorschriften

**Verwandte Begriffe:**
- [Eröffnungsbuchung / Abschlussbuchung](#14-eröffnungsbuchung--abschlussbuchung) — die Buchungs-technische Umsetzung
- [Saldenvortrag](#15-saldenvortrag) — der Übertragungsmechanismus
- [Wirtschaftsjahr](#20-wirtschaftsjahr--geschäftsjahr) — Zeitrahmen beider Bilanzen
- Bilanz (folgt in [05-jahresabschluss.md](./05-jahresabschluss.md)) — allgemeiner Oberbegriff
- [Jahresabschluss](./05-jahresabschluss.md#1-jahresabschluss) — Schlussbilanz ist dessen Kernbestandteil

**Verwendung im Code:**
- Tabelle: `public.fiscal_years` (Migration `0030_client_rechtsform_stammdaten.sql`) — hält Wirtschaftsjahres-Metadaten inkl. Start- und Enddatum
- Bilanz-Builder: `src/domain/accounting/BalanceSheetBuilder.ts` — generiert sowohl Eröffnungs- als auch Schlussbilanz; Unterschied ist nur der Stichtag-Parameter
- Wizard-Schritt im Jahresabschluss: `src/pages/jahresabschluss/StepBausteine.tsx` — Bilanz als Pflicht-Komponente
- Validierung der Bilanzidentität: muss manuell durch Steuerberater geprüft werden; keine automatische Validierung vorhanden (TECH-DEBT-Kandidat)

**Nicht verwechseln mit:**
- **Zwischenbilanz** — unterjährige Bilanz (z. B. quartalsweise), nicht durch HGB vorgeschrieben
- **Steuerbilanz** vs. **Handelsbilanz** — gleiche Stichtage, aber unterschiedliche Bewertungsregeln (§ 5 EStG vs. § 253 HGB)
- **Übertragungsbilanz** (bei Umwandlungen) — Sonderform bei Verschmelzungen etc., in harouda-app nicht unterstützt

**Anmerkungen / Edge-Cases:**
- Bilanzidentität darf NIEMALS gebrochen werden. Bei notwendigen Korrekturen nach bereits festgeschriebener Schlussbilanz muss der Weg über **rückwirkende Berichtigung** (§ 153 AO) oder **erfolgsneutrale Korrektur im laufenden Jahr** (je nach Fall) gewählt werden, nie durch direkte Änderung der Eröffnungs-Werte.
- Bei Rumpfgeschäftsjahren (weniger als 12 Monate, z. B. bei Gründung im März) gelten dieselben Regeln, nur mit entsprechend kürzerem Zeitraum.

---

## 14. Eröffnungsbuchung / Abschlussbuchung

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Eröffnungsbuchung / Abschlussbuchung |
| **Synonyme (DE)** | EB-Buchung / SB-Buchung; Abschlussbuchung auch „Vortragsbuchung" oder „Umbuchung auf Schlussbilanzkonto" |
| **Arabisch** | قيود الافتتاح / الإقفال (قيود تقنية لا تعكس عمليات تجارية حقيقية، بل تنقل الأرصدة بين السنوات: الإقفال يُرحِّلها إلى الميزانية الختامية، والافتتاح يستعيدها من الميزانية الافتتاحية) |
| **Englisch (Code-Kontext)** | nicht direkt abgebildet; als spezielle `JournalEntry`-Varianten mit Markierung |
| **Kategorie** | Fachbegriff / Buchungstyp |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Spezielle Buchungssätze, die **technisch** den Übergang zwischen zwei Wirtschaftsjahren abbilden:

- **Abschlussbuchungen** (am Ende des Jahres): Saldieren alle Konten und übertragen deren Endstände auf die Bilanzkonten „Schlussbilanzkonto" (SBK, SKR03 9999) und „Gewinn- und Verlustkonto" (GuV, SKR03 9998). Schließen faktisch alle Konten.
- **Eröffnungsbuchungen** (am Anfang des Folgejahres): Übernehmen die Schlussbestände aus dem Eröffnungsbilanzkonto (EBK, SKR03 9000) auf die jeweiligen Sachkonten. „Öffnen" damit alle Konten.

Diese Buchungen sind **keine Geschäftsvorfälle im eigentlichen Sinn**, sondern rein buchungs-technische Operationen zur Realisierung der Bilanzidentität.

### Rechtsgrundlage
- § 242 HGB + § 252 Abs. 1 Nr. 1 HGB — Bilanzidentität erzwingt diese Technik
- Keine explizite Vorschrift zur konkreten Umsetzung — fachlich etabliert

**Verwandte Begriffe:**
- [Eröffnungsbilanz / Schlussbilanz](#13-eröffnungsbilanz--schlussbilanz) — das Ergebnis dieser Buchungen
- [Saldenvortrag](#15-saldenvortrag) — alternative/vereinfachte Technik ohne explizite EB/SB-Buchungen
- Festschreibung — nach Abschlussbuchungen wird die Periode typischerweise festgeschrieben
- Konto 9000 (EBK), Konto 9998 (GuV), Konto 9999 (SBK) — die technischen Durchlauf-Konten in SKR03

**Verwendung im Code:**
- Kein eigener Buchungstyp auf DB-Ebene — Eröffnungs- und Abschlussbuchungen sind **reguläre** `JournalEntry`-Rows, unterschieden durch:
  - Datum (31.12. des Vorjahres / 01.01. des aktuellen Jahres)
  - Buchungstext-Präfix (z. B. „EB-Buchung" / „SB-Buchung")
  - Gegenkonto 9000 / 9998 / 9999 (SKR03)
- Automation-Kandidat: `src/domain/jahresabschluss/` könnte die Erzeugung automatisieren (TECH-DEBT-Kandidat — aktuell manuelle Buchung durch Steuerberater)

**Nicht verwechseln mit:**
- **Jahresabschlussbuchungen** (im weiteren Sinn) — Bewertungs-Buchungen wie Abschreibungen, Rückstellungen, Periodenabgrenzungen — diese sind fachliche Buchungen, nicht rein technisch
- **Storno-Buchungen** — Korrektur-Buchungen; EB/SB-Buchungen sind keine Stornos
- **Umgliederung** — Verschiebung innerhalb der Periode

**Anmerkungen / Edge-Cases:**
- In der Praxis werden EB/SB-Buchungen in kleinen Kanzleien oft **übersprungen**, wenn die Buchhaltungssoftware [Saldenvortrag](#15-saldenvortrag) als Alternative bietet. Beide Techniken erfüllen die Bilanzidentität; der Unterschied ist rein organisatorisch.
- harouda-app unterstützt aktuell keine automatische EB/SB-Buchungs-Erzeugung. Wenn ein Mandant diese Technik bevorzugt, müssen die Buchungen manuell via Belegerfassung angelegt werden.

---

## 15. Saldenvortrag

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Saldenvortrag |
| **Synonyme (DE)** | Anfangsbestand (bei einzelnem Konto), Eröffnungsbestand |
| **Arabisch** | ترحيل الأرصدة (النقل الآلي لأرصدة حسابات الميزانية إلى السنة التالية دون إنشاء قيود صريحة؛ بديل عملي مختصر لقيود الافتتاح/الإقفال) |
| **Englisch (Code-Kontext)** | `balance carryforward` (konzeptuell); keine direkte Code-Entsprechung im Projekt |
| **Kategorie** | Fachbegriff / Buchungstechnik |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die Übernahme der Schluss-Salden eines Wirtschaftsjahres als Anfangs-Salden des Folgejahres **ohne** explizite [Eröffnungsbuchungen](#14-eröffnungsbuchung--abschlussbuchung). Die Software markiert die Salden technisch als „aus Vorjahr übernommen" und sie erscheinen als Anfangsbestand in den Kontenblättern des neuen Jahres. Nur Bilanzkonten werden vorgetragen; GuV-Konten starten immer bei Null (ihr Saldo fließt ins Eigenkapital).

### Rechtsgrundlage
- § 252 Abs. 1 Nr. 1 HGB — Bilanzidentität (zwingend, unabhängig von der Technik)
- Keine explizite Vorschrift zur Methode — faktisch akzeptiert bei klarer Nachvollziehbarkeit (GoBD Rz. 37 ff.)

**Verwandte Begriffe:**
- [Eröffnungsbuchung / Abschlussbuchung](#14-eröffnungsbuchung--abschlussbuchung) — die explizite Alternative
- [Eröffnungsbilanz / Schlussbilanz](#13-eröffnungsbilanz--schlussbilanz) — Quelle und Ziel der Übertragung
- [Saldo](#12-saldo) — das Übertragene
- [Wirtschaftsjahr](#20-wirtschaftsjahr--geschäftsjahr) — definiert Start- und Enddaten
- Summen- und Saldenliste (SuSa) — zeigt Anfangssalden pro Konto

**Verwendung im Code:**
- Keine explizite Implementierung — der Saldenvortrag wird als **Abfrage-Logik** realisiert: „Anfangsbestand eines Kontos für Jahr N = Saldo des Kontos zum Stichtag 31.12. von Jahr N-1"
- Der Bilanz-Builder zieht die Vorjahres-Schlusssalden bei Bedarf per Query ab, speichert sie nicht redundant
- Voraussetzung: Festschreibung des Vorjahres muss aktiv sein (sonst könnten sich Vorjahres-Werte ändern)

**Nicht verwechseln mit:**
- **Vortragskonten (SKR)** — technische Hilfskonten (EBK 9000, SBK 9999 in SKR03) für explizite EB/SB-Buchungen; Saldenvortrag kommt OHNE diese aus
- **Gewinnvortrag / Verlustvortrag** — Bilanzpositionen (§ 266 Abs. 3 A.IV HGB) im Eigenkapital, nicht der Buchungstechnik-Begriff
- **Übertrag** (unterjährig) — z. B. von einer Seite einer Kontenblatt-Seite zur nächsten; anderer Kontext

**Anmerkungen / Edge-Cases:**
- **Vorjahres-Änderung bricht Vortrag:** Wenn ein bereits festgeschriebenes Jahr nachträglich korrigiert wird (z. B. per § 153 AO Berichtigung), muss der Saldenvortrag ins Folgejahr neu ausgewertet werden. In harouda-app bedeutet das, dass die Bilanz-Builder-Queries immer live berechnen und kein Cache nötig ist.
- Beim ersten Wirtschaftsjahr eines Mandanten gibt es keinen Vortrag — die Werte stammen aus der Gründungsbilanz bzw. manueller Erfassung.

---

## 16. Kontenrahmen-Klasse

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Kontenrahmen-Klasse |
| **Synonyme (DE)** | Kontenklasse, Klasse (im Kontext eines Kontenrahmens) |
| **Arabisch** | فئة الحسابات (المستوى الأعلى في التسلسل الهرمي لدليل الحسابات؛ تُرقّم من 0 إلى 9 وتُحدِّد النوع العام للحسابات داخلها — مثل فئة 0 للأصول الثابتة في SKR03) |
| **Englisch (Code-Kontext)** | `account class` (konzeptuell); im Code als numerische Ableitung der ersten Ziffer |
| **Kategorie** | Struktur / Hierarchie-Ebene |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die **oberste Gliederungsebene** innerhalb eines [Kontenrahmens](#4-kontenrahmen) — eine einstellige Ziffer (0–9), die die Art aller darunter liegenden Konten bestimmt. Darunter folgen **Kontengruppen** (zweite Ziffer) und **Einzelkonten** (dritte + vierte Ziffer, teilweise länger bei Personenkonten). Die Klasse-Struktur von SKR03 und SKR04 ist unterschiedlich — siehe die Tabellen in den jeweiligen Einträgen.

**Beispiel SKR03:**
```
Klasse 1 = Finanz- und Privatkonten
  Gruppe 12 = Geldkonten
    Konto 1200 = Bank
    Konto 1210 = Postbank
    Konto 1000 = Kasse
```

### Rechtsgrundlage
- Kein gesetzlicher Begriff — DATEV-Struktur-Standard
- § 238 HGB + GoB erfordern „Ordnungsmäßigkeit"; Klassen-Struktur erfüllt das per Konvention

**Verwandte Begriffe:**
- [Kontenrahmen](#4-kontenrahmen) — Oberbegriff
- [SKR03](#5-skr03) / [SKR04](#6-skr04) — konkrete Klassen-Belegungen
- Kontengruppe — zweite Hierarchiestufe (eine Ebene unter Klasse)
- [Konto (Sachkonto)](#3-konto-sachkonto) — Einzelelement

**Verwendung im Code:**
- Keine explizite `account_class`-Spalte — die Klasse wird bei Bedarf aus der Kontonummer abgeleitet: `class = Math.floor(kontoNummer / 1000)` für 4-stellige SKR03/04-Konten
- Nützlich für Filterungen (z. B. „alle Aufwandskonten" = Klasse 4 in SKR03)
- In UStVA-Mapping-Logik und Bilanz-/GuV-Buildern implizit verwendet
- Seeds (`src/seeds/skr03Seed.ts`) sind intern klassen-sortiert

**Nicht verwechseln mit:**
- **Kontengruppe** — zweite Hierarchiestufe (2-stellig), z. B. „12" (Geldkonten in SKR03)
- **Kontoart** — Aktiv/Passiv/Aufwand/Ertrag, orthogonal zur Klasse (eine Klasse kann mehrere Kontoarten enthalten)
- **Kontenbereich** — z. B. „Debitorenbereich 10000–69999 in SKR03", das ist kein Klassen-Konzept, sondern ein Sonderfall-Nummernbereich

**Anmerkungen / Edge-Cases:**
- Einige SKR03-Klassen (5, 6, 7 teilweise) sind **bewusst leer oder teilbelegt**, um Raum für individuelle Mandanten-Erweiterungen zu lassen. Das ist kein Fehler.
- Bei branchenspezifischen Kontenrahmen (SKR14 Landwirtschaft etc.) weicht die Klassen-Bedeutung ab — harouda-app unterstützt nur SKR03/04 und respektiert deren Klassen-Semantik strikt.

---

## 17. Beleg

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Beleg |
| **Synonyme (DE)** | Buchungsbeleg, Originalbeleg (bei Papier), Grundlage-Dokument |
| **Arabisch** | المستند (الأساس الوثائقي الذي يُثبت وقوع العملية المحاسبية — مثل الفاتورة أو إيصال الاستلام أو كشف الحساب البنكي؛ القاعدة الذهبية الألمانية في المحاسبة: "لا قيد بدون مستند" — Keine Buchung ohne Beleg) |
| **Englisch (Code-Kontext)** | `belege` (Tabelle); voucher / receipt (konzeptuell) |
| **Kategorie** | Rechtsbegriff / Pflicht-Artefakt |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Jedes Dokument, das den Anlass und Inhalt eines Geschäftsvorfalls nachweist und damit die Grundlage für einen Buchungssatz bildet. Beispiele: Eingangsrechnung, Ausgangsrechnung, Kassenbon, Bankkontoauszug, Lohnabrechnung, Zollquittung, Leistungsnachweis. Jeder [Buchungssatz](#7-buchungssatz) MUSS einen Beleg als Referenz haben — das ist das sogenannte **Belegprinzip**.

**Das Belegprinzip (GoB-Kernsatz):**
> „Keine Buchung ohne Beleg." — GoBD Rz. 44

### Rechtsgrundlage
- § 239 Abs. 1 HGB — Jede Eintragung muss auf einen Beleg zurückgeführt werden können
- GoBD Rz. 44–49 — Belegprinzip, Belegfunktionen (Beweis-, Kontroll-, Informationsfunktion)
- § 147 AO — Aufbewahrungspflicht 10 Jahre für Belege (Buchungsbelege, Geschäftsbriefe) bzw. 6 Jahre für sonstige Handelsbriefe
- § 14 UStG — Rechnung als Spezialform des Belegs (Pflichtangaben für Vorsteuerabzug)

**Verwandte Begriffe:**
- [Buchungssatz](#7-buchungssatz) — bezieht sich zwingend auf einen Beleg
- [Belegnummer](#18-belegnummer) — eindeutige Kennung des Belegs
- [Geschäftsvorfall](#19-geschäftsvorfall) — das reale Ereignis, das der Beleg dokumentiert
- Details zur technischen Behandlung (Datei-Upload, OCR, Scannen, ZUGFeRD) in [06-belege-rechnung.md](./06-belege-rechnung.md)

**Verwendung im Code:**
- Datenbank-Tabelle: `public.belege` (Migration `0022_belege_persistence.sql`)
- TypeScript-Typ: `Beleg` in `src/types/db.ts`
- FK-Verknüpfung: `journal_entries.beleg_id` — jeder `JournalEntry` referenziert seinen Beleg
- Hochladung und OCR: `src/pages/BelegerfassungPage.tsx` (zusammen mit `tesseract.js`)
- Beleg-Archiv: `src/pages/BelegeListe.tsx` (bzw. entsprechende Page)
- Verknüpfung zu Business-Partnern: `belege.business_partner_id` (Migration `0036_belege_business_partner_link.sql`)

**Nicht verwechseln mit:**
- **Buchungstext** — die kurze textuelle Beschreibung im Buchungssatz; der Beleg ist das externe Dokument
- **E-Rechnung (XRechnung/ZUGFeRD)** — strukturiertes Rechnungsformat; ist ein Sonderfall des Belegs, aber nicht jeder Beleg ist eine E-Rechnung
- **Nachweis** (im Steuerrecht allgemein) — weiterer Begriff; jeder Beleg ist ein Nachweis, aber nicht jeder Nachweis ist ein Buchungsbeleg

**Anmerkungen / Edge-Cases:**
- Bei ausschließlich elektronischen Belegen (Scan oder originär digital) gilt die Pflicht der **revisionssicheren Archivierung** (§ 147 AO + GoBD Rz. 119 ff.) — harouda-app adressiert das über die unveränderbaren Belegdatei-Uploads in Supabase Storage und die Hash-Chain über den zugehörigen Buchungseintrag.
- **Ersatzbelege** (bei verlorenem Originalbeleg) sind rechtlich zulässig, aber nur unter strengen Voraussetzungen — das ist ein Fachthema für den Steuerberater, nicht für die Software.

---

## 18. Belegnummer

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Belegnummer |
| **Synonyme (DE)** | Beleg-ID (technisch), Dokumentennummer, BelegNr (Abkürzung im UI) |
| **Arabisch** | رقم المستند (المعرِّف الفريد لكل مستند داخل النظام المحاسبي؛ يجب أن يكون متسلسلاً ومنتظماً لضمان اكتمال السجلات وإمكانية التتبع، ويُعتبر عنصراً جوهرياً في فحص المراجعة الضريبية) |
| **Englisch (Code-Kontext)** | `beleg_nr` (Spalte) |
| **Kategorie** | Datentyp / Eindeutigkeitsmerkmal |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Eindeutiger Identifikator eines [Belegs](#17-beleg) innerhalb eines Mandanten (bzw. Wirtschaftsjahres). Muss **lückenlos** (oder mit dokumentierter Lückengrund, z. B. Storno) und **chronologisch** vergeben werden, um die Vollständigkeit der Buchführung nachzuweisen. Formatfreiheit ist gesetzlich gegeben, aber in der Praxis folgen Belegnummern Schema-Konventionen wie `YYYY-NNNN` oder `ER-YYYY-NNNN` (Eingangsrechnungen) / `AR-YYYY-NNNN` (Ausgangsrechnungen).

### Rechtsgrundlage
- § 239 Abs. 2 HGB — fortlaufende, geordnete Aufzeichnung
- GoBD Rz. 45, Rz. 47 — Vollständigkeit, Richtigkeit, Ordnung
- § 14 Abs. 4 Nr. 4 UStG — Rechnungsnummer als Pflichtangabe (einmalige Nummer, die sich vom Rechnungssteller fortlaufend und eindeutig vergibt)

**Verwandte Begriffe:**
- [Beleg](#17-beleg) — Träger der Belegnummer
- [Buchungssatz](#7-buchungssatz) — referenziert die Belegnummer
- Nummernkreis — der Bereich, aus dem Belegnummern vergeben werden (z. B. Eingangsrechnungen vs. Ausgangsrechnungen separate Kreise)

**Verwendung im Code:**
- Spalte: `journal_entries.beleg_nr` (Migration `0001_init.sql`) und `belege.beleg_nr` (Migration `0022`)
- Teil des Hash-Chain-Inputs der Journal-Chain — Veränderung einer Belegnummer bricht die Kette
- Aktuell **nicht konfigurierbar** — Vergabe erfolgt manuell oder nach festem Schema im UI
- **Offenes TECH-DEBT-Ticket:** `docs/tech-debt/` (bzw. Sprint-19-Verzeichnis) — `NUMMERN-RANGE-CONFIG` (Priorität MEDIUM) — dokumentiert die fehlende Möglichkeit, Nummernkreise pro Mandant konfigurierbar zu gestalten (z. B. eigener Präfix, separate Ränge für ER/AR/Gutschrift). Im Sprint 21+ geplant.

**Nicht verwechseln mit:**
- **Rechnungsnummer** — eine Belegnummer, die auf einer Ausgangsrechnung vergeben wird; Pflichtfeld nach § 14 UStG. Jede Rechnungsnummer ist eine Belegnummer, aber nicht jede Belegnummer ist eine Rechnungsnummer (z. B. Kassenbon-Nr.)
- **Buchungsnummer** — die laufende Nummer des Eintrags im Journal (`journal_entry.id` bzw. `journal_entry.running_number`), nicht die Belegnummer
- **USt-IdNr / Steuernummer** — ganz anderer Kontext (Identifikation des Unternehmens, nicht des Dokuments)

**Anmerkungen / Edge-Cases:**
- **Lückenhafte Belegnummern** sind ein häufiger Befund bei Betriebsprüfungen. Jede Lücke muss erklärbar sein (Storno, Testbuchung, etc.). harouda-app zeigt keine automatische Lücken-Warnung (TECH-DEBT-Kandidat).
- Bei sehr kleinen Mandanten darf auf Belegnummern verzichtet werden, wenn die Belege lückenlos in zeitlicher Reihenfolge abgelegt sind (pragmatische Praxis, rechtlich grenzwertig).
- Die Unveränderbarkeit der Belegnummer ist durch die Hash-Chain des Journals (Migration 0010) technisch gesichert.

---

## 19. Geschäftsvorfall

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Geschäftsvorfall |
| **Synonyme (DE)** | Geschäftsfall, Vorfall (im Kontext), Transaktion (umgangssprachlich, aber irreführend) |
| **Arabisch** | العملية المحاسبية (الحدث الاقتصادي الواقعي الذي يؤثر على ممتلكات الشركة أو ديونها — مثل شراء بضاعة أو استلام دفعة من عميل؛ كل عملية محاسبية تُترجَم لاحقاً إلى قيد محاسبي واحد أو أكثر) |
| **Englisch (Code-Kontext)** | kein direkter Begriff; im Code „business transaction" oder einfach „entry"-Anlass |
| **Kategorie** | Fachbegriff / Abstrakter Auslöser |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Das **reale wirtschaftliche Ereignis**, das zu einer Vermögens-, Schulden- oder Ergebnis-Änderung eines Unternehmens führt und buchhalterisch erfasst werden muss. Jeder Geschäftsvorfall wird durch mindestens einen [Beleg](#17-beleg) dokumentiert und in einem oder mehreren [Buchungssätzen](#7-buchungssatz) abgebildet. Beispiele: Verkauf einer Ware, Zahlungseingang, Abschreibung eines Anlageguts, Gehaltszahlung, Mieteingang.

**Abgrenzungstriade:**
```
Geschäftsvorfall (reales Ereignis)
    ↓ wird dokumentiert durch
Beleg (Nachweisdokument)
    ↓ wird gebucht als
Buchungssatz (formale Aufzeichnung)
```

### Rechtsgrundlage
- § 238 Abs. 1 HGB — Pflicht zur Aufzeichnung „seiner Handelsgeschäfte" = Geschäftsvorfälle
- § 239 Abs. 2 HGB — Vollständigkeitsgebot (alle Geschäftsvorfälle, nicht nur ausgewählte)
- GoBD Rz. 37, Rz. 46 — Vollständigkeit und Wahrheit

**Verwandte Begriffe:**
- [Buchungssatz](#7-buchungssatz) — die buchhalterische Abbildung
- [Beleg](#17-beleg) — der dokumentarische Nachweis
- [Journal](#10-journal-grundbuch) — die chronologische Sammlung der gebuchten Vorfälle
- Zeitgerechtigkeit (GoBD Rz. 50) — 10-Tage-Regel für die Erfassung

**Verwendung im Code:**
- Kein eigener Typ — der Geschäftsvorfall ist ein **konzeptueller Begriff**, der in der Software implizit als Trio (Beleg-Row + JournalEntry-Row + BelegDatei) abgebildet ist.
- Relevante Startpunkte: `src/pages/BelegerfassungPage.tsx` (manuelle Erfassung), OCR-Pipeline (automatisierte Erfassung), Lohn-Lauf (automatisierte Mass-Erfassung durch `src/domain/lohn/LohnabrechnungsEngine.ts`), Bank-Reconciliation (`src/pages/BankReconciliationPage.tsx`).

**Nicht verwechseln mit:**
- **Buchungssatz** — dieser ist die Abbildung eines Geschäftsvorfalls, nicht der Geschäftsvorfall selbst
- **Beleg** — dies ist der Nachweis eines Geschäftsvorfalls, nicht der Vorfall selbst
- **Transaktion** (DB-Sinn) — eine DB-Transaktion kann mehrere Geschäftsvorfälle atomar schreiben (z. B. Lohn-Lauf in Migration 0027), aber die beiden Begriffe sind unterschiedliche Ebenen

**Anmerkungen / Edge-Cases:**
- Ein **einziger** Geschäftsvorfall kann **mehrere** Buchungssätze erfordern (z. B. Kauf einer Anlage mit Vorsteuer → Satz 1 für Anschaffungswert, Satz 2 für Vorsteuer; oder Gehaltszahlung → 7 Buchungssätze für Brutto, Steuern, SV-Beiträge).
- Die **Zeitgerechtigkeit** (GoBD Rz. 50) verlangt, dass unbare Geschäftsvorfälle innerhalb von **10 Tagen** gebucht werden, bare Geschäftsvorfälle sogar **täglich**. harouda-app erzwingt diese Regel nicht technisch — sie ist Teil der Verfahrensdokumentation.

---

## 20. Wirtschaftsjahr / Geschäftsjahr

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Wirtschaftsjahr |
| **Synonyme (DE)** | Geschäftsjahr (HGB-Begriff, synonym verwendet), Fiskaljahr (selten, englisch-inspiriert), Rumpfwirtschaftsjahr (Sonderfall) |
| **Arabisch** | السنة المالية (الفترة المحاسبية التي يُحدِّد خلالها الربح والخسارة وتُعدّ لها الميزانية؛ عادةً 12 شهراً، ويمكن أن تنطبق مع السنة الميلادية [Kalenderjahr] أو تنحرف عنها [abweichendes Wirtschaftsjahr] مثل 01.07–30.06) |
| **Englisch (Code-Kontext)** | `fiscal_year` (Tabellenname + Typ) |
| **Kategorie** | Fachbegriff / Zeitrahmen |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Der **Zeitraum**, für den ein Unternehmen seinen [Jahresabschluss](./05-jahresabschluss.md#1-jahresabschluss) aufstellt und die Steuerveranlagung vornimmt. Regelfall: 12 Monate, beginnend am 01.01. und endend am 31.12. (= **Kalenderjahr**). Abweichungen sind zulässig, müssen aber bei der Finanzverwaltung beantragt werden (**abweichendes Wirtschaftsjahr**, typisch bei Saisongeschäften: z. B. 01.07.–30.06. bei Landwirtschaft).

**Sonderfall Rumpfwirtschaftsjahr:**
Ein Wirtschaftsjahr von weniger als 12 Monaten, entsteht bei Gründung, Liquidation, Umstellung oder Wirtschaftsjahr-Wechsel.

### Rechtsgrundlage
- **Handelsrecht:** § 240 Abs. 2 HGB — „Für den Schluss eines jeden Geschäftsjahrs …", § 242 Abs. 1 HGB — Schlussbilanz-Pflicht am Geschäftsjahres-Ende
- **Steuerrecht:** § 4a EStG — Gewinnermittlung nach Wirtschaftsjahr; Kalenderjahr ist Regelfall, Abweichungen erfordern Zustimmung des Finanzamts (§ 4a Abs. 1 Nr. 3 EStG)
- § 7 Abs. 4 Satz 3 KStG — Wirtschaftsjahr-Regelungen für Kapitalgesellschaften

**Verwandte Begriffe:**
- [Eröffnungsbilanz / Schlussbilanz](#13-eröffnungsbilanz--schlussbilanz) — begrenzen das Wirtschaftsjahr
- [Saldenvortrag](#15-saldenvortrag) — Übergang zwischen zwei Wirtschaftsjahren
- [Jahresabschluss](./05-jahresabschluss.md#1-jahresabschluss) — wird für jedes Wirtschaftsjahr erstellt
- Festschreibung — nach Jahresende wird das Wirtschaftsjahr festgeschrieben

**Verwendung im Code:**
- Datenbank-Tabelle: `public.fiscal_years` (Migration `0030_client_rechtsform_stammdaten.sql`)
- TypeScript-Typ: `FiscalYear` in `src/types/db.ts`
- Felder: `start_date`, `end_date`, `is_closed` (nach Festschreibung), `client_id` (Mandantenbezug)
- Fast alle Auswertungs-Builder (`BalanceSheetBuilder`, `GuvBuilder`, `UStVaBuilder`, `AnlagenspiegelBuilder`) nehmen `fiscalYearId` oder `stichtag` als Pflicht-Parameter
- UI: `src/contexts/YearContext.tsx` — aktives Wirtschaftsjahr in der UI-Session

**Nicht verwechseln mit:**
- **Kalenderjahr** — immer 01.01.–31.12.; das Wirtschaftsjahr **kann**, muss aber nicht damit übereinstimmen
- **Steuerjahr** — synonym zu Wirtschaftsjahr im einkommensteuerlichen Kontext (§ 25 EStG: Einkommensteuer-Veranlagungszeitraum = Kalenderjahr, auch wenn das Wirtschaftsjahr abweicht!)
- **Rumpfgeschäftsjahr** — Sonderfall (< 12 Monate), nicht Regelfall

**Anmerkungen / Edge-Cases:**
- **Abweichendes Wirtschaftsjahr** ist in Deutschland seltener als der Regelfall. Typische Branchen: Landwirtschaft (01.07.–30.06.), Sportvereine (saisonabhängig), internationale Konzerntöchter (Gleichlauf mit Muttergesellschaft).
- Für **Personengesellschaften** kann das Wirtschaftsjahr vom Kalenderjahr abweichen; für **natürliche Personen** ist das Wirtschaftsjahr immer = Kalenderjahr (Ausnahme: Land- und Forstwirte nach § 4a Abs. 1 Nr. 1 EStG).
- Ein **Wechsel** des Wirtschaftsjahres ist nur einmal und nur mit Einwilligung des Finanzamts möglich (§ 4a Abs. 1 Nr. 2 EStG).
- harouda-app unterstützt abweichende Wirtschaftsjahre strukturell (Start-/End-Datum als freie Felder), hat aber keine Sondervalidierungen für Rumpfjahre (TECH-DEBT-Kandidat).

---

> **Modul-Footer**
> **Nächstes Modul:** [03 · Lohn & SV](./03-lohn-sv.md) · **Übersicht:** [INDEX.md](./INDEX.md)
> **Terminology-Sprint 1 · Modul 02 · Stand 2026-04-23**
