import test from "node:test";
import assert from "node:assert/strict";
import { getDisabledPageName } from "./pageAvailability.js";
import { isCabAttachmentPath, isDriverAdminPath, isDriverRegisterPath } from "./routes.ts";

const enabledSettings = {
  booking_enabled: true,
  temple_tours_enabled: true,
  tour_packages_enabled: true,
  driver_registration_enabled: true,
  cab_attachment_enabled: true,
};

test("returns no disabled page when every route is enabled", () => {
  assert.equal(getDisabledPageName({
    driverPage: true,
    attachmentPage: false,
    templePage: false,
    tourRoute: false,
    pageSettings: enabledSettings,
  }), "");
});

test("identifies each disabled public route", () => {
  const cases = [
    [{ driverPage: true }, "Driver Registration", "driver_registration_enabled"],
    [{ attachmentPage: true }, "Cab Attachment", "cab_attachment_enabled"],
    [{ templePage: true }, "Temple Tours", "temple_tours_enabled"],
    [{ tourRoute: true }, "Tour Packages", "tour_packages_enabled"],
  ];

  for (const [route, name, key] of cases) {
    const settings = { ...enabledSettings, [key]: false };
    assert.equal(getDisabledPageName({
      driverPage: false,
      attachmentPage: false,
      templePage: false,
      tourRoute: false,
      pageSettings: settings,
      ...route,
    }), name);
  }
});

test("recognizes public and admin routes with or without a trailing slash", () => {
  assert.equal(isDriverRegisterPath("/driver-register"), true);
  assert.equal(isDriverRegisterPath("/driver-register/"), true);
  assert.equal(isCabAttachmentPath("/cab-attachment"), true);
  assert.equal(isCabAttachmentPath("/cab-attachment/"), true);
  assert.equal(isDriverAdminPath("/driver-admin/"), true);
});
