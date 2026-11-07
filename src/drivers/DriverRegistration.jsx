import { useEffect, useMemo, useRef, useState } from "react";
import {
  BADGE_STATUSES, initialDriverApplication, LICENCE_STATUSES, toDriverApplicationPayload,
  validateDriverApplication, WORK_TYPES, buildDriverWhatsAppMessage,
} from "./driverRegistrationUtils.js";
import { supabaseConfigured } from "../lib/supabase";
import { submitDriverApplication } from "../services/driverApplicationService";
import { limitPhoneDigits } from "../utils/phoneInput.js";
import "./driverRegistration.css";
import "./driverRegistrationPage.css";

const DRIVER_HERO_VIDEO = "https://videos.pexels.com/video-files/9935078/9935078-uhd_3840_2160_30fps.mp4";

function updatePointerPosition(event) {
  if (event.pointerType === "touch") return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  event.currentTarget.style.setProperty("--spot-x", `${(x * 100).toFixed(1)}%`);
  event.currentTarget.style.setProperty("--spot-y", `${(y * 100).toFixed(1)}%`);
  event.currentTarget.style.setProperty("--tilt-x", `${((0.5 - y) * 4).toFixed(2)}deg`);
  event.currentTarget.style.setProperty("--tilt-y", `${((x - 0.5) * 5).toFixed(2)}deg`);
}

function resetPointerPosition(event) {
  event.currentTarget.style.setProperty("--spot-x", "50%");
  event.currentTarget.style.setProperty("--spot-y", "50%");
  event.currentTarget.style.setProperty("--tilt-x", "0deg");
  event.currentTarget.style.setProperty("--tilt-y", "0deg");
}

function moveMagneticButton(event) {
  if (event.pointerType === "touch") return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mag-x", `${((event.clientX - rect.left - rect.width / 2) * 0.08).toFixed(1)}px`);
  event.currentTarget.style.setProperty("--mag-y", `${((event.clientY - rect.top - rect.height / 2) * 0.08).toFixed(1)}px`);
}

function resetMagneticButton(event) {
  event.currentTarget.style.setProperty("--mag-x", "0px");
  event.currentTarget.style.setProperty("--mag-y", "0px");
}

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
  const pageRef = useRef(null);
  const videoRef = useRef(null);
  const [form, setForm] = useState(initialDriverApplication);
  const [errors, setErrors] = useState({});
  const [review, setReview] = useState(false);
  const [optionalDetailsOpen, setOptionalDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [website, setWebsite] = useState("");
  const message = useMemo(() => buildDriverWhatsAppMessage(form), [form]);
  const normalizedNumber = String(whatsappNumber || "").replace(/\D/g, "");
  const whatsappUrl = normalizedNumber && applicationId
    ? `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(`${message}\n\nApplication reference: ${applicationId}`)}` : "";
  const requiredProgressFields = ["fullName", "mobile", "cityArea", "experienceYears", "licenceStatus", "badgeStatus", "policeVerificationCertificate", "preferredWorkType", "preferredShift", "contactConsent"];
  const progress = Math.round(requiredProgressFields.filter((field) => String(form[field] ?? "").trim()).length / requiredProgressFields.length * 100);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const revealItems = root.querySelectorAll("[data-driver-reveal]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) item.classList.add("is-visible");
      else observer.observe(item);
    });
    return () => observer.disconnect();
  }, [review, applicationId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 700px)");
    const syncPlayback = () => {
      if (reduceMotion.matches || mobile.matches) {
        video.pause();
        return;
      }
      video.play().catch(() => { video.dataset.videoUnavailable = "true"; });
    };
    syncPlayback();
    reduceMotion.addEventListener?.("change", syncPlayback);
    mobile.addEventListener?.("change", syncPlayback);
    video.addEventListener("error", () => { video.dataset.videoUnavailable = "true"; }, { once: true });
    return () => {
      reduceMotion.removeEventListener?.("change", syncPlayback);
      mobile.removeEventListener?.("change", syncPlayback);
    };
  }, []);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: name === "mobile" || name === "whatsapp" ? limitPhoneDigits(value) : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSaveError("");
  }

  function reviewApplication(event) {
    event.preventDefault();
    const nextErrors = validateDriverApplication(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstError = Object.keys(nextErrors)[0];
      const optionalFields = ["languages", "expectedMonthlySalary", "previousExperience", "additionalInformation"];
      if (optionalFields.includes(firstError)) {
        setOptionalDetailsOpen(true);
        requestAnimationFrame(() => document.getElementById(`driver-${firstError}`)?.focus());
      } else {
        document.getElementById(`driver-${firstError}`)?.focus();
      }
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

  return <div id="driver-career-page" className="driver-page driver-registration-redesign" ref={pageRef}>
    <section className="driver-hero driver-cinematic-hero" onPointerMove={(event) => {
      if (event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--hero-pointer-x", `${event.clientX - rect.left}px`);
      event.currentTarget.style.setProperty("--hero-pointer-y", `${event.clientY - rect.top}px`);
    }}>
      <video ref={videoRef} className="driver-hero-video" autoPlay muted loop playsInline preload="none" poster="/driver-recruitment-hero.jpg" aria-hidden="true" tabIndex={-1} onError={(event) => { event.currentTarget.dataset.videoUnavailable = "true"; }}>
        <source src={DRIVER_HERO_VIDEO} type="video/mp4" />
      </video>
      <div className="driver-hero-overlay" aria-hidden="true" />
      <div className="driver-road-lines" aria-hidden="true"><i /><i /><i /></div>
      <div className="container driver-hero-inner">
        <div className="driver-hero-copy" data-driver-reveal><span className="driver-eyebrow"><i /> CABCONNECT · DRIVER CAREERS · CHENNAI</span><h1>Your Drive.<br /><em>Your Freedom.</em><br />Your Future.</h1><p>Join CabConnect Chennai and connect with new driving opportunities. Register your details and become part of our growing driver network.</p><div className="driver-hero-actions"><a className="driver-hero-cta" href="#driver-application" onPointerMove={moveMagneticButton} onPointerLeave={resetMagneticButton}>Register as a Driver <span aria-hidden="true">↘</span></a><a className="driver-hero-secondary" href="#driver-opportunities">Explore Opportunities <span aria-hidden="true">↓</span></a></div><div className="driver-hero-trust"><span><i aria-hidden="true">01</i> Flexible driving opportunities</span><span><i aria-hidden="true">02</i> Simple registration process</span><span><i aria-hidden="true">03</i> Direct connection with CabConnect</span></div></div>
      </div>
    </section>
    <section className="driver-opportunities" id="driver-opportunities" aria-label="Driver opportunities">
      <div className="container driver-opportunities-inner">
        <div className="driver-opportunities-intro" data-driver-reveal><span className="driver-section-kicker">A BETTER WAY TO DRIVE</span><h2>Built around the way<br /><em>you want to work.</em></h2></div>
        <div className="driver-benefit-grid">
          <article className="driver-benefit-card" data-driver-reveal onPointerMove={updatePointerPosition} onPointerLeave={resetPointerPosition}><span className="driver-benefit-index">01</span><span className="driver-benefit-icon" aria-hidden="true">↗</span><h3>Flexible opportunities</h3><p>Share the schedule and work type that fit your life.</p></article>
          <article className="driver-benefit-card" data-driver-reveal onPointerMove={updatePointerPosition} onPointerLeave={resetPointerPosition}><span className="driver-benefit-index">02</span><span className="driver-benefit-icon" aria-hidden="true">◎</span><h3>Simple registration</h3><p>Submit your details, review them, then send your application.</p></article>
          <article className="driver-benefit-card" data-driver-reveal onPointerMove={updatePointerPosition} onPointerLeave={resetPointerPosition}><span className="driver-benefit-index">03</span><span className="driver-benefit-icon" aria-hidden="true">⌁</span><h3>Direct connection</h3><p>Our local team reviews your application and follows up.</p></article>
        </div>
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
          </section> : review ? <section className="driver-review" aria-labelledby="driver-review-title" data-driver-reveal>
            <span className="driver-step">02 / REVIEW APPLICATION</span><h2 id="driver-review-title">Check your details</h2><p className="driver-review-intro">Confirm to securely submit this driver application to CabConnect for review.</p>
            <dl className="driver-summary">{summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <div className="driver-consent-note">You consented to be contacted about this application. Your details are shared with authorised CabConnect administrators for recruitment review.</div>
            {saveError && <p className="driver-save-error" role="alert">{saveError}</p>}
            <div className="driver-review-actions"><button className="driver-secondary" type="button" onClick={() => { setReview(false); setSaveError(""); }}>Edit application</button><button className="driver-submit" type="button" onClick={submitApplication} disabled={saving}>{saving ? "Saving application…" : "Confirm and submit"}<span aria-hidden="true">→</span></button></div>
          </section> : <form className="driver-application" noValidate onSubmit={reviewApplication}>
            <div className="driver-form-heading" data-driver-reveal><div><span className="driver-step">CABCONNECT DRIVER NETWORK · APPLICATION</span><h2>Tell us about yourself</h2><p className="driver-form-intro">A few details help us understand your experience and preferred work.</p></div><div className="driver-progress-ring" role="progressbar" aria-label="Registration completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress} style={{ "--progress-angle": `${progress * 3.6}deg` }}><span><strong>{progress}%</strong><small>complete</small></span></div></div>
            <div className="driver-progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
            <div className="driver-application-columns">
              <section className="driver-application-panel">
                <div className="driver-step-heading"><span>1</span><div><strong>Contact details</strong><small>How our team can reach you</small></div></div>
                <div className="driver-form-grid driver-personal-grid">
                  <Field label="Full name" name="fullName" error={errors.fullName} required>{(id) => <input id={id} autoComplete="name" maxLength="100" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} aria-invalid={Boolean(errors.fullName)} />}</Field>
                  <Field label="Mobile number" name="mobile" error={errors.mobile} required>{(id) => <input id={id} type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number" placeholder="10-digit mobile number" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} aria-invalid={Boolean(errors.mobile)} />}</Field>
                  <Field label="City and operating area" name="cityArea" error={errors.cityArea} required>{(id) => <input id={id} autoComplete="address-level2" maxLength="120" placeholder="e.g. Chennai, Velachery" value={form.cityArea} onChange={(e) => update("cityArea", e.target.value)} aria-invalid={Boolean(errors.cityArea)} />}</Field>
                  <Field label="WhatsApp number" name="whatsapp" error={errors.whatsapp} required={!form.useMobileForWhatsApp}>{(id) => <div className="driver-phone-field"><input id={id} type="tel" inputMode="numeric" autoComplete="tel-national" pattern={form.useMobileForWhatsApp ? undefined : "[6-9][0-9]{9}"} title="Enter a valid 10-digit Indian mobile number" placeholder={form.useMobileForWhatsApp ? "Same as mobile number" : "10-digit WhatsApp number"} value={form.useMobileForWhatsApp ? form.mobile : form.whatsapp} readOnly={form.useMobileForWhatsApp} onChange={(e) => update("whatsapp", e.target.value)} aria-invalid={Boolean(errors.whatsapp)} /><label className="driver-check"><input type="checkbox" checked={form.useMobileForWhatsApp} onChange={(e) => update("useMobileForWhatsApp", e.target.checked)} /> Same as mobile</label></div>}</Field>
                </div>
              </section>
              <section className="driver-application-panel">
                <div className="driver-step-heading"><span>2</span><div><strong>Driving qualifications</strong><small>Your experience and required credentials</small></div></div>
                <div className="driver-form-grid driver-work-grid">
                  <Field label="Professional driving experience (years)" name="experienceYears" error={errors.experienceYears} required>{(id) => <input id={id} type="number" min="0" max="60" step="1" inputMode="numeric" value={form.experienceYears} onChange={(e) => update("experienceYears", e.target.value)} aria-invalid={Boolean(errors.experienceYears)} />}</Field>
                  <Field label="Driving licence status" name="licenceStatus" error={errors.licenceStatus} required>{(id) => <select id={id} value={form.licenceStatus} onChange={(e) => update("licenceStatus", e.target.value)} aria-invalid={Boolean(errors.licenceStatus)}><option value="">Choose status</option>{LICENCE_STATUSES.map((value) => <option key={value}>{value}</option>)}</select>}</Field>
                  <Field label="Driver badge status" name="badgeStatus" error={errors.badgeStatus} required>{(id) => <select id={id} value={form.badgeStatus} onChange={(e) => update("badgeStatus", e.target.value)} aria-invalid={Boolean(errors.badgeStatus)}><option value="">Choose status</option>{BADGE_STATUSES.map((value) => <option key={value}>{value}</option>)}</select>}</Field>
                  <Field label="Police verification certificate" name="policeVerificationCertificate" error={errors.policeVerificationCertificate} required>{(id) => <select id={id} value={form.policeVerificationCertificate} onChange={(e) => update("policeVerificationCertificate", e.target.value)} aria-invalid={Boolean(errors.policeVerificationCertificate)}><option value="">Choose Yes or No</option><option value="Yes">Yes</option><option value="No">No</option></select>}</Field>
                </div>
              </section>
              <section className="driver-application-panel">
                <div className="driver-step-heading"><span>3</span><div><strong>Work preferences</strong><small>Tell us what schedule suits you</small></div></div>
                <div className="driver-form-grid driver-work-grid">
                  <Field label="Preferred work type" name="preferredWorkType" error={errors.preferredWorkType} required>{(id) => <select id={id} value={form.preferredWorkType} onChange={(e) => update("preferredWorkType", e.target.value)} aria-invalid={Boolean(errors.preferredWorkType)}><option value="">Choose work type</option>{WORK_TYPES.map((value) => <option key={value}>{value}</option>)}</select>}</Field>
                  <Field label="Preferred shift / availability" name="preferredShift" error={errors.preferredShift} required>{(id) => <input id={id} maxLength="120" placeholder="e.g. Day shift, 8 am–6 pm" value={form.preferredShift} onChange={(e) => update("preferredShift", e.target.value)} aria-invalid={Boolean(errors.preferredShift)} />}</Field>
                </div>
              </section>
            </div>
            <details className="driver-optional-details" open={optionalDetailsOpen} onToggle={(event) => setOptionalDetailsOpen(event.currentTarget.open)}>
              <summary>Share more about yourself <span>Optional details help us understand your application</span></summary>
              <div className="driver-form-grid driver-optional-grid">
                <Field label="Languages known" name="languages" error={errors.languages}>{(id) => <input id={id} maxLength="120" placeholder="e.g. Tamil, English, Telugu" value={form.languages} onChange={(e) => update("languages", e.target.value)} />}</Field>
                <Field label="Expected monthly salary" name="expectedMonthlySalary" error={errors.expectedMonthlySalary}>{(id) => <input id={id} type="number" min="1" max="1000000" step="1000" inputMode="numeric" placeholder="₹ per month" value={form.expectedMonthlySalary} onChange={(e) => update("expectedMonthlySalary", e.target.value)} />}</Field>
                <Field label="Previous driving experience or employer" name="previousExperience" error={errors.previousExperience} className="driver-field-full">{(id) => <textarea id={id} rows="3" maxLength="1000" placeholder="Share relevant experience" value={form.previousExperience} onChange={(e) => update("previousExperience", e.target.value)} />}</Field>
                <Field label="Anything else we should know" name="additionalInformation" error={errors.additionalInformation} className="driver-field-full">{(id) => <textarea id={id} rows="3" maxLength="1000" placeholder="Add any other information about your availability or experience" value={form.additionalInformation} onChange={(e) => update("additionalInformation", e.target.value)} />}</Field>
              </div>
            </details>
            <section className="driver-consents" aria-label="Application consent"><label className="driver-check"><input type="checkbox" checked={form.contactConsent} onChange={(e) => update("contactConsent", e.target.checked)} />I confirm my details are correct and CabConnect may contact me about this driver application. <b>*</b></label>{errors.contactConsent && <small className="driver-error">{errors.contactConsent}</small>}</section>
            <label className="driver-honeypot" aria-hidden="true" tabIndex="-1">Leave this field empty<input type="text" name="website" autoComplete="off" tabIndex="-1" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
            <p className="driver-privacy-note">Your details are shared only with authorised CabConnect administrators for recruitment review.</p>
            <button className="driver-submit driver-review-button" type="submit">Review application <span aria-hidden="true">→</span></button>
          </form>}
        </div>
      </div>
    </section>
  </div>;
}
