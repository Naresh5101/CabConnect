import test from "node:test";
import assert from "node:assert/strict";
import { buildCabAttachmentMessage, emptyAttachedVehicle, initialCabAttachment, validateCabAttachment } from "./cabAttachmentUtils.js";

function validAttachment() {
  return {
    ...initialCabAttachment,
    ownerName: "Meena Raj", ownerMobile: "9876543210", city: "Chennai", operatingArea: "T Nagar", ownerType: "Fleet operator / company", useMobileForWhatsapp: true,
    hours: "6 am–10 pm", services: ["Airport transfers"], days: ["Mon", "Sat"], consent: true,
    vehicles: [{ ...emptyAttachedVehicle(), category: "Maruti Suzuki Swift Dzire", model: "Dzire VXi 2023", registration: "TN 01 AB 1234", commercial: "Yes", rc: "Yes", insurance: "Yes", permit: "Yes", fitness: "Yes", puc: "Yes", driverAssigned: "no" }],
  };
}

test("accepts fleet enquiry with unassigned driver", () => {
  assert.deepEqual(validateCabAttachment(validAttachment()), {});
});

test("accepts a short starter enquiry without optional documents, driver, or preferences", () => {
  const form = {
    ...initialCabAttachment,
    ownerName: "Meena Raj", ownerMobile: "9876543210", city: "Chennai", consent: true,
    vehicles: [{ ...emptyAttachedVehicle(), category: "Maruti Suzuki Ertiga", registration: "TN 01 AB 1234", commercial: "In progress" }],
  };
  assert.deepEqual(validateCabAttachment(form), {});
});

test("checks driver requirements only for that vehicle when assigned", () => {
  const form = validAttachment();
  form.vehicles.push({ ...form.vehicles[0], driverAssigned: "yes", driverName: "Ravi", driverMobile: "invalid", licence: "Yes", badge: "Yes", experience: "8" });
  const errors = validateCabAttachment(form);
  assert.match(errors["vehicle-1-driverMobile"], /valid Indian mobile/);
  assert.equal(errors["vehicle-0-driverName"], undefined);
});

test("message keeps assigned drivers attached to their own vehicles", () => {
  const form = validAttachment();
  form.vehicles.push({ ...emptyAttachedVehicle(), category: "Maruti Suzuki Ertiga", model: "Ertiga ZXi", registration: "TN 02 CD 9876", commercial: "Yes", rc: "Yes", insurance: "Yes", permit: "Yes", fitness: "Yes", puc: "Yes", driverAssigned: "yes", driverName: "Ravi Kumar", driverMobile: "9876543210", licence: "Yes", badge: "Yes", experience: "8" });
  const message = buildCabAttachmentMessage(form);
  assert.match(message, /VEHICLE 1[\s\S]*Assigned driver \(vehicle 1\): Not assigned yet[\s\S]*VEHICLE 2[\s\S]*Assigned driver \(vehicle 2 only\): Ravi Kumar/);
  assert.match(message, /not vehicle approval/);
});
