const LOCAL_DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

export function isAllowedOrigin(origin, configuredOrigins = "") {
  if (!origin) return true;
  const allowedOrigins = new Set([
    ...LOCAL_DEVELOPMENT_ORIGINS,
    ...configuredOrigins.split(",").map((value) => value.trim()).filter(Boolean),
  ]);
  return allowedOrigins.has(origin);
}

export function corsHeadersForOrigin(origin, configuredOrigins = "") {
  const allowedOrigin = origin && isAllowedOrigin(origin, configuredOrigins) ? origin : null;
  return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}
