import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { MandantAnlageData } from "../../domain/clients/mandantAnlageSchema";

export function Step4BuchhaltungLohn() {
  const { register, control, formState: { errors } } = useFormContext<MandantAnlageData>();
  const wjTyp = useWatch({ control, name: "wirtschaftsjahr_typ" });

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">Buchhaltung & Lohn</h2>

      <div className="wizard-row wizard-row--2">
        <div className="wizard-field">
          <label className="wizard-field__label">Kontenrahmen</label>
          <select {...register("kontenrahmen")} className="wizard-field__select">
            <option value="SKR03">SKR 03</option>
            <option value="SKR04">SKR 04</option>
          </select>
          <p className="wizard-field__hint">Nach erstem Journal-Eintrag nicht mehr änderbar.</p>
        </div>
        <div className="wizard-field">
          <label className="wizard-field__label">Sachkontenlänge</label>
          <select {...register("sachkontenlaenge", { valueAsNumber: true })} className="wizard-field__select">
            <option value={4}>4 Stellen</option>
            <option value={5}>5 Stellen</option>
            <option value={6}>6 Stellen</option>
          </select>
        </div>
      </div>

      <div className="wizard-field">
        <label className="wizard-field__label">Gewinnermittlungsart</label>
        <select {...register("gewinnermittlungsart")} className="wizard-field__select">
          <option value="">-- auswählen --</option>
          <option value="bilanz">Bilanzierung (§ 4 Abs. 1 EStG)</option>
          <option value="euer">Einnahmenüberschussrechnung (§ 4 Abs. 3 EStG)</option>
        </select>
      </div>

      <div className="wizard-field">
        <label className="wizard-field__label">Wirtschaftsjahr</label>
        <div className="wizard-radio-group">
          <label className="wizard-radio">
            <input type="radio" value="kalenderjahr" {...register("wirtschaftsjahr_typ")} />
            <span>Kalenderjahr (01.01.–31.12.)</span>
          </label>
          <label className="wizard-radio">
            <input type="radio" value="abweichend" {...register("wirtschaftsjahr_typ")} />
            <span>Abweichendes Wirtschaftsjahr</span>
          </label>
        </div>
      </div>

      {wjTyp === "abweichend" && (
        <div className="wizard-row wizard-row--2 wizard-indent">
          <div className="wizard-field">
            <label className="wizard-field__label">Beginn (MM-TT)</label>
            <input type="text" {...register("wirtschaftsjahr_beginn")} className="wizard-field__input" placeholder="07-01" />
            {errors.wirtschaftsjahr_beginn && <p className="wizard-field__error">{errors.wirtschaftsjahr_beginn.message}</p>}
          </div>
          <div className="wizard-field">
            <label className="wizard-field__label">Ende (MM-TT)</label>
            <input type="text" {...register("wirtschaftsjahr_ende")} className="wizard-field__input" placeholder="06-30" />
            {errors.wirtschaftsjahr_ende && <p className="wizard-field__error">{errors.wirtschaftsjahr_ende.message}</p>}
          </div>
        </div>
      )}

      <div className="wizard-section">
        <h3 className="wizard-step__section-title">Lohn-Stammdaten</h3>
        <div className="wizard-row wizard-row--2">
          <div className="wizard-field">
            <label className="wizard-field__label">Betriebsnummer (BBNR)</label>
            <input type="text" {...register("betriebsnummer")} className="wizard-field__input" placeholder="12345678" maxLength={8} />
            {errors.betriebsnummer && <p className="wizard-field__error">{errors.betriebsnummer.message}</p>}
          </div>
          <div className="wizard-field">
            <label className="wizard-field__label">Kirchensteuer-Erhebungsstelle</label>
            <input type="text" {...register("kirchensteuer_erhebungsstelle")} className="wizard-field__input" />
          </div>
        </div>
        <div className="wizard-row wizard-row--2" style={{ marginTop: "16px" }}>
          <div className="wizard-field">
            <label className="wizard-field__label">Berufsgenossenschaft</label>
            <input type="text" {...register("berufsgenossenschaft_name")} className="wizard-field__input" />
          </div>
          <div className="wizard-field">
            <label className="wizard-field__label">BG-Mitgliedsnummer</label>
            <input type="text" {...register("berufsgenossenschaft_mitgliedsnr")} className="wizard-field__input" />
          </div>
        </div>
      </div>
    </div>
  );
}
