import { requireSupabase } from "../lib/supabase";

export type SitePageSettings = {
  booking_enabled: boolean;
  temple_tours_enabled: boolean;
  tour_packages_enabled: boolean;
  driver_registration_enabled: boolean;
  cab_attachment_enabled: boolean;
};

export async function fetchUnpublishedTempleIds(): Promise<string[]> {
  const { data, error } = await requireSupabase().from("site_settings")
    .select("unpublished_temple_ids").eq("id", "default").single();
  if (error) throw new Error(error.message || "Could not load temple publishing status.");
  const ids = (data as { unpublished_temple_ids?: unknown } | null)?.unpublished_temple_ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new Error("Temple publishing status is invalid.");
  return ids;
}

export async function saveUnpublishedTempleIds(ids: string[]): Promise<string[]> {
  const uniqueIds = [...new Set(ids)];
  const { data, error } = await requireSupabase().from("site_settings")
    .update({ unpublished_temple_ids: uniqueIds } as never).eq("id", "default")
    .select("unpublished_temple_ids").single();
  if (error) throw new Error(error.message || "Could not update temple publishing status.");
  const saved = (data as { unpublished_temple_ids?: unknown } | null)?.unpublished_temple_ids;
  if (!Array.isArray(saved) || saved.some((id) => typeof id !== "string")) throw new Error("Temple publishing status was not confirmed.");
  return saved;
}
const PAGE_SETTING_KEYS: (keyof SitePageSettings)[] = [
  "booking_enabled", "temple_tours_enabled", "tour_packages_enabled", "driver_registration_enabled", "cab_attachment_enabled",
];

export type BookingCategoryKey = "daily" | "oneway" | "roundtrip" | "rentals" | "airport";
export type SiteBookingCategories = Record<BookingCategoryKey, boolean>;
const BOOKING_CATEGORY_COLUMNS: Record<BookingCategoryKey, string> = {
  daily: "booking_daily_enabled",
  oneway: "booking_oneway_enabled",
  roundtrip: "booking_roundtrip_enabled",
  rentals: "booking_rentals_enabled",
  airport: "booking_airport_enabled",
};

export async function fetchBookingCategories(): Promise<SiteBookingCategories> {
  const { data, error } = await requireSupabase().from("site_settings")
    .select("booking_daily_enabled, booking_oneway_enabled, booking_roundtrip_enabled, booking_rentals_enabled, booking_airport_enabled")
    .eq("id", "default").single();
  if (error) throw new Error(error.message || "Could not load cab booking categories.");
  const result: SiteBookingCategories = {
    daily: data.booking_daily_enabled,
    oneway: data.booking_oneway_enabled,
    roundtrip: data.booking_roundtrip_enabled,
    rentals: data.booking_rentals_enabled,
    airport: data.booking_airport_enabled,
  };
  if (Object.values(result).some((enabled) => typeof enabled !== "boolean")) throw new Error("A cab booking category setting is invalid.");
  return result;
}

export async function saveBookingCategory(key: BookingCategoryKey, enabled: boolean): Promise<boolean> {
  const supabase = requireSupabase();
  const column = BOOKING_CATEGORY_COLUMNS[key] as "booking_daily_enabled" | "booking_oneway_enabled" | "booking_roundtrip_enabled" | "booking_rentals_enabled" | "booking_airport_enabled";
  const { data, error } = key === "daily"
    ? await supabase.from("site_settings").update({ booking_daily_enabled: enabled }).eq("id", "default").select(column).single()
    : key === "oneway"
      ? await supabase.from("site_settings").update({ booking_oneway_enabled: enabled }).eq("id", "default").select(column).single()
      : key === "roundtrip"
        ? await supabase.from("site_settings").update({ booking_roundtrip_enabled: enabled }).eq("id", "default").select(column).single()
        : key === "rentals"
          ? await supabase.from("site_settings").update({ booking_rentals_enabled: enabled }).eq("id", "default").select(column).single()
          : await supabase.from("site_settings").update({ booking_airport_enabled: enabled }).eq("id", "default").select(column).single();
  if (error) throw new Error(error.message || "Could not save the cab booking category.");
  const saved = (data as Record<string, unknown> | null)?.[column];
  if (typeof saved !== "boolean") throw new Error("The cab booking category change was not confirmed by the database.");
  return saved;
}

export async function fetchPageSettings(): Promise<SitePageSettings> {
  const columns = PAGE_SETTING_KEYS.join(", ");
  const { data, error } = await requireSupabase()
    .from("site_settings")
    .select(columns)
    .eq("id", "default")
    .single();
  if (error) throw new Error(error.message || "Could not load website booking settings.");
  const values = data as unknown as Record<string, unknown>;
  if (PAGE_SETTING_KEYS.some((key) => typeof values[key] !== "boolean")) {
    throw new Error("A website page setting is invalid.");
  }
  return values as unknown as SitePageSettings;
}

export async function savePageSetting(
  key: keyof SitePageSettings,
  enabled: boolean,
): Promise<boolean> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("site_settings").update({ [key]: enabled } as never).eq("id", "default").select(key).single();
  if (error) throw new Error(error.message || "Could not save the website page setting.");
  const saved = (data as Record<string, unknown> | null)?.[key];
  if (typeof saved !== "boolean") throw new Error("The website page setting was not confirmed by the database.");
  return saved;
}
