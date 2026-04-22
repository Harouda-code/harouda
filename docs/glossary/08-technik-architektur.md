# 08 · Technik & Architektur — Multi-Tenancy, Integrität, Revisionssicherheit, Dokumentenfluss

**Inhalt:** Die **querschnittlichen** Architekturentscheidungen, die allen Business-Domänen der Dateien 01–07 als Fundament dienen. Jeder Eintrag in diesem Modul funktioniert als eigenständiger **Architecture Decision Record (ADR)** mit expliziten Trade-offs, der beantwortet: *„Warum diese Entscheidung — und nicht die naheliegendere Alternative?"*.

Die Achse verläuft von der **Infrastruktur-Schicht** (Mandantenfähigkeit, RLS als deren Umsetzung) über die **Datendarstellung** (Decimal für Geld, UTC für Zeit, CAS für Dokumente) und die **Integritätssicherung** (Event-Sourcing, Hash-Chain) bis zu den **Prozess-Schichten** (Vier-Augen-Prinzip) und schließlich den **externen Schnittstellen** (Dokumentenerkennung, Peppol-Netzwerk).

Die **Rechtsgrundlage**-Felder zitieren hier weniger Paragraphen als in den Business-Dateien — stattdessen stehen **GoBD-Randziffern**, **IDW-Standards** (PS 880, PS 261, PS 330), **DSGVO-Artikel** sowie technische Normen (ISO, RFC, PEPPOL BIS) im Vordergrund. Rechtliche Pflichten bleiben präsent (v. a. § 203 StGB, StBerG § 57, § 146 AO, DSGVO Art. 5, 25, 32), aber die **Implementierung** ist das Thema.

Baut auf auf [01-grundlagen.md](./01-grundlagen.md) (GoBD, Mandant, Verschwiegenheitspflicht),
[02-buchhaltung.md](./02-buchhaltung.md) (Buchungssatz, Journal — Event-Substrat),
[04-steuer-meldungen.md](./04-steuer-meldungen.md) (ELSTER, E-Bilanz),
[06-belege-rechnung.md](./06-belege-rechnung.md) (E-Rechnung, XRechnung — Peppol-Transport) und
[07-anlagen-inventur.md](./07-anlagen-inventur.md) (Anlagenverzeichnis, Anlage-Events — typische Event-Sourcing-Domäne).

---

## Inhaltsverzeichnis

1. [Mandantenfähigkeit (Multi-Tenancy)](#1-mandantenfähigkeit-multi-tenancy)
2. [Row-Level Security (RLS)](#2-row-level-security-rls)
3. [Decimal vs. Float (Geldbeträge)](#3-decimal-vs-float-geldbeträge)
4. [UTC in DB / Europe/Berlin in UI](#4-utc-in-db--europeberlin-in-ui)
5. [Content-Addressable Storage (CAS)](#5-content-addressable-storage-cas)
6. [Event-Sourcing](#6-event-sourcing)
7. [Hash-Chain / Audit-Log](#7-hash-chain--audit-log)
8. [Vier-Augen-Prinzip](#8-vier-augen-prinzip)
9. [Dokumentenerkennungs-Pipeline (Self-hosted Vision-Modell)](#9-dokumentenerkennungs-pipeline-self-hosted-vision-modell)
10. [Peppol-Netzwerk / AS4-Routing](#10-peppol-netzwerk--as4-routing)

---

## 1. Mandantenfähigkeit (Multi-Tenancy)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Mandantenfähigkeit |
| **Synonyme (DE)** | Mehrmandantenfähigkeit, Multi-Tenancy (englisch, im Code und Architektur-Dokumentation dominant), Mandanten-Trennung |
| **Arabisch** | قابلية تعدد العملاء (القرار المعماري الأساسي الذي يُمكِّن برنامجاً محاسبياً واحداً من خدمة عملاء متعددين — كل منهم Mandant — على بنية تحتية مشتركة، مع ضمان **عزل كامل** للبيانات بينهم بحيث لا يستطيع مستخدمو عميل رؤية أو التأثير على بيانات عميل آخر؛ يُعتبر الشرط الأول لأي Kanzlei-Software بسبب الالتزامات القانونية لـ § 203 StGB (Verschwiegenheitspflicht) و StBerG § 57 و DSGVO Art. 5 (Datenminimierung, Integrität، Vertraulichkeit)؛ المعماريات الثلاث المعتادة: **Silo** — قاعدة بيانات منفصلة لكل عميل (أعلى عزل، أعلى تكلفة)، **Bridge** — مخطط منفصل لكل عميل داخل DB مشتركة (توازن)، **Pool** — جداول مشتركة مع عمود `mandant_id` وفلترة صارمة (أكفأ، يتطلب RLS محكم)؛ Harouda اختار نموذج Pool مع Supabase RLS كآلية العزل) |
| **Englisch (Code-Kontext)** | `multiTenancy`, `tenantId`, `mandantId` |
| **Kategorie** | Architektur-Prinzip / Cross-Cutting Concern |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Die Fähigkeit einer Anwendung, **mehrere voneinander isolierte Mandanten** gleichzeitig auf gemeinsamer Infrastruktur zu bedienen, wobei jeder Mandant den Eindruck einer **dedizierten Instanz** hat — sowohl funktional (eigene Daten, eigene Konfiguration) als auch rechtlich (**keine Vermischung**, **keine Leakage**).

**Architektur-Modelle im Vergleich:**

| Modell | Datenbank-Trennung | Schema-Trennung | Tabellen-Trennung | Vor- und Nachteile |
|---|---|---|---|---|
| **Silo** (Isolated Tenancy) | Eigene DB pro Mandant | ✓ | ✓ | ✅ Maximale Isolation, einfache Compliance • ❌ Hohe Kosten, komplexe Wartung, Cross-Tenant-Reports schwierig |
| **Bridge** (Separate Schemas) | Gemeinsame DB | Eigenes Schema pro Mandant | ✓ | ✅ Gute Isolation, moderate Kosten • ❌ Schema-Migrationen aufwendig, Backup pro Mandant komplex |
| **Pool** (Shared Tables) | Gemeinsame DB | Gemeinsames Schema | `mandant_id`-Spalte je Tabelle | ✅ Kosteneffizient, einfache Schema-Evolution • ❌ Fehler in Filter-Logik = Datenleck → **RLS als unumgänglicher Schutz** |

**Harouda-Entscheidung: Pool-Modell mit Supabase RLS**

Rationale:
1. **Kostenstruktur für Kanzlei-Anwendung:** typ. 10–500 Mandanten pro Kanzlei-Lizenz — Pool-Modell wirtschaftlich dominant
2. **Schema-Evolution:** zentrale Migrationen, keine Vervielfachung
3. **Cross-Mandant-Auswertungen** (z. B. Kanzlei-weite Übersicht für Steuerberater) werden durch gezielte Policy-Ausnahmen möglich
4. **Supabase/PostgreSQL RLS** liefert ein auf Datenbank-Ebene erzwungenes Filter-System — **deutlich sicherer** als Application-Level-Filter, weil der Filter nicht durch Application-Bugs umgehbar ist

**Rechtsgrundlage & Standards:**
- **§ 203 Abs. 1 Nr. 3 StGB** — Verletzung von Privatgeheimnissen durch Steuerberater; Datenvermischung wäre strafbewehrt
- **§ 57 Abs. 1 StBerG** — Verschwiegenheitspflicht des Steuerberaters
- **Art. 5 Abs. 1 lit. f DSGVO** — „Integrität und Vertraulichkeit"
- **Art. 25 DSGVO** — Privacy by Design
- **Art. 32 DSGVO** — Technische und organisatorische Maßnahmen (TOM)
- **GoBD Rz. 55** — Nachvollziehbarkeit + Trennbarkeit der Aufzeichnungen
- **GoBD Rz. 149** — Zugriffsschutz
- **IDW PS 880** — Erteilung und Verwendung von Softwarebescheinigungen (setzt Mandantentrennung voraus)
- **BSI IT-Grundschutz-Baustein APP.4.3** — Relationale Datenbanken (Mandantentrennung als Anforderung)

**Verwandte Begriffe:**
- [Mandant](./01-grundlagen.md#4-mandant) — der Begriff selbst
- [Row-Level Security (RLS)](#2-row-level-security-rls) — die technische Umsetzung der Mandantentrennung
- [Verschwiegenheitspflicht](./01-grundlagen.md#10-verschwiegenheitspflicht) — rechtliche Grundlage
- [DSGVO](./01-grundlagen.md#9-dsgvo) — Datenschutz-Pflichten
- [Event-Sourcing](#6-event-sourcing) — jedes Event trägt `mandant_id` als ersten Pflicht-Felder
- [Audit-Log](#7-hash-chain--audit-log) — Hash-Chain pro Mandant getrennt

**Verwendung im Code:**
- **DB-Schema-Regel:** jede Tabelle enthält `mandant_id UUID NOT NULL` als erste Nicht-PK-Spalte, mit Index.
  ```sql
  CREATE TABLE journal_entries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id    UUID NOT NULL REFERENCES mandanten(id),
    buchungsdatum DATE NOT NULL,
    -- ...
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_journal_mandant ON journal_entries(mandant_id, buchungsdatum);
  ```
- **JWT-Claim:** bei Login wird `mandant_id` als Custom Claim in das Supabase-Auth-JWT eingebettet (via Auth-Hook). Aus diesem Claim liest RLS den Kontext.
- **Middleware-Validator:** API-Layer prüft bei jedem Request, dass die `mandant_id` im Request-Payload mit der `mandant_id` im JWT übereinstimmt (zweite Verteidigungslinie zusätzlich zu RLS).
- **Kanzlei-Admin-Rolle:** speziell für Steuerberater, der mehrere Mandanten betreut — seine Rolle umfasst eine Liste erlaubter `mandant_id`s; RLS-Policy prüft Zugehörigkeit zu dieser Liste.
- **Testing:** automatisierte Tests mit zwei Testmandanten + Versuch der Cross-Tenant-Zugriffe → **muss fehlschlagen**. Test ist Teil der CI-Pflichtprüfung.
- **Seed-Daten:** Demo-Mandant `00000000-0000-0000-0000-000000000000` für lokale Entwicklung; Produktions-DB darf diese UUID **nicht** enthalten.

**Nicht verwechseln mit:**
- **Multi-User-System** — ein einzelner Mandant kann viele User haben; Mandantentrennung ist orthogonal dazu
- **Multi-Instance-Deployment** — separate Instanzen pro Kunde (≈ Silo-Modell); heutige Cloud-Architekturen erreichen Multi-Tenancy im Pool-Modus
- **Rollenbasierte Zugriffskontrolle (RBAC)** — innerhalb eines Mandanten; ergänzt Mandantenfähigkeit, ersetzt sie nicht
- **Sharding** — horizontale Datenbank-Skalierung; kann mit Multi-Tenancy kombiniert werden, ist aber eigenständig
- **White-Label** — UI-Personalisierung pro Kunde; nicht Datentrennung

**Anmerkungen / Edge-Cases:**
- **RLS ist der Single Point of Failure:** fehlerhafte Policies = System-weites Datenleck. Policy-Änderungen müssen durch Code-Review + Sicherheits-Review. Eine Pull-Request mit RLS-Änderungen sollte zwei Reviewer erfordern.
- **`service_role`-Bypass:** Supabase liefert eine `service_role`-Key, die RLS umgeht. Diese **niemals** in Client-Code einbetten. Nur für Admin-Scripte und Edge Functions mit striktem Scope.
- **Cross-Mandant-Reports:** für Kanzlei-Dashboards. Lösung via dedizierte `kanzlei_mandanten_view` mit eigener Policy, nicht durch Bypass.
- **Datenexport GDPdU/Z3:** Exporte pro Mandant isoliert; kein Mandant darf in fremden Export geraten.
- **Backup-/Restore-Strategie:** Point-in-Time-Recovery trifft **alle** Mandanten gleichzeitig → bei Mandanten-spezifischem Fehler ist ein logischer Restore (nur den einen Mandanten) komplex. Lösung: Event-Sourcing (#6) erlaubt Replay eines Mandanten-Event-Streams.
- **Mandanten-Migration (Übergabe an andere Kanzlei):** Ex- und Re-Import muss vollständig, revisionssicher und mit Hash-Verifikation erfolgen — eigener Workflow, nicht spontan.
- **Löschung eines Mandanten:** DSGVO-konform, aber unter Wahrung von § 147 AO (10 Jahre Aufbewahrung). Lösung: Soft-Delete + Pseudonymisierung der personenbezogenen Felder, nicht Hard-Delete.
- **Bei Neuaufbau des Systems oder bei Migration von Legacy-Software: Mandantentrennung muss Priorität 0 in der Test-Suite haben** — Security-Review mit externem Audit empfohlen.

---

## 2. Row-Level Security (RLS)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Row-Level Security |
| **Synonyme (DE)** | RLS (Abkürzung, im Code und UI dominant), Zeilen-basierte Zugriffssteuerung, Reihen-Sicherheit (selten) |
| **Arabisch** | أمان على مستوى الصف (آلية أمان قاعدة البيانات المتكاملة في PostgreSQL — وتاليها في Supabase — التي تفرض قيود الوصول على كل صف Row بشكل منفرد بناءً على **سياسات** Policies تُعرَّف مرة واحدة على مستوى الجدول وتُطبَّق تلقائياً على كل استعلام — SELECT, INSERT, UPDATE, DELETE — يقوم به أي مستخدم؛ في Harouda الآلية الأساسية لـ Mandantenfähigkeit — كل جدول يُفعَّل به RLS، وكل policy تتحقق من تطابق `mandant_id` في الصف مع `mandant_id` المُضمَّن في JWT الخاص بالمستخدم؛ الفرق الجوهري عن التصفية على مستوى التطبيق Application-Level-Filtering: RLS يُفرَض على مستوى Datenbank-Engine ذاته ولا يمكن تجاوزه حتى بخطأ برمجي، لأن DB ذاته يُلغي الصفوف غير المسموح بها قبل إعادتها) |
| **Englisch (Code-Kontext)** | `rowLevelSecurity`, `rls`, `policy` |
| **Kategorie** | Architektur-Mechanismus / Datenbank-Feature |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Deklaratives Zugriffssteuerungsmodell in PostgreSQL (und darauf aufbauenden Systemen wie Supabase), das **pro Tabelle aktivierbar** ist und **Policies** — SQL-Ausdrücke mit `USING`- und `WITH CHECK`-Klauseln — an jede Query transparent anhängt. RLS wird **in der Datenbank-Engine selbst** durchgesetzt, nicht in der Anwendung — dies ist der fundamentale Sicherheitsvorteil gegenüber Application-Level-Filtern.

**Kern-Mechanik:**

```sql
-- 1. RLS auf Tabelle aktivieren (Standardfall: alles verboten, bis Policy erlaubt)
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 2. SELECT-Policy: Lesen nur des eigenen Mandanten
CREATE POLICY mandant_read_own ON journal_entries
  FOR SELECT
  USING (mandant_id = (auth.jwt() ->> 'mandant_id')::uuid);

-- 3. INSERT-Policy: Schreiben nur mit eigener mandant_id
CREATE POLICY mandant_insert_own ON journal_entries
  FOR INSERT
  WITH CHECK (mandant_id = (auth.jwt() ->> 'mandant_id')::uuid);

-- 4. UPDATE-Policy: nur eigene Zeilen ändern, mandant_id unveränderlich
CREATE POLICY mandant_update_own ON journal_entries
  FOR UPDATE
  USING (mandant_id = (auth.jwt() ->> 'mandant_id')::uuid)
  WITH CHECK (mandant_id = (auth.jwt() ->> 'mandant_id')::uuid);
```

**`USING` vs. `WITH CHECK`:**

| Klausel | Wirksam bei | Bedeutung |
|---|---|---|
| `USING` | SELECT, UPDATE, DELETE | Welche **bestehenden** Zeilen sind für die Operation sichtbar/änderbar? |
| `WITH CHECK` | INSERT, UPDATE | Welche **neuen/geänderten** Werte sind zulässig? (Verhindert z. B. Ändern der `mandant_id` in fremde) |

**Beide Klauseln** werden bei `UPDATE` evaluiert: `USING` filtert die änderbaren Zeilen, `WITH CHECK` prüft die resultierenden Werte.

**Harouda-Policy-Struktur pro Tabelle (Standard-Template):**

```sql
-- Immer 4 Policies pro Geschäftstabelle:
CREATE POLICY tablename_select ON tablename FOR SELECT USING (mandant_match);
CREATE POLICY tablename_insert ON tablename FOR INSERT WITH CHECK (mandant_match);
CREATE POLICY tablename_update ON tablename FOR UPDATE USING (mandant_match) WITH CHECK (mandant_match);
CREATE POLICY tablename_delete ON tablename FOR DELETE USING (mandant_match);

-- Wiederverwendbarer Ausdruck:
-- mandant_id = (auth.jwt() ->> 'mandant_id')::uuid
-- OR mandant_id = ANY (SELECT mandant_id FROM kanzlei_mandanten WHERE user_id = auth.uid())
```

**Rechtsgrundlage & Standards:**
- **Art. 32 Abs. 1 lit. b DSGVO** — „Fähigkeit, Vertraulichkeit, Integrität, Verfügbarkeit auf Dauer sicherzustellen" → RLS ist ein unmittelbarer Baustein
- **Art. 25 Abs. 2 DSGVO** — „Privacy by Default" → erst erlauben, was nötig ist
- **GoBD Rz. 149** — Zugriffsschutz / Berechtigungskonzept
- **IDW PS 330** — Abschlussprüfung bei Einsatz von IT (Berechtigungskonzept prüfungspflichtig)
- **BSI IT-Grundschutz APP.4.3** — RDBMS-Härtung
- **PostgreSQL-Dokumentation** — [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- **Supabase-Dokumentation** — Row Level Security

**Verwandte Begriffe:**
- [Mandantenfähigkeit](#1-mandantenfähigkeit-multi-tenancy) — der Zweck, dem RLS in Harouda primär dient
- [Event-Sourcing](#6-event-sourcing) — Event-Tabelle ebenfalls RLS-geschützt
- [Audit-Log](#7-hash-chain--audit-log) — RLS schützt auch den Audit-Log
- [DSGVO](./01-grundlagen.md#9-dsgvo) — Compliance-Rahmen

**Verwendung im Code:**
- **Migration-Konvention:** jede Tabelle erhält beim Anlegen automatisch die 4 Standard-Policies (über ein Supabase-Migration-Template).
  ```sql
  -- supabase/migrations/000_rls_template.sql
  -- Funktionen zum bequemen Erstellen:
  CREATE OR REPLACE FUNCTION apply_mandant_rls(table_name text) RETURNS void AS $$
  BEGIN
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('CREATE POLICY %I_s ON %I FOR SELECT USING (mandant_id = current_mandant())', table_name, table_name);
    -- ... weitere Policies
  END $$ LANGUAGE plpgsql;
  ```
- **Helper-Funktion `current_mandant()`:**
  ```sql
  CREATE OR REPLACE FUNCTION current_mandant() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT (auth.jwt() ->> 'mandant_id')::uuid $$;
  ```
- **Bypass nur bei Edge Functions mit service_role:**
  ```ts
  const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  // Nur für Systemoperationen: Backups, Migration, Audit-Reports
  ```
- **Policy-Tests:** automatisierte Tests mit zwei fiktiven `mandant_id`s versuchen Cross-Access — erwarteter Fehler: leeres Ergebnis oder `new row violates row-level security policy`.
- **Performance-Optimierung:** jede RLS-Policy-Bedingung wird Teil jedes Query-Plans → Index auf `mandant_id` als erste Spalte in Compound-Indizes.
- **Auditing:** Policy-Änderungen werden durch PostgreSQL-DDL-Audit-Extensions (`pgaudit`) protokolliert.

**Nicht verwechseln mit:**
- **Grant / Revoke** (Spaltenebene-Rechte) — gröber, kein zeilenbasiertes Filtern
- **Views mit WHERE-Klauseln** — Application-Level-Filter, durch direkten Tabellen-Zugriff umgehbar
- **Column-Level Security** — schützt Spalten, nicht Zeilen (z. B. PII-Verstecken); ergänzend, nicht ersetzend
- **ACL (Access Control List) auf OS-Ebene** — Betriebssystem-Kontext
- **Supabase RLS vs. eigenes Policy-Framework** — Supabase baut auf nativem PostgreSQL-RLS auf; keine Alternative, sondern direkte Nutzung

**Anmerkungen / Edge-Cases:**
- **RLS gilt NICHT für `BYPASSRLS`-Rollen:** Superuser und Rollen mit `BYPASSRLS`-Attribut ignorieren Policies. `service_role` hat dieses Attribut.
- **Performance-Kosten:** bei komplexen Policies (mehrere JOINs) kann Query-Planer suboptimale Pläne erzeugen. Regel: Policies so einfach wie möglich halten; komplexe Zugriffslogik in Views kapseln, die selbst SECURITY INVOKER sind.
- **Foreign-Key-Constraints & RLS:** eine FK-Prüfung beim INSERT kann fehlschlagen, wenn der referenzierte Datensatz durch RLS ausgeblendet ist — selbst wenn er physisch existiert. Lösungsansatz: FK-Checks bei Mandanten-übergreifenden Stammdaten via SECURITY DEFINER-Funktionen.
- **Supabase Realtime und RLS:** Realtime-Subscriptions werden ebenfalls durch RLS gefiltert — aber nur für **authentifizierte** Clients. Anonymous ohne gültiges JWT erhält keine Events von geschützten Tabellen.
- **Multi-Mandanten-User (Kanzlei-Admin):** der JWT-Claim `mandant_id` ist zu starr. Alternative: Claim `allowed_mandants: uuid[]` + Policy `mandant_id = ANY ((auth.jwt() ->> 'allowed_mandants')::uuid[])`. Aktiver Mandanten-Kontext wird Request-weise gewählt.
- **Migrations-Fenster:** beim Aktivieren von RLS auf bestehender Tabelle **zuerst Policies erstellen**, dann RLS aktivieren — sonst wird die Tabelle kurz unerreichbar.
- **Bei Policy-Änderungen ist ein Security-Review Pflicht.** Fehlerhafte RLS-Policies sind die häufigste Ursache von Datenlecks in Supabase-Anwendungen.

---

## 3. Decimal vs. Float (Geldbeträge)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Decimal (für Geldbeträge) |
| **Synonyme (DE)** | Festkomma-Arithmetik, Dezimal-Darstellung, exakte Arithmetik (im Gegensatz zu Gleitkomma) |
| **Arabisch** | الأرقام العشرية الدقيقة للمبالغ المالية (القاعدة المعمارية الحديدية في Harouda: **يُحظَر حظراً مطلقاً** استخدام أنواع Gleitkomma — Float, Double, JavaScript `number` الأصلي — لتمثيل Geldbeträge في أي طبقة من المشروع — DB أو Backend أو Frontend أو حتى في الـ JSON payloads؛ السبب الرياضي: معيار IEEE 754 الذي يُصمَّم عليه Float/Double يستخدم نظاماً ثنائياً لا يستطيع تمثيل كسور عشرية بسيطة كـ 0.1 أو 0.2 بدقة تامة، مما يُنتج أخطاء تراكمية — مثل الشهيرة `0.1 + 0.2 = 0.30000000000000004` — تُخرِّب مصداقية Buchführung المحاسبية؛ البديل: PostgreSQL `NUMERIC(19,4)` للتخزين — 19 رقم إجمالي، 4 أرقام عشرية دقيقة لـ Rundungspuffer ضد أخطاء التدوير، TypeScript `Decimal.js` أو `BigDecimal` أثناء الحسابات، String-Serialisierung في JSON لمنع تحويل تلقائي لـ `number`؛ القرار متطلب قانوني غير مباشر بموجب GoBD Rz. 50 — Nachvollziehbarkeit — و HGB § 239 Abs. 2 — Vollständigkeit und Richtigkeit der Buchungen) |
| **Englisch (Code-Kontext)** | `decimal`, `Decimal`, `BigDecimal`, `numeric`, `moneyValue` |
| **Kategorie** | Architektur-Prinzip / Datentyp-Entscheidung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Architektonische Grundregel, dass alle **monetären Werte** — Geldbeträge, Preise, Steuerbeträge, Buchungsbeträge — ausschließlich in **festkomma-genauen Datentypen** (Decimal / NUMERIC) dargestellt werden, **niemals** in Gleitkomma-Typen (Float, Double, JavaScript-nativer `number`). Die Entscheidung ergibt sich aus einer mathematischen Grenze des IEEE-754-Standards und einer rechtlichen Pflicht zur exakten, nachprüfbaren Buchführung.

**Das IEEE-754-Problem — warum Float verboten ist:**

```javascript
// Klassisches Float-Phänomen in JavaScript
0.1 + 0.2                    // → 0.30000000000000004
0.1 + 0.2 === 0.3            // → false !!

// In der Praxis:
let rechnung = 0;
for (let i = 0; i < 10; i++) rechnung += 0.1;
console.log(rechnung);       // → 0.9999999999999999 statt 1.0

// Konsequenz:
// Eine Rechnung mit 10 Posten à 0,10 € summiert auf 0,9999... €
// Rundung ergibt 1,00 €, aber interne Darstellung ist unterschiedlich
// → Reproduzierbarkeits-Problem, GoBD-Verstoß
```

Die Ursache: das Binärsystem kann `0.1` (dezimal) nicht exakt darstellen; es entsteht eine periodische Binärdarstellung, die gerundet wird. Fehler pro Operation sind winzig (~10⁻¹⁶), aber kumulieren und werden bei Vergleichen, Summen und Divisionen sichtbar.

**Die Lösung — Dezimal-Darstellung:**

| Schicht | Typ | Beispiel |
|---|---|---|
| **PostgreSQL (Supabase)** | `NUMERIC(19,4)` | `SELECT 0.1::numeric + 0.2::numeric;` → `0.3` (exakt) |
| **TypeScript Backend** | `Decimal` (aus `decimal.js`) | `new Decimal('0.1').plus('0.2').toString()` → `'0.3'` |
| **TypeScript Frontend** | `Decimal` (aus `decimal.js`) | gleiche Bibliothek im Monorepo, geteilte Money-Type-Definitionen |
| **JSON-Serialisierung** | **String, nicht number** | `{ "betrag": "123.4500" }` statt `{ "betrag": 123.45 }` |
| **UI-Darstellung** | formatiert nach Locale | `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })` |

**Warum `NUMERIC(19,4)` als DB-Standard:**

- **19 Stellen Gesamtpräzision:** erlaubt Beträge bis ca. 10¹⁵ € — astronomisch hoch, zukunftssicher
- **4 Nachkommastellen:** zwei mehr als Euro-Cent (2 Stellen) — **Rundungspuffer** für Zwischenberechnungen (Steuern, Umsatzsteuerausweise, Umrechnungen)
- **Vor der Ausgabe an UI/Reports:** Rundung auf 2 Stellen nach kaufmännischen Regeln (Half-Up) oder Bankers-Rounding (Half-to-Even, nach ISO 80000-1)

**Money-Value-Object (Domain-Driven-Design-Muster):**

```typescript
// src/domain/shared/money.ts
import { Decimal } from 'decimal.js';

export class Money {
  private readonly amount: Decimal;
  public readonly currency: Currency;

  constructor(amount: Decimal | string | number, currency: Currency = 'EUR') {
    // number nur für Konstanten erlauben, nicht für berechnete Werte!
    this.amount = new Decimal(amount);
    this.currency = currency;
  }

  plus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount.plus(other.amount), this.currency);
  }

  minus(other: Money): Money { /* ... */ }
  times(factor: Decimal | string): Money { /* ... */ }

  toBuchungsString(): string {
    return this.amount.toFixed(2);  // Rundung auf Cent
  }

  toStorage(): string {
    return this.amount.toFixed(4);  // volle Präzision für DB
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs. ${other.currency}`);
    }
  }
}
```

**Rechtsgrundlage & Standards:**
- **§ 239 Abs. 2 HGB** — „Die Eintragungen in Büchern und die sonst erforderlichen Aufzeichnungen müssen vollständig, richtig, zeitgerecht und geordnet vorgenommen werden." → **Richtigkeit** schließt Float-Ungenauigkeit aus
- **§ 146 Abs. 1 AO** — gleichlautende Anforderung steuerrechtlich
- **GoBD Rz. 50** — Nachvollziehbarkeit + Nachprüfbarkeit; Reproduzierbarkeit der Buchungsresultate
- **GoBD Rz. 58** — Unveränderbarkeit; Float-basiertes System kann unbemerkt unterschiedliche Werte produzieren
- **IEEE 754-2019** — die Norm, die das Problem verursacht
- **ISO/IEC/IEEE 60559** — internationale Adaption
- **ISO 80000-1** — kaufmännisches Runden / Banker's Rounding
- **BFH I R 1/16 vom 20.03.2017** — Anforderungen an GoBD-konforme Berechnungs-Genauigkeit (indirekt)

**Verwandte Begriffe:**
- [GoBD](./01-grundlagen.md#1-gobd) — Rahmen für Nachvollziehbarkeit
- [Doppelte Buchführung](./02-buchhaltung.md#1-doppelte-buchführung) — Soll/Haben-Gleichheit ist nur exakt prüfbar, wenn Decimal
- [Buchungssatz](./02-buchhaltung.md#7-buchungssatz) — Betrag-Feld stets Decimal
- [Event-Sourcing](#6-event-sourcing) — Events enthalten Beträge als Decimal-Strings

**Verwendung im Code:**
- **Lint-Regel im Monorepo:** keine rohen `number`-Typen für monetäre Felder zulässig; TypeScript-Type-Aliasse `Money` oder `Decimal` sind Pflicht. Erzwungen via ESLint-Rule + Code-Review-Checkliste.
- **Supabase-Schema:**
  ```sql
  CREATE DOMAIN money_amount AS NUMERIC(19, 4)
    CHECK (VALUE >= -999999999999999.9999 AND VALUE <= 999999999999999.9999);

  CREATE TABLE journal_entries (
    -- ...
    betrag      money_amount NOT NULL,
    soll_haben  soll_haben_enum NOT NULL
    -- ...
  );
  ```
- **JSON-Serialisierung:** eigene Jackson/Zod-Serializer wandeln `Decimal` ↔ String:
  ```typescript
  const moneySchema = z.string()
    .regex(/^-?\d+\.\d{1,4}$/)
    .transform((v) => new Decimal(v));
  ```
- **Rundungs-Regel im Kontext:**
  - **Bei UI-Anzeige:** Half-Up auf 2 Nachkommastellen (`Decimal.ROUND_HALF_UP`)
  - **Bei Steuerberechnung gem. § 11 Abs. 1 UStG:** ebenfalls kaufmännisch, auf Cent
  - **Bei Zwischenberechnungen:** nicht vorzeitig runden — erst am Ende
- **Test-Suite:** Property-based Tests mit fast-check: `(a, b) => decimalSum(a, b) === manualSum(a, b)` über Tausende Zufallswerte.
- **Migration bestehender Daten:** Legacy-Float-Werte aus Altsystem-Importen werden bei Aufnahme in Decimal konvertiert + gegen erwartete Summen geprüft (`sum_check`-Spalte); Differenzen werden als Migrations-Korrekturen protokolliert.

**Nicht verwechseln mit:**
- **Integer für Cents** — alternative Lösung („alles in Cent speichern"). Funktioniert für ganze Cents, versagt bei Steuerberechnungen mit 3–4 Nachkommastellen. **Decimal ist robuster.**
- **BigInt** — JavaScript-nativer Typ für große Ganzzahlen; kein Nachkomma-Support
- **String-Arithmetik** — Addition per Stringmanipulation; fehleranfällig, nicht empfohlen
- **`Number.EPSILON`-Vergleiche** — Workaround für Float-Vergleiche; ungeeignet für Geld
- **Dezimal-String-Format im Frontend** vs. **echter Decimal-Typ** — ein `string "123.45"` ist nicht derselbe Schutz wie ein `Decimal`-Objekt mit Methoden

**Anmerkungen / Edge-Cases:**
- **JavaScript-Fallstricke:** ein versehentliches `parseFloat(moneyString)` oder `Number(moneyString)` hebelt die gesamte Decimal-Strategie aus. Lint muss dies blocken.
- **Arithmetische Gesetze:** mit Decimal gelten Assoziativität und Kommutativität **exakt** — im Gegensatz zu Float. Testannahmen `(a+b)+c === a+(b+c)` gelten nur mit Decimal.
- **Division und Periodizität:** `1 / 3 = 0.3333...` — periodisch, nicht abschließbar. Dezimal-Bibliothek rundet nach eingestellter Präzision (default 20 Stellen). Bei Geld-Divisionen (Skonti, Quoten) bewusst auf 4 Stellen runden und Restzuweisung dokumentieren (z. B. letztem Empfänger zurechnen).
- **Auslandswährungen / Kryptowährungen:** BTC hat 8 Nachkommastellen (Satoshi), ETH hat 18 (Wei). Harouda nutzt für FX-Berechnungen `NUMERIC(38, 18)` als erweiterten Typ; Alltagsgeld bleibt bei `NUMERIC(19, 4)`.
- **Supabase/PostgreSQL-JS-Client:** der `@supabase/supabase-js`-Client liefert NUMERIC standardmäßig **als String**, nicht als number — das ist korrekt. NIE mit `Number()` umwandeln.
- **Excel-Exporte:** Excel rundet bei Float-Imports verdeckt. Beim Export immer als **Text-Spalte** mit führendem `'` oder als echte Dezimalzahl mit expliziter Formatvorlage.
- **E-Rechnung / XRechnung:** Die EN-16931-Spezifikation verlangt Beträge auf **2 Nachkommastellen** (Ausnahme: Einzelpreise können 4 Stellen haben). Vor dem Export: Rundung + Validierung.
- **Verstöße gegen diese Regel sind System-kritisch** — ein einziges `parseFloat` in einer Berechnungskette kann Bilanzsummen um Cent-Beträge verschieben und GoBD-Konformität bedrohen. Code-Reviews haben Null-Toleranz.

---

## 4. UTC in DB / Europe/Berlin in UI

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | UTC in DB / Europe/Berlin in UI |
| **Synonyme (DE)** | Zeitzonen-Schichtenmodell, Timestamp-Konvention, Berlin-UTC-Layering (projektintern) |
| **Arabisch** | توحيد التوقيت في قاعدة البيانات مع التحويل المحلي في واجهة الاستخدام (قاعدة معمارية طبقية: كل timestamps في الـ DB تُخزَّن بتوقيت UTC — Coordinated Universal Time — بدون منطقة زمنية محلية، بينما التحويل إلى منطقة Europe/Berlin يحدث في **طبقة العرض** — Frontend أو Report-Engine — فقط؛ السبب الرئيسي: **الاستقرار الزمني** — فـ UTC لا يتأثر بـ تحويل التوقيت الصيفي/الشتوي Sommerzeit/Winterzeit، بينما Europe/Berlin تتغير مرتَين في السنة عند DST-Wechsel مما يُنتج ساعات مكررة أو مفقودة؛ التخزين بـ UTC يضمن ترتيباً زمنياً أحادياً ومنطقياً للأحداث، وهو متطلب لـ GoBD Rz. 107 Zeitgerechtheit، ويُبسِّط الفارق مع المستخدمين الدوليين أو Betriebsprüfung عابرة الحدود؛ PostgreSQL نوع `TIMESTAMPTZ` يُفرَض في كل الجداول، TypeScript libraries مثل `date-fns-tz` أو `luxon` تتولى تحويل العرض؛ **استثناء مهم**: التواريخ المحاسبية الحتمية — Bilanzstichtag, Buchungsdatum — تُخزَّن كـ `DATE` بسيط بدون timestamp لأنها مرتبطة بالتقويم وليس بلحظة زمنية) |
| **Englisch (Code-Kontext)** | `utc`, `timestamptz`, `europeBerlin`, `timeZone` |
| **Kategorie** | Architektur-Prinzip / Zeit-Management |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Schichten-Prinzip für die Behandlung von **Zeitstempeln**: Die **Datenbank-Schicht** speichert alle Zeitstempel ausschließlich in **UTC** (Universal Coordinated Time); die **Anwendungs-Logik** arbeitet ebenfalls mit UTC-Instanzen; die **Darstellungsschicht** (UI, Berichte, Exporte) konvertiert erst bei der Präsentation in die **Benutzerschicht** — bei Harouda durchgehend `Europe/Berlin`. Die Trennung eliminiert DST-bedingte Anomalien (doppelte oder fehlende Stunden) im Datenbestand und liefert monotone Zeitreihen.

**Warum UTC in DB:**

| Problem bei lokaler Zeitzone in DB | Lösung durch UTC-Pflicht |
|---|---|
| Sommer-/Winterzeit-Umstellung: letzter Sonntag im März (Uhr springt 02:00 → 03:00), letzter Sonntag im Oktober (02:00 → 01:00 = **doppelte Stunde**) | UTC hat keine DST; 02:30 existiert jeden Tag eindeutig |
| Sortierung nach Zeitstempel bricht an DST-Tagen | Monotone Sortierung in UTC stets korrekt |
| Datenmigration / internationale Standorte | UTC ist global referenzierbar |
| Legacy-Server-Wechsel (Zeitzone des Servers ändert sich) | UTC ist serverunabhängig |
| Berechtigungs-Prüfungen mit Zeitstempel | UTC verhindert Umgehung durch DST-Sprünge |

**PostgreSQL-Typ-Entscheidung:**

| Typ | Empfehlung | Anmerkung |
|---|---|---|
| `TIMESTAMP WITH TIME ZONE` (TIMESTAMPTZ) | ✅ **Standard** | Speichert intern in UTC, interpretiert Input gemäß Session-TimeZone — `SET TIME ZONE 'UTC'` als Sitzungsstandard |
| `TIMESTAMP WITHOUT TIME ZONE` | ❌ Vermeiden | Keine Zeitzonen-Semantik — irreführend |
| `DATE` | ✅ für Kalenderdaten | Bilanzstichtag, Buchungsdatum, Geburtsdatum — **keine** Uhrzeit |
| `TIME WITH TIME ZONE` | ❌ Vermeiden | PostgreSQL-Doku rät selbst ab |
| `INTERVAL` | ✅ bei Bedarf | Zeiträume, Nutzungsdauer in Monaten |

**Trennung `TIMESTAMPTZ` vs. `DATE` — entscheidend in Buchhaltung:**

| Feld | Typ | Warum |
|---|---|---|
| `created_at` (Systemmetadata) | `TIMESTAMPTZ` | exakter Zeitpunkt der Erfassung |
| `updated_at` | `TIMESTAMPTZ` | exakter Zeitpunkt der Änderung |
| `buchungsdatum` (fachlich) | `DATE` | Kalenderdatum im Sinne der Buchung, keine Uhrzeit |
| `bilanzstichtag` | `DATE` | exakter Tag, keine Uhrzeit |
| `rechnungsdatum` | `DATE` | Kalenderdatum |
| `event_occurred_at` (Event-Sourcing) | `TIMESTAMPTZ` | exakte Event-Zeit |

**Rechtsgrundlage & Standards:**
- **§ 146 Abs. 1 AO** — „Zeitgerechtheit" der Buchung → klare, reproduzierbare Zeitangaben
- **GoBD Rz. 107** — „Geschäftsvorfälle sind zeitgerecht — möglichst unmittelbar nach ihrer Entstehung — zu erfassen"
- **GoBD Rz. 40** — Journalfunktion; chronologische Reihenfolge erforderlich
- **§ 239 Abs. 2 HGB** — zeitgerechte Erfassung
- **ISO 8601** — internationales Datums- und Zeitformat (`2026-04-22T14:30:00Z`)
- **RFC 3339** — Internet-Profil von ISO 8601
- **IANA Time Zone Database (tz)** — maßgebliche DST-Regeln für Europe/Berlin
- **EU-Richtlinie 2000/84/EG** — Sommerzeit in der EU (aktueller Rechtsrahmen, mit Abschaffungs-Diskussion seit 2018)

**Verwandte Begriffe:**
- [Buchungssatz](./02-buchhaltung.md#7-buchungssatz) — `buchungsdatum` als DATE
- [Bilanz](./05-jahresabschluss.md#2-bilanz) / [Jahresabschluss](./05-jahresabschluss.md#1-jahresabschluss) — Stichtag-Logik
- [Event-Sourcing](#6-event-sourcing) — `occurred_at` als TIMESTAMPTZ
- [Audit-Log](#7-hash-chain--audit-log) — chronologische Integrität

**Verwendung im Code:**
- **PostgreSQL-Session-Config:**
  ```sql
  ALTER DATABASE harouda_prod SET TIME ZONE 'UTC';
  SHOW TIME ZONE;  -- sollte 'UTC' zurückgeben
  ```
- **Supabase-Client-Konvention:** alle Inserts und Selects arbeiten mit ISO-8601-Strings mit `Z`-Suffix (UTC). Nie lokale Strings (`'2026-04-22T14:30:00+02:00'`) senden, ohne vorher zu normalisieren.
- **TypeScript-Utility (Shared Library):**
  ```typescript
  import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

  export const BERLIN = 'Europe/Berlin';

  export function toDbUtc(berlinLocal: Date | string): string {
    return zonedTimeToUtc(berlinLocal, BERLIN).toISOString();
  }

  export function fromDbToBerlin(utcIso: string): Date {
    return utcToZonedTime(utcIso, BERLIN);
  }

  export function formatForUi(utcIso: string, pattern: string = 'dd.MM.yyyy HH:mm'): string {
    return format(utcToZonedTime(utcIso, BERLIN), pattern, { timeZone: BERLIN });
  }
  ```
- **DATE-Behandlung separat:**
  ```typescript
  // buchungsdatum darf NICHT durch TZ-Konvertierung verschoben werden!
  // Ein Buchungsdatum '2026-04-22' bleibt '2026-04-22' — immer.
  const buchungsdatum = '2026-04-22';  // als ISO-Date-String, nicht als Date-Objekt
  ```
- **Default-Werte in DB:**
  ```sql
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- now() in PostgreSQL liefert bereits UTC (sofern TIME ZONE = UTC)
  ```
- **Test-Pflicht:** Unit-Tests mit DST-Wechseltagen (31.03.2024, 27.10.2024, 30.03.2025, 26.10.2025 …). Insbesondere: Kann das System ein Ereignis um `2026-10-25T02:30:00+02:00` von `2026-10-25T02:30:00+01:00` unterscheiden? In UTC sind dies zwei klar getrennte Zeitpunkte.
- **Reporting:** Geschäftsberichte und Exporte zeigen Uhrzeiten in `Europe/Berlin`; die **Rohdaten-Grundlage** (z. B. bei BP / GDPdU-Export) liefert **beides** an: UTC-Original + Berlin-Darstellung als Komfort-Spalte.

**Nicht verwechseln mit:**
- **MEZ / CET** — statische Abkürzung (Mitteleuropäische Zeit = UTC+1); `Europe/Berlin` umfasst MEZ **und** MESZ (+2) mit automatischem DST-Wechsel
- **`Europe/Berlin`** vs. **`CET`** als Zeitzonen-Bezeichner: letzteres ist schlecht, ersteres nutzt IANA-Regeln
- **GMT** — historisch, praktisch identisch mit UTC, aber nicht durch Atomuhr definiert
- **Server-Zeitzone** — sollte **immer** UTC sein, unabhängig vom Standort; keine Konfiguration auf Europe/Berlin
- **Unix-Timestamp** (Epoch seconds) — alternative Darstellung von UTC; DB bleibt aber TIMESTAMPTZ, weil menschenlesbar

**Anmerkungen / Edge-Cases:**
- **DST-Wechsel-Anomalien:** Bei einem `TIMESTAMP WITHOUT TIME ZONE` wäre `2026-10-25 02:30:00` ambivalent (MESZ oder MEZ?). Mit UTC existiert keine Ambiguität.
- **Europäische Sommerzeit-Abschaffung:** seit 2018 diskutiert, bis 2026 nicht umgesetzt. Falls sie kommt, reicht ein Update der IANA-TZ-Datenbank — keine Code-Anpassung in Harouda nötig.
- **Rechnungsdatum in E-Rechnung (XRechnung):** die Pflicht-Feldspezifikation verlangt `xs:date`, kein DateTime. Daher DATE-Typ zwingend.
- **Bestandsveränderungen mit Mitternachts-Buchungen:** eine Buchung um `23:59:59 Europe/Berlin` fällt in UTC auf `21:59:59Z` (Sommer) oder `22:59:59Z` (Winter). Das kalendarische `buchungsdatum` bleibt aber der Business-Tag — separate Speicherung wichtig.
- **Ereignisse zwischen 2:00 und 3:00 am DST-Wechselsonntag im März:** existieren **nicht** in Europe/Berlin. Ein vom User eingegebener Zeitpunkt wie `2026-03-29T02:30:00` muss interpretiert werden — date-fns-tz wirft Fehler oder wählt eine Konvention. Frontend-Validator sollte solche Eingaben blocken.
- **Datei-Export für BP:** GDPdU-Konforme Exporte (Format Z3) verlangen i. d. R. lokale Zeitdarstellung mit Zonen-Offset (`2026-04-22T14:30:00+02:00`) — unser Report-Generator rendert aus UTC zu dieser Darstellung.
- **Logs und Audit-Trail:** immer UTC-Zeitstempel; Log-Analyse-Tools (ELK, Datadog) erwarten UTC.
- **Beim Integration von Fremdsystemen (ELSTER, Bankschnittstellen, Peppol) immer Zeitzonenformat im Wrapper prüfen** — Schnittstellen-Spezifikationen definieren die erwartete Darstellung; DB bleibt UTC.

---

## 5. Content-Addressable Storage (CAS)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Content-Addressable Storage |
| **Synonyme (DE)** | CAS (Abkürzung, dominant), inhaltsadressierter Speicher, Hash-basierte Objektspeicherung, Git-artige Objektablage |
| **Arabisch** | التخزين المُعنوَن بالمحتوى (نموذج معماري للتخزين يُحدَّد فيه مفتاح الاسترجاع بـ **hash المحتوى ذاته** — عادةً SHA-256 — وليس بمسار أو اسم ملف اعتباطي؛ هذا يعني أن نفس الملف له نفس المفتاح دائماً في كل أنظمة التخزين، وأن تغيير بايت واحد يُغيِّر المفتاح كلياً؛ الفائدة المعمارية الأولى في Harouda: **Unveränderbarkeit** تلقائياً بحكم المعمارية نفسها — لا يمكن «تعديل» ملف لأن المفتاح يتغير، مما يُلبي متطلب GoBD Rz. 58 مباشرة؛ الفائدة الثانية: **Deduplizierung** — إذا رفع عملاء متعددون نفس فاتورة PDF، يُخزَّن مرة واحدة فقط؛ الفائدة الثالثة: **Integritätsverifikation** — بإعادة حساب hash المحتوى ومقارنته بالمفتاح يُتحقَّق تلقائياً من عدم التعديل؛ الفائدة الرابعة: **Cross-Reference-Safe** — روابط لا تتعطل أبداً لأنها مرتبطة بالمحتوى لا بالموقع؛ التنفيذ: Supabase Storage bucket بمفتاح هو الـ hash، جدول metadata منفصل `belege` يربط الـ hash بـ mandant_id و file_name و upload_date؛ النموذج مستوحى من Git object store) |
| **Englisch (Code-Kontext)** | `cas`, `contentAddressableStorage`, `contentHash`, `blobStore` |
| **Kategorie** | Architektur-Muster / Speicher-Paradigma |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Speicher-Paradigma, bei dem der **Schlüssel** eines Objekts **aus seinem Inhalt abgeleitet** wird — in der Regel als kryptographischer Hash (SHA-256). Das Objekt wird unter diesem Hash gespeichert; zwei identische Objekte haben denselben Schlüssel und werden automatisch dedupliziert. Jede inhaltliche Änderung erzeugt einen **neuen** Schlüssel, der alte bleibt unverändert bestehen. CAS ist das Grundprinzip von Git, IPFS, AWS S3 (mit Object-Lock), Docker Image Registry.

**Kern-Eigenschaften:**

| Eigenschaft | Konsequenz |
|---|---|
| **Content-ID = Hash(Content)** | Schlüssel ist deterministisch und global eindeutig |
| **Immutability durch Design** | Änderung = neuer Schlüssel; alte Version bleibt |
| **Integrity-Verification gratis** | Hash nachrechnen = Integritätsprüfung |
| **Automatic Deduplication** | gleiche Datei wird nie zweimal gespeichert |
| **Location-Independent** | Datei kann physisch verschoben werden, Schlüssel bleibt |
| **Verifiable Linking** | Verweise bleiben gültig, solange Objekt existiert |

**Gegenüberstellung zu klassischem Filesystem-Storage:**

| Aspekt | Pfad-basiert (klassisch) | Content-Addressable |
|---|---|---|
| **Schlüssel** | `/invoices/2026/04/rechnung_12345.pdf` | `sha256:a1b2c3...` |
| **Änderung** | Datei wird überschrieben | neuer Hash, alte Datei bleibt |
| **Dedup** | keine | automatisch |
| **Integrity** | separate Checksumme pflegen | inhärent |
| **Rename / Move** | verändert Schlüssel | unverändert |
| **GoBD Rz. 58 (Unveränderbarkeit)** | Zusatzsoftware erforderlich (Object-Lock, WORM) | konzeptuell garantiert |

**Zwei-Schichten-Architektur in Harouda:**

```
  ┌──────────────────────────────────────┐
  │ Metadata-Tabelle  `belege`           │
  │                                      │
  │ id | mandant_id | content_hash       │
  │    | original_name | mime_type       │
  │    | uploaded_at | uploaded_by       │
  │    | buchungs_referenz_id            │
  │    | ocr_status | confidence         │
  └────────────────┬─────────────────────┘
                   │ content_hash
                   ▼
  ┌──────────────────────────────────────┐
  │ Object-Storage-Bucket  `belege-cas`  │
  │                                      │
  │ sha256:a1b2c3…  →  bytes              │
  │ sha256:d4e5f6…  →  bytes              │
  │ …                                    │
  └──────────────────────────────────────┘
```

**Rechtsgrundlage & Standards:**
- **§ 147 Abs. 1, 2 AO** — 10-jährige Aufbewahrungspflicht mit Integrität
- **§ 147 Abs. 2 AO** — „bildliche Übereinstimmung" bei elektronischer Aufbewahrung
- **GoBD Rz. 58** — Unveränderbarkeit
- **GoBD Rz. 107** — zeitgerechte Erfassung mit Datumserhalt
- **GoBD Rz. 135–136** — elektronische Belegerfassung
- **BMF-Schreiben vom 28.11.2019** (IV A 4 - S 0316/19/10003 :001) — Grundsätze zur Digitalisierung von Belegen
- **TR-ESOR (BSI TR-03125)** — Technische Richtlinie Beweiswerterhaltung; CAS erfüllt Anforderungen inhärent
- **RFC 6920** — Naming Things with Hashes
- **NIST FIPS 180-4** — SHA-256-Standard

**Verwandte Begriffe:**
- [Hash-Chain / Audit-Log](#7-hash-chain--audit-log) — nutzt dasselbe SHA-256-Primitiv; CAS für Dateien, Hash-Chain für Ereignisse
- [Beleg](./02-buchhaltung.md#17-beleg) / [Belegnummer](./02-buchhaltung.md#18-belegnummer) — fachliche Grundlage
- [E-Rechnung](./06-belege-rechnung.md#6-e-rechnung-elektronische-rechnung) — XML/PDF-Dateien werden als CAS-Objekte gespeichert
- [Event-Sourcing](#6-event-sourcing) — Event-Payload kann `content_hash` statt Blob enthalten
- [DSGVO](./01-grundlagen.md#9-dsgvo) — Unveränderbarkeit vs. Löschpflicht erfordert Sonderkonzept

**Verwendung im Code:**
- **Upload-Logik (Edge Function):**
  ```typescript
  async function uploadBeleg(file: File, mandantId: string): Promise<BelegRef> {
    // 1. Hash berechnen
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const contentKey = `sha256:${hashHex}`;

    // 2. Prüfen, ob bereits vorhanden (Deduplizierung)
    const { data: existing } = await supabase.storage
      .from('belege-cas').list('', { search: contentKey });
    if (!existing?.length) {
      await supabase.storage.from('belege-cas').upload(contentKey, buffer);
    }

    // 3. Metadata-Eintrag (auch wenn Objekt schon existierte — je Mandant + Belegbezug)
    const { data: beleg } = await supabase.from('belege').insert({
      mandant_id:      mandantId,
      content_hash:    contentKey,
      original_name:   file.name,
      mime_type:       file.type,
      size_bytes:      buffer.byteLength,
    }).select().single();
    return { id: beleg.id, contentKey };
  }
  ```
- **Lese-Logik:**
  ```typescript
  async function readBeleg(belegId: string): Promise<Blob> {
    const { data: beleg } = await supabase.from('belege')
      .select('content_hash').eq('id', belegId).single();
    const { data: blob } = await supabase.storage
      .from('belege-cas').download(beleg.content_hash);

    // Integritäts-Check: Hash neu berechnen und vergleichen
    const recomputed = await sha256(await blob.arrayBuffer());
    if (`sha256:${recomputed}` !== beleg.content_hash) {
      throw new IntegrityError(`Beleg ${belegId} — Hash-Mismatch!`);
    }
    return blob;
  }
  ```
- **Referenz-Zähler für Löschung:** Physisches Löschen eines CAS-Objekts nur, wenn kein Metadata-Eintrag mehr referenziert. Periodischer Garbage-Collector-Job.
- **Retention-Policy (§ 147 AO):** Objekte werden **nie** vor Ablauf der 10-Jahres-Frist gelöscht; Metadata-Eintrag trägt `aufbewahrung_bis`-Datum; GC-Job berücksichtigt dies.
- **DSGVO-Sonderpfad:** bei Löschersuchen (Art. 17) — nicht physisch löschen, sondern **Pseudonymisierung der Metadata** + Hinweis-Eintrag; das CAS-Objekt selbst bleibt (nur erreichbar über Sonder-Admin-Rolle für BP-Zwecke).

**Nicht verwechseln mit:**
- **UUID-basierte Storage** — Schlüssel ist zufällig, nicht inhalts-abgeleitet; keine Deduplizierung, keine automatische Integrität
- **Filename-Storage** — klassisches Filesystem-Modell
- **Object Storage (S3)** — zugrundeliegende Technologie; CAS ist Nutzungsmuster darauf
- **Version Control (Git)** — verwandt (Git nutzt CAS für Objekte), aber versioniert Verzeichnis-Zustände, nicht nur Dateien
- **WORM-Storage (Write Once Read Many)** — Hardware-seitige Unveränderbarkeit; CAS liefert ähnliche Garantie softwareseitig
- **Hash-Chain** (siehe #7) — Kette von Hashes für Ereignisprotokoll; CAS ist Einzel-Hash für Dateien

**Anmerkungen / Edge-Cases:**
- **SHA-256 — Kollisions-Sicherheit:** bisher keine praktische Kollision bekannt; theoretischer Angriff erfordert ~2¹²⁸ Operationen. Selbst bei zukünftigen Durchbrüchen: Migration möglich durch Neu-Indizierung mit stärkerem Algorithmus (SHA-3-256 oder BLAKE3). Der `content_key` enthält daher bewusst den Algorithmus-Präfix (`sha256:…`).
- **Metadaten-Unterschiede bei gleichem Inhalt:** zwei identische Rechnungen von zwei verschiedenen Mandanten haben denselben Hash → dasselbe CAS-Objekt, aber zwei separate `belege`-Einträge. Der Zugriffspfad läuft über Metadata + RLS, nie direkt über den Hash — jeder Mandant sieht nur seine Metadaten.
- **Leere Dateien:** haben einen konstanten SHA-256 (`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`). Validator-Regel: lehne leere Uploads ab.
- **Komprimierte Varianten:** eine PDF und ihre komprimierte Version haben unterschiedliche Hashes. Regel: immer Original speichern, nicht on-the-fly komprimieren.
- **OCR-Ergebnis ist separater Beleg:** das CAS-Objekt ist die Original-Datei; OCR-extrahierte strukturierte Daten landen in eigenen Tabellen (`belege_ocr_result` mit FK auf `belege.id`), nicht als neues CAS-Objekt.
- **Backup-Strategie:** CAS-Bucket hat natürlichen Append-Only-Charakter — einfache Replikation. Restore eines einzelnen Objekts trivial (Hash-Lookup).
- **Hash-Berechnung serverseitig vs. clientseitig:** clientseitig (im Browser) spart Server-CPU, aber Server muss validieren. Best Practice: beide rechnen, Server verifiziert.
- **Bei DSGVO-Löschersuchen: Unveränderbarkeits-/Löschungs-Konflikt ist ein zentraler DPO-Abstimmungspunkt** — dokumentierter Löschkonzept erforderlich (siehe Modul 09).

---

## 6. Event-Sourcing

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Event-Sourcing |
| **Synonyme (DE)** | Ereignis-Quelle, ereignisgetriebene Zustandshaltung, ereignisbasierte Persistenz |
| **Arabisch** | مصدرة الأحداث (نمط معماري للاحتفاظ بالحالة Zustand في النظام، لا كـ «لقطة حالية» في جداول قابلة للتعديل CRUD، بل كـ **سجل لا يتغير** Append-Only-Log لكل الأحداث Events التي حدثت، حيث تُعاد الحالة الحالية بإعادة تشغيل — replay — لتسلسل الأحداث من البداية؛ في Harouda النمط المُهيمن في كل الـ Aggregate المحاسبية الحرجة: JournalEntry، Invoice، Anlage، Rückstellung، JA-Lifecycle — كل إجراء عليها ينتج event مُضاف فقط Append-Only وغير قابل للتعديل أو الحذف — مما يُلبي مباشرة GoBD Rz. 58 Unveränderbarkeit و Rz. 107 zeitgerechte Erfassung؛ الفرق الجوهري عن CRUD التقليدي: في CRUD آخر حالة معروفة، التاريخ ضائع؛ في Event-Sourcing كل حدث محفوظ وقابل للتأريخ إلى أي لحظة زمنية سابقة — مفيد جداً للـ Betriebsprüfung و DSGVO-Transparenz؛ التنفيذ: جدول `events` مع `aggregate_id, event_type, payload, occurred_at, sequence_nr`، وجداول «projections» محسوبة هي snapshots سريعة للحالة الحالية تُعاد بناؤها عند الحاجة) |
| **Englisch (Code-Kontext)** | `eventSourcing`, `events`, `aggregate`, `projection`, `replay` |
| **Kategorie** | Architektur-Muster / Persistenz-Strategie |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Architekturmuster, bei dem der **Systemzustand** nicht direkt als Tabellenzeilen mit UPDATE-Semantik gespeichert wird, sondern als **chronologische, append-only Folge von Ereignissen**, die auf dem System stattgefunden haben. Der aktuelle Zustand wird durch **Replay** (Wiederabspielen) aller relevanten Events rekonstruiert; für Performance existieren zusätzliche **Projektionen** (materialisierte Views) als Snapshot der aktuellen Aggregatzustände.

**Kerngedanke im Kontrast:**

| Aspekt | CRUD / Klassisch | Event-Sourcing |
|---|---|---|
| **Persistierter Zustand** | Aktuelle Zeile (mutierend) | Vollständiger Ereignisverlauf (immutabel) |
| **Historie** | In eigener Historien-Tabelle (optional, oft lückenhaft) | Inhärent — ist der Speicher selbst |
| **Reproduzierbarkeit** | Nur soweit explizit protokolliert | Vollständig — jeder Zustand jeder Vergangenheit |
| **Auditability** | Aufwändig nachzurüsten | Eingebaut |
| **GoBD Rz. 58** | Zusätzliche Trigger nötig | Prinzipiell erfüllt |
| **Komplexität** | Niedriger Einstieg | Höherer Einstieg, höhere Antwort-Kompetenz |

**Aufbau des Event-Stores:**

```sql
CREATE TABLE events (
  id             BIGSERIAL PRIMARY KEY,
  mandant_id     UUID NOT NULL,
  aggregate_type TEXT NOT NULL,       -- z. B. 'journal_entry', 'invoice', 'anlage'
  aggregate_id   UUID NOT NULL,        -- Instanz-Identität
  sequence_nr    BIGINT NOT NULL,      -- fortlaufend innerhalb des Aggregats
  event_type     TEXT NOT NULL,        -- z. B. 'JournalEntryBooked', 'InvoiceIssued'
  payload        JSONB NOT NULL,       -- fachlicher Inhalt des Events
  metadata       JSONB NOT NULL,       -- user_id, correlation_id, causation_id, ip, etc.
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aggregate_id, sequence_nr)
);

CREATE INDEX idx_events_aggregate
  ON events (mandant_id, aggregate_type, aggregate_id, sequence_nr);
```

**Grundoperationen:**

| Operation | Umsetzung |
|---|---|
| **Neues Event** | INSERT mit nächster `sequence_nr` für `aggregate_id`; niemals UPDATE/DELETE |
| **Zustand laden** | SELECT alle Events für `aggregate_id` ORDER BY `sequence_nr`; Reducer-Funktion projiziert zum aktuellen Zustand |
| **Korrektur** | **Neues Event** „JournalEntryReversed" + evtl. „JournalEntryReposted"; **kein** DELETE/UPDATE des alten Events |
| **Snapshot** | Periodisch oder nach N Events: Zustand serialisieren und als Einzeldokument ablegen; beschleunigt Replay |

**Typische Events in Harouda:**

| Aggregate | Event-Types (Beispiele) |
|---|---|
| `JournalEntry` | `JournalEntryCreated`, `JournalEntryBooked`, `JournalEntryReversed`, `JournalEntryCorrected` |
| `Invoice` | `InvoiceDrafted`, `InvoiceIssued`, `InvoicePaid`, `InvoiceCancelled`, `InvoiceCorrected` |
| `Anlage` | `AnlageAcquired`, `AnlageDepreciated` (monatlich), `AnlageImpaired`, `AnlageWrittenUp`, `AnlageDisposed` |
| `Rückstellung` | `RueckstellungBildung`, `RueckstellungAuflösung`, `RueckstellungVerbrauch`, `RueckstellungAngepasst` |
| `Jahresabschluss` | `JAGestartet`, `JAEntwurfErstellt`, `JAZurFeststellungVorgelegt`, `JAFestgestellt`, `JAVeröffentlicht` |

**Rechtsgrundlage & Standards:**
- **GoBD Rz. 58** — Unveränderbarkeit: „Jede nachträgliche Änderung muss als Korrektur erkennbar bleiben" → Event-Sourcing strukturell erfüllt
- **GoBD Rz. 61–66** — Änderungsprotokoll; wird von Events nativ geliefert
- **GoBD Rz. 107** — zeitgerechte Erfassung
- **§ 146 Abs. 4 AO** — „Es darf keine Veränderung vorgenommen werden, deren Beschaffenheit es ungewiss lässt, ob sie ursprünglich oder erst später gemacht worden ist."
- **§ 239 Abs. 3 HGB** — gleiche Anforderung handelsrechtlich
- **IDW PS 330** — Abschlussprüfung bei Einsatz von IT — Änderungsnachweisbarkeit
- **DDD / CQRS-Literatur** — Eric Evans (2003), Greg Young, Vaughn Vernon (IDDD)
- **ISO 19005** (PDF/A) — verwandt: archivfähige Formate

**Verwandte Begriffe:**
- [GoBD](./01-grundlagen.md#1-gobd) — Compliance-Rahmen, den Event-Sourcing natürlich erfüllt
- [Doppelte Buchführung](./02-buchhaltung.md#1-doppelte-buchführung) — Event = einzelner Buchungsvorgang
- [Hash-Chain / Audit-Log](#7-hash-chain--audit-log) — verstärkt Event-Store durch kryptographische Kette
- [Content-Addressable Storage](#5-content-addressable-storage-cas) — Events können Blob-Referenzen via CAS-Hash tragen
- [UTC in DB](#4-utc-in-db--europeberlin-in-ui) — `occurred_at` als TIMESTAMPTZ-UTC

**Verwendung im Code:**
- **Event-Dispatcher:**
  ```typescript
  async function appendEvent(params: {
    mandantId: string;
    aggregateType: AggregateType;
    aggregateId: string;
    eventType: string;
    payload: Record<string, unknown>;
    metadata: EventMetadata;
  }): Promise<EventRecord> {
    const { data: maxSeq } = await supabase
      .from('events')
      .select('sequence_nr')
      .eq('aggregate_id', params.aggregateId)
      .order('sequence_nr', { ascending: false })
      .limit(1)
      .single();
    const nextSeq = (maxSeq?.sequence_nr ?? 0) + 1;

    return await supabase.from('events').insert({
      mandant_id:     params.mandantId,
      aggregate_type: params.aggregateType,
      aggregate_id:   params.aggregateId,
      sequence_nr:    nextSeq,
      event_type:     params.eventType,
      payload:        params.payload,
      metadata:       params.metadata,
    });
  }
  ```
- **Replay / Aggregate-Rekonstruktion:**
  ```typescript
  async function loadAggregate<S>(
    aggregateId: string,
    reducer: (state: S, event: EventRecord) => S,
    initialState: S
  ): Promise<S> {
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('aggregate_id', aggregateId)
      .order('sequence_nr', { ascending: true });
    return events.reduce(reducer, initialState);
  }
  ```
- **Projektionen als materialisierte Views:** PostgreSQL-Function-Trigger bei neuem Event aktualisiert `journal_entries_current`-View. Queries lesen aus dem View, nicht direkt aus `events`.
- **Korrekturen:** bestehendes Event bleibt; neues Event `JournalEntryReversed` + `JournalEntryReposted` mit `causation_id` = original_event_id. Die Projektion rechnet beide Events ein und zeigt den korrigierten Zustand.
- **Schema-Evolution der Events:** Upcasting-Funktionen wandeln alte Event-Versionen beim Replay in aktuelles Schema — Events selbst werden **nicht** modifiziert.
- **DSGVO Art. 17 (Löschpflicht) vs. Event-Unveränderbarkeit:** Lösung via Pseudonymisierung der `payload` (personenbezogene Felder → Hash oder Leerstring), Event bleibt formal bestehen. Dokumentation der Pseudonymisierung als eigenes Meta-Event.
- **Snapshot-Frequenz:** nach jeweils 100 Events pro Aggregat oder nach 30 Tagen — was zuerst eintritt. Snapshot gespeichert als eigenes Event `AggregateSnapshot` mit vollständigem Projektions-Zustand.

**Nicht verwechseln mit:**
- **Change Data Capture (CDC)** — reaktives Protokollieren von CRUD-Änderungen; Event-Sourcing ist proaktiv, Events sind Business-Konzepte, nicht Tabellen-Deltas
- **Audit-Log als Nebentabelle** — nachträgliches Logging; Event-Store **ist** die Quelle der Wahrheit
- **Message Queue** (Kafka, RabbitMQ) — Transportkanal; Event-Store ist Persistenzschicht. Kombination möglich (Events werden auch publiziert), aber verschiedene Rollen.
- **WORM-Speicher** — Hardware-seitige Unveränderbarkeit; Event-Sourcing ist ein Software-Muster
- **Historien-Tabellen** (SCD Type 2) — Dimensionen in DWHs; punktuelle Historie, nicht vollständige Ereignisreihe
- **Git** — Versionierung von Dateien; Event-Sourcing versioniert Geschäftszustand

**Anmerkungen / Edge-Cases:**
- **Learning Curve:** Event-Sourcing ist mentale Umstellung. Entwickler müssen lernen, in Events statt Tabellen zu denken. Initialer Invest lohnt sich bei GoBD-kritischen Domänen.
- **Event-Schema-Migration:** Events sind unveränderlich. Bei Schema-Änderungen: Versionierung (`v1`, `v2`) + Upcasting. Nie alte Events umschreiben.
- **Performance bei großen Aggregaten:** ein Aggregat mit 10.000 Events lädt langsam. Snapshots als Notwendigkeit. Regel: Aggregat-Grenze bewusst wählen (nicht zu groß).
- **Concurrent Appends:** zwei Nutzer erstellen gleichzeitig Events für dasselbe Aggregat → Unique-Constraint auf `(aggregate_id, sequence_nr)` verhindert doppelte Sequenzen. Bei Konflikt: Retry mit neuer Sequenz.
- **Replay-Time:** bei BP oder System-Migration muss ein vollständiger Replay möglich sein. Dokumentierter Disaster-Recovery-Prozess erforderlich.
- **DSGVO und personenbezogene Daten in Events:** strikte Trennung — fachlich notwendige ID als Referenz, personenbezogene Klartext-Daten (Name, Adresse) in separater Projektion; so kann die Projektion gelöscht/pseudonymisiert werden, Event-Kern bleibt.
- **Event-Explosion vermeiden:** nicht jede UI-Interaktion ist ein Event. Nur **fachliche Ereignisse** werden persistiert (keine „UserScrolledDown"-Events in einem Buchhaltungssystem).
- **CQRS-Kopplung:** Event-Sourcing bietet sich mit Command-Query-Responsibility-Segregation an — Commands erzeugen Events, Queries lesen Projektionen. Konsistenz zwischen Command- und Query-Seite ist **eventual** — bei Harouda typisch < 100 ms.
- **Bei kritischen Buchungen (Vier-Augen-Prinzip): Approval-Events sind ebenfalls normale Events** im Stream, nicht separate Workflow-Zustände außerhalb.

---

## 7. Hash-Chain / Audit-Log

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Hash-Chain |
| **Synonyme (DE)** | Audit-Log mit Hash-Verkettung, Kryptographisch verketteter Protokoll, Beweiswerterhaltendes Protokoll |
| **Arabisch** | سلسلة التجزئة (آلية تشفيرية تُضيف إلى كل سجل audit-log **hash للسجل السابق**، فينشأ سلسلة مترابطة Chain يُستحيل معها تغيير أي سجل تاريخي دون تغيير كل السجلات اللاحقة — وهذا يتكشف فوراً عبر إعادة حساب واحد؛ التطبيق في Harouda كطبقة إضافية فوق Event-Sourcing: كل event يُضاف إلى `events` table يُولِّد قيداً في `audit_log` table يحمل hash لمحتواه + hash للسجل السابق؛ SHA-256 هو الـ primitive الذي يُستخدم (متوافق مع NIST FIPS 180-4 و BSI TR-03125)؛ الهدف ليس منع التعديل — بل **كشف التعديل فوراً** بمجرد محاولة وقوعه؛ هذا يُلبي GoBD Rz. 58–60 بقوة تعزيزية فوق Event-Sourcing، ويُعد معياراً ذهبياً لـ Revisionssicherheit في البرامج المحاسبية الحديثة؛ Merkle-Tree شكل أكثر تقدماً يسمح بإثبات انتماء سجل محدد لسلسلة بدون حاجة لتسليم السلسلة كاملة — مفيد لـ Betriebsprüfung موضعية) |
| **Englisch (Code-Kontext)** | `hashChain`, `auditLog`, `cryptographicAudit`, `merkleTree` |
| **Kategorie** | Architektur-Muster / Integritätsverfahren |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Kryptographische Struktur, bei der jeder Log-Eintrag einen **Hash seines Inhalts** enthält, der **den Hash des vorherigen Eintrags als Input mitführt**. Die resultierende Kette ist **tamper-evident**: jede nachträgliche Änderung eines historischen Eintrags ändert dessen Hash und alle nachfolgenden Hashes, was bei einer Verifikations-Rechnung sofort auffällt. In Harouda als verstärkende Schicht über dem Event-Sourcing implementiert.

**Konstruktionsprinzip:**

```
entry[0].hash = SHA-256(entry[0].data || GENESIS_NONCE)
entry[n].hash = SHA-256(entry[n].data || entry[n-1].hash)
```

Jede Änderung an `entry[k]` führt zu:
- `entry[k].hash` ändert sich
- `entry[k+1].hash` hängt von `entry[k].hash` ab → ändert sich
- … kaskadiert bis zum letzten Eintrag

Die **einmalige Verifikation** der Kette (z. B. durch Finanzamt-Prüfer) deckt jede Manipulation auf.

**Tabellen-Struktur:**

```sql
CREATE TABLE audit_log (
  id           BIGSERIAL PRIMARY KEY,
  mandant_id   UUID NOT NULL,
  event_id     BIGINT NOT NULL REFERENCES events(id),
  prev_hash    BYTEA,                      -- 32 bytes, NULL nur für erstes Entry
  payload_hash BYTEA NOT NULL,             -- SHA-256 des Event-Payloads
  entry_hash   BYTEA NOT NULL,             -- SHA-256(payload_hash || prev_hash)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  sequence_nr  BIGINT NOT NULL             -- mandant-weit fortlaufend
);

CREATE UNIQUE INDEX idx_audit_mandant_seq ON audit_log (mandant_id, sequence_nr);
```

**Verifikationsalgorithmus:**

```typescript
async function verifyChain(mandantId: string): Promise<VerifyResult> {
  const { data: entries } = await supabase
    .from('audit_log')
    .select('*')
    .eq('mandant_id', mandantId)
    .order('sequence_nr', { ascending: true });

  let expectedPrevHash: Uint8Array | null = null;
  for (const entry of entries) {
    // 1. Payload-Hash neu berechnen
    const { data: ev } = await supabase.from('events').select('*').eq('id', entry.event_id).single();
    const computedPayloadHash = sha256(canonicalize(ev.payload));
    if (!equalBytes(computedPayloadHash, entry.payload_hash)) {
      return { valid: false, tamperedAt: entry.sequence_nr, reason: 'payload_hash_mismatch' };
    }

    // 2. Entry-Hash neu berechnen
    const computedEntryHash = sha256(concatBytes(computedPayloadHash, expectedPrevHash ?? GENESIS));
    if (!equalBytes(computedEntryHash, entry.entry_hash)) {
      return { valid: false, tamperedAt: entry.sequence_nr, reason: 'entry_hash_mismatch' };
    }

    // 3. Verkettung prüfen
    if (expectedPrevHash && !equalBytes(expectedPrevHash, entry.prev_hash)) {
      return { valid: false, tamperedAt: entry.sequence_nr, reason: 'prev_hash_mismatch' };
    }

    expectedPrevHash = entry.entry_hash;
  }
  return { valid: true, lastSequence: entries.at(-1)?.sequence_nr };
}
```

**Schutz gegen typische Angriffsszenarien:**

| Angriff | Wirkung ohne Hash-Chain | Wirkung mit Hash-Chain |
|---|---|---|
| Einzelnen Eintrag verändern | unbemerkt möglich | sofort erkennbar |
| Eintrag löschen | unbemerkt | Lücke in Sequenz + Hash-Bruch |
| Einträge neu anordnen | unbemerkt | Hash-Bruch |
| Kompletten Log ersetzen | sofort erkennbar bei Notariats-Hash | nur mit Notariats-Anker vollständig |

**Notariats-Anker (optional):** regelmäßige Veröffentlichung des jeweils letzten `entry_hash` an eine externe, unveränderliche Stelle (z. B. qualifizierter Zeitstempeldienst nach eIDAS, Blockchain-Anker) — schützt auch vor Komplettersatz des Logs.

**Rechtsgrundlage & Standards:**
- **GoBD Rz. 58, 59, 60** — Unveränderbarkeit; Hash-Chain ist gängige Umsetzung
- **§ 146 Abs. 4 AO** — Unveränderbarkeit von Buchungen
- **§ 147 AO** — Aufbewahrung; Integritätsnachweis über 10 Jahre
- **BSI TR-03125 (TR-ESOR)** — Technische Richtlinie zur Beweiswerterhaltung kryptographisch signierter Dokumente
- **eIDAS (Verordnung (EU) Nr. 910/2014)** — qualifizierte elektronische Zeitstempel für Kettenanker
- **NIST FIPS 180-4** — SHA-256-Spezifikation
- **RFC 6234** — US Secure Hash Algorithms
- **ISO/IEC 10118-3** — Dedicated hash-functions
- **IDW PS 330** — Prüfung von IT-Systemen — Integritätsnachweis

**Verwandte Begriffe:**
- [Event-Sourcing](#6-event-sourcing) — die unterliegende Datenstruktur, über der die Hash-Chain läuft
- [Content-Addressable Storage](#5-content-addressable-storage-cas) — gleiche SHA-256-Primitive
- [GoBD](./01-grundlagen.md#1-gobd) — Rahmenvorschrift
- [Betriebsprüfung](./01-grundlagen.md#7-betriebsprüfung) — Kette ist Prüf-Artefakt

**Verwendung im Code:**
- **Datenbank-Trigger:** jedem INSERT in `events` folgt automatisch ein INSERT in `audit_log` via PL/pgSQL-Trigger.
  ```sql
  CREATE OR REPLACE FUNCTION append_audit_log() RETURNS TRIGGER AS $$
  DECLARE
    prev_hash_val    BYTEA;
    payload_hash_val BYTEA;
    entry_hash_val   BYTEA;
    next_seq         BIGINT;
  BEGIN
    SELECT entry_hash, sequence_nr + 1
      INTO prev_hash_val, next_seq
      FROM audit_log
      WHERE mandant_id = NEW.mandant_id
      ORDER BY sequence_nr DESC LIMIT 1;

    IF next_seq IS NULL THEN next_seq := 1; END IF;

    payload_hash_val := digest(
      convert_to(NEW.payload::text, 'UTF8'), 'sha256'
    );
    entry_hash_val := digest(
      payload_hash_val || COALESCE(prev_hash_val, '\x00'::bytea), 'sha256'
    );

    INSERT INTO audit_log (mandant_id, event_id, prev_hash, payload_hash, entry_hash, sequence_nr)
    VALUES (NEW.mandant_id, NEW.id, prev_hash_val, payload_hash_val, entry_hash_val, next_seq);
    RETURN NEW;
  END $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_events_audit
    AFTER INSERT ON events
    FOR EACH ROW EXECUTE FUNCTION append_audit_log();
  ```
- **Kanonische Payload-Serialisierung:** Hash-Berechnung erfordert deterministische JSON-Serialisierung. Harouda nutzt eine `canonicalize()`-Funktion (Schlüssel sortiert, keine Leerzeichen, Unicode-NFC) — sonst Hash-Unterschied bei semantisch gleichem Inhalt.
- **Verifikations-Job (nächtlich):** vollständige Kette wird gegenüber neu berechneter Referenz geprüft; Ergebnis in `chain_verification_log` protokolliert. Bei Abweichung Alarm.
- **Notariats-Anker — tägliche System-weite Merkle-Aggregation:** Ein Cronjob läuft täglich um 23:55 Europe/Berlin und aggregiert pro Mandant den **letzten `entry_hash` des Tages** zu einem **Merkle-Tree**; dessen **Wurzel-Hash** (Merkle-Root) wird **einmal** an einen qualifizierten eIDAS-Zeitstempel-Dienst gesendet und der resultierende RFC-3161-Token archiviert. So entsteht **ein** externer Anker pro Tag für **alle** Mandanten gemeinsam, ohne Cross-Mandant-Datenleakage — jeder Mandant kann unabhängig beweisen, dass sein letzter Tages-Hash in der Merkle-Root enthalten war (via Merkle-Inclusion-Proof), ohne die Hashes anderer Mandanten zu offenbaren. Kosten: **1 Zeitstempel/Tag × ca. 0,10–1,00 €** ≈ 30–300 €/Jahr — unabhängig von Mandantenzahl.
  ```typescript
  // Tagesaktueller Merkle-Anchor (vereinfacht)
  async function dailyGlobalAnchor(): Promise<AnchorRecord> {
    const today = currentBerlinDate();
    // 1. Sammle den letzten entry_hash jedes Mandanten für heute
    const { data: perMandantHashes } = await supabase.rpc('last_entry_hash_per_mandant', { d: today });
    // 2. Baue Merkle-Tree (sortierte Mandant-IDs für Determinismus)
    const sortedLeaves = perMandantHashes
      .sort((a, b) => a.mandant_id.localeCompare(b.mandant_id))
      .map(r => ({ leafHash: r.entry_hash, mandantId: r.mandant_id }));
    const tree = buildMerkleTree(sortedLeaves.map(l => l.leafHash));
    // 3. Einmalige eIDAS-Zeitstempel-Anfrage für die Wurzel
    const tsToken = await requestEidasTimestamp(tree.root);  // RFC 3161
    // 4. Archivieren: eine Zeile für den Tages-Anker + Proofs pro Mandant
    const anchor = await supabase.from('daily_anchors').insert({
      anchor_date:     today,
      merkle_root:     tree.root,
      tst_token:       tsToken,
      leaf_count:      sortedLeaves.length
    }).select().single();
    for (const { leafHash, mandantId } of sortedLeaves) {
      const proof = tree.getInclusionProof(leafHash);
      await supabase.from('mandant_anchor_proofs').insert({
        anchor_id: anchor.data.id,
        mandant_id: mandantId,
        leaf_hash: leafHash,
        merkle_proof: proof  // Array von Sister-Nodes auf dem Weg zur Wurzel
      });
    }
    return anchor.data;
  }
  ```
- **BP-Export:** auf Anforderung des Prüfers wird für den betroffenen Mandanten der Merkle-Inclusion-Proof zu jedem Tages-Anker generiert — Prüfer kann jede historische Kette gegen den eIDAS-Zeitstempel unabhängig verifizieren, ohne Zugriff auf andere Mandanten.

**Nicht verwechseln mit:**
- **Digitale Signatur (eIDAS)** — qualifizierte elektronische Signatur mit Zertifikat; Hash-Chain liefert Integrität, Signatur liefert Urheber-Nachweis — ergänzen sich. In Harouda liefert der tägliche eIDAS-Zeitstempel (nicht Signatur) den externen Vertrauensanker.
- **WORM-Speicher** — Hardware-Ebene; Hash-Chain ist Software-Muster
- **Normales Change-Log / Update-Log** — bietet keine Tamper-Detection
- **Blockchain** — verteiltes, konsens-basiertes Ledger; Harouda nutzt zentralisierte Variante ohne Distributed-Consensus, dafür externe Verankerung über eIDAS
- **HMAC** — keyed Hash für Nachrichten-Authentifikation; andere Zielsetzung

**Anmerkungen / Edge-Cases:**
- **Kanonisierung ist kritisch:** bei JSON ist Schlüssel-Reihenfolge nicht festgelegt. Eine `canonicalize`-Funktion (z. B. RFC 8785 JCS) muss deterministisch sein. Abweichung = falsche Hashes.
- **Performance bei Millionen Events:** Trigger-basierte Kettenverlängerung ist O(1) pro INSERT. Verifikation ist O(N). Bei sehr großen Ketten: inkrementelle Verifikation mit gespeicherten Checkpoints (z. B. jeder 10.000-ste Hash).
- **Kettenbruch-Recovery:** wird ein Bruch festgestellt, ist das System-weites Security-Incident. Recovery via Backup-Replay; Event-Store selbst ist append-only, daher rekonstruierbar.
- **Schema-Migration der Events:** wenn Payload-Struktur migriert wird, ändern sich Hashes → Kette formal gebrochen. Lösung: Migrations-Event als **neuer** Eintrag, alte Hashes bleiben; Verifikation kennt Migrations-Marker.
- **Hash-Algorithmus-Upgrade (zukünftig SHA-3 oder BLAKE3):** Migration durch **zweite Kette** parallel zur alten; beide werden geführt; SHA-256 bleibt zu Prüfungszwecken.
- **Zeitstempel-Dienste kosten Geld:** qualifizierte eIDAS-Zeitstempel liegen bei ca. 0,10–1,00 € pro Operation. Ein **täglicher** System-Anker für **alle** Mandanten gemeinsam (via Merkle-Tree-Aggregation) genügt regulär und kostet unabhängig von der Mandantenzahl ≤ 365 €/Jahr.
- **Merkle-Tree als Aggregationsstruktur:** ermöglicht Inclusion-Proofs für einzelne Mandanten-Ketten, ohne den gesamten Baum preiszugeben — DSGVO-konform gegenüber Cross-Mandant-Leakage.
- **Mandantentrennung der Kette:** jede Kette ist pro Mandant; kein Cross-Mandant-Verkettung (würde `mandant_id`-Leak bedeuten).
- **Bei rechtlichen Streitigkeiten über Integrität: Rücksprache mit IT-Gutachter/Fachanwalt** — die Kette allein ist technischer Nachweis; ihre prozessuale Würdigung ist eigenes Fachgebiet.

---

## 8. Vier-Augen-Prinzip

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Vier-Augen-Prinzip |
| **Synonyme (DE)** | Doppeltes Kontrollprinzip, Zwei-Personen-Regel, Dual-Control-Prinzip, Genehmigungsverfahren, Maker-Checker (Bankwesen) |
| **Arabisch** | مبدأ الأربع أعين (آلية رقابية تفرض أن كل إجراء حساس — kritische Buchung — يتطلب موافقة شخصَين مختلفَين: **المُنشِئ** الذي يُدخل العملية (Maker) و**المُراجع** الذي يُوافق عليها (Checker)، ولا يجوز أن يكون نفس الشخص في الدورَين؛ الغرض الأول: حماية ضد الأخطاء البشرية — شخص ثانٍ يكتشف الأخطاء قبل الترسيب؛ الغرض الثاني: حماية ضد الاحتيال — Fraud-Prevention — لا يستطيع موظف واحد تنفيذ عملية مشبوهة منفرداً؛ الغرض الثالث: امتثال لـ GoBD Rz. 104 — Internes Kontrollsystem (IKS) — و IDW PS 261 — Risikomanagement und Internes Kontrollsystem؛ في Harouda يُطبَّق على: Buchungen > 10.000 €، كل Storno-Buchungen، Jahresabschluss-Buchungen، تعديلات Mandanten-Stammdaten، تفعيل Edge-Case-Bewertungen كـ Teilwertabschreibungen، Mandanten-Löschung؛ التنفيذ يستدعي State-Machine على الـ Aggregate: `Draft → PendingReview → Approved/Rejected`، مع فرض على مستوى RLS بأن `approved_by` لا يساوي `created_by`) |
| **Englisch (Code-Kontext)** | `fourEyes`, `dualControl`, `makerChecker`, `approval` |
| **Kategorie** | Architektur-Muster / Kontroll-Prinzip |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Organisatorisches und technisches Prinzip, bei dem **kritische Geschäftsvorfälle** erst wirksam werden, nachdem **zwei verschiedene berechtigte Personen** — ein Ausführender (Maker) und ein Genehmigender (Checker) — ihre Zustimmung erteilt haben. Das Prinzip verhindert sowohl **Einzelfehler** (ein Paar Augen sieht mehr) als auch **Einzelbetrug** (keine Person kann allein manipulieren) und ist fester Bestandteil eines Internen Kontrollsystems (IKS).

**Anwendung in Harouda — kritische Vorgänge:**

| Vorgang | Schwelle / Bedingung | Kommentar |
|---|---|---|
| **Einzelbuchung** | Betrag > `mandanten_settings.vier_augen_schwelle` (System-Default: 10.000 €) | Pro-Mandant konfigurierbar — **keine** hartkodierte Schwelle in DB-Constraint |
| **Storno-Buchung** | immer | auch bei kleinen Beträgen |
| **Jahresabschluss-Buchungen** | immer | Feststellung durch autorisierten Benutzer + Vier-Augen |
| **Teilwertabschreibung / Wertaufholung** | immer | wertkritisch |
| **Mandanten-Stammdaten** (Firmierung, Rechtsform, IBAN) | immer | Identitätsrelevant |
| **Bank-IBAN-Änderungen** | immer | Betrugsanfällig |
| **Mandanten-Löschung / Archivierung** | immer | DSGVO + Aufbewahrungspflicht |
| **Benutzer-Rolle „Kanzlei-Admin"-Erteilung** | immer | Privilegien-Eskalation |
| **USt-Voranmeldung ELSTER-Freigabe** | immer | rechtsverbindliche Erklärung |

**Workflow (State-Machine):**

```
              ┌─────────────┐
              │    Draft    │  ← Maker erstellt
              └──────┬──────┘
                     │ submit_for_review
                     ▼
              ┌─────────────┐
              │PendingReview│  ← wartet auf Checker
              └──┬──────────┘
                 │               │
       approve ◄─┤              ├─► reject_with_reason
                 ▼               ▼
          ┌─────────────┐  ┌─────────────┐
          │  Approved   │  │  Rejected   │  ← zurück zum Maker mit Begründung
          │  (wirksam)  │  │             │
          └─────────────┘  └──────┬──────┘
                                   │ revise_and_resubmit
                                   └────► Draft
```

**Technische Regeln:**

1. **Identitäts-Trennung:** `approved_by` MUSS ≠ `created_by` sein. Erzwungen durch DB-Constraint und RLS-Policy.
2. **Zeitstempel-Trennung:** `created_at` und `approved_at` dokumentieren Zeitabstand (mindestens 1 Sekunde, nicht gleichzeitig).
3. **Event-Sourcing-Integration:** jeder State-Übergang ist ein Event (`Submitted`, `Approved`, `Rejected`).
4. **Audit-Log-Pflicht:** alle Approval-Entscheidungen + Begründungen erscheinen in der Hash-Chain.
5. **Nicht-Wirksamkeit vor Approval:** ein „Approved"-Zustand triggert erst dann die fachliche Wirkung (z. B. Buchung erscheint im Hauptbuch).

**Rechtsgrundlage & Standards:**
- **GoBD Rz. 104** — Internes Kontrollsystem; Vier-Augen-Prinzip ist gängige IKS-Maßnahme
- **§ 239 Abs. 2 HGB** — Richtigkeit + Ordnungsmäßigkeit; Vier-Augen-Prinzip als Sicherungsmaßnahme
- **§ 25a KWG** — für Banken Pflicht (nicht direkt für Kanzleien, aber Vorbildcharakter)
- **IDW PS 261** — Feststellungen und Beurteilung von Risiken durch den Abschlussprüfer (IKS-Prüfung)
- **IDW PS 982** — Prüfung des internen Kontrollsystems
- **ISO/IEC 27001 A.9.4.4** — Privileged Access Management
- **COSO IC-IF 2013** — Internal Control Framework; „Segregation of Duties" als Principle 10
- **BSI IT-Grundschutz ORP.4** — Identitäts- und Berechtigungsmanagement

**Verwandte Begriffe:**
- [Mandantenfähigkeit](#1-mandantenfähigkeit-multi-tenancy) — Rollen und Berechtigungen sind mandantspezifisch
- [Event-Sourcing](#6-event-sourcing) — Approval-Übergänge als Events
- [Hash-Chain](#7-hash-chain--audit-log) — Approvals sind Teil der Kette
- [Betriebsprüfung](./01-grundlagen.md#7-betriebsprüfung) — Prüfer verlangen IKS-Nachweis
- [Steuerberater](./01-grundlagen.md#6-steuerberater-stb) — typischerweise Checker-Rolle

**Verwendung im Code:**
- **Konfigurations-Tabelle `mandanten_settings`** (Quelle der Vier-Augen-Schwelle pro Mandant):
  ```sql
  CREATE TABLE mandanten_settings (
    mandant_id              UUID PRIMARY KEY REFERENCES mandanten(id),
    vier_augen_schwelle     NUMERIC(19, 4) NOT NULL DEFAULT 10000.0000,
    vier_augen_aktiv        BOOLEAN NOT NULL DEFAULT true,
    vier_augen_fuer_storno  BOOLEAN NOT NULL DEFAULT true,
    -- … weitere Mandanten-Einstellungen …
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID REFERENCES users(id)
  );
  -- Default-Row bei Mandanten-Anlage automatisch (via Trigger auf mandanten INSERT).
  ```
  Änderungen an dieser Tabelle sind selbst vier-augen-pflichtig (Settings-Change = kritischer Vorgang).

- **DB-Schema `critical_bookings`:**
  ```sql
  CREATE TYPE approval_state AS ENUM ('draft', 'pending_review', 'approved', 'rejected');

  CREATE TABLE critical_bookings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id       UUID NOT NULL,
    state            approval_state NOT NULL DEFAULT 'draft',
    created_by       UUID NOT NULL REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at     TIMESTAMPTZ,
    approved_by      UUID REFERENCES users(id),
    approved_at      TIMESTAMPTZ,
    rejection_reason TEXT,
    betrag           NUMERIC(19, 4),  -- für Schwellen-Vergleich
    payload          JSONB NOT NULL,
    -- Identitäts-Constraint: hartkodiert, weil UNIVERSELLE Regel
    CONSTRAINT chk_different_approver
      CHECK (approved_by IS NULL OR approved_by <> created_by),
    CONSTRAINT chk_approval_complete
      CHECK (
        (state = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
        OR (state <> 'approved')
      )
    -- KEINE hartkodierte Schwelle! Die Schwellen-Prüfung passiert in Application-Layer
    -- durch Lookup in mandanten_settings.vier_augen_schwelle.
  );
  ```
- **Application-Layer-Prüfung (nicht DB-Constraint!):**
  ```typescript
  async function requiresVierAugen(mandantId: string, betrag: Decimal, vorgangsart: Vorgangsart): Promise<boolean> {
    const { data: settings } = await supabase
      .from('mandanten_settings')
      .select('vier_augen_schwelle, vier_augen_aktiv, vier_augen_fuer_storno')
      .eq('mandant_id', mandantId).single();

    if (!settings.vier_augen_aktiv) return false;
    if (vorgangsart === 'storno' && settings.vier_augen_fuer_storno) return true;
    if (UNIVERSAL_APPROVAL_VORGANGSARTEN.includes(vorgangsart)) return true;  // Jahresabschluss, IBAN, etc.
    if (vorgangsart === 'einzelbuchung' && betrag.gt(settings.vier_augen_schwelle)) return true;
    return false;
  }
  ```
- **RLS-Policy für Approval:**
  ```sql
  CREATE POLICY approval_by_different_user
    ON critical_bookings
    FOR UPDATE
    USING (
      state = 'pending_review'
      AND auth.uid() <> created_by
      AND has_role(auth.uid(), 'approver', mandant_id)
    )
    WITH CHECK (
      state IN ('approved', 'rejected')
      AND approved_by = auth.uid()
    );
  ```
- **Notifications:** Checker erhält UI-Benachrichtigung + optional E-Mail, wenn ein Vorgang zur Freigabe wartet. Wartezeit-Monitoring für SLA-Einhaltung.
- **Rollen-Modell:** jeder User hat pro Mandant eine Rolle `maker`, `approver` oder `admin`. `admin` umfasst beides, aber die Identitäts-Trennung bleibt (Admin-Self-Approve ist blockiert).
- **Delegation / Vertretung:** bei Abwesenheit eines Approvers kann ein Backup-Approver definiert sein; die Vertretung wird als Metadaten am Approval gespeichert.
- **Testszenarien:**
  1. Maker versucht, eigenen Vorgang zu approven → Ablehnung durch Constraint.
  2. Approver ohne Rolle versucht Freigabe → RLS-Ablehnung.
  3. Approver gibt frei → Buchung wird im Hauptbuch wirksam.
  4. Approver lehnt ab + Begründung → Maker erhält Benachrichtigung, kann überarbeiten.

**Nicht verwechseln mit:**
- **Rollenbasierte Zugriffssteuerung (RBAC) allein** — RBAC definiert, wer was tun kann; Vier-Augen-Prinzip erweitert um „nicht allein"
- **Multi-Faktor-Authentifizierung (MFA)** — zweiter Faktor derselben Person; Vier-Augen bedeutet zweite Person
- **Genehmigungsworkflows mit >2 Personen** (Three-Way-Match, n-of-m-Voting) — Erweiterung; Vier-Augen ist Minimum
- **Code-Review in Softwareentwicklung** — analoge Idee, aber anderer Kontext
- **Segregation of Duties (SoD)** — weiter gefasstes COSO-Prinzip; Vier-Augen ist konkrete Umsetzung

**Anmerkungen / Edge-Cases:**
- **Notfall-Override:** bei Ausfall des Approvers (Krankheit, Urlaub) ist eine definierte Vertretungsregelung nötig. Solo-Genehmigung bleibt ausgeschlossen.
- **Micro-Kanzlei mit nur 1 Berechtigten:** wenn nur **ein** User existiert, ist Vier-Augen nicht durchsetzbar. Zwei Lösungen: (a) externer Approver (z. B. Partnerkanzlei) via Zugang; (b) entsprechend dokumentierter Verzicht mit IKS-Äquivalent-Kompensationsmaßnahme.
- **Performance vs. Sicherheit:** Vier-Augen verlangsamt Workflows. Lösungen: Workflow-Optimierung (parallele Approvals bei unabhängigen Vorgängen), klare SLAs, Benachrichtigungs-Automation.
- **Dokumentation des Ablehnungsgrunds:** ist Pflicht, nicht Option; unbegründete Ablehnungen sind nicht IKS-konform. UI-Validator erzwingt Text > 10 Zeichen.
- **Admin-Self-Approval vermeiden:** auch bei Admin-Rolle wird der Identitäts-Check durchgesetzt. Ausnahme nur für reine Systemoperationen (nicht-fachliche, wie Scheduled Jobs).
- **Audit-Trail der Freigaben:** Entscheidungsbegründung im Audit-Log ist vorbeugend wichtig — bei späterem Streit ersetzt es die Erinnerung der Beteiligten.
- **Kollusion mehrerer Personen:** Vier-Augen schützt nicht gegen abgestimmten Betrug zweier Personen. Hier greift die Kombination mit Hash-Chain (nicht-wegwaschbar), Audit-Log und externe Betriebsprüfung.
- **Umgang mit Automatisierung:** System-Actions (Cronjobs, Schnittstellen-Imports) können kein „zweites Auge" sein. Lösung: regelmäßige **Batch-Approvals** durch menschlichen Approver für System-generierte Events; oder Kategorisierung als „nicht kritisch" bei Routine-Imports mit eigener IKS-Absicherung.

---

## 9. Dokumentenerkennungs-Pipeline (Self-hosted Vision-Modell)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Dokumentenerkennungs-Pipeline |
| **Synonyme (DE)** | Automatische Dokumentenerkennung (UI-Bezeichnung), datensouveräner Belegleser (Marketing-Sprachregelung), OCR-Pipeline (historisch / intern sekundär), Belegerkennung, automatische Belegerfassung, Intelligent Document Processing (IDP), Document Understanding |
| **Arabisch** | خط إنتاج التعرف على المستندات — نموذج بصري محلي الاستضافة (آلية معالجة متعددة المراحل تُحوِّل ملفات الـ Beleg — PDF، صور JPEG/PNG، ملفات ممسوحة ضوئياً — إلى بيانات محاسبية منظَّمة قابلة للترحيل، مع التزام معماري راسخ بـ Datensouveränität كاملة — البيانات لا تغادر خوادم Harouda في أي لحظة؛ Pipeline من مراحل: Upload إلى CAS → Pre-Processing لتحسين الصورة والتقليب → **استدلال محلي** عبر Vision-Transformer مخصَّص لفهم المستندات — Donut (NAVER) أو Qwen2-VL (Alibaba) أو Florence-2 (Microsoft) — كلها Open-Source برخصة Apache-2.0 أو MIT مُدرَّبة على فهم البنية الهيكلية للفواتير مباشرةً بدون الحاجة إلى template ثابت لكل مورِّد → Post-Processing مع التحقق من Pflichtangaben وفقاً لـ § 14 Abs. 4 UStG → Confidence-Routing ثلاثي الطبقات — ≥ 95% أوتوماتيكي، 70–95% مراجعة، < 70% إدخال يدوي؛ القرار المعماري المحوري مبني على ثلاث قواعد: **أولاً** رفض Cloud-APIs للذكاء الاصطناعي — Claude, GPT-4o, Gemini — بسبب StBerG § 57 Verschwiegenheitspflicht و DSGVO Art. 5 Datenminimierung؛ **ثانياً** رفض Tesseract + Regex — ليس عدم كفاية Tesseract بل هشاشة الـ Regex أمام تنوُّع قوالب الفواتير الألمانية (300–800 قاعدة متناقضة على مدى 12 شهراً = Wartungsalbtraum); **ثالثاً** اختيار Vision-Transformer محلي الاستضافة — Document Understanding دون إرسال بيانات خارجياً، بتكلفة ثابتة عبر GPU واحد (RTX 4090 يكفي لحجم Kanzlei نموذجية)؛ السياسة التسويقية الصارمة: في UI ووثائق المنتج والتسويق تُسمَّى الميزة „Automatische Dokumentenerkennung" أو „datensouveräner Belegleser" — **لا يُستخدم مصطلح „KI" أو „AI" أمام المستخدم** — الصياغة الدفاعية قانونياً وتسويقياً: „dateninterne Verarbeitung ohne externe KI-Dienste") |
| **Englisch (Code-Kontext)** | `docExtraction`, `visionModel`, `inferenceService`, `confidenceScore`, `humanInLoop`, `reviewQueue` |
| **Kategorie** | Architektur-Pipeline / On-Premise Dokumentenverarbeitung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Mehrstufige, **vollständig on-premise betriebene** Verarbeitungskette, die einen hochgeladenen Beleg in **strukturierte, buchungsfähige Daten** (Rechnungsnummer, Datum, Lieferant, Posten, USt-Sätze, Gesamtbetrag) umwandelt. Jedes Feld erhält einen **Konfidenzwert** (0–100 %), auf dessen Grundlage der Vorgang entweder vollautomatisch verbucht, zur menschlichen Prüfung (**Human-in-the-Loop**) vorgelegt oder komplett manuell erfasst wird. Die Extraktions-Engine ist ein **selbstgehostetes Vision-Transformer-Modell** — **kein** externer Cloud-Dienst, **keine** API-Aufrufe an Fremdanbieter für Belegdaten, **keine** generative KI. Die UI-Bezeichnung ist **„Automatische Dokumentenerkennung"**; die technisch präzise Beschreibung *„dateninterne Verarbeitung ohne externe KI-Dienste"* ist die offizielle Sprachregelung gegenüber Kunden und Prüfern.

**Architektur-Entscheidung — vergleichende Bewertung der Optionen:**

| Option | Datenschutz | Qualität | Wartung | Kosten | Entscheidung |
|---|---|---|---|---|---|
| **A. Cloud-LLM-API** (Claude, GPT-4o, Gemini) | 🟡 Daten verlassen Server; AVV + Sub-Processor-Kette nötig; StBerG § 57 rechtlich belastet | ✅ sehr hoch | ✅ niedrig | 🟡 0,05–0,20 €/Beleg laufend (~500–2.000 €/Jahr) | ❌ **abgelehnt** — Verschwiegenheitspflicht-Risiko |
| **B. Tesseract + Regex** (lokal) | ✅ 100 % lokal | ❌ niedrig (70–85 % auf Rohzeichen; strukturelle Extraktion brüchig) | ❌ 300–800 Regex-Regeln über 12 Monate, Template-Explosion pro Lieferant | ✅ keine API-Kosten, aber 8.000–50.000 € Developer-Zeit | ❌ **abgelehnt** — Wartungsalbtraum, Total-Cost höher als Option C |
| **C. Self-hosted Vision-Transformer** (Donut, Qwen2-VL, Florence-2, Pix2Struct) | ✅ 100 % lokal | ✅ hoch (Document Understanding mit inhärentem Struktur-Verständnis) | 🟡 GPU-Betrieb + periodische Modell-Updates | 🟡 einmal GPU (~2.000–5.000 €) + Strom | ✅ **gewählt** |

**Ausgewählte Kandidaten-Modelle (Open-Source, kommerziell nutzbar):**

| Modell | Herausgeber | Lizenz | Größe | GPU-Bedarf | Stärke |
|---|---|---|---|---|---|
| **Donut** | NAVER CLOVA | Apache 2.0 | ~200 MB | 8 GB VRAM | End-to-End-Extraktion, auf deutschem Rechnungskorpus fein-tuningbar |
| **Qwen2-VL-2B** | Alibaba | Apache 2.0 | ~4 GB | 8 GB VRAM | Multilingual, neuere Architektur, robust |
| **Qwen2-VL-7B** | Alibaba | Apache 2.0 | ~14 GB | 16 GB VRAM | Höhere Qualität, mehr Overhead |
| **Florence-2** | Microsoft | MIT | ~1 GB | 8 GB VRAM | Kompakt, generalistisch |
| **Pix2Struct** | Google | Apache 2.0 | ~1,3 GB | 12 GB VRAM | Spezialisiert auf visuelle Dokumentenfragen |

**Produktions-Empfehlung:** **Donut** als primäre Engine (auf deutschem Rechnungskorpus fein-getunt), **Qwen2-VL-2B** in Reserve für Sonderfälle (schlechte Scans, Fremdsprachen).

⚠️ **Ausdrücklich ausgeschlossen:** LayoutLMv3 (Microsoft) — trotz hoher Qualität unter CC-BY-NC-SA-4.0 lizenziert, **nicht kommerziell nutzbar** ohne Zusatzlizenz.

**Pipeline-Stufen:**

```
 Upload ─► CAS-Storage ─► Pre-Processing ─► Vision-Transformer ─► Post-Processing ─► Confidence-Routing
   │            │               │                    │                    │                   │
   ▼            ▼               ▼                    ▼                    ▼                   ▼
 Beleg       (§ 5 CAS)      De-Skew/Denoise     Structured JSON       Validierung         Auto-Book  (≥ 95 %)
                            Orient-Correction   + Konfidenzen         Plausibilität       Review     (70–95 %)
                            PDF→Image           + Bounding-Boxes      EN-16931-Check      Manual     (<  70 %)
```

**Engine-Abstraktion (Blackbox-/Hexagonal-Prinzip):**

Die Extraktions-Engine ist über ein **Interface** von der Domänen-Logik entkoppelt — Modell-Wechsel oder Ergänzung einer Zweit-Engine ohne Anwendungslogik-Änderung möglich.

```typescript
// src/application/ports/DocumentExtractionEngine.ts
interface DocumentExtractionEngine {
  extract(input: Buffer, mimeType: string, hints?: ExtractionHints): Promise<ExtractionResult>;
}

interface ExtractionResult {
  fields: {
    [fieldName: string]: {
      value: string | Decimal | Date;
      confidence: number;          // 0.0 – 1.0
      alternatives?: Alternative[];
      bounding_box?: Rectangle;
    };
  };
  raw_text?: string;
  engine_metadata: {
    engine: 'donut' | 'qwen2-vl-2b' | 'qwen2-vl-7b' | 'florence-2';
    model_version: string;
    processing_ms: number;
    gpu_used: boolean;
  };
}
```

**Interner Inferenz-Service (Python / FastAPI, GPU-Host):**

```python
# services/doc-extraction/main.py
from fastapi import FastAPI, UploadFile, Header, HTTPException
from transformers import DonutProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch, os, hmac, io

app = FastAPI()
device = "cuda" if torch.cuda.is_available() else "cpu"
processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained(
    "naver-clova-ix/donut-base-finetuned-cord-v2"
).to(device)
INTERNAL_TOKEN = os.environ["INTERNAL_SERVICE_TOKEN"]

@app.post("/extract")
async def extract(file: UploadFile, x_internal_auth: str = Header()):
    if not hmac.compare_digest(x_internal_auth, INTERNAL_TOKEN):
        raise HTTPException(401, "Unauthorized internal call")
    image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    pixel_values = processor(image, return_tensors="pt").pixel_values.to(device)
    task_prompt = "<s_invoice>"
    decoder_input_ids = processor.tokenizer(
        task_prompt, add_special_tokens=False, return_tensors="pt"
    ).input_ids.to(device)
    outputs = model.generate(
        pixel_values,
        decoder_input_ids=decoder_input_ids,
        max_length=1024,
        output_scores=True,
        return_dict_in_generate=True,
    )
    sequence = processor.batch_decode(outputs.sequences)[0]
    parsed = processor.token2json(sequence)
    confidence = compute_field_confidence(outputs.scores, parsed)
    return {
        "fields": parsed,
        "confidence_per_field": confidence,
        "engine_metadata": {
            "engine": "donut",
            "model_version": "donut-cord-v2",
            "gpu_used": device == "cuda",
        },
    }
```

**TypeScript-Adapter (Supabase Edge Function oder Backend):**

```typescript
// services/extract-invoice/donutAdapter.ts
export class DonutExtractionEngine implements DocumentExtractionEngine {
  constructor(
    private readonly serviceUrl: string,     // http://doc-extraction.internal:8000
    private readonly serviceToken: string,   // HMAC-Token, niemals an Client
  ) {}

  async extract(input: Buffer, mimeType: string): Promise<ExtractionResult> {
    const form = new FormData();
    form.append("file", new Blob([input], { type: mimeType }));
    const response = await fetch(`${this.serviceUrl}/extract`, {
      method: "POST",
      headers: { "X-Internal-Auth": this.serviceToken },
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new ExtractionError(await response.text());
    return await response.json();
  }
}
```

**Konfidenz-Routing:**

| Konfidenz-Bereich | Verhalten | GoBD-Relevanz |
|---|---|---|
| ≥ 95 % auf **allen** Pflichtfeldern | Auto-Buchung (Status `auto_booked`) + Audit-Log mit Engine-Metadaten | Rz. 135: automatische Erfassung zulässig bei Kontrollsystem |
| 70 % ≤ conf < 95 % auf ≥ 1 Feld | Review-Queue; UI mit Feld-Highlighting + Alternativen | Rz. 104: IKS-Konform durch menschliche Kontrolle |
| < 70 % auf ≥ 1 Feld | Manuelle Erfassung; Original-PDF als Referenz | Rz. 136: traditionelle Belegerfassung |
| Plausibilitäts-Fail (Total ≠ Σ Posten) | Review-Queue unabhängig von Konfidenz | IKS-Pflichtfall |
| Leer / unlesbar / Modell-Fehler | Fehler-Status; User-Notification | — |

**Human-in-the-Loop als primärer Fallback — bewusste Entscheidung:**

Statt einer algorithmischen Zweit-Engine als Kaskade wurde menschliche Prüfung als Fallback gewählt. Begründung:
- **Semantische Modell-Fehler** (z. B. Verwechslung von Brutto- und Nettobetrag, falsche USt-Satz-Zuordnung) sind von einer zweiten ML-Engine **nicht zuverlässig erkennbar** — beide könnten denselben Fehler machen.
- Menschliche Prüfung bei Confidence < 70 % oder Plausibilitäts-Fail ist GoBD-rechtlich **robuster** als algorithmischer Fallback.
- **Komplexitäts-Reduktion:** eine Produktiv-Engine, eine Review-UI, keine Engine-Orchestrierungs-Logik.

---

**Sprachregelung & UI-/Marketing-Kommunikation:**

| Kontext | Bezeichnung | Begründung |
|---|---|---|
| **UI (Produkt-Oberfläche)** | „Automatische Dokumentenerkennung", „Belegleser" | Konservative Kanzleien sind KI-skeptisch; Sprachregelung vermeidet Abschreckung |
| **Marketing / Vertrieb** | „datensouveräner Belegleser", „dateninterne Verarbeitung ohne externe KI-Dienste" | Betont den Datenschutz-Vorteil; juristisch korrekte Abgrenzung |
| **Interne technische Doku** (dieses Modul) | „Vision-Transformer", „Self-hosted ML-Modell" | Technische Präzision für Entwickler und Prüfer |
| **Kundendialog** (Kanzlei-Admin, DPO) | „lokale ML-Komponente zur Dokumentenerkennung, ohne Datenweitergabe an Dritte" | Offenlegung gegenüber fachlich informierten Stakeholdern |

**EU-AI-Act-Einordnung:**

Der Vision-Transformer-basierte Belegleser ist nach Verordnung (EU) 2024/1689 zu klassifizieren als:
- **Nicht** Annex III (High-Risk) — Buchhaltung ist kein aufgezählter Hochrisiko-Bereich
- **Nicht** Art. 50 Transparenzpflicht — keine generative Ausgabe, keine Mensch-Imitation, keine tiefen Fälschungen
- **Nicht** Art. 5 verbotene Praktiken
- Einzuordnen als **Limited-Risk-AI-System** bzw. im Graubereich dessen, was als „AI System" i. S. v. Art. 3(1) gilt

Konsequenz: **Keine besonderen AI-Act-Pflichten** über die ohnehin geltenden DSGVO-/GoBD-Anforderungen hinaus. Die Sprachregelung *„ohne externe KI-Dienste"* ist dabei technisch präzise (keine Cloud-API-Anbindung an AI-Services) und strategisch sicher.

**Rechtsgrundlage & Standards:**
- **GoBD Rz. 135, 136** — elektronische Belegerfassung
- **GoBD Rz. 137** — ersetzendes Scannen (Papier → Digital + Vernichtung der Papieroriginale)
- **§ 147 Abs. 2 AO** — elektronische Aufbewahrung mit bildlicher Übereinstimmung
- **BMF vom 28.11.2019** (IV A 4 - S 0316/19/10003 :001) — Grundsätze zur Digitalisierung von Belegen
- **Art. 5 Abs. 1 lit. c DSGVO** — Datenminimierung; lokale Verarbeitung ist deren Umsetzung
- **Art. 25 DSGVO** — Privacy by Design; On-Premise-Architektur als Design-Wahl
- **Art. 32 DSGVO** — TOM; lokale Verarbeitung reduziert Angriffsfläche
- **StBerG § 57** — Verschwiegenheitspflicht; Cloud-KI wäre kritisch, lokale ML-Komponenten unproblematisch
- **§ 203 Abs. 1 Nr. 3 StGB** — Mandatsgeheimnis
- **EU AI Act (Verordnung (EU) 2024/1689)** — Limited Risk, **keine** Art.-50-Transparenzpflicht, **nicht** Annex III
- **ISO 32000-1 / -2** — PDF-Formate
- **ISO 15489-1** — Records Management
- **IDW PS 330** — IT-gestützte Prozesse in der Abschlussprüfung
- **Apache 2.0 / MIT** — Open-Source-Lizenzen der eingesetzten Modelle

**Verwandte Begriffe:**
- [Beleg](./02-buchhaltung.md#17-beleg) / [Belegnummer](./02-buchhaltung.md#18-belegnummer) — fachlicher Output
- [Content-Addressable Storage](#5-content-addressable-storage-cas) — Original-Datei wird als CAS gespeichert
- [Vier-Augen-Prinzip](#8-vier-augen-prinzip) — Review-Queue als Kontroll-Schritt
- [Pflichtangaben einer Rechnung](./06-belege-rechnung.md#2-pflichtangaben-einer-rechnung--14-abs-4-ustg) — Zielfelder der Extraktion
- [Event-Sourcing](#6-event-sourcing) — Extraktions-Ergebnis erzeugt `BelegOcrCompleted`-Event
- [Mandantenfähigkeit](#1-mandantenfähigkeit-multi-tenancy) — Inferenz-Service ist mandant-agnostisch, aber Eingabe/Ausgabe per RLS isoliert
- [DSGVO](./01-grundlagen.md#9-dsgvo) — lokale Verarbeitung vereinfacht DPA-Pflichten

**Verwendung im Code:**
- **Infrastruktur-Separation:** GPU-Host (physischer oder virtueller Server mit NVIDIA-GPU) läuft isoliert vom Supabase-PostgreSQL — Kommunikation über internes Netzwerk mit HMAC-signiertem Token.
- **Model-Serving:** FastAPI-basierter Inferenz-Service (`services/doc-extraction/`), im Docker-Container, mit GPU-Passthrough. Start-Up lädt Modell einmal in VRAM, hält es persistent.
- **Queue-Pattern:** Upload eines Belegs triggert kein synchrones Extract — stattdessen wird ein Event `BelegUploaded` in der Extraktions-Outbox abgelegt; Worker holen Aufgaben asynchron ab, was Lastspitzen puffert.
- **Edge Function `extract-invoice-data`:**
  ```typescript
  export async function handler(req: Request): Promise<Response> {
    const { beleg_id, mandant_id } = await req.json();
    const blob = await readBelegFromCAS(beleg_id, mandant_id);
    const engine: DocumentExtractionEngine = createEngine(mandant.preferences);

    const result = await engine.extract(blob, blob.type);
    const normalized = postProcess(result);
    const minConfidence = Math.min(
      ...Object.values(normalized.fields).map(f => f.confidence)
    );
    const decision = minConfidence >= 0.95 ? 'auto_book'
                   : minConfidence >= 0.70 ? 'review_queue'
                   : 'manual';

    await appendEvent({
      mandantId: mandant_id,
      aggregateType: 'beleg',
      aggregateId: beleg_id,
      eventType: 'BelegOcrCompleted',
      payload: { result: normalized, decision, engine: result.engine_metadata },
      metadata: { user_id: 'system_extraction_service', source: 'donut-v2' },
    });
    return new Response(JSON.stringify({ decision, result: normalized }));
  }
  ```
- **Review-UI:** React-Komponente mit Original-PDF-Preview (lokal ausgeliefert, keine externen Viewer-Dienste), Feld-Highlighting basierend auf Bounding-Boxes, Konfidenz-Farbcodierung (grün ≥ 95 %, gelb 70–95 %, rot < 70 %), Korrektur-Formular + „Genehmigen"/„Ablehnen". UI-Text strikt *„Automatische Dokumentenerkennung"* — keine KI-Terminologie.
- **Modell-Update-Strategie:** neue Modell-Version zunächst parallel im **Shadow-Mode** betrieben (Ergebnisse logged, nicht verwendet); nach statistischer Validierung auf Produktions-Korpus → Rollout.
- **Modell-Karteien (AI Governance):** trotz Limited-Risk-Einstufung wird pro Modell eine **Model-Card** geführt (Herkunft, Lizenz, Trainingsdaten-Beschreibung, bekannte Limitationen) — gute Praxis und vorbereitend für eventuelle künftige Regulierung.
- **Fein-Tuning-Pipeline (optional):** deutsche Rechnungs-Korpus-Annotation durch eigenes Review-Team; Fein-Tuning auf eigener GPU-Infra; Artefakte ebenfalls nicht cloud-gehostet.

**Nicht verwechseln mit:**
- **Cloud-LLM-APIs** (Claude, GPT-4o, Gemini) — Option A, wegen StBerG/DSGVO abgelehnt
- **Tesseract + Regex** — Option B, wegen Wartungsalbtraum abgelehnt; Tesseract bleibt für Sonder-Anwendungen (Volltext-Index, barrierefreie Suche) intern verfügbar, aber nicht in der Buchungs-Pipeline
- **LLM-basierte Generierung** — Vision-Transformer ist **diskriminativ/extraktiv**, nicht generativ — klassifiziert Pixel zu strukturiertem Output, produziert keine freie Sprache
- **Template-OCR** — Lieferanten-spezifische Schablonen; Harouda nutzt template-freie Modelle
- **Volltextindex** — Text suchbar machen; unsere Pipeline extrahiert zusätzlich **Struktur**
- **E-Rechnung (XRechnung/ZUGFeRD)** — strukturierte Daten bereits XML-kodiert; Pipeline greift nur bei PDF-/Bild-Belegen ohne strukturierten Teil
- **ERP-Schnittstellen-Import** — strukturierter Zugang ohne Dateinerkennung; orthogonal

**Anmerkungen / Edge-Cases:**
- **GPU-Kapazitätsplanung:** ein RTX 4090 (24 GB VRAM) verarbeitet ~5–15 Belege/Minute mit Donut; für eine Kanzlei mit 50 Mandanten × 20 Belege/Tag → 1.000 Belege/Tag → < 2 Stunden reine GPU-Zeit. Ein GPU-Server bedient 5–10 Kanzleien.
- **Fallback bei GPU-Ausfall:** CPU-Inferenz ist möglich (Donut auf CPU ≈ 10× langsamer), aber akzeptabel als Notbetrieb. Automatische Umschaltung via Health-Check.
- **Ersetzendes Scannen (BMF 28.11.2019):** Papier-Original darf nach GoBD-konformer Digitalisierung vernichtet werden — nur unter strengen Voraussetzungen: dokumentierter Scan-Prozess (Organisationsanweisung), Qualitätskontrolle, eindeutige Verknüpfung zum Original, Unveränderbarkeit (→ CAS + Hash-Chain). Rücksprache mit Steuerberater empfohlen.
- **Mehrseitige Rechnungen:** Pipeline muss Mehrseiten-PDFs als Einheit behandeln; Felder können über Seiten verteilt sein.
- **Handschriftliche Quittungen / Kassenbons:** Vision-Transformer-Qualität fällt ab. Confidence wird automatisch niedriger → manuelle Erfassung als Default.
- **Belege in Fremdsprache:** Qwen2-VL ist mehrsprachig robust; Donut benötigt Fein-Tuning pro Sprache. Engine-Auswahl berücksichtigt erwartete Sprache (aus Mandanten-Historie).
- **Duplicate-Detection:** derselbe Beleg darf nur einmal verbucht werden. Erkennung via CAS-Hash (siehe #5) + Lieferanten-/Datumsvergleich.
- **Pflichtangaben-Validierung:** die 9 Pflichtangaben nach § 14 Abs. 4 UStG werden gegen das Ergebnis geprüft; fehlende Angaben → Beleg kann **nicht** vollständig auto-verbucht werden (Review-Queue-Pflicht).
- **Anzahlungs- vs. Schlussrechnung:** Engine-Prompt / Post-Processor unterscheidet; Fehlklassifikation hat bilanzielle Folgen → hohe Review-Pflicht bei Verdachtsfällen.
- **Modell-Halluzinationen (reduziert, nicht null):** Vision-Transformer halluzinieren deutlich seltener als LLMs, können aber Feld-Werte erfinden, die plausibel aussehen. Mitigation: (a) Schema-gezwungener JSON-Output, (b) Plausibilitätsprüfung (Summe = Σ Posten?), (c) konservative Confidence-Schwelle (≥ 95 % für Auto-Book).
- **Model-Governance:** jede Modell-Version erhält eigenen Identifier; Auto-Book-Buchungen tragen im Audit-Log die Engine-Version → jederzeitige Nachvollziehbarkeit bei späterer Modell-Anpassung.
- **Zukünftige Cloud-Option bleibt dauerhaft ausgeschlossen:** auch wenn Cloud-APIs rechtlich einfacher würden (z. B. durch EU-Sovereign-AI-Cloud), bleibt der On-Premise-Ansatz strategisches Alleinstellungsmerkmal von Harouda.
- **Bei Unsicherheit zu ersetzendem Scannen, Sonderformaten (Reisekostenabrechnung, Kraftstoffquittung) oder fremdsprachlichen Belegen: Rücksprache mit Steuerberater / IT-Compliance-Berater.**

---

## 10. Peppol-Netzwerk / AS4-Routing

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Peppol-Netzwerk |
| **Synonyme (DE)** | PEPPOL (Pan-European Public Procurement Online, offizielle Schreibweise), Peppol-eDelivery-Network, Peppol-Transport-Schicht |
| **Arabisch** | شبكة Peppol وبروتوكول النقل AS4 (الشبكة الدولية اللامركزية المعتمدة أوروبياً ودولياً لنقل مستندات الأعمال الإلكترونية — فواتير E-Rechnung خاصةً — بين المُرسِل والمُستقبِل عبر بروتوكول AS4 القياسي؛ التمييز الجوهري عن ملف 06-belege-rechnung.md: هناك تم توثيق **الصيغة** — XRechnung، EN 16931، ZUGFeRD — **ما يُرسَل**؛ هنا نوثِّق **كيفية الإرسال** — Transport-Mechanismus؛ المكونات: **Sender-Access-Point (SAP)** بوابة المُرسِل، **Receiver-Access-Point (RAP)** بوابة المستقبل، **SMP (Service Metadata Publisher)** يسجل المستقبل قدراته، **SML (Service Metadata Locator)** DNS العالمي للعثور على SMP المستقبل؛ بروتوكول AS4 هو Applicability Statement 4 قائم على ebMS 3.0 فوق HTTPS مع توقيع وتشفير؛ عنوان الشبكة في Peppol هو **Peppol-Identifikator** — في ألمانيا للقطاع العام هو Leitweg-ID بتشكيل `04011:xxx`؛ القرار المعماري الرئيسي في Harouda: **لا نُشغِّل Access-Point بأنفسنا** — بل نستعين بمزود خدمة معتمد Peppol-Certified Dienstleister كـ Comarch أو Basware أو Procura — والحال أنها مسؤولية تشغيلية كبيرة للحصول على شهادة OpenPeppol) |
| **Englisch (Code-Kontext)** | `peppol`, `as4`, `accessPoint`, `smp`, `leitwegId` |
| **Kategorie** | Architektur / Netzwerk-Infrastruktur |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Offenes, föderiertes Netzwerk für den elektronischen Austausch von Geschäftsdokumenten (vor allem elektronischen Rechnungen) zwischen Unternehmen und Verwaltungen, betrieben von der internationalen Organisation **OpenPeppol AISBL**. Die Infrastruktur nutzt das **AS4-Protokoll** (ebMS 3.0 über HTTPS) für den sicheren Transport und ein verteiltes Namens- und Diensteverzeichnis (**SMP/SML**). In Deutschland ist Peppol die vorgegebene Transport-Schicht für **B2G-E-Rechnungen** an Bundesbehörden; für **B2B** ab 2025 als eine der zulässigen Übertragungswege etabliert.

**Architektur-Komponenten:**

```
   ┌─────────────┐                                              ┌──────────────┐
   │  Sender     │                                              │  Receiver    │
   │ (Harouda-   │     (1) SMP-Abfrage über SML (DNS)           │ (Öffentliche │
   │  Mandant)   │ ◄──(2) Routing-Info des RAP──────────────►   │  Verwaltung  │
   └─────┬───────┘                                              │  / B2B-Kunde)│
         │                                                      └──────┬───────┘
         ▼                                                             ▲
   ┌─────────────┐     (3) AS4-gesicherter Transport           ┌──────┴───────┐
   │  Sender-AP  │═════════════════════════════════════════════►│ Receiver-AP  │
   │  (Dienst-   │          HTTPS + XML-Signatur + Encryption  │ (Dienst-     │
   │  leister)   │                                              │  leister)    │
   └─────────────┘                                              └──────────────┘
```

**Vier-Corner-Modell (4C):**

| Corner | Rolle | Anmerkung |
|---|---|---|
| **C1 (Sender)** | Das versendende Unternehmen (Harouda-Mandant) | Erstellt Dokument (XRechnung) |
| **C2 (Sender Access Point)** | Infrastruktur-Dienstleister | Zertifiziert, transportiert über AS4 |
| **C3 (Receiver Access Point)** | Infrastruktur-Dienstleister des Empfängers | Empfängt AS4-Message, übergibt an Empfänger |
| **C4 (Receiver)** | Das empfangende Unternehmen / die Behörde | Verarbeitet Dokument |

Harouda agiert auf **C1**; der Access-Point-Dienstleister (Comarch, Basware, Procura, etc.) deckt **C2** ab.

**AS4-Protokoll-Kerneigenschaften:**

| Aspekt | Wert |
|---|---|
| Transport | HTTPS (TCP/443) |
| Messaging-Standard | ebMS 3.0 (OASIS) + AS4-Profil |
| Signatur | XMLDSig über Payload + Header (W3C) |
| Verschlüsselung | XMLEnc end-to-end |
| Nachrichtenempfang | Receipt (Signed Receipt) als Quittung |
| Retry-Semantik | Automatische Wiederholung mit Back-Off |
| Zustellgarantie | „At least once" + Empfangsbestätigung |

**Peppol-Identifikator — das Adressierungsformat:**

```
Format:           scheme::identifier
Beispiele:
  0088:5790000436002        (GLN — Global Location Number)
  9958:04011                (DE:LWID — deutsche Leitweg-ID)
  0204:991-12345-67         (DE:LWID voll qualifiziert für öffentliche Verwaltung)
  0106:12345678             (DE:HR — Handelsregisternummer)
```

**Leitweg-ID (Deutschland B2G):** 4-stellige Grob-ID + 2–46-stellige Fein-ID + optionale Prüfziffer (z. B. `04011-KAN-89`); Pflicht bei E-Rechnungen an deutsche Bundes-/Landesbehörden seit 27.11.2020 (Bund) bzw. je nach Bundesland (Länder).

**Rechtsgrundlage & Standards:**
- **Richtlinie 2014/55/EU** — E-Rechnungen im öffentlichen Auftragswesen (B2G)
- **E-Rechnungs-Verordnung (ERechV)** — Bundesverwaltung Deutschland
- **Landes-E-Rechnungs-Verordnungen** der Bundesländer (unterschiedliche Stichtage)
- **Wachstumschancengesetz vom 27.03.2024** — B2B-E-Rechnungspflicht ab 2025 (siehe [Wachstumschancengesetz](./06-belege-rechnung.md#7-wachstumschancengesetz--b2b-rechnungspflicht-ab-2025))
- **OASIS ebMS 3.0 Core Specification**
- **OASIS AS4 Profile**
- **OpenPeppol-Spezifikationen (BIS Billing 3.0, BIS 3.0 Transport Infrastructure)**
- **W3C XML-Signature Syntax and Processing**
- **W3C XML Encryption Syntax and Processing**
- **DIN EN 16931** — semantisches Datenmodell (siehe [EN 16931](./06-belege-rechnung.md#8-en-16931))
- **KoSIT (Koordinierungsstelle für IT-Standards)** — deutsche Betreiber-Stelle für XRechnung
- **eIDAS VO (EU) Nr. 910/2014** — vertrauenswürdige Dienste (Signaturen, Zeitstempel)

**Verwandte Begriffe:**
- [E-Rechnung](./06-belege-rechnung.md#6-e-rechnung-elektronische-rechnung) — das versendete Dokument
- [XRechnung](./06-belege-rechnung.md#9-xrechnung) — deutsche Pflicht-Syntax
- [EN 16931](./06-belege-rechnung.md#8-en-16931) — semantisches Modell
- [ZUGFeRD](./06-belege-rechnung.md#10-zugferd) — hybride Alternative; Peppol-taugliche Profile erforderlich
- [Wachstumschancengesetz](./06-belege-rechnung.md#7-wachstumschancengesetz--b2b-rechnungspflicht-ab-2025) — B2B-Pflicht-Rahmen

**Verwendung im Code:**
- **Dienstleister-Integration statt Eigenbetrieb:** Harouda integriert sich über REST-/SOAP-API eines **Peppol-zertifizierten Access-Point-Anbieters**. Beispiel-Schnittstelle:
  ```typescript
  interface PeppolAccessPoint {
    send(invoice: XRechnungDocument, recipient: PeppolId): Promise<PeppolReceipt>;
    lookupCapabilities(recipient: PeppolId): Promise<PeppolCapabilities>;
  }

  class ComarchPeppolAdapter implements PeppolAccessPoint {
    constructor(private apiKey: string, private endpoint: string) {}
    async send(invoice: XRechnungDocument, recipient: PeppolId): Promise<PeppolReceipt> {
      // …HTTP-Call an Dienstleister-API…
    }
  }
  ```
- **Outbox-Pattern:** XRechnung wird erst in eine Outbox-Tabelle persistiert (mit Status `pending_send`); ein Background-Worker sendet an den Access-Point und aktualisiert Status (`sent`, `delivered`, `failed`). Retry-Logik + Dead-Letter-Queue.
- **Leitweg-ID-Validator:** Prüfziffern-Algorithmus (siehe KoSIT-Spezifikation); eingegebene Leitweg-ID wird vor Versand validiert.
- **Receipt-Verarbeitung:** Empfangsbestätigung als Event (`InvoiceDelivered` mit Receipt-Token); archiviert im CAS als Nachweis-Dokument.
- **Inbound-Empfang (B2B ab 2025):** wenn Harouda auch Empfänger ist, benötigt Mandant eine eigene Peppol-ID — Access-Point-Dienstleister stellt Inbox bereit, Harouda pullt regelmäßig.
- **Konfiguration pro Mandant:** Access-Point-Anbieter-Wahl, Peppol-ID, Zertifikate als Mandanten-Stammdaten; Multi-Dienstleister-Support (Rückfall bei Anbieter-Ausfall).
- **Testumgebung:** Peppol-Testnetzwerk (Test-SML) für Entwicklung; Produktions-Wechsel erfolgt via Konfigurations-Flag.

**Nicht verwechseln mit:**
- **E-Mail-Versand von PDF-Rechnungen** — klassischer Weg, durch E-Rechnungs-Pflicht seit 2025 B2B **nicht mehr ausreichend** (rechnerisch; bis 31.12.2026 Übergangsregeln)
- **EDI-Netzwerke** (EDIFACT, X12) — ältere B2B-Standards; weiterhin in Industrien verbreitet, aber nicht Peppol-kompatibel direkt
- **SEPA** — Zahlungs-Infrastruktur; orthogonal zu Rechnungs-Versand
- **SWIFT** — Banknachrichtenverkehr; orthogonal
- **XRechnung als Datei** — die Format-Spezifikation; Peppol ist das Transportnetz dafür
- **ZUGFeRD** — hybrides Format; kann über Peppol versendet werden, erfordert aber EN-16931-konformes Profil

**Anmerkungen / Edge-Cases:**
- **Make-or-Buy-Entscheidung — klar Buy:** ein eigener Access-Point erfordert OpenPeppol-Zertifizierung (Audit, Gebühren ~10.000 €/Jahr), AS4-Kernkompetenz, 24/7-Betrieb, Zertifikat-Management. Für Harouda nicht wirtschaftlich — Dienstleister-Integration ist der pragmatische Weg.
- **Anbieter-Lock-In:** ein Wechsel des Access-Point-Anbieters ist mit Migrations-Aufwand verbunden. Gegenmaßnahmen: Peppol-ID-Portabilität (technisch möglich, operativ ≈ 2–4 Wochen), Hexagonal-Architektur im Code (Adapter-Pattern).
- **B2B-Pflicht ab 01.01.2025 — Empfangsseite:** jeder Mandant (unabhängig von Versand) muss E-Rechnungen **empfangen** können; Peppol-Inbound ist **eine** Option (neben E-Mail-Empfang von PDF/A-3-ZUGFeRD).
- **Sanktionen bei Nichteinhaltung:** fehlerhafte / nicht rechtzeitige E-Rechnung → Verlust des Vorsteuerabzugs beim Empfänger; Finanzverwaltung nicht verpflichtet, Korrekturfrist zu gewähren.
- **International:** Peppol ist weltweit verbreitet, aber **nicht überall Pflicht**. Peppol BIS 3.0 vs. länderspezifische Profile (Italien: FatturaPA, Frankreich: Chorus Pro — zukünftig Peppol).
- **Zertifikats-Pflege:** AS4-Signatur-/Verschlüsselungs-Zertifikate haben endliche Gültigkeit; Dienstleister übernimmt, aber Monitoring auf Kundenseite empfehlenswert.
- **Netzwerkausfälle / DSGVO:** bei Ausfall des Anbieters → Pending-Queue wächst; nach 24 h automatische Eskalation an Admin. Personenbezogene Rechnungsdaten im Transit sind DSGVO-relevant — AVV mit Access-Point-Anbieter Pflicht.
- **Bei Zertifikats-/Konfigurations-Problemen, Anbieter-Migration oder bei B2G-Vergabe-Anforderungen Rücksprache mit IT-Dienstleister und Steuerberater** — die Kombination technischer und rechtlicher Aspekte ist komplex und haftungsrelevant.

---
