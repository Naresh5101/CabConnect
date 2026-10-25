import { requireSupabase } from "../lib/supabase";
import type { DriverApplicationRow } from "../types/database";

export async function submitDriverApplication(payload: Omit<DriverApplicationRow, "application_id" | "status" | "admin_notes" | "created_at" | "updated_at">, website: string): Promise<{ applicationId: string; createdAt: string }> {
  const { data, error } = await requireSupabase().functions.invoke<{ application_id?: string; created_at?: string; error?: string }>("submit-driver-application", {
    body: { ...payload, website },
  });
  if (error) {
    const response = error.context;
    if (typeof Response !== "undefined" && response instanceof Response) {
      const body = await response.clone().json().catch(() => ({})) as { error?: string };
      throw Object.assign(new Error(body.error || error.message), { status: response.status, name: error.name });
    }
    throw Object.assign(new Error(error.message || "Could not save your application."), { name: error.name });
  }
  if (!data?.application_id || !data.created_at) throw new Error("We could not confirm that your application was saved. Please try again.");
  return { applicationId: data.application_id, createdAt: data.created_at };
}
