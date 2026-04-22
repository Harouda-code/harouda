# TECH-DEBT — Hardcoded companyId="c-demo" in PartnerEditor-Aufrufen

**Sprint eröffnet:** 19 (retrospektiv, Gate-19.C-Review durch
Project-Owner)
**Priorität:** HIGH — Production-Blocker bei Supabase-Mode
**Status:** In Arbeit (Fix in Sprint 20.A.1)
**Entdeckt durch:** Project-Owner-Review + Discovery-Report
Sprint 20

## Kontext

Gate-19.C-Review und Discovery-Report Sprint 20 zeigten:
`companyId="c-demo"` ist in 2 Production-Code-Dateien hart codiert:

- `src/pages/partners/PartnerListPage.tsx` (Zeile ~300) — wird an
  den `<PartnerEditor>`-Dialog als Literal durchgereicht, wenn der
  Admin auf „Neuer Debitor" / „Neuer Kreditor" klickt.
- `src/pages/ERechnungPage.tsx` (Zeile ~953) — wird im
  `DebitorBlock` an `<PartnerEditor>` durchgereicht, wenn der
  Nutzer auf „Als Debitor speichern" klickt.

Der echte DEMO-Company-ID ist
`"demo-00000000-0000-0000-0000-000000000001"`
(`CompanyContext.tsx:43`). Die Literale `"c-demo"` sind somit
**nicht nur Supabase-Mode-Bugs**, sondern bereits in DEMO-Mode
eine stille Inkonsistenz mit dem übrigen System: alle per Dialog
angelegten Partner landen unter einer anderen Company als der
Rest der DEMO-Daten.

## Impact

### DEMO-Mode
- Partner-Datenbank fragmentiert: manche Partners unter
  `"demo-00000000-0000-0000-0000-000000000001"`, manche unter
  `"c-demo"`. Die List-Queries filtern heute über `client_id`
  (Mandant), daher fällt der Bug im Alltag nicht auf — die
  fehlerhafte `company_id` wandert aber in jede Version,
  jede Audit-Row und jede spätere Migration.

### Supabase-Mode
- Der INSERT in `business_partners` würde auf die RESTRICTIVE-Policy
  `bp_client_belongs` knallen, weil `c-demo` nicht in `companies`
  existiert. Partner anlegen über die Dialoge wäre broken.
- Das ist ein **echter Production-Blocker** — keine Hypothese.

## Lösung (Sprint 20.A.1)

1. **Pre-Grep:** CompanyProvider-Mount-Punkt verifizieren
   (`src/main.tsx` oder `src/App.tsx`). Kein Providerschema-Umbau
   im Scope.
2. **`useCompanyId()` aus `CompanyContext`** (Export existiert seit
   Sprint 7.x, ist aber bisher ungenutzt in diesen Code-Pfaden).
3. **Beide Call-Sites auf `useCompanyId()` umschreiben.**
4. **`DEMO_COMPANY_ID`-Fallback-Konstante** zentralisieren: Re-Export
   der `CompanyContext`-internen Konstante über `src/api/db.ts`,
   damit Service-Layer und UI einheitlich sind.
5. **Regression-Test** gegen „kein `c-demo`-Literal mehr im
   gerenderten Tree" hinzufügen.

## Akzeptanz

- [ ] Kein `"c-demo"`-Literal mehr in `src/pages/` oder `src/components/`
      (Test-Setup-Fixtures ausgenommen — dort ist Literal akzeptabel).
- [ ] `useCompanyId()` konsumiert in beiden Dialog-Aufrufen.
- [ ] Alle bestehenden Tests bleiben grün.
- [ ] Pre-Fix-Grep bestätigt `CompanyProvider`-Mount.
- [ ] Regression-Test gegen Wiederauftauchen des Literals im UI-Baum.

## Nicht im Scope dieses Tickets

- Konsolidierung der 4 parallelen SHA-256-Implementierungen
  (separates Tech-Debt `SHA256-HELPER-CONSOLIDATION`, LOW).
- Audit-Chain-Legacy-Format-Toleranz aufräumen (ebenfalls LOW).
- Kein Refactor der RESTRICTIVE-Policy-Struktur.
