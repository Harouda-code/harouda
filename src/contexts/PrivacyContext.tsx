// Privacy-Modus für Screen-Sharing.
//
// Einfache On/Off-Umschaltung: setzt eine Klasse am <body>, CSS-Regeln in
// index.css blurren die sensiblen Inhalte. Nutzer:innen können die
// Maskierung durch Hover temporär aufheben.
//
// Keine verschiedenen Sensitivitäts-Stufen, kein automatisches Timeout,
// keine Rollengate — das wäre künstliche Komplexität. Das bestehende
// Auto-Logout aus UserContext deckt den Inaktivitäts-Fall ab.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { log } from "../api/audit";

type PrivacyContextValue = {
  isPrivate: boolean;
  toggle: () => void;
  setPrivate: (v: boolean) => void;
};

const STORAGE_KEY = "harouda:privacy";
const BODY_CLASS = "is-private";

const PrivacyContext = createContext<PrivacyContextValue | undefined>(
  undefined
);

function loadInitial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isPrivate, setIsPrivate] = useState<boolean>(loadInitial);

  // Klassen-Sync zum <body>
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isPrivate) {
      document.body.classList.add(BODY_CLASS);
    } else {
      document.body.classList.remove(BODY_CLASS);
    }
    try {
      if (isPrivate) localStorage.setItem(STORAGE_KEY, "1");
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [isPrivate]);

  const setPrivate = useCallback((v: boolean) => {
    setIsPrivate((prev) => {
      if (prev === v) return prev;
      // Audit-Log: Aktivieren/Deaktivieren festhalten
      void log({
        action: "update",
        entity: "settings",
        entity_id: null,
        summary: v
          ? "Privacy-Modus aktiviert (Screen-Sharing)"
          : "Privacy-Modus deaktiviert",
      });
      return v;
    });
  }, []);

  const toggle = useCallback(() => {
    setPrivate(!isPrivate);
  }, [isPrivate, setPrivate]);

  // Globales Shortcut: Strg+Umschalt+P
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (!e.shiftKey) return;
      if (e.key === "P" || e.key === "p") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const value = useMemo<PrivacyContextValue>(
    () => ({ isPrivate, toggle, setPrivate }),
    [isPrivate, toggle, setPrivate]
  );

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within PrivacyProvider");
  return ctx;
}
