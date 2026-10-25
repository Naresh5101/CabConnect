import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import "./partner.css";
import TempleTours from "./temples/TempleTours.jsx";
import DriverRegistration from "./drivers/DriverRegistration.jsx";
import DriverAdmin from "./pages/admin/AdminDashboard.jsx";
import CabAttachment from "./drivers/CabAttachment.jsx";
import { createSubmissionId } from "./lib/supabase";
import { submitCustomerRequest } from "./services/customerRequestService";
import { isCabAttachmentPath, isDriverAdminPath, isDriverRegisterPath, isTourPath } from "./app/routes";
import { environment } from "./config/environment";
import { temples } from "./temples/templeData.js";
import { calculateLocalPackage, calculateOutstationFare, OUTSTATION_TARIFF } from "./utils/fareRules.js";
import { isIndianCoordinate, photonSearchParams, rankIndianPlaceFeatures } from "./utils/locationSearch.js";
const TourPackages = lazy(() => import("./tours/TourPackages.jsx"));
const KodaikanalTour = lazy(() => import("./pages/tours/KodaikanalTour.jsx"));

const services = [
  { id: "daily", title: "Daily rides", subtitle: "Point-to-point across Chennai", icon: "⌁" },
  { id: "oneway", title: "Outstation one-way", subtitle: "Pay for your journey", icon: "↗" },
  { id: "roundtrip", title: "Outstation round trip", subtitle: "Return travel made easy", icon: "↔" },
  { id: "rentals", title: "Rentals by the hour", subtitle: "Keep a cab for your plans", icon: "◷" },
  { id: "airport", title: "Airport transfer", subtitle: "On-time pickup and drop", icon: "✈" },
];

const serviceHighlights = [
  { id: "daily", title: "Local Rides", subtitle: "Within Chennai", icon: "🚘" },
  { id: "airport", title: "Airport Transfers", subtitle: "Chennai Airport", icon: "✈" },
  { id: "oneway", title: "Outstation Trips", subtitle: "One Way / Round Trip", icon: "⌖" },
  { id: "temple", title: "Temple Tours", subtitle: "Tamil Nadu temples", icon: "♙" },
  { id: "rentals", title: "Hourly Rental", subtitle: "By the hour", icon: "◷" },
];

const serviceVisuals = {
  daily: { image: "/daily-ride-passenger.png", alt: "Passenger enjoying a daily Chennai cab ride", headline: "Everyday city rides", caption: "A comfortable ride for your Chennai day." },
  oneway: { image: "/outstation-oneway-passenger.png", alt: "Passenger enjoying a one-way road trip", headline: "Ride out of town", caption: "Your one-way journey starts here." },
  roundtrip: { image: "/outstation-roundtrip-passenger.png", alt: "Family enjoying an outstation return journey", headline: "Go there and back", caption: "Plan your outstation return with ease." },
  rentals: { image: "/hourly-rental-passenger.png", alt: "Passenger using a cab for a day around Chennai", headline: "A cab by the hour", caption: "Flexible rides for plans around the city." },
  airport: { image: "/airport-ride-passenger.png", alt: "Traveler meeting a cab at the airport", headline: "Airport made easy", caption: "A smooth pickup or drop, on your schedule." },
};

const DEFAULT_WHATSAPP_NUMBER = "919444564127";
const homepageTemples = ["palani", "tiruchendur", "thiruthani", "swamimalai"]
  .map((id) => temples.find((temple) => temple.id === id)).filter(Boolean);

// Indicative Chennai estimates; partners must confirm availability and final quotes.
const vehicles = [
  { id: "dzire", label: "Maruti Suzuki Swift Dzire", category: "Comfort sedan", passengers: 4, luggage: 2, perKm: 20, shortTripPerKm: 20, outstationOneWayPerKm: 16, outstationRoundTripPerKm: 14, localPackages: { 4: 1300, 8: 2300, 12: 3300 }, extraHourRate: 250, airportMinimum: 1000, driverAllowancePerDay: 300, image: "/vehicles/dzire-white-new.png" },
  { id: "ertiga", label: "Maruti Suzuki Ertiga", category: "MPV", passengers: 6, luggage: 3, perKm: 28, shortTripPerKm: 30, outstationOneWayPerKm: 19, outstationRoundTripPerKm: 17, localPackages: { 4: 2000, 8: 3400, 12: 4700 }, extraHourRate: 350, airportMinimum: 1500, driverAllowancePerDay: 400, image: "/vehicles/ertiga-white-new.png" },
];

const money = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.round(amount));
const isValidCoordinates = (coordinates) => Number.isFinite(coordinates?.lat) && Number.isFinite(coordinates?.lon)
  && Math.abs(coordinates.lat) <= 90 && Math.abs(coordinates.lon) <= 180;
const isWithinIndia = (coordinates) => isValidCoordinates(coordinates)
  && isIndianCoordinate(coordinates.lat, coordinates.lon);

const initialForm = {
  pickup: "",
  pickupCoords: null,
  destination: "",
  destinationCoords: null,
  vehicle: "",

  date: "",
  time: "09:00",
  passengers: "2",
  hours: "4",
  tripDays: "1",
  name: "",
  phone: "",
  notes: "",
  contactConsent: false,
};


function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lon: event.latlng.lng });
    },
  });
  return null;
}

function MapViewport({ center }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([center.lat, center.lon], 15, { duration: 0.8 });
  }, [center, map]);

  return null;
}

function getLocationErrorMessage(error) {
  if (error?.code === 1) return "Location permission denied. Allow location access for this site in browser settings, then try again.";
  if (error?.code === 2) return "Your device could not determine its location. Turn on Location Services and try again.";
  if (error?.code === 3) return "Location lookup timed out. Try again or place the pin manually.";
  return "Location unavailable. Check browser location permission or place the pin manually.";
}

function LocationPicker({ title, initialCoords, onClose, onConfirm }) {
  const supportsGeolocation = typeof navigator !== "undefined" && Boolean(navigator.geolocation);
  const [selected, setSelected] = useState(initialCoords || { lat: 13.0827, lon: 80.2707 });
  const [locationStatus, setLocationStatus] = useState(initialCoords ? "selected" : supportsGeolocation ? "locating" : "unavailable");
  const [locationError, setLocationError] = useState(supportsGeolocation ? "" : "This browser does not support device location. Pan the map to set your pickup.");
  const [saving, setSaving] = useState(false);
  const [mapSearch, setMapSearch] = useState("");

  useEffect(() => {
    if (initialCoords || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSelected({ lat: coords.latitude, lon: coords.longitude });
        setLocationStatus("found");
        setLocationError("");
      },
      (error) => {
        setLocationStatus("unavailable");
        setLocationError(getLocationErrorMessage(error));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [initialCoords]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }

    setLocationStatus("locating");
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const currentLocation = { lat: coords.latitude, lon: coords.longitude };
        setSelected(currentLocation);
        setLocationStatus("found");
        setLocationError("");
        void confirmLocation(currentLocation);
      },
      (error) => {
        setLocationStatus("unavailable");
        setLocationError(getLocationErrorMessage(error));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  async function confirmLocation(coordinates) {
    setSaving(true);
    try {
      await onConfirm(coordinates);
    } finally {
      setSaving(false);
    }
  }

  function confirmSelection() {
    void confirmLocation(selected);
  }

  return (
    <div className="map-picker-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="map-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="map-picker-title">
        <header className="map-picker-header">
          <div><span className="card-step">PIN YOUR LOCATION</span><h3 id="map-picker-title">Choose {title.toLowerCase()} on map</h3></div>
          <button className="map-picker-close" type="button" onClick={onClose} aria-label="Close map">×</button>
        </header>
        <div className="map-picker-search">
          <AddressAutocomplete
            id="map-location-search"
            label="Search for a place or landmark"
            value={mapSearch}
            onChange={(value, coordinates) => {
              setMapSearch(value);
              if (coordinates) {
                setSelected(coordinates);
                setLocationStatus("selected");
                setLocationError("");
              }
            }}
            placeholder="Temple, street, area or landmark"
            searchContext=""
            showMap={false}
          />
        </div>
        <div className="map-picker-tools">
          <p className={`map-picker-help ${locationStatus === "unavailable" ? "location-error" : ""}`} role="status" aria-live="polite">{locationStatus === "locating" ? "Finding your current location…" : locationStatus === "unavailable" ? locationError : "Pan and zoom to the exact spot, then tap the map to place your pin."}</p>
          <button className="map-current-location" type="button" onClick={useCurrentLocation} disabled={locationStatus === "locating" || saving}>◎ <span>{saving ? "Selecting…" : locationStatus === "locating" ? "Locating…" : "Use my location"}</span></button>
        </div>
        <MapContainer center={[selected.lat, selected.lon]} zoom={13} scrollWheelZoom className="location-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport center={selected} />
          <MapClickHandler onPick={(coordinates) => { setSelected(coordinates); setMapSearch(""); setLocationStatus("selected"); }} />
          <CircleMarker center={[selected.lat, selected.lon]} radius={10} pathOptions={{ color: "#fff", weight: 3, fillColor: "#d94e3b", fillOpacity: 1 }} />
        </MapContainer>
        <footer className="map-picker-footer">
          <span>{selected.lat.toFixed(5)}, {selected.lon.toFixed(5)}</span>
          <div><button className="map-picker-cancel" type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="map-picker-confirm" type="button" onClick={confirmSelection} disabled={saving}>{saving ? "Saving…" : "Use this location"}</button></div>
        </footer>
      </section>
    </div>
  );
}

function AddressAutocomplete({ label, value, onChange, placeholder, required = false, coords, onMapPick, minChars = 3, id, error, showMap = true, showCurrentLocation = false, className = "", searchContext = "", stateOnly = "" }) {
  const selectedAddressRef = useRef("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchMessage, setSearchMessage] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("This browser does not support device location.");
      return;
    }

    setLocationLoading(true);
    setLocationMessage("Finding your precise location…");
    navigator.geolocation.getCurrentPosition(async ({ coords: current }) => {
      const coordinates = { lat: current.latitude, lon: current.longitude };
      let address = `${current.latitude.toFixed(5)}, ${current.longitude.toFixed(5)}`;
      try {
        const params = new URLSearchParams({ lat: current.latitude, lon: current.longitude, lang: "en" });
        const response = await fetch(`https://photon.komoot.io/reverse?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          const properties = data.features?.[0]?.properties;
          const place = properties?.name || properties?.street || properties?.locality || properties?.city;
          const area = [properties?.district, properties?.city, properties?.state].filter((part) => part && part !== place);
          if (place) address = [place, ...area].join(", ");
        }
      } catch {
        // Keep the precise coordinates when reverse geocoding is unavailable.
      }
      selectedAddressRef.current = address;
      onChange(address, coordinates);
      setSuggestions([]);
      setOpen(false);
      setLocationMessage(`Current location selected (about ±${Math.max(1, Math.round(current.accuracy))} m accuracy).`);
      setLocationLoading(false);
    }, (error) => {
      const message = error.code === 1
        ? "Location access was denied. Allow it in browser settings and try again."
        : error.code === 3
          ? "Location lookup timed out. Please try again."
          : "Could not get your location. Turn on device location and try again.";
      setLocationMessage(message);
      setLocationLoading(false);
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  }

  useEffect(() => {
    const query = value.trim();
    if (query.length < minChars || query === selectedAddressRef.current) return;

    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchMessage("");
      try {
        const params = photonSearchParams(query, { searchContext, stateOnly, limit: 10 });
        const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Address search unavailable");
        const data = await response.json();
        if (cancelled) return;

        const results = rankIndianPlaceFeatures(data.features, query, stateOnly).map((feature) => {
          const p = feature.properties || {};
          const main = p.name || p.street || p.locality || p.city || p.county || "";
          const parts = [p.street && p.street !== main ? p.street : "", p.district, p.city, p.state, p.country]
            .filter((part, index, all) => part && all.indexOf(part) === index && part !== main);
          return {
            label: [main, ...parts].filter(Boolean).join(", "),
            main: main || [p.city, p.state, p.country].filter(Boolean).join(", "),
            detail: parts.join(", "),
            coordinates: feature.geometry?.coordinates || null,
          };
        }).filter((item, index, all) => item.label && all.findIndex((other) => other.label === item.label) === index);
        setSuggestions(results);
        setSearchMessage(results.length ? "" : "No close match found in India. Add the area or city name, or pin the exact spot on the map.");
        setOpen(true);
      } catch (error) {
        if (!cancelled && error.name !== "AbortError") {
          setSuggestions([]);
          setSearchMessage("Location search is temporarily unavailable. You can still choose the exact spot on the map.");
          setOpen(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, minChars, searchContext, stateOnly]);

  function choose(item) {
    selectedAddressRef.current = item.label;
    onChange(item.label, item.coordinates ? { lon: item.coordinates[0], lat: item.coordinates[1] } : null);
    setLocationMessage("");
    setSearchMessage("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={`field field-full address-field ${className}`}>
      {label && <label className="address-label" htmlFor={id}>{label} {required && <b>*</b>}</label>}
      <div className="address-input-row">
        <div className="address-input-wrap">
        <input
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            selectedAddressRef.current = "";
            onChange(nextValue, null);
            setLocationMessage("");
            setActiveIndex(-1);
            setSuggestions([]);
            setOpen(false);
            setSearchMessage("");
            if (nextValue.trim().length < minChars) {
              setLoading(false);
            }
          }}
          onFocus={() => suggestions.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 140)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {loading && <span className="address-loading" aria-label="Searching addresses" />}
        {open && (suggestions.length > 0 || searchMessage) && (
          <div className="address-suggestions" role="listbox">
            {suggestions.map((item, index) => (
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`address-suggestion ${index === activeIndex ? "active" : ""}`}
                key={`${item.label}-${index}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
                <span className="suggestion-pin">⌖</span>
                <span className="suggestion-copy">
                  <strong>{item.main}</strong>
                  {item.detail && <small>{item.detail}</small>}
                </span>
                <span className="suggestion-arrow">↗</span>
              </button>
            ))}
            {searchMessage && <div className="suggestion-empty" role="status">{searchMessage}</div>}
            {suggestions.length > 0 && <div className="suggestion-attribution">Address data © OpenStreetMap contributors</div>}
          </div>
        )}
        </div>
        {showCurrentLocation && <button className="current-location-button" type="button" onClick={useCurrentLocation} disabled={locationLoading}><span aria-hidden="true">◎</span>{locationLoading ? "Locating…" : "Use my location"}</button>}
        {showMap && <button className="map-pick-button" type="button" onClick={() => setMapOpen(true)} aria-label={`Choose ${typeof label === "string" ? label : "location"} on map`} title="Choose on map">
          <span aria-hidden="true">⌖</span><span>Map</span>
        </button>}
      </div>
      {error && <small className="driver-error" id={`${id}-error`}>{error}</small>}
      {locationMessage && <small className="current-location-message" role="status">{locationMessage}</small>}
      {coords && !locationMessage && <span className="location-confirmed">Precise location coordinates saved</span>}
      {mapOpen && <LocationPicker
        title={typeof label === "string" ? label : "destination"}
        initialCoords={coords}
        onClose={() => setMapOpen(false)}
        onConfirm={async (coordinates) => {
          let address = `${coordinates.lat.toFixed(5)}, ${coordinates.lon.toFixed(5)}`;
          try {
            const params = new URLSearchParams({ lat: coordinates.lat, lon: coordinates.lon, lang: "en" });
            const response = await fetch(`https://photon.komoot.io/reverse?${params.toString()}`);
            if (response.ok) {
              const data = await response.json();
              const properties = data.features?.[0]?.properties;
              const place = properties?.name || properties?.street || properties?.locality || properties?.city;
              const area = [properties?.district, properties?.city, properties?.state].filter((part) => part && part !== place);
              if (place) address = [place, ...area].join(", ");
            }
          } catch {
            // Keep the coordinates as a valid location if reverse geocoding is unavailable.
          }
          selectedAddressRef.current = address;
          onMapPick(address, coordinates);
          setMapOpen(false);
        }}
      />}
    </div>
  );
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [templePage, setTemplePage] = useState(() => window.location.hash === "#temple-tours");
  const [driverPage, setDriverPage] = useState(() => isDriverRegisterPath(window.location.pathname));
  const [driverAdminPage, setDriverAdminPage] = useState(() => isDriverAdminPath(window.location.pathname));
  const [attachmentPage, setAttachmentPage] = useState(() => isCabAttachmentPath(window.location.pathname));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const syncPage = () => {
      const hash = window.location.hash;
      setPathname(window.location.pathname);
      setDriverPage(isDriverRegisterPath(window.location.pathname));
      setDriverAdminPage(isDriverAdminPath(window.location.pathname));
      setAttachmentPage(isCabAttachmentPath(window.location.pathname));
      setTemplePage(hash === "#temple-tours");
      if (hash && hash !== "#temple-tours") {
        requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
      }
    };
    window.addEventListener("hashchange", syncPage);
    window.addEventListener("popstate", syncPage);
    return () => {
      window.removeEventListener("hashchange", syncPage);
      window.removeEventListener("popstate", syncPage);
    };
  }, []);
  const [service, setService] = useState("daily");
  const activeRideTab = service === "rentals" ? "rentals" : ["oneway", "roundtrip"].includes(service) ? "outstation" : service === "airport" ? "airport" : "daily";
  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState("");
  const [fare, setFare] = useState(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [fareError, setFareError] = useState("");
  const [bookingSaving, setBookingSaving] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [submissionId, setSubmissionId] = useState(createSubmissionId);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tourRoute = isTourPath(pathname);
  const homeHref = (section) => `${driverPage || driverAdminPage || attachmentPage || tourRoute ? "/" : ""}#${section}`;

  function update(field, value, coordinates = undefined) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "pickup" ? { pickupCoords: coordinates } : {}),
      ...(field === "destination" ? { destinationCoords: coordinates } : {}),
    }));
    setNotice("");
    setWhatsappLink("");
    if (["pickup", "destination", "vehicle", "hours", "tripDays", "passengers"].includes(field)) {
      setFare(null);
      setFareError("");
    }
  }

  function chooseService(nextService) {
    setService(nextService);
    setNotice("");
    setFare(null);
    setFareError("");
  }

  async function geocodeAddress(address) {
    const params = photonSearchParams(address, { limit: 10 });
    const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
    if (!response.ok) throw new Error("Could not look up one of the addresses. Please select an address suggestion and try again.");
    const data = await response.json();
    const coordinates = rankIndianPlaceFeatures(data.features, address)[0]?.geometry?.coordinates;
    const resolved = coordinates?.length >= 2 ? { lon: coordinates[0], lat: coordinates[1] } : null;
    if (!isWithinIndia(resolved)) throw new Error("Could not verify this address within India. Select an India autocomplete result or choose a point on the map.");
    return resolved;
  }

  async function calculateFare() {
    setFareError("");
    setFare(null);
    if (!form.pickup.trim()) { setFareError("Enter a pickup location first."); return; }
    if (service !== "rentals" && !form.destination.trim()) { setFareError("Enter a destination first."); return; }
    if (form.vehicle === "tempo") { setFareError("Tempo Traveller rates depend on vehicle availability and trip details. Request a manual quotation."); return; }
    const vehicle = vehicles.find((item) => item.id === form.vehicle);
    if (!vehicle) { setFareError("Choose a vehicle to calculate your estimate."); return; }
    if (Number(form.passengers) > vehicle.passengers) {
      setFareError(`${vehicle.label} seats up to ${vehicle.passengers} passengers. Select a larger vehicle for this group.`);
      return;
    }
    if (service === "rentals") {
      const pickup = isValidCoordinates(form.pickupCoords) ? form.pickupCoords : await geocodeAddress(form.pickup).catch((error) => {
        setFareError(error.message || "Could not validate the pickup location.");
        return null;
      });
      if (!pickup) return;
      if (!isWithinIndia(pickup)) {
        setFareError("Choose a pickup location within India to calculate this estimate.");
        return;
      }
      const rental = calculateLocalPackage(form.hours, vehicle);
      setFare({
        distanceKm: null,
        billedDistanceKm: null,
        includedKm: rental.includedKm,
        packageHours: rental.packageHours,
        distanceCharge: 0,
        hourlyCharge: rental.packageCharge,
        driverAllowance: 0,
        minimumAdjustment: 0,
        tolls: null,
        parking: null,
        additionalFees: null,
        total: rental.packageCharge,
        notes: `${rental.packageHours}-hour local package with up to ${rental.includedKm} km. Extra distance, tolls, parking and taxes are excluded and require partner confirmation.`,
      });
      return;
    }

    setFareLoading(true);
    try {
      const pickup = isValidCoordinates(form.pickupCoords) ? form.pickupCoords : await geocodeAddress(form.pickup);
      const destination = isValidCoordinates(form.destinationCoords) ? form.destinationCoords : await geocodeAddress(form.destination);
      if (!isWithinIndia(pickup) || !isWithinIndia(destination)) throw new Error("Choose pickup and destination locations within India to calculate this estimate.");
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${destination.lon},${destination.lat}?overview=false`;
      const response = await fetch(routeUrl);
      if (!response.ok) throw new Error("The route service is temporarily unavailable. Please try again later.");
      const routeData = await response.json();
      const route = routeData.routes?.[0];
      if (!route || routeData.code !== "Ok" || !Number.isFinite(route.distance) || route.distance <= 0) throw new Error("A valid driving route could not be found for these addresses. Check the locations and try again.");
      const distanceKm = route.distance / 1000;
      const ratePerKm = ["oneway", "roundtrip"].includes(service)
        ? service === "oneway" ? vehicle.outstationOneWayPerKm : vehicle.outstationRoundTripPerKm
        : distanceKm < 20 ? vehicle.shortTripPerKm : vehicle.perKm;
      let billedDistanceKm = distanceKm;
      let distanceCharge = 0;
      let hourlyCharge = 0;
      let driverAllowance = 0;
      let minimumAdjustment = 0;
      let notes = "";

      if (service === "airport" || service === "daily") {
        distanceCharge = distanceKm * ratePerKm;
        minimumAdjustment = service === "airport" ? Math.max(0, vehicle.airportMinimum - distanceCharge) : 0;
        notes = service === "airport"
          ? `One-way road distance ${distanceKm.toFixed(1)} km at ${money(ratePerKm)}/km; airport minimum applies when higher. Tolls, parking and waiting are excluded.`
          : `One-way city road distance ${distanceKm.toFixed(1)} km at ${money(ratePerKm)}/km. Tolls, parking and waiting are excluded.`;
      } else if (service === "oneway") {
        const outstationFare = calculateOutstationFare(distanceKm, vehicle, form.tripDays, false);
        billedDistanceKm = outstationFare.billedDistanceKm;
        distanceCharge = outstationFare.distanceCharge;
        driverAllowance = outstationFare.driverAllowance;
        notes = `One-way drop uses ${money(ratePerKm)}/km with a ${OUTSTATION_TARIFF.oneWayMinimumKm} km minimum, plus driver allowance. Tolls, parking, permits and taxes are excluded.`;
      } else if (service === "roundtrip") {
        const days = Math.max(1, Number(form.tripDays) || 1);
        const outstationFare = calculateOutstationFare(distanceKm * 2 * days, vehicle, days, true);
        billedDistanceKm = outstationFare.billedDistanceKm;
        distanceCharge = outstationFare.distanceCharge;
        driverAllowance = outstationFare.driverAllowance;
        notes = `Round-trip estimate uses ${money(ratePerKm)}/km and a ${OUTSTATION_TARIFF.roundTripMinimumKmPerDay} km/day minimum (${days} day(s)), plus driver allowance. Tolls, parking, permits and overnight accommodation are excluded.`;
      }
      const total = distanceCharge + hourlyCharge + driverAllowance + minimumAdjustment;
      setFare({ distanceKm, billedDistanceKm, distanceCharge, hourlyCharge, driverAllowance, minimumAdjustment, tolls: null, parking: null, additionalFees: null, total, notes });
    } catch (error) {
      setFareError(error.message || "Unable to calculate the fare right now.");
    } finally {
      setFareLoading(false);
    }
  }

  async function submitBooking(event) {
    event.preventDefault();
    setBookingSaving(true);
    setNotice("");
    setWhatsappLink("");
    const number = (environment.whatsappNumber || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");
    const serviceName = services.find((item) => item.id === service)?.title || service;
    const groupVehicles = {
      tempo: { label: "Tempo Traveller", passengers: 12, luggage: null },
    };
    const selectedVehicle = vehicles.find((item) => item.id === form.vehicle) || groupVehicles[form.vehicle];
    if (!selectedVehicle) { setNotice("Choose a vehicle before requesting your quotation."); setBookingSaving(false); return; }
    if (Number(form.passengers) > selectedVehicle.passengers) {
      setNotice(`${selectedVehicle.label} seats up to ${selectedVehicle.passengers} passengers. Choose a suitable vehicle or reduce the passenger count.`);
      setBookingSaving(false);
      return;
    }
    const lines = [
      "Hello CabConnect Chennai, I'd like to request a cab quotation.",
      "",
      `Service: ${serviceName}`,
      `Pickup: ${form.pickup}`,
      `Destination: ${form.destination || "Not specified"}`,
      `Date: ${form.date}`,
      `Pickup time: ${form.time}`,
      `Passengers: ${form.passengers}`,
      `Vehicle preference: ${selectedVehicle.label}`,
      `Vehicle capacity: up to ${selectedVehicle.passengers} passengers${selectedVehicle.luggage ? `; ${selectedVehicle.luggage} medium bags (approximate)` : "; luggage capacity to be confirmed with the partner"}.`,
      ...(fare ? [
        `Estimated fare: ${money(fare.total)}`,
        ...(fare.distanceKm != null ? [`Road distance: ${fare.distanceKm.toFixed(1)} km one way`, `Billed distance: ${fare.billedDistanceKm.toFixed(1)} km`] : []),
        `Distance charges: ${money(fare.distanceCharge)}`,
        `Hourly charges: ${money(fare.hourlyCharge)}`,
        `Driver allowance: ${money(fare.driverAllowance)}`,
        `Airport minimum adjustment: ${money(fare.minimumAdjustment)}`,
        "Tolls: excluded; payable at actuals if applicable.",
        "Parking: excluded; payable at actuals if applicable.",
        "Waiting charges: excluded; confirm partner policy.",
        "Taxes and other fees: not configured; confirm before booking.",
        `Estimate details: ${fare.notes}`,
        "Estimate only; final price subject to partner availability and quotation approval.",
      ] : ["Fare estimate: Not calculated; please provide a quotation."]),
      ...(service === "rentals" ? [`Hours required: ${form.hours}`] : []),
      ...(["oneway", "roundtrip"].includes(service) ? [`Trip duration (days): ${form.tripDays}`] : []),
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Additional details: ${form.notes || "None"}`,
      "",
      "Please confirm availability and share the quotation. I understand this is a request, not a confirmed booking.",
    ];
    try {
      const requestId = await submitCustomerRequest({
        type: "cab_booking", name: form.name, mobile: form.phone, consent: form.contactConsent, submissionId,
        data: {
          service, serviceName, pickup: form.pickup, pickupCoords: form.pickupCoords,
          destination: form.destination, destinationCoords: form.destinationCoords,
          travelDate: form.date, pickupTime: form.time, passengers: Number(form.passengers),
          hours: service === "rentals" ? Number(form.hours) : null,
          tripDays: ["oneway", "roundtrip"].includes(service) ? Number(form.tripDays) : null,
          vehicleId: form.vehicle, vehicleLabel: selectedVehicle.label, notes: form.notes,
          estimatedFare: fare ? { total: fare.total, distanceKm: fare.distanceKm, billedDistanceKm: fare.billedDistanceKm, distanceCharge: fare.distanceCharge, hourlyCharge: fare.hourlyCharge, driverAllowance: fare.driverAllowance, minimumAdjustment: fare.minimumAdjustment, notes: fare.notes } : null,
        },
      });
      if (number) setWhatsappLink(`https://wa.me/${number}?text=${encodeURIComponent(`${lines.join("\n")}\n\nRequest reference: ${requestId}`)}`);
      setNotice(`Your request has been saved${number ? ". You can also continue to WhatsApp" : "; WhatsApp is unavailable, but CabConnect has received it"}. This is not a confirmed booking.`);
      setSubmissionId(createSubmissionId());
    } catch (error) {
      setNotice(error.message || "We could not save your request. No booking enquiry was recorded; please try again.");
    } finally {
      setBookingSaving(false);
    }
  }

  return (
    <div className="site-shell">
      {!driverPage && !attachmentPage && !templePage && !tourRoute && <div className="page-ride-backdrop" aria-hidden="true"><img src={serviceVisuals[service].image} alt="" /></div>}
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>Chennai rides, made refreshingly simple</span>
          <span className="top-contact"><span className="status-dot" /> Partner-operated commercial cabs · Manual confirmation</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container nav-inner">
          <a className="brand" href={homeHref("home")} aria-label="CabConnect Chennai home">
            <span className="brand-mark">C<span>+</span></span>
            <span className="brand-copy"><strong>CabConnect</strong><small>CHENNAI</small></span>
          </a>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
          <nav className={`main-nav ${menuOpen ? "menu-open" : ""}`} aria-label="Main navigation">
            <a href={homeHref("home")} onClick={() => setMenuOpen(false)}>Home</a>
            <a href={homeHref("book")} onClick={() => setMenuOpen(false)}>Book a Cab</a>
            <a href={homeHref("temple-tours")} aria-current={templePage ? "page" : undefined} onClick={() => setMenuOpen(false)}>Temple Tours</a>
            <a href="/tour-packages" aria-current={tourRoute ? "page" : undefined} onClick={() => setMenuOpen(false)}>Tour Packages</a>
            <a href="/driver-register" aria-current={driverPage ? "page" : undefined} onClick={() => setMenuOpen(false)}>For Drivers</a>
            <a href="/cab-attachment" aria-current={attachmentPage ? "page" : undefined} onClick={() => setMenuOpen(false)}>Attach Your Cab</a>
            <a href={homeHref("contact")} onClick={() => setMenuOpen(false)}>Contact</a>
          </nav>
          <a className="nav-cta" href={homeHref("book")}>Book a Cab <span>↗</span></a>
        </div>
      </header>

      <main>
        {driverAdminPage ? <DriverAdmin /> : driverPage ? <DriverRegistration whatsappNumber={environment.whatsappNumber || DEFAULT_WHATSAPP_NUMBER} /> : attachmentPage ? <CabAttachment whatsappNumber={environment.whatsappNumber || DEFAULT_WHATSAPP_NUMBER} /> : templePage ? <TempleTours AddressAutocomplete={AddressAutocomplete} vehicles={vehicles} whatsappNumber={environment.whatsappNumber || DEFAULT_WHATSAPP_NUMBER} /> : tourRoute ? <Suspense fallback={<div className="tour-loading" role="status">Loading tour details…</div>}>{pathname === "/tour-packages/kodaikanal" ? <KodaikanalTour AddressAutocomplete={AddressAutocomplete} vehicles={vehicles} whatsappNumber={environment.whatsappNumber || ""} /> : <TourPackages pathname={pathname} AddressAutocomplete={AddressAutocomplete} vehicles={vehicles} whatsappNumber={environment.whatsappNumber || ""} />}</Suspense> : <>
        <section className="hero" id="home" style={{ "--hero-ride-image": `url(${serviceVisuals[service].image})` }}>
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> YOUR CITY. YOUR RIDE.</div>
              <span className="hero-selected-service">{serviceVisuals[service].headline}</span>
              <h1>Your trusted taxi<br /><em>partner in Chennai.</em></h1>
              <p className="hero-lede">Local rides, airport transfers, outstation trips and temple tours—with a clear estimate and personal confirmation.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#book">Plan your ride <span>↗</span></a>
                <a className="text-link" href="#services">Explore services <span>→</span></a>
              </div>
              <div className="trust-row">
                <div className="trust-avatars" aria-hidden="true"><span>CC</span><span>24</span><span>✓</span></div>
                <div><strong>Local support, human confirmation</strong><small>No surprise instant fare estimates</small></div>
              </div>
            </div>
            <div className="hero-visual" aria-label="CabConnect ride information">
              <div className="visual-topline"><span className="live-pill"><i /> BOOKING MADE PERSONAL</span><span className="visual-number">CC / 01</span></div>
              <div className="route-art">
                <div className="route-map-lines" />
                <div className="route-path"><span className="route-point point-a" /><span className="route-point point-b" /><span className="route-point point-c" /></div>
                <div className="map-label label-a"><small>STARTING FROM</small><strong>Chennai</strong></div>
                <div className="map-label label-b"><small>YOUR DESTINATION</small><strong>Wherever next</strong></div>
                <div className="car-illustration">
                  <div className="car-shadow" /><div className="car-body"><div className="car-window" /><div className="car-hood" /><div className="car-light" /><div className="car-wheel wheel-left" /><div className="car-wheel wheel-right" /></div>
                </div>
              </div>
              <div className="visual-bottom">
                <div><small>YOUR RIDE, YOUR WAY</small><strong>One simple request.</strong></div>
                <span className="arrow-circle">↗</span>
              </div>
            </div>
          </div>
          <div className="container hero-foot"><span>LOCAL · AIRPORT · OUTSTATION</span><span className="foot-rule" /><span>MADE FOR THE WAY CHENNAI MOVES</span></div>
        </section>

        <section className="booking-section" id="book">
          <div className="container booking-layout">
            <div className="section-intro">
              <div className="eyebrow"><span className="eyebrow-line" /> START YOUR JOURNEY</div>
              <h2>Let's get you<br />there.</h2>
              <p>Pick a ride for the city, airport, or a trip beyond Chennai. Choose your Dzire or Ertiga, then get a clear estimate and personal confirmation.</p>
              <div className="service-ride-panel" key={service} style={{ "--service-ride-image": `url(${serviceVisuals[service].image})` }}>
                <img className="service-ride-image" src={serviceVisuals[service].image} alt={serviceVisuals[service].alt} />
                <div className="service-ride-caption"><span>CHENNAI · {service === "airport" ? "AIRPORT" : service === "rentals" ? "RENTALS" : service === "daily" ? "DAILY RIDES" : "OUTSTATION"}</span><h3>{serviceVisuals[service].headline}</h3><p>{serviceVisuals[service].caption}</p></div>
              </div>
              <div className="booking-note"><span className="note-icon">i</span><span><strong>Transparent by design</strong><small>See a rate-based estimate, then confirm the final fare and vehicle availability with our team.</small></span></div>
            </div>
            <div className="booking-card">
              <div className="booking-card-head"><div><span className="card-step">BOOK YOUR RIDE</span><h3>Plan your ride</h3></div><span className="card-decoration">✳</span></div>
              <div className="booking-service-tabs" role="tablist" aria-label="Choose ride category">
                <button type="button" role="tab" aria-selected={activeRideTab === "daily"} className={activeRideTab === "daily" ? "selected" : ""} onClick={() => chooseService("daily")}>Daily rides</button>
                <button type="button" role="tab" aria-selected={activeRideTab === "outstation"} className={activeRideTab === "outstation" ? "selected" : ""} onClick={() => chooseService(["oneway", "roundtrip"].includes(service) ? service : "oneway")}>Outstation</button>
                <button type="button" role="tab" aria-selected={activeRideTab === "rentals"} className={activeRideTab === "rentals" ? "selected" : ""} onClick={() => chooseService("rentals")}>Rentals</button>
                <button type="button" role="tab" aria-selected={activeRideTab === "airport"} className={activeRideTab === "airport" ? "selected" : ""} onClick={() => chooseService("airport")}>Airport transfer</button>
              </div>
              {activeRideTab === "outstation" && <div className="outstation-trip-tabs" role="group" aria-label="Outstation journey type"><button type="button" aria-pressed={service === "oneway"} className={service === "oneway" ? "selected" : ""} onClick={() => chooseService("oneway")}>One way</button><button type="button" aria-pressed={service === "roundtrip"} className={service === "roundtrip" ? "selected" : ""} onClick={() => chooseService("roundtrip")}>Round trip</button></div>}
              <form onSubmit={submitBooking}>
                <section className="booking-wizard-stage" aria-labelledby="booking-trip-heading">
                <section className="booking-main-column" aria-label="Trip details and vehicle">
                <div className="form-grid booking-trip-grid">
                  <AddressAutocomplete id="booking-pickup" className="booking-location-field" label="Pickup location" required value={form.pickup} coords={form.pickupCoords} onChange={(value, coordinates) => update("pickup", value, coordinates)} onMapPick={(value, coordinates) => update("pickup", value, coordinates)} placeholder="Pickup area or landmark" searchContext="Chennai, Tamil Nadu" showMap={false} showCurrentLocation />
                  <AddressAutocomplete id="booking-destination" className="booking-location-field" label={<>Destination {service === "rentals" ? <small>(optional)</small> : <b>*</b>}</>} required={service !== "rentals"} value={form.destination} coords={form.destinationCoords} onChange={(value, coordinates) => update("destination", value, coordinates)} onMapPick={(value, coordinates) => update("destination", value, coordinates)} placeholder="Drop-off area or landmark" searchContext={["daily", "airport"].includes(service) ? "Chennai, Tamil Nadu" : ""} showMap={false} />
                  <label className="field"><span>Travel date <b>*</b></span><input id="booking-date" type="date" min={today} required value={form.date} onChange={(e) => update("date", e.target.value)} /></label>
                  <label className="field"><span>Pickup time <b>*</b></span><input id="booking-time" type="time" required value={form.time} onChange={(e) => update("time", e.target.value)} /></label>
                  <label className="field"><span>Passengers</span><select value={form.passengers} onChange={(e) => update("passengers", e.target.value)}>{Array.from({ length: 12 }, (_, index) => String(index + 1)).map((n) => <option key={n} value={n}>{n} passenger{n === "1" ? "" : "s"}</option>)}</select></label>
                  {service === "rentals" && <label className="field"><span>Hours required</span><select value={form.hours} onChange={(e) => update("hours", e.target.value)}>{["2","3","4","6","8","10","12"].map((n) => <option key={n} value={n}>{n} hours</option>)}</select></label>}
                  {["oneway", "roundtrip"].includes(service) && <label className="field"><span>Trip duration</span><select value={form.tripDays} onChange={(e) => update("tripDays", e.target.value)}>{["1","2","3","4","5","7","10","14"].map((n) => <option key={n} value={n}>{n} day{n === "1" ? "" : "s"}</option>)}</select></label>}
                </div>
                <fieldset className="vehicle-picker">
                  <legend>Choose your vehicle <b>*</b></legend>
                  <div className="vehicle-picker-layout">
                    <label className="field vehicle-select-field">
                      <span>Vehicle type</span>
                      <select required value={form.vehicle} onChange={(event) => update("vehicle", event.target.value)}>
                        <option value="" disabled>Select a vehicle type</option>
                        {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.id === "dzire" ? "Sedan" : "SUV"}</option>)}
                        <option value="tempo">Tempo Traveller</option>
                      </select>
                    </label>
                    {!form.vehicle && <div className="vehicle-empty-state" aria-live="polite">Choose a category to see its vehicle and capacity.</div>}
                    {form.vehicle === "tempo" && <article className="vehicle-detail-card vehicle-manual-card" aria-live="polite"><img src="/vehicles/tempo-traveller-generated.png" alt="White Tempo Traveller passenger minibus" /><div className="vehicle-detail-copy"><strong>Tempo Traveller</strong><span>Custom seating · passenger capacity confirmed with the partner</span></div></article>}
                    {vehicles.filter((vehicle) => vehicle.id === form.vehicle).map((vehicle) => <article className="vehicle-detail-card" key={vehicle.id} aria-live="polite">
                      <img src={vehicle.image} alt={vehicle.label} />
                      <div className="vehicle-detail-copy"><strong>{vehicle.label}</strong><span>Up to {vehicle.passengers} passengers · {vehicle.luggage} medium bags</span></div>
                    </article>)}
                  </div>
                  <p className="vehicle-rate-note">Indicative Chennai operator rates. Minimum distance packages may apply; tolls, parking, permits, waiting and taxes are not included. Confirm availability and your final quote with our team.</p>
                </fieldset>
                </section>
                </section>
                <section className="booking-wizard-stage" aria-labelledby="booking-contact-heading">
                <h4 id="booking-contact-heading">How can we reach you?</h4>
                <div className="form-grid">
                  <label className="field"><span>Your name <b>*</b></span><input id="booking-name" required autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name" /></label>
                  <label className="field"><span>Mobile number <b>*</b></span><input id="booking-phone" required type="tel" inputMode="tel" pattern="(?:[0-9+ ]|\x2d){8,18}" autoComplete="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" /></label>
                  <label className="field field-full"><span>Anything else? <small>(optional)</small></span><textarea rows="2" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Luggage, flight number, preferred vehicle, return details…" /></label>
                  <label className="field field-full driver-check"><input type="checkbox" required checked={form.contactConsent} onChange={(e) => update("contactConsent", e.target.checked)} /><span>I agree that CabConnect may store these trip details and contact me about this request. <b>*</b></span></label>
                </div>
                </section>
                <section className="booking-wizard-stage" aria-labelledby="booking-review-heading">
                <h4 id="booking-review-heading">Fare estimate &amp; confirmation</h4>
                <div className="fare-calculator">
                  <div className="fare-calculator-head"><div><span className="card-step">03 / ESTIMATED FARE</span><h3>See your estimated price</h3></div><span className="fare-calculator-icon">₹</span></div>
                  <p className="fare-help">Route or trip changes clear the old estimate. Recalculate to get a fresh estimate using the selected vehicle and trip duration. Market-based rates are indicative; the team confirms your final quote.</p>
                  <button className="button fare-calculate-button" type="button" onClick={calculateFare} disabled={fareLoading}>{fareLoading ? "Calculating route…" : "Calculate estimated fare"} <span>↗</span></button>
                  {fareError && <div className="fare-error" role="alert">{fareError}</div>}
                  {fare && <div className="fare-result" aria-live="polite">
                    <div className="fare-result-top"><span>Estimated total</span><strong>{money(fare.total)}</strong></div>
                    {fare.distanceKm != null && <div className="fare-breakdown-row"><span>Road distance (one way)</span><strong>{fare.distanceKm.toFixed(1)} km</strong></div>}
                    {fare.distanceKm != null && <div className="fare-breakdown-row"><span>Distance charge ({fare.billedDistanceKm.toFixed(1)} billed km)</span><strong>{money(fare.distanceCharge)}</strong></div>}
                    {fare.includedKm != null && <div className="fare-breakdown-row"><span>Included distance in package</span><strong>{fare.includedKm} km</strong></div>}
                    <div className="fare-breakdown-row"><span>{fare.packageHours ? `Local package (${fare.packageHours} hours)` : "Hourly charge"}</span><strong>{money(fare.hourlyCharge)}</strong></div>
                    <div className="fare-breakdown-row"><span>Driver allowance</span><strong>{money(fare.driverAllowance)}</strong></div>
                    {service === "airport" && <div className="fare-breakdown-row"><span>Airport minimum adjustment</span><strong>{money(fare.minimumAdjustment)}</strong></div>}
                    <div className="fare-breakdown-row excluded"><span>Tolls</span><strong>Excluded; actuals extra</strong></div>
                    <div className="fare-breakdown-row excluded"><span>Parking</span><strong>Excluded; actuals extra</strong></div>
                    <div className="fare-breakdown-row excluded"><span>Waiting charges</span><strong>Excluded; confirm policy</strong></div>
                    <div className="fare-breakdown-row excluded"><span>Taxes and other fees</span><strong>Not configured</strong></div>
                    <p>{fare.notes}</p>
                    <p className="fare-disclaimer">Indicative estimate only, not a confirmed quotation. Excluded items are not included in the total. Partner availability, model-specific pricing, taxes and actual expenses must be confirmed before booking.</p>
                  </div>}
                </div>
                <button className="button button-submit" type="submit" disabled={bookingSaving}>{bookingSaving ? "Saving your request…" : "Save request and continue"} <span>→</span></button>
                <p className="form-legal">Your request is saved for authorised CabConnect staff. Any displayed fare is an estimate only; your booking is not confirmed until the team confirms availability and the final quotation.</p>
                {whatsappLink && <a className="booking-whatsapp-followup" href={whatsappLink} target="_blank" rel="noreferrer">Continue to WhatsApp ↗</a>}
                {notice && <div className="form-notice" role="status">{notice}</div>}
                </section>
              </form>
            </div>
          </div>
        </section>

        <section className="services-section" id="services">
          <div className="container">
            <div className="section-heading-row"><div><div className="eyebrow"><span className="eyebrow-line" /> RIDE YOUR WAY</div><h2>One city. <em>Many ways to go.</em></h2></div><p>Daily city rides, airport runs, hourly plans, and outstation trips in a Dzire or Ertiga. Larger groups can request Tempo Traveller availability.</p></div>
            <div className="service-cards">
              {serviceHighlights.map((item, index) => item.id === "temple" ? <a className="service-card" key={item.id} href="#temple-tours">
                <div className="service-card-top"><span>0{index + 1}</span><span className="service-card-icon">{item.icon}</span></div><h3>{item.title}</h3><p>{item.subtitle} with a route planned around your stops.</p><span className="card-link">Explore temples <b>↗</b></span>
              </a> : <button type="button" className="service-card" key={item.id} onClick={() => { setService(item.id); document.getElementById("book")?.scrollIntoView({ behavior: "smooth" }); }}>
                <div className="service-card-top"><span>0{index + 1}</span><span className="service-card-icon">{item.icon}</span></div><h3>{item.title}</h3><p>{item.subtitle} with a quote confirmed by our team.</p><span className="card-link">Request this ride <b>↗</b></span>
              </button>)}
            </div>
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="container how-grid">
            <div><div className="eyebrow"><span className="eyebrow-line" /> EASY AS ONE, TWO, THREE</div><h2>A better ride<br /><em>starts here.</em></h2><p className="how-intro">No complicated checkout. No mystery fare. Just a straightforward request and a real person to confirm the details.</p></div>
            <div className="steps">
              <div className="step"><span className="step-no">01</span><div><h3>Tell us your plan</h3><p>Choose your trip type, pickup, destination and timing.</p></div><span className="step-symbol">↗</span></div>
              <div className="step"><span className="step-no">02</span><div><h3>Get a personal quote</h3><p>Our team checks availability with partner commercial vehicles.</p></div><span className="step-symbol">₹</span></div>
              <div className="step"><span className="step-no">03</span><div><h3>Confirm your booking</h3><p>Review the quote and confirm directly with our team on WhatsApp.</p></div><span className="step-symbol">✓</span></div>
            </div>
          </div>
        </section>

        <section className="partner-section" id="partners">
          <div className="container">
            <div className="section-heading-row"><div><div className="eyebrow"><span className="eyebrow-line" /> GROW WITH CABCONNECT</div><h2>Built for people<br /><em>behind every ride.</em></h2></div><p>Drive with our local team or attach commercial vehicles to the network. Each application is reviewed separately.</p></div>
            <div className="partner-card-grid">
              <article className="partner-card"><span className="partner-card-no">01 / DRIVER PARTNERS</span><h3>Drive with CabConnect</h3><p>Share your operating area, experience and preferred schedule. You can apply even if you need a vehicle partner.</p><a href="/driver-register">Register as a driver <b>↗</b></a></article>
              <article className="partner-card"><span className="partner-card-no">02 / VEHICLE OWNERS</span><h3>Attach your cab or fleet</h3><p>Submit each vehicle and its assigned driver separately, with commercial and document details for review.</p><a href="/cab-attachment">Attach a cab <b>↗</b></a></article>
              <article className="partner-card partner-temple-card"><span className="partner-card-no">03 / TEMPLE JOURNEYS</span><h3>Plan a temple tour</h3><p>Build a route from individual temples and request an indicative fare for your journey.</p><a href="#temple-tours">Explore temple tours <b>↗</b></a></article>
            </div>
          </div>
        </section>

        <section className="why-section" id="why-us"><div className="container"><div className="why-reference-heading"><div className="eyebrow"><span className="eyebrow-line" /> THE CABCONNECT DIFFERENCE</div><h2>Why choose CabConnect Chennai?</h2></div><div className="benefit-grid"><article><span>✓</span><p><strong>Partner review</strong><small>Driver and vehicle details are reviewed by our team.</small></p></article><article><span>₹</span><p><strong>Clear estimates</strong><small>See indicative rates before confirming your ride.</small></p></article><article><span>⌖</span><p><strong>Local &amp; outstation</strong><small>Ride across Chennai and beyond.</small></p></article><article><span>◉</span><p><strong>Human support</strong><small>Confirm availability directly with our team.</small></p></article></div></div></section>

        <section className="homepage-temples" aria-labelledby="homepage-temples-title">
          <div className="container"><div className="home-temples-heading"><div><span className="eyebrow">JOURNEYS WITH MEANING</span><h2 id="homepage-temples-title">Popular temple tours</h2><p>Explore sacred destinations across Tamil Nadu with a route planned around your stops.</p></div><a href="#temple-tours">View all temples <span>↗</span></a></div>
            <div className="home-temple-grid">{homepageTemples.map((temple) => <a className="home-temple-card" href="#temple-tours" key={temple.id}><img src={temple.image || "/temple-tour-background.png"} alt={`${temple.name} temple`} loading="lazy" /><span><strong>{temple.name}</strong><small>{temple.town} · Murugan temple</small></span></a>)}</div>
          </div>
        </section>
        </>}
      </main>

      <footer className="site-footer" id="contact"><div className="container footer-main"><a className="brand brand-footer" href={homeHref("home")}><span className="brand-mark">C<span>+</span></span><span className="brand-copy"><strong>CabConnect</strong><small>CHENNAI</small></span></a><p>Good journeys begin with a better connection.</p><a href={homeHref("book")} className="footer-cta">Contact our team <span>↗</span></a></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} CabConnect Chennai</span><span>Bookings are subject to availability and manual confirmation.</span></div></footer>
    </div>
  );
}
