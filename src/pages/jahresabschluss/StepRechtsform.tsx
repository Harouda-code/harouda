/**
 * Wizard Step 2 — Rechtsform + Stammdaten.
 *
 * React-hook-form-basiert. Conditional Rendering je nach Rechtsform.
 */
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { updateClient } from "../../api/clients";
import {
  markStepCompleted,
  updateStep,
} from "../../domain/jahresabschluss/wizardStore";
import type { WizardRechtsformData } from "../../domain/jahresabschluss/WizardTypes";
import type { Rechtsform } from "../../domain/ebilanz/hgbTaxonomie68";
import type { StepProps } from "./stepTypes";

const RECHTSFORMEN: readonly Rechtsform[] = [
  "Einzelunternehmen",
  "GbR",
  "PartG",
  "OHG",
  "KG",
  "GmbH",
  "AG",
  "UG",
  "SE",
  "SonstigerRechtsform",
];

const KAPITAL = new Set<Rechtsform>(["GmbH", "AG", "UG", "SE"]);
const PERSON = new Set<Rechtsform>(["GbR", "PartG", "OHG", "KG"]);

function isKapital(rf: Rechtsform | undefined): boolean {
  return rf ? KAPITAL.has(rf) : false;
}

function isPerson(rf: Rechtsform | undefined): boolean {
  return rf ? PERSON.has(rf) : false;
}

const HRB_REGEX = /^HR[AB]\s*\d{1,10}$/i;

type FormValues = {
  rechtsform: Rechtsform | "";
  hrb_nummer: string;
  hrb_gericht: string;
  gezeichnetes_kapital: number | "";
  geschaeftsfuehrer: Array<{
    name: string;
    funktion: "geschaeftsfuehrer" | "vorstand" | "prokurist";
    bestellt_am: string;
  }>;
};

export function StepRechtsform({
  state,
  mandantId,
  jahr,
  onAdvance,
}: StepProps) {
  const existing = state.data.rechtsform;
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      rechtsform: existing?.rechtsform ?? "",
      hrb_nummer: existing?.hrb_nummer ?? "",
      hrb_gericht: existing?.hrb_gericht ?? "",
      gezeichnetes_kapital: existing?.gezeichnetes_kapital ?? "",
      geschaeftsfuehrer:
        existing?.geschaeftsfuehrer?.map((g) => ({
          name: g.name,
          funktion: g.funktion,
          bestellt_am: g.bestellt_am ?? "",
        })) ?? [],
    },
  });
  const rf = watch("rechtsform") as Rechtsform | "";

  const { fields, append, remove } = useFieldArray({
    control,
    name: "geschaeftsfuehrer",
  });

  // Bei Wechsel auf Kapitalgesellschaft + leerem Array: eine Zeile anlegen.
  useEffect(() => {
    if (isKapital(rf || undefined) && fields.length === 0) {
      append({ name: "", funktion: "geschaeftsfuehrer", bestellt_am: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rf]);

  async function onSubmit(values: FormValues) {
    if (!values.rechtsform) {
      toast.error("Rechtsform ist Pflicht.");
      return;
    }
    const data: WizardRechtsformData = {
      rechtsform: values.rechtsform,
      ...(values.hrb_nummer ? { hrb_nummer: values.hrb_nummer } : {}),
      ...(values.hrb_gericht ? { hrb_gericht: values.hrb_gericht } : {}),
      ...(typeof values.gezeichnetes_kapital === "number"
        ? { gezeichnetes_kapital: values.gezeichnetes_kapital }
        : {}),
      ...(values.geschaeftsfuehrer.length > 0
        ? {
            geschaeftsfuehrer: values.geschaeftsfuehrer
              .filter((g) => g.name.trim())
              .map((g) => ({
                name: g.name.trim(),
                funktion: g.funktion,
                ...(g.bestellt_am ? { bestellt_am: g.bestellt_am } : {}),
              })),
          }
        : {}),
    };
    try {
      await updateClient(mandantId, {
        rechtsform: data.rechtsform,
        hrb_nummer: data.hrb_nummer ?? null,
        hrb_gericht: data.hrb_gericht ?? null,
        gezeichnetes_kapital: data.gezeichnetes_kapital ?? null,
        geschaeftsfuehrer: data.geschaeftsfuehrer ?? null,
      });
    } catch (err) {
      toast.error(
        `Mandant-Stammdaten konnten nicht gespeichert werden: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return;
    }
    updateStep(mandantId, jahr, { data: { rechtsform: data } });
    markStepCompleted(mandantId, jahr, "rechtsform");
    toast.success("Stammdaten gespeichert.");
    onAdvance("groessenklasse");
  }

  return (
    <section data-testid="step-rechtsform">
      <h2>Schritt 2 — Rechtsform + Stammdaten</h2>
      <form onSubmit={handleSubmit(onSubmit)} data-testid="form-rechtsform">
        <label style={{ display: "block", marginBottom: 12 }}>
          <span>Rechtsform *</span>
          <select
            {...register("rechtsform", { required: true })}
            data-testid="input-rechtsform"
          >
            <option value="">— bitte wählen —</option>
            {RECHTSFORMEN.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {errors.rechtsform && (
            <span style={{ color: "var(--danger, #a33)" }}>Pflicht.</span>
          )}
        </label>

        {isKapital(rf || undefined) && (
          <div data-testid="kapital-fields">
            <label style={{ display: "block", marginBottom: 8 }}>
              <span>HRB-Nummer * (Format: „HRB 12345")</span>
              <input
                type="text"
                {...register("hrb_nummer", {
                  required: "Pflicht für Kapitalgesellschaften",
                  pattern: {
                    value: HRB_REGEX,
                    message: "Format: HRA/HRB + Ziffern",
                  },
                })}
                data-testid="input-hrb-nummer"
              />
              {errors.hrb_nummer && (
                <span style={{ color: "var(--danger, #a33)" }}>
                  {errors.hrb_nummer.message}
                </span>
              )}
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              <span>Amtsgericht *</span>
              <input
                type="text"
                {...register("hrb_gericht", { required: true })}
                data-testid="input-hrb-gericht"
              />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              <span>Gezeichnetes Kapital (€) *</span>
              <input
                type="number"
                step="0.01"
                {...register("gezeichnetes_kapital", {
                  required: true,
                  valueAsNumber: true,
                  validate: (v) =>
                    (typeof v === "number" && v > 0) ||
                    "Muss > 0 sein",
                })}
                data-testid="input-kapital"
              />
              {errors.gezeichnetes_kapital && (
                <span style={{ color: "var(--danger, #a33)" }}>
                  {errors.gezeichnetes_kapital.message}
                </span>
              )}
            </label>
            <fieldset style={{ border: "1px solid var(--border)", padding: 8 }}>
              <legend>Organe (Geschäftsführer/Vorstand/Prokuristen)</legend>
              {fields.map((f, i) => (
                <div
                  key={f.id}
                  style={{ display: "flex", gap: 6, marginBottom: 4 }}
                  data-testid={`gf-row-${i}`}
                >
                  <input
                    type="text"
                    placeholder="Name"
                    {...register(`geschaeftsfuehrer.${i}.name` as const, {
                      required: true,
                    })}
                    data-testid={`gf-name-${i}`}
                  />
                  <select
                    {...register(`geschaeftsfuehrer.${i}.funktion` as const)}
                    data-testid={`gf-funktion-${i}`}
                  >
                    <option value="geschaeftsfuehrer">Geschäftsführer</option>
                    <option value="vorstand">Vorstand</option>
                    <option value="prokurist">Prokurist</option>
                  </select>
                  <input
                    type="date"
                    {...register(
                      `geschaeftsfuehrer.${i}.bestellt_am` as const
                    )}
                    data-testid={`gf-bestellt-${i}`}
                  />
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      data-testid={`gf-remove-${i}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  append({
                    name: "",
                    funktion: "geschaeftsfuehrer",
                    bestellt_am: "",
                  })
                }
                data-testid="gf-add"
              >
                + Organ hinzufügen
              </button>
            </fieldset>
          </div>
        )}

        {isPerson(rf || undefined) && (
          <div data-testid="person-fields">
            <label style={{ display: "block", marginBottom: 8 }}>
              <span>HRA-Nummer (optional)</span>
              <input
                type="text"
                {...register("hrb_nummer", {
                  pattern: {
                    value: HRB_REGEX,
                    message: "Format: HRA/HRB + Ziffern",
                  },
                })}
                data-testid="input-hrb-nummer"
              />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              <span>Amtsgericht (optional)</span>
              <input
                type="text"
                {...register("hrb_gericht")}
                data-testid="input-hrb-gericht"
              />
            </label>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            data-testid="btn-save-rechtsform"
          >
            {isSubmitting ? "Speichere …" : "Speichern + Weiter →"}
          </button>
        </div>
      </form>
    </section>
  );
}
