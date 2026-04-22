# validate-ustid — BZSt USt-IdNr-Bestätigung

**Sprint 20.A.2** · koexistiert mit `verify-ust-idnr` (VIES, EU-weit).

## Zweck

Serverseitiger Proxy zum BZSt-Dienst `evatrRPC`. Liefert die
**qualifizierte Bestätigung** nach § 18e UStG für deutsche und
intra-EU-Anfragen aus deutscher Requester-Perspektive. Das
Ergebnis wird **ab Sprint 20 persistent** in `ustid_verifications`
mit `verification_source='BZST'` abgelegt (WORM-Log,
§ 147 AO 10 J Retention).

CORS-Beschränkung + ISO-8859-1-Response erzwingen den
Server-Proxy; direkte Browser-Calls scheitern.

## Request (POST JSON)

```json
{
  "ownUstId":     "DE123456789",       // Requester-UStID (Pflicht)
  "partnerUstId": "DE987654321",       // zu prüfende UStID (Pflicht)
  "firmenname":   "Muster AG",          // optional, qualifiziert
  "ort":          "Köln",
  "plz":          "50667",
  "strasse":      "Domstr. 1",
  "clientId":     "uuid",               // Pflicht ab 20.A.2
  "companyId":    "uuid",               // Pflicht ab 20.A.2
  "partnerId":    "uuid-or-null"        // optional
}
```

## Response

HTTP 200 — vollständige `ustid_verifications`-Row als JSON.

**BZSt-Error-Code → `verification_status`:**

| BZSt-Code | Status | Bedeutung |
|---|---|---|
| 200 | `VALID` | USt-IdNr bestätigt |
| 201–204 | `INVALID` | nicht gültig / nicht registriert / erst heute / früher |
| 215, 217–219 | `SERVICE_UNAVAILABLE` | BZSt/MS nicht erreichbar oder qualifizierte Bestätigung z. Zt. nicht möglich |
| 999 | `ERROR` | interner BZSt-Fehler |
| Netzwerk | `ERROR` | Fetch-Fehler an BZSt |

**Fallback-Logik:** Die Function selbst fallbackt NICHT auf VIES.
Das macht der Client (`src/api/ustIdRouter.ts`) explizit, damit
beide Log-Rows sichtbar bleiben.

## Secrets

- `SUPABASE_URL` — automatisch
- `SUPABASE_SERVICE_ROLE_KEY` — automatisch (bypasst RLS für Log-Insert)

## Deploy

```bash
supabase functions deploy validate-ustid
```

## Known Limitations

1. **Kein Auto-Retry.** Der Router retried explizit mit VIES-Fallback.
2. **Keine Qualifizierte-Anfrage-Pflicht.** Die Felder `firmenname`/
   `ort`/`plz`/`strasse` sind optional; ohne sie liefert BZSt nur
   einfache Bestätigung. Für § 18e-UStG-Nachweise alle vier Felder
   mitsenden (Frontend-Verantwortung).
3. **XML-Parser ist Regex-basiert.** BZSt-Layout ist stabil; bei
   Schema-Änderung leise Parse-Fehler möglich.
4. **Log-Insert als service_role** umgeht RLS — die Function kann
   in JEDE Company schreiben, solange `clientId` + `companyId`
   konsistent sind. Aufrufer muss das validieren (der Router tut
   das implizit über die Partner-Herkunft).
