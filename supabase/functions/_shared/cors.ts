// ============================================================================
// Supabase Edge Functions · gemeinsame CORS-Helfer (Charge 7, Aufgabe 3)
//
// Sicherheitsprinzip: Strict Deny.
//   - Origin in Whitelist  -> Access-Control-Allow-Origin: <origin>
//   - Origin nicht erlaubt -> kein CORS-Header (Browser blockiert)
//   - Origin fehlt         -> kein CORS-Header (server-to-server bleibt
//                              unberuehrt, Browser-Aufrufe scheitern)
//
// Rechtliche Grundlage:
//   DSGVO Art. 32 (Sicherheit der Verarbeitung).
//
// Ersetzt das bisherige `Access-Control-Allow-Origin: *` in:
//   - validate-ustid/index.ts
//   - verify-ust-idnr/index.ts
// ============================================================================

/**
 * Whitelist erlaubter Origins. Exakte Uebereinstimmung, keine Wildcards,
 * keine Subdomain-Patterns. Aenderungen erfordern Code-Review + Deploy.
 */
export const ALLOWED_ORIGINS: readonly string[] = [
  "https://harouda.app",
  "https://staging.harouda.app",
  "http://localhost:5173",
] as const;

/**
 * Liefert die CORS-Header fuer eine konkrete Anfrage.
 *
 * - Origin in Whitelist  -> vollstaendige CORS-Header inkl. Allow-Origin.
 * - Origin nicht erlaubt -> nur Methods/Headers (kein Allow-Origin =>
 *   Browser blockiert die Antwort).
 *
 * Hinweis: `Vary: Origin` ist Pflicht, sobald die Antwort vom Origin abhaengt
 * (Cache-Korrektheit auf CDNs / Browsern).
 */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const base: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Vary": "Origin",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    base["Access-Control-Allow-Origin"] = origin;
  }
  return base;
}

/**
 * Behandelt CORS-Preflight (OPTIONS).
 *
 * - Erlaubter Origin -> 204 No Content mit vollstaendigen Headern.
 * - Nicht erlaubt    -> 403 Forbidden ohne Allow-Origin.
 *   (Der Browser bricht den eigentlichen Request ohnehin ab; der 403
 *   Status macht den Vorfall in Server-Logs sichtbar.)
 *
 * Ruft die aufrufende Edge Function nur, wenn req.method === "OPTIONS".
 */
export function handleCorsPreflight(req: Request): Response {
  const origin = req.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  return new Response(null, { status: 403 });
}

/**
 * Test-Helfer: Erlaubt Tests, die Whitelist zu inspizieren, ohne sie
 * zu mutieren. NICHT zur Laufzeit-Konfiguration verwenden.
 */
export function isOriginAllowed(origin: string | null): boolean {
  return Boolean(origin && ALLOWED_ORIGINS.includes(origin));
}
