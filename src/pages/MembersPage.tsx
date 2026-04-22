import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Crown,
  Eye,
  Loader2,
  Pencil,
  Shield,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useCompany, type CompanyRole } from "../contexts/CompanyContext";
import { usePermissions } from "../hooks/usePermissions";
import { DEMO_MODE, supabase } from "../api/supabase";
import "./ReportView.css";
import "./TaxCalc.css";
import "./MembersPage.css";

type Member = {
  user_id: string;
  email: string;
  role: CompanyRole;
};

const ROLE_LABEL: Record<CompanyRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Mitglied",
  readonly: "Nur-Lesen",
  tax_auditor: "Betriebsprüfer:in",
};

const ROLE_DESCRIPTION: Record<CompanyRole, string> = {
  owner: "Vollzugriff inkl. Firma löschen und Owner bestimmen.",
  admin: "Nutzerverwaltung, Stammdaten, alle Buchungen. Keine Eigentümerrechte.",
  member: "Normale Buchhaltungsarbeit — Buchen, Mahnen, Belege.",
  readonly: "Lesezugriff für interne Kolleg:innen.",
  tax_auditor:
    "Externe Betriebsprüfung — Lesezugriff auf Prüfer-Dashboard, keine Navigation in operative Module.",
};

const ROLE_ICON: Record<CompanyRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
  readonly: Eye,
  tax_auditor: Eye,
};

export default function MembersPage() {
  const qc = useQueryClient();
  const { activeCompanyId, activeRole, memberships } = useCompany();
  const perms = usePermissions();

  const membersQ = useQuery({
    queryKey: ["company-members", activeCompanyId],
    queryFn: async (): Promise<Member[]> => {
      if (DEMO_MODE) {
        return [
          {
            user_id: "demo",
            email: "demo@harouda.local",
            role: activeRole ?? "owner",
          },
        ];
      }
      if (!activeCompanyId) return [];
      // Zwei-Schritt: members + auth.users via RPC ist Supabase-best-practice,
      // aber aus dem Client heraus können wir nur members + user_id lesen.
      // E-Mails holen wir über eine separate Abfrage auf auth.admin, was
      // ohne Service-Role-Key nicht geht. Wir zeigen die user_id stattdessen.
      const { data, error } = await supabase
        .from("company_members")
        .select("user_id, role")
        .eq("company_id", activeCompanyId);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => ({
        user_id: r.user_id,
        email: r.user_id.slice(0, 8) + "…",
        role: r.role as CompanyRole,
      }));
    },
    enabled: !!activeCompanyId,
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    user_id: "",
    role: "member" as CompanyRole,
  });

  const inviteM = useMutation({
    mutationFn: async (input: { user_id: string; role: CompanyRole }) => {
      if (DEMO_MODE) {
        throw new Error(
          "Demo-Modus: Nutzerverwaltung ist deaktiviert (keine Supabase-Auth)."
        );
      }
      if (!activeCompanyId) throw new Error("Keine Firma ausgewählt.");
      const { error } = await supabase.from("company_members").insert({
        company_id: activeCompanyId,
        user_id: input.user_id,
        role: input.role,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-members"] });
      setInviteOpen(false);
      setInviteForm({ user_id: "", role: "member" });
      toast.success("Nutzer:in hinzugefügt.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const roleChangeM = useMutation({
    mutationFn: async (input: { user_id: string; role: CompanyRole }) => {
      if (DEMO_MODE) throw new Error("Demo-Modus.");
      if (!activeCompanyId) throw new Error("Keine Firma.");
      const { error } = await supabase
        .from("company_members")
        .update({ role: input.role })
        .eq("company_id", activeCompanyId)
        .eq("user_id", input.user_id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-members"] });
      toast.success("Rolle aktualisiert.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeM = useMutation({
    mutationFn: async (userId: string) => {
      if (DEMO_MODE) throw new Error("Demo-Modus.");
      if (!activeCompanyId) throw new Error("Keine Firma.");
      const { error } = await supabase
        .from("company_members")
        .delete()
        .eq("company_id", activeCompanyId)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-members"] });
      toast.success("Nutzer:in entfernt.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activeCompany = useMemo(
    () => memberships.find((m) => m.companyId === activeCompanyId) ?? null,
    [memberships, activeCompanyId]
  );

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!inviteForm.user_id.trim()) {
      toast.error("Bitte User-ID eintragen.");
      return;
    }
    inviteM.mutate(inviteForm);
  }

  if (!perms.canAdmin) {
    return (
      <div className="report">
        <header className="report__head">
          <Link to="/einstellungen" className="report__back">
            <ArrowLeft size={16} />
            Zurück zu Einstellungen
          </Link>
          <div className="report__head-title">
            <h1>Benutzerverwaltung</h1>
          </div>
        </header>
        <aside className="taxcalc__hint">
          <Shield size={14} />
          <span>
            Für die Benutzerverwaltung benötigen Sie die Rolle <strong>Admin</strong> oder <strong>Owner</strong>.
            Ihre aktuelle Rolle: <strong>{activeRole ? ROLE_LABEL[activeRole] : "keine"}</strong>.
          </span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report">
      <header className="report__head">
        <Link to="/einstellungen" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Einstellungen
        </Link>
        <div className="report__head-title">
          <h1>Benutzerverwaltung</h1>
          <p>
            Mitglieder der Firma{" "}
            <strong>{activeCompany?.companyName ?? "—"}</strong>. Jede:r hat
            eine von vier Rollen.
          </p>
        </div>
        <div className="period">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setInviteOpen(true)}
            disabled={DEMO_MODE}
            title={
              DEMO_MODE ? "Im Demo-Modus deaktiviert" : "Nutzer:in hinzufügen"
            }
          >
            <UserPlus size={16} />
            Nutzer:in hinzufügen
          </button>
        </div>
      </header>

      {DEMO_MODE && (
        <aside className="taxcalc__hint">
          <Shield size={14} />
          <span>
            <strong>Demo-Modus aktiv:</strong> Die Nutzerverwaltung arbeitet
            hier nur lokal und zeigt den Demo-Owner. Für echte
            Mehrnutzer-Funktion einen Produktiv-Build (ohne{" "}
            <code>VITE_DEMO_MODE</code>) gegen Supabase betreiben.
          </span>
        </aside>
      )}

      <section className="card members__roles">
        <h2>Rollenübersicht</h2>
        <div className="members__roles-grid">
          {(
            [
              "owner",
              "admin",
              "member",
              "readonly",
              "tax_auditor",
            ] as CompanyRole[]
          ).map(
            (r) => {
              const Icon = ROLE_ICON[r];
              return (
                <div key={r} className={`members__role members__role--${r}`}>
                  <div className="members__role-icon">
                    <Icon size={16} />
                  </div>
                  <strong>{ROLE_LABEL[r]}</strong>
                  <p>{ROLE_DESCRIPTION[r]}</p>
                </div>
              );
            }
          )}
        </div>
      </section>

      {inviteOpen && (
        <form className="card members__invite" onSubmit={handleInvite}>
          <header>
            <h2>Nutzer:in hinzufügen</h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setInviteOpen(false)}
              aria-label="Schließen"
            >
              <X size={18} />
            </button>
          </header>
          <div className="form-grid">
            <label className="form-field form-field--wide">
              <span>
                Supabase User-ID (UUID)
                <small
                  style={{
                    display: "block",
                    color: "var(--muted)",
                    fontWeight: 400,
                  }}
                >
                  Die User muss sich vorher bei Supabase registriert haben.
                  Die ID finden Sie in der Supabase-Dashboard → Authentication → Users.
                </small>
              </span>
              <input
                required
                value={inviteForm.user_id}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, user_id: e.target.value }))
                }
                placeholder="00000000-0000-0000-0000-000000000000"
              />
            </label>
            <label className="form-field">
              <span>Rolle</span>
              <select
                value={inviteForm.role}
                onChange={(e) =>
                  setInviteForm((f) => ({
                    ...f,
                    role: e.target.value as CompanyRole,
                  }))
                }
              >
                <option value="readonly">Nur-Lesen</option>
                <option value="member">Mitglied</option>
                <option value="admin">Admin</option>
                {perms.canOwn && <option value="owner">Owner</option>}
              </select>
            </label>
          </div>
          <div className="members__invite-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setInviteOpen(false)}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={inviteM.isPending}
            >
              {inviteM.isPending ? (
                <>
                  <Loader2 size={14} className="login__spinner" />
                  Füge hinzu…
                </>
              ) : (
                "Hinzufügen"
              )}
            </button>
          </div>
        </form>
      )}

      <section className="card">
        <table className="members__table">
          <thead>
            <tr>
              <th>Nutzer:in</th>
              <th>Rolle</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {membersQ.isLoading ? (
              <tr>
                <td colSpan={3} style={{ padding: 24, textAlign: "center" }}>
                  <Loader2 size={20} className="login__spinner" />
                </td>
              </tr>
            ) : (membersQ.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 24, textAlign: "center" }}>
                  <em>Keine Mitglieder.</em>
                </td>
              </tr>
            ) : (
              (membersQ.data ?? []).map((m) => {
                const Icon = ROLE_ICON[m.role];
                const isMe = activeRole === m.role; // naiv; ohne echten Self-Check
                return (
                  <tr key={m.user_id}>
                    <td>
                      <div className="members__user">
                        <span className="members__avatar">
                          {(m.email || "?").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{m.email}</strong>
                          <small className="mono">{m.user_id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`members__role-pill is-${m.role}`}>
                        <Icon size={12} />
                        {ROLE_LABEL[m.role]}
                      </span>
                    </td>
                    <td className="members__actions">
                      <select
                        value={m.role}
                        onChange={(e) =>
                          roleChangeM.mutate({
                            user_id: m.user_id,
                            role: e.target.value as CompanyRole,
                          })
                        }
                        disabled={
                          DEMO_MODE ||
                          roleChangeM.isPending ||
                          (m.role === "owner" && !perms.canOwn)
                        }
                        aria-label={`Rolle ändern für ${m.email}`}
                      >
                        <option value="readonly">Nur-Lesen</option>
                        <option value="member">Mitglied</option>
                        <option value="admin">Admin</option>
                        {perms.canOwn && <option value="owner">Owner</option>}
                      </select>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (
                            confirm(
                              `Zugriff für Nutzer:in ${m.email} wirklich entfernen?`
                            )
                          )
                            removeM.mutate(m.user_id);
                        }}
                        disabled={DEMO_MODE || removeM.isPending}
                        title="Entfernen"
                        aria-label={`Zugriff entfernen für ${m.email}`}
                      >
                        <X size={14} />
                      </button>
                      {isMe && (
                        <span className="members__self">
                          <Pencil size={10} /> Das sind Sie
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
