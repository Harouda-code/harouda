# Sprint-Abschlussbericht: Mobile-Foundation

**Datum**: 2026-05-17
**Status**: Abgeschlossen
**Backend-Migrations-Range**: 0072 bis 0078
**Backend-Commit**: c474134
**Mobile-Repo letzter Commit**: e24f4a1

## 1. Zielsetzung & Umfang

Aufbau der minimalen Backend-Infrastruktur und der eigenstaendigen Mobile-App-Codebasis fuer eine Companion-App, ueber die Mandanten der Kanzlei Belege (Scans, PDFs) per Smartphone einreichen koennen. Der Hauptprojekt-Schema wird ausschliesslich additiv erweitert; keine bestehende Tabelle, Policy oder Helper-Funktion wird in ihrer Funktion veraendert. Strategische Grundlagen folgen den Architekturentscheidungen E1, E2, E3, E4-a, E7, E8 (siehe F-Register).

## 2. Technische Umsetzung — Backend (Hauptprojekt)

Sieben Migrations und 176 zugehoerige Strukturtests im Hauptprojekt `D:\harouda-app`. Alle Migrations sind transaktional, idempotent dokumentiert und mit explizitem manuellem Rollback-Block versehen.

| Migration | Inhalt |
|---|---|
| 0072 | `client_app_users` — Mandant-Identifikations-Tabelle mit Rollen (`hauptkontakt`, `mitbenutzer`), Soft-Delete via `revoked_at`, eindeutiger Partial-Index pro aktiver (user, client)-Verknuepfung. RLS mit FORCE aktiviert, keine Policies bis 0076. |
| 0073 | `mobile_registered_devices` — Kryptographische Geraete-Bindung pro (user, client). Speichert oeffentlichen Schluessel (privater Gegenpart verbleibt im Hardware-Schluesselspeicher), Plattform-Kennzeichen, Widerrufsgrund inklusive `reuse_detected` gemaess RFC 9700 §4.14. |
| 0074 | `clients.app_permissions` — JSONB-Spalte auf bestehender `clients`-Tabelle. Restriktiver Default (`mobile_app_enabled = false`). Feature-Flags fuer Belegerfassung, Beleg-Status-Sicht, OPOS-Sicht, E-Rechnungs-Sicht. Schema-Validierung als mehrere CHECK-Constraints. |
| 0075 | `belege`-Erweiterungen — Spalten `uploaded_via_app` (BOOLEAN) und `hash_sha256` (TEXT, 64 hex lowercase). App-Uploads erfordern zwingend einen Hash (CHECK-Constraint). Bestehende RLS bleibt unveraendert. |
| 0076 | RLS-Policies fuer Mobile-Tabellen und Helper-Funktion `is_client_app_user(cid)` nach SECURITY-DEFINER-Pattern aus Migration 0057. Erweitert `belege_select` und `belege_insert` um den Mobile-Upload-Pfad ueber `mandant_id` (siehe technische Notiz im Migrations-Header zur historischen `mandant_id` vs. `client_id`-Inkonsistenz). DELETE-Policies bewusst weggelassen — Loeschung verweigert, Soft-Delete via `revoked_at`. |
| 0077 | Storage-Bucket `mobile-uploads` (privat, 25 MiB-Limit, Bild- und PDF-MIME-Types). Pfad-Konvention `{company_id}/{client_id}/{beleg_id}/{dateiname}`. RLS-Policies auf `storage.objects` lesen `company_id` und `client_id` via `split_part(name, '/', N)::uuid` aus dem Storage-Pfad. Keine UPDATE- oder DELETE-Policies (Unveraenderbarkeit gemaess GoBD Rz. 58 ff.). |
| 0078 | `custom_access_token_hook(event jsonb)` — JWT-Claim-Anreicherung um `app_metadata.harouda_mobile` (`schema_version`, `mobile_app_enabled`, `active_client_ids`, `has_registered_device`). EXECUTE-Recht ausschliesslich fuer `supabase_auth_admin`. Hook-Aktivierung im Supabase-Dashboard erfolgt operativ, nicht via Migration. |

## 3. Technische Umsetzung — Mobile-Repo

Neues eigenstaendiges Repository `D:\harouda-mobile-app` (kein Submodul, kein Monorepo-Bestandteil). Nutzt dasselbe Supabase-Projekt wie das Hauptprojekt. Fuenf Commits in chronologischer Reihenfolge:

| Commit | Inhalt |
|---|---|
| 0cc21ff | Scaffold-Initialisierung: Vite + React 19 + TypeScript, ESLint v10 (Flat Config, ohne `eslint-plugin-react` aufgrund inkompatibler peer-Range), Prettier 3, Husky 9, lint-staged 15, Vitest 2 mit Testing Library und jsdom, Baseline-Renderingtest (2 Faelle). |
| 6b5ccd6 | `@supabase/supabase-js` als Runtime-Abhaengigkeit. Modul `src/lib/supabase.ts` mit `readSupabaseConfig` (dependency-injected fuer Test), `createSupabaseClient` (pure factory) und `getSupabaseClient` (lazy-cached Singleton fuer Anwendungs-Code). Acht Unit-Tests. |
| 78d7bbe | Capacitor v7 Core + CLI. `cap init` mit `appId: de.harouda.mobile`, `appName: Harouda`, `webDir: dist`. Generierte `capacitor.config.ts` im Repo-Root. |
| 0cad856 | `@capacitor/android@^7`, `cap add android`. ESLint-Ignores fuer `android/**` und `ios/**` (Vermeidung des Web-Asset-Lint-Problems durch von Capacitor kopierte minified Bundles). |
| e24f4a1 | `@capacitor/ios@^7`, `cap add ios`. Capacitor 7-Default-Package-Manager fuer iOS bleibt CocoaPods (Capacitor 8 wechselt auf SPM). |

## 4. GoBD-Bezug & Rechtsgrundlagen

Die Migrations referenzieren in ihren Headern die folgenden Rechtsgrundlagen:

- BMF-Schreiben IV D 2 - S 0316/00128/005/088 vom 14.07.2025 (Zweite GoBD-Aenderung), Rz. 58 ff., 119, 125, 131
- § 30 AO (Steuergeheimnis)
- §§ 146, 147 AO (Ordnungs- und Aufbewahrungsvorschriften)
- §§ 3, 5 StBerG (Vorbehaltsaufgaben, daher keine Beratungsfunktion in Mobile-App)
- DSGVO Art. 5, 9, 25, 32 (Datenminimierung, besondere Kategorien, Privacy by Design, Sicherheit)
- BStBK Muster-Verfahrensdokumentation zum ersetzenden Scannen v2.0
- BSI IT-Grundschutz APP.3.1, APP.4.3, CON.8
- BSI TR-02102-1
- IETF RFC 9700 (OAuth 2.0 Security Best Current Practice)

Datei-Integritaet ist durch `belege.hash_sha256` mit transitiver FK-Garantie ueber `client_app_users.client_id` sichergestellt. Audit-Spur erfolgt durch das bestehende `audit_log`-CDC-Pattern (eingefuehrt in Migrations 0002/0003), nicht durch neue Audit-Strukturen.

## 5. Verknuepfung mit Architektur-Locks (F-Register)

- **E1** (Shared Backend / SSOT) — Mobile-Repo nutzt dasselbe Supabase-Projekt
- **E2** (Mini-Version Phase 2 / Voll-Version Phase 3) — Backend deckt Phase 2 vollstaendig ab
- **E3** (Beschraenkung der Finanzansicht) — `app_permissions`-Flags decken die zulaessigen Sichten ab
- **E4-a** (Separation of Concerns beim Beleg-Scan) — Geraet liefert nur Roh-Datei + Hash, Server uebernimmt OCR und Buchung
- **E7** (Multi-Channel-Bootstrapping mit Geraete-Bindung) — `mobile_registered_devices` mit Hardware-Schluessel
- **E8** (OAuth + PKCE + Refresh Token Rotation) — vorbereitet durch `custom_access_token_hook`; `reuse_detected`-Widerrufsgrund explizit modelliert

## 6. Bewusst nicht umgesetzt (Out-of-Scope)

- `npx cap sync` fuer beide Plattformen (erfordert Android Studio bzw. macOS-Toolchain)
- `pod install` fuer iOS (CocoaPods nicht auf Windows verfuegbar)
- Erste UI-Komponente (`DeviceRegistration` o. ae.) — geplant fuer M10
- Aktivierung von `custom_access_token_hook` im Supabase-Dashboard (operativ, nicht via Migration)
- Push-Konfiguration des Mobile-Repos auf Remote
- Aufloesung der historischen `belege.mandant_id`-Inkonsistenz (TECH-DEBT seit Sprint 19; siehe Header von 0076)
- Vitest-Major-Bump (6 moderate dev-toolchain audit warnings; eigener Sprint MOBILE-VITEST-AUDIT-WARNINGS vorgemerkt)
- Capacitor-Plugins fuer Kamera, Dateisystem, Push Notifications oder Deep Links — nicht Bestandteil der Foundation, sondern spaetere Funktionssprints.

## 7. Verifikation (lokal, Stand Sprint-Abschluss)

**Hauptprojekt (`D:\harouda-app`)**:
- Lint: clean
- TypeScript: clean
- Tests: 2753 passed + 1 todo (218 s)
- Build: erfolgreich
- 7 Migrations zusaetzlich zur Vor-Sprint-Basis (vorher 0071 → jetzt 0078)

**Mobile-Repo (`D:\harouda-mobile-app`)**:
- Lint: clean (`android/**` und `ios/**` ignoriert)
- TypeScript: clean
- Tests: 10 passed (10) — 2 App-Render-Baseline + 8 Supabase-Konfiguration
- Build: erfolgreich (193 kB, gzip 60 kB)
- Dev-Server-Start: erfolgreich

## 8. Definition of Done

- [x] Sieben Migrations 0072 bis 0078 mit vollstaendigen Headern und Rollback-Bloecken
- [x] 176 Strukturtests im Hauptprojekt, alle gruen
- [x] Mobile-Repo eigenstaendig, mit reproduzierbarem Setup (lint + tsc + build + test + dev)
- [x] Capacitor Android- und iOS-Scaffolds vorhanden
- [x] ESLint-Konfiguration deckt Native-Platform-Ordner ab
- [x] Backend-Commit (`c474134`) und Mobile-Repo-Letzter-Commit (`e24f4a1`) verifizierbar
- [x] State-File `.harouda-state.md` aktualisiert
- [x] Dieser Abschlussbericht
