# TECH-DEBT — BZSt vs. VIES Hierarchy-Klärung

**Sprint eröffnet:** 19 (2026-04-22)
**Priorität:** HIGH — **rechtskritisch**
**Status:** **GESCHLOSSEN** (Sprint 20.A.2 + 20.B + 20.C.4)
**Geschlossen am:** 2026-04-22
**Trigger zum Abbau:** Vor Produktiv-Einsatz für B2B-Kunden mit
EU-weiten Geschäften. Sprint 20+.

## Kontext

Das Projekt hat aktuell **zwei** Edge Functions zur USt-IdNr-Prüfung:

| Function | Backend | Scope | Zertifikats-Zweck |
|---|---|---|---|
| `supabase/functions/validate-ustid/index.ts` | BZSt evatr (DE) | nur deutsche USt-IdNr-Bestätigung | `§ 18e UStG` einfach/qualifiziert (inländisch) |
| `supabase/functions/verify-ust-idnr/index.ts` | EU-VIES SOAP | EU-27 + NI/XI | `§ 18e UStG` + EU-Kommissions-MOSS-Anforderung |

Sprint 19.C nutzt im UI **ausschließlich** `verify-ust-idnr` (VIES).

## Problem

1. **Rechtsgrundlage auseinanderhalten:**
   - § 18e UStG verlangt eine **qualifizierte Bestätigung** mit
     Name + Anschrift + Rechtsform der ausländischen Firma. VIES
     liefert `traderName` + `traderAddress`, aber **BZSt ist die
     einzige deutsche Behörde, die eine qualifizierte Bestätigung
     fuer inländische Empfänger ausstellt**.
   - Fuer einen **deutschen Kunden** (Debitor mit DE-USt-IdNr):
     BZSt-Prüfung ist ausreichend + qualifiziert.
   - Fuer einen **EU-ausländischen Kunden**: VIES-Prüfung, ergänzt
     um manuelle Name/Adresse-Plausibilisierung, weil VIES keine
     qualifizierte Bestätigung nach deutschem UStG-Verständnis
     ausgibt. Fuer § 4 Nr. 1 Buchst. b UStG (innergemeinschaftliche
     Lieferung) reicht VIES; fuer § 18e-Nachweispflicht darueberhinaus
     ist die Rechtslage umstritten.

2. **Doppelte Pflege der Logs:**
   - `ustid_verifications` (Migration 0037) logt VIES-Raw-Response.
   - `validate-ustid` hat **kein** persistentes Log-Target —
     Response wird im Browser gerendert, aber nicht in einer
     Tabelle fuer § 147 AO Abs. 2 Nr. 1 bytea-Archivierung abgelegt.

3. **UI fragt den Nutzer nicht nach seiner Absicht.** Der
   „USt-IdNr prüfen"-Button ruft undifferenziert VIES. Ein deutscher
   Debitor sollte automatisch an BZSt gehen (qualifiziert + günstiger
   + keine CORS-Probleme).

## Empfohlene Aktion (Sprint 20+)

1. **Hierarchy-Service:** Neuer Wrapper `verifyUstIdnrRouted(partner)`
   entscheidet:
   ```
   if (partner.ust_idnr.startsWith("DE")) → validate-ustid (BZSt)
   else                                   → verify-ust-idnr (VIES)
   ```
2. **Persistenz angleichen:** `validate-ustid`-Response ebenfalls in
   `ustid_verifications` schreiben (bytea + parsed JSON).
   `raw_http_request_url` unterscheidet die beiden Endpoints.
3. **Qualifizierte Bestätigung explizit machen:** UI-Button trennt
   „Einfache Bestätigung" vs. „Qualifizierte Bestätigung mit
   Name+Adresse". Nur BZSt erlaubt qualifizierte Abfragen; VIES
   liefert immer Name+Adresse als Nebenprodukt.
4. **Steuerberater-Sign-off** vor Produktion:
   - [ ] Welche Rechtsgrundlage gilt fuer welchen Debitor-Typ?
   - [ ] Ist die automatische Routing-Logik akzeptabel, oder muss der
         Nutzer explizit wählen?
   - [ ] Fuer § 4 Nr. 1 Buchst. b UStG-Nachweise: reicht VIES oder
         braucht es zusätzlich Korrespondenz?

## Blocker fuer Produktion?

**Ja, HIGH.** Vor Echtkunden-Einsatz mit innergemeinschaftlichen
Lieferungen muss geklärt sein, welche Abfrage-Variante einer
Finanzamtsbetriebsprüfung standhält. Falsche Abfrage = potenziell
keine § 4 Nr. 1 Buchst. b-Befreiung → nachträgliche USt + Nebenkosten.

## Aufwand

~2–3 Tage Implementierung + 1 Termin mit Steuerberater.

## Closure (Sprint 20)

Das Ticket ist geschlossen. Alle drei ursprünglich benannten Probleme
(Routing-Logik, doppelte Log-Persistenz, fehlende UI-Entscheidung)
sind technisch gelöst:

- **20.A.2 — Edge-Function-Refactor `validate-ustid`:** Die BZSt-
  Function akzeptiert jetzt `clientId` + `companyId` + `partnerId` und
  persistiert jede Antwort per `service_role` in
  `ustid_verifications` mit `verification_source='BZST'`. Die
  Asymmetrie zwischen BZSt (kein Log) und VIES (mit Log) ist damit
  aufgehoben — beide Quellen landen in derselben WORM-Tabelle.

- **20.A.2 — `src/api/ustIdRouter.ts`:** Neues Routing-Service mit
  deterministischer Entscheidungstabelle: DE-Requester → BZSt
  (qualifizierte Bestätigung § 18e UStG, auch für intra-EU-Anfragen);
  non-DE- oder fehlender Requester → VIES. Bei
  `BZSt-SERVICE_UNAVAILABLE` automatischer VIES-Fallback, beide
  Aufrufe landen im Log (kein stilles Ersetzen).

- **20.A.2 — UI:** `UstIdnrStatusBadge` hat eine `source`-Prop, die
  🛡️-BZSt- bzw. 🌐-VIES-Herkunft visuell unterscheidet. Badges
  werden in `PartnerListPage`, `PartnerEditor` und
  `ERechnungPage/DebitorBlock` konsistent durchgereicht.

- **20.B — Hash-Chain auf `ustid_verifications`:** Jede persistierte
  Antwort ist tamper-evident. Spezifisch wird eine Mutation von
  `verification_source` (z. B. BZST→VIES nach Insertion) als
  `hash_mismatch` erkannt — der Test
  `verifyUvChain #14` verifiziert genau diesen rechtskritischen
  Tamper-Fall.

- **20.C.3 — Integrity-Dashboard:** Die UV-Chain ist auf der Page
  `/admin/integrity` direkt verifizierbar (Betriebsprüfer-Vorlage).
  JSON-Export liefert die Kette als GoBD-Nachweis.

- **20.C.4 — Doc-Closure:** dieser Abschnitt.

### Rechtsstatus nach Closure

Die **§ 18e UStG-Nachweispflicht ist technisch erfüllt:** Jede
qualifizierte BZSt-Anfrage + jede VIES-Anfrage wird persistent
geloggt, bytea-Raw-Response ist für § 147 Abs. 2 Nr. 1 AO
aufbewahrt, und die Hash-Chain schützt vor nachträglicher
Manipulation (§ 146 AO / GoBD Rz. 58ff.).

**Offen / verbleibender Scope:** Der **Steuerberater-Sign-off** für
die konkrete Routing-Logik (welche Fälle an welche Quelle gehen
und ob die automatische Routing-Regel fachlich akzeptabel ist)
ist weiterhin vor dem ersten Produktiv-Deploy nötig — das ist
organisatorisch, nicht technisch. Ebenfalls offen: die **SQL-
Verifikation der Canonical-Strings** auf Staging-DB
(siehe `docs/tech-debt/TECH-DEBT-SPRINT-20-DB-VERIFIKATION-PRE-DEPLOY.md`).

