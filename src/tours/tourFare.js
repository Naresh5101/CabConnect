import { calculateOutstationFare, OUTSTATION_TARIFF } from "../utils/fareRules.js";
import { getDrivingRouteDistanceKm } from "../utils/googleMaps.js";

export async function getTourRoadDistance(start, destination, returnTrip, fetchImpl = fetch, googleMapsApiKey = "") {
  if (!start || !destination) throw new Error("Select a pickup and a valid tour destination to estimate the price.");
  const points = returnTrip ? [start, destination, start] : [start, destination];
  return getDrivingRouteDistanceKm(points, googleMapsApiKey, fetchImpl);
}

export function calculateTourEstimate(distanceKm, vehicle, days, returnTrip, tariff = OUTSTATION_TARIFF) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) throw new Error("A valid driving distance is required for a fare estimate.");
  const estimate = calculateOutstationFare(distanceKm, vehicle, days, returnTrip, tariff);
  return {
    roadDistanceKm: distanceKm,
    billedDistanceKm: estimate.billedDistanceKm,
    minimumBillableKm: estimate.minimumBillableKm,
    distanceCharge: estimate.distanceCharge,
    driverAllowance: estimate.driverAllowance,
    tripDays: estimate.tripDays,
    total: estimate.total,
    note: returnTrip
      ? `Estimate uses ₹${estimate.perKm}/km and a ${tariff.roundTripMinimumKmPerDay} km/day minimum, plus driver allowance. Local sightseeing distance, tolls, parking, interstate charges, waiting, taxes and other partner fees are excluded.`
      : `One-way estimate uses ₹${estimate.perKm}/km with a ${tariff.oneWayMinimumKm} km minimum, plus driver allowance. Tolls, parking, interstate charges, waiting, taxes and other partner fees are excluded.`,
  };
}
