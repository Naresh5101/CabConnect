import { createSubmissionId, requireSupabase } from "./supabase.js";

export function normalizeRequestMobile(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

export async function submitCustomerRequest({ type, name, mobile, data, consent = true, submissionId }) {
  const client = requireSupabase();
  const { data: result, error } = await client.functions.invoke("submit-customer-request", {
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
    if (response && typeof response.json === "function") {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || error.message || "We could not save this request. Please try again.");
    }
    throw new Error(error.message || "We could not save this request. Please try again.");
  }
  if (!result?.request_id) throw new Error("The database did not confirm that your request was saved. Please try again.");
  return result.request_id;
}
