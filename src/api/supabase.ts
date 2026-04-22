import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Sprint 7.5 Fix (B1): DEMO_MODE defaults to TRUE in dev/test so a
// fresh `npm run dev` start lands in the Musterfirma-Seed-Pfad ohne
// manuelles .env.local-Editieren. In production builds bleibt das
// Default bei FALSE — nur explizites VITE_DEMO_MODE=1 schaltet Demo
// im produktiven Bundle an.
//
//   VITE_DEMO_MODE=1 → true  (explicit ON, any environment)
//   VITE_DEMO_MODE=0 → false (explicit OFF, any environment)
//   unset            → true in DEV/TEST, false in production
export const DEMO_MODE: boolean = (() => {
  const raw = import.meta.env.VITE_DEMO_MODE;
  if (raw === "1") return true;
  if (raw === "0") return false;
  return import.meta.env.DEV === true;
})();

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!DEMO_MODE && (!url || !anonKey)) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

// In DEMO_MODE we still create a client so all type signatures keep working,
// but it points at a dummy URL. UserContext + audit.ts check DEMO_MODE and
// skip real network calls, so the stub is never actually hit.
export const supabase: SupabaseClient = createClient(
  url ?? "https://demo.invalid",
  anonKey ?? "demo-anon-key",
  {
    auth: {
      persistSession: !DEMO_MODE,
      autoRefreshToken: !DEMO_MODE,
      detectSessionInUrl: false,
    },
  }
);
