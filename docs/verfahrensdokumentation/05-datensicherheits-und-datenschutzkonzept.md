# Kapitel 5 — Datensicherheits- und Datenschutzkonzept

> Status: STUB | Version: 0.1 | Letztes Update: 2026-04-20

## Zweck

Dokumentiert die technischen und organisatorischen Maßnahmen (TOM) nach
DSGVO Art. 32 sowie das Berechtigungs- und Datenschutzkonzept nach
GoBD Rz. 103-105 (Zuverlässigkeit, Zugriffsschutz). Adressaten sind
Datenschutzbeauftragte, Auditor:innen und Aufsichtsbehörden.

**Abhängigkeit:** Die Abschnitte 5.4 (Pseudonymisierung) und 5.5
(Betroffenenrechte) können erst finalisiert werden, nachdem die
Hash-Chain-vs.-Erasure-Entscheidung (siehe
[`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md)) durch
Fachanwalt + DSB bestätigt ist.

## Gliederung

### 5.1 Berechtigungskonzept

<!-- TODO(verfahrensdoku): Rollen (Steuerberater / Kanzlei-Mitarbeiter / Mandant / Betriebsprüfer / Admin) × Berechtigungen. Umsetzung über Supabase Row-Level-Security (RLS). Verweis auf Migrations mit RLS-Policies. -->

### 5.2 Zugriffsschutz

<!-- TODO(verfahrensdoku): Authentifizierung (Supabase Auth, E-Mail+Password), Session-Timeout (Auto-Logout via UserContext), Passwort-Anforderungen, 2FA-Status (derzeit nicht erzwungen — zu prüfen). -->

### 5.3 Technische und organisatorische Maßnahmen (TOM)

<!-- TODO(verfahrensdoku): Volle Art.-32-Aufstellung: Verschlüsselung in Transit (HTTPS/TLS), Verschlüsselung at Rest (Supabase Standard), Pseudonymisierung (TBD nach Hash-Chain-Entscheidung), Resilienz (siehe Kapitel 4), Wiederherstellbarkeit, regelmäßige Überprüfung. -->

### 5.4 Pseudonymisierung und Anonymisierung

<!-- TODO(verfahrensdoku): HÄNGT AB vom Hash-Chain-Entscheid. Nach Rechts-Freigabe: gewähltes Verfahren (Option A/B/C/D oder Kombination) beschreiben, Schlüssel-Management falls Crypto-Shredding, Verfahrensweise bei Löschanfragen. -->

### 5.5 Betroffenenrechte (DSGVO Art. 15-22)

<!-- TODO(verfahrensdoku): Prozess pro Recht: Auskunft (Art. 15, siehe /admin/datenexport), Berichtigung (Art. 16), Löschung (Art. 17 — TBD), Einschränkung (Art. 18), Übertragbarkeit (Art. 20, siehe /admin/datenexport), Widerspruch (Art. 21). 30-Tage-Frist nach Art. 12 Abs. 3. Dokumentation in Tabelle privacy_requests (Migration 0023). -->

### 5.6 Cookie-Einwilligung (TTDSG § 25)

<!-- TODO(verfahrensdoku): Technische Umsetzung via CookieConsentContext + CookieConsent-Banner. Nur technisch notwendige Cookies ohne Einwilligung; Analytics (GA4/Plausible) nur bei expliziter Zustimmung. Nachweispflicht 3 Jahre (retention.ts). -->

### 5.7 Auftragsverarbeitung (Art. 28 DSGVO)

<!-- TODO(verfahrensdoku): Liste eingesetzter Auftragsverarbeiter: Supabase (Hosting + DB + Auth), Sentry (optional, Error-Tracking), Hosting-Provider (noch offen), ggf. OCR / E-Mail. AVV-Status pro Anbieter. Eigener AVV-Muster für Kanzlei↔Mandant steht aus (P2-Blocker, siehe CLAUDE.md §10). -->

### 5.8 Datenpannen-Meldeprozess (Art. 33/34)

<!-- TODO(verfahrensdoku): 72-h-Countdown ab Kenntnisnahme. Meldeweg an Aufsichtsbehörde, Kriterien für Betroffenen-Benachrichtigung, Incident-Register (Migration 0023: privacy_incidents). Rollen: Erstmelder, DSB, Kanzlei-Leitung. -->

### 5.9 Datenschutz-Folgenabschätzung (DSFA, Art. 35)

<!-- TODO(verfahrensdoku): Prüfen, ob eine DSFA erforderlich ist (Lohndaten, Zahlungsdaten, ggf. Gesundheitsdaten in Lohn). Ergebnis dokumentieren. -->

## Verweise auf bestehende Artefakte

- [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md) (Design-
  Entscheidung, Q1-Q8 in Rechts-Review)
- [`../../supabase/migrations/0023_dsgvo_compliance.sql`](../../supabase/migrations/0023_dsgvo_compliance.sql)
  (cookie_consents, privacy_requests, privacy_incidents)
- [`../../src/contexts/CookieConsentContext.tsx`](../../src/contexts/CookieConsentContext.tsx)
- [`../../src/data/retention.ts`](../../src/data/retention.ts)
  (Aufbewahrungsfristen inkl. Cookie-Consent 3 Jahre TTDSG)
- [`../../src/pages/DatenExportPage.tsx`](../../src/pages/DatenExportPage.tsx)
  (Art. 20 Portabilität)
- [`../../CLAUDE.md`](../../CLAUDE.md) §12 (Limitations) Nummern 13-17

## Quellen & Referenzen

<!-- TODO(verfahrensdoku): DSGVO Art. 5, 12-22, 32, 33, 34, 35; BDSG-neu § 38; TTDSG § 25; GoBD Rz. 103-105; DSK-Kurzpapier Nr. 11; BfDI-Orientierungshilfen (zu konkretisieren). -->
