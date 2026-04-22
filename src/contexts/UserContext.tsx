import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { DEMO_MODE, supabase } from "../api/supabase";
import { log, resetAuditActorCache } from "../api/audit";

type UserContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Verbleibende Sekunden bis zum Auto-Logout, null wenn nicht eingeloggt. */
  sessionExpiresInSec: number | null;
  /** Sperrt den Inaktivitäts-Timer auf eine neue Grenze (Minuten). */
  setIdleTimeoutMinutes: (minutes: number) => void;
  idleTimeoutMinutes: number;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: (reason?: "manual" | "timeout") => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
};

const IDLE_STORAGE_KEY = "harouda:idleTimeoutMinutes";
const DEFAULT_IDLE_MINUTES = 8 * 60;

const UserContext = createContext<UserContextValue | undefined>(undefined);

// Fake user for DEMO_MODE — lets the whole app flow work without a backend.
const DEMO_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "demo@harouda.local",
  app_metadata: {},
  user_metadata: { role: "demo" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

const DEMO_SESSION = {
  access_token: "demo",
  refresh_token: "demo",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: DEMO_USER,
} as unknown as Session;

function loadIdleMinutes(): number {
  try {
    const raw = localStorage.getItem(IDLE_STORAGE_KEY);
    if (!raw) return DEFAULT_IDLE_MINUTES;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 5 || parsed > 24 * 60) {
      return DEFAULT_IDLE_MINUTES;
    }
    return parsed;
  } catch {
    return DEFAULT_IDLE_MINUTES;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(
    DEMO_MODE ? DEMO_SESSION : null
  );
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [idleTimeoutMinutes, setIdleTimeoutMinutesState] = useState<number>(
    loadIdleMinutes
  );
  const [lastActivity, setLastActivity] = useState<number>(() => Date.now());
  const [sessionExpiresInSec, setSessionExpiresInSec] = useState<number | null>(
    null
  );
  // Verhindert, dass das gleiche Login-Event zweimal in den Audit-Log läuft.
  const lastLoggedAuthRef = useRef<{ event: string; userId: string } | null>(
    null
  );

  useEffect(() => {
    if (DEMO_MODE) return;

    let cancelled = false;
    let initialized = false;
    const finishInit = (s: Session | null) => {
      if (cancelled || initialized) return;
      initialized = true;
      setSession(s);
      setLoading(false);
    };

    // Primärer Pfad: gespeicherte Session holen (kann bei abgelaufenen Tokens
    // oder Netzwerkproblemen fehlschlagen oder hängen — deshalb robust).
    supabase.auth
      .getSession()
      .then(({ data }) => finishInit(data.session))
      .catch((err) => {
        console.error("supabase.auth.getSession failed:", err);
        finishInit(null);
      });

    // Sekundärer Pfad: der erste onAuthStateChange-Event (INITIAL_SESSION)
    // feuert zuverlässig nach dem Subscribe. Falls getSession hängt, greifen
    // wir darauf zurück.
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, next) => {
        if (cancelled) return;
        setSession(next);
        finishInit(next);
        if (event === "SIGNED_IN" && next?.user) {
          const key = `SIGNED_IN:${next.user.id}`;
          if (lastLoggedAuthRef.current?.event !== key) {
            lastLoggedAuthRef.current = { event: key, userId: next.user.id };
            resetAuditActorCache();
            try {
              await log({
                action: "login",
                entity: "auth",
                entity_id: next.user.id,
                summary: `Login: ${next.user.email ?? next.user.id}`,
              });
            } catch (err) {
              console.error("Audit-log Login fehlgeschlagen:", err);
            }
          }
        }
        if (event === "SIGNED_OUT") {
          lastLoggedAuthRef.current = null;
          resetAuditActorCache();
        }
      }
    );

    // Letzter Fallback: falls weder getSession noch onAuthStateChange in
    // 5 Sekunden antworten (offline, blockierte Anfrage), entsperren wir die
    // UI anstatt dauerhaft den Spinner zu zeigen.
    const safetyTimeout = window.setTimeout(() => {
      if (!initialized) {
        console.warn(
          "Supabase-Auth hat innerhalb von 5s nicht geantwortet — " +
            "App startet ohne Session (Benutzer:in landet auf /login)."
        );
        finishInit(null);
      }
    }, 5000);

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const setIdleTimeoutMinutes = useCallback((minutes: number) => {
    const clamped = Math.max(5, Math.min(24 * 60, Math.round(minutes)));
    setIdleTimeoutMinutesState(clamped);
    try {
      localStorage.setItem(IDLE_STORAGE_KEY, String(clamped));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setSessionExpiresInSec(null);
      return;
    }
    // Activity-Listener nur wenn eingeloggt.
    const onActivity = () => setLastActivity(Date.now());
    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [session]);

  const signOutInternal = useCallback(
    async (reason: "manual" | "timeout") => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        try {
          await log({
            action: "logout",
            entity: "auth",
            entity_id: currentUser.id,
            summary:
              reason === "timeout"
                ? `Auto-Logout (Inaktivität): ${currentUser.email ?? currentUser.id}`
                : `Logout: ${currentUser.email ?? currentUser.id}`,
          });
        } catch (err) {
          console.error("Audit-log Logout fehlgeschlagen:", err);
        }
      }
      if (DEMO_MODE) {
        setSession(null);
        return;
      }
      await supabase.auth.signOut();
    },
    [session]
  );

  useEffect(() => {
    if (!session) return;
    const totalMs = idleTimeoutMinutes * 60 * 1000;
    const iv = window.setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      const remaining = Math.max(0, Math.round((totalMs - elapsed) / 1000));
      setSessionExpiresInSec(remaining);
      if (remaining === 0) {
        window.clearInterval(iv);
        signOutInternal("timeout");
      }
    }, 1000);
    return () => window.clearInterval(iv);
  }, [session, idleTimeoutMinutes, lastActivity, signOutInternal]);

  const value = useMemo<UserContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      sessionExpiresInSec,
      idleTimeoutMinutes,
      setIdleTimeoutMinutes,
      signIn: async (email, password) => {
        if (DEMO_MODE) {
          const user = { ...DEMO_USER, email: email || DEMO_USER.email };
          setSession({ ...DEMO_SESSION, user });
          setLastActivity(Date.now());
          try {
            await log({
              action: "login",
              entity: "auth",
              entity_id: user.id,
              summary: `Demo-Login: ${user.email}`,
            });
          } catch (err) {
            console.error("Audit-log Demo-Login fehlgeschlagen:", err);
          }
          return { error: null };
        }
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!error) setLastActivity(Date.now());
        return { error };
      },
      signUp: async (email, password) => {
        if (DEMO_MODE) {
          const user = { ...DEMO_USER, email: email || DEMO_USER.email };
          setSession({ ...DEMO_SESSION, user });
          return { error: null };
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (!error) {
          try {
            await log({
              action: "signup",
              entity: "auth",
              entity_id: email,
              summary: `Registrierung angefordert: ${email}`,
            });
          } catch {
            /* ignore */
          }
        }
        return { error };
      },
      signOut: async (reason = "manual") => {
        await signOutInternal(reason);
      },
      resetPassword: async (email) => {
        if (DEMO_MODE) {
          return { error: null };
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/login",
        });
        return { error };
      },
    }),
    [
      session,
      loading,
      sessionExpiresInSec,
      idleTimeoutMinutes,
      setIdleTimeoutMinutes,
      signOutInternal,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
