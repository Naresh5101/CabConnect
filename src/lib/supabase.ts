import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../config/environment";
import type { Database } from "../types/database";

const supabaseUrl = environment.supabaseUrl;
const supabaseKey = environment.supabaseAnonKey;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabase: SupabaseClient<Database> | null = supabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and restart Vite.");
  }
  return supabase;
}

export function createSubmissionId(): string {
  return globalThis.crypto.randomUUID();
}
