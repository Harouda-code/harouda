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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Steuer & Bank</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Steuernummer</label>
          <input type="text" {...register("steuernummer")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="12/345/67890" />
          {errors.steuernummer && <p className="text-red-500 text-sm mt-1">{errors.steuernummer.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">USt-IdNr.</label>
          <input type="text" {...register("ust_id")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="DE123456789" />
          {errors.ust_id && <p className="text-red-500 text-sm mt-1">{errors.ust_id.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">IBAN</label>
        <input type="text" {...register("iban")}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="DE89 3704 0044 0532 0130 00" />
        {errors.iban && <p className="text-red-500 text-sm mt-1">{errors.iban.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Finanzamt</label>
          <input type="text" {...register("finanzamt_name")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">BUFA-Nr.</label>
          <input type="text" {...register("finanzamt_bufa_nr")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1234" maxLength={4} />
          {errors.finanzamt_bufa_nr && <p className="text-red-500 text-sm mt-1">{errors.finanzamt_bufa_nr.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Versteuerungsart</label>
          <select {...register("versteuerungsart")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- auswählen --</option>
            <option value="soll">Sollversteuerung (§ 16 UStG)</option>
            <option value="ist">Istversteuerung (§ 20 UStG)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">USt-Voranmeldung</label>
          <select {...register("ust_voranmeldung_zeitraum")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- auswählen --</option>
            <option value="monatlich">Monatlich</option>
            <option value="vierteljaehrlich">Vierteljährlich</option>
            <option value="jaehrlich">Jährlich</option>
            <option value="befreit">Befreit</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Kann vom Finanzamt abweichend festgesetzt werden (§ 18 Abs. 2 UStG).
          </p>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("kleinunternehmer_regelung")}
            className="w-4 h-4" />
          <span className="text-sm font-medium">Kleinunternehmerregelung (§ 19 UStG)</span>
        </label>
      </div>

      {showHR && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-3">Handelsregister</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">HRB-Nummer</label>
              <input type="text" {...register("hrb_nummer")}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registergericht</label>
              <input type="text" {...register("hrb_gericht")}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Amtsgericht München" />
            </div>
          </div>
          {showKapital && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Gezeichnetes Kapital (EUR)</label>
              <input type="number" step="0.01" min="0" {...register("gezeichnetes_kapital", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.gezeichnetes_kapital && <p className="text-red-500 text-sm mt-1">{errors.gezeichnetes_kapital.message}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
