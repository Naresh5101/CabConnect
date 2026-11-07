import { useEffect, useState } from "react";
import { fetchQuoteAuditHistory } from "../../services/farePricingService";
import { asRequestObject, flattenRequestDetails, getRequestVehicles, normalizeRequestData, pickRequestValue } from "./adminRequestPresentation.js";

const money = (value) => Number.isFinite(Number(value)) ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value)) : "—";
const asObject = asRequestObject;
const pick = pickRequestValue;
const readable = (value) => Array.isArray(value) ? value.map((item) => item && typeof item === "object" ? pick(asObject(item), "name", "label", "title") || JSON.stringify(item) : item).join(", ") : typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
const attachmentDocumentLabels = [["rc", "RC"], ["insurance", "Insurance"], ["permit", "Commercial permit"], ["fitness", "Fitness certificate"], ["puc", "Pollution certificate"]];

function isAssigned(value) {
  return value === true || ["yes", "true", "assigned"].includes(String(value || "").toLowerCase());
}

function DetailGrid({ rows }) {
  const present = rows.filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!present.length) return <p className="admin-detail-empty">No recorded details in this section.</p>;
  return <div className="admin-detail-grid">{present.map(([label, value]) => <div className="admin-detail-item" key={label}><span>{label}</span><strong>{readable(value)}</strong></div>)}</div>;
}

function dateTime(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function AdminRequestDetail({ request, onClose, onSave }) {
  const rawData = asObject(request.request_data);
  const data = normalizeRequestData(rawData);
  const isAttachment = request.request_type === "cab_attachment";
  const vehicles = getRequestVehicles(data);
  const estimate = asObject(pick(data, "estimatedFare", "estimate", "fare"));
  const [status, setStatus] = useState(request.status);
  const [quote, setQuote] = useState(request.quoted_amount == null ? "" : String(request.quoted_amount));
  const [quoteNotes, setQuoteNotes] = useState(request.quote_notes || "");
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (isAttachment) return undefined;
    let active = true;
    fetchQuoteAuditHistory(request.request_id).then((rows) => { if (active) setHistory(rows); }).catch((cause) => { if (active) setHistoryError(cause.message || "Quote history is unavailable."); });
    return () => { active = false; };
  }, [isAttachment, request.request_id, request.updated_at]);

  const numericQuote = quote === "" ? null : Number(quote);
  const quoteInvalid = quote !== "" && (!Number.isFinite(numericQuote) || numericQuote < 0 || numericQuote > 9999999999.99);
  const previousQuote = request.quoted_amount == null ? null : Number(request.quoted_amount);
  const difference = numericQuote === null || quoteInvalid ? null : numericQuote - (previousQuote ?? 0);
  const hasChanges = status !== request.status || adminNotes !== (request.admin_notes || "")
    || (!isAttachment && (quote !== (request.quoted_amount == null ? "" : String(request.quoted_amount)) || quoteNotes !== (request.quote_notes || "")));
  const owner = asObject(pick(data, "owner", "contact"));

  const customerRows = [
    ["Name", request.customer_name], ["Mobile", request.mobile], ["Email", pick(data, "email", "customerEmail")],
    ["Booking reference", request.request_id], ["Created", dateTime(request.created_at)],
    ["Contact consent", request.contact_consent ? "Granted" : "Not recorded"],
  ];
  const attachmentOwnerRows = [
    ["Owner", pick(data, "ownerName", "owner_name", "name") || pick(owner, "name", "fullName", "full_name") || request.customer_name],
    ["Mobile", pick(data, "ownerMobile", "owner_mobile", "mobile") || pick(owner, "mobile", "phone") || request.mobile],
    ["Enquiry reference", request.request_id],
    ["Submitted", dateTime(request.created_at)],
    ["WhatsApp", pick(data, "ownerWhatsapp", "owner_whatsapp", "whatsapp") || pick(owner, "whatsapp", "mobile") || request.mobile],
    ["Email", pick(data, "ownerEmail", "owner_email", "email") || pick(owner, "email")],
    ["City", pick(data, "city", "ownerCity", "owner_city") || pick(owner, "city", "location")],
    ["Operating area", pick(data, "operatingArea", "operating_area", "cityArea", "city_area") || pick(owner, "operatingArea", "operating_area")],
    ["Owner type", pick(data, "ownerType", "owner_type", "fleetType", "fleet_type") || pick(owner, "type")],
    ["WhatsApp uses mobile", pick(data, "useMobileForWhatsapp", "use_mobile_for_whatsapp") === undefined ? undefined : pick(data, "useMobileForWhatsapp", "use_mobile_for_whatsapp") ? "Yes" : "No"],
    ["Contact consent", request.contact_consent ? "Granted" : "Not recorded"],
  ];
  const ownerExtraRows = flattenRequestDetails(data, new Set([
    "ownername", "owner_name", "ownermobile", "owner_mobile", "mobile", "ownerwhatsapp", "owner_whatsapp", "whatsapp",
    "owneremail", "owner_email", "email", "city", "ownercity", "owner_city", "operatingarea", "operating_area",
    "cityarea", "city_area", "ownertype", "owner_type", "fleettype", "fleet_type", "usemobileforwhatsapp",
    "use_mobile_for_whatsapp", "owner", "contact", "vehicles", "cabs", "fleetvehicles", "fleet_vehicles",
    "vehicledetails", "vehicle_details", "vehicle", "service", "requesttype", "request_type",
    "formdata", "form_data", "details",
    "name", "mobile", "phone", "email", "city", "location",
    "consent", "contactconsent", "contact_consent",
  ]));
  const requestExtraRows = flattenRequestDetails(data, new Set([
    "email", "customer_email", "customeremail", "service", "serviceName", "service_name", "requesttype", "request_type", "tripType", "trip_type",
    "pickup", "startinglocation", "starting_location", "pickupaddress", "pickup_address",
    "destination", "dropoff", "destinationaddress", "destination_address", "traveldate",
    "pickupdate", "pickup_date", "date", "pickuptime", "pickup_time", "time", "returndate",
    "return_date", "returntraveldate", "return_travel_date", "passengers", "travellers",
    "tripdays", "trip_days", "days", "hours", "vehiclelabel", "vehicle_label", "vehicleid",
    "vehicle_id", "vehiclecategory", "vehicle_category", "vehicle", "notes",
    "additionalinformation", "additional_information", "message", "estimatedfare",
    "estimated_fare", "estimate", "fare", "tollamount", "toll_amount", "tolls",
    "parkingamount", "parking_amount", "parking", "discountamount", "discount_amount",
    "discount", "taxamount", "tax_amount", "tax", "amountpaid", "amount_paid",
    "paidamount", "paid_amount", "outstandingbalance", "outstanding_balance", "balance",
    "packageid", "package_id", "packageName", "package_name", "category", "start", "startcoordinates",
    "start_coordinates", "routedistancekm", "route_distance_km", "consent", "contactconsent",
    "contact_consent",
  ]));
  const tripRows = [
    ["Service type", pick(data, "serviceName", "service_name", "service", "requestType", "tripType") || request.request_type],
    ["Tour package", pick(data, "packageName", "package_name", "packageId", "package_id")],
    ["Tour category", pick(data, "category")],
    ["Pickup", pick(data, "pickup", "startingLocation", "starting_location", "pickupAddress", "pickup_address", "start")],
    ["Destination", pick(data, "destination", "dropoff", "destinationAddress")],
    ["Pickup date", pick(data, "travelDate", "pickupDate", "date")], ["Pickup time", pick(data, "pickupTime", "time")],
    ["Return date", pick(data, "returnDate", "returnTravelDate")], ["Passengers", pick(data, "passengers", "travellers")],
    ["Temples / stops", Array.isArray(data.temples) ? data.temples.map((temple) => typeof temple === "string" ? temple : pick(asObject(temple), "name", "title")).filter(Boolean).join(", ") : undefined],
    ["Vehicle", typeof data.vehicle === "object" && data.vehicle !== null ? pick(asObject(data.vehicle), "label", "name", "model", "id") : pick(data, "vehicleLabel", "vehicle", "vehicleCategory", "vehicleId")],
    ["Vehicle capacity", pick(asObject(data.vehicle), "passengers", "capacity")],
    ["Vehicle identifier", pick(asObject(data.vehicle), "id", "vehicleId", "vehicle_id")],
    ["Distance", pick(estimate, "distanceKm", "roadDistanceKm") !== undefined ? `${pick(estimate, "distanceKm", "roadDistanceKm")} km` : undefined],
    ["Billed distance", estimate.billedDistanceKm !== undefined ? `${estimate.billedDistanceKm} km` : undefined],
    ["Route distance", pick(data, "routeDistanceKm", "route_distance_km") !== undefined ? `${pick(data, "routeDistanceKm", "route_distance_km")} km` : undefined],
    ["Duration", pick(data, "tripDays", "trip_days", "days", "hours") !== undefined ? `${pick(data, "tripDays", "trip_days", "days", "hours")} ${data.hours !== undefined ? "hours" : "days"}` : undefined],
    ["Trip requirement", pick(data, "tripType", "trip_type")],
    ["Customer notes", pick(data, "notes", "additionalInformation", "message")],
  ];
  const financialRows = [
    ["Estimated total", estimate.total], ["Distance charge", estimate.distanceCharge], ["Hourly / day charge", pick(estimate, "hourlyCharge", "dayCharge")],
    ["Driver allowance", estimate.driverAllowance], ["Minimum adjustment", estimate.minimumAdjustment],
    ["Tolls", pick(data, "tollAmount", "tolls")], ["Parking", pick(data, "parkingAmount", "parking")],
    ["Discount", pick(data, "discountAmount", "discount")], ["Tax", pick(data, "taxAmount", "tax")],
    ["Final quoted amount", request.quoted_amount], ["Amount paid", pick(data, "amountPaid", "paidAmount")], ["Outstanding balance", pick(data, "outstandingBalance", "balance")],
  ].map(([label, value]) => [label, value === undefined || value === null || value === "" ? undefined : money(value)]);
  const estimateExtraRows = flattenRequestDetails(estimate, new Set(["total", "distancekm", "road_distance_km", "billeddistancekm", "billed_distance_km", "distancecharge", "distance_charge", "hourlycharge", "hourly_charge", "daycharge", "day_charge", "driverallowance", "driver_allowance", "minimumadjustment", "minimum_adjustment"]));

  async function save(event) {
    event.preventDefault();
    setError(""); setMessage("");
    if (!isAttachment && quoteInvalid) { setError("Enter a quotation amount from ₹0 to ₹9,999,999,999.99."); return; }
    setSaving(true);
    try {
      await onSave(isAttachment
        ? { status, admin_notes: adminNotes }
        : { status, quoted_amount: numericQuote, quote_notes: quoteNotes, admin_notes: adminNotes });
      setMessage(isAttachment ? "Attachment enquiry changes saved." : "Booking changes saved.");
    } catch (cause) { setError(cause.message || "Could not save booking changes."); }
    finally { setSaving(false); }
  }

  return <aside className="admin-panel admin-detail admin-request-detail">
    <div className="admin-detail-head"><span className="admin-record-avatar request large">↗</span><div><span className="admin-eyebrow">{request.request_type.replaceAll("_", " ").toUpperCase()}</span><h2>{request.customer_name}</h2><small>{request.mobile}</small></div><button className="admin-close-modal" type="button" aria-label="Close booking details" onClick={onClose}>×</button></div>
    <section className="admin-detail-section"><h3>{isAttachment ? "Owner & contact" : "Customer details"}</h3><DetailGrid rows={isAttachment ? [...attachmentOwnerRows, ...ownerExtraRows] : customerRows} /></section>
    {isAttachment ? <section className="admin-detail-section"><div className="admin-attachment-section-heading"><h3>Attached vehicles</h3><span>{vehicles.length} submitted</span></div>{vehicles.length ? <div className="admin-attachment-vehicles">{vehicles.map((vehicle, index) => {
      const driverAssigned = isAssigned(pick(vehicle, "driverAssigned", "driver_assigned", "hasDriver", "has_driver"));
      const driverRows = driverAssigned
        ? [["Assigned driver", pick(vehicle, "driverName", "driver_name")], ["Driver mobile", pick(vehicle, "driverMobile", "driver_mobile")], ["Driving licence", pick(vehicle, "licence", "license", "licenceStatus", "licence_status")], ["Driver badge", pick(vehicle, "badge", "badgeStatus", "badge_status")], ["Experience", pick(vehicle, "experience", "experienceYears", "experience_years") ? `${pick(vehicle, "experience", "experienceYears", "experience_years")} years` : undefined]]
        : [["Assigned driver", "Not assigned"]];
      const vehicleKnownKeys = new Set([
        "category", "type", "model", "vehiclemodel", "vehicle_model", "registration", "registrationnumber", "registration_number",
        "vehiclenumber", "vehicle_number", "commercial", "commercialregistration", "commercial_registration", "commercialstatus",
        "commercial_status", "rc", "insurance", "permit", "fitness", "puc", "driverassigned", "driver_assigned", "hasdriver",
        "has_driver", "drivername", "driver_name", "drivermobile", "driver_mobile", "licence", "license", "licencestatus",
        "licence_status", "badgestatus", "badge_status", "badge", "experience", "experienceyears", "experience_years",
      ]);
      const vehicleExtraRows = flattenRequestDetails(vehicle, vehicleKnownKeys);
      return <article className="admin-attachment-vehicle" key={`attachment-vehicle-${index}`}>
        <div className="admin-attachment-vehicle-head"><strong>Vehicle {String(index + 1).padStart(2, "0")}</strong><span>{pick(vehicle, "category") === "Other" ? pick(vehicle, "model") || "Other model not provided" : pick(vehicle, "category", "type", "model", "vehicleModel", "vehicle_model") || "Model not provided"}</span></div>
        <DetailGrid rows={[
          ["Registration", pick(vehicle, "registration", "registrationNumber", "registration_number", "vehicleNumber", "vehicle_number")],
          ["Commercial registration", pick(vehicle, "commercial", "commercialRegistration", "commercial_registration", "commercialStatus", "commercial_status")],
        ]} />
        <div className="admin-attachment-subsection"><strong>Documents</strong><DetailGrid rows={attachmentDocumentLabels.map(([key, label]) => [label, pick(vehicle, key, `${key}Status`, `${key}_status`)])} /></div>
        <div className="admin-attachment-subsection"><strong>Driver</strong><DetailGrid rows={driverRows} /></div>
        {vehicleExtraRows.length > 0 && <div className="admin-attachment-subsection"><strong>Other submitted details</strong><DetailGrid rows={vehicleExtraRows} /></div>}
      </article>;
    })}</div> : <p className="admin-detail-empty">No vehicle details were recorded with this enquiry.</p>}</section>
      : <>
        <section className="admin-detail-section"><h3>Trip details</h3><DetailGrid rows={tripRows} /></section>
        <section className="admin-detail-section"><h3>Financial details</h3><DetailGrid rows={[...financialRows, ...estimateExtraRows]} /></section>
        {requestExtraRows.length > 0 && <section className="admin-detail-section"><h3>Other submitted details</h3><DetailGrid rows={requestExtraRows} /></section>}
      </>}
    <form className="admin-quote-form" onSubmit={save}>
      <section className="admin-detail-section"><h3>{isAttachment ? "Enquiry status & notes" : "Quotation & status"}</h3>
        <label className="admin-edit-field">{isAttachment ? "Enquiry status" : "Booking status"}<select value={status} onChange={(event) => setStatus(event.target.value)}>{["New", "Reviewing", "Quoted", "Contacted", "Confirmed", "Rejected", "Completed"].map((value) => <option key={value}>{value}</option>)}</select></label>
        {!isAttachment && <>
          <label className="admin-edit-field">Final quotation (₹)<input type="number" inputMode="decimal" min="0" max="9999999999.99" step="0.01" value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="Leave blank if not quoted" /></label>
          <div className="admin-quote-preview"><div><span>Previous amount</span><strong>{previousQuote == null ? "Not quoted" : money(previousQuote)}</strong></div><div><span>Revised amount</span><strong>{numericQuote == null || quoteInvalid ? "—" : money(numericQuote)}</strong></div><div><span>Difference</span><strong>{difference == null ? "—" : `${difference > 0 ? "+" : ""}${money(difference)}`}</strong></div></div>
          <label className="admin-edit-field">Customer-facing quote notes<textarea rows="3" maxLength="5000" value={quoteNotes} onChange={(event) => setQuoteNotes(event.target.value)} /></label>
        </>}
        <label className="admin-edit-field">Internal admin notes<textarea rows="3" maxLength="5000" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} /></label>
        {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-feedback" role="status">{message}</p>}
        <div className="admin-detail-actions"><button className="admin-primary admin-save-quote" type="submit" disabled={saving || !hasChanges || (!isAttachment && quoteInvalid)}>{saving ? "Saving…" : isAttachment ? "Save enquiry changes" : "Save booking changes"}</button></div>
      </section>
    </form>
    {!isAttachment && <section className="admin-detail-section"><h3>Quotation history</h3>{historyError ? <p className="admin-detail-empty">{historyError}</p> : history.length ? <div className="admin-audit-list">{history.map((entry) => <div className="admin-audit-row" key={entry.audit_id}><div><strong>{entry.previous_amount == null ? "Not quoted" : money(entry.previous_amount)} → {entry.revised_amount == null ? "Quote cleared" : money(entry.revised_amount)}</strong><small>{dateTime(entry.created_at)}</small></div><small>{entry.admin_user_id ? `Admin ${entry.admin_user_id.slice(0, 8)}` : "Admin identity unavailable"}</small></div>)}</div> : <p className="admin-detail-empty">No saved quotation changes yet.</p>}</section>}
    <div className="admin-contact-actions"><a href={`tel:${request.mobile}`}>Call customer</a><a href={`https://wa.me/91${request.mobile}`} target="_blank" rel="noreferrer">WhatsApp ↗</a></div>
  </aside>;
}
