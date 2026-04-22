# Roadmap & Gap-Analyse

Nicht dasselbe wie „alles, was uns einfällt" — nur Dinge, die zwischen
**heute** und einem ausgereiften Produkt liegen. Priorisierung:
**P1** blockiert Go-Live, **P2** wichtig aber parallel-arbeitbar,
**P3** Nice-to-have.

Legende: 🟥 = kritisch · 🟧 = wichtig · 🟩 = nice · ⏳ = Aufwand.

---

## Priorität 1 — Must-Have für Go-Live

### 1.1 🟥 ELSTER ERiC-Integration ⏳ 2-4 Wochen

**Wofür nötig:** UStVA, Lohnsteuer-Anmeldung, E-Bilanz direkt ans Finanzamt.

**Lösungspfad:**
- Option A: Node-Native-Addon (N-API) um `libericapi.dll` (Windows) bzw.
  `libericapi.so` (Linux) — komplexe Build-Toolchain, aber offizieller Weg.
- Option B: Dedizierter Backend-Service (Go / Rust) mit ERiC, der per
  REST aufgerufen wird. Weniger Build-Aufwand, aber zweite Komponente.
- Option C: Fachclient-Export beibehalten (DATEV / Taxpool) — kein
  Aufwand, aber Limitation für manche Kanzleien.

**Empfehlung:** B — Microservice. Trennt ELSTER-Zertifikats-Handling sauber.

### 1.2 🟥 E2E-Tests (Playwright) ⏳ 1-2 Wochen

**Wofür nötig:** Vertrauen, dass die 10-15 kritischen User-Journeys
durchlaufen (Login → Buchung → Festschreibung → UStVA → Z3-Export).

**Konkrete Szenarien:**
1. Login + Demo-Daten laden
2. Buchung anlegen → Plausi-OK → speichern
3. Monat festschreiben → Buchung ist locked
4. UStVA erzeugen → XML herunterladen
5. Beleg hochladen → OCR läuft → Verknüpfung
6. Bilanz erzeugen → Summe A = Summe P
7. Lohnabrechnung → Archiv enthält PDF
8. E-Rechnung XRechnung erzeugen → Validator OK
9. ZUGFeRD-PDF empfangen → Parser extrahiert Daten
10. Z3-Export → ZIP enthält alle Dateien + korrekte Hashes

### 1.3 🟥 Server-side Backup-Strategie (PITR + pg_dump + S3) ⏳ 2-3 Tage Ops + 1 Tag Docs

**Status-Update Sprint-3:** Ein clientseitiger Datenexport (`/admin/datenexport`,
DSGVO Art. 20) wurde implementiert, **schließt diesen Blocker NICHT**. Der
eigentliche Blocker ist Ops-Arbeit, nicht TypeScript.

**Wofür nötig:** Datenwiederherstellung bei Desaster (Supabase-Projekt
gelöscht, Account gesperrt, Region-Ausfall) + Mandanten-Onboarding (Import
aus DATEV/anderer Kanzleisoftware).

**Umfang (siehe `docs/BACKUP-STRATEGY.md`):**
- Supabase Point-in-Time Recovery (PITR) aktivieren, Retention ≥ 7 Tage.
- `pg_dump` via Edge Function oder separaten Backend-Dienst (ggf. im Paket
  mit dem geplanten ELSTER-ERiC-Microservice, P1 #1).
- Off-Site-Replikation auf S3 Frankfurt mit AES-256.
- Retention-Tiers: täglich 30 T / wöchentlich 90 T / monatlich 12 M / jährlich
  10 J (§ 147 AO).
- Restore-Runbook mit RTO ≤ 4 h, RPO ≤ 24 h, quartalsweiser Testlauf.
- Mandanten-Import: DATEV-CSV-Upload → Parser → Bulk-Insert mit
  Plausi-Rückfragen.

**Was NICHT in Scope ist:** Ein clientseitiger "Backup"-Button, der in
Wahrheit nur einen Export erzeugt — die falsche Framing wurde in Sprint-3
explizit abgelehnt.

### 1.4 🟥 CI/CD + Staging ⏳ 1 Woche

**Wofür nötig:** Jedes PR läuft Tests; jeder Merge landet automatisch auf
Staging; erst nach manuellem Sign-Off auf Prod.

**Stack-Vorschlag:** GitHub Actions (`.github/workflows/`), ein
Supabase-Staging-Projekt + ein Vercel/Netlify-Preview pro PR.

### 1.5 🟥 Belegerfassung → Supabase ⏳ 1 Woche

**Kontext:** Aktuell liegen Belege im localStorage. Das ist für Demo OK,
aber unbrauchbar für Produktivkanzlei.

**Lösungspfad:**
- Supabase Storage Bucket `belege/` mit RLS nach `tenant_id`.
- Repository `BelegeRepo.ts` anlegen.
- Dual-Mode-Handling analog `api/journal.ts`.

### 1.6 🟥 DSGVO-Paket ⏳ 1-2 Wochen

- Datenschutzerklärung (juristische Vorlage).
- AVV-Muster für Kanzlei-Kunden.
- Löschung-UI unter `/einstellungen/konto` inkl. 30-Tage-Grace.
- „My Data"-Export (alle personenbezogenen Daten als ZIP).

---

## Priorität 2 — Wichtig, nicht blockierend

### 2.1 🟧 DEÜV-Meldungen ⏳ 2-3 Wochen

**Wofür:** SV-Anmeldung/Abmeldung/Jahresmeldung an Krankenkassen.

**Umfang:** DEÜV-XML-Generator + Übertragung via `sv.net`-Einreichung.
Gut verfügbare Lib-Landschaft fehlt; eigener Builder nötig.

### 2.2 🟧 PDF/A-3 volle Compliance ⏳ 1-2 Wochen

**Kontext:** Unsere ZUGFeRD-PDFs haben keinen XMP-Metadata-Stream und
kein OutputIntent. Funktional OK, aber nicht veraPDF-zertifiziert.

**Lösungspfad:** pdf-lib um XMP-Injection erweitern (Workaround-Lib oder
eigenes Utility). Alternativ: Post-Processing via GhostScript / veraPDF.

### 2.3 🟧 XRechnung XSD + volle BR-Regeln ⏳ 2 Wochen

- KoSIT-Prüftool-Regeln (200+ BR-Regeln) integrieren.
- XSD-Validierung gegen offizielles UBL-Schema.

### 2.4 🟧 PEPPOL-Access-Point-Anbindung ⏳ 3-4 Wochen

**Wofür:** EU-weiter E-Rechnungs-Austausch ohne E-Mail.

**Komponenten:** AS4-Protokoll, SMP-Lookup, Zertifikats-Handling.

### 2.5 🟧 Error-Boundaries + Sentry ⏳ 3 Tage

Low-Hanging-Fruit; sollte eigentlich in P1, falls die Zeit reicht.

### 2.6 🟧 Mandanten-Löschung mit Retention-Lock ⏳ 1 Woche

10-Jahres-Retention automatisch prüfen vor physischer Löschung.

### 2.7 🟧 OSS / IOSS (EU-OneStopShop) ⏳ 3 Wochen

Für Kanzlei-Kunden mit EU-B2C-Verkäufen.

---

## Priorität 3 — Nice-to-have

### 3.1 🟩 Mobile App ⏳ 4+ Wochen

React Native oder PWA. Beleg-Scan on-the-go.

### 3.2 🟩 Mehrsprachigkeit (DE + EN) ⏳ 2 Wochen

`react-i18next` einführen, Strings extrahieren. Für DACH-Beratung
relevant.

### 3.3 🟩 ML-basierte Konten-Vorschläge ⏳ 2-3 Wochen

Belegerfassung: OCR-Text + Lieferanten → Konto-Vorschlag. Trainiert auf
historischen Buchungen.

### 3.4 🟩 Voice-Input für Beleg-Capture ⏳ 1 Woche

Web-Speech-API für Diktat der Beleg-Daten.

### 3.5 🟩 Mehrjahresvergleich (3+) ⏳ 3 Tage

Bereits vorhandenes `VorjahresvergleichBuilder` auf n-Jahre erweitern.

### 3.6 🟩 SKR04 / SKR49 Support ⏳ 1-2 Wochen

Alternative Kontenpläne — betrifft alle Mapping-Dateien.

### 3.7 🟩 UKV (§ 275 Abs. 3 HGB) ⏳ 1 Woche

Umsatzkostenverfahren als Alternative zum GKV.

---

## Deprecation-Watch

Externe Standards, die wir aktualisieren müssen, sobald sie sich ändern:

| Standard | Aktueller Stand | Erwartete Revision |
|----------|-----------------|---------------------|
| HGB-Taxonomie 6.8 | 2024-04-01 bis 2025 | **Taxonomie 6.9 ca. April 2026** → bereits fällig |
| DATEV EXTF 510 | stabil seit 2022 | EXTF 520 wird für H2/2026 erwartet |
| EN 16931 | 2017er Fassung + CIUS | Revision 2026/27 in Diskussion |
| XRechnung 3.0 | gültig seit 2024-02 | XRechnung 3.1 in Begutachtung |
| Lohnsteuer-Tarif | 2025 | **Lohn 2026 ab 2026-01-01** — muss nachgezogen werden |
| SV-Parameter | 2025 | **2026 BBG + Beitragssätze** — akut |
| Grundfreibetrag EStG | 11.604 € (2024), 11.784 € (2025) | **12.084 € (2026)** — prüfen |

**Konkrete Aktion:** Vor 2026-Abrechnungen müssen
`lohnsteuerTarif2025.ts` und `sozialversicherungParameter2025.ts` um
eine 2026-Variante ergänzt werden.

---

## Geplante nächste 3 Sprints (Vorschlag)

**Sprint N (2 Wochen):** P1.4 (CI/CD) + P1.2 (E2E) + P2.5 (Sentry)
**Sprint N+1 (2 Wochen):** P1.3 (Backup) + P1.5 (Belege-DB) + P1.6 (DSGVO)
**Sprint N+2 (2 Wochen):** P1.1 (ELSTER-Service MVP) + Deprecation-Watch
(Lohn/SV 2026)

Nach Sprint N+2 ist ein Go-Live in einer frühen Pilot-Kanzlei realistisch.
