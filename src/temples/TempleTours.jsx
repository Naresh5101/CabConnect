import { useMemo, useState } from "react";
import { catalogueNote, templeCategories, temples } from "./templeData.js";
import {
  buildTempleWhatsAppMessage,
  calculateTempleFare,
  filterTempleCatalogue,
  geocodeTravelStop,
  requestRoadDistance,
  suggestNearestOrder,
  toggleTempleSelection,
} from "./templeUtils.js";
import "./templeTours.css";
import { createSubmissionId } from "../lib/supabase.js";
import { submitCustomerRequest } from "../lib/customerRequests.js";

const arupadaiIds = temples.filter((temple) => temple.categories.includes("arupadai")).map(({ id }) => id);
const money = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.round(amount));

function TempleImage({ temple }) {
  const [failed, setFailed] = useState(false);
  if (!temple.image || failed) {
    return <div className="temple-image-wrap temple-image-pending" role="img" aria-label={`${temple.name}, ${temple.town}`}>
      <span className="temple-fallback-icon" aria-hidden="true">⌂</span><small>{temple.town.split(",")[0]}</small>
    </div>;
  }
  return <div className="temple-image-wrap">
    <img className="temple-thumbnail" src={temple.image} alt={`AI-generated illustration of ${temple.name}; not a verified photograph.`} loading="lazy" onError={() => setFailed(true)} />
  </div>;
}

function directionsUrl(temple) {
  const destination = `${temple.name}, ${temple.town}, ${temple.district}, ${temple.state}, India`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export default function TempleTours({ AddressAutocomplete, vehicles, whatsappNumber }) {
  const [categoryId, setCategoryId] = useState("arupadai");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [start, setStart] = useState({ value: "Chennai, Tamil Nadu", coordinates: null });
  const [travelDate, setTravelDate] = useState("");
  const [travellers, setTravellers] = useState("2");
  const [days, setDays] = useState("3");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || "");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [routeDistance, setRouteDistance] = useState(null);
  const [coordinatesById, setCoordinatesById] = useState({});
  const [suggestedIds, setSuggestedIds] = useState([]);
  const [routeError, setRouteError] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);
  const [whatsAppUrl, setWhatsAppUrl] = useState("");
  const [submissionId, setSubmissionId] = useState(createSubmissionId);

  const selectedTemples = useMemo(() => selectedIds.map((id) => temples.find((temple) => temple.id === id)).filter(Boolean), [selectedIds]);
  const visibleTemples = useMemo(() => filterTempleCatalogue(temples, categoryId, query), [categoryId, query]);
  const vehicle = vehicles.find((item) => item.id === vehicleId) || vehicles[0];
  const fare = routeDistance != null && vehicle ? calculateTempleFare(routeDistance, vehicle, days) : null;
  const today = new Date().toISOString().slice(0, 10);

  function toggleTemple(templeId) {
    setSelectedIds((current) => toggleTempleSelection(current, templeId));
    setRouteDistance(null);
    setSuggestedIds([]);
    setRouteError("");
    setNotice("");
  }

  function clearSelection() {
    setSelectedIds([]);
    setRouteDistance(null);
    setSuggestedIds([]);
    setCoordinatesById({});
    setRouteError("");
    setNotice("");
  }

  function selectAllArupadai() {
    setCategoryId("arupadai");
    setSelectedIds((current) => [...new Set([...current, ...arupadaiIds])]);
    setRouteDistance(null);
    setSuggestedIds([]);
    setRouteError("");
    setNotice("");
  }

  function moveTemple(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= selectedIds.length) return;
    setSelectedIds((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setRouteDistance(null);
    setSuggestedIds([]);
    setRouteError("");
  }

  async function getStops() {
    if (!selectedTemples.length) throw new Error("Select at least one temple first.");
    const origin = start.coordinates || await geocodeTravelStop(start.value, null);
    const cache = {};
    for (const temple of selectedTemples) {
      cache[temple.id] = coordinatesById[temple.id]
        || await geocodeTravelStop(`${temple.name}, ${temple.town}, ${temple.district}`, temple.state);
    }
    setCoordinatesById((current) => ({ ...current, ...cache }));
    return { origin, cache };
  }

  async function calculateRoute() {
    setRouteLoading(true);
    setRouteError("");
    setRouteDistance(null);
    setSuggestedIds([]);
    try {
      const { origin, cache } = await getStops();
      const distance = await requestRoadDistance(origin, selectedTemples.map(({ id }) => cache[id]));
      setRouteDistance(distance);
    } catch (error) {
      setRouteError(error.message || "Could not calculate this route. Continue with a manual quotation request.");
    } finally {
      setRouteLoading(false);
    }
  }

  async function suggestOrder() {
    setSuggestLoading(true);
    setRouteError("");
    setSuggestedIds([]);
    try {
      const { origin, cache } = await getStops();
      const suggestion = await suggestNearestOrder(origin, selectedTemples, cache);
      setSuggestedIds(suggestion);
    } catch (error) {
      setRouteError(error.message || "Could not suggest a road-based order. You can keep your preferred order.");
    } finally {
      setSuggestLoading(false);
    }
  }

  function applySuggestedOrder() {
    if (!suggestedIds.length) return;
    setSelectedIds(suggestedIds);
    setSuggestedIds([]);
    setRouteDistance(null);
  }

  async function submitTour(event) {
    event.preventDefault();
    setNotice("");
    setWhatsAppUrl("");
    if (!selectedTemples.length) {
      setRouteError("Choose at least one temple before requesting your quotation.");
      return;
    }
    if (Number(travellers) > vehicle.passengers) {
      setRouteError(`${vehicle.label} seats up to ${vehicle.passengers} passengers. Choose a suitable vehicle or reduce the traveller count.`);
      return;
    }
    const sameCategory = categoryId !== "all" && categoryId !== "custom" && selectedTemples.every((temple) => temple.categories.includes(categoryId));
    const category = sameCategory ? templeCategories.find((item) => item.id === categoryId)?.label : "Custom Temple Tour";
    const message = buildTempleWhatsAppMessage({
      category,
      temples: selectedTemples,
      start: start.value,
      date: travelDate,
      days,
      travellers,
      vehicle,
      fare,
      customerName,
      phone,
      notes,
    });
    const number = (whatsappNumber || "").replace(/\D/g, "");
    setSavingRequest(true);
    try {
      const requestId = await submitCustomerRequest({ type: "temple_tour", name: customerName, mobile: phone, consent: contactConsent, submissionId, data: {
        category, temples: selectedTemples.map(({ id, name, deity, town, district, state }) => ({ id, name, deity, town, district, state })),
        start: start.value, startCoordinates: start.coordinates, travelDate, days: Number(days), travellers: Number(travellers),
        vehicle: { id: vehicle.id, label: vehicle.label, passengers: vehicle.passengers }, notes,
        routeDistanceKm: routeDistance, estimate: fare ? { total: fare.total, billedDistanceKm: fare.billedDistanceKm, distanceCharge: fare.distanceCharge, driverAllowance: fare.driverAllowance, note: fare.note } : null,
      } });
      if (number) setWhatsAppUrl(`https://wa.me/${number}?text=${encodeURIComponent(`${message}\n\nRequest reference: ${requestId}`)}`);
      setNotice(`Your temple tour request has been saved${number ? ". Continue to WhatsApp if you also want to send the details to CabConnect" : "; WhatsApp is unavailable, but CabConnect has received it"}.`);
      setSubmissionId(createSubmissionId());
    } catch (error) { setNotice(error.message || "We could not save your temple tour request. Please try again."); }
    finally { setSavingRequest(false); }
  }

  return (
    <section className="temple-tour-section" id="temple-tours" aria-labelledby="temple-tour-title">
      <div className="container">
        <div className="temple-tour-intro">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> PLAN A PILGRIMAGE</div>
            <h2 id="temple-tour-title">Temple tours,<br /><em>your way.</em></h2>
            <div className="temple-intro-points"><span><i>✓</i> Curated temple circuits</span><span><i>✓</i> Your stops, your order</span></div>
          </div>
          <p>Explore celebrated temples across Tamil Nadu, then shape a pilgrimage around the places and pace that matter to you.</p>
        </div>

        <div className="temple-tour-layout">
          <div className="temple-browser">
            <div className="temple-browser-heading">
              <div><span className="card-step">01 / BUILD YOUR TEMPLE LIST</span><h3>Find your temples</h3></div>
              <span className="temple-selection-count" aria-live="polite">{selectedIds.length} selected</span>
            </div>
            <p className="temple-browser-help">Browse a circuit or search by temple, town or deity. Add stops to build your route.</p>
            <div className="temple-search-row">
              <label className="temple-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search temples</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search temple, deity, town or Tamil name…" /></label>
              {query && <button type="button" className="temple-search-clear" onClick={() => setQuery("")}>Clear search</button>}
              <button type="button" className="temple-clear-button" onClick={clearSelection} disabled={!selectedIds.length}>Clear selection</button>
            </div>
            <div className="temple-category-list" aria-label="Filter temples by category">
              <button type="button" className={categoryId === "all" ? "active" : ""} onClick={() => setCategoryId("all")}>All temples <small>{temples.length}</small></button>
              {templeCategories.map((category) => {
                const count = category.id === "custom" ? temples.length : temples.filter((temple) => temple.categories.includes(category.id)).length;
                return <button type="button" key={category.id} className={categoryId === category.id ? "active" : ""} onClick={() => setCategoryId(category.id)}>{category.label}<small>{count}</small></button>;
              })}
            </div>
            <div className="temple-package-callout">
              <div><strong>Arupadai Veedu · all six</strong><small>Add the six Murugan abodes to your list. You can remove or reorder any stop.</small></div>
              <button type="button" onClick={selectAllArupadai}>Select all six <span>↗</span></button>
            </div>
            {categoryId === "custom" && <p className="temple-custom-hint">Custom tour mode: browse any category and add just the temples you want.</p>}
            <div className="temple-results-label" aria-live="polite"><span>{visibleTemples.length} {visibleTemples.length === 1 ? "temple" : "temples"} found</span>{selectedIds.length > 0 && <span>{selectedIds.length} in your route</span>}</div>
            <div className="temple-card-list" aria-live="polite">
              {visibleTemples.map((temple) => {
                const isSelected = selectedIds.includes(temple.id);
                return <article className={`temple-card ${isSelected ? "selected" : ""}`} key={temple.id}>
                  <TempleImage temple={temple} />
                  <div className="temple-card-copy">
                    <div className="temple-card-title"><h4>{temple.name}</h4><span className={`temple-state ${temple.state === "Tamil Nadu" ? "in-state" : "out-state"}`}>{temple.state === "Tamil Nadu" ? "Tamil Nadu" : `Outside Tamil Nadu · ${temple.state}`}</span></div>
                    {temple.tamilName && <p className="temple-tamil" lang="ta">{temple.tamilName}</p>}
                    <p className="temple-facts"><span>{temple.deity}</span><span>{temple.town} · {temple.district} district</span></p>
                    <div className="temple-tags">{temple.categories.map((id) => <span key={id}>{templeCategories.find((category) => category.id === id)?.label || id}</span>)}</div>
                    <div className="temple-card-links"><a href={directionsUrl(temple)} target="_blank" rel="noreferrer">Directions ↗</a><a href={temple.source.slice(temple.source.indexOf("https://"))} target="_blank" rel="noreferrer">Source ↗</a></div>
                  </div>
                  <button type="button" className="temple-select-button" aria-pressed={isSelected} onClick={() => toggleTemple(temple.id)}>{isSelected ? "Selected ✓" : "Add temple +"}</button>
                </article>;
              })}
              {!visibleTemples.length && <p className="temple-empty-state">No temples match this search. Try another name or category.</p>}
            </div>
            <p className="temple-catalogue-note">{catalogueNote}</p>
          </div>

          <form className="temple-booking-card" onSubmit={submitTour}>
            <span className="card-step">02 / YOUR PILGRIMAGE</span>
            <h3>Plan your temple tour</h3>
            <p className="temple-booking-lede">Your selected temples stay in the order shown below. Reorder them any time.</p>

            <div className="selected-route-list">
              <div className="selected-route-heading"><strong>Preferred temple order</strong><span>{selectedIds.length} stops</span></div>
              {!selectedTemples.length && <div className="selected-route-empty"><span aria-hidden="true">⌖</span><strong>Your pilgrimage starts here</strong><small>Add temples from the catalogue to build your route.</small></div>}
              {selectedTemples.map((temple, index) => <div className="selected-route-stop" key={temple.id}>
                <span className="route-stop-number">{index + 1}</span><span className="route-stop-name">{temple.name}<small>{temple.town}</small></span>
                <div className="route-order-buttons"><button type="button" aria-label={`Move ${temple.name} up`} onClick={() => moveTemple(index, -1)} disabled={index === 0}>↑</button><button type="button" aria-label={`Move ${temple.name} down`} onClick={() => moveTemple(index, 1)} disabled={index === selectedTemples.length - 1}>↓</button></div>
              </div>)}
              {selectedTemples.length > 1 && <div className="route-suggestion-actions"><button type="button" onClick={suggestOrder} disabled={suggestLoading}>{suggestLoading ? "Finding road order…" : "Suggest road-based order"}</button>{suggestedIds.length > 0 && <button type="button" className="apply-route-button" onClick={applySuggestedOrder}>Apply suggested order</button>}</div>}
            </div>

            <div className="temple-form-grid">
              <AddressAutocomplete label="Starting location" required value={start.value} coords={start.coordinates} onChange={(value, coordinates) => { setStart({ value, coordinates }); setRouteDistance(null); setRouteError(""); }} onMapPick={(value, coordinates) => { setStart({ value, coordinates }); setRouteDistance(null); setRouteError(""); }} placeholder="Chennai, Tamil Nadu" />
              <label className="field"><span>Travel date <b>*</b></span><input type="date" min={today} required value={travelDate} onChange={(event) => setTravelDate(event.target.value)} /></label>
              <label className="field"><span>Travellers</span><select value={travellers} onChange={(event) => setTravellers(event.target.value)}>{[1,2,3,4,5,6].map((count) => <option key={count} value={count}>{count} traveller{count === 1 ? "" : "s"}</option>)}</select></label>
              <label className="field"><span>Travel days</span><select value={days} onChange={(event) => setDays(event.target.value)}>{[1,2,3,4,5,6,7,8,10,12,14].map((count) => <option key={count} value={count}>{count} day{count === 1 ? "" : "s"}</option>)}</select></label>
              <label className="field"><span>Vehicle</span><select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>{vehicles.map((item) => <option key={item.id} value={item.id}>{item.label} · up to {item.passengers}</option>)}</select></label>
              <label className="field"><span>Your name <b>*</b></span><input required autoComplete="name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Full name" /></label>
              <label className="field"><span>Mobile number <b>*</b></span><input required type="tel" inputMode="tel" pattern="(?:[0-9+ ]|\x2d){8,18}" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" /></label>
              <label className="field field-full"><span>Special requests <small>(optional)</small></span><textarea rows="2" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Accessibility needs, luggage, preferred stops…" /></label>
            </div>

            <div className="temple-fare-box">
              <div className="temple-fare-heading"><div><span className="card-step">03 / OPTIONAL ROAD ESTIMATE</span><strong>Calculate route and fare</strong></div><span>₹</span></div>
              <p>Uses geocoded stops and actual road routing from the selected start through your temple order and back to the start. If a stop cannot be verified, request a manual quote instead.</p>
              <button type="button" className="button temple-route-button" onClick={calculateRoute} disabled={routeLoading || !selectedTemples.length}>{routeLoading ? "Calculating road route…" : "Calculate road route"}<span>↗</span></button>
              {routeError && <div className="fare-error" role="alert">{routeError}</div>}
              {fare && <div className="temple-fare-result" aria-live="polite">
                <div><span>Verified road distance</span><strong>{fare.distanceKm.toFixed(1)} km</strong></div>
                <div><span>Distance charge · {fare.billedDistanceKm.toFixed(1)} billed km at {money(fare.perKm)}/km</span><strong>{money(fare.distanceCharge)}</strong></div>
                <div><span>Driver allowance · {fare.tripDays} day(s)</span><strong>{money(fare.driverAllowance)}</strong></div>
                <div className="temple-estimate-total"><span>Indicative estimate</span><strong>{money(fare.total)}</strong></div>
                <small>{fare.note}</small>
              </div>}
            </div>
            <label className="temple-contact-consent"><input type="checkbox" required checked={contactConsent} onChange={(event) => setContactConsent(event.target.checked)} />I agree that CabConnect may store my trip details and contact me about this request.</label>
            <button className="button button-submit temple-submit" type="submit" disabled={savingRequest}>{savingRequest ? "Saving your request…" : "Save temple tour request"} <span>→</span></button>
            <p className="form-legal">Your request is shared with authorised CabConnect staff. Availability and final fare must be confirmed.</p>
            {whatsAppUrl && <a className="temple-whatsapp-followup" href={whatsAppUrl} target="_blank" rel="noreferrer">Continue to WhatsApp ↗</a>}
            {notice && <div className="form-notice" role="status">{notice}</div>}
          </form>
        </div>
      </div>
    </section>
  );
}
