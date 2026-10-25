import { createSubmissionId, requireSupabase } from "../lib/supabase";
import type { CustomerRequestType, Json } from "../types/database";

export interface SubmitCustomerRequestInput {
  type: CustomerRequestType;
  name: string;
  mobile: string;
  data: Json;
  consent?: boolean;
  submissionId?: string;
}

export function normalizeRequestMobile(value: string): string {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

export async function submitCustomerRequest({ type, name, mobile, data, consent = true, submissionId }: SubmitCustomerRequestInput): Promise<string> {
  const { data: result, error } = await requireSupabase().functions.invoke<{ request_id?: string; error?: string }>("submit-customer-request", {
    body: {
      submission_id: submissionId || createSubmissionId(),
      request_type: type,
      customer_name: String(name || "").trim(),
      mobile: normalizeRequestMobile(mobile),
      request_data: data,
      contact_consent: consent,
    },
  });
  if (error) {
    const response = error.context;
    if (typeof Response !== "undefined" && response instanceof Response) {
      const body = await response.clone().json().catch(() => ({})) as { error?: string };
      throw new Error(body.error || error.message || "We could not save this request. Please try again.");
    }
    throw new Error(error.message || "We could not save this request. Please try again.");
  }
  if (!result?.request_id) throw new Error("The database did not confirm that your request was saved. Please try again.");
  return result.request_id;
}
