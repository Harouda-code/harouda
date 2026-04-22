# verify-ust-idnr — VIES-Verifikations-Edge-Function

**Sprint 19.B** · koexistiert mit `validate-ustid` (BZSt, DE-only).

## Zweck

Serverseitige Abfrage der EU-Kommission `checkVatService`-SOAP-API
(VIES). CORS und Response-Encoding sprechen gegen direkte
Browser-Calls; zusätzlich verlangt § 18e UStG + § 147 Abs. 2 Nr. 1 AO
eine manipulationsgeschützte Ablage der Roh-Antwort — die schreibt
diese Function per `service_role` in `ustid_verifications`
(Migration 0037).

## Request (POST JSON)

```json
{
  "ustIdnr":          "DE123456789",
  "requesterUstIdnr": "DE987654321",
  "partnerId":        "uuid-optional",
  "clientId":         "uuid-required",
  "companyId":        "uuid-required"
}
```

Der Client sollte einen anonymen Bearer-Key nutzen
(`Authorization: Bearer <VITE_SUPABASE_ANON_KEY>`) — RLS wird durch
diese Function NICHT benutzt (service_role). Business-Logik-seitig
muss der Aufrufer selbst prüfen, dass `clientId`/`companyId` zu
seiner Session passen.

## Response

HTTP 200 — vollständiger `ustid_verifications`-Row als JSON.

`verification_status`-Werte:

| Status | Bedeutung |
|---|---|
| `VALID` | VIES bestätigt |
| `INVALID` | VIES widerlegt **oder** Format-Check schlug fehl (kein Round-trip) |
| `PENDING` | (vorgehalten — Function ist synchron) |
| `SERVICE_UNAVAILABLE` | Mitgliedsstaat down (`MS_UNAVAILABLE`) oder Timeout (15 s) |
| `ERROR` | Netzwerk / Parse / unerwartetes SOAP-Fault |

Error-Cases werden **mit 200 Status** zurückgegeben — das Front-End
unterscheidet via `verification_status`. Nur 4xx-Validation-Fehler
(fehlende Pflichtfelder, invalides JSON) liefern 400.

## Secrets

Die Function erwartet:

- `SUPABASE_URL` — automatisch von Supabase gesetzt.
- `SUPABASE_SERVICE_ROLE_KEY` — automatisch gesetzt.

Keine weiteren ENV-Vars nötig.

## Deploy

```bash
supabase functions deploy verify-ust-idnr
```

## Test lokal

```bash
supabase functions serve verify-ust-idnr --no-verify-jwt
curl -X POST http://127.0.0.1:54321/functions/v1/verify-ust-idnr \
  -H 'content-type: application/json' \
  -d '{"ustIdnr":"DE123456789","clientId":"<uuid>","companyId":"<uuid>"}'
```

## Known Limitations

1. **Timeout 15 s, kein Retry.** Der Client retried mit
   Backoff — konsistent mit Spec 19.B.1 ("retry: 0").
2. **Format-Check in der Function ist Minimal-Regex.** Der feine
   Länderspezifische Validator lebt im Frontend
   (`src/domain/partners/ustIdValidation.ts`). Die Function blockt nur
   grob invalide Werte, um sinnlose VIES-Calls zu sparen.
3. **SOAP-Response-Parser nutzt Regex, keinen XML-Parser.** VIES-Layout
   ist stabil genug; falls sich das Schema ändert, parst
   `parseViesResponse` leise falsch. Unit-Tests im Frontend kapseln
   keinen Edge-Function-Code.
4. **Keine Hash-Chain / Vorversions-Verknüpfung.** Sprint 20+.
5. **Keine Deduplication.** Mehrere Calls desselben Users innerhalb
   Sekunden erzeugen mehrere Einträge. UI muss debouncen.
