const INDIA_BOUNDS = { south: 6, north: 37.7, west: 68, east: 97.5 };
const QUERY_NOISE = new Set(["india", "in", "near", "me", "tamil", "nadu"]);

export function isIndianCoordinate(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= INDIA_BOUNDS.south && lat <= INDIA_BOUNDS.north
    && lon >= INDIA_BOUNDS.west && lon <= INDIA_BOUNDS.east;
}

function normalize(value) {
  return String(value || "").normalize("NFKD").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function rankIndianPlaceFeatures(features, query, stateOnly = "") {
  const tokens = normalize(query).split(/\s+/).filter((token) => token.length > 1 && !QUERY_NOISE.has(token));
  return (features || []).flatMap((feature) => {
    const [lon, lat] = feature.geometry?.coordinates || [];
    const properties = feature.properties || {};
    const state = normalize(properties.state);
    if (!isIndianCoordinate(lat, lon) || normalize(properties.country) !== "india") return [];
    if (stateOnly && state !== normalize(stateOnly)) return [];

    const searchable = normalize([
      properties.name, properties.street, properties.housenumber, properties.locality,
      properties.city, properties.district, properties.county, properties.state,
      properties.postcode,
    ].filter(Boolean).join(" "));
    // Don't surface a nearby but unrelated place just because the provider returned it.
    if (tokens.some((token) => !searchable.includes(token))) return [];
    const name = normalize(properties.name || properties.street || properties.locality || properties.city);
    const score = tokens.reduce((total, token) => total
      + (name.startsWith(token) ? 4 : name.includes(token) ? 3 : searchable.includes(token) ? 1 : 0), 0);
    return [{ feature, score }];
  }).sort((a, b) => b.score - a.score).map(({ feature }) => feature);
}

export function photonSearchParams(query, { searchContext = "", limit = 10 } = {}) {
  const params = new URLSearchParams({
    q: /\bindia\b/i.test(query) ? query : `${query}, India`,
    limit: String(limit),
    lang: "en",
  });
  // Only bias toward Chennai when the user explicitly asked for a Chennai-area result.
  if (/chennai/i.test(searchContext) || /chennai/i.test(query)) {
    params.set("lat", "13.0827");
    params.set("lon", "80.2707");
  }
  return params;
}
