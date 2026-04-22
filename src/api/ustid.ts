import { supabase } from "./supabase";
import type { UstIdStatus } from "../types/db";

type CheckResult = {
  status: UstIdStatus;
  message: string;
  errorCode: string;
  details?: Record<string, string>;
  checkedAt: string;
};

export type CheckInput = {
  ownUstId: string;
  partnerUstId: string;
  firmenname?: string;
  ort?: string;
  plz?: string;
  strasse?: string;
};

/**
 * Calls the deployed Supabase Edge Function to check a USt-IdNr. against
 * the BZSt evatr service. The Edge Function is required because BZSt does
 * not support CORS and returns ISO-8859-1.
 *
 * If the function is not deployed (404), we return a clear error instead
 * of pretending to validate.
 */
export async function checkUstId(input: CheckInput): Promise<CheckResult> {
  const { data, error } = await supabase.functions.invoke("validate-ustid", {
    body: input,
  });

  if (error) {
    // Common case: function not deployed in the Supabase project yet.
    const msg =
      error.message ||
      "Edge Function 'validate-ustid' ist nicht erreichbar.";
    if (
      msg.toLowerCase().includes("not found") ||
      msg.toLowerCase().includes("404")
    ) {
      throw new Error(
        "Die Edge Function 'validate-ustid' ist nicht deployt. " +
          "Siehe supabase/functions/validate-ustid/index.ts und den README-Hinweis."
      );
    }
    throw new Error(msg);
  }

  const result = data as CheckResult;
  if (!result || !result.status) {
    throw new Error("Unerwartete Antwort vom Validierungs-Service.");
  }
  return result;
}
