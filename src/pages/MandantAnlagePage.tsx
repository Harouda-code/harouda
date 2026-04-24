import React from "react";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  mandantAnlageSchema,
  type MandantAnlageData,
} from "../domain/clients/mandantAnlageSchema";
import { MandantAnlageWizard } from "../components/mandant-anlage/MandantAnlageWizard";

export default function MandantAnlagePage() {
  const methods = useForm<MandantAnlageData>({
    // Zod 4 `.default()` makes output type stricter than input (required vs
    // optional). RHF's single-generic useForm treats TFieldValues == TTransformedValues,
    // so zodResolver's Resolver<Input, …, Output> doesn't match. The cast is safe:
    // at runtime, form state carries applied defaults, so z.output describes it
    // accurately. Revisit if useForm gains ergonomic Input/Output split.
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
    // TODO: Phase 4.B.2 — add confirmation if form is dirty, then navigate back to /mandanten
    console.log("Cancel clicked (stub — navigation added in 4.B.2)");
  }

  async function handleSubmitFinal(data: MandantAnlageData) {
    // TODO: Phase 4.B.2 — call createClient() and navigate on success
    console.log("Submit clicked (stub — API call added in 4.B.2):", data);
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
