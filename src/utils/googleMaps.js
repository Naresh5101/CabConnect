import { isIndianCoordinate } from "./locationSearch.js";

let googleMapsPromise;

function getGoogleMapsApi(apiKey) {
  if (!apiKey?.trim()) {
    throw new Error("Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to the build environment.");
  }

  const existingMaps = globalThis.google?.maps;
  if (existingMaps?.importLibrary) return Promise.resolve(existingMaps);
  if (googleMapsPromise) return googleMapsPromise;
  if (typeof document === "undefined") {
    throw new Error("Google Maps can only be loaded in a browser.");
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = "__cabConnectGoogleMapsReady";
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      delete globalThis[callbackName];
      if (error) {
        reject(error);
        return;
      }
      const maps = globalThis.google?.maps;
      if (!maps?.importLibrary) {
        reject(new Error("Google Maps loaded without its JavaScript library. Check the API key and enabled APIs."));
        return;
      }
      resolve(maps);
    };

    globalThis[callbackName] = () => finish();
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey.trim(),
      v: "weekly",
      loading: "async",
      callback: callbackName,
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => finish(new Error("Google Maps could not load. Check the network and API key restrictions."));
    document.head.append(script);
  }).catch((error) => {
    googleMapsPromise = undefined;
    throw error;
  });

  return googleMapsPromise;
}

export async function loadGoogleMapsLibrary(apiKey, libraryName) {
  const maps = await getGoogleMapsApi(apiKey);
  return maps.importLibrary(libraryName);
}

export async function fetchGooglePlaceSuggestions(input, apiKey, { sessionToken, searchContext = "" } = {}) {
  const { AutocompleteSuggestion, AutocompleteSessionToken } = await loadGoogleMapsLibrary(apiKey, "places");
  const token = sessionToken || new AutocompleteSessionToken();
  const request = {
    input,
    sessionToken: token,
    includedRegionCodes: ["IN"],
    language: "en",
    region: "IN",
  };
  if (/chennai/i.test(searchContext) || /chennai/i.test(input)) {
    request.locationBias = {
      circle: {
        center: { lat: 13.0827, lng: 80.2707 },
        radius: 50000,
      },
    };
  }
  const { suggestions = [] } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
  return {
    sessionToken: token,
    suggestions: suggestions.filter((suggestion) => suggestion.placePrediction),
  };
}

export async function resolveGooglePlacePrediction(prediction) {
  if (!prediction?.toPlace) throw new Error("Choose a valid Google Maps place suggestion.");
  const place = prediction.toPlace();
  await place.fetchFields({ fields: ["formattedAddress", "location", "displayName"] });
  const point = place.location;
  const coordinates = point && {
    lat: typeof point.lat === "function" ? point.lat() : point.lat,
    lon: typeof point.lng === "function" ? point.lng() : point.lng,
  };
  if (!isIndianCoordinate(coordinates?.lat, coordinates?.lon)) {
    throw new Error("That place could not be verified within India. Choose another suggestion or pin the location manually.");
  }
  const displayName = typeof place.displayName === "string" ? place.displayName : place.displayName?.toString?.();
  const label = place.formattedAddress || displayName || prediction.text?.toString?.();
  if (!label) throw new Error("Google Maps did not return an address for that place.");
  return { label, coordinates, placeId: place.id || prediction.placeId };
}

function locationFromGeocoderResult(result) {
  const point = result?.geometry?.location;
  const coordinates = point && {
    lat: typeof point.lat === "function" ? point.lat() : point.lat,
    lon: typeof point.lng === "function" ? point.lng() : point.lng,
  };
  return coordinates;
}

function normalizeState(value) {
  return String(value || "").normalize("NFKD").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export async function geocodeGoogleAddress(address, apiKey, expectedState = "") {
  const { Geocoder } = await loadGoogleMapsLibrary(apiKey, "geocoding");
  const { results = [] } = await new Geocoder().geocode({
    address,
    componentRestrictions: { country: "IN" },
    language: "en",
  });
  const result = results[0];
  const coordinates = locationFromGeocoderResult(result);
  if (!result || !isIndianCoordinate(coordinates?.lat, coordinates?.lon)) {
    throw new Error(`Could not verify “${address}” within India. Check the location or choose an autocomplete result.`);
  }
  if (expectedState) {
    const state = result.address_components?.find((component) => component.types?.includes("administrative_area_level_1"))?.long_name;
    if (normalizeState(state) !== normalizeState(expectedState)) {
      throw new Error(`Could not verify “${address}” within ${expectedState}. Check the location or request a manual quotation.`);
    }
  }
  return { label: result.formatted_address, coordinates };
}

export async function reverseGeocodeGoogleLocation(coordinates, apiKey) {
  const { Geocoder } = await loadGoogleMapsLibrary(apiKey, "geocoding");
  const { results = [] } = await new Geocoder().geocode({
    location: { lat: coordinates.lat, lng: coordinates.lon },
    componentRestrictions: { country: "IN" },
    language: "en",
  });
  if (!results[0]?.formatted_address) {
    throw new Error("Google Maps could not find a nearby address. The selected coordinates are still available.");
  }
  return results[0].formatted_address;
}

function toGoogleLatLng(coordinates) {
  return { lat: coordinates.lat, lng: coordinates.lon };
}

function validateRoutePoints(points) {
  if (!Array.isArray(points) || points.length < 2) {
    throw new Error("Select at least a pickup and destination to calculate a driving route.");
  }
  if (points.some((point) => !isIndianCoordinate(point?.lat, point?.lon))) {
    throw new Error("Choose route locations within India to calculate a driving route.");
  }
}

export async function getGoogleDrivingDistanceKm(points, apiKey) {
  validateRoutePoints(points);
  const { Route } = await loadGoogleMapsLibrary(apiKey, "routes");
  const request = {
    origin: toGoogleLatLng(points[0]),
    destination: toGoogleLatLng(points[points.length - 1]),
    travelMode: "DRIVING",
    fields: ["distanceMeters"],
  };
  if (points.length > 2) {
    request.intermediates = points.slice(1, -1).map((point) => ({ location: toGoogleLatLng(point) }));
  }
  const { routes = [] } = await Route.computeRoutes(request);
  const distanceMeters = routes[0]?.distanceMeters;
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    throw new Error("Google Maps could not find a complete driving route for these locations.");
  }
  return distanceMeters / 1000;
}

export async function getGoogleDrivingDistanceMatrixKm(points, apiKey) {
  validateRoutePoints(points);
  if (points.length ** 2 > 625) {
    throw new Error("Too many locations to compare in one Google Maps route request. Keep the current stop order or request a manual quotation.");
  }
  const { RouteMatrix } = await loadGoogleMapsLibrary(apiKey, "routes");
  const { matrix } = await RouteMatrix.computeRouteMatrix({
    origins: points.map(toGoogleLatLng),
    destinations: points.map(toGoogleLatLng),
    travelMode: "DRIVING",
    fields: ["distanceMeters", "condition"],
  });
  const rows = matrix?.rows;
  if (!Array.isArray(rows) || rows.length !== points.length) {
    throw new Error("Google Maps could not compare driving routes for these locations.");
  }
  return rows.map((row) => row.items.map((item) => Number.isFinite(item.distanceMeters) && item.distanceMeters > 0
    ? item.distanceMeters / 1000
    : null));
}

export async function getDrivingRouteDistanceKm(points, apiKey, fetchImpl = fetch) {
  if (apiKey) return getGoogleDrivingDistanceKm(points, apiKey);
  validateRoutePoints(points);
  const joined = points.map(({ lon, lat }) => `${lon},${lat}`).join(";");
  const response = await fetchImpl(`https://router.project-osrm.org/route/v1/driving/${joined}?overview=false&steps=false`);
  if (!response.ok) throw new Error("The road-routing service is unavailable.");
  const data = await response.json();
  const distanceMeters = data.routes?.[0]?.distance;
  if (data.code !== "Ok" || !Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    throw new Error("A complete road route could not be found for these locations.");
  }
  return distanceMeters / 1000;
}

export async function getDrivingDistanceMatrixKm(points, apiKey, fetchImpl = fetch) {
  if (apiKey) return getGoogleDrivingDistanceMatrixKm(points, apiKey);
  validateRoutePoints(points);
  const joined = points.map(({ lon, lat }) => `${lon},${lat}`).join(";");
  const response = await fetchImpl(`https://router.project-osrm.org/table/v1/driving/${joined}?annotations=distance`);
  if (!response.ok) throw new Error("Road route suggestions are temporarily unavailable.");
  const data = await response.json();
  if (data.code !== "Ok" || !Array.isArray(data.distances) || data.distances.length !== points.length) {
    throw new Error("A road-based order suggestion could not be calculated.");
  }
  return data.distances.map((row) => row.map((distanceMeters) => Number.isFinite(distanceMeters)
    ? distanceMeters / 1000
    : null));
}
