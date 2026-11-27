import { requireSupabase } from "../lib/supabase";

export type SitePageSettings = {
  booking_enabled: boolean;
  temple_tours_enabled: boolean;
  tour_packages_enabled: boolean;
  driver_registration_enabled: boolean;
  cab_attachment_enabled: boolean;
};

export async function fetchPageSettings(): Promise<SitePageSettings> {
  const { data, error } = await requireSupabase()
    .from("site_settings")
    .select("booking_enabled, temple_tours_enabled, tour_packages_enabled, driver_registration_enabled, cab_attachment_enabled")
    .eq("id", "default")
    .single();
  if (error) throw new Error(error.message || "Could not load website booking settings.");
  const keys: (keyof SitePageSettings)[] = [
    "booking_enabled",
    "temple_tours_enabled",
    "tour_packages_enabled",
    "driver_registration_enabled",
    "cab_attachment_enabled",
  ];
  if (keys.some((key) => typeof data[key] !== "boolean")) {
    throw new Error("A website page setting is invalid.");
  }
  return data as SitePageSettings;
}

export async function savePageSetting(
  key: keyof SitePageSettings,
  enabled: boolean,
): Promise<boolean> {
  const supabase = requireSupabase();

  if (key === "booking_enabled") {
    const { data, error } = await supabase.from("site_settings").update({ booking_enabled: enabled }).eq("id", "default").select("booking_enabled").single();
    if (error) throw new Error(error.message || "Could not save the website page setting.");
    if (typeof data?.booking_enabled !== "boolean") throw new Error("The website page setting was not confirmed by the database.");
    return data.booking_enabled;
  }
  if (key === "temple_tours_enabled") {
    const { data, error } = await supabase.from("site_settings").update({ temple_tours_enabled: enabled }).eq("id", "default").select("temple_tours_enabled").single();
    if (error) throw new Error(error.message || "Could not save the website page setting.");
    if (typeof data?.temple_tours_enabled !== "boolean") throw new Error("The website page setting was not confirmed by the database.");
    return data.temple_tours_enabled;
  }
  if (key === "tour_packages_enabled") {
    const { data, error } = await supabase.from("site_settings").update({ tour_packages_enabled: enabled }).eq("id", "default").select("tour_packages_enabled").single();
    if (error) throw new Error(error.message || "Could not save the website page setting.");
    if (typeof data?.tour_packages_enabled !== "boolean") throw new Error("The website page setting was not confirmed by the database.");
    return data.tour_packages_enabled;
  }
  if (key === "driver_registration_enabled") {
    const { data, error } = await supabase.from("site_settings").update({ driver_registration_enabled: enabled }).eq("id", "default").select("driver_registration_enabled").single();
    if (error) throw new Error(error.message || "Could not save the website page setting.");
    if (typeof data?.driver_registration_enabled !== "boolean") throw new Error("The website page setting was not confirmed by the database.");
    return data.driver_registration_enabled;
  }

  const { data, error } = await supabase.from("site_settings").update({ cab_attachment_enabled: enabled }).eq("id", "default").select("cab_attachment_enabled").single();
  if (error) throw new Error(error.message || "Could not save the website page setting.");
  if (typeof data?.cab_attachment_enabled !== "boolean") throw new Error("The website page setting was not confirmed by the database.");
  return data.cab_attachment_enabled;
}
