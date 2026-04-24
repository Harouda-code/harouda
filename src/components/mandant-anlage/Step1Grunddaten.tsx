import React from "react";
import { useFormContext } from "react-hook-form";
import type { MandantAnlageData } from "../../domain/clients/mandantAnlageSchema";

const RECHTSFORM_LABELS: Record<string, string> = {
  Einzelunternehmen: "Einzelunternehmen",
  GbR: "GbR",
  PartG: "PartG",
  OHG: "OHG",
  KG: "KG",
  GmbH: "GmbH",
  AG: "AG",
  UG: "UG (haftungsbeschränkt)",
  SE: "Societas Europaea",
  SonstigerRechtsform: "Sonstige Rechtsform",
};

export function Step1Grunddaten() {
  const { register, formState: { errors } } = useFormContext<MandantAnlageData>();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Grunddaten</h2>

      <div>
        <label className="block text-sm font-medium mb-1">
          Mandanten-Nr. <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("mandant_nr")}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="z.B. 10001"
        />
        {errors.mandant_nr && (
          <p className="text-red-500 text-sm mt-1">{errors.mandant_nr.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Name / Firma <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("name")}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mustermann GmbH"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Rechtsform <span className="text-red-500">*</span>
        </label>
        <select
          {...register("rechtsform")}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- auswählen --</option>
          {Object.entries(RECHTSFORM_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.rechtsform && (
          <p className="text-red-500 text-sm mt-1">{errors.rechtsform.message}</p>
        )}
      </div>
    </div>
  );
}
