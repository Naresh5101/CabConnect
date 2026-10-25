import test from "node:test";
import assert from "node:assert/strict";
import { temples } from "./templeData.js";
import {
  buildTempleWhatsAppMessage,
  calculateTempleFare,
  filterTempleCatalogue,
  requestRoadDistance,
  suggestNearestOrder,
  toggleTempleSelection,
} from "./templeUtils.js";

test("catalogue records are unique and all six Arupadai temples are selectable", () => {
  assert.equal(new Set(temples.map(({ id }) => id)).size, temples.length);
  assert.equal(temples.filter(({ categories }) => categories.includes("arupadai")).length, 6);
});

test("category filtering, text search and custom browsing return relevant records", () => {
  assert.equal(filterTempleCatalogue(temples, "arupadai").length, 6);
  assert.equal(filterTempleCatalogue(temples, "amman").some(({ id }) => id === "meenakshi"), true);
  assert.equal(filterTempleCatalogue(temples, "all", "திருச்செந்தூர்")[0]?.id, "tiruchendur");
  assert.equal(filterTempleCatalogue(temples, "custom").length, temples.length);
});

test("selection toggles preserve order and support mixing categories", () => {
  let selected = [];
  selected = toggleTempleSelection(selected, "palani");
  selected = toggleTempleSelection(selected, "meenakshi");
  selected = toggleTempleSelection(selected, "tiruchendur");
  assert.deepEqual(selected, ["palani", "meenakshi", "tiruchendur"]);
  assert.deepEqual(toggleTempleSelection(selected, "meenakshi"), ["palani", "tiruchendur"]);
});

test("road route service failures are reported and never become a fabricated distance", async () => {
  await assert.rejects(
    requestRoadDistance({ lat: 13, lon: 80 }, [{ lat: 10, lon: 78 }], async () => ({ ok: false })),
    /routing service is unavailable/i,
  );
  await assert.rejects(
    requestRoadDistance({ lat: 13, lon: 80 }, [{ lat: 10, lon: 78 }], async () => ({ ok: true, json: async () => ({ code: "NoRoute", routes: [] }) })),
    /complete road route could not be found/i,
  );
});

test("road-based order suggestion is explicit and uses route table distances", async () => {
  const result = await suggestNearestOrder(
    { lat: 13, lon: 80 },
    [{ id: "far" }, { id: "near" }],
    { far: { lat: 11, lon: 78 }, near: { lat: 12, lon: 80 } },
    async () => ({ ok: true, json: async () => ({ code: "Ok", distances: [[0, 9000, 3000], [9000, 0, 5000], [3000, 5000, 0]] }) }),
  );
  assert.deepEqual(result, ["near", "far"]);
});

test("fare recalculates from route distance, chosen vehicle and trip duration", () => {
  const dzire = { label: "Dzire", outstationRoundTripPerKm: 14, driverAllowancePerDay: 300 };
  const ertiga = { label: "Ertiga", outstationRoundTripPerKm: 17, driverAllowancePerDay: 400 };
  const first = calculateTempleFare(300, dzire, 2);
  const changed = calculateTempleFare(300, ertiga, 3);
  assert.equal(first.billedDistanceKm, 500);
  assert.equal(first.total, 7600);
  assert.equal(changed.billedDistanceKm, 750);
  assert.equal(changed.total, 13950);
  assert.throws(() => calculateTempleFare(null, dzire, 2), /verified road distance/i);
});

test("WhatsApp request includes ordered stops and estimate breakdown", () => {
  const message = buildTempleWhatsAppMessage({
    category: "Custom Temple Tour",
    temples: [temples.find(({ id }) => id === "palani"), temples.find(({ id }) => id === "meenakshi")],
    start: "Chennai, Tamil Nadu",
    date: "2026-12-01",
    days: 3,
    travellers: 2,
    vehicle: { label: "Dzire" },
    fare: { distanceKm: 640, distanceCharge: 8960, driverAllowance: 1200, tripDays: 3, total: 10160 },
    customerName: "Test Rider",
    phone: "+91 9876543210",
    notes: "Wheelchair assistance",
  });
  assert.ok(message.includes("1. Palani Murugan Temple"));
  assert.ok(message.indexOf("Palani Murugan Temple") < message.indexOf("Meenakshi Amman Temple"));
  assert.ok(message.includes("640.0 km"));
  assert.ok(message.includes("₹10160"));
  assert.ok(message.includes("Wheelchair assistance"));
});
