import { useEffect, useMemo, useState } from "react";
import { findTourByPath, tourCategories } from "./tourData.js";
import { geocodeTravelStop } from "../temples/templeUtils.js";
import { calculateTourEstimate, getTourRoadDistance } from "./tourFare.js";
import { createSubmissionId, supabaseConfigured } from "../lib/supabase";
import { submitCustomerRequest } from "../services/customerRequestService";
import { fetchPublishedTourPackages } from "../services/tourPackageService";
import ArrowLink from "../components/ArrowLink.jsx";
import PageMeta from "../components/PageMeta.jsx";
import "./tourPackages.css";

const formatMoney = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.round(value));

function DestinationCard({ destination }) {
  const image = destination.hero;
  return <article className="tour-destination-card">
    {image && <a className="tour-card-image" href={destination.slug} aria-label={`View ${destination.name} tour`}><img src={image} alt={destination.alt || `AI-generated ${destination.name} travel scenery`} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/tours/generated/hd/kodaikanal.jpg"; }} /></a>}
    <div className="tour-card-copy"><span className="tour-card-region">{destination.region} · {destination.state}</span><h3><a href={destination.slug}>{destination.name}</a></h3><p>{destination.summary}</p><span className="tour-card-duration">{destination.duration}</span><ArrowLink href={destination.slug}>Explore tour</ArrowLink></div>
  </article>;
}

function TourIndex() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All journeys");
  const [state, setState] = useState("All states");
  useEffect(() => {
    let active = true;
    if (!supabaseConfigured) { Promise.resolve().then(() => { if (active) { setLoadError("Tour packages are not connected to the database yet."); setLoading(false); } }); return () => { active = false; }; }
    fetchPublishedTourPackages().then((rows) => {
      if (active) setDestinations(rows.map((row) => ({ ...row.package_data, slug: row.slug })));
    }).catch(() => {
      if (active) setLoadError("We could not load tour packages from the database. Please try again later.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const states = ["All states", ...new Set(destinations.map((destination) => destination.state))];
  const filtered = useMemo(() => destinations.filter((destination) => {
    const matchesQuery = `${destination.name} ${destination.summary} ${destination.region} ${destination.state}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (category === "All journeys" || destination.category.includes(category)) && (state === "All states" || destination.state === state);
  }), [category, destinations, query, state]);

  return <div className="tour-page tour-index-page">
    <PageMeta title="South India Tour Packages from Chennai | CabConnect" description="Explore hill stations, family holidays, coastal trips and heritage journeys from Chennai. Review suggested plans and request a cab quotation from CabConnect." path="/tour-packages" />
    <section className="tour-index-hero">
      <div className="tour-container tour-index-hero-copy"><span className="tour-eyebrow">CABCONNECT CHENNAI · PRIVATE ROAD TRIPS</span><h1>Discover South India,<br /><em>One Journey at a Time</em></h1><p>Explore hill stations, scenic road trips and unforgettable getaways with CabConnect Chennai.</p><a className="tour-primary-button" href="#tour-destinations">Find your getaway <span>↓</span></a></div>
      <div className="tour-hero-stamp"><span>YOUR NEXT</span><strong>Great escape</strong><small>starts on the road</small></div>
    </section>
    <section className="tour-container tour-index-content" id="tour-destinations">
      <div className="tour-section-heading"><div><span className="tour-eyebrow tour-eyebrow-dark">FIND YOUR KIND OF GETAWAY</span><h2>Choose a journey</h2></div><p>Every plan is a starting point. Share your dates and preferences for a trip-specific cab quotation.</p></div>
      <div className="tour-filter-panel">
        <label className="tour-search"><span className="sr-only">Search destinations</span><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a destination or experience" /></label>
        <label className="tour-state-filter">Browse by state<select value={state} onChange={(event) => setState(event.target.value)} aria-label="Filter destinations by state">{states.map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="tour-category-list" aria-label="Filter by trip type">
          {["All journeys", ...tourCategories].map((item) => <button type="button" key={item} aria-pressed={category === item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </div>
      {loading && <p className="tour-empty-state" role="status">Loading tour packages…</p>}
      {loadError && <p className="tour-empty-state" role="alert">{loadError}</p>}
      {!loading && !loadError && <p className="tour-result-count" role="status">Showing {filtered.length} of {destinations.length} destinations</p>}
      {!loadError && !loading && <div className="tour-destination-grid">{filtered.map((destination) => <DestinationCard key={destination.id} destination={destination} />)}</div>}
      {!loading && !loadError && filtered.length === 0 && <p className="tour-empty-state">No destinations match that search yet. Try another place or trip category.</p>}
      <div className="tour-custom-callout"><div><span className="tour-eyebrow">YOUR ROUTE, YOUR PACE</span><h2>Want a trip built around your plans?</h2><p>Tell us the places, dates and vehicle you have in mind. We’ll review the route and reply with a quotation.</p></div><ArrowLink href="/tour-packages/kodaikanal#tour-enquiry">Request a tour quote</ArrowLink></div>
      <section className="tour-temple-separate-callout" aria-labelledby="tour-temple-link-title"><div><span className="tour-eyebrow tour-eyebrow-dark">A SEPARATE TEMPLE PLANNER</span><h2 id="tour-temple-link-title">Planning a temple journey?</h2><p>Choose temples, arrange your route and request an estimate in the dedicated Temple Tours section.</p></div><ArrowLink href="/#temple-tours">Explore Temple Tours</ArrowLink></section>
    </section>
    <TourCaution />
  </div>;
}

function TourCaution() {
  return <aside className="tour-caution"><div className="tour-container"><span aria-hidden="true">i</span><p>Itineraries are suggestions. Opening hours, road and weather conditions, attraction access and travel duration may change. The team will confirm the route and vehicle availability before a booking is accepted.</p></div></aside>;
}

function QuoteForm({ destination, AddressAutocomplete, vehicles, whatsappNumber }) {
  const [form, setForm] = useState({ pickup: "Chennai", pickupCoords: null, date: "", travellers: "2", days: destination.durationDays.split("–")[0], vehicle: "dzire", tripType: "Multi-day sightseeing", name: "", phone: "", notes: "" });
  const [notice, setNotice] = useState("");
  const [fare, setFare] = useState(null);
  const [fareError, setFareError] = useState("");
  const [fareLoading, setFareLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(false);
  const [whatsAppUrl, setWhatsAppUrl] = useState("");
  const [submissionId, setSubmissionId] = useState(createSubmissionId);
  const today = new Date().toISOString().slice(0, 10);
  const vehicle = vehicles.find((item) => item.id === form.vehicle) || vehicles[0];
  function update(field, value, coordinates) {
    setForm((current) => ({ ...current, [field]: value, ...(field === "pickup" ? { pickupCoords: coordinates || null } : {}) }));
    setNotice(""); setFare(null); setFareError("");
  }
  async function calculateFare() {
    setFare(null); setFareError(""); setFareLoading(true);
    try {
      const pickup = form.pickupCoords || await geocodeTravelStop(form.pickup, "");
      const target = await geocodeTravelStop(destination.name, destination.state);
      const returnTrip = form.tripType !== "One-way";
      const distanceKm = await getTourRoadDistance(pickup, target, returnTrip);
      setFare(calculateTourEstimate(distanceKm, vehicle, form.days, returnTrip));
    } catch (error) {
      setFareError(error.message || "A price estimate could not be calculated. You can still request a manual quotation.");
    } finally { setFareLoading(false); }
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true); setNotice(""); setWhatsAppUrl("");
    const number = String(whatsappNumber || "").replace(/\D/g, "");
    const lines = [
      "Hello CabConnect Chennai, I would like a tour cab quotation.", "",
      `Package / destination: ${destination.name}`, `Pickup: ${form.pickup}`, `Travel date: ${form.date}`,
      `Travellers: ${form.travellers}`, `Requested duration: ${form.days} day(s)`, `Trip requirement: ${form.tripType}`,
      `Vehicle preference: ${vehicle.label} (up to ${vehicle.passengers} passengers)`, `Name: ${form.name}`, `Mobile: ${form.phone}`,
      ...(fare ? [`Estimated price: ${formatMoney(fare.total)}`, `Estimate basis: ${fare.roadDistanceKm.toFixed(1)} road km; ${fare.billedDistanceKm.toFixed(1)} billed km`, fare.note] : ["Estimated price: Not calculated; please provide a quotation."]),
      `Additional requirements: ${form.notes || "None"}`, "", "Please confirm route, availability and quotation. This is an enquiry, not a confirmed booking.",
    ];
    try {
      const requestId = await submitCustomerRequest({ type: "tour_quote", name: form.name, mobile: form.phone, consent, submissionId, data: {
        packageId: destination.id, destination: destination.name, pickup: form.pickup, travelDate: form.date,
        travellers: Number(form.travellers), days: Number(form.days), vehicle: vehicle.label, tripType: form.tripType,
        notes: form.notes, estimate: fare ? { total: fare.total, roadDistanceKm: fare.roadDistanceKm, billedDistanceKm: fare.billedDistanceKm, note: fare.note } : null,
      } });
      if (number) setWhatsAppUrl(`https://wa.me/${number}?text=${encodeURIComponent(`${lines.join("\n")}\n\nRequest reference: ${requestId}`)}`);
      setNotice(`Your quotation request has been saved${number ? ". Continue to WhatsApp if you also want to send it to CabConnect" : "; WhatsApp is unavailable, but CabConnect has received it"}.`);
      setSubmissionId(createSubmissionId());
    } catch (error) { setNotice(error.message || "We could not save your request. Please try again."); }
    finally { setSaving(false); }
  }

  return <form className="tour-enquiry-form" onSubmit={submit}>
    <div className="tour-form-intro"><span className="tour-eyebrow tour-eyebrow-dark">PLAN YOUR GETAWAY</span><h2>Request a quotation</h2><p>No online payment. Share your trip details and our team will confirm the route, vehicle availability and final quote.</p></div>
    <div className="tour-form-grid">
      <div className="tour-form-field tour-form-full"><AddressAutocomplete id="tour-pickup" label="Pickup location" required value={form.pickup} coords={form.pickupCoords} onChange={(value, coordinates) => update("pickup", value, coordinates)} placeholder="Chennai or another pickup area" showMap={false} /></div>
      <label className="tour-form-field"><span>Destination</span><input value={`${destination.name}, ${destination.state}`} readOnly aria-readonly="true" /></label>
      <label className="tour-form-field"><span>Preferred travel date *</span><input type="date" required min={today} value={form.date} onChange={(event) => update("date", event.target.value)} /></label>
      <label className="tour-form-field"><span>Travellers *</span><select required value={form.travellers} onChange={(event) => update("travellers", event.target.value)}>{[1,2,3,4,5,6,7,8,9,10,12,15,20].map((number) => <option key={number} value={number}>{number} traveller{number > 1 ? "s" : ""}</option>)}</select></label>
      <label className="tour-form-field"><span>Number of days *</span><select required value={form.days} onChange={(event) => update("days", event.target.value)}>{[1,2,3,4,5,6,7,8,10,14].map((number) => <option key={number} value={number}>{number} day{number > 1 ? "s" : ""}</option>)}</select></label>
      <label className="tour-form-field"><span>Vehicle preference *</span><select required value={form.vehicle} onChange={(event) => update("vehicle", event.target.value)}>{vehicles.map((option) => <option key={option.id} value={option.id}>{option.label} · up to {option.passengers}</option>)}</select></label>
      <label className="tour-form-field"><span>Trip requirement *</span><select required value={form.tripType} onChange={(event) => update("tripType", event.target.value)}>{["One-way", "Round-trip", "Multi-day sightseeing"].map((option) => <option key={option}>{option}</option>)}</select></label>
      <label className="tour-form-field"><span>Your name *</span><input autoComplete="name" required maxLength={80} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Full name" /></label>
      <label className="tour-form-field"><span>Mobile number *</span><input autoComplete="tel" type="tel" required inputMode="tel" pattern="[+0-9() -]{8,18}" title="Enter a valid phone number" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Phone number" /></label>
      <label className="tour-form-field tour-form-full"><span>Additional requirements</span><textarea maxLength={600} rows="3" value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Preferred stops, luggage, accessibility needs or other details" /></label>
    </div>
    <div className="tour-price-estimator">
      <div><strong>Want an estimated price?</strong><p>Uses the road route, selected vehicle and trip type. Local sightseeing distance and extra charges are excluded.</p></div>
      <button type="button" onClick={calculateFare} disabled={fareLoading}>{fareLoading ? "Calculating…" : "Calculate estimate"}</button>
      {fareError && <p className="tour-fare-error" role="alert">{fareError}</p>}
      {fare && <div className="tour-fare-result" role="status"><div><span>Estimated trip total</span><strong>{formatMoney(fare.total)}</strong></div><p>Road route: {fare.roadDistanceKm.toFixed(1)} km · Billed distance: {fare.billedDistanceKm.toFixed(1)} km · {vehicle.label}</p><p>{fare.note}</p></div>}
    </div>
    <label className="tour-contact-consent"><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} />I agree that CabConnect may store these trip details and contact me about this request.</label>
    <button className="tour-submit-button" type="submit" disabled={saving}>{saving ? "Saving your request…" : "Save quotation request"} <span>→</span></button>
    <p className="tour-privacy-note">Your request is visible only to authorised CabConnect administrators. Any fare estimate is indicative and this is not a confirmed booking.</p>
    {whatsAppUrl && <a className="tour-whatsapp-followup" href={whatsAppUrl} target="_blank" rel="noreferrer">Continue to WhatsApp ↗</a>}
    {notice && <p className="tour-form-notice" role="status">{notice}</p>}
  </form>;
}

function TourDetails({ packageId, packageSlug, routeLanding, AddressAutocomplete, vehicles, whatsappNumber, pathname }) {
  const [destination, setDestination] = useState(null);
  const [relatedDestinations, setRelatedDestinations] = useState([]);
  const [packageLoading, setPackageLoading] = useState(true);
  const [packageError, setPackageError] = useState("");
  const [selectedItineraryDay, setSelectedItineraryDay] = useState(0);
  useEffect(() => {
    let active = true;
    if (!supabaseConfigured) { Promise.resolve().then(() => { if (active) { setPackageError("Tour packages are not connected to the database yet."); setPackageLoading(false); } }); return () => { active = false; }; }
    fetchPublishedTourPackages().then((rows) => {
      if (!active) return;
      const packages = rows.map((row) => ({ ...row.package_data, slug: row.slug }));
      const row = rows.find((item) => packageSlug ? item.slug === packageSlug : (item.package_data && typeof item.package_data === "object" && !Array.isArray(item.package_data) && item.package_data.id === packageId));
      const selectedPackage = row ? { ...row.package_data, slug: row.slug } : null;
      setDestination(selectedPackage);
      setRelatedDestinations(packages);
      if (!selectedPackage) setPackageError("This tour package is not currently available.");
    }).catch(() => {
      if (active) setPackageError("We could not load this tour package. Please try again later.");
    }).finally(() => { if (active) setPackageLoading(false); });
    return () => { active = false; };
  }, [packageId, packageSlug]);
  if (packageLoading) return <div className="tour-loading" role="status">Loading tour package…</div>;
  if (packageError || !destination) return <div className="tour-loading" role="alert">{packageError || "This tour package is not currently available."}</div>;
  const canonicalTitle = routeLanding ? `Chennai to ${destination.shortName} Cab | Private Tour Quote | CabConnect` : `${destination.name} Tour Package from Chennai | CabConnect`;
  const description = routeLanding
    ? `Plan a private cab from Chennai to ${destination.name}. Review suggested sightseeing and request a trip-specific quote from CabConnect Chennai.`
    : `Explore a suggested ${destination.name} tour from Chennai with attraction highlights, day plans and a private cab quotation from CabConnect.`;
  return <div className="tour-page tour-details-page">
    <PageMeta title={canonicalTitle} description={description} path={pathname} />
    <section className="tour-detail-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(16,34,25,.68),rgba(20,42,30,.34) 58%,rgba(20,42,30,.08)),url("${destination.hero}")` }}>
      <div className="tour-container tour-detail-hero-copy"><a className="tour-back-link" href="/tour-packages">← All tour packages</a><span className="tour-eyebrow">{destination.region} · {destination.state.toUpperCase()} · PRIVATE CAB JOURNEY</span><h1>{routeLanding ? `Chennai to ${destination.shortName} Cab` : `${destination.name} Tour Packages`}</h1><p>{destination.summary}</p><div className="tour-detail-tags"><span>{destination.duration}</span><span>Dzire or Ertiga</span><span>Request a quote</span></div><a className="tour-primary-button" href="#tour-enquiry">Plan this journey <span>↗</span></a></div>
    </section>
    <div className="tour-container tour-detail-main">
      <nav className="tour-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/tour-packages">Tour Packages</a><span>/</span><span aria-current="page">{destination.name}</span></nav>
      <div className="tour-detail-columns">
        <div className="tour-detail-content">
          <section className="tour-overview"><span className="tour-eyebrow tour-eyebrow-dark">A SLOWER WAY TO SEE MORE</span><h2>Make the road part of the story.</h2><p>{destination.overview}</p><ul className="tour-highlight-list">{destination.highlights.map((highlight) => <li key={highlight}><span>✓</span>{highlight}</li>)}</ul></section>
          <section className="tour-itinerary" aria-labelledby="tour-itinerary-heading"><div className="tour-section-heading compact"><div><span className="tour-eyebrow tour-eyebrow-dark">A FLEXIBLE STARTING POINT</span><h2 id="tour-itinerary-heading">Suggested itinerary</h2></div><span className="tour-duration-badge">{destination.duration}</span></div>{destination.id === "kodaikanal" ? <div className="cc-koda-planner"><div className="cc-koda-tabs" role="tablist" aria-label="Kodaikanal itinerary days">{destination.itinerary.map((step, index) => <button key={step.day} type="button" role="tab" aria-selected={selectedItineraryDay === index} className={`cc-koda-tab${selectedItineraryDay === index ? " active" : ""}`} onClick={() => setSelectedItineraryDay(index)}><small>{step.day.toUpperCase()}</small><strong>{step.title}</strong></button>)}</div>{destination.itinerary[selectedItineraryDay] && <><div className="cc-koda-day-heading"><div><span className="tour-eyebrow tour-eyebrow-dark">{destination.itinerary[selectedItineraryDay].day.toUpperCase()}</span><h3>{destination.itinerary[selectedItineraryDay].title}</h3><p>{destination.itinerary[selectedItineraryDay].text}</p></div><span>{destination.itinerary[selectedItineraryDay].places.length} suggested stops</span></div><div className="cc-koda-grid">{destination.itinerary[selectedItineraryDay].places.map((place, index) => <article className="cc-koda-card" key={place.name}><div className="cc-koda-card-image"><img src={place.image} alt={`AI-generated illustrative artwork of ${place.name}, Kodaikanal`} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = destination.hero; }} /></div><span className="cc-koda-number">{String(index + 1).padStart(2, "0")}</span><div className="cc-koda-card-content"><h4>{place.name}</h4><p>{place.description}</p></div></article>)}</div></>}<p className="tour-inline-note">The stop artwork is AI-generated illustration, not a documentary photograph. This is a suggested plan, not a fixed schedule; access and conditions can vary.</p></div> : <><div className="tour-itinerary-list">{destination.itinerary.map((step) => <article className="tour-itinerary-item" key={step.day}><div className="tour-itinerary-image"><img src={step.image || destination.hero} alt={`AI-generated illustrative scenery for ${step.title}, ${destination.name}`} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = destination.hero; }} /></div><div className="tour-itinerary-copy"><span className="tour-itinerary-day">{step.day}</span><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div><p className="tour-inline-note">Itinerary artwork is AI-generated illustrative destination scenery, not a documentary photograph. This is a suggested plan, not a fixed schedule. We will review your travel dates and preferred stops before confirming a route.</p></>}</section>
          <section className="tour-attractions" aria-labelledby="tour-attractions-heading"><div className="tour-section-heading compact"><div><span className="tour-eyebrow tour-eyebrow-dark">PLACES TO EXPLORE</span><h2 id="tour-attractions-heading">A few local highlights</h2></div></div><div className="tour-attraction-grid">{destination.attractions.map((attraction) => <article className="tour-attraction-card" key={attraction.name}><img className="tour-attraction-image" src={attraction.image || destination.hero} alt={attraction.alt || `AI-generated illustrative artwork for ${attraction.name}`} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = destination.hero; }} /><div className="tour-attraction-copy"><h3>{attraction.name}</h3><p>{attraction.description}</p></div></article>)}</div><p className="tour-inline-note">Images are AI-generated illustrative artwork and may not be exact documentary views of each landmark.</p></section>
          <section className="tour-plan-details" aria-labelledby="tour-plan-heading"><span className="tour-eyebrow tour-eyebrow-dark">WHAT TO EXPECT</span><h2 id="tour-plan-heading">Your cab plan</h2><div className="tour-plan-grid"><article><h3>Suitable vehicles</h3><ul>{destination.suitable.map((item) => <li key={item}>{item}</li>)}</ul><p>For more than 6 travellers, contact us to discuss a suitable arrangement. Vehicle availability is confirmed by the team.</p></article><article><h3>Included in the quote</h3><ul>{destination.included.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>Not included</h3><ul>{destination.excluded.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>Pickup and drop</h3><p>Pickup is set to Chennai by default and can be edited in the enquiry. Share your preferred pickup and drop locations for confirmation.</p></article></div></section>
          <section className="tour-faq" aria-labelledby="tour-faq-heading"><span className="tour-eyebrow tour-eyebrow-dark">GOOD TO KNOW</span><h2 id="tour-faq-heading">Frequently asked questions</h2>{destination.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
          <section className="tour-sources"><h2>Destination references</h2><p>We used these sources to verify the attraction names and broad descriptions. Confirm access locally before travel.</p><ul>{destination.sourceLinks.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul></section>
        </div>
        <aside className="tour-side-cta"><div className="tour-side-cta-inner"><span className="tour-eyebrow">MAKE IT YOURS</span><h2>Ready when you are.</h2><p>Send us your travel date, group size and vehicle preference. We’ll check the trip and reply with a clear quote.</p><a href="#tour-enquiry" className="tour-primary-button">Request a quote <span>↘</span></a><small>Final fare and vehicle subject to confirmation.</small></div><div className="tour-related"><span className="tour-eyebrow tour-eyebrow-dark">MORE JOURNEYS</span>{relatedDestinations.filter((item) => item.id !== destination.id).slice(0, 3).map((item) => <a href={item.slug} key={item.id}><span>{item.name}</span><span>↗</span></a>)}</div></aside>
      </div>
      <section className="tour-enquiry-section" id="tour-enquiry"><QuoteForm destination={destination} AddressAutocomplete={AddressAutocomplete} vehicles={vehicles} whatsappNumber={whatsappNumber} /></section>
    </div>
    <TourCaution />
  </div>;
}

export default function TourPackages({ pathname, AddressAutocomplete, vehicles, whatsappNumber }) {
  const route = findTourByPath(pathname);
  const packagePath = pathname.replace(/\/$/, "");
  if (!route && !/^\/tour-packages\/[^/]+$/.test(packagePath)) return <TourIndex />;
  return <TourDetails packageId={route?.destination.id || null} packageSlug={route ? null : packagePath} routeLanding={route?.routeLanding || false} AddressAutocomplete={AddressAutocomplete} vehicles={vehicles} whatsappNumber={whatsappNumber} pathname={pathname} />;
}
