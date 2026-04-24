import React from "react";
import { useFormContext } from "react-hook-form";
import type { MandantAnlageData } from "../../domain/clients/mandantAnlageSchema";

export function Step2Anschrift() {
  const { register, formState: { errors } } = useFormContext<MandantAnlageData>();

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">Anschrift</h2>

      <div className="wizard-row wizard-row--strasse">
        <div className="wizard-field">
          <label className="wizard-field__label">Straße</label>
          <input type="text" {...register("anschrift_strasse")} className="wizard-field__input" />
        </div>
        <div className="wizard-field">
          <label className="wizard-field__label">Hausnummer</label>
          <input type="text" {...register("anschrift_hausnummer")} className="wizard-field__input" />
        </div>
      </div>

      <div className="wizard-row wizard-row--plz">
        <div className="wizard-field">
          <label className="wizard-field__label">PLZ</label>
          <input type="text" {...register("anschrift_plz")} className="wizard-field__input" placeholder="12345" />
          {errors.anschrift_plz && <p className="wizard-field__error">{errors.anschrift_plz.message}</p>}
        </div>
        <div className="wizard-field">
          <label className="wizard-field__label">Ort</label>
          <input type="text" {...register("anschrift_ort")} className="wizard-field__input" />
        </div>
      </div>

      <div className="wizard-field">
        <label className="wizard-field__label">Land (ISO-Code)</label>
        <input
          type="text"
          {...register("anschrift_land")}
          className="wizard-field__input"
          placeholder="DE"
          maxLength={2}
        />
        {errors.anschrift_land && <p className="wizard-field__error">{errors.anschrift_land.message}</p>}
      </div>
    </div>
  );
}
