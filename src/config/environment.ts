export const environment = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, ""),
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER,
  siteUrl: (import.meta.env.VITE_SITE_URL || "https://cabconnecttours.in").replace(/\/$/, ""),
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  isDevelopment: import.meta.env.DEV,
};
