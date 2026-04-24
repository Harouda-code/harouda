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
    <div className="wizard-step">
      <h2 className="wizard-step__title">Grunddaten</h2>

      <div className="wizard-field">
        <label className="wizard-field__label">
          Mandanten-Nr.<span className="wizard-field__required">*</span>
        </label>
        <input
          type="text"
          {...register("mandant_nr")}
          className="wizard-field__input"
          placeholder="z.B. 10001"
        />
        {errors.mandant_nr && (
          <p className="wizard-field__error">{errors.mandant_nr.message}</p>
        )}
      </div>

      <div className="wizard-field">
        <label className="wizard-field__label">
          Name / Firma<span className="wizard-field__required">*</span>
        </label>
        <input
          type="text"
          {...register("name")}
          className="wizard-field__input"
          placeholder="Mustermann GmbH"
        />
        {errors.name && <p className="wizard-field__error">{errors.name.message}</p>}
      </div>

      <div className="wizard-field">
        <label className="wizard-field__label">
          Rechtsform<span className="wizard-field__required">*</span>
        </label>
        <select {...register("rechtsform")} className="wizard-field__select">
          <option value="">-- auswählen --</option>
          {Object.entries(RECHTSFORM_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.rechtsform && (
          <p className="wizard-field__error">{errors.rechtsform.message}</p>
        )}
      </div>
    </div>
  );
}
