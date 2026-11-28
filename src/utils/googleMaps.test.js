import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchGooglePlaceSuggestions,
  geocodeGoogleAddress,
  getGoogleDrivingDistanceMatrixKm,
  getGoogleDrivingDistanceKm,
  loadGoogleMapsLibrary,
  resolveGooglePlacePrediction,
} from "./googleMaps.js";

async function withGoogleMaps(importLibrary, callback) {
  const previous = globalThis.google;
  globalThis.google = { maps: { importLibrary } };
  try {
    return await callback();
  } finally {
    if (previous === undefined) delete globalThis.google;
    else globalThis.google = previous;
  }
}

test("Google Maps integration reports missing browser keys", async () => {
  await assert.rejects(loadGoogleMapsLibrary("", "maps"), /VITE_GOOGLE_MAPS_API_KEY/);
});

test("Google driving routes request a driving distance and convert meters to kilometers", async () => {
  await withGoogleMaps(async (name) => {
    assert.equal(name, "routes");
    return {
      Route: {
        computeRoutes: async (request) => {
          assert.deepEqual(request.origin, { lat: 13.08, lng: 80.27 });
          assert.deepEqual(request.destination, { lat: 12.97, lng: 80.22 });
          assert.deepEqual(request.intermediates, [{ location: { lat: 12.99, lng: 80.25 } }]);
          assert.equal(request.travelMode, "DRIVING");
          assert.deepEqual(request.fields, ["distanceMeters"]);
          return { routes: [{ distanceMeters: 12450 }] };
        },
      },
    };
  }, async () => {
    const distance = await getGoogleDrivingDistanceKm([
      { lat: 13.08, lon: 80.27 },
      { lat: 12.99, lon: 80.25 },
      { lat: 12.97, lon: 80.22 },
    ], "test-key");
    assert.equal(distance, 12.45);
  });
});

test("Google route matrices convert valid distances and leave unreachable stops unavailable", async () => {
  await withGoogleMaps(async (name) => {
    assert.equal(name, "routes");
    return {
      RouteMatrix: {
        computeRouteMatrix: async ({ fields, travelMode }) => {
          assert.deepEqual(fields, ["distanceMeters", "condition"]);
          assert.equal(travelMode, "DRIVING");
          return {
            matrix: {
              rows: [
                { items: [{ distanceMeters: 0 }, { distanceMeters: 6200 }] },
                { items: [{ distanceMeters: 6200 }, { condition: "ROUTE_NOT_FOUND" }] },
              ],
            },
          };
        },
      },
    };
  }, async () => {
    const matrix = await getGoogleDrivingDistanceMatrixKm([
      { lat: 13.08, lon: 80.27 },
      { lat: 12.99, lon: 80.25 },
    ], "test-key");
    assert.deepEqual(matrix, [[null, 6.2], [6.2, null]]);
  });
});

test("Google place search stays within India and reuses an autocomplete session token", async () => {
  const sessionToken = { id: "session" };
  const prediction = {
    text: { toString: () => "Anna Nagar, Chennai, Tamil Nadu, India" },
  };
  await withGoogleMaps(async (name) => {
    assert.equal(name, "places");
    return {
      AutocompleteSuggestion: {
        fetchAutocompleteSuggestions: async (request) => {
          assert.equal(request.input, "Anna Nagar");
          assert.equal(request.sessionToken, sessionToken);
          assert.deepEqual(request.includedRegionCodes, ["IN"]);
          assert.deepEqual(request.locationBias.circle.center, { lat: 13.0827, lng: 80.2707 });
          return { suggestions: [{ placePrediction: prediction }, { queryPrediction: {} }] };
        },
      },
      AutocompleteSessionToken: class {},
    };
  }, async () => {
    const result = await fetchGooglePlaceSuggestions("Anna Nagar", "test-key", {
      sessionToken,
      searchContext: "Chennai, Tamil Nadu",
    });
    assert.equal(result.sessionToken, sessionToken);
    assert.deepEqual(result.suggestions, [{ placePrediction: prediction }]);
  });
});

test("Google place selection returns verified India coordinates", async () => {
  const place = {
    formattedAddress: "Anna Nagar, Chennai, Tamil Nadu, India",
    location: { lat: () => 13.0878, lng: () => 80.2089 },
    fetchFields: async ({ fields }) => assert.deepEqual(fields, ["formattedAddress", "location", "displayName"]),
  };
  const prediction = { toPlace: () => place, placeId: "place-id" };
  const result = await resolveGooglePlacePrediction(prediction);
  assert.equal(result.label, place.formattedAddress);
  assert.deepEqual(result.coordinates, { lat: 13.0878, lon: 80.2089 });
  assert.equal(result.placeId, "place-id");
});

test("Google geocoding rejects results outside the requested Indian state", async () => {
  await withGoogleMaps(async (name) => {
    assert.equal(name, "geocoding");
    return {
      Geocoder: class {
        geocode = async (request) => {
          assert.equal(request.componentRestrictions.country, "IN");
          return {
            results: [{
              formatted_address: "Example, Karnataka, India",
              geometry: { location: { lat: () => 12.97, lng: () => 77.59 } },
              address_components: [{ long_name: "Karnataka", types: ["administrative_area_level_1"] }],
            }],
          };
        };
      },
    };
  }, async () => {
    await assert.rejects(geocodeGoogleAddress("Example", "test-key", "Tamil Nadu"), /within Tamil Nadu/);
  });
});
