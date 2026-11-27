export function getDisabledPageName({
  driverPage,
  attachmentPage,
  templePage,
  tourRoute,
  pageSettings,
}) {
  if (driverPage && pageSettings.driver_registration_enabled === false) return "Driver Registration";
  if (attachmentPage && pageSettings.cab_attachment_enabled === false) return "Cab Attachment";
  if (templePage && pageSettings.temple_tours_enabled === false) return "Temple Tours";
  if (tourRoute && pageSettings.tour_packages_enabled === false) return "Tour Packages";
  return "";
}
