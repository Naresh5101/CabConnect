import test from "node:test";
import assert from "node:assert/strict";
import { applyPricingRules, updatePricingRule, validatePricingRules } from "./pricingRules.js";
import { calculateLocalPackage, calculateOutstationFare } from "../utils/fareRules.js";

const rules = {
  tariff: { oneWayMinimumKm: 130, roundTripMinimumKmPerDay: 250, localKmPerHour: 10 },
  vehicles: {
    dzire: { perKm: 20, shortTripPerKm: 20, outstationOneWayPerKm: 16, outstationRoundTripPerKm: 14, localPackages: { 4: 1300, 8: 2300, 12: 3300 }, extraHourRate: 250, airportMinimum: 1000, driverAllowancePerDay: 300 },
    ertiga: { perKm: 28, shortTripPerKm: 30, outstationOneWayPerKm: 19, outstationRoundTripPerKm: 17, localPackages: { 4: 2000, 8: 3400, 12: 4700 }, extraHourRate: 350, airportMinimum: 1500, driverAllowancePerDay: 400 },
  },
};

test("pricing validation rejects negative or missing amounts", () => {
  assert.equal(validatePricingRules(rules), "");
  assert.match(validatePricingRules(updatePricingRule(rules, ["vehicles", "dzire", "perKm"], -1)), /valid positive amount/);
  assert.match(validatePricingRules(updatePricingRule(rules, ["vehicles", "ertiga", "localPackages", 8], "")), /valid positive amount/);
});

test("pricing rules update the matching vehicle and leave unrelated vehicle data intact", () => {
  const base = [{ id: "dzire", label: "Dzire", perKm: 10, image: "/dzire.png" }, { id: "ertiga", label: "Ertiga", perKm: 15 }];
  const updated = applyPricingRules(base, rules);
  assert.equal(updated[0].perKm, 20);
  assert.equal(updated[0].image, "/dzire.png");
  assert.equal(updated[1].perKm, 28);
});

test("saved rule values drive outstation minimums and local package distance", () => {
  const vehicle = applyPricingRules([{ id: "dzire" }], rules)[0];
  const tariff = { ...rules.tariff, oneWayMinimumKm: 150, localKmPerHour: 12 };
  const outstation = calculateOutstationFare(80, vehicle, 1, false, tariff);
  const local = calculateLocalPackage(4, vehicle, tariff);
  assert.equal(outstation.billedDistanceKm, 150);
  assert.equal(outstation.total, 2700);
  assert.equal(local.includedKm, 48);
});
