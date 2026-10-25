import { useMemo, useState } from "react";
import { buildCabAttachmentMessage, documentFields, emptyAttachedVehicle, initialCabAttachment, validateCabAttachment } from "./cabAttachmentUtils.js";
import { createSubmissionId } from "../lib/supabase";
import { normalizeRequestMobile, submitCustomerRequest } from "../services/customerRequestService";
import "./driverRegistration.css";

const statusOptions = ["Yes", "No", "In progress"];

function InputField({ label, name, form, setForm, errors, type = "text", required = false, placeholder = "", className = "" }) {
  const id = `attach-${name}`;
  return <div className={`driver-field ${className}`}><label htmlFor={id}>{label}{required && <b> *</b>}</label><input id={id} type={type} value={form[name] ?? ""} placeholder={placeholder} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} aria-invalid={Boolean(errors[name])} />{errors[name] && <small className="driver-error">{errors[name]}</small>}</div>;
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
    <section className="driver-hero"><div className="container driver-hero-inner"><div><span className="eyebrow">VEHICLE OWNER ENQUIRY</span><h1>Your cab,<br /><em>connected.</em></h1><p>Start with your contact and vehicle registration. You can add a fleet, documents and driver details when you have them.</p></div><div className="driver-hero-card"><span className="driver-hero-icon">C<span>+</span></span><strong>Quick enquiry, personal review</strong><small>CabConnect will contact you about the next steps.</small></div></div></section>
    <section className="driver-form-section"><div className="container driver-form-layout"><aside className="driver-aside"><span className="eyebrow">CAB ATTACHMENT</span><h2>{review ? "Review your fleet enquiry" : "Add a cab or fleet"}</h2><p>Just share your contact and basic vehicle details to get started. Other information is optional.</p><div className="driver-aside-note"><span>i</span><p>This is a separate service from driver registration. No vehicle or driver is approved automatically.</p></div></aside>
      <div className="driver-form-card">{review ? <section className="driver-review"><span className="driver-step">02 / REVIEW ENQUIRY</span><h2>Review owner and fleet details</h2><p className="driver-review-intro">Confirm to securely save your enquiry for CabConnect. WhatsApp is an optional follow-up after saving.</p>
        <dl className="driver-summary"><div><dt>Owner / contact</dt><dd>{form.ownerName} · {form.ownerMobile}</dd></div><div><dt>Owner type</dt><dd>{form.ownerType || "Not provided"}</dd></div><div><dt>City and area</dt><dd>{[form.city, form.operatingArea].filter(Boolean).join(" · ")}</dd></div><div><dt>Fleet count</dt><dd>{form.vehicles.length} vehicle{form.vehicles.length === 1 ? "" : "s"}</dd></div>{form.vehicles.map((vehicle, index) => <div key={`vehicle-summary-${index}`}><dt>Vehicle {index + 1}</dt><dd>{[vehicle.category, vehicle.model, vehicle.registration].filter(Boolean).join(" · ")}<br />Assigned driver: {vehicle.driverAssigned === "yes" ? `${vehicle.driverName} (${vehicle.driverMobile})` : "Not assigned"}</dd></div>)}</dl>
        {saveError && <p className="driver-save-error" role="alert">{saveError}</p>}{requestId && <p className="driver-sent-status" role="status">Enquiry saved successfully. Reference: {requestId}. WhatsApp is optional; the enquiry is already with our team.</p>}{opened && <p className="driver-sent-status" role="status">WhatsApp opened with your draft. Your enquiry is already saved.</p>}
        <div className="driver-review-actions"><button className="driver-secondary" type="button" onClick={() => { setReview(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit enquiry</button>{!requestId && <button className="driver-submit" type="button" onClick={saveEnquiry} disabled={saving}>{saving ? "Saving enquiry…" : "Confirm and save enquiry"} <span>→</span></button>}{waLink && <a className="driver-submit" href={waLink} target="_blank" rel="noreferrer" onClick={() => setOpened(true)}>Open WhatsApp enquiry <span>↗</span></a>}</div>
      </section> : <form className="driver-application" onSubmit={submit} noValidate>
        <span className="driver-step">QUICK ENQUIRY</span><h2>Cab attachment enquiry</h2><p className="driver-form-intro">Only your name, mobile, city and vehicle details are required. The rest is optional.</p>
        <div className="attachment-two-column"><section className="driver-subsection attachment-first"><div className="driver-step-heading"><span>1</span><div><strong>Owner details</strong><small>Your personal or company information</small></div></div><div className="driver-form-grid">
          <InputField label="Owner / fleet contact name" name="ownerName" form={form} setForm={setForm} errors={errors} required />
          <InputField label="Mobile number" name="ownerMobile" form={form} setForm={setForm} errors={errors} required type="tel" placeholder="+91 98765 43210" />
          <div className="driver-field driver-field-full"><label className="driver-check"><input type="checkbox" checked={form.useMobileForWhatsapp} onChange={(e) => setForm((current) => ({ ...current, useMobileForWhatsapp: e.target.checked }))} /> Use the mobile number for WhatsApp</label></div>
          {!form.useMobileForWhatsapp && <InputField label="WhatsApp number" name="ownerWhatsapp" form={form} setForm={setForm} errors={errors} required type="tel" placeholder="+91 98765 43210" />}
          <InputField label="Email address" name="ownerEmail" form={form} setForm={setForm} errors={errors} type="email" placeholder="Optional" />
          <InputField label="City" name="city" form={form} setForm={setForm} errors={errors} required placeholder="e.g. Chennai" />
          <InputField label="Operating area (optional)" name="operatingArea" form={form} setForm={setForm} errors={errors} placeholder="e.g. Anna Nagar, airport" />
          <div className="driver-field"><label htmlFor="attach-ownerType">Owner type (optional)</label><select id="attach-ownerType" value={form.ownerType} onChange={(e) => setForm((current) => ({ ...current, ownerType: e.target.value }))}><option value="">Choose owner type</option><option>Individual owner</option><option>Fleet operator / company</option></select></div>
        </div></section>
        <section className="driver-subsection"><div className="attachment-section-title"><div className="driver-step-heading"><span>2</span><div><strong>Vehicle details</strong><small>Each car is reviewed separately</small></div></div><button type="button" className="attachment-add-button" onClick={() => setForm((current) => current.vehicles.length < 10 ? ({ ...current, vehicles: [...current.vehicles, emptyAttachedVehicle()] }) : current)} disabled={form.vehicles.length >= 10}>＋ Add vehicle</button></div><p className="attachment-instruction">List each vehicle and its documents. Assign its driver on the same vehicle card.</p>
          {errors.vehicles && <small className="driver-error">{errors.vehicles}</small>}
          <div className="attachment-vehicles">{form.vehicles.map((vehicle, index) => <article className="attachment-vehicle-card" key={`vehicle-${index}`}><div className="attachment-vehicle-head"><span className="driver-step">VEHICLE {String(index + 1).padStart(2, "0")}</span>{form.vehicles.length > 1 && <button className="attachment-remove-button" type="button" onClick={() => setForm((current) => ({ ...current, vehicles: current.vehicles.filter((_, i) => i !== index) }))}>Remove</button>}</div>
            <div className="driver-form-grid"><div className="driver-field"><label htmlFor={`attach-vehicle-${index}-category`}>Vehicle model <b>*</b></label><select id={`attach-vehicle-${index}-category`} value={vehicle.category} onChange={(e) => updateVehicle(index, "category", e.target.value)}><option value="">Choose vehicle</option><option>Maruti Suzuki Swift Dzire</option><option>Maruti Suzuki Ertiga</option></select>{errors[`vehicle-${index}-category`] && <small className="driver-error">{errors[`vehicle-${index}-category`]}</small>}</div>
              <div className="driver-field"><label htmlFor={`attach-vehicle-${index}-registration`}>Registration number <b>*</b></label><input id={`attach-vehicle-${index}-registration`} value={vehicle.registration} placeholder="TN 00 AB 1234" onChange={(e) => updateVehicle(index, "registration", e.target.value.toUpperCase())} />{errors[`vehicle-${index}-registration`] && <small className="driver-error">{errors[`vehicle-${index}-registration`]}</small>}</div>
              <div className="driver-field"><label htmlFor={`attach-vehicle-${index}-commercial`}>Commercial registration status <b>*</b></label><select id={`attach-vehicle-${index}-commercial`} value={vehicle.commercial} onChange={(e) => updateVehicle(index, "commercial", e.target.value)}><option value="">Choose status</option>{statusOptions.map((value) => <option key={value}>{value}</option>)}</select>{errors[`vehicle-${index}-commercial`] && <small className="driver-error">{errors[`vehicle-${index}-commercial`]}</small>}</div>
            </div>
            <fieldset className="driver-fieldset attachment-docs"><legend>Vehicle documents (optional)</legend><div className="driver-form-grid">{documentFields.map(([key, label]) => <div className="driver-field" key={key}><label htmlFor={`attach-vehicle-${index}-${key}`}>{label}</label><select id={`attach-vehicle-${index}-${key}`} value={vehicle[key]} onChange={(e) => updateVehicle(index, key, e.target.value)}><option value="">Choose status</option>{statusOptions.map((value) => <option key={value}>{value}</option>)}</select></div>)}</div></fieldset>
            <fieldset className="driver-fieldset attachment-driver"><legend><span className="attachment-mini-step">3</span> Assigned driver details</legend><div className="driver-check-grid"><label className="driver-check"><input type="radio" name={`driver-${index}`} checked={vehicle.driverAssigned === "yes"} onChange={() => updateVehicle(index, "driverAssigned", "yes")} />Driver assigned to this vehicle</label><label className="driver-check"><input type="radio" name={`driver-${index}`} checked={vehicle.driverAssigned === "no"} onChange={() => updateVehicle(index, "driverAssigned", "no")} />Not assigned yet</label></div>
              {vehicle.driverAssigned === "yes" && <div className="driver-form-grid attachment-driver-fields"><div className="driver-field"><label htmlFor={`attach-vehicle-${index}-driverName`}>Assigned driver name <b>*</b></label><input id={`attach-vehicle-${index}-driverName`} value={vehicle.driverName} onChange={(e) => updateVehicle(index, "driverName", e.target.value)} />{errors[`vehicle-${index}-driverName`] && <small className="driver-error">{errors[`vehicle-${index}-driverName`]}</small>}</div><div className="driver-field"><label htmlFor={`attach-vehicle-${index}-driverMobile`}>Driver mobile <b>*</b></label><input id={`attach-vehicle-${index}-driverMobile`} type="tel" value={vehicle.driverMobile} placeholder="+91 98765 43210" onChange={(e) => updateVehicle(index, "driverMobile", e.target.value)} />{errors[`vehicle-${index}-driverMobile`] && <small className="driver-error">{errors[`vehicle-${index}-driverMobile`]}</small>}</div><div className="driver-field"><label htmlFor={`attach-vehicle-${index}-licence`}>Valid driving licence <b>*</b></label><select id={`attach-vehicle-${index}-licence`} value={vehicle.licence} onChange={(e) => updateVehicle(index, "licence", e.target.value)}><option value="">Choose status</option>{statusOptions.map((value) => <option key={value}>{value}</option>)}</select>{errors[`vehicle-${index}-licence`] && <small className="driver-error">{errors[`vehicle-${index}-licence`]}</small>}</div><div className="driver-field"><label htmlFor={`attach-vehicle-${index}-badge`}>Driver badge <b>*</b></label><select id={`attach-vehicle-${index}-badge`} value={vehicle.badge} onChange={(e) => updateVehicle(index, "badge", e.target.value)}><option value="">Choose status</option>{statusOptions.map((value) => <option key={value}>{value}</option>)}</select>{errors[`vehicle-${index}-badge`] && <small className="driver-error">{errors[`vehicle-${index}-badge`]}</small>}</div><div className="driver-field"><label htmlFor={`attach-vehicle-${index}-experience`}>Driving experience, years <b>*</b></label><input id={`attach-vehicle-${index}-experience`} type="number" min="0" max="60" value={vehicle.experience} onChange={(e) => updateVehicle(index, "experience", e.target.value)} />{errors[`vehicle-${index}-experience`] && <small className="driver-error">{errors[`vehicle-${index}-experience`]}</small>}</div></div>}
            </fieldset>
          </article>)}</div>
        </section></div>
        <section className="driver-consents"><div className="driver-step-heading"><span>5</span><div><strong>Consent</strong><small>Review and submit</small></div></div><label className="driver-check"><input type="checkbox" checked={form.consent} onChange={(e) => setForm((current) => ({ ...current, consent: e.target.checked }))} />I agree that CabConnect may contact me to review this vehicle attachment enquiry. No vehicle is approved automatically. <b>*</b></label>{errors.consent && <small className="driver-error">{errors.consent}</small>}</section>
        <p className="driver-privacy-note">Your details are saved securely for authorised CabConnect review after you confirm. WhatsApp is optional.</p><button className="driver-submit driver-review-button" type="submit">Review cab attachment <span>→</span></button>
      </form>}</div>
    </div></section>
  </div>;
}
