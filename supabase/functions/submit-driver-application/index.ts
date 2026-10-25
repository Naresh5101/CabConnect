import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const workTypes = new Set(["Full-time", "Part-time", "Weekend"]);
const licenceStatuses = new Set(["Valid", "Renewal in progress", "No"]);
const badgeStatuses = new Set(["Yes", "No", "Not applicable"]);
const text = (value: unknown, max: number) => typeof value === "string" && value.length <= max;
const phone = (value: unknown) => typeof value === "string" && /^[6-9]\d{9}$/.test(value);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  if (Number(request.headers.get("content-length") || 0) > 20000) {
    return Response.json({ error: "Application is too large." }, { status: 413, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "Application details must be sent as an object." }, { status: 400, headers: corsHeaders });
    }
    if (body.website) return Response.json({ error: "Unable to submit this application." }, { status: 400, headers: corsHeaders });
    const valid = text(body.full_name, 100) && body.full_name.trim().length > 0
      && phone(body.mobile) && phone(body.whatsapp)
      && text(body.city_area, 120) && body.city_area.trim().length > 0
      && Number.isInteger(body.experience_years) && body.experience_years >= 0 && body.experience_years <= 60
      && licenceStatuses.has(body.licence_status) && badgeStatuses.has(body.badge_status)
      && ["Yes", "No"].includes(body.police_verification_certificate)
      && workTypes.has(body.preferred_work_type) && text(body.preferred_shift, 120) && body.preferred_shift.trim().length > 0
      && text(body.languages, 120) && text(body.previous_experience, 1000)
      && (body.expected_monthly_salary === null || (Number.isInteger(body.expected_monthly_salary) && body.expected_monthly_salary >= 1 && body.expected_monthly_salary <= 1000000))
      && text(body.additional_information, 1000) && body.contact_consent === true;
    if (!valid) return Response.json({ error: "Some application details are invalid. Please review the form and try again." }, { status: 400, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const hashSecret = Deno.env.get("RATE_LIMIT_HASH_SECRET");
    if (!supabaseUrl || !serviceKey || !hashSecret) throw new Error("Server is not configured for applications.");
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${hashSecret}:${ip}`));
    const ipHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { data: allowed, error: rateError } = await supabase.rpc("consume_driver_application_rate_limit", { p_ip_hash: ipHash });
    if (rateError) throw rateError;
    if (!allowed) return Response.json({ error: "Too many applications from this connection. Please try again later or contact CabConnect." }, { status: 429, headers: corsHeaders });

    const { website: _website, ...application } = body;
    const { data, error } = await supabase.from("driver_applications").insert(application).select("application_id, created_at").single();
    if (error?.code === "23505") return Response.json({ error: "An application with this mobile number has already been received. Please contact CabConnect if you need to update it." }, { status: 409, headers: corsHeaders });
    if (error) throw error;
    return Response.json({ application_id: data.application_id, created_at: data.created_at }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Driver application submission failed", error);
    return Response.json({ error: "We could not save your application right now. Please try again in a few minutes." }, { status: 500, headers: corsHeaders });
  }
});
