import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_MODE, supabase } from "../api/supabase";
import { useUser } from "./UserContext";

export type CompanyRole =
  | "owner"
  | "admin"
  | "member"
  | "readonly"
  | "tax_auditor";

export type CompanyMembership = {
  companyId: string;
  companyName: string;
  role: CompanyRole;
};

type CompanyContextValue = {
  activeCompanyId: string | null;
  activeRole: CompanyRole | null;
  memberships: CompanyMembership[];
  loading: boolean;
  setActiveCompanyId: (id: string | null) => void;
  reload: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "harouda:activeCompanyId";

// Im DEMO_MODE benutzen wir eine pseudo-ID, damit Code, der companyId erwartet,
// konsistent arbeitet. Daten laufen weiterhin über localStorage.
// Exportiert ab Sprint 20.A.1, damit Call-Sites (PartnerEditor-Dialog etc.)
// denselben Fallback nutzen wie der Provider selbst.
export const DEMO_COMPANY_ID = "demo-00000000-0000-0000-0000-000000000001";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const [memberships, setMemberships] = useState<CompanyMembership[]>([]);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(
    () => {
      if (DEMO_MODE) return DEMO_COMPANY_ID;
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    }
  );

  const setActiveCompanyId = useCallback((id: string | null) => {
    setActiveCompanyIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage blocked — ignore */
    }
  }, []);

  const loadMemberships = useCallback(async (): Promise<CompanyMembership[]> => {
    if (DEMO_MODE) {
      return [
        {
          companyId: DEMO_COMPANY_ID,
          companyName: "Demo-Kanzlei",
          role: "owner",
        },
      ];
    }
    if (!user) return [];

    // Abfrage: alle Firmen, in denen der aktuelle User Mitglied ist
    const { data, error } = await supabase
      .from("company_members")
      .select("role, company_id, companies!inner(id, name)")
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to load memberships:", error);
      return [];
    }
    type Row = {
      role: CompanyRole;
      company_id: string;
      companies: { id: string; name: string } | { id: string; name: string }[];
    };
    const rows = (data ?? []) as Row[];
    return rows.map((r) => {
      const c = Array.isArray(r.companies) ? r.companies[0] : r.companies;
      return {
        companyId: r.company_id,
        companyName: c?.name ?? "(unbenannt)",
        role: r.role,
      };
    });
  }, [user]);

  const bootstrapFirstCompany = useCallback(async (): Promise<
    CompanyMembership | null
  > => {
    if (DEMO_MODE || !user) return null;
    // Wenn ein neuer User sich einloggt und noch keiner Firma angehört:
    // automatisch eine „Meine Kanzlei" anlegen und als Owner eintragen.
    const slug = `kanzlei-${user.id.slice(0, 8)}-${Date.now()}`;
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .insert({
        name: user.email?.split("@")[0]
          ? `${user.email.split("@")[0]}s Kanzlei`
          : "Meine Kanzlei",
        slug,
        created_by: user.id,
      })
      .select("id, name")
      .single();
    if (companyErr || !company) {
      console.error("Failed to bootstrap company:", companyErr);
      return null;
    }
    const { error: memErr } = await supabase
      .from("company_members")
      .insert({ company_id: company.id, user_id: user.id, role: "owner" });
    if (memErr) {
      console.error("Failed to add owner membership:", memErr);
      return null;
    }
    return {
      companyId: company.id,
      companyName: company.name,
      role: "owner",
    };
  }, [user]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      let list = await loadMemberships();
      if (!DEMO_MODE && user && list.length === 0) {
        const newMembership = await bootstrapFirstCompany();
        if (newMembership) list = [newMembership];
      }
      setMemberships(list);
      // Active-Company konsolidieren
      if (list.length === 0) {
        setActiveCompanyIdState(null);
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        const match = list.find((m) => m.companyId === stored);
        const pick = match ?? list[0];
        setActiveCompanyIdState(pick.companyId);
        try {
          localStorage.setItem(STORAGE_KEY, pick.companyId);
        } catch {
          /* ignore */
        }
      }
    } finally {
      setLoading(false);
    }
  }, [loadMemberships, bootstrapFirstCompany, user]);

  useEffect(() => {
    if (userLoading) return;
    if (DEMO_MODE) {
      setMemberships([
        {
          companyId: DEMO_COMPANY_ID,
          companyName: "Demo-Kanzlei",
          role: "owner",
        },
      ]);
      setActiveCompanyIdState(DEMO_COMPANY_ID);
      setLoading(false);
      return;
    }
    if (!user) {
      setMemberships([]);
      setActiveCompanyIdState(null);
      setLoading(false);
      return;
    }
    void reload();
  }, [user, userLoading, reload]);

  const activeRole = useMemo<CompanyRole | null>(() => {
    if (!activeCompanyId) return null;
    return (
      memberships.find((m) => m.companyId === activeCompanyId)?.role ?? null
    );
  }, [activeCompanyId, memberships]);

  const value = useMemo<CompanyContextValue>(
    () => ({
      activeCompanyId,
      activeRole,
      memberships,
      loading,
      setActiveCompanyId,
      reload,
    }),
    [activeCompanyId, activeRole, memberships, loading, setActiveCompanyId, reload]
  );

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}

/**
 * Liefert die aktive company_id. Sprint 20.A.1: tolerant gegenüber
 * fehlendem Provider (Test-Mounts, isolierte Komponenten-Unit-Tests) —
 * gibt `null` zurück statt zu werfen. Aufrufer koppeln an einen
 * Fallback (`useCompanyId() ?? DEMO_COMPANY_ID`).
 */
export function useCompanyId(): string | null {
  const ctx = useContext(CompanyContext);
  return ctx?.activeCompanyId ?? null;
}
