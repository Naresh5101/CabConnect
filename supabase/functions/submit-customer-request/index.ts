import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const allowedTypes = new Set(["cab_booking", "tour_quote", "temple_tour", "cab_attachment"]);
const validMobile = (value: unknown) => typeof value === "string" && /^[6-9]\d{9}$/.test(value);
const validText = (value: unknown, max: number, required = false) => typeof value === "string" && value.length <= max && (!required || value.trim().length > 0);
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isIntegerBetween = (value: unknown, min: number, max: number) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateRequest(type: string, data: Record<string, unknown>) {
  if (type === "cab_booking") {
    const validService = ["daily", "oneway", "roundtrip", "rentals", "airport"].includes(String(data.service));
    return validService && validText(data.pickup, 300, true) && (data.service === "rentals" || validText(data.destination, 300, true))
      && validText(data.travelDate, 10, true) && validText(data.pickupTime, 10, true)
      && isIntegerBetween(data.passengers, 1, 12) && validText(data.vehicleId, 40, true) && validText(data.vehicleLabel, 100, true)
      && validText(data.notes, 2000);
  }
  if (type === "tour_quote") {
    return validText(data.packageId, 100, true) && validText(data.destination, 150, true) && validText(data.pickup, 300, true)
      && validText(data.travelDate, 10, true) && isIntegerBetween(data.travellers, 1, 40) && isIntegerBetween(data.days, 1, 30)
      && validText(data.vehicle, 100, true) && validText(data.tripType, 60, true) && validText(data.notes, 1000);
  }
  if (type === "temple_tour") {
    return validText(data.start, 300, true) && validText(data.travelDate, 10, true) && isIntegerBetween(data.days, 1, 30)
      && isIntegerBetween(data.travellers, 1, 40) && validText(data.vehicle, 100, true) && Array.isArray(data.temples)
      && data.temples.length > 0 && data.temples.length <= 60 && data.temples.every((temple) => isObject(temple) && validText(temple.name, 180, true));
  }
  if (type === "cab_attachment") {
    if (!validText(data.ownerName, 120, true) || !validMobile(data.ownerMobile) || !validText(data.city, 100, true)
      || !validText(data.operatingArea, 160) || !Array.isArray(data.vehicles) || data.vehicles.length < 1 || data.vehicles.length > 10) return false;
    return data.vehicles.every((vehicle) => isObject(vehicle) && validText(vehicle.category, 100, true)
      && validText(vehicle.model, 100) && validText(vehicle.registration, 30, true) && validText(vehicle.commercial, 40, true)
      && ["yes", "no"].includes(String(vehicle.driverAssigned)) && validText(vehicle.driverName, 120)
      && validText(vehicle.driverMobile, 10) && validText(vehicle.licence, 40) && validText(vehicle.badge, 40)
      && validText(vehicle.experience, 3) && ["rc", "insurance", "permit", "fitness", "puc"].every((field) => validText(vehicle[field], 300)));
  }
  return false;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  try {
    if (Number(request.headers.get("content-length") || 0) > 32000) throw new Error("Request is too large.");
    const body = await request.json();
    if (!isObject(body) || !allowedTypes.has(String(body.request_type)) || !uuidPattern.test(String(body.submission_id))
      || !validText(body.customer_name, 120, true) || !validMobile(body.mobile) || body.contact_consent !== true
      || !isObject(body.request_data) || JSON.stringify(body.request_data).length > 30000
      || !validateRequest(String(body.request_type), body.request_data)) {
      return Response.json({ error: "Some request details are invalid. Review the form and try again." }, { status: 400, headers: corsHeaders });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const hashSecret = Deno.env.get("RATE_LIMIT_HASH_SECRET");
    if (!supabaseUrl || !serviceKey || !hashSecret) throw new Error("The request service is not configured.");
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${hashSecret}:${ip}`));
    const ipHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { data: allowed, error: rateError } = await supabase.rpc("consume_driver_application_rate_limit", { p_ip_hash: ipHash });
    if (rateError) throw rateError;
    if (!allowed) return Response.json({ error: "Too many requests from this connection. Please try again later." }, { status: 429, headers: corsHeaders });

    const row = {
      submission_id: body.submission_id,
      request_type: body.request_type,
      customer_name: body.customer_name.trim(),
      mobile: body.mobile,
      request_data: body.request_data,
      contact_consent: true,
    };
    const { data, error } = await supabase.from("customer_requests").insert(row).select("request_id").single();
    if (error?.code === "23505") {
      const { data: existing, error: existingError } = await supabase.from("customer_requests").select("request_id").eq("submission_id", row.submission_id).single();
      if (!existingError && existing) return Response.json({ request_id: existing.request_id }, { status: 200, headers: corsHeaders });
    }
    if (error) throw error;
    return Response.json({ request_id: data.request_id }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Customer request submission failed", error);
    return Response.json({ error: "We could not save your request right now. Please try again shortly." }, { status: 500, headers: corsHeaders });
  }
});
