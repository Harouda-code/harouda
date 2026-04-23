# 01 · Grundlagen — Rechtsrahmen & Kerninstitutionen

**Inhalt:** Gesetze, Verwaltungsregelwerke, Berufsrecht und zentrale
Institutionen, auf die das gesamte System aufbaut. Alle anderen
Glossar-Dateien referenzieren Begriffe aus diesem Kapitel.

> **Modul-Metadaten**
> **Modul:** 01 · Grundlagen · **Einträge:** 10 FEST · **Stand:** 2026-04-27
> **Baut auf:** — (Fundament-Modul, keine Vorgänger) · **Spätere Module:** 02–09 referenzieren dieses

---

## Inhaltsverzeichnis

1. [GoBD](#1-gobd)
2. [Abgabenordnung (AO)](#2-abgabenordnung-ao)
3. [Handelsgesetzbuch (HGB)](#3-handelsgesetzbuch-hgb)
4. [Mandant](#4-mandant)
5. [Kanzlei](#5-kanzlei)
6. [Steuerberater (StB)](#6-steuerberater-stb)
7. [Betriebsprüfung](#7-betriebsprüfung)
8. [BStBK — Bundessteuerberaterkammer](#8-bstbk--bundessteuerberaterkammer)
9. [DSGVO](#9-dsgvo)
10. [Verschwiegenheitspflicht](#10-verschwiegenheitspflicht)

---

## 1. GoBD

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | GoBD |
| **Synonyme (DE)** | Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum Datenzugriff |
| **Arabisch** | المبادئ الألمانية لمسك الدفاتر إلكترونياً والوصول إلى البيانات (قواعد ملزمة صادرة عن وزارة المالية تحدد كيفية إدارة وحفظ الدفاتر والسجلات رقمياً) |
| **Englisch (Code-Kontext)** | GoBD (nicht übersetzt) |
| **Kategorie** | Rechtsbegriff / Regelwerk |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Verwaltungsanweisung des Bundesministeriums der Finanzen (BMF), die festlegt, wie Buchführung, Aufzeichnungen und Unterlagen in elektronischer Form geführt und aufbewahrt werden müssen. Bindet die Finanzverwaltung und ist faktisch für alle buchführungspflichtigen Unternehmen in Deutschland maßgeblich.

### Rechtsgrundlage
- BMF-Schreiben vom 28.11.2019 (IV A 4 - S 0316/19/10003 :001), zuletzt geändert durch BMF vom 11.03.2024
- Konkretisiert §§ 145–147 AO und § 238 ff. HGB

**Verwandte Begriffe:**
- [Abgabenordnung (AO)](#2-abgabenordnung-ao) — gesetzliche Grundlage
- [Handelsgesetzbuch (HGB)](#3-handelsgesetzbuch-hgb) — parallele handelsrechtliche Pflichten
- Festschreibung — technische Umsetzung der GoBD-Unveränderbarkeit

**Verwendung im Code:**
- `src/domain/gobd/FestschreibungsService.ts`
- `src/domain/gobd/hashChainVerifier.ts`
- Migrationen: `0003_audit_hash_chain.sql`, `0006_gobd_append_only.sql`, `0010_journal_hash_chain.sql`, `0021_gobd_festschreibung.sql`, `0039_hash_chain_bpv_uv.sql`

**Nicht verwechseln mit:**
- **GDPdU** — Vorgänger-Regelwerk, seit 2015 durch GoBD ersetzt; nur noch historisch relevant
- **DSGVO** — Datenschutz, nicht Buchführung

**Anmerkungen / Edge-Cases:**
- GoBD ist kein Gesetz, sondern Verwaltungsanweisung. Verstöße führen zur Verwerfung der Buchführung und Schätzungsbefugnis der Finanzverwaltung (§ 162 AO).

---

## 2. Abgabenordnung (AO)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Abgabenordnung |
| **Synonyme (DE)** | AO (Abkürzung, im Code und Text bevorzugt) |
| **Arabisch** | قانون الضرائب الأساسي الألماني (القانون الإطاري الذي ينظم إجراءات فرض وتحصيل جميع الضرائب في ألمانيا) |
| **Englisch (Code-Kontext)** | — (nicht übersetzt, AO als Eigenname) |
| **Kategorie** | Rechtsbegriff / Gesetz |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Das "Grundgesetz" des deutschen Steuerrechts. Regelt das Besteuerungsverfahren, die Mitwirkungspflichten der Steuerpflichtigen, Aufbewahrungsfristen und die Rechte der Finanzverwaltung (z. B. Betriebsprüfung). Gilt für alle Steuerarten, soweit nicht Einzelsteuergesetze (UStG, EStG, ...) speziellere Regelungen enthalten.

### Rechtsgrundlage
- AO vom 16.03.1976 in der jeweils aktuellen Fassung
- Für dieses Projekt besonders relevant:
  - § 140 AO — Buchführungspflicht nach anderen Gesetzen
  - § 145 AO — Allgemeine Anforderungen an Buchführung
  - § 146 AO — Ordnungsvorschriften (Unveränderbarkeit, Vollständigkeit, Zeitgerechtigkeit)
  - § 147 AO — Aufbewahrungspflichten (10 Jahre)
  - § 162 AO — Schätzungsbefugnis bei Mängeln

**Verwandte Begriffe:**
- [GoBD](#1-gobd) — Verwaltungsanweisung zur AO
- [HGB](#3-handelsgesetzbuch-hgb) — handelsrechtliches Pendant
- [Betriebsprüfung](#7-betriebsprüfung) — AO-Verfahren
- Z3-Export — technische Umsetzung § 147 Abs. 6 AO

**Verwendung im Code:**
- Häufig als Rechtsgrundlage in JSDoc-Kommentaren zitiert, z. B. `src/domain/gobd/FestschreibungsService.ts` verweist auf § 146 AO
- `supabase/migrations/0007_tax_auditor_role.sql` — Rolle für § 147 Abs. 6 AO (Datenzugriff)

**Nicht verwechseln mit:**
- **HGB** — handelsrechtliche Buchführung; AO ist steuerrechtlich
- **AO** in anderen Kontexten (z. B. "Aufnahmeoperation") — hier IMMER Abgabenordnung

**Anmerkungen / Edge-Cases:**
- AO-Paragraphen werden im Code IMMER mit führendem § zitiert, nicht als "Para." oder "Art.".

---

## 3. Handelsgesetzbuch (HGB)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Handelsgesetzbuch |
| **Synonyme (DE)** | HGB (Abkürzung, bevorzugt) |
| **Arabisch** | القانون التجاري الألماني (الكتاب الثالث منه ينظم مسك الدفاتر التجارية وإعداد الحسابات الختامية لجميع التجار) |
| **Englisch (Code-Kontext)** | — (Eigenname) |
| **Kategorie** | Rechtsbegriff / Gesetz |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Das Kerngesetz des deutschen Handelsrechts. Drittes Buch ("Handelsbücher", §§ 238–342p HGB) regelt die handelsrechtliche Buchführungs- und Rechnungslegungspflicht aller Kaufleute, inkl. Jahresabschluss, Bilanzierung, Bewertung, Offenlegung.

### Rechtsgrundlage
- HGB vom 10.05.1897 (geltende Fassung jährlich aktualisiert)
- Für dieses Projekt besonders relevant:
  - § 238 HGB — Buchführungspflicht
  - § 240 HGB — Inventar / Inventur
  - § 242 HGB — Jahresabschluss-Pflicht
  - § 266 HGB — Gliederung der Bilanz
  - § 268 Abs. 2 HGB — Anlagenspiegel
  - § 275 HGB — Gliederung der GuV
  - §§ 284–287 HGB — Anhang-Pflichtangaben
  - § 289 HGB — Lagebericht

**Verwandte Begriffe:**
- [AO](#2-abgabenordnung-ao) — steuerrechtliches Pendant
- [Jahresabschluss](./05-jahresabschluss.md#1-jahresabschluss) — Kernprodukt aus §§ 242 ff. HGB
- [Bilanz](./05-jahresabschluss.md#2-bilanz) — § 266 HGB

**Verwendung im Code:**
- `src/domain/accounting/BalanceSheetBuilder.ts` — implementiert § 266 HGB
- `src/domain/accounting/GuvBuilder.ts` — implementiert § 275 HGB
- `supabase/migrations/0019_hgb_balance_sheet.sql` — Closure-Table für HGB-Bilanz-Mapping
- `src/domain/jahresabschluss/` — komplette HGB-Jahresabschluss-Pipeline

**Nicht verwechseln mit:**
- **AO** — Steuerrecht ≠ Handelsrecht; HGB ist zivilrechtlich, AO ist öffentlich-rechtlich
- **BGB** (Bürgerliches Gesetzbuch) — allgemeines Zivilrecht, nicht Handelsrecht

**Anmerkungen / Edge-Cases:**
- Handels- und Steuerbilanz können unterschiedlich sein (Maßgeblichkeitsgrundsatz durchbrochen durch § 5 Abs. 1 Satz 1 EStG, insb. steuerliche Wahlrechte).

---

## 4. Mandant

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Mandant |
| **Synonyme (DE)** | Mandantin (weibl.) |
| **Arabisch** | الموكِّل (العميل الذي يتعاقد مع مكتب الاستشارات الضريبية وفقاً لـ § 3 StBerG؛ شخص طبيعي أو اعتباري) |
| **Englisch (Code-Kontext)** | `client` (Datenbank-Tabelle + Typ) |
| **Kategorie** | Rechtsbegriff / Datentyp |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Natürliche oder juristische Person, für die eine Steuerberatungskanzlei steuerliche und buchhalterische Leistungen erbringt. In harouda-app technisch als Row in der `clients`-Tabelle modelliert; eine [Kanzlei](#5-kanzlei) kann beliebig viele Mandanten haben.

### Rechtsgrundlage
- § 3 StBerG — Berufsbild des Steuerberaters
- § 57 StBerG — Verschwiegenheitspflicht gegenüber Mandanten
- Kein gesetzlich definierter Begriff, aber berufsrechtlich etabliert

**Verwandte Begriffe:**
- [Kanzlei](#5-kanzlei) — Dienstleister-Seite (technisch: `company`)
- [Mandantenfähigkeit](./08-technik-architektur.md#1-mandantenfähigkeit-multi-tenancy) — technische Trennung im Multi-Tenant-System
- `client_id` — Fremdschlüssel auf `clients`-Tabelle in jeder datenrelevanten Row

**Verwendung im Code:**
- Datenbank-Tabelle: `public.clients`
- TypeScript-Typ: `Client` in `src/types/db.ts`
- React-Context: `src/contexts/MandantContext.tsx` — URL-primary Mandant-Auswahl
- Spalten in data tables: `client_id uuid NOT NULL` (Multi-Tenant-Isolation via RLS seit Migration 0026)

**Nicht verwechseln mit:**
- **Kunde** (allgemein) — "Kunde" bezeichnet oft B2C-Endkunden eines Mandanten; im Kanzlei-Kontext ist der Mandant der Kunde der Kanzlei, aber der "Kunde" eines Mandanten ist ein [Debitor](./02-buchhaltung.md#9-debitor--kreditor)
- **User** — Person mit Login-Zugang; ein User kann Zugriff auf mehrere Mandanten haben, ist aber nicht selbst ein Mandant
- **Company** (im Code) — in harouda-app technisch die [Kanzlei](#5-kanzlei), nicht der Mandant

**Anmerkungen / Edge-Cases:**
- Die Code-Konvention nutzt `client` (Englisch) für Mandant und `company` für Kanzlei — **beide Begriffe sind im deutschen Alltag leicht zu verwechseln**. Siehe `MandantContext.tsx` für die strikte Trennung.

---

## 5. Kanzlei

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Kanzlei |
| **Synonyme (DE)** | Steuerberatungskanzlei, Steuerkanzlei, Steuerberatungsgesellschaft (bei GmbH/PartGmbB-Form) |
| **Arabisch** | مكتب الاستشارات الضريبية (الكيان المهني الذي يمارس فيه المستشارون الضريبيون مهنتهم — سواءً كممارسة فردية أو PartG/PartGmbB أو شركة استشارات ضريبية GmbH) |
| **Englisch (Code-Kontext)** | `company` (Datenbank-Tabelle + Typ) |
| **Kategorie** | Rechtsbegriff / Datentyp |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Organisationseinheit, in der Steuerberater ihre Berufstätigkeit ausüben. In harouda-app technisch als Row in der `companies`-Tabelle modelliert. Eine Kanzlei kann mehrere [Mandanten](#4-mandant) betreuen und hat mehrere Mitglieder (CompanyRole) mit unterschiedlichen Rollen (owner, admin, member, readonly, tax_auditor).

### Rechtsgrundlage
- § 56 StBerG — Berufliche Zusammenschlüsse
- § 50 StBerG — Kanzleisitz-Pflicht
- Kein handelsrechtlicher Begriff per se; rechtlich meist als Einzelpraxis, PartG, PartGmbB oder Steuerberatungs-GmbH organisiert

**Verwandte Begriffe:**
- [Mandant](#4-mandant) — Leistungsempfänger-Seite
- [Mandantenfähigkeit](./08-technik-architektur.md#1-mandantenfähigkeit-multi-tenancy) — technisches Gegenstück zur Kanzlei-Mandanten-Beziehung
- `company_id` — Fremdschlüssel auf `companies`-Tabelle, top-level Tenant-Isolation

**Verwendung im Code:**
- Datenbank-Tabelle: `public.companies`
- TypeScript-Typ: `Company` in `src/types/db.ts`
- React-Context: `src/contexts/CompanyContext.tsx` — active Kanzlei + Role
- Konstante: `DEMO_COMPANY_ID = "demo-00000000-0000-0000-0000-000000000001"` (Sprint 20.A.1)
- Spalten in data tables: `company_id uuid NOT NULL` (seit Migration 0004)

**Nicht verwechseln mit:**
- **Mandant** — der Kunde der Kanzlei, nicht die Kanzlei selbst
- **Unternehmen des Mandanten** — ein Mandant kann selbst ein Unternehmen sein (GmbH, KG), das ist aber ein Mandant, nicht eine Kanzlei
- **Firma** (HGB-Sinn) — eine Firma ist der Name eines Kaufmanns (§ 17 HGB), nicht die Kanzlei-Organisation

**Anmerkungen / Edge-Cases:**
- Die englische Code-Bezeichnung `company` ist historisch gewachsen, rein technisch und **kein inhaltlicher Widerspruch**: `company_id` bezeichnet immer die Kanzlei, niemals eine Mandanten-Firma.

---

## 6. Steuerberater (StB)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Steuerberater |
| **Synonyme (DE)** | StB (Abkürzung), Steuerberaterin (weibl.) |
| **Arabisch** | مستشار ضريبي (مِهنة حرة معتمدة بعد اجتياز امتحان الدولة والتسجيل في غرفة المستشارين الضريبيين) |
| **Englisch (Code-Kontext)** | — (nicht übersetzt) |
| **Kategorie** | Rechtsbegriff / Rolle |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Zur unbeschränkten Hilfeleistung in Steuersachen befugte Person nach bestandenem Steuerberaterexamen und Bestellung durch die zuständige Steuerberaterkammer. Übt einen "freien Beruf" aus, unterliegt Berufspflichten wie Verschwiegenheit, Unabhängigkeit und Eigenverantwortung.

### Rechtsgrundlage
- §§ 3, 32 ff. StBerG — Berufsbefugnis
- § 57 StBerG — Allgemeine Berufspflichten
- BOStB (Berufsordnung der Steuerberater)

**Verwandte Begriffe:**
- [Kanzlei](#5-kanzlei) — Organisationsform
- [Mandant](#4-mandant) — Leistungsempfänger
- [BStBK](#8-bstbk--bundessteuerberaterkammer) — Bundessteuerberaterkammer
- [Verschwiegenheitspflicht](#10-verschwiegenheitspflicht) — § 57 StBerG
- [Betriebsprüfung](#7-betriebsprüfung) — typische Mandatssituation

**Verwendung im Code:**
- CompanyRole-Wert: indirekt über `owner` oder `admin` in `src/contexts/CompanyContext.tsx`
- UI-Label: "Steuerberater" in Bescheinigungs-Texten, z. B. `src/domain/jahresabschluss/bstbk/bstbkBescheinigungen.ts`
- Nicht als eigene technische Rolle modelliert — ein Steuerberater ist in harouda-app typischerweise der `owner` oder `admin` einer Kanzlei

**Nicht verwechseln mit:**
- **Steuerfachangestellter** — Ausbildungsberuf, darf Buchführung machen, aber keine steuerliche Beratung
- **Steuerberatungsgesellschaft** — juristische Person, in der Steuerberater angestellt sein können
- **Wirtschaftsprüfer (WP)** — eigener Beruf, teilweise überlappende Befugnisse, aber andere Kammer (WPK statt StBK)

**Anmerkungen / Edge-Cases:**
- Die Bezeichnung "Steuerberater" ist geschützt (§ 43 StBerG). Unbefugte Nutzung ist Ordnungswidrigkeit.

---

## 7. Betriebsprüfung

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Betriebsprüfung |
| **Synonyme (DE)** | Außenprüfung (offizieller Terminus der AO), BP (Abkürzung) |
| **Arabisch** | التدقيق الضريبي الخارجي (فحص شامل لدفاتر ومستندات المنشأة من قبل مفتشي مصلحة الضرائب في مقر المنشأة) |
| **Englisch (Code-Kontext)** | `tax_auditor` (Rollen-Wert in CompanyRole) |
| **Kategorie** | Rechtsbegriff / Verfahren |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Förmliche Prüfung durch die Finanzverwaltung, bei der Buchführung und steuerlich relevante Unterlagen eines Unternehmens geprüft werden. Der Prüfer kann Datenzugriff in drei Stufen verlangen (Z1 unmittelbar, Z2 mittelbar, Z3 Datenträgerüberlassung).

### Rechtsgrundlage
- §§ 193–203 AO — Außenprüfung
- § 147 Abs. 6 AO — Datenzugriffsrechte
- § 200 AO — Mitwirkungspflichten
- GoBD Rz. 158 ff. — Datenzugriff

**Verwandte Begriffe:**
- Z3-Export — technische Umsetzung § 147 Abs. 6 AO
- GDPdU (historisch, nur noch als Dateiformat-Kontext)
- [GoBD](#1-gobd) — Ordnungsrahmen
- `tax_auditor`-Rolle — Read-only-Zugang für Prüfer (Migration 0007)

**Verwendung im Code:**
- CompanyRole: `'tax_auditor'` in `src/contexts/CompanyContext.tsx`
- Migration: `supabase/migrations/0007_tax_auditor_role.sql`
- Pages: `src/pages/Z3ExportPage.tsx`, `src/pages/DatenExportPage.tsx`
- Integrity-Dashboard: `/admin/integrity` liefert JSON-Export als Betriebsprüfer-Vorlage (Sprint 20.C.3)

**Nicht verwechseln mit:**
- **Umsatzsteuer-Sonderprüfung** — eigene Prüfungsart (§§ 193 ff. AO, aber auf USt begrenzt)
- **Lohnsteuer-Außenprüfung** — ebenfalls Sonderform, nur LSt
- **Kassen-Nachschau** (§ 146b AO) — unangekündigt, nur Kassenführung

**Anmerkungen / Edge-Cases:**
- "Betriebsprüfung" ist der umgangssprachliche und in der Praxis dominante Begriff; das Gesetz spricht von "Außenprüfung". Im Code wird `tax_auditor` verwendet, in UI-Texten und Dokumentation "Betriebsprüfer" bzw. "Betriebsprüfung" — beide parallel zulässig.

---

## 8. BStBK — Bundessteuerberaterkammer

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Bundessteuerberaterkammer |
| **Synonyme (DE)** | BStBK (Abkürzung, im Code und Text bevorzugt) |
| **Arabisch** | الاتحاد الاتحادي لغرف المستشارين الضريبيين (الهيئة المهنية العليا الجامعة لـ 21 غرفة إقليمية؛ تُصدر إرشادات ملزمة مهنياً — لا تشريعياً — وفق §§ 85 ff. StBerG) |
| **Englisch (Code-Kontext)** | `bstbk` (Präfix in Code-Modulen) |
| **Kategorie** | Institution / Rechtsbegriff |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Dachverband der 21 regionalen Steuerberaterkammern in Deutschland, Körperschaft des öffentlichen Rechts. Erlässt Berufsrichtlinien (z. B. Hinweise zu Bescheinigungen beim Jahresabschluss) und vertritt den Berufsstand gegenüber Gesetzgeber und Öffentlichkeit.

### Rechtsgrundlage
- §§ 85 ff. StBerG — Steuerberaterkammern und BStBK als Dachverband
- BStBK-Hinweise zur Erstellung von Jahresabschlüssen (Stand 2023) — praxisrelevantes Regelwerk für Bescheinigungen

**Verwandte Begriffe:**
- [Steuerberater](#6-steuerberater-stb) — Berufsausübung, geregelt durch Kammern
- Bescheinigung — BStBK-Musterformulare nutzen das Projekt (Sprint 17.5)

**Verwendung im Code:**
- `src/domain/jahresabschluss/bstbk/bstbkBescheinigungen.ts` — 3 BStBK-Bescheinigungstypen (Stand 2023)
- `src/domain/jahresabschluss/bstbk/bstbkPlaceholders.ts` — Whitelist-Platzhalter
- `docs/BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md` — Prozess bei BStBK-Update

**Nicht verwechseln mit:**
- **Steuerberaterkammer (regional)** — z. B. StBK Niedersachsen; BStBK ist deren Dachverband
- **DStV** — Deutscher Steuerberaterverband, privatrechtlicher Berufsverband, nicht die Kammer

**Anmerkungen / Edge-Cases:**
- BStBK-Musterbescheinigungen sind kein Gesetz, aber berufsständisch verbindlich. Abweichungen erfordern Begründung.

---

## 9. DSGVO

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | DSGVO |
| **Synonyme (DE)** | Datenschutz-Grundverordnung, GDPR (englisch, selten im deutschen Text) |
| **Arabisch** | اللائحة العامة الأوروبية لحماية البيانات — اللائحة (EU) 2016/679 (سارية مباشرة في جميع دول الاتحاد منذ 25.05.2018؛ تُكمَّل في ألمانيا بقانون BDSG) |
| **Englisch (Code-Kontext)** | `privacy`, `dsgvo` (als Modul-Präfix) |
| **Kategorie** | Rechtsbegriff / EU-Verordnung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
EU-Verordnung 2016/679, seit 25.05.2018 in allen EU-Mitgliedsstaaten unmittelbar anwendbar. Regelt den Schutz natürlicher Personen bei der Verarbeitung personenbezogener Daten und deren freien Datenverkehr. In Deutschland ergänzt durch das BDSG (Bundesdatenschutzgesetz).

### Rechtsgrundlage
- Verordnung (EU) 2016/679 (DSGVO)
- BDSG (neu, seit 25.05.2018)
- Für dieses Projekt besonders relevant:
  - Art. 6 DSGVO — Rechtmäßigkeit der Verarbeitung
  - Art. 15 DSGVO — Auskunftsrecht
  - Art. 17 DSGVO — Recht auf Löschung
  - Art. 28 DSGVO — Auftragsverarbeitungsvertrag (AV)
  - Art. 32 DSGVO — Technische und organisatorische Maßnahmen
  - Art. 33 DSGVO — Meldung von Verletzungen des Schutzes personenbezogener Daten

**Verwandte Begriffe:**
- [AV-Vertrag](./09-dsgvo-compliance.md#1-auftragsverarbeitung-avv--28-dsgvo) — Art. 28 DSGVO (zwischen Kanzlei und harouda-app als Auftragsverarbeiter)
- [Verschwiegenheitspflicht](#10-verschwiegenheitspflicht) — § 57 StBerG, ergänzt DSGVO
- `privacy_requests` — Tabelle für Art. 15/17-Anfragen (Migration 0023)
- `privacy_incidents` — Art. 33-Meldungen (Migration 0023)
- `cookie_consents` — Art. 6 Abs. 1 lit. a DSGVO

**Verwendung im Code:**
- Migration: `supabase/migrations/0023_dsgvo_compliance.sql`
- Context: `src/contexts/PrivacyContext.tsx`, `src/contexts/CookieConsentContext.tsx`
- Pages: Datenschutz-Einstellungen, Privacy-Request-Formulare

**Nicht verwechseln mit:**
- **GoBD** — Buchführung, nicht Datenschutz
- **StBerG § 57** — Verschwiegenheitspflicht ist strenger als DSGVO (auch gegenüber Behörden)
- **Bankgeheimnis** — eigene Rechtsgrundlage, nicht DSGVO

**Anmerkungen / Edge-Cases:**
- Steuerberatliche Verschwiegenheit (§ 57 StBerG) und DSGVO gelten parallel. Wenn DSGVO die Offenlegung erlaubt, kann § 57 StBerG sie dennoch verbieten (strengeres Recht setzt sich durch).

---

## 10. Verschwiegenheitspflicht

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Verschwiegenheitspflicht |
| **Synonyme (DE)** | Berufsverschwiegenheit, Schweigepflicht (umgangssprachlich) |
| **Arabisch** | واجب السرية المهنية (التزام قانوني للمستشار الضريبي بعدم إفشاء أي معلومة تتعلق بموكِّله حتى تجاه السلطات، مع عقوبات جنائية صارمة على المخالفة) |
| **Englisch (Code-Kontext)** | — (nicht übersetzt) |
| **Kategorie** | Rechtsbegriff / Berufspflicht |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Gesetzliche Pflicht des Steuerberaters, über alle im Rahmen der Berufsausübung bekannt gewordenen Tatsachen Stillschweigen zu bewahren. Gilt gegenüber jedermann, auch gegenüber Behörden (mit engen Ausnahmen, z. B. Geldwäsche-Verdachtsmeldung). Strafrechtlich flankiert durch § 203 StGB.

### Rechtsgrundlage
- § 57 Abs. 1 StBerG — Berufsverschwiegenheit
- § 203 Abs. 1 Nr. 3 StGB — strafrechtlicher Schutz (bis zu 1 Jahr Freiheitsstrafe bei Verstoß)
- § 102 AO — Auskunftsverweigerungsrecht im Besteuerungsverfahren
- § 53 StPO — Zeugnisverweigerungsrecht im Strafverfahren

**Verwandte Begriffe:**
- [Steuerberater](#6-steuerberater-stb) — primärer Pflichtenträger
- [DSGVO](#9-dsgvo) — parallel geltender Datenschutz
- [Mandant](#4-mandant) — geschützte Person

**Verwendung im Code:**
- Relevant für Produkt-Design-Entscheidungen (Telemetrie, Sentry-PII-Scrubbing, Training-Data-Opt-Out bei Claude.ai-Integration)
- `docs/` Governance-Dokumente verweisen auf § 57 StBerG
- Keine direkte Code-Repräsentation, da querschnittliche Berufspflicht

**Nicht verwechseln mit:**
- **Bankgeheimnis** — für Banken, nicht Steuerberater
- **Ärztliche Schweigepflicht** — § 203 StGB Nr. 1, selbe Strafnorm, aber andere Berufsgruppe
- **DSGVO-Pflichten** — DSGVO schützt Daten, Verschwiegenheit schützt darüber hinaus auch "Tatsachen" (breiter Begriff)

**Anmerkungen / Edge-Cases:**
- Bei Software-Einsatz muss die Verschwiegenheit gegenüber dem Auftragsverarbeiter durch AV-Vertrag (Art. 28 DSGVO) sichergestellt werden — sonst verletzt die Kanzlei § 57 StBerG durch die Weitergabe selbst.
- Die Pflicht überdauert das Mandatsende und sogar den Tod des Mandanten.

---

> **Modul-Footer**
> **Nächstes Modul:** [02 · Buchhaltung](./02-buchhaltung.md) · **Übersicht:** [INDEX.md](./INDEX.md)
> **Terminology-Sprint 1 · Modul 01 · Stand 2026-04-27**
