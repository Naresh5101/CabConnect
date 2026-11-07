import { requireSupabase } from "../lib/supabase";
import type { FarePricingRules } from "../types/database";

export async function fetchPublicFarePricingRules(): Promise<FarePricingRules> {
  const { data, error } = await requireSupabase().from("admin_pricing_rules").select("rules").eq("id", "default").single();
  if (error) throw new Error(error.message);
  return data.rules as FarePricingRules;
}

export async function fetchAdminFarePricingRecord(): Promise<{ rules: FarePricingRules; updated_at: string; updated_by: string | null }> {
  const { data, error } = await requireSupabase().from("admin_pricing_rules").select("rules,updated_at,updated_by").eq("id", "default").single();
  if (error) throw new Error(error.message);
  return data as { rules: FarePricingRules; updated_at: string; updated_by: string | null };
}

export async function saveAdminFarePricingRules(rules: FarePricingRules): Promise<{ rules: FarePricingRules; updated_at: string; updated_by: string | null }> {
  const { data, error } = await requireSupabase().from("admin_pricing_rules").update({ rules }).eq("id", "default").select("rules,updated_at,updated_by").single();
  if (error) throw new Error(error.message);
  return data as { rules: FarePricingRules; updated_at: string; updated_by: string | null };
}

export async function fetchQuoteAuditHistory(requestId: string): Promise<Array<{ audit_id: number; previous_amount: number | null; revised_amount: number | null; admin_user_id: string | null; created_at: string }>> {
  const { data, error } = await requireSupabase().from("customer_request_quote_audit").select("audit_id,previous_amount,revised_amount,admin_user_id,created_at").eq("request_id", requestId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
