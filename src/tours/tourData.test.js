import test from "node:test";
import assert from "node:assert/strict";
import { destinations, findTourByPath, tourCategories } from "./tourData.js";

test("all requested destination and cab landing paths resolve to their own destinations", () => {
  for (const destination of destinations) {
    assert.equal(findTourByPath(destination.slug)?.destination.id, destination.id);
  }
  assert.equal(findTourByPath("/chennai-to-kodaikanal-cab")?.destination.id, "kodaikanal");
  assert.equal(findTourByPath("/chennai-to-ooty-cab")?.destination.id, "ooty");
  assert.equal(findTourByPath("/tour-packages/not-a-destination"), null);
});

test("destination records have unique routes, accessible images, itinerary, attractions and FAQs", () => {
  assert.ok(destinations.length >= 20);
  assert.equal(new Set(destinations.map((destination) => destination.slug)).size, destinations.length);
  for (const destination of destinations) {
    assert.ok(destination.hero.startsWith("/tours/"));
    assert.ok(destination.alt.length > 12);
    assert.ok(destination.itinerary.length > 0);
    assert.ok(destination.attractions.length >= 4);
    assert.ok(destination.attractions.every((attraction) => attraction.image && attraction.alt && attraction.credit));
    assert.ok(destination.faqs.length > 0);
    assert.ok(destination.state);
    assert.ok(destination.sourceLinks.length > 0);
  }
});

test("catalog categories cover requested package types and destination cards never promise a price", () => {
  assert.deepEqual(tourCategories, [
    "Hill Station Getaways", "Family Holidays", "Weekend Trips", "Outstation Road Trips", "Coastal Getaways", "Culture & Heritage", "Nature & Waterfalls",
  ]);
  assert.ok(destinations.every((destination) => !destination.category.includes("Pilgrimage Tours")));
  assert.ok(destinations.every((destination) => !/₹|INR\s?\d|\$\d/.test(destination.summary)));
});

test("the catalogue includes popular destinations from each requested state", () => {
  const states = new Set(destinations.map((destination) => destination.state));
  for (const state of ["Tamil Nadu", "Kerala", "Andhra Pradesh", "Karnataka", "Goa"]) assert.ok(states.has(state), `${state} should be available`);
  for (const name of ["Madurai", "Kanyakumari", "Munnar", "Tirupati & Tirumala", "Araku Valley", "Bengaluru", "Mysuru", "Goa"]) {
    if (["Madurai", "Tirupati & Tirumala"].includes(name)) {
      assert.ok(!destinations.some((destination) => destination.name === name), `${name} belongs in the separate temple tours area`);
    } else assert.ok(destinations.some((destination) => destination.name === name), `${name} should be listed`);
  }
});
