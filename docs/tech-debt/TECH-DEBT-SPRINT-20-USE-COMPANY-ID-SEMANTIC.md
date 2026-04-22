# TECH-DEBT: useCompanyId() Semantik (null-silent)

- **Priorität:** LOW
- **Ursprung:** Sprint 20.A.1
- **Status:** offen

## Problem

`useCompanyId()` gibt `null` zurück statt zu werfen, wenn kein
`CompanyProvider` im Tree ist. Das wurde in Sprint 20.A.1 bewusst
eingeführt, damit isolierte Komponenten-Unit-Tests ohne
`CompanyProvider`-Wrapper laufen.

Nützlich für Unit-Tests, **gefährlich in Production**: wenn eine
Komponente versehentlich außerhalb des Providers gemountet wird
(Refactor, neue Route unter vergessener Provider-Ebene, etc.),
operiert sie stillschweigend mit `null` und fällt auf
`DEMO_COMPANY_ID` zurück. Im Supabase-Mode würde das INSERTs in
eine „Demo-Kanzlei" schreiben, die es in Production nicht gibt —
RLS schlägt an, aber der Fehler kommt erst im Netzwerk, nicht beim
Mount.

## Aktuell betroffene Call-Sites

- `src/pages/partners/PartnerListPage.tsx:84` — Fallback auf `DEMO_COMPANY_ID`
- `src/pages/ERechnungPage.tsx` (DebitorBlock) — Fallback auf `DEMO_COMPANY_ID`
- `src/pages/JournalPage.tsx:107` — nutzt den Nullwert als „keine
  aktive Firma, Seite leer anzeigen" (semantisch ok)

Der Fallback ist **korrekt im DEMO-Mode** (DEMO_MODE=true), aber
**gefährlich in Production** — die Komponente denkt, sie sei im
DEMO-Tree, und schreibt unter DEMO_COMPANY_ID.

## Lösung (Sprint 21+)

1. **Neue Variante `useRequireCompanyId()`** in `CompanyContext.tsx`,
   die bei fehlendem Provider **oder** bei `activeCompanyId === null`
   in Non-DEMO-Mode wirft. Das deckt beide Fehlermodi ab: kein
   Provider UND Provider vorhanden aber ohne aktive Firma.
2. **Migration der kritischen Call-Sites** auf `useRequireCompanyId()` —
   alles, was schreibt (PartnerEditor-Opener, ERechnungPage-DebitorBlock,
   evtl. künftige Partner-Writes). Read-only-Seiten wie JournalPage
   dürfen weiter `useCompanyId()` nutzen.
3. **`useCompanyId()` beibehalten** für defensive Read-Pfade und
   Unit-Tests. Jetzt aber dokumentiert: „Write-Pfade müssen
   `useRequireCompanyId()` verwenden."
4. **Optionale Lint-Regel:** Import von `useCompanyId` nur erlaubt,
   wenn Fallback oder Nullchecks im selben File sichtbar sind.
   (`eslint-plugin-import` custom-rule, Aufwand ≈ halber Tag.)

## Akzeptanz

- [ ] `useRequireCompanyId()` exportiert aus `CompanyContext.tsx`.
- [ ] `PartnerListPage` + `DebitorBlock` (ERechnungPage) migriert.
- [ ] Tests für beide Hooks (Throw-Verhalten / Tolerant-Verhalten).
- [ ] Lint-Regel erwogen (optional).

## Nicht im Scope dieses Tickets

- Kein Refactor von `CompanyProvider` selbst.
- Kein Ändern des DEMO-Fallback-Verhaltens — `DEMO_COMPANY_ID` bleibt
  die kanonische Konstante.
