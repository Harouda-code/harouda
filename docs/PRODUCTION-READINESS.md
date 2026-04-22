# Production-Readiness Assessment

Stand: 2026-04-20. Bestandsaufnahme **ohne** Schönfärbung — diese Checkliste
ist der Einstieg in Go-Live-Planung, nicht das Siegel.

**Zusammenfassung:**
- Security: ~60 % grün (Auth, RLS, Audit sind da; DSGVO-Dokumente fehlen)
- Performance: ~70 % grün (Bundle OK, E2E-Metriken nicht gemessen)
- Reliability: ~40 % grün (Error-Boundaries & Monitoring fehlen)
- Compliance: ~70 % grün (Kern-Compliance ja, externe Zertifizierung nein)
- Operational: ~30 % grün (CI/CD + Staging fehlen noch)
- Testing-Gaps: E2E, Load, Pen-Testing, Cross-Browser offen

**Ehrliches Gesamturteil:** **Nein — morgen nicht produktiv.** Gründe
unten in Kapitel G.

---

## A. Security Checklist

### A.1 Authentication & Authorization

- [x] Supabase Auth eingebunden (`api/supabase.ts`)
- [x] RLS-Policies auf allen Nutzerdaten-Tabellen (Migrations 0001, 0004)
- [x] Rollen-Modell angelegt (`tax_auditor`, Migration 0007)
- [ ] **RLS-Policies End-to-End mit realen Benutzern getestet** (nur Unit-Tests)
- [ ] **Session-Timeout konfiguriert** (Supabase-Default, nicht geprüft)
- [ ] **Password-Policy gesetzt** (min. Länge, Komplexität — Supabase-UI)
- [ ] **2FA aktiv** (Supabase-Feature, nicht ausgerollt)
- [x] Audit-Log erfasst Login-Erfolg/Fehlschlag (`app_logs`)

### A.2 Data Protection (DSGVO)

- [ ] **Datenschutzerklärung** (Vorlage fehlt)
- [ ] **AVV-Muster** (Auftragsverarbeitungsvertrag)
- [ ] **Recht auf Löschung** (Art. 17 DSGVO) — UI nicht vorhanden
- [ ] **Recht auf Datenportabilität** (Art. 20 DSGVO) — Teil-Implementation
      über CSV/DATEV-Export, aber kein zentraler „All-my-data"-Export
- [ ] **Cookie-Consent** (falls Tracking hinzukommt)
- [x] Verschlüsselung at rest (Supabase-Default: AES-256)
- [x] Verschlüsselung in transit (HTTPS über Supabase + Hosting)
- [ ] **Backup-Strategie + Retention** (noch nicht automatisiert)
- [ ] **Incident-Response-Plan** (nicht dokumentiert)

### A.3 Code Security

- [ ] `npm audit` clean (letzter Lauf: unbekannt — vor Go-Live nachholen)
- [x] Keine Secrets im Code (nur `import.meta.env.*`)
- [x] Input-Validation auf allen Forms (Zod/manuell)
- [x] SQL-Injection: nur parametrisierte Queries via Supabase-SDK
- [x] XSS: React-Default (keine `dangerouslySetInnerHTML` außer in
      bewussten Stellen — sollte vor Go-Live reviewt werden)
- [x] CSRF: Supabase-handled
- [ ] Rate-Limiting am Edge (Supabase Edge Functions — nicht konfiguriert)
- [x] File-Upload-Validation (MIME + Size in `BelegValidierungsService`)

---

## B. Performance Checklist

- [x] Bundle-Size gemessen: `dist/` ~2.4 MB gzip (Ziel < 3 MB)
- [ ] **First Contentful Paint < 2s** — nicht gemessen
- [ ] **Lighthouse-Score > 80 für Performance** — nicht gemessen
- [x] Code-Splitting aktiv (Vite-Default + dynamic imports für OCR/PDF)
- [ ] Virtualisierung für große Tabellen (10k+ Zeilen) — nicht implementiert
- [x] DB-Queries indiziert (Migration 0008 „scaling readiness")
- [ ] Image-Optimierung (Belege werden unkomprimiert gespeichert)
- [ ] Service-Worker für Offline (optional)

---

## C. Reliability Checklist

- [ ] **Error-Boundaries auf Page-Level** — **nicht vorhanden**
- [ ] **Fallback-UI für Crashes** — Router liefert nur `<Navigate />`
- [ ] **Sentry / Error-Tracking** — nicht integriert
- [ ] **Uptime-Monitoring** — hostingabhängig, nicht konfiguriert
- [ ] **Health-Check-Endpunkt** — Supabase hat /health, App nicht
- [x] DB-Retry (Supabase-SDK default 3 retries)
- [x] Graceful Degradation bei fehlendem Feature (viele Seiten haben
      `if (!data) return <Loader />`)
- [ ] **Backup-Restore End-to-End getestet** — nicht gemacht

---

## D. Compliance Checklist

- [ ] GoBD-Verfahrensdokumentation geschrieben (Rohfassung in
      `docs/verfahrensdokumentation.md` — Review durch Kanzlei nötig)
- [x] Retention-Struktur vorhanden (10 Jahre — allerdings **nicht
      automatisch enforced**, siehe Gap)
- [x] Audit-Trail queryable (`/einstellungen/audit`, SQL-Zugriff über
      `tax_auditor`-Rolle)
- [x] Festschreibungs-Mechanismus implementiert (siehe
      [COMPLIANCE-GUIDE.md](./COMPLIANCE-GUIDE.md))
- [x] Z3-Export mit Test-Daten durchgespielt (16 Tests)
- [ ] Zertifizierung (IDW PS 880, TR-RESISCAN) — **nicht beantragt**
- [ ] AGB für Kanzlei-Kunden — Vorlage fehlt
- [ ] Haftungsausschluss kommuniziert (Landingpage hat Disclaimer — aber
      keinen separaten Terms-of-Service-Dialog)

---

## E. Operational Checklist

- [ ] **CI/CD-Pipeline** — nicht eingerichtet (weder GitHub Actions noch
      GitLab CI noch Vercel-Pipeline)
- [ ] Automated Tests auf PR — nicht konfiguriert
- [ ] **Staging-Environment** — nicht vorhanden (nur lokaler Dev-Server)
- [x] DB-Migrations vorwärtskompatibel (Supabase-Migrations sortiert)
- [ ] Rollback-Plan (DB + App) — nicht dokumentiert
- [ ] Feature-Flags (für Canary-Release) — nicht implementiert
- [ ] Support-Team-Dokumentation — dieses Repo hat `docs/`, ein
      internes Runbook fehlt noch
- [ ] SLA-Definitionen — vertraglich zu klären
- [ ] Monitoring-Dashboards (Grafana / Supabase Insights) —
      hostingabhängig

---

## F. Testing Gaps

Diese Tests **fehlen**, müssen vor Go-Live durchgeführt werden:

- [ ] **End-to-End-Tests** (Playwright/Cypress) — nicht konfiguriert
- [ ] **Load-Tests** — wie viele Concurrent Users verkraftet die Postgres?
- [ ] **Penetration-Test** — kein externer Security-Audit
- [ ] **Cross-Browser** (Firefox / Safari / Edge / Mobile Safari)
- [ ] **Responsive / Mobile** (manueller Test empfohlen, automatisiert fehlt)
- [ ] **WCAG 2.1 AA** (Accessibility, Screenreader / Tastatur-Nav)
- [ ] **Echte ELSTER / DATEV / BZSt-Integration** (nur mit Demo-Zertifikat
      möglich — erfordert manuelles Testen in deren Umgebungen)

---

## G. „Können wir morgen produktiv gehen?" — ehrliche Antwort

**Kurz:** Nein.

**Ausführlich — die Blocker:**

1. **Keine CI/CD, kein Staging.** Ohne automatisiertes Testen auf jedem
   Commit + mindestens ein Staging-Env ist jeder Production-Deploy ein
   Blindflug. Aufwand: ~1 Woche.

2. **Keine Error-Boundaries, kein Sentry.** Bei einer unerwarteten
   Runtime-Exception sieht der Nutzer einen weißen Screen, und wir
   erfahren nichts davon. Aufwand: ~3 Tage.

3. **Keine DSGVO-Dokumente.** Kanzleien dürfen ohne Datenschutzerklärung
   + AVV keine Mandantendaten in einer externen SaaS verarbeiten.
   Aufwand: ~1 Woche (teilweise juristische Arbeit).

4. **Backup/Restore ungeprüft.** „Wir haben täglich Backups" ist kein
   Satz, den man sagen darf, ohne den Restore-Pfad einmal laufen zu
   lassen. Aufwand: ~3 Tage.

5. **Belegerfassungs-Persistenz steht noch im localStorage.** Solange
   hier keine DB-Persistenz liegt, sind Belege nicht Mandanten-übergreifend
   verfügbar. Aufwand: ~1 Woche.

6. **ELSTER-Abgabe bleibt manuell.** Kein Blocker für MVP, aber
   Kommunikation gegenüber Kanzlei-Kunden muss stimmen.

**Realistischer Go-Live-Horizont:** 6-8 Wochen, falls Blocker 1-5 als
Sprint-Ziel gefahren werden und ein externer Security-Audit parallel läuft.

---

## H. Empfohlener nächster Sprint

Priorisiert nach „Was blockiert Go-Live?":

1. **CI/CD einrichten** (GitHub Actions: `npm test` + `npm run build` auf PR)
2. **Sentry integrieren** + Error-Boundaries pro Page-Wrapper
3. **Staging-Environment** aufsetzen (separates Supabase-Projekt)
4. **DSGVO-Paket** (Datenschutzerklärung, AVV-Muster, Löschung-UI)
5. **Belegerfassung → Supabase** migrieren (Persistenz raus aus localStorage)
6. **Backup-Restore-Dry-Run** dokumentiert durchspielen

Danach: Playwright + WCAG-Audit + Pen-Test.
