export const ADMIN_REQUEST_SECTIONS = {
  cab_booking: "cab-bookings",
  tour_quote: "enquiries",
  temple_tour: "temple-tours",
  cab_attachment: "attachments",
};

export const asRequestObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
export const pickRequestValue = (object, ...keys) => keys.map((key) => object[key]).find((value) => value !== undefined && value !== null && value !== "");

export function normalizeRequestData(value) {
  const raw = asRequestObject(value);
  return { ...raw, ...asRequestObject(pickRequestValue(raw, "formData", "form_data", "details")) };
}

export function getRequestVehicles(data) {
  const candidate = pickRequestValue(data, "vehicles", "cabs", "fleetVehicles", "fleet_vehicles", "vehicleDetails", "vehicle_details");
  if (Array.isArray(candidate)) return candidate.map((vehicle) => typeof vehicle === "string" ? { category: vehicle } : asRequestObject(vehicle));
  if (candidate && typeof candidate === "object") return [asRequestObject(candidate)];
  const vehicle = asRequestObject(pickRequestValue(data, "vehicle"));
  if (Object.keys(vehicle).length) return [vehicle];
  const vehicleName = pickRequestValue(data, "vehicle");
  return typeof vehicleName === "string" && vehicleName ? [{ category: vehicleName }] : [];
}

export function flattenRequestDetails(value, excludedKeys = new Set(), prefix = "", depth = 0) {
  if (depth > 2) return [];
  const excluded = new Set([...excludedKeys].map((key) => key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replaceAll("-", "_").toLowerCase()));
  return Object.entries(asRequestObject(value)).flatMap(([key, entry]) => {
    const normalized = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replaceAll("-", "_").toLowerCase();
    if (excluded.has(normalized) || entry === undefined || entry === null || entry === "") return [];
    const keyLabel = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    const label = prefix ? `${prefix} · ${keyLabel}` : keyLabel;
    if (Array.isArray(entry) && entry.some((item) => item && typeof item === "object")) {
      return entry.flatMap((item, index) => flattenRequestDetails(item, excluded, `${label} ${index + 1}`, depth + 1));
    }
    if (entry && typeof entry === "object") return flattenRequestDetails(entry, excluded, label, depth + 1);
    return [[label, entry]];
  });
}

export function getAttachmentSummary(requestData) {
  const data = normalizeRequestData(requestData);
  const vehicles = getRequestVehicles(data);
  const vehicleNames = vehicles.map((vehicle) => [
    pickRequestValue(vehicle, "model") && pickRequestValue(vehicle, "category") === "Other"
      ? pickRequestValue(vehicle, "model")
      : pickRequestValue(vehicle, "category", "type", "model", "vehicleModel", "vehicle_model"),
    pickRequestValue(vehicle, "registration", "registrationNumber", "registration_number", "vehicleNumber", "vehicle_number"),
  ].filter(Boolean).join(" · ")).filter(Boolean);
  return {
    vehicles: vehicleNames.length ? vehicleNames.join(", ") : `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"}`,
    location: [pickRequestValue(data, "city", "ownerCity", "owner_city"), pickRequestValue(data, "operatingArea", "operating_area", "cityArea", "city_area")].filter(Boolean).join(" · ") || "Location not recorded",
  };
}

export function countAttachmentVehicles(requestData) {
  return getRequestVehicles(normalizeRequestData(requestData)).length;
}
