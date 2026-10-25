import { requireSupabase } from "../lib/supabase";
import type { Json } from "../types/database";

export interface PublishedTourPackage {
  slug: string;
  package_data: Json;
}

export async function fetchPublishedTourPackages(): Promise<PublishedTourPackage[]> {
  const { data, error } = await requireSupabase()
    .from("tour_packages")
    .select("slug,package_data")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}
