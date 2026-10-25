import { calculateOutstationFare } from "../utils/fareRules.js";

export async function getTourRoadDistance(start, destination, returnTrip, fetchImpl = fetch) {
  if (!start || !destination) throw new Error("Select a pickup and a valid tour destination to estimate the price.");
  const points = returnTrip ? [start, destination, start] : [start, destination];
  const joined = points.map(({ lon, lat }) => `${lon},${lat}`).join(";");
  const response = await fetchImpl(`https://router.project-osrm.org/route/v1/driving/${joined}?overview=false&steps=false`);
  if (!response.ok) throw new Error("The road-routing service is unavailable. You can still request a manual quotation.");
  const data = await response.json();
  const distance = data.routes?.[0]?.distance;
  if (data.code !== "Ok" || !Number.isFinite(distance) || distance <= 0) throw new Error("A driving route could not be found. Check the pickup and try again.");
  return distance / 1000;
}

export function calculateTourEstimate(distanceKm, vehicle, days, returnTrip) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) throw new Error("A valid driving distance is required for a fare estimate.");
  const estimate = calculateOutstationFare(distanceKm, vehicle, days, returnTrip);
  return {
    roadDistanceKm: distanceKm,
    billedDistanceKm: estimate.billedDistanceKm,
    minimumBillableKm: estimate.minimumBillableKm,
    distanceCharge: estimate.distanceCharge,
    driverAllowance: estimate.driverAllowance,
    tripDays: estimate.tripDays,
    total: estimate.total,
    note: returnTrip
      ? `Estimate uses ₹${estimate.perKm}/km and a 250 km/day minimum, plus driver allowance. Local sightseeing distance, tolls, parking, interstate charges, waiting, taxes and other partner fees are excluded.`
      : `One-way estimate uses ₹${estimate.perKm}/km with a 130 km minimum, plus driver allowance. Tolls, parking, interstate charges, waiting, taxes and other partner fees are excluded.`,
  };
}
