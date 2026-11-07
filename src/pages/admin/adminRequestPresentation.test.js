import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_REQUEST_SECTIONS,
  countAttachmentVehicles,
  flattenRequestDetails,
  getAttachmentSummary,
  getRequestVehicles,
  normalizeRequestData,
} from "./adminRequestPresentation.js";
import { attachedVehicleModels, emptyAttachedVehicle, initialCabAttachment, validateCabAttachment } from "../../drivers/cabAttachmentUtils.js";

test("every customer submission type maps to an admin inbox section", () => {
  assert.deepEqual(ADMIN_REQUEST_SECTIONS, {
    cab_booking: "cab-bookings",
    tour_quote: "enquiries",
    temple_tour: "temple-tours",
    cab_attachment: "attachments",
  });
});

test("cab booking and tour quote payload details remain available to admin", () => {
  const booking = normalizeRequestData({
    service: "oneway",
    pickup: "Chennai",
    destination: "Bengaluru",
    travelDate: "2026-11-01",
    passengers: 3,
    vehicleLabel: "Maruti Suzuki Swift Dzire",
    estimatedFare: { total: 4200, distanceKm: 350, notes: "Estimate only" },
  });
  assert.equal(booking.pickup, "Chennai");
  assert.equal(booking.estimatedFare.total, 4200);

  const tour = normalizeRequestData({
    packageId: "ooty",
    destination: "Ooty",
    pickup: "Chennai",
    travellers: 4,
    days: 3,
    vehicle: "Ertiga",
    tripType: "Round-trip",
    estimate: { total: 12000 },
  });
  assert.equal(tour.packageId, "ooty");
  assert.equal(tour.estimate.total, 12000);
});

test("temple tour vehicle and stop arrays are retained as admin-readable fields", () => {
  const data = normalizeRequestData({
    category: "Pilgrimage",
    start: "Chennai",
    temples: [{ name: "Palani", town: "Palani" }, { name: "Madurai", town: "Madurai" }],
    vehicle: { id: "ertiga", label: "Ertiga", passengers: 6 },
    estimate: { total: 8500 },
  });
  assert.equal(data.start, "Chennai");
  assert.equal(getRequestVehicles(data)[0].label, "Ertiga");
  assert.deepEqual(flattenRequestDetails({ temples: data.temples }).map(([label, value]) => [label, value]), [
    ["Temples 1 · Name", "Palani"],
    ["Temples 1 · Town", "Palani"],
    ["Temples 2 · Name", "Madurai"],
    ["Temples 2 · Town", "Madurai"],
  ]);
});

test("attachment summary and count handle current and nested legacy payloads", () => {
  const current = {
    city: "Chennai",
    operatingArea: "T Nagar",
    vehicles: [{ category: "Dzire", registration: "TN 01 AB 1234" }, { category: "Ertiga", registration: "TN 02 CD 5678" }],
  };
  assert.deepEqual(getAttachmentSummary(current), {
    vehicles: "Dzire · TN 01 AB 1234, Ertiga · TN 02 CD 5678",
    location: "Chennai · T Nagar",
  });
  assert.equal(countAttachmentVehicles(current), 2);
  assert.equal(countAttachmentVehicles({ form_data: { vehicleDetails: { model: "Dzire" } } }), 1);
  assert.equal(countAttachmentVehicles({ details: { vehicles: ["Dzire", "Ertiga"] } }), 2);
});

test("vehicle attachment supports common commercial models and a validated custom model", () => {
  assert.ok(attachedVehicleModels.includes("Hyundai Aura"));
  assert.ok(attachedVehicleModels.includes("Toyota Innova Crysta"));
  assert.ok(attachedVehicleModels.includes("Force Traveller"));

  const form = {
    ...initialCabAttachment,
    ownerName: "Fleet owner",
    ownerMobile: "9876543210",
    city: "Chennai",
    consent: true,
    vehicles: [{ ...emptyAttachedVehicle(), category: "Other", registration: "TN 01 AB 1234", commercial: "Yes" }],
  };
  assert.equal(validateCabAttachment(form)["vehicle-0-model"], "Enter the vehicle make and model.");
  form.vehicles[0].model = "Toyota Glanza";
  assert.equal(validateCabAttachment(form)["vehicle-0-model"], undefined);
  assert.match(getAttachmentSummary({ vehicles: [{ category: "Other", model: "Toyota Glanza", registration: "TN 01 AB 1234" }] }).vehicles, /Toyota Glanza/);
});

test("flattened request detail rows preserve unknown fields and nested values", () => {
  const rows = flattenRequestDetails({
    newPreference: "Quiet ride",
    nested: { pickupCoords: { lat: 13.08, lon: 80.27 } },
    ignored: "already rendered",
  }, new Set(["ignored"]));
  assert.deepEqual(rows, [
    ["New Preference", "Quiet ride"],
    ["Nested · Pickup Coords · Lat", 13.08],
    ["Nested · Pickup Coords · Lon", 80.27],
  ]);
});
