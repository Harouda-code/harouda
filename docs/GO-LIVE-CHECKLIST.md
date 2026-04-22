# Go-Live-Checkliste

Ein linearer Fahrplan, getrennt nach Zeitpunkten. Pflicht-Haken werden
mit 🟥 markiert; falls einer davon offen ist, gehen wir **nicht** live.

---

## T-4 Wochen (Pre-Launch)

### Infrastruktur
- [ ] 🟥 Produktions-Supabase-Projekt angelegt
- [ ] 🟥 Produktions-Hosting (Vercel / Netlify / Eigenhost) konfiguriert
- [ ] 🟥 SSL-Zertifikat aktiv auf Zieldomain
- [ ] 🟥 Custom-Domain konfiguriert + DNS gesetzt
- [ ] Staging-Environment existiert (separates Supabase-Projekt)
- [ ] Backup-Schedule aktiv (täglich, 30 Tage Retention)

### Code & Qualität
- [ ] 🟥 Alle Tests grün (`npm test` → 676+ passed)
- [ ] 🟥 `npm run build` ohne Fehler
- [ ] 🟥 `npm audit` ohne HIGH/CRITICAL
- [ ] Coverage ≥ 88 % (aktuell: 91,03 %)
- [ ] Bundle-Size dokumentiert (< 3 MB gzip)
- [ ] CI-Pipeline läuft auf jedem PR

### Security
- [ ] 🟥 Externer Pen-Test durchgeführt + Findings behoben
- [ ] 🟥 RLS-Policies End-to-End mit min. 3 Test-Mandanten validiert
- [ ] Session-Timeout konfiguriert (empfohlen: 60 min idle)
- [ ] Password-Policy aktiv (min. 12 Zeichen)
- [ ] 2FA-Opt-In verfügbar
- [ ] Rate-Limiting auf Auth-Endpoints
- [ ] Secrets-Rotation-Plan dokumentiert

### Compliance & Recht
- [ ] 🟥 Datenschutzerklärung auf der Website
- [ ] 🟥 AVV-Muster für Kanzlei-Kunden verfügbar
- [ ] 🟥 Impressum + Haftungsausschluss
- [ ] AGB für Kanzlei-Nutzung
- [ ] GoBD-Verfahrensdokumentation finalisiert
- [ ] Cookie-Banner (falls Tracking)

### Monitoring
- [ ] 🟥 Sentry / Error-Tracking aktiv (alle Pages)
- [ ] 🟥 Uptime-Monitoring (Pingdom / UptimeRobot)
- [ ] Health-Check-Endpoint aktiv
- [ ] Log-Aggregation konfiguriert
- [ ] Dashboard mit Kern-KPIs (Response-Time, Error-Rate, DAU)

### Dokumentation & Support
- [ ] 🟥 Benutzerhandbuch publiziert (`/hilfe` o.ä.)
- [ ] 🟥 Support-Kanal definiert (E-Mail + ggf. Ticket-System)
- [ ] Internes Runbook für Ops-Team
- [ ] FAQ zu Top-10-Fragen vorbereitet
- [ ] Changelog-Template eingeführt

### Testing
- [ ] 🟥 E2E-Tests für 10 kritische Journeys grün (Playwright)
- [ ] Cross-Browser manuell geprüft (Chrome, Firefox, Safari, Edge)
- [ ] Mobile-Layout auf echten Geräten getestet
- [ ] WCAG-Audit durchgeführt (kritische Findings behoben)
- [ ] Load-Test: min. 100 concurrent users halten

### Team-Readiness
- [ ] 🟥 Support-Team geschult (min. 2 Personen)
- [ ] On-Call-Rotation für erste 2 Wochen geplant
- [ ] Escalation-Pfad dokumentiert (P1 / P2 / P3)
- [ ] Abuse-Handling-Prozess definiert

---

## T-1 Woche (Launch-Vorbereitung)

- [ ] 🟥 Finaler Staging-Smoke-Test durchgelaufen
- [ ] 🟥 Rollback getestet: Prod-Build → letzter stabiler Stand in unter 10 min
- [ ] Pre-Announcement an bestehende Interessenten
- [ ] Social-Media-Posts vorbereitet
- [ ] Press-Release (falls relevant)
- [ ] Feature-Flags überprüft (initial: alles aktiv oder Canary?)
- [ ] DB-Migration-Plan final (forward-only, ohne BREAKING)

---

## Launch-Woche

### Tag 0 (Launch-Tag)
- [ ] 🟥 Deployment auf Produktion durchgeführt
- [ ] 🟥 Erste 2 h aktives Monitoring
- [ ] Kommunikation an Kunden / Interessenten versendet
- [ ] Support-Kanäle 2× besetzt für erste 8 h

### Tag 1-7
- [ ] 🟥 Daily Health-Check (Error-Rate, DAU, DB-Load)
- [ ] Staged Rollout: 5 % → 25 % → 100 % (falls Feature-Flags nutzbar)
- [ ] Rollback-Readiness: jederzeit ausführbar
- [ ] Bug-Triage-Meeting täglich
- [ ] Kunden-Feedback-Kanal aktiv geprüft

---

## Post-Launch (erster Monat)

### Woche 1-2
- [ ] 🟥 Daily Health-Check fortsetzen
- [ ] Incident-Reviews bei jedem P1-Bug
- [ ] Wöchentliches Feedback-Review mit Support
- [ ] Performance-Baseline fixiert
- [ ] Hotfix-Release-Cadence stabilisiert

### Woche 3-4
- [ ] Erstes Retrospektive-Meeting
- [ ] Kundensatisfaction erhoben (NPS / simple Umfrage)
- [ ] Performance-Metriken reviewt gegen Baseline
- [ ] Compliance-Audit-Stichprobe durchgeführt (Z3-Export auf
      Produktionsdaten testen)
- [ ] Backup-Restore-Testlauf (Staging mit Prod-Backup)
- [ ] Sprint-Planung mit gesammeltem Feedback

---

## Hard-Stops (Abbruch-Kriterien)

Wenn **einer** dieser Punkte eintritt, stoppen wir den Rollout und
rollen zurück:

1. Error-Rate > 5 % für > 10 min
2. Auth / Login funktioniert für > 1 % der Nutzer nicht
3. Daten-Integrity-Check schlägt an (Festschreibungs-Hashes brechen)
4. DSGVO-relevanter Sicherheitsvorfall (Datenleck)
5. DB-Latenz > 2 s P95 für > 30 min
6. Supabase-Ausfall (externer Provider-Incident)

Kontakt in diesen Fällen: Ops-Lead + Security-Lead sofort anrufen.

---

## Post-Mortem Template (für Incidents)

```
Datum: YYYY-MM-DD
Betroffen: <Modul / Seite / alle>
Dauer: HH:MM bis HH:MM (N Minuten)
Schweregrad: P1 / P2 / P3
Betroffene Nutzer: <Zahl oder Anteil>

Timeline:
- HH:MM — erste Meldung
- HH:MM — Bestätigung + Alarm
- HH:MM — Ursache identifiziert
- HH:MM — Fix deployed
- HH:MM — grün

Root-Cause: <1-3 Sätze>
Sofort-Fix: <was wurde deployed>
Langfrist-Fix: <was folgt noch>
Prävention: <wie verhindern wir Wiederholung>
```
