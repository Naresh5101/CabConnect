import type { User } from "@supabase/supabase-js";
import { requireSupabase } from "../lib/supabase";

export function isDriverAdmin(user: User | null | undefined): user is User {
  return user?.app_metadata?.role === "driver_admin";
}

export async function getAdminSessionUser(): Promise<User | null> {
  const { data, error } = await requireSupabase().auth.getSession();
  if (error) throw error;
  return isDriverAdmin(data.session?.user) ? data.session.user : null;
}

export async function signInAdmin(email: string, password: string): Promise<User> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  if (!isDriverAdmin(data.user)) {
    await client.auth.signOut();
    throw new Error("This account is not authorised to manage CabConnect. Ask a project owner to assign the driver_admin role in trusted Supabase Auth app metadata.");
  }
  return data.user;
}

export async function signOutAdmin(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}

export function subscribeToAdminAuth(callback: (user: User | null) => void): () => void {
  const { data } = requireSupabase().auth.onAuthStateChange((_event, session) => {
    callback(isDriverAdmin(session?.user) ? session.user : null);
  });
  return () => data.subscription.unsubscribe();
}
