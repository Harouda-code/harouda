import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { MandantAnlageData } from "../../domain/clients/mandantAnlageSchema";
import {
  braucht_handelsregister,
  ist_kapitalgesellschaft,
} from "../../domain/clients/mandantAnlageSchema";

export function Step3SteuerBank() {
  const { register, control, formState: { errors } } = useFormContext<MandantAnlageData>();
  const rechtsform = useWatch({ control, name: "rechtsform" });

  const showHR = braucht_handelsregister(rechtsform);
  const showKapital = ist_kapitalgesellschaft(rechtsform);

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">Steuer & Bank</h2>

      <div className="wizard-row wizard-row--2">
        <div className="wizard-field">
          <label className="wizard-field__label">Steuernummer</label>
          <input type="text" {...register("steuernummer")} className="wizard-field__input" placeholder="12/345/67890" />
          {errors.steuernummer && <p className="wizard-field__error">{errors.steuernummer.message}</p>}
        </div>
        <div className="wizard-field">
          <label className="wizard-field__label">USt-IdNr.</label>
          <input type="text" {...register("ust_id")} className="wizard-field__input" placeholder="DE123456789" />
          {errors.ust_id && <p className="wizard-field__error">{errors.ust_id.message}</p>}
        </div>
      </div>

      <div className="wizard-field">
        <label className="wizard-field__label">IBAN</label>
        <input type="text" {...register("iban")} className="wizard-field__input" placeholder="DE89 3704 0044 0532 0130 00" />
        {errors.iban && <p className="wizard-field__error">{errors.iban.message}</p>}
      </div>

      <div className="wizard-row wizard-row--2">
        <div className="wizard-field">
          <label className="wizard-field__label">Finanzamt</label>
          <input type="text" {...register("finanzamt_name")} className="wizard-field__input" />
        </div>
        <div className="wizard-field">
          <label className="wizard-field__label">BUFA-Nr.</label>
          <input type="text" {...register("finanzamt_bufa_nr")} className="wizard-field__input" placeholder="1234" maxLength={4} />
          {errors.finanzamt_bufa_nr && <p className="wizard-field__error">{errors.finanzamt_bufa_nr.message}</p>}
        </div>
      </div>

      <div className="wizard-row wizard-row--2">
        <div className="wizard-field">
          <label className="wizard-field__label">Versteuerungsart</label>
          <select {...register("versteuerungsart")} className="wizard-field__select">
            <option value="">-- auswählen --</option>
            <option value="soll">Sollversteuerung (§ 16 UStG)</option>
            <option value="ist">Istversteuerung (§ 20 UStG)</option>
          </select>
        </div>
        <div className="wizard-field">
          <label className="wizard-field__label">USt-Voranmeldung</label>
          <select {...register("ust_voranmeldung_zeitraum")} className="wizard-field__select">
            <option value="">-- auswählen --</option>
            <option value="monatlich">Monatlich</option>
            <option value="vierteljaehrlich">Vierteljährlich</option>
            <option value="jaehrlich">Jährlich</option>
            <option value="befreit">Befreit</option>
          </select>
          <p className="wizard-field__hint">
            Kann vom Finanzamt abweichend festgesetzt werden (§ 18 Abs. 2 UStG).
          </p>
        </div>
      </div>

      <div className="wizard-field">
        <label className="wizard-checkbox">
          <input type="checkbox" {...register("kleinunternehmer_regelung")} />
          <span>Kleinunternehmerregelung (§ 19 UStG)</span>
        </label>
      </div>

      {showHR && (
        <div className="wizard-section">
          <h3 className="wizard-step__section-title">Handelsregister</h3>
          <div className="wizard-row wizard-row--2">
            <div className="wizard-field">
              <label className="wizard-field__label">HRB-Nummer</label>
              <input type="text" {...register("hrb_nummer")} className="wizard-field__input" />
            </div>
            <div className="wizard-field">
              <label className="wizard-field__label">Registergericht</label>
              <input type="text" {...register("hrb_gericht")} className="wizard-field__input" placeholder="Amtsgericht München" />
            </div>
          </div>
          {showKapital && (
            <div className="wizard-field" style={{ marginTop: "16px" }}>
              <label className="wizard-field__label">Gezeichnetes Kapital (EUR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("gezeichnetes_kapital", { valueAsNumber: true })}
                className="wizard-field__input"
              />
              {errors.gezeichnetes_kapital && (
                <p className="wizard-field__error">{errors.gezeichnetes_kapital.message}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
