import { templeCategories } from "./templeData.js";
import { calculateOutstationFare, OUTSTATION_TARIFF } from "../utils/fareRules.js";
import { geocodeGoogleAddress, getDrivingDistanceMatrixKm, getDrivingRouteDistanceKm } from "../utils/googleMaps.js";
import { photonSearchParams, rankIndianPlaceFeatures } from "../utils/locationSearch.js";

export function filterTempleCatalogue(records, categoryId = "all", query = "") {
  const normalized = query.trim().toLocaleLowerCase();
  return records.filter((temple) => {
    const inCategory = categoryId === "all" || categoryId === "custom" || temple.categories.includes(categoryId);
    if (!inCategory) return false;
    if (!normalized) return true;
    const categoryNames = temple.categories.map((id) => templeCategories.find((category) => category.id === id)?.label || id).join(" ");
    return [temple.name, temple.tamilName, temple.deity, temple.town, temple.district, temple.state, categoryNames]
      .filter(Boolean).join(" ").toLocaleLowerCase().includes(normalized);
  });
}

export function toggleTempleSelection(selectedIds, templeId) {
  return selectedIds.includes(templeId)
    ? selectedIds.filter((id) => id !== templeId)
    : [...selectedIds, templeId];
}

export async function suggestNearestOrder(startCoordinate, temples, coordinatesById, fetchImpl = fetch, googleMapsApiKey = "") {
  if (!startCoordinate || temples.length < 2) return Promise.resolve(temples.map(({ id }) => id));
  const ordered = temples.map((temple) => coordinatesById[temple.id]);
  if (ordered.some((coordinate) => !coordinate)) return Promise.reject(new Error("A selected temple could not be located. You can continue with a manual quotation request."));
  const points = [startCoordinate, ...ordered];
  const matrix = await getDrivingDistanceMatrixKm(points, googleMapsApiKey, fetchImpl);
  if (!Array.isArray(matrix) || matrix.length !== points.length) {
    throw new Error("A road-based order suggestion could not be calculated. Keep your preferred order or request a manual quotation.");
  }
  const remaining = temples.map((temple, index) => ({ id: temple.id, matrixIndex: index + 1 }));
  const result = [];
  let currentIndex = 0;
  while (remaining.length) {
    let bestAt = -1;
    let bestDistance = Infinity;
    remaining.forEach((candidate, index) => {
      const distance = matrix[currentIndex]?.[candidate.matrixIndex];
      if (Number.isFinite(distance) && distance < bestDistance) {
        bestDistance = distance;
        bestAt = index;
      }
    });
    if (bestAt < 0) throw new Error("A selected temple could not be connected by road. You can request a manual quotation.");
    const [next] = remaining.splice(bestAt, 1);
    result.push(next.id);
    currentIndex = next.matrixIndex;
  }
  return result;
}

export async function geocodeTravelStop(query, expectedState, fetchImpl = fetch, googleMapsApiKey = "") {
  if (googleMapsApiKey) {
    return (await geocodeGoogleAddress(query, googleMapsApiKey, expectedState)).coordinates;
  }
  const parts = [...new Set(query.split(",").map((part) => part.trim()).filter(Boolean))];
  const locationOnly = parts.slice(1).join(", ");
  // Temple labels can differ from the map provider's feature name. Retry with
  // the town and district, then the town alone, while retaining the state check.
  const townOnly = parts.length > 2 ? parts.slice(1, -1).join(", ") : "";
  const searchQueries = [...new Set([query, locationOnly, townOnly].filter(Boolean))];
  let hadServiceError = false;
  for (const searchQuery of searchQueries) {
    const params = photonSearchParams(searchQuery, { searchContext: expectedState || "", limit: 10 });
    const response = await fetchImpl(`https://photon.komoot.io/api/?${params.toString()}`, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      hadServiceError = true;
      continue;
    }
    const data = await response.json();
    const feature = rankIndianPlaceFeatures(data.features, searchQuery, expectedState)[0];
    if (feature) {
      const [lon, lat] = feature.geometry.coordinates;
      return { lat, lon };
    }
  }
  if (hadServiceError) throw new Error(`Could not look up “${query}”. Check your connection or request a manual quotation.`);
  throw new Error(`Could not verify “${query}” within ${expectedState || "India"}. Check the temple town or request a manual quotation.`);
}

export async function requestRoadDistance(startCoordinate, orderedTempleCoordinates, fetchImpl = fetch, googleMapsApiKey = "") {
  if (!startCoordinate || orderedTempleCoordinates.length === 0 || orderedTempleCoordinates.some((point) => !point)) {
    throw new Error("Choose at least one temple and verify every stop before calculating a route.");
  }
  const points = [startCoordinate, ...orderedTempleCoordinates, startCoordinate];
  return getDrivingRouteDistanceKm(points, googleMapsApiKey, fetchImpl);
}

export function calculateTempleFare(distanceKm, vehicle, days, tariff = OUTSTATION_TARIFF) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) throw new Error("A verified road distance is required for an estimate.");
  const estimate = calculateOutstationFare(distanceKm, vehicle, days, true, tariff);
  return {
    distanceKm,
    tripDays: estimate.tripDays,
    billedDistanceKm: estimate.billedDistanceKm,
    minimumBillableKm: estimate.minimumBillableKm,
    perKm: estimate.perKm,
    distanceCharge: estimate.distanceCharge,
    driverAllowance: estimate.driverAllowance,
    total: estimate.total,
    note: `Road route includes the return to your pickup. A ${tariff.roundTripMinimumKmPerDay} km/day minimum and driver allowance apply. Tolls, parking, waiting, taxes and other partner charges are excluded.`,
  };
}

export function buildTempleWhatsAppMessage({ category, temples, start, date, days, travellers, vehicle, fare, customerName, phone, notes, routeProvider }) {
  const lines = [
    "Hello CabConnect Chennai, I’d like to request a temple tour quotation.",
    "",
    `Tour: ${category}`,
    `Starting location: ${start}`,
    "Preferred temple order:",
    ...temples.map((temple, index) => `${index + 1}. ${temple.name} — ${temple.town}, ${temple.state}`),
    `Travel date: ${date || "To be confirmed"}`,
    `Travel duration: ${days} day(s)`,
    `Travellers: ${travellers}`,
    `Preferred vehicle: ${vehicle.label}`,
    ...(fare ? [
      `Road distance (return to starting point): ${fare.distanceKm.toFixed(1)} km`,
      ...(routeProvider ? [`Road route data: ${routeProvider}`] : []),
      ...(fare.billedDistanceKm == null ? [] : [`Billed distance: ${fare.billedDistanceKm.toFixed(1)} km (minimum ${fare.minimumBillableKm} km for ${fare.tripDays} day(s))`]),
      `Distance charge: ₹${Math.round(fare.distanceCharge)}`,
      `Driver allowance (${fare.tripDays} day(s)): ₹${Math.round(fare.driverAllowance)}`,
      `Estimated total: ₹${Math.round(fare.total)}`,
      "Tolls, parking, waiting, taxes and other partner fees are excluded.",
    ] : ["Route/fare estimate: Not available; please provide a manual quotation."]),
    `Name: ${customerName}`,
    `Mobile: ${phone}`,
    `Special requests: ${notes || "None"}`,
    "",
    "Please confirm route, availability and final quotation. This is a request, not a confirmed booking.",
  ];
  return lines.join("\n");
}
