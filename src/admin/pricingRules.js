export const PRICING_VEHICLE_IDS = ["dzire", "ertiga"];

const positive = (value) => value !== "" && Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 1_000_000;
const nonNegative = (value) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1_000_000;

export function validatePricingRules(rules) {
  if (!rules || typeof rules !== "object" || !rules.tariff || !rules.vehicles) return "Pricing rules are missing or invalid.";
  if (!positive(rules.tariff.oneWayMinimumKm) || !positive(rules.tariff.roundTripMinimumKmPerDay) || !positive(rules.tariff.localKmPerHour)) {
    return "Minimum trip distances and local kilometres per hour must be greater than zero.";
  }
  for (const vehicleId of PRICING_VEHICLE_IDS) {
    const vehicle = rules.vehicles[vehicleId];
    if (!vehicle) return `Pricing is missing for ${vehicleId}.`;
    for (const field of ["perKm", "shortTripPerKm", "outstationOneWayPerKm", "outstationRoundTripPerKm"]) {
      if (!positive(vehicle[field])) return `${vehicleId}: ${field} must be a valid positive amount.`;
    }
    for (const field of ["extraHourRate", "airportMinimum", "driverAllowancePerDay"]) {
      if (!nonNegative(vehicle[field])) return `${vehicleId}: ${field} must be a valid non-negative amount.`;
    }
    for (const hours of [4, 8, 12]) {
      if (!positive(vehicle.localPackages?.[hours])) return `${vehicleId}: ${hours}-hour package must be a valid positive amount.`;
    }
  }
  return "";
}

export function applyPricingRules(baseVehicles, rules) {
  if (validatePricingRules(rules)) return baseVehicles;
  return baseVehicles.map((vehicle) => {
    const rates = rules.vehicles[vehicle.id];
    return rates ? { ...vehicle, ...rates, localPackages: { ...rates.localPackages } } : vehicle;
  });
}

export function updatePricingRule(rules, path, value) {
  const next = structuredClone(rules);
  let target = next;
  for (const part of path.slice(0, -1)) target = target[part];
  target[path.at(-1)] = value;
  return next;
}
