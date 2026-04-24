import React from "react";
import { useFormContext } from "react-hook-form";
import type { MandantAnlageData } from "../../domain/clients/mandantAnlageSchema";

export function Step2Anschrift() {
  const { register, formState: { errors } } = useFormContext<MandantAnlageData>();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Anschrift</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Straße</label>
          <input
            type="text"
            {...register("anschrift_strasse")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hausnummer</label>
          <input
            type="text"
            {...register("anschrift_hausnummer")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">PLZ</label>
          <input
            type="text"
            {...register("anschrift_plz")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="12345"
          />
          {errors.anschrift_plz && (
            <p className="text-red-500 text-sm mt-1">{errors.anschrift_plz.message}</p>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Ort</label>
          <input
            type="text"
            {...register("anschrift_ort")}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Land (ISO-Code)</label>
        <input
          type="text"
          {...register("anschrift_land")}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="DE"
          maxLength={2}
        />
        {errors.anschrift_land && (
          <p className="text-red-500 text-sm mt-1">{errors.anschrift_land.message}</p>
        )}
      </div>
    </div>
  );
}
