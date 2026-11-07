import { useMemo, useState } from "react";
import { attachedVehicleModels, buildCabAttachmentMessage, documentFields, emptyAttachedVehicle, initialCabAttachment, validateCabAttachment } from "./cabAttachmentUtils.js";
import { createSubmissionId } from "../lib/supabase";
import { normalizeRequestMobile, submitCustomerRequest } from "../services/customerRequestService";
import { limitPhoneDigits } from "../utils/phoneInput.js";
import "./driverRegistration.css";
import "./cabAttachment.css";

const statusOptions = ["Yes", "No", "In progress"];

function InputField({ label, name, form, setForm, errors, type = "text", required = false, placeholder = "", className = "" }) {
  const id = `attach-${name}`;
  const isPhone = type === "tel";
  return <div className={`attachment-field ${className}`}><label htmlFor={id}>{label}{required && <b> *</b>}</label><input id={id} type={type} inputMode={isPhone ? "numeric" : undefined} pattern={isPhone ? "[6-9][0-9]{9}" : undefined} autoComplete={isPhone ? "tel-national" : undefined} title={isPhone ? "Enter a valid 10-digit Indian mobile number" : undefined} value={form[name] ?? ""} placeholder={placeholder} onChange={(event) => setForm((current) => ({ ...current, [name]: isPhone ? limitPhoneDigits(event.target.value) : event.target.value }))} aria-invalid={Boolean(errors[name])} />{errors[name] && <small className="attachment-field-error">{errors[name]}</small>}</div>;
}

export default function CabAttachment({ whatsappNumber }) {
  const [form, setForm] = useState(initialCabAttachment);
  const [errors, setErrors] = useState({});
  const [review, setReview] = useState(false);
  const [opened, setOpened] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [submissionId] = useState(createSubmissionId);
  const phone = String(whatsappNumber || "").replace(/\D/g, "");
  const message = useMemo(() => buildCabAttachmentMessage(form), [form]);
  const waLink = phone && requestId ? `https://wa.me/${phone}?text=${encodeURIComponent(`${message}\n\nEnquiry reference: ${requestId}`)}` : "";

  async function saveEnquiry() {
    if (saving || requestId) return;
    setSaving(true);
    setSaveError("");
    try {
      const normalizedData = {
        ...form,
        ownerMobile: normalizeRequestMobile(form.ownerMobile),
        ownerWhatsapp: normalizeRequestMobile(form.useMobileForWhatsapp ? form.ownerMobile : form.ownerWhatsapp),
        vehicles: form.vehicles.map((vehicle) => ({ ...vehicle, driverMobile: vehicle.driverMobile ? normalizeRequestMobile(vehicle.driverMobile) : "" })),
      };
      const savedId = await submitCustomerRequest({ type: "cab_attachment", name: form.ownerName, mobile: form.ownerMobile, consent: form.consent, submissionId, data: normalizedData });
      setRequestId(savedId);
    } catch (cause) {
      setSaveError(cause.message || "We could not save your enquiry. Please try again.");
    } finally { setSaving(false); }
  }

  function updateVehicle(index, key, value) {
    setForm((current) => ({ ...current, vehicles: current.vehicles.map((vehicle, i) => i === index ? { ...vehicle, [key]: value } : vehicle) }));
    setErrors((current) => ({ ...current, [`vehicle-${index}-${key}`]: undefined }));
  }
  function submit(event) {
    event.preventDefault();
    const found = validateCabAttachment(form);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      const match = first.match(/^vehicle-(\d+)-(.+)$/);
      document.getElementById(match ? `attach-vehicle-${match[1]}-${match[2]}` : `attach-${first}`)?.focus();
      return;
    }
    setReview(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <div className="driver-page attachment-page">
    <section className="attachment-hero">
      <div className="attachment-shell attachment-hero-layout">
        <div className="attachment-hero-copy">
          <span className="attachment-eyebrow">CABCONNECT CHENNAI · FLEET PARTNERS</span>
          <h1>Put your cab<br /><em>to work.</em></h1>
          <p>Tell us about your vehicle. Our Chennai team will review your enquiry and get in touch about the next steps.</p>
          <a className="attachment-hero-cta" href="#attachment-form">Start your enquiry <span>↓</span></a>
        </div>
        <div className="attachment-hero-card" aria-label="What happens next">
          <span className="attachment-hero-kicker">SIMPLE, PERSONAL FOLLOW-UP</span>
          <div><b>01</b><span><strong>Share your vehicle</strong><small>Only the essentials to get started</small></span></div>
          <div><b>02</b><span><strong>We review your enquiry</strong><small>Every vehicle is checked by our team</small></span></div>
          <div><b>03</b><span><strong>Hear from us directly</strong><small>We discuss availability and next steps</small></span></div>
        </div>
      </div>
    </section>

    <section className="attachment-main" id="attachment-form">
      <div className="attachment-shell">
        <div className="attachment-form-card">
          {review ? <section className="attachment-review">
            <span className="attachment-kicker">FINAL STEP · REVIEW</span>
            <h2>Check your enquiry</h2>
            <p className="attachment-intro">Confirm to securely save your details for CabConnect. You can also send the saved enquiry by WhatsApp.</p>
            <dl className="attachment-summary">
              <div><dt>Contact</dt><dd>{form.ownerName} · {form.ownerMobile}</dd></div>
              <div><dt>Location</dt><dd>{[form.city, form.operatingArea].filter(Boolean).join(" · ")}</dd></div>
              <div><dt>Fleet</dt><dd>{form.vehicles.length} vehicle{form.vehicles.length === 1 ? "" : "s"}</dd></div>
              {form.vehicles.map((vehicle, index) => <div key={`vehicle-summary-${index}`}><dt>Vehicle {index + 1}</dt><dd>{[vehicle.category, vehicle.model, vehicle.registration].filter(Boolean).join(" · ")}<br />Assigned driver: {vehicle.driverAssigned === "yes" ? `${vehicle.driverName} (${vehicle.driverMobile})` : "Not assigned"}</dd></div>)}
            </dl>
            {saveError && <p className="attachment-alert" role="alert">{saveError}</p>}
            {requestId && <p className="attachment-success" role="status">Enquiry saved successfully. Reference: {requestId}. The enquiry is already with our team.</p>}
            {opened && <p className="attachment-success" role="status">WhatsApp opened with your draft. Your enquiry is already saved.</p>}
            <div className="attachment-review-actions">
              <button className="attachment-secondary" type="button" onClick={() => { setReview(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit details</button>
              {!requestId && <button className="attachment-primary" type="button" onClick={saveEnquiry} disabled={saving}>{saving ? "Saving enquiry…" : "Confirm and save"} <span>→</span></button>}
              {waLink && <a className="attachment-primary" href={waLink} target="_blank" rel="noreferrer" onClick={() => setOpened(true)}>Open WhatsApp <span>↗</span></a>}
            </div>
          </section> : <form className="attachment-form" onSubmit={submit} noValidate>
            <div className="attachment-form-heading">
              <div><span className="attachment-kicker">CAB ATTACHMENT ENQUIRY</span><h2>Start with the essentials</h2></div>
              <span className="attachment-required-note"><b>*</b> Required</span>
            </div>
            <p className="attachment-intro">Share your contact details and add each cab you’d like us to review. Documents and driver details are optional.</p>

            <section className="attachment-form-section">
              <div className="attachment-section-heading"><span>01</span><div><h3>Your contact details</h3><p>So our team knows who to follow up with.</p></div></div>
              <div className="attachment-contact-grid">
                <InputField label="Owner / fleet contact name" name="ownerName" form={form} setForm={setForm} errors={errors} required />
                <InputField label="Mobile number" name="ownerMobile" form={form} setForm={setForm} errors={errors} required type="tel" placeholder="10-digit mobile number" />
                <InputField label="City" name="city" form={form} setForm={setForm} errors={errors} required placeholder="e.g. Chennai" />
              </div>
              <details className="attachment-optional">
                <summary>Add optional contact details</summary>
                <div className="attachment-contact-grid attachment-optional-grid">
                  <div className="attachment-field attachment-field-check"><label><input type="checkbox" checked={form.useMobileForWhatsapp} onChange={(event) => setForm((current) => ({ ...current, useMobileForWhatsapp: event.target.checked }))} /> Use mobile number for WhatsApp</label></div>
                  {!form.useMobileForWhatsapp && <InputField label="WhatsApp number" name="ownerWhatsapp" form={form} setForm={setForm} errors={errors} required type="tel" placeholder="10-digit WhatsApp number" />}
                  <InputField label="Email address" name="ownerEmail" form={form} setForm={setForm} errors={errors} type="email" placeholder="Optional" />
                  <InputField label="Operating area" name="operatingArea" form={form} setForm={setForm} errors={errors} placeholder="e.g. Anna Nagar, airport" />
                  <div className="attachment-field"><label htmlFor="attach-ownerType">Owner type</label><select id="attach-ownerType" value={form.ownerType} onChange={(event) => setForm((current) => ({ ...current, ownerType: event.target.value }))}><option value="">Choose owner type</option><option>Individual owner</option><option>Fleet operator / company</option></select></div>
                </div>
              </details>
            </section>

            <section className="attachment-form-section attachment-vehicles-section">
              <div className="attachment-section-heading attachment-vehicles-heading">
                <span>02</span><div><h3>Your vehicles</h3><p>Add one card for each cab you want us to review.</p></div>
                <button type="button" className="attachment-add-button" onClick={() => setForm((current) => current.vehicles.length < 10 ? ({ ...current, vehicles: [...current.vehicles, emptyAttachedVehicle()] }) : current)} disabled={form.vehicles.length >= 10}>＋ Add vehicle</button>
              </div>
              {errors.vehicles && <small className="attachment-field-error">{errors.vehicles}</small>}
              <div className="attachment-vehicles">
                {form.vehicles.map((vehicle, index) => <article className="attachment-vehicle-card" key={`vehicle-${index}`}>
                  <div className="attachment-vehicle-head"><div><span>VEHICLE {String(index + 1).padStart(2, "0")}</span><strong>Vehicle details</strong></div>{form.vehicles.length > 1 && <button className="attachment-remove-button" type="button" onClick={() => setForm((current) => ({ ...current, vehicles: current.vehicles.filter((_, i) => i !== index) }))}>Remove</button>}</div>
                  <div className="attachment-vehicle-grid">
                    <div className="attachment-field"><label htmlFor={`attach-vehicle-${index}-category`}>Vehicle model <b>*</b></label><select id={`attach-vehicle-${index}-category`} value={vehicle.category} onChange={(event) => { updateVehicle(index, "category", event.target.value); if (event.target.value !== "Other") updateVehicle(index, "model", ""); }} aria-invalid={Boolean(errors[`vehicle-${index}-category`])}><option value="">Choose vehicle</option>{attachedVehicleModels.map((model) => <option key={model}>{model}</option>)}<option value="Other">Other (enter make and model)</option></select>{errors[`vehicle-${index}-category`] && <small className="attachment-field-error">{errors[`vehicle-${index}-category`]}</small>}</div>
                    {vehicle.category === "Other" && <div className="attachment-field"><label htmlFor={`attach-vehicle-${index}-model`}>Make and model <b>*</b></label><input id={`attach-vehicle-${index}-model`} value={vehicle.model} placeholder="e.g. Toyota Glanza" onChange={(event) => updateVehicle(index, "model", event.target.value)} aria-invalid={Boolean(errors[`vehicle-${index}-model`])} />{errors[`vehicle-${index}-model`] && <small className="attachment-field-error">{errors[`vehicle-${index}-model`]}</small>}</div>}
                    <div className="attachment-field"><label htmlFor={`attach-vehicle-${index}-registration`}>Registration number <b>*</b></label><input id={`attach-vehicle-${index}-registration`} value={vehicle.registration} placeholder="TN 00 AB 1234" onChange={(event) => updateVehicle(index, "registration", event.target.value.toUpperCase())} aria-invalid={Boolean(errors[`vehicle-${index}-registration`])} />{errors[`vehicle-${index}-registration`] && <small className="attachment-field-error">{errors[`vehicle-${index}-registration`]}</small>}</div>
                    <div className="attachment-field"><label htmlFor={`attach-vehicle-${index}-commercial`}>Commercial registration <b>*</b></label><select id={`attach-vehicle-${index}-commercial`} value={vehicle.commercial} onChange={(event) => updateVehicle(index, "commercial", event.target.value)} aria-invalid={Boolean(errors[`vehicle-${index}-commercial`])}><option value="">Choose status</option>{statusOptions.map((value) => <option key={value}>{value}</option>)}</select>{errors[`vehicle-${index}-commercial`] && <small className="attachment-field-error">{errors[`vehicle-${index}-commercial`]}</small>}</div>
                  </div>
                  <details className="attachment-optional attachment-vehicle-optional">
                    <summary>Documents and driver details <span>Optional</span></summary>
                    <fieldset className="attachment-documents"><legend>Document status</legend><div className="attachment-document-grid">{documentFields.map(([key, label]) => <div className="attachment-field" key={key}><label htmlFor={`attach-vehicle-${index}-${key}`}>{label}</label><select id={`attach-vehicle-${index}-${key}`} value={vehicle[key]} onChange={(event) => updateVehicle(index, key, event.target.value)}><option value="">Choose status</option>{statusOptions.map((value) => <option key={value}>{value}</option>)}</select></div>)}</div></fieldset>
                    <fieldset className="attachment-driver"><legend>Is a driver assigned to this vehicle?</legend><div className="attachment-driver-options"><label><input type="radio" name={`driver-${index}`} checked={vehicle.driverAssigned === "yes"} onChange={() => updateVehicle(index, "driverAssigned", "yes")} /> Yes, driver assigned</label><label><input type="radio" name={`driver-${index}`} checked={vehicle.driverAssigned === "no"} onChange={() => updateVehicle(index, "driverAssigned", "no")} /> Not yet</label></div>
                      {vehicle.driverAssigned === "yes" && <div className="attachment-driver-grid">
                        <div className="attachment-field"><label htmlFor={`attach-vehicle-${index}-driverName`}>Driver name <b>*</b></label><input id={`attach-vehicle-${index}-driverName`} value={vehicle.driverName} onChange={(event) => updateVehicle(index, "driverName", event.target.value)} aria-invalid={Boolean(errors[`vehicle-${index}-driverName`])} />{errors[`vehicle-${index}-driverName`] && <small className="attachment-field-error">{errors[`vehicle-${index}-driverName`]}</small>}</div>
                        <div className="attachment-field"><label htmlFor={`attach-vehicle-${index}-driverMobile`}>Driver mobile <b>*</b></label><input id={`attach-vehicle-${index}-driverMobile`} type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" autoComplete="tel-national" title="Enter a valid 10-digit Indian mobile number" value={vehicle.driverMobile} placeholder="10-digit mobile number" onChange={(event) => updateVehicle(index, "driverMobile", limitPhoneDigits(event.target.value))} aria-invalid={Boolean(errors[`vehicle-${index}-driverMobile`])} />{errors[`vehicle-${index}-driverMobile`] && <small className="attachment-field-error">{errors[`vehicle-${index}-driverMobile`]}</small>}</div>
                        <div className="attachment-field"><label htmlFor={`attach-vehicle-${index}-licence`}>Driving licence <b>*</b></label><select id={`attach-vehicle-${index}-licence`} value={vehicle.licence} onChange={(event) => updateVehicle(index, "licence", event.target.value)} aria-invalid={Boolean(errors[`vehicle-${index}-licence`])}><option value="">Choose status</option>{statusOptions.map((value) => <option key={value}>{value}</option>)}</select>{errors[`vehicle-${index}-licence`] && <small className="attachment-field-error">{errors[`vehicle-${index}-licence`]}</small>}</div>
                        <div className="attachment-field"><label htmlFor={`attach-vehicle-${index}-badge`}>Driver badge <b>*</b></label><select id={`attach-vehicle-${index}-badge`} value={vehicle.badge} onChange={(event) => updateVehicle(index, "badge", event.target.value)} aria-invalid={Boolean(errors[`vehicle-${index}-badge`])}><option value="">Choose status</option>{statusOptions.map((value) => <option key={value}>{value}</option>)}</select>{errors[`vehicle-${index}-badge`] && <small className="attachment-field-error">{errors[`vehicle-${index}-badge`]}</small>}</div>
                        <div className="attachment-field"><label htmlFor={`attach-vehicle-${index}-experience`}>Experience (years) <b>*</b></label><input id={`attach-vehicle-${index}-experience`} type="number" min="0" max="60" value={vehicle.experience} onChange={(event) => updateVehicle(index, "experience", event.target.value)} aria-invalid={Boolean(errors[`vehicle-${index}-experience`])} />{errors[`vehicle-${index}-experience`] && <small className="attachment-field-error">{errors[`vehicle-${index}-experience`]}</small>}</div>
                      </div>}
                    </fieldset>
                  </details>
                </article>)}
              </div>
            </section>

            <section className="attachment-consent-section">
              <div className="attachment-section-heading"><span>03</span><div><h3>Ready to send?</h3><p>Our team will review your enquiry; this does not approve or attach a vehicle automatically.</p></div></div>
              <label className="attachment-consent"><input id="attach-consent" type="checkbox" checked={form.consent} onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))} />I agree that CabConnect may contact me about this enquiry. <b>*</b></label>
              {errors.consent && <small className="attachment-field-error">{errors.consent}</small>}
              <button className="attachment-primary attachment-review-button" type="submit">Review enquiry <span>→</span></button>
              <p className="attachment-privacy-note">Your details are saved securely for authorised CabConnect review after you confirm.</p>
            </section>
          </form>}
        </div>
      </div>
    </section>
  </div>;
}
