import { useCallback, useEffect, useState } from "react";
import { APPLICATION_STATUSES } from "./driverRegistrationUtils.js";
import { supabase, supabaseConfigured } from "../lib/supabase.js";
import "./driverAdmin.css";

const DRIVER_FIELDS = "application_id,full_name,mobile,whatsapp,city_area,experience_years,licence_status,badge_status,police_verification_certificate,preferred_work_type,preferred_shift,languages,previous_experience,expected_monthly_salary,additional_information,status,admin_notes,created_at,updated_at";
const REQUEST_STATUSES = ["New", "Reviewing", "Quoted", "Contacted", "Confirmed", "Rejected", "Completed"];
const REQUEST_TYPES = ["cab_booking", "tour_quote", "temple_tour", "cab_attachment"];
const prettyDate = (value) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function DriverAdmin() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("drivers");
  const [applications, setApplications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [status, setStatus] = useState("");
  const [requestType, setRequestType] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      const current = data.session?.user;
      if (current?.app_metadata?.role === "driver_admin") setUser(current);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user;
      setUser(current?.app_metadata?.role === "driver_admin" ? current : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(event) {
    event.preventDefault(); setLoading(true); setLoginError("");
    try {
      if (!supabaseConfigured) throw new Error("Supabase is not configured. Set the public URL and key in .env.local.");
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      if (data.user?.app_metadata?.role !== "driver_admin") {
        await supabase.auth.signOut();
        throw new Error("This account is not authorised to manage applications. Ask an existing project owner to assign the driver_admin role in trusted Supabase Auth user metadata.");
      }
      setUser(data.user); setPassword("");
    } catch (cause) { setLoginError(cause.message || "Could not sign in. Check your credentials and try again."); }
    finally { setLoading(false); }
  }

  const loadApplications = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError("");
    try {
      let query = supabase.from("driver_applications").select(DRIVER_FIELDS).order("created_at", { ascending: false }).limit(200);
      const term = search.trim().replace(/[(),]/g, " ");
      if (term) query = query.or(`full_name.ilike.%${term}%,mobile.ilike.%${term.replace(/\s/g, "")}%,whatsapp.ilike.%${term.replace(/\s/g, "")}%`);
      if (location.trim()) query = query.ilike("city_area", `%${location.trim()}%`);
      if (experience !== "") query = query.eq("experience_years", Number(experience));
      if (status) query = query.eq("status", status);
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setApplications(data || []);
    } catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  }, [user, search, location, experience, status]);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError("");
    try {
      let query = supabase.from("customer_requests").select("*").order("created_at", { ascending: false }).limit(200);
      const term = search.trim().replace(/[(),]/g, " ");
      if (term) query = query.or(`customer_name.ilike.%${term}%,mobile.ilike.%${term.replace(/\s/g, "")}%`);
      if (requestType) query = query.eq("request_type", requestType);
      if (status) query = query.eq("status", status);
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setRequests(data || []);
    } catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  }, [user, search, requestType, status]);

  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setTimeout(() => { void (tab === "drivers" ? loadApplications() : loadRequests()); }, 180);
    return () => window.clearTimeout(timer);
  }, [user, tab, loadApplications, loadRequests]);

  async function updateRecord(table, idField, id, patch, setter, rows) {
    setError("");
    try {
      const { data, error: updateError } = await supabase.from(table).update(patch).eq(idField, id).select("*").single();
      if (updateError) throw updateError;
      setter(rows.map((row) => row[idField] === id ? { ...row, ...data } : row));
    } catch (cause) { setError(cause.message); }
  }

  if (!user) return <main className="driver-admin-page"><section className="driver-admin-login"><span className="driver-step">CABCONNECT · ADMIN</span><h1>Application workspace</h1><p>Sign in with an authorised administrator account to review private driver and customer enquiries.</p><form onSubmit={signIn}><label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{loginError && <p className="driver-admin-error" role="alert">{loginError}</p>}<button className="driver-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button></form></section></main>;

  const selectedDriver = applications.find((item) => item.application_id === selectedId);
  const selectedRequest = requests.find((item) => item.request_id === selectedId);
  return <main className="driver-admin-page"><div className="driver-admin-shell">
    <header className="driver-admin-heading"><div><span className="driver-step">CABCONNECT · ADMIN</span><h1>Application workspace</h1><p>Private workspace · signed in as {user.email}</p></div><button className="driver-secondary" type="button" onClick={() => { void supabase.auth.signOut(); setApplications([]); setRequests([]); }}>Sign out</button></header>
    <nav className="driver-admin-filters" aria-label="Application category"><button className="driver-submit" type="button" onClick={() => { setTab("drivers"); setSelectedId(""); setStatus(""); }}>Driver applications</button><button className="driver-secondary" type="button" onClick={() => { setTab("requests"); setSelectedId(""); setStatus(""); }}>Customer requests</button></nav>
    <section className="driver-admin-filters" aria-label="Search and filter applications">
      <label>Search name or mobile<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or phone number" /></label>
      {tab === "drivers" ? <><label>Location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or operating area" /></label><label>Experience<select value={experience} onChange={(event) => setExperience(event.target.value)}><option value="">Any experience</option>{Array.from({ length: 61 }, (_, i) => i).map((years) => <option key={years} value={years}>{years} {years === 1 ? "year" : "years"}</option>)}</select></label></> : <label>Request type<select value={requestType} onChange={(event) => setRequestType(event.target.value)}><option value="">All request types</option>{REQUEST_TYPES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>}
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{(tab === "drivers" ? APPLICATION_STATUSES : REQUEST_STATUSES).map((item) => <option key={item}>{item}</option>)}</select></label>
      <button className="driver-submit" type="button" onClick={() => void (tab === "drivers" ? loadApplications() : loadRequests())} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
    </section>
    {error && <p className="driver-admin-error" role="alert">{error}</p>}
    <div className="driver-admin-content"><section className="driver-admin-list" aria-label={tab === "drivers" ? "Driver applications" : "Customer requests"}>
      <p className="driver-admin-count">{tab === "drivers" ? applications.length : requests.length} record{(tab === "drivers" ? applications.length : requests.length) === 1 ? "" : "s"}{(tab === "drivers" ? applications.length : requests.length) === 200 ? " · showing latest 200" : ""}</p>
      {tab === "drivers" ? applications.map((item) => <button type="button" className={`driver-admin-row ${selectedId === item.application_id ? "selected" : ""}`} key={item.application_id} onClick={() => setSelectedId(item.application_id)}><span><strong>{item.full_name}</strong><small>{item.city_area} · {item.experience_years} years</small></span><span className={`driver-status status-${item.status.toLowerCase()}`}>{item.status}</span><small>{prettyDate(item.created_at)}</small></button>) : requests.map((item) => <button type="button" className={`driver-admin-row ${selectedId === item.request_id ? "selected" : ""}`} key={item.request_id} onClick={() => setSelectedId(item.request_id)}><span><strong>{item.customer_name}</strong><small>{item.request_type.replaceAll("_", " ")} · {item.mobile}</small></span><span className="driver-status">{item.status}</span><small>{prettyDate(item.created_at)}</small></button>)}
      {!loading && (tab === "drivers" ? applications : requests).length === 0 && <p className="driver-admin-empty">No records match those filters.</p>}
    </section>
    {selectedDriver && <aside className="driver-admin-detail"><div className="driver-admin-detail-head"><div><span className="driver-step">DRIVER APPLICATION</span><h2>{selectedDriver.full_name}</h2></div><button type="button" className="driver-admin-close" onClick={() => setSelectedId("")} aria-label="Close application details">×</button></div><p className="driver-admin-meta">Submitted {prettyDate(selectedDriver.created_at)} · Updated {prettyDate(selectedDriver.updated_at)}</p>
      <dl className="driver-admin-data">{[["Mobile", selectedDriver.mobile], ["WhatsApp", selectedDriver.whatsapp], ["Location", selectedDriver.city_area], ["Experience", `${selectedDriver.experience_years} years`], ["Licence", selectedDriver.licence_status], ["Driver badge", selectedDriver.badge_status], ["Police verification", selectedDriver.police_verification_certificate], ["Work type", selectedDriver.preferred_work_type], ["Shift", selectedDriver.preferred_shift], ["Languages", selectedDriver.languages || "Not provided"], ["Previous experience", selectedDriver.previous_experience || "Not provided"], ["Expected salary", selectedDriver.expected_monthly_salary ? `₹${selectedDriver.expected_monthly_salary.toLocaleString("en-IN")} / month` : "Not provided"], ["Additional information", selectedDriver.additional_information || "None"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <label className="driver-admin-edit">Application status<select value={selectedDriver.status} onChange={(event) => void updateRecord("driver_applications", "application_id", selectedDriver.application_id, { status: event.target.value }, setApplications, applications)}>{APPLICATION_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="driver-admin-edit">Internal notes<textarea rows="4" maxLength="5000" defaultValue={selectedDriver.admin_notes} key={`${selectedDriver.application_id}-${selectedDriver.updated_at}`} onBlur={(event) => { const notes = event.target.value; if (notes !== selectedDriver.admin_notes) void updateRecord("driver_applications", "application_id", selectedDriver.application_id, { admin_notes: notes }, setApplications, applications); }} /></label>
      <div className="driver-admin-contact"><a href={`tel:${selectedDriver.mobile}`}>Call applicant</a><a href={`https://wa.me/91${selectedDriver.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp applicant ↗</a></div>
    </aside>}
    {selectedRequest && <RequestDetail request={selectedRequest} onClose={() => setSelectedId("")} onSave={(patch) => updateRecord("customer_requests", "request_id", selectedRequest.request_id, patch, setRequests, requests)} />}
    </div>
  </div></main>;
}

function RequestDetail({ request, onClose, onSave }) {
  const [quote, setQuote] = useState(request.quoted_amount ?? "");
  const [quoteNotes, setQuoteNotes] = useState(request.quote_notes || "");
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || "");
  return <aside className="driver-admin-detail"><div className="driver-admin-detail-head"><div><span className="driver-step">{request.request_type.replaceAll("_", " ").toUpperCase()}</span><h2>{request.customer_name}</h2></div><button type="button" className="driver-admin-close" onClick={onClose} aria-label="Close request details">×</button></div>
    <p className="driver-admin-meta">Submitted {prettyDate(request.created_at)} · Updated {prettyDate(request.updated_at)}</p>
    <dl className="driver-admin-data">{[["Mobile", request.mobile], ["Request reference", request.request_id], ["Contact consent", request.contact_consent ? "Yes" : "No"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <h3>Full request details</h3><pre className="driver-admin-request-data">{JSON.stringify(request.request_data, null, 2)}</pre>
    <label className="driver-admin-edit">Request status<select value={request.status} onChange={(event) => onSave({ status: event.target.value })}>{REQUEST_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="driver-admin-edit">Quote amount (₹)<input type="number" min="0" step="0.01" value={quote} onChange={(event) => setQuote(event.target.value)} /></label><label className="driver-admin-edit">Quote notes<textarea rows="3" maxLength="5000" value={quoteNotes} onChange={(event) => setQuoteNotes(event.target.value)} /></label><label className="driver-admin-edit">Internal notes<textarea rows="3" maxLength="5000" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} /></label><button className="driver-submit" type="button" onClick={() => onSave({ quoted_amount: quote === "" ? null : Number(quote), quote_notes: quoteNotes, admin_notes: adminNotes })}>Save quotation and notes</button>
    <div className="driver-admin-contact"><a href={`tel:${request.mobile}`}>Call customer</a><a href={`https://wa.me/91${request.mobile}`} target="_blank" rel="noreferrer">WhatsApp customer ↗</a></div>
  </aside>;
}
