export const WORK_TYPES = ["Full-time", "Part-time", "Weekend"];
export const LICENCE_STATUSES = ["Valid", "Renewal in progress", "No"];
export const BADGE_STATUSES = ["Yes", "No", "Not applicable"];
export const APPLICATION_STATUSES = ["New", "Reviewing", "Shortlisted", "Contacted", "Rejected", "Hired"];

export const initialDriverApplication = {
  fullName: "", mobile: "", whatsapp: "", useMobileForWhatsApp: true,
  cityArea: "", experienceYears: "", licenceStatus: "", badgeStatus: "",
  policeVerificationCertificate: "",
  preferredWorkType: "", preferredShift: "", languages: "", previousExperience: "",
  expectedMonthlySalary: "", additionalInformation: "", contactConsent: false,
};

export function normalizeIndianMobile(value) {
  const compact = String(value || "").replace(/[\s()-]/g, "");
  if (/^\+91[6-9]\d{9}$/.test(compact)) return compact.slice(3);
  if (/^91[6-9]\d{9}$/.test(compact)) return compact.slice(2);
  return compact;
}

export function validateDriverApplication(application) {
  const errors = {};
  if (!application.fullName.trim() || application.fullName.trim().length > 100) errors.fullName = "Enter your name (up to 100 characters).";
  if (!/^[6-9]\d{9}$/.test(normalizeIndianMobile(application.mobile))) errors.mobile = "Enter a valid 10-digit Indian mobile number.";
  if (!application.useMobileForWhatsApp && !/^[6-9]\d{9}$/.test(normalizeIndianMobile(application.whatsapp))) errors.whatsapp = "Enter a valid 10-digit Indian WhatsApp number.";
  if (!application.cityArea.trim() || application.cityArea.trim().length > 120) errors.cityArea = "Enter your city and operating area (up to 120 characters).";
  const years = Number(application.experienceYears);
  if (application.experienceYears === "" || !Number.isInteger(years) || years < 0 || years > 60) errors.experienceYears = "Enter a whole number from 0 to 60.";
  if (!LICENCE_STATUSES.includes(application.licenceStatus)) errors.licenceStatus = "Choose your licence status.";
  if (!BADGE_STATUSES.includes(application.badgeStatus)) errors.badgeStatus = "Choose your driver badge status.";
  if (!["Yes", "No"].includes(application.policeVerificationCertificate)) errors.policeVerificationCertificate = "Choose Yes or No for your police verification certificate.";
  if (!WORK_TYPES.includes(application.preferredWorkType)) errors.preferredWorkType = "Choose a preferred work type.";
  if (!application.preferredShift.trim() || application.preferredShift.trim().length > 120) errors.preferredShift = "Enter your preferred shift or availability.";
  if (application.languages.length > 120) errors.languages = "Keep this within 120 characters.";
  if (application.previousExperience.length > 1000) errors.previousExperience = "Keep this within 1,000 characters.";
  if (application.additionalInformation.length > 1000) errors.additionalInformation = "Keep this within 1,000 characters.";
  if (application.expectedMonthlySalary && (!/^\d{1,4}(?:,?\d{3})*$/.test(application.expectedMonthlySalary) || Number(application.expectedMonthlySalary.replaceAll(",", "")) > 1000000)) errors.expectedMonthlySalary = "Enter a monthly amount up to ₹10,00,000.";
  if (!application.contactConsent) errors.contactConsent = "Consent is required so CabConnect can contact you about your application.";
  return errors;
}

export function toDriverApplicationPayload(application) {
  return {
    full_name: application.fullName.trim(),
    mobile: normalizeIndianMobile(application.mobile),
    whatsapp: normalizeIndianMobile(application.useMobileForWhatsApp ? application.mobile : application.whatsapp),
    city_area: application.cityArea.trim(),
    experience_years: Number(application.experienceYears),
    licence_status: application.licenceStatus,
    badge_status: application.badgeStatus,
    police_verification_certificate: application.policeVerificationCertificate,
    preferred_work_type: application.preferredWorkType,
    preferred_shift: application.preferredShift.trim(),
    languages: application.languages.trim(),
    previous_experience: application.previousExperience.trim(),
    expected_monthly_salary: application.expectedMonthlySalary ? Number(application.expectedMonthlySalary.replaceAll(",", "")) : null,
    additional_information: application.additionalInformation.trim(),
    contact_consent: application.contactConsent,
  };
}

export function buildDriverWhatsAppMessage(application) {
  const data = toDriverApplicationPayload(application);
  return [
    "Hello CabConnect Chennai, I submitted a driver application and would like to follow up.", "",
    `Name: ${data.full_name}`, `Mobile: ${data.mobile}`, `WhatsApp: ${data.whatsapp}`,
    `City / area: ${data.city_area}`, `Experience: ${data.experience_years} years`,
    `Driving licence: ${data.licence_status}`, `Driver badge: ${data.badge_status}`,
    `Preferred work: ${data.preferred_work_type}`, `Preferred shift: ${data.preferred_shift}`,
    `Languages: ${data.languages || "Not provided"}`, `Previous experience: ${data.previous_experience || "Not provided"}`,
    `Expected monthly salary: ${data.expected_monthly_salary ? `₹${data.expected_monthly_salary}` : "Not provided"}`,
    `Additional information: ${data.additional_information || "None"}`,
    "I understand this application is subject to review and is not a job offer.",
  ].join("\n");
}
