import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { MandantAnlageData } from "../../domain/clients/mandantAnlageSchema";

export function Step4BuchhaltungLohn() {
  const { register, control, formState: { errors } } = useFormContext<MandantAnlageData>();
  const wjTyp = useWatch({ control, name: "wirtschaftsjahr_typ" });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Buchhaltung & Lohn</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kontenrahmen</label>
          <select {...register("kontenrahmen")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="SKR03">SKR 03</option>
            <option value="SKR04">SKR 04</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Nach erstem Journal-Eintrag nicht mehr änderbar.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sachkontenlänge</label>
          <select {...register("sachkontenlaenge", { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={4}>4 Stellen</option>
            <option value={5}>5 Stellen</option>
            <option value={6}>6 Stellen</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Gewinnermittlungsart</label>
        <select {...register("gewinnermittlungsart")}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">-- auswählen --</option>
          <option value="bilanz">Bilanzierung (§ 4 Abs. 1 EStG)</option>
          <option value="euer">Einnahmenüberschussrechnung (§ 4 Abs. 3 EStG)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Wirtschaftsjahr</label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2">
            <input type="radio" value="kalenderjahr" {...register("wirtschaftsjahr_typ")} className="w-4 h-4" />
            <span className="text-sm">Kalenderjahr (01.01.–31.12.)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="abweichend" {...register("wirtschaftsjahr_typ")} className="w-4 h-4" />
            <span className="text-sm">Abweichendes Wirtschaftsjahr</span>
          </label>
        </div>
      </div>

      {wjTyp === "abweichend" && (
        <div className="grid grid-cols-2 gap-4 pl-4">
          <div>
            <label className="block text-sm font-medium mb-1">Beginn (MM-TT)</label>
            <input type="text" {...register("wirtschaftsjahr_beginn")}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="07-01" />
            {errors.wirtschaftsjahr_beginn && <p className="text-red-500 text-sm mt-1">{errors.wirtschaftsjahr_beginn.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ende (MM-TT)</label>
            <input type="text" {...register("wirtschaftsjahr_ende")}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="06-30" />
            {errors.wirtschaftsjahr_ende && <p className="text-red-500 text-sm mt-1">{errors.wirtschaftsjahr_ende.message}</p>}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-lg font-semibold mb-3">Lohn-Stammdaten</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Betriebsnummer (BBNR)</label>
            <input type="text" {...register("betriebsnummer")}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="12345678" maxLength={8} />
            {errors.betriebsnummer && <p className="text-red-500 text-sm mt-1">{errors.betriebsnummer.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kirchensteuer-Erhebungsstelle</label>
            <input type="text" {...register("kirchensteuer_erhebungsstelle")}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Berufsgenossenschaft</label>
            <input type="text" {...register("berufsgenossenschaft_name")}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">BG-Mitgliedsnummer</label>
            <input type="text" {...register("berufsgenossenschaft_mitgliedsnr")}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
