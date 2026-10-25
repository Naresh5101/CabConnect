import { useMemo, useState } from "react";
import {
  BADGE_STATUSES, initialDriverApplication, LICENCE_STATUSES, toDriverApplicationPayload,
  validateDriverApplication, WORK_TYPES, buildDriverWhatsAppMessage,
} from "./driverRegistrationUtils.js";
import { supabaseConfigured } from "../lib/supabase";
import { submitDriverApplication } from "../services/driverApplicationService";
import "./driverRegistration.css";

async function submissionErrorMessage(error) {
  const response = typeof Response !== "undefined" && error?.context instanceof Response ? error.context : null;
  const body = response ? await response.clone().json().catch(() => ({})) : {};
  if (body?.error) return body.error;
  if (response?.status === 404 || error?.status === 404) return "The driver application service is not deployed to the Supabase project configured for this site. No application was saved.";
  if ([401, 403].includes(response?.status || error?.status)) return "Supabase rejected the driver application request. Check that the deployed function allows public submissions (verify_jwt = false) and is deployed to the configured project. No application was saved.";
  if (error?.name === "FunctionsFetchError") return "Supabase currently reports that the driver application function was not found in the configured project. Deploy submit-driver-application, then check its CORS origin if the request still fails. No application was confirmed saved.";
  if (error?.name === "FunctionsRelayError") return "Supabase could not route this request to the driver application service. Check that the function is deployed and healthy in the configured project. No application was confirmed saved.";
  return error?.message || "We could not save your application. Check your connection and try again.";
}

function Field({ label, name, error, required, children, className = "" }) {
  const id = `driver-${name}`;
  return <div className={`driver-field ${className}`}>
    <label htmlFor={id}>{label}{required && <b aria-hidden="true"> *</b>}</label>
    {typeof children === "function" ? children(id) : children}
    {error && <small className="driver-error" id={`${id}-error`}>{error}</small>}
  </div>;
}

export default function DriverRegistration({ whatsappNumber }) {
  const [form, setForm] = useState(initialDriverApplication);
  const [errors, setErrors] = useState({});
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [website, setWebsite] = useState("");
  const message = useMemo(() => buildDriverWhatsAppMessage(form), [form]);
  const normalizedNumber = String(whatsappNumber || "").replace(/\D/g, "");
  const whatsappUrl = normalizedNumber && applicationId
    ? `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(`${message}\n\nApplication reference: ${applicationId}`)}` : "";

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSaveError("");
  }

  function reviewApplication(event) {
    event.preventDefault();
    const nextErrors = validateDriverApplication(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(`driver-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    setReview(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitApplication() {
    if (!supabaseConfigured) {
      setSaveError("Online applications are not configured yet. Please contact CabConnect directly; no application has been saved.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const result = await submitDriverApplication(toDriverApplicationPayload(form), website);
      setApplicationId(result.applicationId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSaveError(await submissionErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const summary = [
    ["Full name", form.fullName], ["Mobile", form.mobile],
    ["WhatsApp", form.useMobileForWhatsApp ? `Same as mobile (${form.mobile})` : form.whatsapp],
    ["City / operating area", form.cityArea], ["Driving experience", `${form.experienceYears} years`],
    ["Driving licence", form.licenceStatus], ["Driver badge", form.badgeStatus],
    ["Police verification certificate", form.policeVerificationCertificate],
    ["Preferred work type", form.preferredWorkType], ["Preferred shift", form.preferredShift],
    ["Languages", form.languages || "Not provided"], ["Previous experience", form.previousExperience || "Not provided"],
    ["Expected monthly salary", form.expectedMonthlySalary ? `₹${form.expectedMonthlySalary}` : "Not provided"],
    ["Additional information", form.additionalInformation || "Not provided"],
  ];

  return <div className="driver-page">
    <section className="driver-hero">
      <div className="container driver-hero-inner">
        <div className="driver-hero-copy"><span className="eyebrow">CABCONNECT · DRIVER CAREERS · CHENNAI</span><h1>Good journeys<br /><em>start with good people.</em></h1><p>Bring your driving experience to a local team that values reliability, care and a great ride. Tell us what you’re looking for and we’ll take it from there.</p><a className="driver-hero-cta" href="#driver-application">Start your application <span aria-hidden="true">↘</span></a><div className="driver-hero-trust"><span><i aria-hidden="true">✓</i> Private application</span><span><i aria-hidden="true">✓</i> Review before you submit</span><span><i aria-hidden="true">✓</i> Local team follow-up</span></div></div>
        <div className="driver-hero-card"><img src="/driver-recruitment-hero.jpg" alt="CabConnect driver ready to begin a journey" /><div className="driver-hero-photo-caption"><span>DRIVE WITH PURPOSE</span><strong>Make every trip count.</strong></div><span className="driver-hero-stamp">C<span>+</span></span></div>
      </div>
    </section>
    <section className="driver-form-section driver-registration-page" id="driver-application">
      <div className="container driver-form-layout">
        <div className="driver-form-card">
          {applicationId ? <section className="driver-review" aria-labelledby="driver-success-title">
            <span className="driver-step">APPLICATION SAVED</span><h2 id="driver-success-title">Thank you, {form.fullName.trim()}.</h2>
            <p className="driver-review-intro" role="status">Your application has been saved successfully. Our authorised team can now review it and contact you.</p>
            <div className="driver-application-reference"><span>Application reference</span><strong>{applicationId}</strong></div>
            <div className="driver-consent-note">Your application is under review. This confirmation does not guarantee selection or employment.</div>
            {whatsappUrl && <div className="driver-review-actions"><a className="driver-submit" href={whatsappUrl} target="_blank" rel="noreferrer">Contact CabConnect on WhatsApp <span aria-hidden="true">↗</span></a></div>}
          </section> : review ? <section className="driver-review" aria-labelledby="driver-review-title">
            <span className="driver-step">02 / REVIEW APPLICATION</span><h2 id="driver-review-title">Check your details</h2><p className="driver-review-intro">Confirm to securely submit this driver application to CabConnect for review.</p>
            <dl className="driver-summary">{summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <div className="driver-consent-note">You consented to be contacted about this application. Your details are shared with authorised CabConnect administrators for recruitment review.</div>
            {saveError && <p className="driver-save-error" role="alert">{saveError}</p>}
            <div className="driver-review-actions"><button className="driver-secondary" type="button" onClick={() => { setReview(false); setSaveError(""); }}>Edit application</button><button className="driver-submit" type="button" onClick={submitApplication} disabled={saving}>{saving ? "Saving application…" : "Confirm and submit"}<span aria-hidden="true">→</span></button></div>
          </section> : <form className="driver-application" noValidate onSubmit={reviewApplication}>
            <span className="driver-step">DRIVER CAREERS · APPLICATION</span><h2>Tell us about yourself</h2><p className="driver-form-intro">Complete your details below, then review your application before submitting.</p>
            <div className="driver-application-columns">
              <section className="driver-application-panel">
                <div className="driver-step-heading"><span>1</span><div><strong>Personal details</strong><small>Your contact and service area</small></div></div>
                <div className="driver-form-grid driver-personal-grid">
                  <Field label="Full name" name="fullName" error={errors.fullName} required>{(id) => <input id={id} autoComplete="name" maxLength="100" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} aria-invalid={Boolean(errors.fullName)} />}</Field>
                  <Field label="Mobile number" name="mobile" error={errors.mobile} required>{(id) => <input id={id} type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} aria-invalid={Boolean(errors.mobile)} />}</Field>
                  <div className="driver-field driver-field-full"><label className="driver-check"><input type="checkbox" checked={form.useMobileForWhatsApp} onChange={(e) => update("useMobileForWhatsApp", e.target.checked)} /> Same as mobile number</label></div>
                  {!form.useMobileForWhatsApp && <Field label="WhatsApp number" name="whatsapp" error={errors.whatsapp} required>{(id) => <input id={id} type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} aria-invalid={Boolean(errors.whatsapp)} />}</Field>}
                  <Field label="City and operating area" name="cityArea" error={errors.cityArea} required>{(id) => <input id={id} autoComplete="address-level2" maxLength="120" placeholder="e.g. Chennai, Velachery" value={form.cityArea} onChange={(e) => update("cityArea", e.target.value)} aria-invalid={Boolean(errors.cityArea)} />}</Field>
                  <Field label="Languages known (optional)" name="languages" error={errors.languages}>{(id) => <input id={id} maxLength="120" placeholder="e.g. Tamil, English, Telugu" value={form.languages} onChange={(e) => update("languages", e.target.value)} />}</Field>
                  <Field label="Expected monthly salary (optional)" name="expectedMonthlySalary" error={errors.expectedMonthlySalary}>{(id) => <input id={id} type="number" min="1" max="1000000" step="1000" inputMode="numeric" placeholder="₹ per month" value={form.expectedMonthlySalary} onChange={(e) => update("expectedMonthlySalary", e.target.value)} />}</Field>
                </div>
              </section>
              <section className="driver-application-panel">
                <div className="driver-step-heading"><span>2</span><div><strong>Experience and preferences</strong><small>Credentials, shifts and work type</small></div></div>
                <div className="driver-form-grid driver-work-grid">
                  <Field label="Professional driving experience (years)" name="experienceYears" error={errors.experienceYears} required>{(id) => <input id={id} type="number" min="0" max="60" step="1" inputMode="numeric" value={form.experienceYears} onChange={(e) => update("experienceYears", e.target.value)} aria-invalid={Boolean(errors.experienceYears)} />}</Field>
                  <Field label="Driving licence status" name="licenceStatus" error={errors.licenceStatus} required>{(id) => <select id={id} value={form.licenceStatus} onChange={(e) => update("licenceStatus", e.target.value)} aria-invalid={Boolean(errors.licenceStatus)}><option value="">Choose status</option>{LICENCE_STATUSES.map((value) => <option key={value}>{value}</option>)}</select>}</Field>
                  <Field label="Driver badge status" name="badgeStatus" error={errors.badgeStatus} required>{(id) => <select id={id} value={form.badgeStatus} onChange={(e) => update("badgeStatus", e.target.value)} aria-invalid={Boolean(errors.badgeStatus)}><option value="">Choose status</option>{BADGE_STATUSES.map((value) => <option key={value}>{value}</option>)}</select>}</Field>
                  <Field label="Police verification certificate" name="policeVerificationCertificate" error={errors.policeVerificationCertificate} required>{(id) => <select id={id} value={form.policeVerificationCertificate} onChange={(e) => update("policeVerificationCertificate", e.target.value)} aria-invalid={Boolean(errors.policeVerificationCertificate)}><option value="">Choose Yes or No</option><option value="Yes">Yes</option><option value="No">No</option></select>}</Field>
                  <Field label="Preferred work type" name="preferredWorkType" error={errors.preferredWorkType} required>{(id) => <select id={id} value={form.preferredWorkType} onChange={(e) => update("preferredWorkType", e.target.value)} aria-invalid={Boolean(errors.preferredWorkType)}><option value="">Choose work type</option>{WORK_TYPES.map((value) => <option key={value}>{value}</option>)}</select>}</Field>
                  <Field label="Preferred shift / availability" name="preferredShift" error={errors.preferredShift} required>{(id) => <input id={id} maxLength="120" placeholder="e.g. Day shift, 8 am–6 pm" value={form.preferredShift} onChange={(e) => update("preferredShift", e.target.value)} aria-invalid={Boolean(errors.preferredShift)} />}</Field>
                </div>
                <div className="driver-work-extra">
                  <Field label="Previous driving experience or employer (optional)" name="previousExperience" error={errors.previousExperience}>{(id) => <textarea id={id} rows="2" maxLength="1000" placeholder="Share relevant experience" value={form.previousExperience} onChange={(e) => update("previousExperience", e.target.value)} />}</Field>
                  <Field label="Additional information (optional)" name="additionalInformation" error={errors.additionalInformation}>{(id) => <textarea id={id} rows="3" maxLength="1000" placeholder="Anything else you would like us to know" value={form.additionalInformation} onChange={(e) => update("additionalInformation", e.target.value)} />}</Field>
                </div>
                <section className="driver-consents" aria-label="Application consent"><label className="driver-check"><input type="checkbox" checked={form.contactConsent} onChange={(e) => update("contactConsent", e.target.checked)} />I confirm my details are correct and CabConnect may contact me about this driver application. <b>*</b></label>{errors.contactConsent && <small className="driver-error">{errors.contactConsent}</small>}</section>
              </section>
            </div>
            <label className="driver-honeypot" aria-hidden="true" tabIndex="-1">Leave this field empty<input type="text" name="website" autoComplete="off" tabIndex="-1" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
            <p className="driver-privacy-note">Application details are submitted securely for review by authorised CabConnect administrators. No vehicle or cab attachment details are collected.</p>
            <button className="driver-submit driver-review-button" type="submit">Review application <span aria-hidden="true">→</span></button>
          </form>}
        </div>
      </div>
    </section>
  </div>;
}
