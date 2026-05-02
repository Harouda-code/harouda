# `supabase/rollbacks/` — Notfall-Rollback-Skripte

> **Status:** Reserviert. **Wird nicht automatisch ausgefuehrt.**

## Zweck

Dieses Verzeichnis enthaelt SQL-Skripte, die einzelne Forward-Migrations aus
`supabase/migrations/` rueckgaengig machen. Sie sind ausschliesslich fuer den
**manuellen Notfall-Einsatz** vorgesehen — etwa wenn eine produktiv aktive
Migration eine kritische Regression verursacht und ein schneller Rueckbau
erforderlich ist.

## Warum getrennt von `supabase/migrations/`?

Der Befehl `supabase db push` ist **forward-rolling**. Er liest **alle**
`.sql`-Dateien in `supabase/migrations/` in alphabetisch-numerischer Reihenfolge
und wendet sie an. Ein Ausnahme-Pattern gibt es nicht.

Wuerden die `revert`-Skripte im selben Verzeichnis liegen, hoebe jeder Revert
unmittelbar nach Anwendung den vorhergehenden Patch wieder auf. Die Folge waere
ein Database-Stand, in dem **keine** der Sicherheits-Patches aktiv ist —
verbunden mit dokumentierten Migration-Eintraegen, die fuer Pruefer
(Wirtschaftspruefer, Datenschutzbehoerden, StB) den Eindruck erwecken, die
Patches seien aktiv.

Die strikte Verzeichnis-Trennung verhindert dieses Anti-Pattern strukturell.

## Nutzungsregeln

1. Skripte hier **niemals automatisch** ueber `supabase db push`,
   `deploy-staging.yml` oder `deploy-production.yml` einbinden.
2. Anwendung ausschliesslich manuell ueber den Supabase Studio SQL Editor.
3. Vor jeder Anwendung: schriftliche Freigabe durch
   - den Datenschutz-Verantwortlichen (bei DSGVO-relevanten Tabellen) **und**
   - den verantwortlichen Steuerberater (bei GoBD-relevanten Tabellen wie
     `belege`, `beleg_positionen`, `buchungen`, `dokumente`).
4. Anwendung dokumentieren in `docs/rollback-protokoll-YYYY-MM-DD.md` mit:
   - Datum, Uhrzeit, ausfuehrender Person,
   - betroffene Migration-Nummer,
   - Begruendung (Bug-Ticket, Vorfall-Nummer),
   - Zustand vorher / nachher (Stichproben oder Schemas-Diff).

## Konvention

- Dateiname spiegelt das zu rollback-ende Forward-Skript:
  `0043_revert_cookie_consent_rls.sql` → revertet `0042_fix_cookie_consent_rls.sql`.
- Numerierung folgt dem Forward-Skript + 1, **damit der Bezug eindeutig bleibt**.
- Numerierungs-Luecke in `migrations/` (`0042` direkt zu `0044`) ist
  beabsichtigt und gewollt — sie macht die Rollback-Beziehung sichtbar.

## Pruef-Hinweis fuer Reviewer

Pull Requests, die `revert*.sql` in `supabase/migrations/` einfuegen,
sind grundsaetzlich abzulehnen. Rollback-Skripte gehoeren in dieses Verzeichnis.

## Aktueller Inhalt

| Datei | Revertet | DSGVO/GoBD-Relevanz |
|-------|----------|---------------------|
| `0043_revert_cookie_consent_rls.sql` | `0042_fix_cookie_consent_rls.sql` | DSGVO Art. 5, 32 |
| `0045_revert_user_settings.sql` | `0044_user_settings.sql` | DSGVO Art. 32 |
| `0047_revert_documents_storage_schema.sql` | `0046_documents_storage_schema.sql` | GoBD Rz. 100 ff., HGB § 257 |
| `0049_revert_rls_belege_leak.sql` | `0048_fix_rls_belege_leak.sql` | DSGVO Art. 5, 32; GoBD Rz. 100 ff. |

## Rechtlicher Hinweis

Ein Rollback einer Migration, die personenbezogene Daten oder steuerlich
relevante Buchhaltungs-Daten betrifft, kann eine meldepflichtige
Datenschutz-Verletzung (DSGVO Art. 33) oder einen Verstoss gegen die
Aufbewahrungspflicht (HGB § 257, AO § 147) darstellen. Vor Anwendung
**zwingend** Ruecksprache mit Fachanwalt und Steuerberater.
