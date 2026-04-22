# Developer-Onboarding

Für neue Entwickler:innen. Ziel: vom `git clone` bis zum ersten grünen
Test in unter 30 Minuten, und anschließend eine Landkarte durchs Repo.

---

## 1. Voraussetzungen

- **Node 20+** (wir nutzen `require("node:zlib")` in einem Domain-Modul —
  siehe `einvoice/ZugferdReader.ts`)
- **npm 10+** (kein yarn/pnpm-Lock commited)
- Ein Supabase-Projekt (nur für Non-Demo-Mode nötig)
- Windows, macOS oder Linux — entwickelt primär unter Windows 11 + Git-Bash

## 2. Setup

```bash
git clone <repo>
cd harouda-app
npm install
cp .env.local.example .env.local   # falls vorhanden — sonst neu anlegen
```

`.env.local` (nur für Produktionspfad nötig):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**Ohne** diese Variablen läuft die App im `DEMO_MODE` auf localStorage.

## 3. Entwicklung starten

```bash
npm run dev         # http://localhost:5173 — HMR aktiv
```

Login auf `/login` per Demo-Button (`admin@harouda.de` / `password123`),
dann auf dem Dashboard „Demo-Daten laden" klicken → SKR03-Kontenplan und
15 Musterbuchungen werden im localStorage gesät.

## 4. Tests

```bash
npm test                 # einmal run — 676 grün erwartet
npm run test:watch       # Watch-Mode
npm run test:coverage    # mit v8-Coverage — produziert coverage/index.html
npm run test:ui          # Vitest-UI auf http://localhost:51204
```

## 5. Build

```bash
npm run build           # tsc -b && vite build
npm run preview         # produziertes Bundle vom dist/ serven
```

Typische Bundlegröße: `dist/assets/*.js` ~2.4 MB gzip (inkl. tesseract,
pdf-lib, jspdf).

## 6. Repo-Struktur — die Landkarte

```
src/
  api/              # Data-Access (Supabase + localStorage Dual-Mode)
  components/       # React-Komponenten (AppShell, Charts, Shared)
  contexts/         # UserContext, MandantContext, SettingsContext, YearContext
  domain/           # ← reine Business-Logik, kein React, kein Supabase
    accounting/     # Bilanz, GuV, BWA, Vorjahresvergleich
    belege/         # Beleg-Validierung (§ 14 UStG)
    compliance/     # Deadline/Fristen-Service
    ebilanz/        # XBRL-Builder + HGB-Taxonomie 6.8
    einvoice/       # XRechnung + ZUGFeRD (Builder, Parser, Validator, Reader)
    euer/           # EÜR nach § 4 Abs. 3 EStG
    gdpdu/          # Z3-Export (§ 147 Abs. 6 AO)
    gobd/           # FestschreibungsService (Rz. 64)
    lohn/           # Lohnsteuer-Tarif 2025, SV-Parameter, Vorsorgepauschale
    ustva/          # UStVA + ZM
  lib/
    money/          # Money.ts + Decimal.js-Kapselung
    pdf/            # PdfReportBase, Kopf-/Fußzeilen, Tabellen
    zip/            # Zip-Bundler (für Z3 + DATEV-ATCH)
  pages/            # 138 Seiten — Routen-Endpunkte
  repositories/     # Spezialrepos (AuditRepo, EmployeeRepo, …)
  types/            # db.ts — DB-Schema-Typen
  utils/            # datev, elster, exporters, ocr, validators
supabase/
  migrations/       # 0001-0021 (21 Migrations)
docs/               # dieses Verzeichnis
```

**Faustregel:**
- Neue Business-Logik → `src/domain/<modul>/…`
- Neue UI-Seite → `src/pages/<Name>Page.tsx` + Route in `App.tsx`
- Neue DB-Tabelle → neue Migration + Typen in `src/types/db.ts` + Repo

## 7. Häufige Aufgaben mit Beispielen

### 7.1 Neues Steuerformular hinzufügen

Beispiel: „Anlage X".

1. `src/pages/AnlageXPage.tsx` erstellen (bestehende `AnlageNPage.tsx` als
   Vorlage).
2. Route in `src/App.tsx` eintragen:
   ```tsx
   <Route path="/steuer/anlage-x" element={<AnlageXPage />} />
   ```
3. Menü-Eintrag in `src/components/AppShell.tsx` unter `steuer`-Gruppe.
4. Falls Berechnungen nötig → **`src/domain/anlageX/AnlageXBuilder.ts`**
   mit reiner Logik + `__tests__/AnlageXBuilder.test.ts`.

### 7.2 Neuen Bericht hinzufügen

1. Builder in `src/domain/accounting/<Name>Builder.ts` (pure Funktionen).
2. Test in `__tests__/<Name>Builder.test.ts` mit Fixtures.
3. PDF-Renderer in `src/pages/<Name>Page.tsx`, der `PdfReportBase` nutzt.
4. Route + Menü-Eintrag wie oben.

### 7.3 Neues SKR03-Mapping

Beispiel: „Konto 3400 (Wareneingang 19 % USt) gehört in BWA-Zeile 11".

- `src/domain/accounting/skr03Mapping.ts` (Bilanz-Zuordnung)
- `src/domain/accounting/skr03GuvMapping.ts` (GuV-Zuordnung)
- Test erweitern — jedes neue Konto muss in mindestens einem Mapping
  auftauchen, sonst schlagen die Coverage-Tests an.

### 7.4 Migration schreiben

1. Neue Datei `supabase/migrations/0022_<name>.sql`.
2. Immer reversibel denken: `DROP TABLE IF EXISTS` oder separate Down-Migration.
3. RLS-Policy für neue Tabelle nicht vergessen:
   ```sql
   alter table foo enable row level security;
   create policy "foo_tenant_isolation" on foo using (tenant_id = auth.jwt() ->> 'tenant_id');
   ```
4. Typen in `src/types/db.ts` nachziehen.
5. Lokal testen: `supabase db reset && supabase db push`.

### 7.5 Neue E-Rechnungs-Regel hinzufügen

Beispiel: „BR-12: Buyer-Country ist Pflicht".

- `src/domain/einvoice/XRechnungValidator.ts` → Methode `validateOptions`
  oder `validateXml` erweitern.
- Neuen Test in `__tests__/XRechnung.test.ts` hinzufügen — positiv + negativ.

## 8. Git-Workflow

- Branch: `feature/<kurzname>` oder `fix/<kurzname>`.
- Commit-Nachrichten: prägnant im Imperativ, deutsch ODER englisch
  einheitlich pro Branch.
- Vor PR: `npm run build` + `npm test` lokal grün.
- PR-Description: was + **warum** (verlinke Issue/Ticket).

## 9. Code-Review-Checkliste

- [ ] Domain-Logik ohne React/Supabase-Imports?
- [ ] Money statt number bei Geldbeträgen?
- [ ] Test-Coverage nicht gesunken (`npm run test:coverage`)?
- [ ] Neue öffentliche API in TypeScript-Deklarationen gedeckt?
- [ ] Keine Secrets im Code (`env`-Zugriffe nur über `import.meta.env`)?
- [ ] Bei DB-Änderungen: Migration + Typen + RLS-Policy konsistent?
- [ ] Bei UI-Änderungen: mobile Breite getestet (375 px)?
- [ ] Legal/Compliance-Module: Gesetzes-Referenz in JSDoc?
- [ ] Keine toten Imports / keine auskommentierten Blöcke?

## 10. Debugging

- **Tests im Watch-Mode:** `npm run test:watch -- <filename-pattern>`
- **Vitest-UI für schlauen Filter:** `npm run test:ui`
- **App-Logs (Supabase-Modus):** Tabelle `app_logs` in Supabase, oder
  UI unter `/einstellungen/systemlog`
- **DEMO_MODE-Reset:** `localStorage.clear()` in der DevTools-Konsole
- **Coverage-HTML:** `coverage/index.html` nach `npm run test:coverage`

## 11. Bekannte Fußangeln

- **XML-Parsing mit UBL-Namespaces:** `querySelector` tut nicht, was man
  denkt. Immer `localName`-basierte Helpers (`childByName`,
  `descendantsByName`) benutzen — siehe `einvoice/XRechnungParser.ts`.
- **pdf-lib-Attachments:** Die Stream-Bytes kommen zlib-komprimiert
  zurück. In `ZugferdReader.ts` wird mit `zlib.inflateSync` dekodiert.
- **Vitest-Isolation:** Jeder Test startet eine neue happy-dom-Instanz —
  globale State-Leaks sind unwahrscheinlich, aber `beforeEach` trotzdem
  benutzen für `localStorage.clear()`.
- **TypeScript strict + pdf-lib:** Einige pdf-lib-APIs sind `any`-lastig;
  wir nutzen interne Casts (`as unknown as PDFStream`) in exakt zwei
  Dateien (`ZugferdBuilder.ts`, `ZugferdReader.ts`).
