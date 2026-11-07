export const documentFields = [
  ["rc", "RC"], ["insurance", "Insurance"], ["permit", "Commercial permit"],
  ["fitness", "Fitness certificate"], ["puc", "Pollution certificate (PUC)"],
];

export const attachedVehicleModels = [
  "Maruti Suzuki Swift Dzire",
  "Hyundai Aura",
  "Honda Amaze",
  "Tata Tigor",
  "Toyota Etios",
  "Maruti Suzuki Ciaz",
  "Maruti Suzuki Ertiga",
  "Maruti Suzuki XL6",
  "Toyota Innova Crysta",
  "Toyota Innova Hycross",
  "Toyota Rumion",
  "Kia Carens",
  "Maruti Suzuki Eeco",
  "Force Traveller",
  "Force Urbania",
];

export function emptyAttachedVehicle() {
  return {
    category: "", model: "", registration: "", commercial: "",
    rc: "", insurance: "", permit: "", fitness: "", puc: "", driverAssigned: "no",
    driverName: "", driverMobile: "", licence: "", badge: "", experience: "",
  };
}

export const initialCabAttachment = {
  ownerName: "", ownerMobile: "", ownerWhatsapp: "", useMobileForWhatsapp: true,
  ownerEmail: "", city: "", operatingArea: "", ownerType: "",
  vehicles: [emptyAttachedVehicle()], consent: false,
};

const mobilePattern = /^(?:\+?91)?[6-9]\d{9}$/;
const normalized = (value) => String(value || "").replace(/[\s()-]/g, "");

export function validateCabAttachment(form) {
  const errors = {};
  for (const [key, label] of [["ownerName", "Enter the owner or fleet contact name."], ["city", "Enter the city."]]) {
    if (!String(form[key] || "").trim()) errors[key] = label;
  }
  if (!mobilePattern.test(normalized(form.ownerMobile))) errors.ownerMobile = "Enter a valid Indian mobile number.";
  if (!form.useMobileForWhatsapp && !mobilePattern.test(normalized(form.ownerWhatsapp))) errors.ownerWhatsapp = "Enter a valid WhatsApp number or use the mobile number.";
  if (!form.vehicles.length) errors.vehicles = "Add at least one vehicle.";
  form.vehicles.forEach((vehicle, index) => {
    const prefix = `vehicle-${index}`;
    for (const [key, label] of [["category", "Choose the vehicle model."], ["registration", "Enter the registration number."], ["commercial", "Select the commercial registration status."]]) {
      if (!String(vehicle[key] || "").trim()) errors[`${prefix}-${key}`] = label;
    }
    if (vehicle.category === "Other" && !String(vehicle.model || "").trim()) errors[`${prefix}-model`] = "Enter the vehicle make and model.";
    if (vehicle.driverAssigned === "yes") {
      for (const [key, label] of [["driverName", "Enter this vehicle's assigned driver name."], ["licence", "Select this driver's licence status."], ["badge", "Select this driver's badge status."], ["experience", "Enter this driver's experience."]]) {
        if (!String(vehicle[key] || "").trim()) errors[`${prefix}-${key}`] = label;
      }
      if (!mobilePattern.test(normalized(vehicle.driverMobile))) errors[`${prefix}-driverMobile`] = "Enter this driver's valid Indian mobile number.";
    }
  });
  if (!form.consent) errors.consent = "Consent is required to review and contact you about this enquiry.";
  return errors;
}

export function buildCabAttachmentMessage(form) {
  const vehicleLines = form.vehicles.flatMap((vehicle, index) => [
    `VEHICLE ${index + 1}`,
    `Category: ${vehicle.category}`,
    `Make / model: ${vehicle.model}`,
    `Registration: ${vehicle.registration}`,
    `Commercial registration: ${vehicle.commercial}`,
    ...documentFields.map(([key, label]) => `${label}: ${vehicle[key]}`),
    vehicle.driverAssigned === "yes"
      ? `Assigned driver (vehicle ${index + 1} only): ${vehicle.driverName}; mobile ${vehicle.driverMobile}; licence ${vehicle.licence}; badge ${vehicle.badge}; experience ${vehicle.experience} years`
      : `Assigned driver (vehicle ${index + 1}): Not assigned yet`,
    "",
  ]);
  return [
    "Hello CabConnect Chennai, I would like to enquire about attaching my cab/fleet.", "",
    "OWNER / CONTACT", `Name: ${form.ownerName}`, `Mobile: ${form.ownerMobile}`,
    `WhatsApp: ${form.useMobileForWhatsapp ? form.ownerMobile : form.ownerWhatsapp}`,
    `Email: ${form.ownerEmail || "Not provided"}`, `City: ${form.city}`, `Operating area: ${form.operatingArea}`, `Owner type: ${form.ownerType}`, "",
    "FLEET AND AVAILABILITY", `Vehicles submitted: ${form.vehicles.length}`,
    ...vehicleLines, "",
    "This is an enquiry for manual review, not vehicle approval or a confirmed attachment.",
  ].join("\n");
}
