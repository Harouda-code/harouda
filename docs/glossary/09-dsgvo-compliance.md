# 09 · DSGVO & Compliance — Datenschutz, Aufbewahrungspflicht, Betroffenenrechte

**Status des Moduls:** 9 von 10 Einträgen ✅ FEST (zum Sprint-1-Abschluss), 1 Eintrag 🟡 DRAFT (§ 6 Crypto-Shredding — juristische Gegenprüfung erforderlich; Details siehe [`docs/open-questions/crypto-shredding-rechtliche-einordnung.md`](../open-questions/crypto-shredding-rechtliche-einordnung.md))

**Inhalt:** Das letzte Modul schließt den Spannungsbogen zwischen **Datenschutz-Grundverordnung (DSGVO)**, **handels- und steuerrechtlicher Aufbewahrungspflicht** (§ 147 AO, § 257 HGB, GoBD), **strafrechtlich bewehrter Verschwiegenheitspflicht** von Steuerberatern (§ 203 StGB, § 57 StBerG) und **technischen Realitäten** (Cloud-Infrastruktur, internationale Dienstleister, unveränderliche Audit-Logs).

Die zentrale Spannung dieses Moduls: **GoBD verlangt Unveränderbarkeit, DSGVO verlangt Löschbarkeit.** Die Auflösung erfolgt durch **Crypto-Shredding** (Eintrag #6) — nicht physisches Löschen, sondern Vernichtung des Entschlüsselungs-Schlüssels für personenbezogene Felder bei weitergeführtem Bestand der steuerrechtlich erforderlichen Strukturen.

Jeder Eintrag adressiert: *„Welche konkrete rechtliche Pflicht entsteht, und wie wird sie in Harouda technisch und organisatorisch umgesetzt?"*

Baut auf auf [01-grundlagen.md](./01-grundlagen.md) (DSGVO-Grundbegriff, Verschwiegenheitspflicht, Betriebsprüfung),
[02-buchhaltung.md](./02-buchhaltung.md) (Belegaufbewahrung),
[07-anlagen-inventur.md](./07-anlagen-inventur.md) (Anlagenverzeichnis-Aufbewahrung) und
[08-technik-architektur.md](./08-technik-architektur.md) (Mandantenfähigkeit, RLS, CAS, Event-Sourcing, Hash-Chain — die technischen Substrate, auf denen Crypto-Shredding aufsetzt).

> **Modul-Metadaten**
> **Modul:** 09 · DSGVO & Compliance · **Einträge:** 9 FEST + 1 DRAFT · **Stand:** 2026-04-23
> **Baut auf:** [01-grundlagen.md](./01-grundlagen.md), [02-buchhaltung.md](./02-buchhaltung.md), [07-anlagen-inventur.md](./07-anlagen-inventur.md), [08-technik-architektur.md](./08-technik-architektur.md) · **Spätere Module:** — (letztes Modul)

---

## Inhaltsverzeichnis

1. [Auftragsverarbeitung (AVV) — § 28 DSGVO](#1-auftragsverarbeitung-avv--28-dsgvo)
2. [Verantwortlicher vs. Auftragsverarbeiter — Art. 4 DSGVO](#2-verantwortlicher-vs-auftragsverarbeiter--art-4-dsgvo)
3. [Technische und organisatorische Maßnahmen (TOM) — Art. 32 DSGVO](#3-technische-und-organisatorische-maßnahmen-tom--art-32-dsgvo)
4. [Datenschutz-Folgenabschätzung (DSFA) — Art. 35 DSGVO](#4-datenschutz-folgenabschätzung-dsfa--art-35-dsgvo)
5. [Betroffenenrechte — Art. 12–23 DSGVO](#5-betroffenenrechte--art-1223-dsgvo)
6. [Löschkonzept / Crypto-Shredding](#6-löschkonzept--crypto-shredding)
7. [Pseudonymisierung vs. Anonymisierung — Art. 4 Nr. 5 DSGVO + Erwägungsgrund 26](#7-pseudonymisierung-vs-anonymisierung--art-4-nr-5-dsgvo--erwägungsgrund-26)
8. [Drittlandtransfer — Art. 44–50 DSGVO](#8-drittlandtransfer--art-4450-dsgvo)
9. [Datenpanne / Meldepflicht — Art. 33, 34 DSGVO](#9-datenpanne--meldepflicht--art-33-34-dsgvo)
10. [Verschwiegenheitspflicht vs. DSGVO — § 203 StGB + § 57 StBerG](#10-verschwiegenheitspflicht-vs-dsgvo--203-stgb--57-stberg)

---

## 1. Auftragsverarbeitung (AVV) — § 28 DSGVO

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Auftragsverarbeitungsvertrag (AVV) |
| **Synonyme (DE)** | AVV (Abkürzung, dominant), Auftragsverarbeitungsvereinbarung, Data Processing Agreement (DPA, englisch) |
| **Arabisch** | عقد معالجة البيانات بالتكليف (العقد القانوني الإلزامي بين المسؤول عن البيانات Verantwortlicher — في Harouda هو الـ Kanzlei/Mandant — ومعالج البيانات بالنيابة Auftragsverarbeiter — في Harouda هم Supabase/hosting provider، مزود ختم الزمن eIDAS، مزود Peppol-Access-Point؛ العقد يُلزم المعالج بمعالجة البيانات وفقاً لتعليمات المسؤول حصراً وبتطبيق TOMs كافية وبعدم الاستعانة بـ Sub-Processor إضافي بدون موافقة مسبقة وبتسليم كل البيانات عند انتهاء العقد؛ بدون AVV ساري المفعول، كل تعاقد مع مزود cloud يُشكِّل انتهاكاً لـ § 28 DSGVO مع غرامات تصل إلى 2% من الإيرادات العالمية أو 10 Mio EUR؛ في Harouda قائمة الـ Sub-Processors موثَّقة في Verzeichnis von Verarbeitungstätigkeiten — VVT — ومتاحة بشفافية لكل Mandant) |
| **Englisch (Code-Kontext)** | `dpa`, `avv`, `processorAgreement`, `subProcessor` |
| **Kategorie** | Vertragsrecht / DSGVO-Pflicht |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Schriftlicher Vertrag gem. Art. 28 Abs. 3 DSGVO zwischen einem **Verantwortlichen** und einem **Auftragsverarbeiter**, der den Rahmen der Datenverarbeitung regelt: Gegenstand, Dauer, Art und Zweck, Art der Daten, Kategorien betroffener Personen, Rechte und Pflichten des Verantwortlichen, acht vorgeschriebene Pflichten des Auftragsverarbeiters (Art. 28 Abs. 3 lit. a–h).

**Pflichtinhalte gem. Art. 28 Abs. 3 DSGVO:**

| Buchstabe | Pflicht |
|---|---|
| a | Verarbeitung nur auf dokumentierte Weisung |
| b | Vertraulichkeitsverpflichtung der mitarbeitenden Personen |
| c | Ergreifen aller TOMs gem. Art. 32 |
| d | Sub-Processor nur mit Genehmigung; gleiche Pflichten weiterreichen |
| e | Unterstützung bei Betroffenenrechten (Art. 12–23) |
| f | Unterstützung bei Meldepflichten (Art. 32–36) |
| g | Rückgabe/Löschung aller Daten nach Auftragsende |
| h | Nachweis- und Kontrollrechte des Verantwortlichen |

**Harouda — typische Sub-Processor-Struktur:**

| Rolle | Anbieter | AVV-Status |
|---|---|---|
| Kanzlei als Mandant | — | **Verantwortlicher** gegenüber dem Endmandanten |
| Harouda GmbH (fiktiv) | — | **Auftragsverarbeiter** der Kanzlei |
| Hosting / Datenbank | Supabase (Amazon AWS eu-central-1) | AVV mit Harouda, AWS-AVV als Sub-Sub-Processor |
| Peppol-Access-Point | Dienstleister (Comarch / Basware) | AVV mit Harouda |
| eIDAS-Zeitstempeldienst | qualifizierter VDA (z. B. Bundesdruckerei) | AVV — prüfen, ob Verarbeitung personenbezogen |
| Support-E-Mail-Provider | Mailgun / SendGrid / eigene Lösung | AVV nötig |

### Rechtsgrundlage & Standards
- **Art. 28 DSGVO** — Auftragsverarbeiter (inhaltliche Pflichten)
- **Art. 29 DSGVO** — Verarbeitung unter der Aufsicht des Verantwortlichen
- **Art. 30 DSGVO** — Verzeichnis von Verarbeitungstätigkeiten (VVT)
- **EDPB-Leitlinien 07/2020** zu den Begriffen Verantwortlicher und Auftragsverarbeiter
- **BDSG § 62 ff.** — ergänzende Spezialregeln für Deutschland
- **Art. 83 Abs. 4 lit. a DSGVO** — Bußgeldrahmen bei AVV-Verstößen: bis 10 Mio. € oder 2 % des weltweiten Jahresumsatzes
- **EDSA Guidelines 07/2020** zu Controller und Processor

**Verwandte Begriffe:**
- [Verantwortlicher vs. Auftragsverarbeiter](#2-verantwortlicher-vs-auftragsverarbeiter--art-4-dsgvo)
- [TOM Art. 32](#3-technische-und-organisatorische-maßnahmen-tom--art-32-dsgvo)
- [Drittlandtransfer](#8-drittlandtransfer--art-4450-dsgvo) — AVV allein reicht nicht bei Drittländern
- [DSGVO](./01-grundlagen.md#9-dsgvo)
- [Mandantenfähigkeit](./08-technik-architektur.md#1-mandantenfähigkeit-multi-tenancy) — strukturelle Vorkehrung

**Verwendung im Code:**
- **AVV-Verwaltungsmodul:** eigenes Modul `avv_management` mit Tabelle pro Sub-Processor (Name, Anschrift, Zweck, Datenkategorien, Sub-Sub-Processor-Liste, AVV-Dokument als CAS-Beleg, gültig von/bis, letzte Revision).
- **VVT-Export:** automatischer Export als PDF/CSV zur Vorlage bei Aufsichtsbehörden.
- **Mandanten-Transparenzseite:** UI zeigt jedem Mandanten die Liste der aktuell eingesetzten Sub-Processors, aktualisierbar ohne Release-Zyklus.
- **Benachrichtigungspflicht:** neue Sub-Processors werden allen Mandanten 30 Tage vor Einsatz angekündigt; Widerspruchsrecht dokumentiert.

**Nicht verwechseln mit:**
- **Datenaustausch-Vereinbarung** zwischen Gleichrangigen (Joint Controllership — Art. 26 DSGVO)
- **NDA (Non-Disclosure Agreement)** — Vertraulichkeit, nicht Datenverarbeitung
- **SLA (Service Level Agreement)** — Leistungsniveau, nicht Datenschutz

**Anmerkungen / Edge-Cases:**
- **Steuerberater-Besonderheit:** viele StB-Aufsichtsbehörden interpretieren die Einschaltung von Harouda als Kanzlei-Software **nicht** als Auftragsverarbeitung im engeren Sinn, sondern als *„Berufsgeheimnisträger mit eigener Verschwiegenheitspflicht"* (§ 203 StGB). Konsequenz: AVV + zusätzliche Spezialregelungen notwendig. Rücksprache mit Fachanwalt für Datenschutzrecht + Steuerberaterkammer empfohlen.
- **Bei Sub-Processor-Wechsel:** sorgfältiges Change-Management; Daten-Migration mit Nachweis vollständiger Löschung beim Alt-Anbieter.
- **AVV-Template:** eigenes, von Fachanwalt geprüftes Template; keine Akzeptanz von Anbieter-AGB ohne Einzelprüfung.

---

## 2. Verantwortlicher vs. Auftragsverarbeiter — Art. 4 DSGVO

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Verantwortlicher / Auftragsverarbeiter |
| **Synonyme (DE)** | Controller / Processor (englisch), Datenschutzverantwortlicher, Datenverarbeiter |
| **Arabisch** | المسؤول عن البيانات مقابل معالج البيانات بالتكليف (التمييز الجوهري في DSGVO الذي يحدد كل الالتزامات اللاحقة: **Verantwortlicher** — Art. 4 Nr. 7 — هو الجهة التي تحدد «الأغراض والوسائل» لمعالجة البيانات؛ **Auftragsverarbeiter** — Art. 4 Nr. 8 — هو الجهة التي تعالج البيانات بالنيابة عن المسؤول؛ في Harouda سلسلة الأدوار ثلاثية: **Endmandant** الذي يملك البيانات المالية هو Verantwortlicher أول → **Kanzlei** التي تُعالج بيانات الموكل لأغراضها المهنية أيضاً Verantwortlicher — أحياناً مشترك Joint Controller بحسب السياق → **Harouda GmbH** كمقدم البرنامج هو Auftragsverarbeiter للـ Kanzlei؛ التصنيف الخاطئ يُنتج عقوبات مباشرة: المسؤول مسؤول عن كل الانتهاكات في السلسلة، المعالج مسؤول فقط عن مخالفاته لحدود العقد؛ الاختبار العملي للتصنيف: من يقرر ما يحدث بالبيانات؟ من يُحدد الأغراض؟) |
| **Englisch (Code-Kontext)** | `controller`, `processor`, `dataSubject`, `jointController` |
| **Kategorie** | Grundbegriffe / Rollenzuweisung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
- **Verantwortlicher (Art. 4 Nr. 7):** die Stelle, die **allein oder gemeinsam mit anderen** über die **Zwecke und Mittel** der Verarbeitung personenbezogener Daten entscheidet.
- **Auftragsverarbeiter (Art. 4 Nr. 8):** die Stelle, die **personenbezogene Daten im Auftrag des Verantwortlichen** verarbeitet.

**Entscheidungskriterium:** Wer bestimmt das „Warum" und das „Wie" der Verarbeitung?

**Gegenüberstellung:**

| Aspekt | Verantwortlicher | Auftragsverarbeiter |
|---|---|---|
| Entscheidungsmacht | Zweck + Mittel | nur innerhalb der Weisung |
| Haftung extern | gegenüber Betroffenen | subsidiär |
| DSFA-Pflicht | ja (Art. 35) | nein (unterstützt) |
| VVT-Pflicht | eigenes VVT | eigenes VVT (Art. 30 Abs. 2) |
| Meldepflicht | Aufsichtsbehörde + Betroffene | nur an Verantwortlichen |
| Betroffenenauskunft | direkt | nur unterstützend |

**Harouda-Rollenmatrix:**

| Verarbeitungsvorgang | Endmandant | Kanzlei | Harouda GmbH |
|---|---|---|---|
| Buchhaltung des Endmandanten | Verantwortlicher | Auftragsverarbeiter (von Mandant) | Sub-Auftragsverarbeiter |
| Lohnabrechnung für Kanzlei-Mitarbeitende | — | Verantwortlicher | Auftragsverarbeiter |
| Kanzlei-interne CRM-/Akquise-Daten | — | Verantwortlicher | Auftragsverarbeiter |
| System-Telemetrie/Logs für Produktverbesserung | — | — | Verantwortlicher (eigene Zwecke!) |

**Achtung:** die letzte Zeile ist der häufigste Fehler — wenn Harouda Logs für eigene Analytik nutzt, wird es für **diese Verarbeitung** zum eigenständigen Verantwortlichen. Lösung: keine Nutzung von Mandanten-Daten für eigene Zwecke, oder separate rechtliche Grundlage (Einwilligung, berechtigtes Interesse) + Transparenz.

### Rechtsgrundlage & Standards
- **Art. 4 Nr. 7, 8, 9, 10 DSGVO** — Definitionen
- **Art. 24 DSGVO** — Verantwortlichkeit des Verantwortlichen
- **Art. 26 DSGVO** — Gemeinsam Verantwortliche (Joint Controllers)
- **Art. 28 DSGVO** — Auftragsverarbeiter
- **EDPB-Leitlinien 07/2020** zu Controller/Processor
- **EuGH C-210/16 „Fashion ID"** — Joint-Controllership-Rechtsprechung

**Verwandte Begriffe:**
- [AVV](#1-auftragsverarbeitung-avv--28-dsgvo)
- [DSGVO](./01-grundlagen.md#9-dsgvo)
- [Mandant](./01-grundlagen.md#4-mandant)

**Verwendung im Code:**
- **Rollenfelder in Mandanten-Stammdaten:** `role_in_processing: enum('controller', 'joint_controller', 'processor')` pro Verarbeitungsvorgang.
- **UI-Transparenz:** bei jedem Prozess (Buchung, Lohnabrechnung, E-Rechnung) ist im Datenschutzhinweis ausgewiesen, wer welche Rolle hat.

**Nicht verwechseln mit:**
- **Betroffene Person** (Art. 4 Nr. 1) — diejenige, deren Daten verarbeitet werden
- **Dritter** (Art. 4 Nr. 10) — weder Verantwortlicher, noch Verarbeiter, noch Betroffener

**Anmerkungen / Edge-Cases:**
- **Joint Controllership-Risiko:** wenn Harouda und Kanzlei **gemeinsam** über Verarbeitungsmittel entscheiden (z. B. System-Konfiguration mit strukturellen Datenschutz-Implikationen), entsteht potenziell Joint-Controllership. Schriftliche Vereinbarung gem. Art. 26 wird zusätzlich zum AVV nötig.
- **Bei Unsicherheit:** Fachanwalt für Datenschutzrecht konsultieren; Aufsichtsbehörde kann nachträglich umqualifizieren.

---

## 3. Technische und organisatorische Maßnahmen (TOM) — Art. 32 DSGVO

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Technische und organisatorische Maßnahmen (TOM) |
| **Synonyme (DE)** | TOM (Abkürzung, dominant), Sicherheitsmaßnahmen, Schutzmaßnahmen nach Art. 32 |
| **Arabisch** | الإجراءات الفنية والتنظيمية (مجموعة الإجراءات التقنية والإدارية الملموسة التي يُلزم Art. 32 DSGVO المسؤولين والمعالجين بتطبيقها لضمان «مستوى الحماية المناسب للمخاطر»؛ ستة أهداف حماية رئيسية: Vertraulichkeit السرية، Integrität السلامة، Verfügbarkeit التوافر، Belastbarkeit المرونة، Wiederherstellbarkeit القدرة على الاستعادة، Evaluation التقييم الدوري؛ في Harouda الـ TOMs مُوثَّقة في ملف مركزي يُحدَّث كل تغيير معماري ويُعرَض على Mandanten عند الطلب، مع محاور: Verschlüsselung at-rest وفي transit، Zugriffskontrolle عبر RLS وJWT، Protokollierung عبر Hash-Chain، Pseudonymisierung حيثما ممكن، Backup + Disaster-Recovery-Plan، Penetration-Testing سنوياً، Mitarbeiter-Schulung DSGVO، AVV-Review كل سنتَين؛ TOMs جزء إلزامي من كل AVV كملحق Anlage Nr. 2) |
| **Englisch (Code-Kontext)** | `tom`, `securityControls`, `encryption`, `accessControl` |
| **Kategorie** | Sicherheit / DSGVO-Pflicht |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Sämtliche technischen und organisatorischen Maßnahmen, die ein Verantwortlicher oder Auftragsverarbeiter unter Berücksichtigung von Stand der Technik, Implementierungskosten, Art, Umfang, Umständen und Zwecken der Verarbeitung sowie Eintrittswahrscheinlichkeit und Schwere der Risiken für die Rechte und Freiheiten natürlicher Personen ergreift, um ein dem Risiko angemessenes Schutzniveau zu gewährleisten (Art. 32 Abs. 1 DSGVO).

**Sechs Schutzziele (Art. 32 Abs. 1 lit. b + c + d):**

| Schutzziel | Bedeutung | Harouda-Umsetzung |
|---|---|---|
| **Vertraulichkeit** | Schutz vor unbefugtem Zugriff | RLS, JWT-Auth, Verschlüsselung at-rest/in-transit, Mandantentrennung |
| **Integrität** | Unversehrtheit der Daten | Hash-Chain, CAS, Event-Sourcing, Prüfsummen |
| **Verfügbarkeit** | Zugang bei Bedarf | Hosting-SLA, Backup alle 24 h, Monitoring |
| **Belastbarkeit** | Funktion unter Last/Angriff | Rate-Limiting, DDoS-Schutz durch Cloudflare, Auto-Scaling |
| **Wiederherstellbarkeit** | Recovery nach Zwischenfällen | Point-in-Time-Recovery (Supabase), Event-Replay, Disaster-Recovery-Plan |
| **Evaluation** | regelmäßige Überprüfung | jährliches Pen-Testing, quartalsweise TOM-Audit |

**Konkrete TOMs in Harouda (Auszug Anlage Nr. 2 zum AVV):**

| Bereich | Maßnahme |
|---|---|
| **Verschlüsselung at-rest** | AES-256-GCM (PostgreSQL TDE via Supabase), getrennte Keys pro Mandant *und* pro betroffener Person (für Crypto-Shredding — siehe #6) |
| **Schlüsselhoheit (BYOK)** | Bring Your Own Key im KMS mit EU-gehostetem HSM (nicht auf Anbieter-KMS allein vertrauen); schützt gegen unilateralen Zugriff durch Hosting-Provider und mitigiert CLOUD-Act-Exposition (siehe #8) |
| **Verschlüsselung in-transit** | TLS 1.3, HSTS, Certificate Pinning im Mobile-Client |
| **Zugriffskontrolle** | JWT mit kurzer Gültigkeit + Refresh, MFA für Kanzlei-Admins, RLS-Policies auf DB-Ebene |
| **Protokollierung (allgemein)** | Hash-Chain aller Events (Modul 08 #7), audit_log-Table mit 10-Jahres-Retention |
| **Protokollierung besonderer Kategorien (§ 64 Abs. 3 BDSG)** | erweiterte Protokollpflicht für Verarbeitungen nach Art. 9 DSGVO (Lohn-/Gesundheitsdaten): Zweck, Empfänger, Uhrzeit, verantwortliche Person — jeder lesende Zugriff protokolliert, nicht nur schreibende |
| **Pseudonymisierung** | Separation von Stammdaten und Pseudonymen-Tabellen; Re-Identifikation nur mit separatem Key |
| **Backup vs. gesetzliche Aufbewahrung** | nicht verwechseln: Backup (Disaster-Recovery) = tägliches Full + WAL-Stream, 30 Tage + jährliche Archiv-Schnappschüsse. **10-Jahres-Aufbewahrungspflicht** nach § 147 AO / § 257 HGB liegt auf der **Produktiv-Datenbank selbst** (inklusive Crypto-Shredding-Zustand), nicht auf dem Backup |
| **Disaster Recovery** | RTO 4 h, RPO 15 min; dokumentierter Runbook; halbjährlicher DR-Test |
| **Mitarbeiter-Schulung** | DSGVO-Basis-Schulung bei Einstellung + jährliche Auffrischung |
| **Auftragsverarbeiter-Kontrolle** | jährliche Sub-Processor-Re-Zertifizierung; stichprobenartige Audit-Reviews |
| **Penetration-Testing** | jährlich durch externen Dienstleister; Ergebnisse in Mandanten-Dashboard verfügbar (high-level) |
| **Löschkonzept** | Crypto-Shredding (siehe #6); schriftliche Löschfristen pro Datenkategorie |
| **Meldewesen** | 72-h-Meldekette (siehe #9); Kontakte Aufsichtsbehörde + DPO hinterlegt |

### Rechtsgrundlage & Standards
- **Art. 5 Abs. 1 lit. f DSGVO** — Integrität und Vertraulichkeit als Grundprinzip
- **Art. 24 Abs. 1 DSGVO** — allgemeine Verantwortungspflicht
- **Art. 25 DSGVO** — Privacy by Design/Default
- **Art. 32 DSGVO** — TOMs (Hauptnorm)
- **Art. 83 Abs. 4 lit. a DSGVO** — Bußgelder bis 10 Mio. € / 2 %
- **§ 64 BDSG** — Protokollierungspflicht bei automatisierten Verarbeitungen (Abs. 1) und erweiterte Protokollpflicht für besondere Kategorien nach Art. 9 DSGVO (Abs. 3)
- **BSI IT-Grundschutz (BSI-Standards 200-1 bis 200-4)** — Referenz
- **BSI TR-02102** — Kryptographische Verfahren: Empfehlungen und Schlüssellängen (Grundlage für AES-256-Wahl)
- **ISO/IEC 27001** — Information Security Management System (ISMS)
- **ISO/IEC 27701** — Privacy Information Management (PIMS)
- **BSI TR-03125 (TR-ESOR)** — Beweiswerterhaltung

**Verwandte Begriffe:**
- [AVV](#1-auftragsverarbeitung-avv--28-dsgvo) — TOMs sind Anlage zum AVV
- [Mandantenfähigkeit](./08-technik-architektur.md#1-mandantenfähigkeit-multi-tenancy), [RLS](./08-technik-architektur.md#2-row-level-security-rls), [Hash-Chain](./08-technik-architektur.md#7-hash-chain--audit-log), [CAS](./08-technik-architektur.md#5-content-addressable-storage-cas) — konkrete TOMs
- [Crypto-Shredding](#6-löschkonzept--crypto-shredding)
- [Datenpanne](#9-datenpanne--meldepflicht--art-33-34-dsgvo) — Fallback bei TOM-Versagen

**Verwendung im Code:**
- **TOM-Dokumentations-Modul:** Markdown-Dokumente in `docs/compliance/toms/` mit Versionierung; Export als PDF für AVV-Anlage.
- **Audit-Fragebogen:** standardisierter Self-Assessment-Fragebogen quartalsweise; Ergebnisse protokolliert.
- **CI-Pipeline-Gates:** TLS-Version-Checks, Secret-Scanning, Dependency-Vulnerability-Scanning bei jedem PR.

**Nicht verwechseln mit:**
- **Datenschutzerklärung** — rechtlicher Hinweis an Betroffene; TOMs sind interne Maßnahmen
- **SLA** — Verfügbarkeit als Vertragsbestandteil; TOMs sind Datenschutz-spezifisch
- **BSI-Grundschutz** — methodischer Rahmen; TOMs sind konkrete DSGVO-Umsetzung

**Anmerkungen / Edge-Cases:**
- **„Stand der Technik"** ist dynamisch — was 2024 ausreichend war, kann 2027 unzureichend sein. Jährliche TOM-Review mit expliziter Dokumentation ist Pflicht.
- **Verhältnismäßigkeit:** TOMs müssen zu Risiken passen — Over-Engineering kann wirtschaftlich unvertretbar sein. Risk-Assessment pro Verarbeitungstätigkeit empfohlen.
- **Bei größeren Konfigurationsänderungen (z. B. neuer Sub-Processor): TOM-Review auslösen + AVV-Anlage aktualisieren.**

---

## 4. Datenschutz-Folgenabschätzung (DSFA) — Art. 35 DSGVO

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Datenschutz-Folgenabschätzung (DSFA) |
| **Synonyme (DE)** | DSFA (Abkürzung, dominant), Data Protection Impact Assessment (DPIA, englisch) |
| **Arabisch** | تقييم آثار حماية البيانات (دراسة رسمية مسبقة يُلزم Art. 35 DSGVO الـ Verantwortlicher بإجرائها قبل بدء نوع جديد من المعالجة «الذي يُحتمل أن يُنتج مخاطر عالية لحقوق وحريات الأشخاص الطبيعيين»، خصوصاً عند استخدام تقنيات جديدة أو معالجة واسعة النطاق لـ besondere Kategorien — Art. 9 — أو مراقبة منهجية لـ öffentlich zugängliche Bereiche؛ في سياق Harouda: معالجة Lohnabrechnung لموظفين كُثر، نظام تعرف تلقائي على المستندات، سجلات audit عالية الحساسية لـ 10 سنوات، كلها تستوجب DSFA؛ DSFA يشمل: وصف المعالجة، تقييم الضرورة والتناسب، تقييم المخاطر على الأشخاص، تعيين الإجراءات المخففة؛ الـ Datenschutzbeauftragter DPO يُستشار في عملية الإجراء؛ غياب DSFA لازمة يُشكل انتهاك مع غرامات حتى 2% من الإيرادات) |
| **Englisch (Code-Kontext)** | `dpia`, `dsfa`, `riskAssessment`, `privacyImpact` |
| **Kategorie** | Prozess / DSGVO-Pflicht |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Systematische Bewertung der Auswirkungen einer geplanten Verarbeitung personenbezogener Daten auf den Schutz dieser Daten — **vor Beginn der Verarbeitung** durchzuführen, wenn die Verarbeitung voraussichtlich ein **hohes Risiko** für die Rechte und Freiheiten der betroffenen Personen zur Folge hat (Art. 35 Abs. 1 DSGVO).

**Pflicht-Trigger (Art. 35 Abs. 3 DSGVO + Listen der Aufsichtsbehörden):**

| Trigger | Harouda-Bezug |
|---|---|
| Systematische und umfassende Bewertung natürlicher Personen (Profiling, automatisierte Entscheidungen) | Dokumentenerkennungs-Pipeline mit Confidence-Scoring: Bewertung? Nein, nur Extraktion — **Grenzfall, DSFA vorsorglich** |
| Umfangreiche Verarbeitung besonderer Kategorien (Art. 9) oder Straftaten-Daten | Kranken-/Religions-/Gewerkschaftsdaten in Lohnabrechnung → **DSFA-Pflicht** |
| Systematische Überwachung öffentlicher Bereiche | nein, nicht zutreffend |
| **Liste der BfDI/Landesbehörden** (deutsche Ergänzungen) | u. a. *„umfangreiche Verarbeitung durch Berufsgeheimnisträger"* → **DSFA-Pflicht für Steuerberater-Software** |

**DSFA-Prozess (Art. 35 Abs. 7):**

```
1. Systematische Beschreibung der Verarbeitung
   - Zweck, Rechtsgrundlage, Datenkategorien, Empfänger
2. Bewertung der Notwendigkeit und Verhältnismäßigkeit
   - Ist der Zweck nicht anders erreichbar?
3. Risiko-Bewertung
   - Eintrittswahrscheinlichkeit × Schwere für Betroffene
   - Risiken: unrechtmäßiger Zugriff, Identitätsdiebstahl, Diskriminierung
4. Geplante Abhilfemaßnahmen
   - TOMs, Pseudonymisierung, DPO-Einbindung, Betroffeneninformation
5. Evtl. vorherige Konsultation der Aufsichtsbehörde (Art. 36)
   - Wenn Rest-Risiko trotz Maßnahmen hoch bleibt
```

**Harouda DSFAs (Pflicht-Inventar):**

> **Hinweis zum Status:** Harouda befindet sich aktuell in der Entwicklungsphase. **Keine DSFA ist zum Stichtag abgeschlossen.** Dieser Abschnitt dokumentiert die **verpflichtend zu erstellenden** DSFAs, die **vor Produktivstart** freigegeben sein müssen. Jede DSFA ist ein Release-Blocker für das betreffende Modul.

| DSFA-Gegenstand | Status | Verpflichtend bis |
|---|---|---|
| Lohnabrechnungsmodul mit Sozialversicherungs-/Gesundheitsdaten (Art. 9) | 🔴 geplant — nicht begonnen | vor Produktivstart Lohn-Modul |
| Dokumentenerkennungs-Pipeline (Self-hosted Vision-Modell, automatisierte Extraktion) | 🔴 geplant — nicht begonnen | vor Produktivstart Beleg-Erkennung |
| 10-Jahres-Audit-Log mit Mitarbeiter-Identitäten (Hash-Chain) | 🔴 geplant — nicht begonnen | vor Produktivstart Audit-Infrastruktur |
| Kanzlei-weite Cross-Mandant-Reports (aggregierte Analytik) | 🔴 geplant — nicht begonnen | vor Aktivierung Cross-Mandant-Feature |
| Mandanten-Migration / Datenexport (Art. 20 + Mandantenwechsel) | 🔴 geplant — nicht begonnen | vor Produktivstart Export-Workflow |

**Status-Werte (verbindliche Taxonomie):**

| Status | Bedeutung |
|---|---|
| 🔴 geplant | Pflicht erkannt, DSFA nicht begonnen |
| 🟡 in Arbeit | DSFA-Dokument erstellt, Review offen |
| 🟠 Konsultation Art. 36 | hohes Restrisiko, Aufsichtsbehörde angefragt |
| ✅ freigegeben | DPO-Unterschrift, Release-Freigabe erteilt |
| 🔄 Re-Evaluation fällig | bei wesentlicher Verarbeitungsänderung |

### Rechtsgrundlage & Standards
- **Art. 35 DSGVO** — DSFA
- **Art. 36 DSGVO** — Vorherige Konsultation (bei hohem Restrisiko)
- **Art. 9 DSGVO** — besondere Kategorien
- **WP 248 rev.01** (Art. 29-Gruppe) — Leitlinien zur DSFA
- **Liste der BfDI** (DSFA-Muss-Liste für Deutschland)
- **ISO/IEC 29134** — Privacy Impact Assessment Guidelines

**Verwandte Begriffe:**
- [TOM Art. 32](#3-technische-und-organisatorische-maßnahmen-tom--art-32-dsgvo) — DSFA identifiziert notwendige TOMs
- [Betroffenenrechte](#5-betroffenenrechte--art-1223-dsgvo)
- [DSGVO](./01-grundlagen.md#9-dsgvo)

**Verwendung im Code:**
- **DSFA-Verwaltungs-Modul:** pro Verarbeitungstätigkeit ein DSFA-Dokument (Markdown + PDF); Revisionsverlauf; Re-Evaluation bei wesentlichen Änderungen.
- **Change-Trigger:** Pull-Requests mit Label `privacy-impact` erfordern DSFA-Review-Gate im Merge-Prozess.

**Nicht verwechseln mit:**
- **TIA (Transfer Impact Assessment)** für Drittlandtransfer — verwandt, aber eigenständig (siehe #8)
- **Risiko-Bewertung allgemein** — DSFA ist DSGVO-spezifisch mit festem Inhalt
- **Security-Review** — Security ist nur ein Aspekt der DSFA

**Anmerkungen / Edge-Cases:**
- **Lebendes Dokument:** DSFA wird bei jedem wesentlichen Verarbeitungsänderung aktualisiert.
- **Externer DPO-Input empfohlen:** bei komplexen DSFAs (z. B. KI-Einsatz) ist externe Beratung Qualitätssicherung.
- **Bei hohem Restrisiko:** Art. 36 Konsultation der Aufsichtsbehörde **vor** Verarbeitungsstart — kann Monate dauern, daher frühzeitig einplanen.

---

## 5. Betroffenenrechte — Art. 12–23 DSGVO

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Betroffenenrechte |
| **Synonyme (DE)** | Rechte der betroffenen Person, Data-Subject Rights (englisch), DSGVO-Rechte |
| **Arabisch** | حقوق صاحب البيانات (الحزمة الكاملة من الحقوق التي تمنحها DSGVO للأفراد الذين تُعالَج بياناتهم الشخصية، والتي يجب على المسؤول Verantwortlicher تمكينهم من ممارستها خلال شهر واحد عادةً بدون رسوم: **Auskunftsrecht** Art. 15 حق الاطلاع على جميع البيانات المعالجة، **Recht auf Berichtigung** Art. 16 تصحيح البيانات غير الدقيقة، **Recht auf Löschung** Art. 17 „الحق في النسيان"، **Recht auf Einschränkung** Art. 18 تقييد المعالجة، **Recht auf Datenübertragbarkeit** Art. 20 نقل البيانات، **Widerspruchsrecht** Art. 21 الاعتراض على المعالجة، **Recht keinen automatisierten Einzelentscheidungen** Art. 22؛ في Harouda الرد يتم عبر نموذج UI مخصص للـ Endmandant يُصعِّد الطلب إلى الكانزلي بصفتها Verantwortlicher، والكانزلي تُوجِّه الطلب إلى Harouda كـ Auftragsverarbeiter؛ الحق في الحذف يتصادم مع GoBD-Aufbewahrungspflicht — الحل Crypto-Shredding #6؛ كل طلب يُوثَّق في Audit-Log) |
| **Englisch (Code-Kontext)** | `dataSubjectRights`, `accessRequest`, `erasureRequest`, `portability` |
| **Kategorie** | Rechte / DSGVO-Pflicht |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Gesamtheit der in Art. 12–23 DSGVO normierten Rechte, die jede betroffene natürliche Person gegenüber dem Verantwortlichen geltend machen kann.

**Übersicht der sieben Kernrechte:**

| Artikel | Recht | Harouda-Umsetzung |
|---|---|---|
| **Art. 15** | Auskunftsrecht | UI zeigt alle Verarbeitungen; exportierbarer JSON-Auszug mit allen zur Person gespeicherten Feldern |
| **Art. 16** | Berichtigung | Stammdaten durch User selbst editierbar; Buchungsdaten via Korrekturbuchung (nicht Überschreibung) |
| **Art. 17** | Löschung | **Crypto-Shredding** (siehe #6) bei Vorrang Aufbewahrungspflicht; physische Löschung bei Wegfall des Zwecks |
| **Art. 18** | Einschränkung | Status-Flag `processing_restricted`; relevante Verarbeitungen pausieren |
| **Art. 20** | Datenübertragbarkeit | strukturierter Export (JSON + gängige Formate wie CSV); Mandant-Export-Workflow |
| **Art. 21** | Widerspruch | bei direkter Werbung/Profiling; in Harouda kaum einschlägig |
| **Art. 22** | keine automatisierten Einzelentscheidungen | Dokumentenerkennung ist **keine** Einzelentscheidung gem. Art. 22 (nur Vorschlag, menschliche Prüfung Pflicht → siehe Vier-Augen-Prinzip / Confidence-Routing) |

**Verfahrensregeln (Art. 12):**

| Pflicht | Frist / Standard |
|---|---|
| Antwort auf Anfrage | 1 Monat; Verlängerung um 2 Monate bei Komplexität |
| Kosten | grundsätzlich kostenfrei; bei offenbarer Unbegründetheit oder Exzess angemessene Gebühr |
| Form | grundsätzlich elektronisch, wenn elektronisch beantragt |
| Identitätsprüfung | erforderlich, aber nicht überzogen |
| Begründungspflicht | bei Ablehnung: Gründe + Hinweis auf Beschwerderecht |

### Rechtsgrundlage & Standards
- **Art. 12 DSGVO** — allgemeine Informationspflichten + Verfahren
- **Art. 13, 14 DSGVO** — Informationspflichten bei Erhebung
- **Art. 15–22 DSGVO** — die sieben Kernrechte
- **Art. 77 DSGVO** — Beschwerderecht bei Aufsichtsbehörde
- **§ 29 BDSG** — Einschränkungen für Berufsgeheimnisträger (z. B. StB)
- **EDPB-Leitlinien 01/2022** zu Betroffenenrechten

**Verwandte Begriffe:**
- [Crypto-Shredding](#6-löschkonzept--crypto-shredding) — Löschung unter GoBD
- [Verschwiegenheitspflicht](#10-verschwiegenheitspflicht-vs-dsgvo--203-stgb--57-stberg) — Beschränkung der Auskunft
- [DSGVO](./01-grundlagen.md#9-dsgvo)

**Verwendung im Code:**
- **Self-Service-Portal:** `/privacy/my-data` — Login + Identitätsprüfung → Exportformular.
- **Admin-Workflow:** Kanzlei-Admin-Dashboard mit Betroffenenanfragen als Tickets; SLA-Timer; Dokumentations-Pflicht.
- **Event-Log:** jede Rechtsausübung als Event: `DataSubjectRequestReceived`, `DataSubjectRequestFulfilled`, `DataSubjectRequestRejected` mit Begründung.

**Nicht verwechseln mit:**
- **Verbraucherrechte** (BGB, Fernabsatz) — andere Grundlage, ähnlich klingend
- **Einwilligung** (Art. 7) — Voraussetzung für bestimmte Verarbeitungen; nicht selbst ein „Recht"

**Anmerkungen / Edge-Cases:**
- **§ 29 BDSG**: Berufsgeheimnisträger (StB) dürfen Auskunft und Löschung einschränken, wenn sonst die Verschwiegenheit eines Dritten verletzt würde. Komplex — Rücksprache mit Fachanwalt.
- **Identitätsprüfung:** bei Zweifeln Ausweiskopie nachfordern; **nicht** mehr Daten als nötig einfordern.
- **Löschung vs. Sperrung:** bei Aufbewahrungspflicht „Einschränkung der Verarbeitung" statt Löschung — klare UI-Kommunikation an Betroffenen.

---

## 6. Löschkonzept / Crypto-Shredding

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Löschkonzept mit Crypto-Shredding |
| **Synonyme (DE)** | Crypto-Shredding (technisch dominant), Schlüssel-Vernichtung, Cryptographic Erasure, kryptographische Löschung |
| **Arabisch** | خطة الحذف عبر Crypto-Shredding (**تنبيه جوهري**: Crypto-Shredding هو **الأداة التقنية** Technische Umsetzung، وليس الأساس القانوني Rechtsgrund؛ الأساس القانوني للتعامل مع تعارض GoBD/DSGVO يقع في **Art. 17 Abs. 3 lit. b DSGVO** الذي يُعفي من التزام الحذف عندما تكون المعالجة «ضرورية للوفاء بالتزام قانوني» — هنا § 147 AO و § 257 HGB — مقترناً بـ **Art. 18 Abs. 1 lit. b DSGVO** الذي يُلزم بـ **Einschränkung der Verarbeitung** بدلاً من الحذف؛ Crypto-Shredding هو الطريقة التقنية لتنفيذ هذا التقييد بصورة غير قابلة للعكس: البيانات الشخصية تُشفَّر بمفتاح فريد key-per-subject، يُخزَّن في KMS منفصل؛ عند نضوج طلب التقييد، **المفتاح يُدمَّر** ويتحوَّل النص المُشفَّر إلى Chiffrat ohne Entschlüsselungsmöglichkeit؛ النتيجة: 1) التزام الحفظ الضريبي محفوظ لأن البنية والـ Hash-Chain والـ Metadata سليمة 2) حق الشخص في التقييد مُطبَّق تقنياً بطريقة **irreversibel** 3) تُحقَّق مبادئ Datenminimierung Art. 5 Abs. 1 lit. c و Privacy by Design Art. 25؛ الحالة القانونية الراهنة: **DSK و CNIL لم يُصدرا موقفاً صريحاً** بقبول Crypto-Shredding كاستيفاء لـ Art. 17؛ ENISA 2019 «Pseudonymisation techniques» تُصنِّفه كـ starke Pseudonymisierungsmethode، ومشروع EDPB-Guidelines 01/2025 zur Anonymisierung لا يزال قيد الصياغة؛ لذا النهج هنا دفاعي: نُطبِّق Art. 18 قانونياً ونستخدم Crypto-Shredding تقنياً، ولا نُصرِّح بأننا «نحذف» البيانات) |
| **Englisch (Code-Kontext)** | `cryptoShredding`, `keyDestruction`, `keyPerSubject`, `kms` |
| **Kategorie** | Technisches Verfahren zur Umsetzung von Art. 18 DSGVO |
| **Status** | DRAFT |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Architekturmuster, bei dem personenbezogene Daten mit einem **pro-Person einzigartigen Schlüssel** verschlüsselt werden. Die Verschlüsselung erfolgt transparent auf Feld- oder Objektebene; die Schlüssel werden **separat** in einem Key-Management-System (KMS) verwaltet. Wird der Schlüssel vernichtet, ist das Chiffrat ohne Zusatzinformation nicht mehr entschlüsselbar — die Struktur der Aufzeichnung bleibt erhalten, der Inhalt ist faktisch unzugänglich.

> ⚠ **Rechtliche Präzisierung:** Crypto-Shredding ist **technisches Verfahren**, **nicht** Rechtsgrundlage. Es setzt **keine Löschung im Sinne von Art. 17 Abs. 1 DSGVO** um, sondern die **Einschränkung der Verarbeitung** nach **Art. 18 Abs. 1 lit. b DSGVO** — die greift, wenn der Löschpflicht eine Aufbewahrungspflicht entgegensteht (**Art. 17 Abs. 3 lit. b DSGVO**, hier: § 147 AO / § 257 HGB / GoBD).

**Rechtliche Einordnung — die korrekte Kaskade:**

| Schicht | Norm | Rolle |
|---|---|---|
| 1. Ausgangslage | Art. 17 Abs. 1 DSGVO | Betroffener verlangt Löschung |
| 2. Ausnahme greift | **Art. 17 Abs. 3 lit. b DSGVO** | Löschpflicht entfällt, soweit Verarbeitung zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist |
| 3. Konkrete Aufbewahrungspflicht | **§ 147 AO**, **§ 257 HGB**, **GoBD-Rz. 119 ff.** | 6 bzw. 10 Jahre für Buchführungsunterlagen |
| 4. Alternative Pflicht | **Art. 18 Abs. 1 lit. b DSGVO** | statt Löschung: Einschränkung der Verarbeitung |
| 5. Umsetzungsprinzip | Art. 25 DSGVO + Art. 5 Abs. 1 lit. c (Datenminimierung) | Einschränkung technisch robust realisieren |
| 6. **Crypto-Shredding** | technisches Verfahren (keine eigene Norm) | praktische Umsetzung der Einschränkung: Entschlüsselung de facto ausgeschlossen |

**Konsequenz für die Dokumentation gegenüber Aufsichtsbehörden und Mandanten:**
- **NICHT sagen:** *„Wir löschen die Daten mittels Crypto-Shredding."*
- **Sondern sagen:** *„Wir schränken die Verarbeitung nach Art. 18 Abs. 1 lit. b DSGVO ein, da eine Aufbewahrungspflicht nach § 147 AO besteht (Art. 17 Abs. 3 lit. b DSGVO). Die Einschränkung wird technisch durch Schlüssel-Vernichtung (Crypto-Shredding) unumkehrbar umgesetzt; eine Entschlüsselung ist ohne den vernichteten Schlüssel nicht möglich."*

**Das zu lösende Paradox (präzisiert):**

| Pflicht | Anforderung | Reine Umsetzung | Problem |
|---|---|---|---|
| § 147 AO / § 257 HGB | 10 Jahre Unveränderbarkeit der Buchführungsunterlagen | Datenbestand bleibt | — |
| Art. 17 Abs. 1 DSGVO | Löschung auf Antrag | Datenbestand weg | GoBD-Bruch: Hash-Chain kollidiert, Unveränderbarkeit verletzt |
| **Art. 17 Abs. 3 lit. b + Art. 18 Abs. 1 lit. b** | Einschränkung statt Löschung | Datenbestand bleibt, Lesbarkeit aufgehoben | **Auflösung über Crypto-Shredding** |

**Crypto-Shredding als technische Umsetzung von Art. 18:**

```
Vor Einschränkungs-Anordnung:

   personen_daten_encrypted  →  [verschlüsselt mit key_person_X]
   key_store                 →  [key_person_X = a1b2c3...]
                                 ↓ Schlüssel verfügbar → Entschlüsselung möglich

Nach Einschränkungs-Durchsetzung (Art. 18 Abs. 1 lit. b):

   personen_daten_encrypted  →  [verschlüsselt mit key_person_X]  ← BLEIBT (GoBD-konform)
   key_store                 →  [key_person_X VERNICHTET]
                                 ↓ Kein Schlüssel → keine Entschlüsselung
                                 ↓ Daten faktisch unlesbar; Struktur für Betriebsprüfung erhalten
```

**Architektur-Schichten:**

| Schicht | Rolle |
|---|---|
| **Datenfeld-Ebene** | Personenbezogene Felder (Name, Adresse, USt-IdNr. der nat. Person) werden als verschlüsselte Blobs gespeichert |
| **Struktur-Ebene** | Buchungsdaten, Beträge, Datums, Konten bleiben **unverschlüsselt** — weil nicht personenbezogen im engeren Sinn |
| **KMS-Schicht** | separater Dienst (z. B. AWS KMS, HashiCorp Vault, eigener HSM) verwaltet Schlüssel |
| **Pseudonymisierungs-Tabelle** | personen_id ↔ key_id; bei Löschung wird dieser Link gekappt + Schlüssel vernichtet |

**Beispiel — Rechnungs-Speicherung:**

```sql
-- Rechnungskopf bleibt unverschlüsselt (keine personenbezogenen Daten im engeren Sinn)
CREATE TABLE invoices (
  id              UUID PRIMARY KEY,
  mandant_id      UUID NOT NULL,
  rechnungsnummer TEXT NOT NULL,
  datum           DATE NOT NULL,
  betrag_brutto   NUMERIC(19,4) NOT NULL,
  -- FK auf verschlüsselte Empfängerdaten:
  empfaenger_ref  UUID REFERENCES encrypted_persons(id)
);

-- Empfängerdaten verschlüsselt
CREATE TABLE encrypted_persons (
  id            UUID PRIMARY KEY,
  mandant_id    UUID NOT NULL,
  key_id        UUID NOT NULL,           -- Referenz auf KMS
  ciphertext    BYTEA NOT NULL,          -- verschlüsselte PII
  algorithm     TEXT NOT NULL DEFAULT 'AES-256-GCM',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  shredded_at   TIMESTAMPTZ,             -- NULL = aktiv, sonst Löschzeitpunkt
  shred_reason  TEXT                     -- 'user_request' | 'retention_expired'
);

-- KMS-Referenz (der eigentliche Schlüssel liegt NICHT hier, sondern im KMS)
CREATE TABLE encryption_key_refs (
  key_id       UUID PRIMARY KEY,
  kms_key_arn  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL,
  destroyed_at TIMESTAMPTZ                -- Zeitpunkt der Schlüssel-Vernichtung
);
```

### Rechtsgrundlage & Standards (präzisiert)

*Primäre Rechtsgrundlagen (für die Einordnung als Art. 18-Umsetzung):*
- **Art. 17 Abs. 1 DSGVO** — Recht auf Löschung (Ausgangsanspruch)
- **Art. 17 Abs. 3 lit. b DSGVO** — Ausnahme bei rechtlicher Aufbewahrungspflicht (**tragende Norm**)
- **Art. 18 Abs. 1 lit. b DSGVO** — Einschränkung der Verarbeitung als Pflicht-Alternative (**tragende Norm**)
- **Art. 5 Abs. 1 lit. c DSGVO** — Datenminimierung
- **Art. 25 DSGVO** — Privacy by Design als Rechtfertigung der technischen Strenge
- **§ 147 AO, § 257 HGB, GoBD-Rz. 119–142** — deutsche Aufbewahrungspflichten

*Fachliche Referenzen (technisches Verfahren):*
- **NIST SP 800-88 Rev. 1** — Guidelines for Media Sanitization, Abschnitt 2.5: Cryptographic Erase (CE) als anerkanntes Sanitization-Verfahren
- **BSI TR-02102-1** — Kryptographische Verfahren: Empfehlungen und Schlüssellängen
- **FIPS 197** — AES-Spezifikation
- **ENISA — Pseudonymisation techniques and best practices (2019)** — Crypto-Shredding wird als **starke Pseudonymisierungstechnik** behandelt; eine Einordnung als Art. 17-konforme Löschung wird **nicht** getroffen

*Offene Rechtslage — ehrlich dokumentiert:*
- **DSK (Deutsche Datenschutzkonferenz):** kein offizielles Positionspapier zu Crypto-Shredding als Art. 17-Umsetzung (Stand April 2026)
- **CNIL / EDPB:** keine bindende Stellungnahme; EDPB-Guidelines zur Anonymisierung in Arbeit (Draft 01/2025)
- **Deutsche Rechtsprechung:** keine veröffentlichte Entscheidung, die Crypto-Shredding explizit als Löschung nach Art. 17 anerkennt
- **Konsequenz:** die **Art. 18-Einordnung** ist der rechtssichere Pfad; die in manchen Artikeln anzutreffende Darstellung von Crypto-Shredding als „Löschung" ist Abkürzung, die hier bewusst vermieden wird

**Verwandte Begriffe:**
- [Betroffenenrechte Art. 17](#5-betroffenenrechte--art-1223-dsgvo)
- [Hash-Chain](./08-technik-architektur.md#7-hash-chain--audit-log) — bleibt durch Crypto-Shredding intakt
- [CAS](./08-technik-architektur.md#5-content-addressable-storage-cas) — komplementär für Belege
- [Pseudonymisierung vs. Anonymisierung](#7-pseudonymisierung-vs-anonymisierung--art-4-nr-5-dsgvo--erwägungsgrund-26)
- [GoBD](./01-grundlagen.md#1-gobd), [§ 147 AO](./01-grundlagen.md#2-abgabenordnung-ao)

**Verwendung im Code:**
- **KMS-Integration:** AWS KMS (bei Hosting auf AWS/Supabase EU) oder eigenes Vault-Cluster; Schlüssel werden nie in Application-Speicher persistiert.
- **Envelope Encryption:** Data Encryption Key (DEK) pro Person, verschlüsselt durch Key Encryption Key (KEK) im KMS; Performance-Kompromiss zwischen direktem KMS-Zugriff und lokalem DEK-Cache (kurzlebig).
- **Shred-Workflow:**
  ```typescript
  async function cryptoShredPerson(personRef: string, reason: ShredReason): Promise<void> {
    const record = await db.selectOne('encrypted_persons', { id: personRef });

    // 1. KMS-Schlüssel-Vernichtung
    await kms.scheduleKeyDeletion(record.key_id, { pendingWindowDays: 7 });

    // 2. Markierung in Metadata
    await db.update('encrypted_persons', personRef, {
      shredded_at: new Date(),
      shred_reason: reason,
      ciphertext: null  // optional: Ciphertext physisch entfernen
    });

    // 3. Audit-Event (in Hash-Chain)
    await appendEvent({
      eventType: 'PersonDataCryptoShredded',
      payload: { personRef, reason },
      metadata: { user_id: currentUser.id }
    });
  }
  ```
- **7-Tage-Grace-Period:** KMS-Schlüssel-Vernichtung mit verzögerter Wirksamkeit — Sicherheitspuffer gegen versehentliche Löschung.
- **Verifikations-Nachweis:** nach Vernichtung wird ein Fehler-Protokoll bei Entschlüsselungs-Versuch erzeugt; dies dient als positiver Beweis der erfolgten Löschung.

**Nicht verwechseln mit:**
- **Physische Löschung** (DELETE FROM table) — verletzt GoBD bei Buchführungsdaten
- **Soft-Delete** (Flag `deleted_at`) — Daten bleiben lesbar, kein Datenschutz-Effekt
- **Pseudonymisierung** (Art. 4 Nr. 5) — Daten bleiben reversibel mit Zusatzinformation; Crypto-Shredding macht Daten irreversibel

**Anmerkungen / Edge-Cases:**
- **Rechtliche Einordnung in der Kommunikation:** immer als „Einschränkung der Verarbeitung nach Art. 18 DSGVO mit technischer Umsetzung durch Crypto-Shredding" formulieren. Vermeidung der Verkürzung „wir löschen mittels Crypto-Shredding", da diese rechtlich angreifbar ist.
- **Nicht alle Felder sind personenbezogen:** Kontensalden, Buchungstexte, Beträge sind nach h. M. **nicht** personenbezogen im DSGVO-Sinn (es sei denn, sie enthalten identifizierende Details). Crypto-Shredding fokussiert sich auf echte PII.
- **Gemeinsame Schlüssel bei mehreren Personen:** wenn z. B. Ehepartner in einem Datensatz auftauchen — separate Schlüssel pro Person, oder Konservativ-Lösung mit eigenen Datensätzen.
- **Rechtsprechung offen:** deutsche Gerichte haben Crypto-Shredding nicht explizit bestätigt (Stand April 2026); die in diesem Eintrag gewählte Art. 18-Einordnung ist **strategisch defensiv** gewählt, nicht höchstrichterlich abgesichert.
- **Informationspflicht gegenüber Betroffenen (Art. 18 Abs. 3):** vor Aufhebung einer Einschränkung muss der Betroffene informiert werden. In Harouda: dieser Fall tritt nur ein, wenn eine Aufbewahrungspflicht **vor** Ablauf wegfällt (z. B. Betriebsprüfung abgeschlossen, Frist verkürzt) — praktisch selten, dokumentierter Ausnahmeprozess nötig.
- **Bei rechtlicher Auseinandersetzung (Rückfrage Aufsichtsbehörde oder Betroffener):** schriftliches Konzept „Einschränkung der Verarbeitung mittels Crypto-Shredding" vorweisen, das die Rechtskaskade Art. 17 Abs. 3 lit. b → Art. 18 → technische Umsetzung offenlegt.

> 📝 **Offene Frage für Fachanwalt:** Die Einordnung als Art. 18-Umsetzung statt Art. 17-Löschung ist vor erstmaliger Produktivnutzung mit einem **Fachanwalt für IT-Recht / Datenschutzrecht** gegenzuprüfen. Diese Frage ist in `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` zur juristischen Freigabe zu dokumentieren. Bis dahin: **kein Produktiv-Einsatz von Crypto-Shredding ohne juristische Freigabe.**

---

## 7. Pseudonymisierung vs. Anonymisierung — Art. 4 Nr. 5 DSGVO + Erwägungsgrund 26

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Pseudonymisierung vs. Anonymisierung |
| **Synonyme (DE)** | Datenanonymisierung, Datenpseudonymisierung, Identitäts-Maskierung |
| **Arabisch** | إخفاء الهوية الجزئي مقابل الكامل (تمييز قانوني محوري: **Pseudonymisierung** — Art. 4 Nr. 5 — هي «معالجة البيانات الشخصية بطريقة لا يعود معها ممكناً إسناد البيانات إلى شخص محدد بدون استخدام معلومات إضافية» — مثل استبدال الاسم برقم مع احتفاظ بجدول منفصل للـ Mapping؛ هذه البيانات **تبقى شخصية Personenbezogen** وتخضع كلياً لـ DSGVO، فقط مع طبقة أمان إضافية؛ **Anonymisierung** — Erwägungsgrund 26 — هي إزالة كامل الإمكانية لإعادة التعرف، بحيث لا يمكن لأي شخص بأي وسيلة معقولة إعادة ربط البيانات بشخص؛ البيانات المُجهَّلة فعلياً **لا تخضع لـ DSGVO** بتاتاً؛ الاختلاف الصارم: Pseudonym = قابلية استعادة عبر مفتاح ثانوي، Anonymisiert = مستحيلة استعادة؛ Crypto-Shredding يُحوِّل بيانات مُشفَّرة إلى شبه-مُجهَّلة باعتبار أن مفتاح فك التشفير «لم يعد متاحاً بوسيلة معقولة»؛ Statistische Auswertungen على بيانات Mandanten-übergreifend يجب أن تكون مُجهَّلة حصراً — أي Pseudonymisierung لا تكفي) |
| **Englisch (Code-Kontext)** | `pseudonymization`, `anonymization`, `reIdentification`, `kAnonymity` |
| **Kategorie** | Konzept / Rechtliche Unterscheidung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
- **Pseudonymisierung (Art. 4 Nr. 5 DSGVO):** Verarbeitung personenbezogener Daten in einer Weise, auf welche die personenbezogenen Daten **ohne Hinzuziehung zusätzlicher Informationen** nicht mehr einer spezifischen betroffenen Person zugeordnet werden können — sofern diese zusätzlichen Informationen gesondert aufbewahrt werden und technischen und organisatorischen Maßnahmen unterliegen. **Pseudonyme Daten bleiben personenbezogen.**
- **Anonymisierung (Erwägungsgrund 26):** Verarbeitung, die dazu führt, dass die betroffene Person **nicht oder nicht mehr identifizierbar** ist — unter Berücksichtigung aller Mittel, die vom Verantwortlichen oder einer anderen Person **nach allgemeinem Ermessen** wahrscheinlich genutzt werden, um die natürliche Person zu identifizieren. **Anonymisierte Daten fallen nicht mehr unter DSGVO.**

**Gegenüberstellung:**

| Aspekt | Pseudonymisierung | Anonymisierung |
|---|---|---|
| Re-Identifikation | technisch möglich (mit Zusatzinformation) | technisch ausgeschlossen |
| DSGVO-Geltung | ✅ voll | ❌ nicht mehr |
| Beispiel | Name → "Person-ID-17" (mit Mapping-Tabelle) | Alter auf 5-Jahres-Intervall aggregieren + k-Anonymität |
| Typ. Technik | Tokenisierung, Hashing mit Schlüssel, Verschlüsselung | k-Anonymität, l-Diversity, Differential Privacy |
| Rückgängig machbar | ja | nein |
| Einsatz in Harouda | Event-Payload, Logging, Testumgebungen | Cross-Mandant-Statistiken |

**Abgrenzung — wann ist etwas „wirklich anonym"?**

Zentrale Prüffrage (Erwägungsgrund 26): *„Können unter Berücksichtigung aller Mittel, die vernünftigerweise zur Identifikation eingesetzt werden könnten, betroffene Personen bestimmt werden?"*

Faktoren:
- Kosten und Zeitaufwand der Re-Identifikation
- verfügbare Technologie zum Zeitpunkt der Verarbeitung
- technologische Entwicklungen während der Verarbeitungsdauer

**k-Anonymität als Kriterium:** jeder Datensatz ist in einer Gruppe von mindestens `k` Datensätzen mit identischen quasi-identifizierenden Attributen — `k ≥ 5` oft als Richtwert, `k ≥ 20` für sensitive Daten.

### Rechtsgrundlage & Standards
- **Art. 4 Nr. 5 DSGVO** — Pseudonymisierung
- **Erwägungsgrund 26 DSGVO** — Anonymisierung
- **Art. 25 DSGVO** — Pseudonymisierung als Privacy by Design-Maßnahme
- **WP 216** (Art. 29-Gruppe) — Opinion on Anonymisation Techniques
- **EDPB-Leitlinien zur Anonymisierung** (in Arbeit)
- **ISO/IEC 20889** — Privacy enhancing data de-identification techniques

**Verwandte Begriffe:**
- [Crypto-Shredding](#6-löschkonzept--crypto-shredding)
- [TOM Art. 32](#3-technische-und-organisatorische-maßnahmen-tom--art-32-dsgvo) — Pseudonymisierung ist TOM-Empfehlung
- [DSGVO](./01-grundlagen.md#9-dsgvo)

**Verwendung im Code:**
- **Pseudonymisierung in Logs/Telemetrie:** User-IDs werden zu stabilen Pseudonymen gehasht (HMAC-SHA256 mit rotierbarem Pepper); kein Klartext in Logs.
- **Anonymisierung für Cross-Mandant-Analysen:** Aggregation auf Ebene `sum per month`, mit k-Anonymity ≥ 10; Mandanten-Namen entfernt.
- **Testumgebungen:** Produktionsdaten werden vor Übernahme pseudonymisiert (Faker-Library + Pseudonym-Map).

**Nicht verwechseln mit:**
- **Verschlüsselung** — Re-Identifikation mit Schlüssel möglich (quasi Pseudonymisierung)
- **Löschung** — Daten nicht mehr vorhanden; Anonymisierung bedeutet Daten liegen vor, aber ohne Personenbezug

**Anmerkungen / Edge-Cases:**
- **Vermeintliche Anonymisierung ist das häufigste Missverständnis:** Entfernen des Namens reicht nicht — Kombinationen aus Geburtsdatum + PLZ + Geschlecht identifizieren ca. 87 % der US-Bevölkerung eindeutig. Re-Identifizierbarkeit muss mathematisch geprüft werden.
- **Zeitstempel als Quasi-Identifier:** hochauflösende Zeitstempel (Sekundengenauigkeit) können Datensätze eindeutig machen. Aggregation (z. B. auf Tagesebene) reduziert Risiko.
- **Bei Statistiken für Marketing oder Produktentwicklung: DSFA prüfen + externe Beratung konsultieren — Grenze zur De-Facto-Personenbezogenheit leicht überschritten.**

---

## 8. Drittlandtransfer — Art. 44–50 DSGVO

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Drittlandtransfer |
| **Synonyme (DE)** | Datenübermittlung in Drittländer, Datentransfer außerhalb der EU/EWR, Third-Country-Transfer |
| **Arabisch** | نقل البيانات إلى دول ثالثة (نقل بيانات شخصية من EU/EEA إلى دولة خارج الاتحاد الأوروبي والمنطقة الاقتصادية الأوروبية، محكوم بـ Art. 44–50 DSGVO كـ «مستوى ثانٍ من الحماية»؛ القاعدة: لا يُسمح إلا إذا ضمن الدولة المستقبلة مستوى حماية مكافئاً — إما عبر **Angemessenheitsbeschluss** قرار الكفاية من المفوضية الأوروبية Art. 45 — أو عبر **angemessene Garantien** ضمانات مناسبة Art. 46 كـ Standard-Vertragsklauseln SCCs أو Binding Corporate Rules BCR؛ بعد قرار Schrems II عام 2020، نقل البيانات إلى USA أصبح إشكالياً لأن القرار السابق Privacy Shield أُبطل، والبديل Data Privacy Framework 2023 تحت مراجعة؛ في Harouda السياسة الصارمة: **Hosting حصراً في EU** — Supabase eu-central-1 Frankfurt، مزودي Peppol ألمان/أوروبيون، خوادم Backup أوروبية؛ إذا اضطررنا لاحقاً لخدمة Drittland — مثل CDN عالمي — **Transfer Impact Assessment TIA** إلزامي مع تقييم المخاطر القانونية في البلد المستقبل + TOMs إضافية) |
| **Englisch (Code-Kontext)** | `thirdCountryTransfer`, `scc`, `dataResidency`, `adequacyDecision` |
| **Kategorie** | Rechtsrahmen / DSGVO-Pflicht |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Übermittlung personenbezogener Daten an einen Empfänger in einem Land außerhalb des Europäischen Wirtschaftsraums (EU + Island + Liechtenstein + Norwegen). DSGVO Kapitel V (Art. 44–50) regelt, unter welchen Bedingungen solche Transfers zulässig sind: grundsätzlich nur dann, wenn das empfangende Land ein **angemessenes Schutzniveau** bietet oder zusätzliche **Garantien** gewährleistet werden.

**Rechtsgrundlagen für Drittlandtransfer (Hierarchie):**

| Artikel | Grundlage | Harouda-Bewertung |
|---|---|---|
| Art. 45 | **Angemessenheitsbeschluss** der EU-Kommission | z. Z. vorhanden für: Andorra, Argentinien, Kanada (tw.), Färöer, Guernsey, Israel, Isle of Man, Japan, Jersey, Neuseeland, Schweiz, Südkorea, UK, Uruguay, **USA (DPF seit 2023, unter Vorbehalt)** |
| Art. 46 | **Angemessene Garantien** (SCCs, BCRs, Verhaltenskodizes) | Standard für alle anderen Drittländer; erfordert Transfer Impact Assessment |
| Art. 49 | **Ausnahmen für bestimmte Fälle** (Einwilligung, Vertragserfüllung, wichtige Gründe) | nur enge Einzelfälle, nicht systematisch |

**Schrems II-Urteil (EuGH C-311/18) vom 16.07.2020:**
- Privacy Shield (USA) wurde für **ungültig** erklärt
- SCCs bleiben grundsätzlich gültig, aber Verantwortlicher muss im Einzelfall prüfen, ob im Zielland ein „im Wesentlichen gleichwertiger" Schutz **tatsächlich** besteht
- **Transfer Impact Assessment (TIA)** wurde zur Pflichtübung

**Harouda — Data-Residency-Strategie (EU-Only):**

| Infrastruktur-Komponente | Standort | Status |
|---|---|---|
| Supabase-Hosting | Frankfurt (eu-central-1) | EU, kein Transfer |
| Backup-Speicher | eu-central-1 | EU |
| Peppol-Access-Point | DE/AT Dienstleister | EU |
| eIDAS-Zeitstempeldienst | DE (Bundesdruckerei) | EU |
| Support-Tools | EU-Anbieter bevorzugt | EU, auf Drittland zu prüfen |
| Fehler-Monitoring | Sentry EU-Region / self-hosted | EU |

**Bewusst vermieden:**
- Google Analytics (USA) → eigene, DSGVO-konforme Tracking-Lösung (Plausible/Umami, EU-gehostet)
- Cloudflare US-Edges ohne EU-Pendant → EU-only-Modus aktiviert
- US-Saas-Tools (Zendesk, etc.) → europäische Alternativen

**Transfer Impact Assessment (TIA) — bei unvermeidbarem Drittlandtransfer:**

1. Identifikation des Transfers
2. Rechtsgrundlage (meist Art. 46 SCCs)
3. Bewertung der Rechtsordnung des Empfängerlandes
4. Zusätzliche technische Maßnahmen (Verschlüsselung, Pseudonymisierung)
5. Organisatorische und vertragliche Maßnahmen
6. Dokumentation + regelmäßige Neubewertung

### Rechtsgrundlage & Standards
- **Art. 44–50 DSGVO** — Drittlandtransfer
- **Art. 45 DSGVO** — Angemessenheitsbeschluss
- **Art. 46 DSGVO** — Angemessene Garantien
- **Durchführungsbeschluss (EU) 2021/914** — Neue SCCs
- **EuGH C-311/18 Schrems II**
- **EDPB-Leitlinien 05/2021** — Supplementary Measures
- **EU-U.S. Data Privacy Framework** — Durchführungsbeschluss 2023/1795

**Verwandte Begriffe:**
- [AVV](#1-auftragsverarbeitung-avv--28-dsgvo)
- [TOM](#3-technische-und-organisatorische-maßnahmen-tom--art-32-dsgvo)

**Verwendung im Code:**
- **Data-Residency-Check in CI:** automatische Prüfung, dass keine Endpoints außerhalb der EU konfiguriert sind; Pflichtcheck vor Deployment.
- **Sub-Processor-Scanner:** periodische Verifikation (z. B. via IP-Lookup oder Vertragsdokumente), dass alle Endpunkte EU-only bleiben.
- **Mandanten-Transparenz:** Liste aller Datenstandorte in Echtzeit im Mandanten-Dashboard sichtbar.

**Nicht verwechseln mit:**
- **Datentransfer innerhalb der EU** — keine Drittland-Thematik
- **Cloud-Hosting in EU-Region eines US-Unternehmens** — **doch** Drittland-relevant: der CLOUD Act verpflichtet US-Firmen, auch EU-Daten auf US-Behörden-Anfrage herauszugeben. Das ist der Kern des Schrems-II-Urteils.

**Anmerkungen / Edge-Cases:**
- **USA-Konstellation:** Supabase läuft auf AWS eu-central-1; AWS ist US-Unternehmen mit EU-Tochter. Ob CLOUD Act anwendbar bleibt, ist rechtlich umstritten. Mitigation: verschlüsselte Daten + eigene Schlüsselhoheit (BYOK) im KMS.
- **DPF-Status wackelig:** EU-US Data Privacy Framework steht unter Beobachtung; Schrems III-Klage bereits angekündigt. **Konservative Strategie: nicht auf DPF vertrauen, sondern SCCs + TIA als Default.**
- **Bei Erweiterung ins internationale Kanzlei-Geschäft: Full TIA pro Ziel-Drittland, Rücksprache mit Fachanwalt für internationales Datenschutzrecht.**

---

## 9. Datenpanne / Meldepflicht — Art. 33, 34 DSGVO

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Datenpanne / Verletzung des Schutzes personenbezogener Daten |
| **Synonyme (DE)** | Datenschutzverletzung, Data Breach (englisch), Sicherheitsvorfall (im engeren, datenschutzrelevanten Sinn) |
| **Arabisch** | خرق البيانات والتزام الإبلاغ (أي «انتهاك لأمن يُؤدي — عن قصد أو بلا قصد — إلى تدمير، فقدان، تغيير، أو كشف أو وصول غير مُرخَّص إلى بيانات شخصية» — Art. 4 Nr. 12؛ الالتزامات عند حدوث Datenpanne: **Art. 33** الإبلاغ إلى Aufsichtsbehörde — في ألمانيا Landesdatenschutzbehörde — خلال **72 ساعة** من العلم بالخرق، إلا إذا كان الخرق لن يُنتج مخاطر لحقوق الأشخاص؛ **Art. 34** إبلاغ الأشخاص المتضررين مباشرة إذا كان الخرق ينتج مخاطر عالية؛ الـ Auftragsverarbeiter يُبلغ Verantwortlicher «بدون إبطاء» — Art. 33 Abs. 2 — ثم Verantwortlicher يُبلغ السلطة؛ في Harouda خطة Incident-Response معرفة مسبقاً: فريق إطفاء رقمي، قائمة اتصال DPO + Anwalt + Aufsichtsbehörde، Runbook موثَّق، Simulation نصف سنوية؛ عدم الإبلاغ يُعد انتهاكاً بذاته مع غرامات حتى 2% من الإيرادات) |
| **Englisch (Code-Kontext)** | `dataBreach`, `incidentResponse`, `breachNotification`, `72hourRule` |
| **Kategorie** | Prozess / DSGVO-Pflicht |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Verletzung des Schutzes personenbezogener Daten ist „eine Verletzung der Sicherheit, die zur unbeabsichtigten oder unrechtmäßigen Vernichtung, zum Verlust, zur Veränderung, zur unbefugten Offenlegung von oder zum unbefugten Zugang zu personenbezogenen Daten führt, die übermittelt, gespeichert oder auf sonstige Weise verarbeitet wurden" (Art. 4 Nr. 12 DSGVO).

**Drei Kategorien einer Datenpanne:**

| Typ | Beispiel |
|---|---|
| **Vertraulichkeitsverletzung** | unbefugter Zugriff (Hacker, Insider-Angriff) |
| **Integritätsverletzung** | unbefugte Veränderung (Ransomware, Datenkorruption) |
| **Verfügbarkeitsverletzung** | Verlust / Nichtverfügbarkeit (versehentliches Löschen, Ausfall ohne Backup) |

**Meldepflichten — Entscheidungsbaum:**

```
Datenpanne erkannt
        │
        ▼
Risiko für Rechte/Freiheiten?
        │
    ┌───┴───┐
   JA      NEIN
    │       │
    ▼       ▼
Art. 33:   KEINE Meldung,
72h an     aber Dokumentation
Aufsicht   (Art. 33 Abs. 5)
    │
    ▼
Hohes Risiko?
    │
┌───┴───┐
JA     NEIN
│      │
▼      ▼
Art. 34:  STOP (nur Art. 33)
Direkte Info an Betroffene
```

**72-Stunden-Regel (Art. 33):**
- Frist beginnt mit **Kenntnis** des Verantwortlichen (nicht mit Eintritt)
- Auftragsverarbeiter meldet „unverzüglich" an Verantwortlichen
- Bei unvollständigen Informationen: erste Meldung mit vorhandenen Daten, Rest in Stufen nachreichen

**Pflichtangaben Art. 33 Abs. 3 (für Aufsichtsbehörde):**

| Angabe |
|---|
| Art der Datenpanne |
| Kategorien + ungefähre Zahl Betroffener |
| Kategorien + ungefähre Zahl betroffener Datensätze |
| wahrscheinliche Folgen |
| ergriffene oder geplante Maßnahmen |
| Kontakt Datenschutzbeauftragter / zuständige Stelle |

**Pflichtangaben Art. 34 (Direktinformation Betroffener):**
- Klare, einfache Sprache
- Art der Verletzung
- Wahrscheinliche Folgen
- Ergriffene / geplante Maßnahmen
- Empfehlungen für Betroffene zur Risikominimierung
- Kontakt zur weiteren Information

### Rechtsgrundlage & Standards
- **Art. 33 DSGVO** — Meldung an Aufsichtsbehörde (72-h-Regel)
- **Art. 34 DSGVO** — Benachrichtigung betroffener Personen
- **Art. 4 Nr. 12 DSGVO** — Definition der Verletzung
- **EDPB-Leitlinien 9/2022** — Personal Data Breach Notification
- **Art. 83 Abs. 4 lit. a DSGVO** — Bußgelder für Meldeversäumnisse: bis 10 Mio. € / 2 %
- **BSI-Standard 200-4** — Business Continuity Management

**Verwandte Begriffe:**
- [TOM Art. 32](#3-technische-und-organisatorische-maßnahmen-tom--art-32-dsgvo) — prävention
- [AVV](#1-auftragsverarbeitung-avv--28-dsgvo) — regelt Meldepfad im Sub-Processor-Fall
- [Hash-Chain](./08-technik-architektur.md#7-hash-chain--audit-log) — forensische Grundlage

**Verwendung im Code:**
- **Incident-Response-Runbook:** Markdown in `docs/compliance/incident-response/`; definiert Rollen (Incident Commander, Communications Lead, Technical Lead, Legal Lead), Eskalationspfade, Entscheidungsmatrix.
- **Monitoring + Alerting:** automatische Anomalie-Detektion (massenhafte Zugriffe, unerwartete Exports, fehlgeschlagene RLS-Checks) → Sofort-Ticket + Pager-Duty.
- **Incident-Dashboard:** Echtzeit-Übersicht laufender Incidents für Krisen-Team.
- **Meldeformular-Generator:** strukturierte Vorlage für Art. 33-Meldung; generiert PDF + E-Mail für Aufsichtsbehörde in wenigen Minuten.
- **Halbjährliche Simulation:** Tabletop-Exercise mit fiktivem Incident; Ergebnis in TOM-Review dokumentiert.

**Nicht verwechseln mit:**
- **Störung / Ausfall ohne Datenbezug** — fällt unter allgemeine SLA, nicht DSGVO Art. 33
- **Sicherheitsvorfall im engeren IT-Sinn** — manche sind Datenpanne, manche nicht

**Anmerkungen / Edge-Cases:**
- **72 h sind KEINE Ausrede zum Abwarten:** je schneller gemeldet, desto geringer die regulatorische Reaktion. Binnen Stunden ist besser.
- **Verdachtsmomente ≠ Kenntnis:** die Frist beginnt erst mit gesicherter Feststellung; aber Verantwortlicher muss aktiv prüfen.
- **„Risiko" vs. „hohes Risiko"** ist Abwägungsfrage — Zweifelsfall → melden. Nicht-Melden ist regulatorisch gefährlicher als Überreaktion.
- **Insider-Angriffe:** häufigster Typ; Monitoring muss auch legitime User beobachten.
- **Bei Ransomware-Befall: Sofort externen Incident-Response-Dienstleister + Anwalt einschalten; nicht mit Erpressern ohne juristische Begleitung kommunizieren.**

---

## 10. Verschwiegenheitspflicht vs. DSGVO — § 203 StGB + § 57 StBerG

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Verschwiegenheitspflicht (Berufsgeheimnis) vs. DSGVO |
| **Synonyme (DE)** | Berufsgeheimnis, Mandantengeheimnis, Berufliche Schweigepflicht |
| **Arabisch** | التزام السرية المهنية لـ Steuerberater مقابل DSGVO (تداخل قانوني معقد خاص بالـ Berufsgeheimnisträger كالـ StB: **§ 203 StGB** يُجرِّم كشف الأسرار المهنية بالسجن حتى سنة أو غرامة؛ **§ 57 StBerG** يُلزم StB بالـ Verschwiegenheit كالتزام مدني مهني؛ **DSGVO** يُلزم بحماية البيانات الشخصية بشكل عام؛ التفاعل: الـ Mandantengeheimnis **يُضاف** على حماية DSGVO، لا يُحل محلها — كلاهما يُطبَّق بشكل متوازٍ؛ عملياً الـ Verschwiegenheit الجنائية **أشد** من DSGVO — تمتد لمعلومات غير شخصية أيضاً كـ Geschäftsgeheimnisse, Strategien, Umsätze إلخ، ولا تسمح بكشف حتى مع موافقة — إلا للـ Mandant الذي يُعفي؛ في سياق Harouda: 1) Sub-Processors يجب أن يُعتبَروا «موظفين خارجيين» مخولين بالسرية تحت § 203 Abs. 3 StGB — شرط صارم جداً 2) Auskunftsrecht لأشخاص ثالثين قد يُصطدم بـ Mandantengeheimnis ويجب رفضه 3) Sicherheitsbehörden قد لا تصل إلى بيانات الموكل حتى بأوامر قضائية دون شروط مشددة — § 97 StPO Beschlagnahmeverbot) |
| **Englisch (Code-Kontext)** | `professionalSecrecy`, `clientConfidentiality`, `§203StGB` |
| **Kategorie** | Rechtsschnittstelle / Sonderregime |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Berufsspezifische Schweigepflicht, die für bestimmte Berufsgruppen (Steuerberater, Rechtsanwälte, Ärzte, Priester, …) zusätzlich zur allgemeinen DSGVO gilt. Sie ist **strafrechtlich** in § 203 StGB und **standesrechtlich** in § 57 StBerG verankert und umfasst **alle** im Rahmen des Berufsausübung anvertrauten Tatsachen — personenbezogen oder nicht.

**Drei Regelungsebenen im Vergleich:**

| Ebene | Norm | Geltung | Schutzumfang |
|---|---|---|---|
| **DSGVO** | EU-VO | alle Verarbeiter personenbezogener Daten | personenbezogene Daten natürlicher Personen |
| **§ 203 StGB** | Strafrecht | u. a. Steuerberater, Anwälte, Ärzte | **alle** fremden Geheimnisse, auch juristische Personen |
| **§ 57 StBerG** | Standesrecht | Steuerberater | berufliche Angelegenheiten des Mandanten |

**Wesentliche Unterschiede:**

| Aspekt | DSGVO | § 203 StGB / § 57 StBerG |
|---|---|---|
| Geltungsbereich | personenbezogene Daten | alle fremden Geheimnisse |
| Betroffene | natürliche Personen | auch juristische Personen |
| Einwilligung als Rechtfertigung | ja | eingeschränkt (nur Mandanten-Entbindung) |
| Sanktion | Bußgeld (bis 4 % vom Umsatz) | Freiheitsstrafe bis 1 Jahr |
| Weitergabe an Dritte | AVV genügt | zusätzlich § 203 Abs. 3-Voraussetzungen |

**§ 203 Abs. 3 StGB — Einbeziehung „sonstiger mitwirkender Personen":**

Seit der Reform 2017 dürfen Berufsgeheimnisträger Dritte (inkl. IT-Dienstleister, Software-Hersteller) einbinden, **wenn**:
1. die Mitwirkenden **zur Verschwiegenheit verpflichtet** sind
2. die Mitwirkenden **über die Pflichten belehrt** wurden
3. ein Verstoß gegen die Verschwiegenheit **ausdrücklich strafbewehrt** ist
4. die Hinzuziehung zur **ordnungsgemäßen Berufsausübung erforderlich** ist

**§ 203 Abs. 4 StGB — Erforderlichkeit als Architektur-Leitplanke:**

Abs. 4 präzisiert: *„Die Hinzuziehung muss zur Inanspruchnahme einer Tätigkeit nach Absatz 1 erforderlich sein."* Das bedeutet: die Einbeziehung von Harouda in den Verschwiegenheitsbereich des Steuerberaters greift **nur für diejenigen Funktionen**, die für die eigentliche **Berufsausübung** der Steuerberatung objektiv erforderlich sind.

**Konsequenz für das Produkt-Scope — Leitplanken:**

| Modul | Erforderlich für StB-Berufsausübung? | § 203 Abs. 3 anwendbar? |
|---|---|---|
| Doppelte Buchführung, Journal, SKR03/04 | ✅ Kern-Tätigkeit | ja |
| UStVA, E-Bilanz, ELSTER-Schnittstelle | ✅ Kern-Tätigkeit | ja |
| Lohnabrechnung (§ 5 StBerG) | ✅ Kern-Tätigkeit (vereinbarte Tätigkeit) | ja |
| Belegerkennung, CAS, Audit-Log | ✅ technisches Substrat der Kern-Tätigkeit | ja |
| Mandanten-Portal / sichere Kommunikation | ✅ zur Erfüllung der Beratung erforderlich | ja |
| Marketing-Analytik, CRM-Akquise-Tools | ❌ nicht zur Berufsausübung erforderlich | **nein — eigene Rechtsgrundlage nötig** |
| Produktivitäts-Telemetrie für eigene Zwecke | ❌ nicht für den Mandanten | **nein — siehe Eintrag #2 Joint-Controller-Risiko** |
| Cross-Mandant-Benchmarking | ❌ dient nicht dem einzelnen Mandanten | **nein — nur anonymisiert nach #7** |

**Architektur-Leitplanke:** jedes neue Feature wird gegen Abs. 4 geprüft. Features außerhalb der Erforderlichkeit werden entweder (a) nicht eingebaut, (b) nur mit expliziter Mandanten-Einwilligung aktiviert, oder (c) technisch so isoliert, dass sie den § 203-Schutzbereich nicht berühren (eigene Datenbank, eigener Tenant, keine Mandantendaten).

**Harouda-Konsequenzen:**

| Maßnahme | Umsetzung |
|---|---|
| Verschwiegenheitsverpflichtung aller Mitarbeiter | schriftlich bei Einstellung, jährliche Wiederholung |
| Belehrung über § 203 StGB | Pflichtschulung, protokolliert |
| Strafbewehrung intern | arbeitsvertragliche Klausel + Schadensersatz |
| Gleiche Pflicht für Sub-Processors | Klausel in allen AVVs, nicht nur DSGVO-Standardklauseln |
| Dokumentation der Erforderlichkeit | Mandanten-Vertrag bezieht Software-Nutzung ein |
| **Feature-Gate „§ 203-Perimeter"** | jedes Feature im Product-Backlog bekommt Label `inside-203` oder `outside-203`; Letztere brauchen separate rechtliche Prüfung vor Merge |

### Rechtsgrundlage & Standards
- **§ 203 StGB** — Verletzung von Privatgeheimnissen
- **§ 203 Abs. 3 StGB** — Mitwirkende Personen
- **§ 203 Abs. 4 StGB** — Erforderlichkeits-Kriterium für Dritteinbeziehung
- **§ 57 StBerG** — Allgemeine Berufspflichten Steuerberater
- **§ 5 StBerG** — Vorbehaltene / vereinbare Tätigkeiten (Umfang der „Berufsausübung")
- **§ 97 StPO** — Beschlagnahmeverbot
- **§ 53 StPO** — Zeugnisverweigerungsrecht
- **§ 29 BDSG** — Einschränkungen der Betroffenenrechte bei Berufsgeheimnisträgern
- **BVerfG 1 BvR 2606/04** — Verfassungsrang der Schweigepflicht
- **BGH 2 StR 656/13** — Voraussetzungen der Dritteinbeziehung

**Verwandte Begriffe:**
- [Verschwiegenheitspflicht (Grundbegriff)](./01-grundlagen.md#10-verschwiegenheitspflicht)
- [AVV](#1-auftragsverarbeitung-avv--28-dsgvo)
- [Betroffenenrechte](#5-betroffenenrechte--art-1223-dsgvo) — Einschränkung durch § 29 BDSG
- [Steuerberater (StB)](./01-grundlagen.md#6-steuerberater-stb)
- [Mandantenfähigkeit](./08-technik-architektur.md#1-mandantenfähigkeit-multi-tenancy)

**Verwendung im Code:**
- **Sonderfall Auskunft:** bei Art. 15-Anfrage durch Dritten prüfen, ob Mandanten-Geheimhaltung betroffen — ggf. Ablehnung mit Verweis auf § 29 BDSG.
- **Behördenzugriff-Sperre:** technische und organisatorische Vorkehrungen, dass keine direkten Zugriffe durch Strafverfolgungsbehörden ohne rechtlich geprüfte Grundlage möglich sind.
- **Mitarbeiter-Verpflichtung als Prozess:** Onboarding-Workflow enthält § 203 StGB-Belehrung mit Signatur-Pflicht; nicht umgehbar.

**Nicht verwechseln mit:**
- **NDA (Geheimhaltungsvereinbarung)** — vertragliches Instrument, nicht strafbewehrt
- **DSGVO-Vertraulichkeit (Art. 5 Abs. 1 lit. f)** — Teilmenge, nicht deckungsgleich

**Anmerkungen / Edge-Cases:**
- **Konflikt mit BP-Pflichten:** Betriebsprüfung darf nach § 93 AO Auskünfte verlangen — durchbricht Verschwiegenheit teilweise; komplexe Abwägung.
- **Daten-Export bei Mandanten-Wechsel:** Herausgabe an neuen Steuerberater nur mit Mandanten-Einwilligung; direkte Übertragung zwischen Kanzleien rechtlich heikel.
- **Backup-Aufbewahrung nach Mandantenaustritt:** 10 Jahre Aufbewahrungspflicht vs. sofortige Zugriffssperre. Lösung: kryptographische Trennung, Zugriff nur mit dokumentiertem Grund.
- **Bei jedem Ausnahmefall (Polizei-Anfrage, Gerichtsbeschluss, Medien-Anfrage): Rücksprache mit Fachanwalt für Strafrecht + Datenschutzrecht, bevor Daten herausgegeben werden — sonst droht Strafbarkeit nach § 203 StGB für den Steuerberater persönlich.**

---

> **Modul-Footer**
> **Nächstes Modul:** — (letztes Modul) · **Übersicht:** [INDEX.md](./INDEX.md)
> **Terminology-Sprint 1 · Modul 09 · Stand 2026-04-23**
