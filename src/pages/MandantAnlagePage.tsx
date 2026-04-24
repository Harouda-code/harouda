import React from "react";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  mandantAnlageSchema,
  type MandantAnlageData,
} from "../domain/clients/mandantAnlageSchema";
import { MandantAnlageWizard } from "../components/mandant-anlage/MandantAnlageWizard";
import { createClient, type ClientInput } from "../api/clients";
import { sanitizeFormPayload } from "../lib/forms/sanitizePayload";

export default function MandantAnlagePage() {
  const navigate = useNavigate();

  const methods = useForm<MandantAnlageData>({
    // See Phase 4.B.1 commit message for rationale on this cast.
    resolver: zodResolver(mandantAnlageSchema) as unknown as Resolver<MandantAnlageData>,
    mode: "onBlur",
    defaultValues: {
      mandant_nr: "",
      name: "",
      anschrift_land: "DE",
      kleinunternehmer_regelung: false,
      kontenrahmen: "SKR03",
      sachkontenlaenge: 4,
      wirtschaftsjahr_typ: "kalenderjahr",
      wirtschaftsjahr_beginn: "01-01",
      wirtschaftsjahr_ende: "12-31",
    },
  });

  function handleCancel() {
    if (methods.formState.isDirty) {
      const confirmed = window.confirm(
        "Es gibt ungespeicherte Änderungen. Möchten Sie den Vorgang wirklich abbrechen?"
      );
      if (!confirmed) return;
    }
    navigate("/mandanten");
  }

  async function handleSubmitFinal(data: MandantAnlageData) {
    try {
      // Sanitize: convert "" → null for DB compatibility with CHECK constraints.
      const cleaned = sanitizeFormPayload(data) as unknown as ClientInput;
      const created = await createClient(cleaned);
      toast.success(`Mandant "${created.name}" wurde angelegt.`);
      navigate("/mandanten");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("createClient failed:", err);
      toast.error(`Fehler beim Anlegen: ${message}`);
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="bg-white shadow rounded-lg max-w-3xl mx-auto">
          <header className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold">Neuen Mandanten anlegen</h1>
            <p className="text-sm text-gray-500 mt-1">
              Vier Schritte zur vollständigen Erfassung der Mandanten-Stammdaten.
            </p>
          </header>
          <MandantAnlageWizard
            onCancel={handleCancel}
            onSubmitFinal={handleSubmitFinal}
            isSubmitting={methods.formState.isSubmitting}
          />
        </div>
      </div>
    </FormProvider>
  );
}
