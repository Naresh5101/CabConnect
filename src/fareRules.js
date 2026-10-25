/** Representative Chennai operator tariff rules. Confirm partner rates before launch. */
export const OUTSTATION_TARIFF = {
  oneWayMinimumKm: 130,
  roundTripMinimumKmPerDay: 250,
  localKmPerHour: 10,
};

/**
 * Calculate a traditional chauffeur-driven outstation estimate.
 * `distanceKm` is the complete routed distance to bill: one-way for a drop,
 * or the routed return distance for a round trip.
 */
export function calculateOutstationFare(distanceKm, vehicle, days = 1, returnTrip = false) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) throw new Error("A valid road distance is required for an outstation estimate.");
  const tripDays = Math.max(1, Number(days) || 1);
  const minimumKm = returnTrip
    ? OUTSTATION_TARIFF.roundTripMinimumKmPerDay * tripDays
    : OUTSTATION_TARIFF.oneWayMinimumKm;
  const billedDistanceKm = Math.max(distanceKm, minimumKm);
  const perKm = returnTrip ? vehicle.outstationRoundTripPerKm : vehicle.outstationOneWayPerKm;
  const distanceCharge = billedDistanceKm * perKm;
  const driverAllowance = vehicle.driverAllowancePerDay * tripDays;
  return {
    distanceKm,
    billedDistanceKm,
    minimumBillableKm: minimumKm,
    distanceCharge,
    driverAllowance,
    total: distanceCharge + driverAllowance,
    tripDays,
    perKm,
    returnTrip,
  };
}

/** Chennai local packages: 4/40, 8/80, and 12/120, then extra-hour billing. */
export function calculateLocalPackage(hours, vehicle) {
  const requestedHours = Math.max(1, Number(hours) || 4);
  const packageHours = Math.max(4, requestedHours);
  let packageCharge;
  if (packageHours <= 4) {
    packageCharge = vehicle.localPackages[4];
  } else if (packageHours <= 8) {
    packageCharge = vehicle.localPackages[4] + (packageHours - 4) * vehicle.extraHourRate;
  } else if (packageHours <= 12) {
    packageCharge = vehicle.localPackages[8] + (packageHours - 8) * vehicle.extraHourRate;
  } else {
    packageCharge = vehicle.localPackages[12] + (packageHours - 12) * vehicle.extraHourRate;
  }
  return {
    requestedHours,
    packageHours,
    includedKm: packageHours * OUTSTATION_TARIFF.localKmPerHour,
    packageCharge,
  };
}
