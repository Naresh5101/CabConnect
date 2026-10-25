import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDriverWhatsAppMessage, initialDriverApplication, normalizeIndianMobile,
  toDriverApplicationPayload, validateDriverApplication,
} from "./driverRegistrationUtils.js";

function validApplication(overrides = {}) {
  return {
    ...initialDriverApplication,
    fullName: "Arun Kumar", mobile: "+91 98765 43210", useMobileForWhatsApp: true,
    cityArea: "Chennai, Velachery", experienceYears: "5", licenceStatus: "Valid",
    badgeStatus: "Not applicable", policeVerificationCertificate: "Yes",
    preferredWorkType: "Full-time", preferredShift: "Day shift, 8 am–6 pm",
    contactConsent: true, ...overrides,
  };
}

test("accepts a complete driver recruitment application and normalizes Indian phone numbers", () => {
  const application = validApplication();
  assert.deepEqual(validateDriverApplication(application), {});
  assert.equal(normalizeIndianMobile(application.mobile), "9876543210");
  assert.equal(toDriverApplicationPayload(application).mobile, "9876543210");
});

test("requires identity, contact, area, credentials, work preferences, and consent", () => {
  const errors = validateDriverApplication(validApplication({
    fullName: "", mobile: "12345", cityArea: "", experienceYears: "61", licenceStatus: "",
    badgeStatus: "", policeVerificationCertificate: "", preferredWorkType: "", preferredShift: "", contactConsent: false,
  }));
  for (const field of ["fullName", "mobile", "cityArea", "experienceYears", "licenceStatus", "badgeStatus", "policeVerificationCertificate", "preferredWorkType", "preferredShift", "contactConsent"]) {
    assert.ok(errors[field], `expected error for ${field}`);
  }
});

test("requires a valid alternate WhatsApp number when mobile is not reused", () => {
  const errors = validateDriverApplication(validApplication({ useMobileForWhatsApp: false, whatsapp: "555" }));
  assert.match(errors.whatsapp, /valid 10-digit Indian WhatsApp number/);
});

test("does not accept alphabetic characters disguised around a phone number", () => {
  const errors = validateDriverApplication(validApplication({ mobile: "call9876543210" }));
  assert.ok(errors.mobile);
});

test("validates optional salary and text lengths", () => {
  const errors = validateDriverApplication(validApplication({ expectedMonthlySalary: "1200000", languages: "x".repeat(121) }));
  assert.match(errors.expectedMonthlySalary, /monthly amount/);
  assert.match(errors.languages, /120 characters/);
});

test("payload contains driver recruitment fields only and excludes consent metadata", () => {
  const payload = toDriverApplicationPayload(validApplication({ expectedMonthlySalary: "35000" }));
  assert.equal(payload.expected_monthly_salary, 35000);
  assert.equal(payload.whatsapp, "9876543210");
  assert.equal(payload.contact_consent, true);
  assert.equal(payload.police_verification_certificate, "Yes");
  assert.equal("vehicle_make" in payload, false);
  assert.equal("vehicleOwnership" in payload, false);
});

test("WhatsApp follow-up is optional and clearly not an employment offer", () => {
  const message = buildDriverWhatsAppMessage(validApplication());
  assert.match(message, /Arun Kumar/);
  assert.match(message, /not a job offer/);
  assert.doesNotMatch(message, /Vehicle category|Vehicle ownership/);
});
