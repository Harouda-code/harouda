// Wiederverwendbares Modal zum Anlegen eines Mandanten.
//
// Formular + Validierung + createClient-Mutation sind aus `ClientsPage`
// extrahiert; die Pflicht-Validierung ("Mandanten-Nr. und Name sind
// Pflichtfelder.") und die Fehlertexte bleiben 1:1 identisch, damit
// bestehende UX nicht abweicht. Verwendet die bestehende
// `components/ui/Modal`-Primitive (role=dialog + Esc + Backdrop-Click).

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./ui/Modal";
import { createClient } from "../api/clients";
import type { Client } from "../types/db";

type MandantAnlageModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
};

const EMPTY_FORM = {
  mandant_nr: "",
  name: "",
  steuernummer: "",
  ust_id: "",
  iban: "",
};

export function MandantAnlageModal({
  open,
  onClose,
  onCreated,
}: MandantAnlageModalProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  // Beim Öffnen immer mit leerem Formular starten; damit sehen Nutzer:innen
  // keine Reste eines vorherigen Anlage-Versuchs (z. B. Abbrechen → wieder
  // öffnen).
  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  const createM = useMutation({
    mutationFn: createClient,
    onSuccess: (client) => {
      toast.success("Mandant angelegt.");
      qc.invalidateQueries({ queryKey: ["clients"] });
      onCreated(client);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.mandant_nr.trim() || !form.name.trim()) {
      toast.error("Mandanten-Nr. und Name sind Pflichtfelder.");
      return;
    }
    createM.mutate({
      mandant_nr: form.mandant_nr.trim(),
      name: form.name.trim(),
      steuernummer: form.steuernummer.trim() || null,
      ust_id: form.ust_id.trim().toUpperCase() || null,
      iban: form.iban.replace(/\s+/g, "").toUpperCase() || null,
    });
  }

  const FORM_ID = "mandant-anlage-form";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Neuen Mandanten anlegen"
      size="md"
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            data-testid="mandant-anlage-cancel"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            form={FORM_ID}
            className="btn btn-primary"
            disabled={createM.isPending}
            data-testid="mandant-anlage-submit"
          >
            {createM.isPending ? (
              <>
                <Loader2 size={16} className="login__spinner" />
                Speichere …
              </>
            ) : (
              "Mandant anlegen"
            )}
          </button>
        </>
      }
    >
      <form
        id={FORM_ID}
        className="form-grid"
        onSubmit={handleSubmit}
        data-testid="mandant-anlage-form"
      >
        <label className="form-field">
          <span>Mandanten-Nr. *</span>
          <input
            required
            value={form.mandant_nr}
            onChange={(e) =>
              setForm((f) => ({ ...f, mandant_nr: e.target.value }))
            }
            placeholder="z. B. 10001"
            data-testid="mandant-anlage-field-mandant-nr"
          />
        </label>
        <label className="form-field">
          <span>Steuernummer</span>
          <input
            value={form.steuernummer}
            onChange={(e) =>
              setForm((f) => ({ ...f, steuernummer: e.target.value }))
            }
            placeholder="XX/XXX/XXXXX"
          />
        </label>
        <label className="form-field form-field--wide">
          <span>Name / Firma *</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Mustermann GmbH"
            data-testid="mandant-anlage-field-name"
          />
        </label>
        <label className="form-field">
          <span>USt-IdNr.</span>
          <input
            value={form.ust_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, ust_id: e.target.value }))
            }
            placeholder="DE123456789"
          />
        </label>
        <label className="form-field">
          <span>IBAN</span>
          <input
            value={form.iban}
            onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
            placeholder="DE89 3704 0044 0532 0130 00"
          />
        </label>
      </form>
    </Modal>
  );
}
