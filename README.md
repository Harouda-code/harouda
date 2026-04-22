# harouda-app

Kanzlei-Software für Steuerberater — Dashboard, Buchungsjournal, SKR03-Kontenplan, Berichte (GuV, BWA, SuSa), USt-Voranmeldung, Anlage N, Beleg-Upload mit OCR.

Stack: React 19 · TypeScript · Vite · Supabase (auth) · React Query · Sonner.

## Schnellstart

```bash
npm install
npm run dev
# → http://localhost:5173
```

Login: Demo-Button auf `/login` (`admin@harouda.de` / `password123`). Nach dem Login landet man auf `/arbeitsplatz` (3-Spalten-Kanzlei-Einstieg); im DEMO-Modus seedet `autoSeedDemoIfNeeded()` beim ersten Start automatisch den SKR03-Kontenplan und die Kühn-Musterfirma (4 Mandanten, 52 Buchungen, 8 Anlagen). Die alte „Demo-Daten laden"-Schaltfläche auf dem Dashboard ist entfallen — die Seite `/dashboard` existiert als Weiterleitung auf `/arbeitsplatz` fort.

Supabase-Variablen in `.env.local`:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Funktionsumfang

- **Dashboard** mit KPIs (Umsatz/Ausgaben/Ergebnis pro Quartal, USt-Schuld).
- **Buchungsjournal** — Doppelte Buchführung (Soll/Haben) mit Pflichtfeldvalidierung, Skonto, USt-Satz, Mandantenfilter, DATEV-CSV-Export + Beleg-ZIP. Strg+N = neue Buchung, Esc = schließen.
- **Kontenplan SKR03** (~150 Standardkonten) mit Such- und Kategoriefilter. Konten aktiv/inaktiv, Bearbeiten/Löschen (nur solange nicht gebucht).
- **Berichte**: GuV, BWA (Monat vs. Vormonat vs. YTD), SuSa — mit Periodenfilter, Drucken, PDF- und Excel-Export.
- **USt-Voranmeldung** mit Kennzahlen 81/86/48/66/83, ELSTER-XML-Export, Kleinunternehmer-Hinweis.
- **Anlage N** mit Entfernungspauschale-Rechner (0,30 €/0,38 €).
- **Belegverwaltung** mit Drag-&-Drop, PDF- und Bild-OCR (`deu+eng`) via `tesseract.js` + `pdfjs-dist`, Verknüpfung mit Buchungen.
- **Mandanten** (Clients) mit Umschaltung in der Seitenleiste — filtert Dashboard / Journal / Belege / Berichte.
- **Einstellungen**: Kanzleistammdaten, Standard-Steuernummer (Validierung), ELSTER-Berater-Nr., Kleinunternehmer-Regelung.

## Was „echt“ ist vs. was Demonstration ist

Die folgenden Abgrenzungen sind wichtig — bitte nicht als Produktivsoftware einsetzen, ohne die Punkte zu adressieren.

### ⚠️ Datenhaltung

Alle Daten (Konten, Buchungen, Belege) werden derzeit in `localStorage` gespeichert. Supabase wird nur für die Authentifizierung verwendet. Für produktiven Einsatz die SQL-Migration unter `supabase/migrations/0001_init.sql` im Supabase-Projekt ausführen und die API-Module (`src/api/*.ts`) von `store` (localStorage) auf Supabase-Calls umstellen.

### ⚠️ DATEV-Export

- `DATEV-CSV` im Journal erzeugt eine CSV in Anlehnung an den öffentlich dokumentierten **Standard-Buchungsstapel** (EXTF v700). Das **lizenzierte** DATEV-Format kann kleine Abweichungen erfordern, die ein echter DATEV-Import unter Umständen ablehnt.
- `Beleg-ZIP` enthält `document.xml` + die Beleg-Dateien mit GUID-Referenz. Inspiriert von **DATEV Unternehmen online / ATCH**, aber nicht das zertifizierte Format.

### ⚠️ ELSTER

Der XML-Export der UStVA erzeugt ein Dokument in Anlehnung an das Schema der Finanzverwaltung. Die **direkte Einreichung** erfordert die ERiC-Bibliothek (C++) und ein Zertifikat — aus einem Browser heraus **nicht möglich**. Nutzen Sie den XML-Export für den Import in das ELSTER Online Portal oder einen zertifizierten Fachclient (DATEV, Taxpool, …).

### ⚠️ GoBD

Die App protokolliert `created_at`, `updated_at` und eine Versionsnummer pro Buchung als Basis für einen Audit-Trail. Eine **GoBD-Konformität** (IDW PS 880) verlangt jedoch darüber hinaus dokumentierte Prozesse, Unveränderbarkeit (WORM-Speicher), Verfahrensdokumentation und eine externe Prüfung — das ist eine Organisations- und Audit-Frage, keine reine Code-Eigenschaft.

### Nicht enthalten

- SEPA / MT940 / CAMT / PSD2-Banking
- Echte DATEV-Konnektoren (Online-Schnittstelle, DATEVconnect)
- Ziffernzertifikate, Signaturen, WORM-Storage
- Lohnbuchhaltung / Lohnsteueranmeldung (LStA)
- Bilanz (Bilanz-Report fehlt; GuV ist vorhanden)

## Projektstruktur

```
src/
  api/           # Datenzugriff: accounts, clients, journal, documents, reports, dashboard, store
  contexts/     # UserContext (Supabase-Auth), MandantContext, SettingsContext
  components/   # AppShell (Navigation + Mandantswitcher), RequireAuth, DocumentPreview
  pages/        # LandingPage, LoginPage, DashboardPage, JournalPage, AccountsPage,
                  # ClientsPage, ReportsPage, GuvPage, BwaPage, SuSaPage,
                  # TaxFormsPage, UstVoranmeldungPage, AnlageNPage,
                  # DocumentsPage, SettingsPage
  utils/        # ocr, elster (XML), datev (CSV + ATCH ZIP), exporters (PDF/Excel), validators
  types/        # db.ts — zentrale Domänentypen
supabase/
  migrations/   # 0001_init.sql — Schema + RLS-Policies + Storage-Bucket
```

## USt-ID-Prüfung (BZSt-Edge-Function)

Der „Daten holen"-Button auf der Mandanten-Seite prüft eine USt-IdNr. gegen den **BZSt evatr**-Dienst. Da BZSt kein CORS unterstützt und ISO-8859-1 ausliefert, ist ein server-seitiger Proxy nötig — enthalten als Supabase Edge Function unter `supabase/functions/validate-ustid/index.ts`.

Deploy:

```bash
supabase functions deploy validate-ustid
```

Ohne Deployment liefert die Funktion einen klaren Fehler statt einer Fake-Antwort. Der Proxy schickt nichts weiter als die eingegebene USt-IdNr., die eigene USt-IdNr. und (optional) Firmendaten — er speichert keine Abfragen.

## Bankimport

Die Seite `/bankimport` liest **MT940**- und **CAMT.053**-Dateien, die die Bank über das Online-Banking exportiert. Eine **direkte Bank-Anbindung** (PSD2, Open Banking) ist bewusst nicht enthalten: das erfordert entweder einen eigenen TPP-Vertrag mit BaFin-Registrierung oder einen Aggregator-Vertrag (finAPI, Klarna Kosma, Tink, FinTecSystems) — beides mit laufenden Kosten und rechtlichem Rahmen, nicht in Code lösbar.

## GoBD / Aufbewahrung / Prüfung

- **Hash-verkettetes Audit-Log** (SHA-256) in _Einstellungen → Audit-Log_: jede Änderung an Buchungen schreibt eine Zeile, die den Hash der vorherigen einbezieht. „Kette prüfen" verifiziert die Integrität. Das ist **tamper-evidence**, kein WORM-Storage — für echte Unveränderbarkeit zusätzlich auf ein append-only Medium spiegeln.
- **GDPdU / IDEA-Export** in _Einstellungen → Betriebsprüfung_: erzeugt ein ZIP mit `index.xml` + CSV-Dateien für Journal, Konten, Mandanten, Belege, Audit-Log. Ladbar in IDEA / AuditSolver.
- **Aufbewahrungsfristen-Übersicht** in _Einstellungen → Aufbewahrungsfristen_: listet alle Buchungen und Belege mit ihrem Ablaufdatum gemäß § 147 AO (8 Jahre ab 2025 für Buchungsbelege, 10 Jahre für Bücher/Jahresabschlüsse). Löscht nichts automatisch.
- **Fristenkalender** in _Einstellungen → Fristen_: UStVA, ZM, Vorauszahlungen, Jahreserklärungen. Wochenend-Verschiebung nach § 108 Abs. 3 AO, aber keine Bundesland-spezifischen Feiertage.
- **Verfahrensdokumentation-Vorlage** unter `docs/verfahrensdokumentation.md` — füllen Sie diese aus, bevor Sie produktiv werden.

## E-Rechnung (ZUGFeRD / Factur-X / XRechnung)

Seit 2025 Pflicht für B2B in Deutschland (§ 14 UStG). Unter `/zugferd` können ZUGFeRD-PDFs und XRechnung-XML eingelesen werden: die eingebettete Cross-Industry-Invoice-XML wird geparst, die Kopfdaten, Parteien und Positionen angezeigt, und mit einem Klick als Journal-Buchung angelegt.

## Entwicklung

```bash
npm run dev          # Vite dev server
npx tsc --noEmit     # type check
npm run lint         # ESLint
npm run build        # Production build (tsc -b && vite build)
npm test             # 676 tests (Vitest)
npm run test:coverage
```

## Dokumentation

Umfassende Doku unter [`docs/`](./docs/):

- **[PROJEKT-INVENTAR.md](./docs/PROJEKT-INVENTAR.md)** — Feature-Matrix,
  Test-Statistiken, Compliance-Landschaft, Architektur-Übersicht,
  DB-Schema.
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Architektur-
  Entscheidungen (Money, Closure-Table, Dual-Mode-Repos, …).
- **[DEVELOPER-ONBOARDING.md](./docs/DEVELOPER-ONBOARDING.md)** — Setup,
  Repo-Struktur, typische Aufgaben, Code-Review-Checkliste.
- **[COMPLIANCE-GUIDE.md](./docs/COMPLIANCE-GUIDE.md)** — GoBD / AO /
  UStG / EStG / HGB-Mapping auf Code-Stellen. Für Prüfer geschrieben.
- **[USER-GUIDE-DE.md](./docs/USER-GUIDE-DE.md)** — Workflows + FAQ
  für Kanzlei-Mitarbeiter:innen.
- **[PRODUCTION-READINESS.md](./docs/PRODUCTION-READINESS.md)** —
  Ehrliche Bestandsaufnahme vor Go-Live.
- **[ROADMAP.md](./docs/ROADMAP.md)** — P1/P2/P3-Gaps, Deprecation-Watch.
- **[GO-LIVE-CHECKLIST.md](./docs/GO-LIVE-CHECKLIST.md)** —
  T-4W / T-1W / Launch / Post-Launch mit Hard-Stops.

## Lizenz / Nutzungshinweis

Prototyp für eigenen Gebrauch. Kein zertifiziertes Produkt. Vor produktivem Einsatz die oben beschriebenen Lücken schließen und eine rechtliche / steuerliche Prüfung durch eine qualifizierte Fachperson durchführen lassen.
