import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MessageSquare, Trash2, X } from "lucide-react";
import { addNote, deleteNote, fetchNotesFor } from "../api/advisorNotes";
import { useMandant } from "../contexts/MandantContext";
import { usePermissions } from "../hooks/usePermissions";
import "./AdvisorNotesModal.css";

export function AdvisorNotesModal({
  entityType,
  entityId,
  label,
  onClose,
}: {
  entityType: string;
  entityId: string;
  label: string;
  onClose: () => void;
}) {
  const perms = usePermissions();
  const qc = useQueryClient();
  const { selectedMandantId } = useMandant();
  const [body, setBody] = useState("");

  const notesQ = useQuery({
    queryKey: ["advisor_notes", entityType, entityId, selectedMandantId],
    queryFn: () => fetchNotesFor(entityType, entityId, selectedMandantId),
  });

  const addM = useMutation({
    mutationFn: (text: string) =>
      addNote({
        entityType,
        entityId,
        body: text,
        clientId: selectedMandantId,
      }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["advisor_notes", entityType, entityId] });
      qc.invalidateQueries({ queryKey: ["advisor_notes_counts", entityType] });
      toast.success("Notiz hinzugefügt.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteNote(id, selectedMandantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["advisor_notes", entityType, entityId] });
      qc.invalidateQueries({ queryKey: ["advisor_notes_counts", entityType] });
      toast.success("Notiz entfernt.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    addM.mutate(body);
  }

  return (
    <div className="advnotes__backdrop" onClick={onClose}>
      <div
        className="advnotes__modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="advnotes__head">
          <div>
            <h2>
              <MessageSquare size={16} />
              Beraternotizen
            </h2>
            <p>{label}</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </header>

        <div className="advnotes__body">
          {notesQ.isLoading ? (
            <div className="advnotes__loading">
              <Loader2 size={16} className="login__spinner" />
              <span>Lade Notizen …</span>
            </div>
          ) : (notesQ.data ?? []).length === 0 ? (
            <p className="advnotes__empty">Noch keine Notizen.</p>
          ) : (
            <ul className="advnotes__list">
              {(notesQ.data ?? []).map((n) => (
                <li key={n.id}>
                  <div className="advnotes__meta">
                    <strong>{n.author_email ?? "—"}</strong>
                    <span className="mono">
                      {new Date(n.created_at).toLocaleString("de-DE")}
                    </span>
                    {perms.canManage && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (confirm("Diese Notiz entfernen?"))
                            delM.mutate(n.id);
                        }}
                        aria-label="Notiz löschen"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="advnotes__text">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {perms.canWrite && (
          <form className="advnotes__form" onSubmit={handleSubmit}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Kommentar für Kolleg:innen oder Berater:innen hinterlassen…"
              rows={3}
              maxLength={4000}
            />
            <div className="advnotes__form-actions">
              <span className="advnotes__count">
                {body.length} / 4000
              </span>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!body.trim() || addM.isPending}
              >
                {addM.isPending ? "Sende …" : "Notiz hinzufügen"}
              </button>
            </div>
          </form>
        )}

        <footer className="advnotes__foot">
          <small>
            Notizen sind append-only (keine Bearbeitung) und werden im
            Audit-Log protokolliert. Keine Ende-zu-Ende-Verschlüsselung —
            Speicher at-rest durch Supabase.
          </small>
        </footer>
      </div>
    </div>
  );
}
