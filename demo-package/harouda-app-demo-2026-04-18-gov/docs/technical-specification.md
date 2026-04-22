# harouda-app — Technische Spezifikation

**Zweck dieses Dokuments**: Technische Beschreibung des Demo-Stands für
interne Prüfung und Gesprächsgrundlage bei Lizenzierungsdiskussionen. Keine
Vermarktungsaussage.

**Stand**: 2026-04-18  ·  **Build**: Demo-Paket  ·  **Version**: 1.0 Demo

---

## 1. Zweck und Nutzungskontext

harouda-app demonstriert eine Kanzlei-orientierte Buchhaltungs- und
Steueranwendung: SKR03-Buchführung, Offene Posten, Mahnwesen,
Einnahmenüberschussrechnung, steuerliche Nebenrechnungen (GewSt, KSt,
Anlagen N/S/G/V/SO/AUS/Kind/Vorsorge/R/KAP), Beleg-Archivierung,
Bank-Datei-Import, E-Rechnungs-Lesung.

Einsatzzweck der Demo: **Kapazitäts-Demonstration** für Entscheider:innen
und Fachprüfer:innen. Nicht als Produktionssystem vorgesehen.

---

## 2. Technologie-Stack

| Schicht            | Komponente                           | Version      | Lizenz |
|--------------------|--------------------------------------|--------------|--------|
| Runtime Frontend   | React                                 | 19.x         | MIT |
| Sprache            | TypeScript                            | 5.6          | Apache 2.0 |
| Build / Dev-Server | Vite                                  | 8.x          | MIT |
| Routing            | react-router-dom                      | 7.x          | MIT |
| State / Caching    | @tanstack/react-query                 | 5.x          | MIT |
| Authentifizierung  | @supabase/supabase-js                 | 2.x          | MIT |
| OCR                | tesseract.js + pdfjs-dist             | 7.x / 4.x    | Apache 2.0 / Apache 2.0 |
| PDF                | jspdf + jspdf-autotable               | 4.x / 5.x    | MIT / MIT |
| Excel              | exceljs                               | 4.x          | MIT |
| ZIP                | jszip                                 | 3.x          | MIT |
| UI-Icons           | lucide-react                          | 1.x          | ISC |
| Toasts             | sonner                                | 2.x          | MIT |

Alle Abhängigkeiten sind quelloffen. Keine proprietären SDKs.

---

## 3. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser-Client                          │
│                                                                   │
│   ┌─────────────┐   ┌─────────────┐   ┌──────────────────────┐  │
│   │   React UI  │──▶│  React Q'ry │──▶│  API-Layer (TS)      │  │
│   │  (Pages,    │   │  (Caching,  │   │  src/api/*.ts        │  │
│   │  Komponents)│   │  Mutations) │   │                      │  │
│   └─────────────┘   └─────────────┘   └──────────┬───────────┘  │
│                                                   │              │
│   ┌─────────────────────────────────────────────────▼─────────┐  │
│   │  Persistenz                                               │  │
│   │                                                           │  │
│   │   localStorage                 Supabase (nur Auth,        │  │
│   │   (Demo-Build komplett         in Produktions-Build)      │  │
│   │    offline)                                               │  │
│   └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  Lokale Rechenkerne (keine Netzwerkcalls)               │    │
│   │  • SKR03 → EÜR-Zuordnung (euerMapping.ts)              │    │
│   │  • USt-Berechnung, GewSt, KSt, SV                       │    │
│   │  • Audit-Log mit SHA-256-Kette                          │    │
│   │  • MT940 / CAMT.053 Parser                              │    │
│   │  • ZUGFeRD/Factur-X XML-Extraktion aus PDF              │    │
│   │  • Besteuerungsanteil Rente (Kohortenprinzip)           │    │
│   └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (nur in Produktionsbuild)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase (gehostet)                       │
│  ┌───────────────────────┐   ┌────────────────────────────────┐ │
│  │   Auth                │   │  Postgres + Row Level Security │ │
│  │   (E-Mail/Passwort)   │   │  siehe supabase/migrations/*   │ │
│  └───────────────────────┘   └────────────────────────────────┘ │
│  ┌───────────────────────┐   ┌────────────────────────────────┐ │
│  │   Storage-Bucket      │   │  Edge Functions                │ │
│  │   (Belege)            │   │  validate-ustid (BZSt evatr)   │ │
│  └───────────────────────┘   └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Demo vs. Produktion

| Dimension           | Demo-Build                           | Produktions-Build                   |
|---------------------|--------------------------------------|-------------------------------------|
| Auth                | Fake-Session im Browser              | Supabase-Auth                       |
| Datenhaltung        | localStorage                         | Supabase-Postgres mit RLS           |
| Belege              | Data-URLs in localStorage            | Supabase-Storage pro Mandant        |
| USt-ID-Prüfung      | deaktiviert                          | Supabase-Edge-Function → BZSt       |
| Routing             | HashRouter (`#/dashboard`)           | BrowserRouter                       |
| Netzwerk            | keine Calls nach HTML-Load           | Supabase + BZSt                     |

---

## 4. Datenmodell

Zentrale Tabellen / TypeScript-Typen (siehe `src/types/db.ts`):

```
accounts         konto_nr, bezeichnung, kategorie, ust_satz, skr, is_active
clients          mandant_nr, name, steuernummer, ust_id, iban, ...
journal_entries  datum, beleg_nr, beschreibung, soll_konto, haben_konto,
                 betrag, ust_satz, status, client_id, skonto_pct,
                 skonto_tage, gegenseite, faelligkeit, version, audit_trail
documents        file_name, mime_type, size_bytes, beleg_nr,
                 journal_entry_id, ocr_text, uploaded_at
audit_log        at, actor, action, entity, entity_id, summary,
                 before, after, prev_hash, hash                  (SHA-256-Kette)
dunning_records  beleg_nr, stage (1–3), fee, verzugszinsen,
                 faelligkeit_alt, faelligkeit_neu, issued_at
```

SQL-Schema: `supabase/migrations/0001_init.sql`, `0002_audit_log.sql`,
`0003_audit_hash_chain.sql`.

Row Level Security: Jede Tabelle hat `owner_id`-Spalten-basierte Policies
(`auth.uid()`-Vergleich). Pro Tabelle: `select / insert / update / delete`
jeweils nur für Owner. `audit_log` zusätzlich: `update` und `delete` für
authenticated revoked — Datensätze sind append-only.

---

## 5. Schnittstellen

Alle Schnittstellen arbeiten mit **Dateien** oder **CORS-kompatiblen HTTPS-
Endpoints**. Keine nativen Binaries, keine ActiveX, keine ERiC-Bibliothek.

| Format        | Richtung | Zweck                            | Modul                      |
|---------------|----------|----------------------------------|----------------------------|
| MT940 (SWIFT) | Import   | Kontoauszug aus Banking-Portal   | `utils/mt940.ts`           |
| CAMT.053      | Import   | Kontoauszug ISO 20022            | `utils/camt.ts`            |
| ZUGFeRD / Factur-X / XRechnung | Import | E-Rechnung aus PDF/XML | `utils/zugferd.ts` |
| ELSTER-XML (UStVA) | Export | Import in ELSTER Online Portal | `utils/elster.ts` |
| ELSTER-XML (EÜR)   | Export | Import in ELSTER Online Portal | `utils/elsterEuer.ts` |
| DATEV-CSV (EXTF v700) | Export | Buchungsstapel                | `utils/datev.ts` |
| DATEV-ähnliche ATCH-ZIP | Export | Beleg-Archiv                 | `utils/datev.ts` |
| GDPdU / IDEA | Export   | Betriebsprüfung § 147 AO         | `utils/gdpdu.ts`           |
| PDF          | Export   | Berichte, Mahnungen              | `utils/exporters.ts`       |
| Excel (XLSX) | Export   | Berichte                         | `utils/exporters.ts`       |
| USt-ID BZSt evatr | Validate (Produktion) | USt-IdNr.-Prüfung | `api/ustid.ts` + Edge-Function |

---

## 6. Sicherheit

### Implementiert

- **Authentifizierung** (Produktion): Supabase JWTs mit automatischem Refresh.
- **Row Level Security**: alle Tabellen per `auth.uid()` isoliert.
- **Audit-Log mit Hash-Kette**: SHA-256 verkettet, Änderungen post-factum
  sind durch Integritätsprüfung erkennbar.
- **Transportverschlüsselung**: TLS von Browser zu Supabase (enforced
  durch Supabase-Plattform).
- **Datenverschlüsselung at Rest**: AES-256 durch Supabase / AWS RDS.

### Nicht implementiert (bewusst)

- **Qualifizierte elektronische Signatur (eIDAS)** — würde Hardware-Token
  (D-Trust / Bundesdruckerei) erfordern.
- **WORM-Storage** für das Audit-Log — Supabase-Standardspeicher ist nicht
  write-once.
- **Mehrstufiges Rollenmodell** (RBAC über `owner_id` hinaus).
- **MFA / zweiter Faktor** — Supabase unterstützt, standardmäßig nicht
  aktiviert.
- **Datenverschlüsselung client-seitig** (z. B. E2E für Belege).

Details im Abschnitt „Sicherheitslücken" der Verfahrensdokumentations-
Vorlage (`docs/verfahrensdokumentation.md`).

---

## 7. Performance / Bundle

| Metrik                   | Wert (Demo-Build, gzip)    |
|--------------------------|----------------------------|
| initial HTML             | ~0,6 KB                    |
| index.js                 | ~230 KB                    |
| index.css                | ~11 KB                     |
| exceljs (lazy)           | ~256 KB                    |
| jspdf (lazy)             | ~130 KB                    |
| pdfjs (lazy)             | ~97 KB                     |
| tesseract (lazy)         | nachgeladen je OCR-Aufruf  |
| **gesamt nach Cold-Load**| ~0,3 MB                    |

Code-Splitting: PDF-, Excel-, OCR- und ZIP-Bibliotheken werden per
`import()` erst bei Bedarf nachgeladen. Der Erstseitenabruf ist schlank;
schwere Bibliotheken landen nur dann im Browser-Cache, wenn der Nutzer
die jeweilige Funktion aufruft.

Time to Interactive auf Laptop-Hardware (Cold-Load, lokaler Serve):
~600 ms. Auf Messdatenbasis aus Vite-Build.

---

## 8. Browser-Unterstützung

Zielversionen: aktuelle Chrome/Edge, Firefox ESR, Safari 16+.
Erforderlich: `localStorage`, Web Crypto API (`crypto.subtle` für
Hash-Kette), `DOMParser` (für CAMT / ZUGFeRD), `Intl` (für de-DE
Formatierung).

---

## 9. Offene Architektur-Fragen für Produktivverwendung

Vor einem produktiven Rollout zu klären — keine Aufgabe des Demo-Builds:

1. **Hosting**: Supabase-Hosted vs. Supabase-Self-Hosted vs. klassischer
   Postgres + Custom Auth. Betreiber- und DSGVO-Fragen.
2. **Rechtemodell**: RBAC jenseits von `owner_id`, Berechtigungskonzept
   Kanzlei mit mehreren Mitarbeitenden.
3. **Archiv-Separation**: Auslagerung des Audit-Logs auf WORM-Speicher
   (S3 Object Lock o. ä.).
4. **Stammdaten-Separation**: Kreditoren/Debitoren-Stämme mit Adressen,
   Bankverbindungen, Zahlungsbedingungen.
5. **Lohnbuchhaltung**: aktuell nicht enthalten; SV-Rechner ist nur für
   Anlage N gedacht.
6. **Mobilfähigkeit**: Layout skaliert, aber keine nativen Apps.
7. **Mehrsprachigkeit**: UI ist deutschsprachig hart kodiert. i18n wäre
   Nachrüstaufgabe.
