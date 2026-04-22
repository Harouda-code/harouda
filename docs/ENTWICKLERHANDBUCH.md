# Entwicklerhandbuch — harouda-app

Technische Referenz für alle, die die App warten, erweitern oder
deployen. Voraussetzung: Node 20+, TypeScript-Grundkenntnisse,
Grundlagen React + Supabase.

---

## Inhaltsverzeichnis

1. [Architektur-Überblick](#1-architektur-überblick)
2. [Dual-Mode-Persistenz](#2-dual-mode-persistenz)
3. [Datenmodell & Migrationen](#3-datenmodell--migrationen)
4. [RBAC und Firmen-Isolation](#4-rbac-und-firmen-isolation)
5. [Audit-Log mit Hash-Kette](#5-audit-log-mit-hash-kette)
6. [Journal mit §32a-Hash-Kette](#6-journal-mit-hash-kette)
7. [Modul-Verzeichnis](#7-modul-verzeichnis)
8. [Einstellungen & Settings](#8-einstellungen--settings)
9. [Build, Test, Deploy](#9-build-test-deploy)
10. [Erweiterungs-Rezepte](#10-erweiterungs-rezepte)
11. [Compliance-Grenzen](#11-compliance-grenzen)

---

## 1. Architektur-Überblick

**Stack:**

- **Frontend**: Vite + React 19 + TypeScript + React Router
  (`HashRouter` in DEMO_MODE, sonst `BrowserRouter`)
- **Datencache**: `@tanstack/react-query`
- **UI**: Eigene CSS-Module, `lucide-react` Icons, `sonner` Toasts
- **Backend**: Supabase (Postgres + Auth + Storage + RLS)
- **Zertifizierte Dritt-Systeme (nicht integriert)**: ERiC für ELSTER,
  ITSG-Software für SV-Meldungen, DATEV-Online für Kanzleianbindung

**Ordnerstruktur:**

```
src/
  api/                 Daten-Zugriffe (dual-mode: store + supabase)
  components/          Wiederverwendbare React-Komponenten
  contexts/            React-Context-Provider (User, Company, Mandant, …)
  hooks/               Hooks (usePermissions, …)
  pages/               Eine Datei pro Route
  utils/               Reine Logik ohne React (Formate, Rechner, Parser)
  types/db.ts          Zentrale TypeScript-Definitionen zum DB-Schema
  data/                Statische Daten (SKR03-Seed, Fristen-Generator, …)
  App.tsx              Route-Konfiguration
  main.tsx             Bootstrap (Provider + Error-Handler)
supabase/migrations/   0001–0016 — siehe §3
docs/                  Diese Dokumente
```

**Datenfluss (Supabase-Modus):**

```
React-Komponente
  → useQuery / useMutation (React Query)
    → api/<modul>.ts
      → requireCompanyId()  ┐ aus db.ts (liest localStorage)
      → supabase.from(...)  ┘ Postgres-Zugriff, RLS filtert per company_id
        → audit.log(...)        writes to audit_log
```

**Datenfluss (DEMO-Modus):**

Dieselbe API-Schicht fällt in `store` (localStorage) zurück, wenn
`DEMO_MODE` true ist oder keine `activeCompanyId` gesetzt ist.

---

## 2. Dual-Mode-Persistenz

Jedes API-Modul hat die Form:

```ts
export async function fetchFoo(): Promise<Foo[]> {
  if (!shouldUseSupabase()) {
    return store.getFoos();
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("foos")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
  return (data ?? []) as Foo[];
}
```

- **`shouldUseSupabase()`** (`src/api/db.ts`) — true, wenn
  `DEMO_MODE=0` UND eine `activeCompanyId` im localStorage steht.
- **`requireCompanyId()`** wirft einen sprechenden Fehler, wenn die ID
  fehlt.
- **`store`** (`src/api/store.ts`) ist ein simples Read/Write über
  `localStorage`, typisiert per Generic.

### Warum dual?

- Onboarding ohne Supabase: Demo-Modus läuft vollständig im Browser
  (sehr niedrige Einstiegshürde).
- Schnelle Entwicklungs-Iteration ohne echte DB.
- Tests können gegen `store` laufen.

### Stolperfallen

- Wenn Sie ein neues Feld ergänzen, zwei Stellen anpassen:
  `store.set*` + die Supabase-Query.
- Wenn Sie Tests gegen localStorage schreiben: `store.setFoos([])` am
  Anfang aufrufen, um Isolation sicherzustellen.

---

## 3. Datenmodell & Migrationen

Migrationen liegen in `supabase/migrations/`:

| # | Datei | Inhalt |
|---|---|---|
| 0001 | `init.sql` | `accounts`, `clients`, `journal_entries`, `documents` — per-owner RLS |
| 0002 | `audit_log.sql` | `audit_log`-Tabelle |
| 0003 | `audit_hash_chain.sql` | Hash-Kette aufs Audit |
| 0004 | `multitenant.sql` | `companies`, `company_members`, Migration auf `company_id`-Schema |
| 0005 | `dunning_records.sql` | Mahnwesen |
| 0006 | `gobd_append_only.sql` | PG-Trigger blockieren UPDATE/DELETE auf gebuchten Einträgen und Audit-Log |
| 0007 | `tax_auditor_role.sql` | Rolle `tax_auditor` + `access_valid_until` |
| 0008 | `scaling_readiness.sql` | Zusatz-Indizes + `health_check`-View |
| 0009 | `journal_autolock.sql` | `locked_at = now() + 24h` per Insert-Trigger |
| 0010 | `journal_hash_chain.sql` | SHA-256-Kette auf `journal_entries`, `verify_journal_chain()` RPC |
| 0011 | `app_logs.sql` | Technisches System-Log (getrennt vom Audit) |
| 0012 | `invoice_archive.sql` | Duales Archiv `invoice_archive` + `invoice_xml_archive` mit Retention-Trigger |
| 0013 | `elster_submissions.sql` | Register manueller ELSTER-Abgaben |
| 0014 | `supplier_preferences.sql` | Lieferanten-Lernen ohne ML |
| 0015 | `advisor_notes.sql` | Beraternotizen append-only |
| 0016 | `employees.sql` | Mitarbeiter-Stammdaten |

**Einspielen:** `supabase db push` bzw. im Studio SQL-Editor. Reihenfolge
einhalten.

**Typ-Quelle der Wahrheit:** `src/types/db.ts`. Jede Tabelle hat dort
einen TypeScript-Typ. Bei Schema-Änderungen diese Datei ZUERST anpassen.

---

## 4. RBAC und Firmen-Isolation

### Rollen

Definiert in `src/contexts/CompanyContext.tsx`:

```
type CompanyRole = "owner" | "admin" | "member" | "readonly" | "tax_auditor"
```

### Berechtigungs-Hook

`src/hooks/usePermissions.ts`:

```ts
export type Permissions = {
  role: CompanyRole | null;
  canRead:   boolean;
  canWrite:  boolean;  // member, admin, owner
  canManage: boolean;  // admin, owner
  canAdmin:  boolean;  // admin, owner
  canOwn:    boolean;  // owner
  canAudit:  boolean;  // tax_auditor, admin, owner
  isAuditor: boolean;  // only tax_auditor
};
```

`tax_auditor` ist **orthogonal** zur operativen Rollenhierarchie: er
bekommt Lesezugriff und `canAudit`, aber kein `canWrite`.

### Firmen-Kontext

`src/contexts/CompanyContext.tsx` hält:

- `activeCompanyId` (localStorage-persistiert)
- `memberships[]` (aus `company_members` gelesen)
- `activeRole` (derived)

`bootstrapFirstCompany()` legt automatisch eine Default-Firma an, wenn
ein User sich das erste Mal einloggt und keiner Firma angehört.

### RLS-Pattern

Standard-Policy (select):

```sql
using (exists (
  select 1 from public.company_members cm
  where cm.company_id = <table>.company_id
    and cm.user_id = auth.uid()
))
```

Für `write`-Policies ergänzen wir `and cm.role in ('owner','admin','member')`.

---

## 5. Audit-Log mit Hash-Kette

**Datei:** `src/api/audit.ts`.

### Eintrag erzeugen

```ts
await log({
  action: "update",
  entity: "journal_entry",
  entity_id: entry.id,
  summary: `Buchung ${entry.beleg_nr} geändert`,
  before,
  after,
});
```

### Hash-Kette

- `prev_hash` = Hash des vorherigen Eintrags (oder 64 × `0` für Genesis)
- `hash` = SHA-256(prev_hash || canonicalJSON({row ohne hash}))
- Supabase-Variante hat `id: ""` im Hash-Input (UUID wird server-seitig
  vergeben)
- **`verifyAuditChain()`** rekonstruiert die Kette und akzeptiert
  4 Varianten: current/legacy × with-id/without-id, weil das
  `user_agent`-Feld erst in Migration 0011 dazukam — ältere Zeilen
  werden tolerant rehashed.

### WORM

Migration 0006 hängt Trigger auf `audit_log` gegen UPDATE/DELETE.

### Login/Logout/Signup

`UserContext.tsx` ruft `log()` mit Action `login`/`logout`/`signup` auf,
dedupliziert über `lastLoggedAuthRef`, damit Supabase-onAuthStateChange
nicht doppelt zählt.

---

## 6. Journal mit Hash-Kette

**Datei:** `src/utils/journalChain.ts`.

Im Unterschied zum Audit-Log-Hash deckt der Journal-Hash nur
**unveränderbare Kernfelder** ab:

```
prev_hash | datum | beleg_nr | soll_konto | haben_konto |
betrag(2-Dez.) | beschreibung | parent_entry_id(leer wenn null)
```

Ausdrücklich NICHT im Hash: `storno_status` (transitioniert legitim von
`active` → `reversed`; Wechsel wird über den Audit-Log erfasst).

**SQL-Spiegel:** Migration 0010 enthält `journal_entries_compute_hash()`
in plpgsql mit identischem Pipe-Format. Server-seitige Insert-Trigger
setzen `prev_hash` + `entry_hash`, falls die App sie nicht mitgeschickt
hat.

**RPC:** `verify_journal_chain(p_company_id)` läuft rein im Server
durch alle Zeilen.

**Client-Verifikation:** `verifyJournalChain(entries)` replays im
Browser.

**Beides notwendig?** Ja — der Client prüft, was er sehen kann
(tamper-evident); der RPC ist für Admin-Audits. Ketten können
manipuliert werden, wenn jemand mit DB-Admin-Rechten die Hashes
mitberechnet — das ist **tamper-evident**, nicht tamper-proof.

---

## 7. Modul-Verzeichnis

### Rechner (reine Logik, keine IO)

- `utils/lohnsteuer.ts` — §32a EStG 2025, 5 Tarifzonen, Soli, KiSt,
  Steuerklassen I–VI. **Planungsgrad.**
- `utils/sozialversicherung.ts` — 2025er SV-Sätze, BBG, Mini-/Midi-Job,
  PV Kinderlosenzuschlag + Kinder-Abschläge.
- `utils/cashflow.ts` — Liquiditäts-Heuristik inkl. per-Kunden
  days-to-pay.
- `utils/elsterPlausi.ts` — UStVA-Plausi.
- `utils/accountNormalization.ts` — Kontonummer-Padding + SKR03-Hints.
- `utils/bankMatch.ts` — Scoring Bank ↔ OPOS.
- `utils/invoiceFields.ts` — Regex-Extraktion aus OCR-Text.

### Datei-Generatoren

- `utils/datev.ts` — EXTF-Buchungsstapel + CP-1252-Encoder + ATCH-ZIP.
- `utils/xrechnungWriter.ts` — CII-XML Writer.
- `utils/zugferd.ts` — CII/UBL-Reader aus PDF/XML.
- `utils/sepa.ts` — PAIN.001.001.03 + IBAN-mod-97.
- `utils/gehaltsabrechnung.ts` — PDF-Payslip (jsPDF + autoTable).
- `utils/lohnsteueranmeldung.ts` — LStA CSV + ELSTER-shape XML.
- `utils/verfahrensdokumentation.ts` — 9-Abschnitt-PDF mit
  Änderungsprotokoll.
- `utils/gdpdu.ts` — ZIP mit index.xml.
- `utils/payrollPosting.ts` — Entwurfs-Buchungen aus Lohnlauf.
- `utils/elster.ts` — UStVA-XML.
- `utils/journalChain.ts` — SHA-256 kanonisch.
- `utils/ocr.ts` — Tesseract.js-Wrapper.
- `utils/bankImport.ts`, `utils/mt940.ts` — Bank-Parser.

### API-Schichten

Je eine Datei pro Tabelle:
`accounts`, `clients`, `journal`, `audit`, `documents`, `dunning`,
`invoiceArchive`, `elsterSubmissions`, `supplierPreferences`,
`advisorNotes`, `employees`, `appLog`, `advisorMetrics`.

### Kontexte

`UserContext`, `CompanyContext`, `MandantContext`, `SettingsContext`,
`YearContext`.

### Pages

Alle unter `src/pages/` — eine Datei pro Route. Seitenname entspricht
meist der Route, Pascal-case.

---

## 8. Einstellungen & Settings

**Typ:** `src/contexts/SettingsContext.tsx → Settings`.

**Persistenz:** `localStorage` unter `harouda:settings`. Es gibt **keine**
serverseitige Settings-Tabelle — Einstellungen sind pro Browser.

Wenn Sie ein neues Settings-Feld ergänzen:

1. `Settings` erweitern
2. `DEFAULTS` setzen
3. `SettingsPage.tsx` → Reset-Block updaten
4. UI-Eingabe in `SettingsPage.tsx` ergänzen

---

## 9. Build, Test, Deploy

### Lokales Dev-Setup

```
npm install
cp .env.example .env.local
# In .env.local entweder VITE_DEMO_MODE=1 oder
# VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY setzen
npm run dev
```

### Type-Check & Build

```
npx tsc --noEmit       # Type-Check
npx vite build         # Produktions-Build
```

Beide Schritte sind Teil der CI-Erwartung. Der Code ist konsistent
strict-TypeScript; `any` vermeiden, stattdessen `unknown` + Narrowing.

### Supabase-Setup

1. Projekt erzeugen, Region Frankfurt empfohlen.
2. Auth aktivieren (E-Mail/Passwort), „Confirm Email" optional
   deaktivieren im Demo.
3. SQL-Migrationen 0001–0016 der Reihe nach einspielen.
4. Optional: Storage-Bucket `documents` für größere Belege
   (> 1 MB).

### Deploy-Optionen

- **Statisch** (Netlify, Vercel, Cloudflare Pages, S3+CloudFront):
  `dist/` nach Build deployen.
- **Self-Host**: `npm run build` → Nginx/Caddy mit SPA-Rewrite-Rule
  (`try_files $uri /index.html`).

### Environment Variables

| Variable | Zweck |
|---|---|
| `VITE_DEMO_MODE` | `1` = rein lokaler Browser-Modus |
| `VITE_SUPABASE_URL` | Supabase-Projekt-URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon-Key (nicht der service-role) |

---

## 10. Erweiterungs-Rezepte

### 10.1 Neue Entität anlegen

1. **SQL-Migration** schreiben (`supabase/migrations/0017_*.sql`).
2. **Typ** in `src/types/db.ts` ergänzen.
3. **Store-Getter/Setter** in `src/api/store.ts`.
4. **API-Modul** `src/api/<entity>.ts` mit `fetch`/`create`/`update`
   in Dual-Mode.
5. **React-Query-Hooks** inline in Pages.
6. **Page** mit List + Form.
7. **Route** in `App.tsx`.
8. **Nav** in `components/AppShell.tsx`.
9. Nach jeder DB-Mutation: `void log(...)` für Audit.

### 10.2 Neuer Report

`src/api/reports.ts` ist die Sammelstelle für Report-Berechnungen
(reine Funktionen auf `JournalEntry[]`+`Account[]`). Im Page-Layer
dann React-Query mit `computeXYZ(...)`.

### 10.3 Neues Steuer-Formular

1. `src/data/formMeta.ts` erweitern: `version`, `veranlagungsjahr`,
   `lastReviewed`, `reviewStatus`.
2. Neue Page unter `src/pages/` mit `FormMetaBadge`-Komponente.
3. Route in `App.tsx`.
4. Export-Funktion in `utils/exporters.ts` benutzen oder eigene
   Helper (je nach Outputformat).

### 10.4 Neue Rolle

1. Enum in `CompanyRole` erweitern.
2. `ORDER` und `permsFor()` in `usePermissions.ts` anpassen.
3. Migration für `company_role`-Enum-Wert (siehe `0007` als Beispiel).
4. UI-Anzeige in `MembersPage.tsx`.

---

## 11. Compliance-Grenzen

Was die App **nicht** ist, ist genau so wichtig wie was sie ist.

### Wo wir ausdrücklich nicht-zertifiziert sind

- **ITSG / SV-Meldewesen** — keine DEÜV, DSKV, BKV, BeSA-Übertragung
- **DATEV-Zertifizierung** — EXTF-CSV ist shape-kompatibel, nicht
  lizenziert
- **BMF-PAP** für Lohnsteuer — §32a EStG ist implementiert, aber der
  programmierte Tarifablaufplan nicht
- **GoBD-Testat** durch externen Prüfer — Hash-Ketten + WORM-Trigger
  sind **orientiert**, nicht zertifiziert
- **ERiC** — kein ELSTER-Versand aus dem Browser

### Wo wir serverseitige Unterstützung brauchen, die fehlt

- IP-Adresse + client-seitiges Rate-Limiting (Supabase liefert
  serverseitiges Auth-Rate-Limiting bereits)
- PSD2-Onlinebanking (FinAPI/Tink) → kein Backend
- Digital Signatures auf Rechnungen / Payslips → kein PKI
- E2E-Verschlüsselung Messaging → kein Key-Management

### Was standardmäßig nicht da ist, aber bei Bedarf ergänzbar

- Bilanz nach § 266 HGB (nur EÜR existiert)
- Kassenbuch + TSE
- Lohnbuchhaltung in voller Tiefe (YTD-Historie, Urlaubs-/Krankheits-
  Tage, Pfändung, betriebliche Altersvorsorge, …)
- PDF-Signatur / QR-Verify-Endpunkt
- E-Mail-Versand
- Mobile-App (Web ist responsiv, aber keine native PWA
  über Service-Worker hinaus)

---

*Ende des Entwicklerhandbuchs. Korrekturen bitte als PR gegen
`docs/ENTWICKLERHANDBUCH.md` einreichen.*
