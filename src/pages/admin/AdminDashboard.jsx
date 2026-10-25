import { useCallback, useEffect, useMemo, useState } from "react";
import { APPLICATION_STATUSES } from "../../drivers/driverRegistrationUtils.js";
import { supabaseConfigured } from "../../lib/supabase";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import { createTourPackage, deleteTourPackage, fetchAdminCustomerRequests, fetchAdminDriverApplications, fetchAdminTourPackages, updateCustomerRequest, updateDriverApplication, updateTourPackage } from "../../services/adminDataService";
import { signInAdmin, signOutAdmin } from "../../services/adminAuthService";
import { environment } from "../../config/environment";
import AdminWorkspace from "../../layouts/AdminWorkspace.jsx";
import "./adminDashboard.css";

const REQUEST_STATUSES = ["New", "Reviewing", "Quoted", "Contacted", "Confirmed", "Rejected", "Completed"];
const REQUEST_TYPES = ["cab_booking", "tour_quote", "temple_tour", "cab_attachment"];
const REQUEST_LABELS = { cab_booking: "Cab bookings", tour_quote: "Tour quotes", temple_tour: "Temple tours", cab_attachment: "Cab attachments" };
const localAdminPreview = environment.isDevelopment;
const SECTION_ITEMS = [
  ["overview", "Overview", "⌂"],
  ["requests", "Bookings & enquiries", "↗"],
  ["attachments", "Cab attachments", "▣"],
  ["drivers", "Driver applications", "♙"],
  ["packages", "Tour packages", "▧"],
  ["reports", "Reports", "▤"],
];
const PAGE_SIZE = 25;
const prettyDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const requestTitle = (type) => REQUEST_LABELS[type] || type?.replaceAll("_", " ") || "Customer request";

export default function DriverAdmin() {
  const { user, setUser, authReady, dashboardAccess } = useAdminAccess(localAdminPreview);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [localLoginOpen, setLocalLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dataErrors, setDataErrors] = useState({});
  const [section, setSection] = useState("overview");
  const [applications, setApplications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [status, setStatus] = useState("");
  const [requestType, setRequestType] = useState("");
  const [page, setPage] = useState(1);
  const [packageEditor, setPackageEditor] = useState(null);
  const [packageSaving, setPackageSaving] = useState(false);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const accountLabel = localAdminPreview ? "Local developer" : user?.email || "Administrator";

  async function signIn(event) {
    event.preventDefault(); setLoading(true); setLoginError("");
    try {
      if (!supabaseConfigured) throw new Error("Supabase is not configured. Set the public URL and key in .env.local.");
      const admin = await signInAdmin(email, password);
      setUser(admin); setPassword("");
    } catch (cause) { setLoginError(cause.message || "Could not sign in. Check your credentials and try again."); }
    finally { setLoading(false); }
  }

  async function signOut() {
    try {
      await signOutAdmin();
      setUser(null); setApplications([]); setRequests([]); setPackages([]);
    } catch (cause) { setError(cause.message || "Unable to sign out."); }
  }

  const loadAll = useCallback(async () => {
    if (!dashboardAccess) return;
    setLoading(true); setError("");
    if (!supabaseConfigured) {
      const message = "Supabase is not configured. Add the public URL and key in .env.local to load dashboard data.";
      setDataErrors({ requests: message, drivers: message, packages: message });
      setLoading(false);
      return;
    }
    const results = await Promise.allSettled([
      fetchAdminCustomerRequests(),
      fetchAdminDriverApplications(),
      fetchAdminTourPackages(),
    ]);
    const labels = ["requests", "drivers", "packages"];
    const setters = [setRequests, setApplications, setPackages];
    const nextErrors = {};
    results.forEach((result, index) => {
      const key = labels[index];
      if (result.status === "fulfilled") setters[index](result.value);
      else nextErrors[key] = result.status === "rejected" ? result.reason?.message : result.value?.error?.message;
    });
    setDataErrors(nextErrors);
    setLoading(false);
  }, [dashboardAccess]);

  useEffect(() => {
    if (!dashboardAccess) return undefined;
    const timer = window.setTimeout(() => { void loadAll(); }, 0);
    return () => window.clearTimeout(timer);
  }, [dashboardAccess, user, loadAll]);

  useEffect(() => {
    if (!dashboardAccess || !user) return undefined;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void loadAll(); }, 30000);
    const refreshOnFocus = () => { if (document.visibilityState === "visible") void loadAll(); };
    window.addEventListener("focus", refreshOnFocus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refreshOnFocus); };
  }, [dashboardAccess, user, loadAll]);

  const updateRecord = useCallback(async (table, idField, id, patch, setter, rows) => {
    setError("");
    try {
      const updated = table === "driver_applications"
        ? await updateDriverApplication(id, patch)
        : table === "customer_requests"
          ? await updateCustomerRequest(id, patch)
          : await updateTourPackage(id, patch);
      setter(rows.map((row) => row[idField] === id ? { ...row, ...updated } : row));
    } catch (cause) { setError(cause.message || "Unable to save that change."); }
  }, []);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((item) => (!term || `${item.full_name} ${item.mobile} ${item.whatsapp}`.toLowerCase().includes(term))
      && (!location.trim() || item.city_area.toLowerCase().includes(location.trim().toLowerCase()))
      && (experience === "" || item.experience_years === Number(experience))
      && (!status || item.status === status));
  }, [applications, search, location, experience, status]);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((item) => (!term || `${item.customer_name} ${item.mobile} ${JSON.stringify(item.request_data || {})}`.toLowerCase().includes(term))
      && (!requestType || item.request_type === requestType)
      && (!status || item.status === status));
  }, [requests, search, requestType, status]);

  const filteredAttachments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((item) => item.request_type === "cab_attachment"
      && (!term || `${item.customer_name} ${item.mobile} ${JSON.stringify(item.request_data || {})}`.toLowerCase().includes(term))
      && (!status || item.status === status));
  }, [requests, search, status]);

  const filteredPackages = useMemo(() => {
    const term = search.trim().toLowerCase();
    return packages.filter((item) => !term || `${item.name} ${item.state} ${item.slug}`.toLowerCase().includes(term));
  }, [packages, search]);

  const selectedDriver = applications.find((item) => item.application_id === selectedId);
  const selectedRequest = requests.find((item) => item.request_id === selectedId);
  const newRequests = requests.filter((item) => item.status === "New").length;
  const newDrivers = applications.filter((item) => item.status === "New").length;
  const attachmentRequests = requests.filter((item) => item.request_type === "cab_attachment");
  const attachedVehicles = attachmentRequests.reduce((sum, item) => sum + (Array.isArray(item.request_data?.vehicles) ? item.request_data.vehicles.length : 0), 0);
  const recentActivity = useMemo(() => [
    ...requests.map((item) => ({ ...item, kind: "request", key: item.request_id, label: requestTitle(item.request_type), person: item.customer_name })),
    ...applications.map((item) => ({ ...item, kind: "driver", key: item.application_id, label: "Driver application", person: item.full_name })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 7), [requests, applications]);

  if (!authReady) return <main className="admin-page"><div className="admin-loading">Checking administrator access…</div></main>;
  if (!dashboardAccess) return <main className="admin-page"><section className="admin-login"><a className="admin-brand" href="/#home"><span className="admin-brand-mark">C+</span><span><strong>CabConnect</strong><small>CHENNAI · ADMIN</small></span></a><span className="admin-eyebrow">PRIVATE OPERATIONS</span><h1>Your business,<br /><em>in one place.</em></h1><p>Sign in with an authorised administrator account to manage bookings, tour enquiries, drivers and packages.</p><form onSubmit={signIn}><label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{loginError && <p className="admin-error" role="alert">{loginError}</p>}<button className="admin-primary" disabled={loading}>{loading ? "Signing in…" : "Sign in securely"}<span>↗</span></button></form><small className="admin-login-foot">Administrator access is protected by Supabase Auth and database row-level security.</small></section></main>;

  const visibleCount = section === "drivers" ? filteredApplications.length : section === "attachments" ? filteredAttachments.length : section === "requests" ? filteredRequests.length : filteredPackages.length;
  return <AdminWorkspace section={section} items={SECTION_ITEMS} localPreview={localAdminPreview} accountLabel={accountLabel} newRequests={newRequests} loading={loading} onNavigate={(id) => { setSection(id); setSelectedId(""); setSearch(""); setStatus(""); setRequestType(""); setPage(1); }} onRefresh={() => void loadAll()} onSignOut={() => void signOut()}>
      <div className="admin-content">
        <div className="admin-page-heading"><div><span className="admin-eyebrow">CABCONNECT CHENNAI · ADMIN</span><h1>{section === "overview" ? "Good morning." : SECTION_ITEMS.find(([id]) => id === section)?.[1]}</h1><p>{section === "overview" ? "Here’s what’s happening across your CabConnect business." : section === "requests" ? "Review customer bookings and trip enquiries in one inbox." : section === "attachments" ? "Review vehicle owner details, fleet information and attachment requests." : section === "drivers" ? "Review, contact and manage driver hiring applications." : section === "reports" ? "Explore summaries calculated from submitted customer and driver records." : "Create, edit and publish the tour catalogue shown on your website."}</p></div><div className="admin-date-chip">{new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date())}</div></div>
        {localAdminPreview && <section className="admin-notice admin-dev-access" aria-label="Local development access"><strong>Local development preview</strong><span>This bypass opens the dashboard shell only. Supabase RLS still protects private records and admin changes. Production builds require administrator authentication.</span>{user ? <><span>Connected as {user.email}. Database access is still checked by the trusted driver_admin role and RLS.</span><button type="button" className="admin-dev-connect" onClick={() => void signOut()}>Sign out of admin account</button></> : <><button type="button" className="admin-dev-connect" onClick={() => { setLocalLoginOpen((open) => !open); setLoginError(""); }}>{localLoginOpen ? "Close admin sign-in" : "Sign in to load private records"}</button>{localLoginOpen && <form className="admin-dev-signin" onSubmit={signIn}><label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{loginError && <p className="admin-error" role="alert">{loginError}</p>}<button className="admin-primary" disabled={loading}>{loading ? "Signing in…" : "Connect authorised account"}<span>↗</span></button><small>Only an account with trusted app_metadata role driver_admin can access private records.</small></form>}</>}</section>}
        {error && <p className="admin-error" role="alert">{error}</p>}
        {Object.entries(dataErrors).filter(([key]) => section === "overview" || (section === "requests" && key === "requests") || (section === "attachments" && key === "requests") || (section === "drivers" && key === "drivers") || (section === "packages" && key === "packages") || (section === "reports" && (key === "requests" || key === "drivers"))).map(([key, message]) => <div className="admin-notice" role="status" key={key}><strong>{key === "packages" ? "Tour catalogue unavailable" : key === "drivers" ? "Driver applications unavailable" : "Customer request inbox unavailable"}</strong><span>{message || "The database may not have this feature’s migration yet."}</span></div>)}

        {section === "overview" && <>
          <div className="admin-stat-grid">
            <button type="button" className="admin-stat-card admin-stat-dark" onClick={() => setSection("requests")}><span className="admin-stat-top"><small>Customer requests</small><i>↗</i></span><strong>{dataErrors.requests ? "—" : requests.length}</strong><span className="admin-stat-foot">{newRequests} need attention</span><span className="admin-stat-icon">↗</span></button>
            <button type="button" className="admin-stat-card" onClick={() => { setSection("requests"); setRequestType("cab_booking"); }}><span className="admin-stat-top"><small>New bookings</small><i>⌁</i></span><strong>{dataErrors.requests ? "—" : requests.filter((item) => item.request_type === "cab_booking" && item.status === "New").length}</strong><span className="admin-stat-foot">Awaiting first review</span><span className="admin-stat-icon">⌁</span></button>
            <button type="button" className="admin-stat-card" onClick={() => setSection("drivers")}><span className="admin-stat-top"><small>Driver applications</small><i>♙</i></span><strong>{dataErrors.drivers ? "—" : applications.length}</strong><span className="admin-stat-foot">{newDrivers} new applications</span><span className="admin-stat-icon">♙</span></button>
            <button type="button" className="admin-stat-card" onClick={() => setSection("attachments")}><span className="admin-stat-top"><small>Cab attachments</small><i>▣</i></span><strong>{dataErrors.requests ? "—" : attachmentRequests.length}</strong><span className="admin-stat-foot">{dataErrors.requests ? "Unavailable" : `${attachedVehicles} vehicle${attachedVehicles === 1 ? "" : "s"} submitted`}</span><span className="admin-stat-icon">▣</span></button>
            <button type="button" className="admin-stat-card" onClick={() => setSection("packages")}><span className="admin-stat-top"><small>Tour packages</small><i>▧</i></span><strong>{dataErrors.packages ? "—" : packages.length}</strong><span className="admin-stat-foot">{packages.filter((item) => item.is_published).length} published on website</span><span className="admin-stat-icon">▧</span></button>
          </div>
          <div className="admin-overview-grid"><section className="admin-panel admin-activity"><div className="admin-panel-head"><div><span className="admin-eyebrow">LATEST UPDATES</span><h2>Recent activity</h2></div><button type="button" onClick={() => setSection("requests")}>Open inbox <span>↗</span></button></div>
            {recentActivity.length ? <div className="admin-activity-list">{recentActivity.map((item) => <button type="button" className="admin-activity-row" key={item.key} onClick={() => { setSection(item.kind === "driver" ? "drivers" : "requests"); setSelectedId(item.key); }}><span className={`admin-activity-symbol ${item.kind}`}>{item.kind === "driver" ? "♙" : "↗"}</span><span className="admin-activity-copy"><strong>{item.person}</strong><small>{item.label}</small></span><span className="admin-activity-time">{prettyDate(item.created_at)}</span><span className="admin-activity-arrow">→</span></button>)}</div> : <EmptyState title="No recent submissions" detail={dataErrors.requests || dataErrors.drivers ? "Resolve the database setup message above to load activity." : "New bookings, enquiries and driver applications will appear here."} />}
          </section><section className="admin-panel admin-quick-panel"><span className="admin-eyebrow">QUICK ACCESS</span><h2>Keep things moving.</h2><p>Jump to the work that needs your attention.</p><button type="button" className="admin-quick-link" onClick={() => { setSection("requests"); setStatus("New"); }}><span><b>{newRequests}</b><small>New customer enquiries</small></span><i>↗</i></button><button type="button" className="admin-quick-link" onClick={() => { setSection("drivers"); setStatus("New"); }}><span><b>{newDrivers}</b><small>New driver applications</small></span><i>↗</i></button><div className="admin-quick-note"><span>i</span><p>Only administrators with the trusted <strong>driver_admin</strong> role can access private records.</p></div></section></div>
        </>}

        {section === "reports" && <ReportsPanel requests={requests} applications={applications} packages={packages} errors={dataErrors} from={reportFrom} to={reportTo} setFrom={setReportFrom} setTo={setReportTo} />}

        {section !== "overview" && section !== "reports" && <>
          <div className="admin-toolbar"><label className="admin-search"><span>⌕</span><input aria-label="Search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={section === "packages" ? "Search package or destination" : "Search name, phone or details"} /></label>
            {section === "drivers" && <><label className="admin-select"><span className="sr-only">Location filter</span><input aria-label="Location" value={location} onChange={(event) => { setLocation(event.target.value); setPage(1); }} placeholder="Location" /></label><label className="admin-select"><span className="sr-only">Experience filter</span><select aria-label="Experience" value={experience} onChange={(event) => { setExperience(event.target.value); setPage(1); }}><option value="">Any experience</option>{Array.from({ length: 61 }, (_, i) => i).map((years) => <option key={years} value={years}>{years} {years === 1 ? "year" : "years"}</option>)}</select></label></>}
            {section === "requests" && <label className="admin-select"><span className="sr-only">Request type</span><select aria-label="Request type" value={requestType} onChange={(event) => { setRequestType(event.target.value); setPage(1); }}><option value="">All enquiries</option>{REQUEST_TYPES.filter((item) => item !== "cab_attachment").map((item) => <option key={item} value={item}>{requestTitle(item)}</option>)}</select></label>}
            {section !== "packages" && <label className="admin-select"><span className="sr-only">Status</span><select aria-label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{(section === "drivers" ? APPLICATION_STATUSES : REQUEST_STATUSES).map((item) => <option key={item}>{item}</option>)}</select></label>}
            <span className="admin-result-count">{visibleCount} result{visibleCount === 1 ? "" : "s"}</span>
          </div>
          {section === "packages" ? <PackagesTable packages={filteredPackages} error={dataErrors.packages} onToggle={(item) => void updateRecord("tour_packages", "id", item.id, { is_published: !item.is_published }, setPackages, packages)} onEdit={(item) => setPackageEditor(item)} onCreate={() => setPackageEditor(newPackageDraft())} onDelete={async (item) => { if (!window.confirm(`Permanently delete ${item.name}? This cannot be undone.`)) return; try { await deleteTourPackage(item.id); setPackages((rows) => rows.filter((row) => row.id !== item.id)); } catch (cause) { setError(cause.message || "Could not delete this tour package."); } }} /> : <div className="admin-record-layout"><section className="admin-panel admin-record-list"><div className="admin-record-list-head"><strong>{section === "drivers" ? "Applicants" : section === "attachments" ? "Vehicle attachment requests" : "Customer inbox"}</strong><span>Most recent first · {visibleCount} records</span></div>
            {(section === "drivers" ? filteredApplications : section === "attachments" ? filteredAttachments : filteredRequests).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => section === "drivers" ? <button type="button" className={`admin-record-row ${selectedId === item.application_id ? "selected" : ""}`} key={item.application_id} onClick={() => setSelectedId(item.application_id)}><span className="admin-record-avatar driver">{item.full_name.slice(0, 1).toUpperCase()}</span><span className="admin-record-main"><strong>{item.full_name}</strong><small>{item.city_area} · {item.experience_years} years driving</small></span><span className={`admin-status status-${item.status.toLowerCase()}`}>{item.status}</span><time>{prettyDate(item.created_at)}</time></button> : <button type="button" className={`admin-record-row ${selectedId === item.request_id ? "selected" : ""}`} key={item.request_id} onClick={() => setSelectedId(item.request_id)}><span className="admin-record-avatar request">{item.customer_name.slice(0, 1).toUpperCase()}</span><span className="admin-record-main"><strong>{item.customer_name}</strong><small>{requestTitle(item.request_type)} · {item.mobile}</small></span><span className={`admin-status status-${item.status.toLowerCase()}`}>{item.status}</span><time>{prettyDate(item.created_at)}</time></button>)}
            {!loading && !dataErrors[section === "attachments" ? "requests" : section] && visibleCount === 0 && <EmptyState title="No records match" detail="Try changing the search or filters." />}
            <Pagination page={page} pageSize={PAGE_SIZE} count={visibleCount} onChange={setPage} />
          </section>
          {selectedDriver && <DriverDetail application={selectedDriver} onClose={() => setSelectedId("")} onSave={(patch) => updateRecord("driver_applications", "application_id", selectedDriver.application_id, patch, setApplications, applications)} />}
          {selectedRequest && <RequestDetail request={selectedRequest} onClose={() => setSelectedId("")} onSave={(patch) => updateRecord("customer_requests", "request_id", selectedRequest.request_id, patch, setRequests, requests)} />}
          {!selectedDriver && !selectedRequest && <aside className="admin-panel admin-detail-placeholder"><span>↖</span><strong>Select a record</strong><small>Full details, status controls and contact actions will appear here.</small></aside>}
          </div>}
          {packageEditor && <PackageEditor value={packageEditor} busy={packageSaving} onCancel={() => setPackageEditor(null)} onSave={async (row) => { setPackageSaving(true); setError(""); try { const saved = packageEditor.__new ? await createTourPackage(row) : await updateTourPackage(packageEditor.id, row); setPackages((items) => packageEditor.__new ? [...items, saved].sort((a,b) => a.sort_order-b.sort_order) : items.map((item) => item.id === saved.id ? saved : item)); setPackageEditor(null); } catch (cause) { setError(cause.message || "Could not save the tour package."); } finally { setPackageSaving(false); } }} />}
        </>}
        <footer className="admin-footer"><span>CabConnect operations</span><span>Private administrator workspace · Data access protected by Supabase RLS</span></footer>
      </div>
    </AdminWorkspace>;
}

function EmptyState({ title, detail }) { return <div className="admin-empty"><span>◇</span><strong>{title}</strong><small>{detail}</small></div>; }

function newPackageDraft() {
  const data = { id: "", name: "", shortName: "", slug: "", state: "Tamil Nadu", summary: "", overview: "", hero: "", alt: "", duration: "", durationDays: "", category: [], highlights: [], attractions: [], itinerary: [], suitable: [], included: [], excluded: [], faqs: [], sourceLinks: [] };
  return { __new: true, id: "", slug: "", name: "", state: "Tamil Nadu", categories: [], hero_image: "", package_data: data, is_published: false, sort_order: 0 };
}

function PackagesTable({ packages, error, onToggle, onEdit, onCreate, onDelete }) {
  const [currentPage, setCurrentPage] = useState(1);
  const page = Math.min(currentPage, Math.max(1, Math.ceil(packages.length / PAGE_SIZE)));
  const shown = packages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return <section className="admin-panel admin-package-panel"><div className="admin-package-head"><div><span className="admin-eyebrow">WEBSITE CONTENT</span><h2>Tour catalogue</h2><p>Published packages appear on the public Tour Packages page.</p></div><div className="admin-package-actions"><span className="admin-count-chip">{packages.length} packages</span><button className="admin-primary admin-create-package" type="button" onClick={onCreate} disabled={Boolean(error)}>Add package <span>＋</span></button></div></div>{error ? <EmptyState title="Tour catalogue is not connected" detail="Apply the site-data migration to create the tour_packages table before managing packages." /> : <><div className="admin-package-list">{shown.map((item) => <div className="admin-package-row" key={item.id}><span className="admin-package-icon">✦</span><span className="admin-package-copy"><strong>{item.name}</strong><small>{item.state} · {item.slug}</small></span><span className={`admin-published ${item.is_published ? "on" : "off"}`}><i />{item.is_published ? "Published" : "Draft"}</span><button type="button" className="admin-package-toggle" onClick={() => onToggle(item)}>{item.is_published ? "Unpublish" : "Publish"}</button><button type="button" className="admin-package-toggle" onClick={() => onEdit(item)}>Edit</button><button type="button" className="admin-package-toggle admin-delete-package" onClick={() => onDelete(item)}>Delete</button></div>)}{!packages.length && <EmptyState title="No tour packages found" detail="Add a package to start building the website catalogue." />}</div><Pagination page={page} pageSize={PAGE_SIZE} count={packages.length} onChange={setCurrentPage} /></>}</section>;
}

function PackageEditor({ value, busy, onCancel, onSave }) {
  const [fields, setFields] = useState(() => ({ ...value, packageDataText: JSON.stringify(value.package_data || {}, null, 2) }));
  const [validationError, setValidationError] = useState("");
  function update(key, next) { setFields((current) => ({ ...current, [key]: next })); }
  async function submit(event) {
    event.preventDefault(); setValidationError("");
    let packageData;
    try { packageData = JSON.parse(fields.packageDataText); } catch { setValidationError("Package content must be valid JSON."); return; }
    const id = fields.id.trim(); const name = fields.name.trim(); const state = fields.state.trim(); const slug = fields.slug.trim(); const image = fields.hero_image.trim();
    if (!id || !/^[a-z0-9-]+$/.test(id) || !name || !state || !/^\/tour-packages\/[^/]+$/.test(slug) || !image || !packageData || Array.isArray(packageData) || typeof packageData !== "object") { setValidationError("Enter a lowercase ID, name, state, a /tour-packages/ page path, image path and valid package JSON."); return; }
    const categories = Array.isArray(fields.categories) ? fields.categories : String(fields.categories || "").split(",").map((item) => item.trim()).filter(Boolean);
    packageData = { ...packageData, id, name, state, slug, hero: image, category: categories };
    await onSave({ id, slug, name, state, categories, hero_image: image, package_data: packageData, is_published: Boolean(fields.is_published), sort_order: Number(fields.sort_order) || 0 });
  }
  return <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="package-editor-title"><div className="admin-package-head"><div><span className="admin-eyebrow">WEBSITE CONTENT</span><h2 id="package-editor-title">{value.__new ? "Add tour package" : `Edit ${value.name}`}</h2><p>Updates are saved to the protected tour_packages table.</p></div><button type="button" className="admin-close-modal" onClick={onCancel} aria-label="Close">×</button></div><form className="admin-package-form" onSubmit={submit}><div className="admin-package-form-grid"><label className="admin-edit-field">Package ID<input required pattern="[a-z0-9-]+" value={fields.id} onChange={(e) => update("id", e.target.value)} disabled={!value.__new} placeholder="e.g. kanchipuram" /></label><label className="admin-edit-field">Package name<input required value={fields.name} onChange={(e) => update("name", e.target.value)} /></label><label className="admin-edit-field">State<input required value={fields.state} onChange={(e) => update("state", e.target.value)} /></label><label className="admin-edit-field">Page path<input required value={fields.slug} onChange={(e) => update("slug", e.target.value)} placeholder="/tour-packages/example" /></label><label className="admin-edit-field">Hero image path<input required value={fields.hero_image} onChange={(e) => update("hero_image", e.target.value)} /></label><label className="admin-edit-field">Categories<input value={Array.isArray(fields.categories) ? fields.categories.join(", ") : fields.categories} onChange={(e) => update("categories", e.target.value)} placeholder="Hill Station Getaways, Family Holidays" /></label><label className="admin-edit-field">Sort order<input type="number" value={fields.sort_order} onChange={(e) => update("sort_order", e.target.value)} /></label><label className="admin-edit-field admin-package-published-field"><span>Publish on website</span><input type="checkbox" checked={Boolean(fields.is_published)} onChange={(e) => update("is_published", e.target.checked)} /></label></div><label className="admin-edit-field">Full package content (JSON)<textarea rows="16" spellCheck="false" value={fields.packageDataText} onChange={(e) => update("packageDataText", e.target.value)} /></label>{validationError && <p className="admin-error" role="alert">{validationError}</p>}<div className="admin-modal-actions"><button type="button" className="admin-secondary" onClick={onCancel} disabled={busy}>Cancel</button><button type="submit" className="admin-primary" disabled={busy}>{busy ? "Saving…" : "Save package"}<span>↗</span></button></div></form></section></div>;
}

function Pagination({ page, pageSize, count, onChange }) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  useEffect(() => { if (page > pages) onChange(pages); }, [page, pages, onChange]);
  if (count <= pageSize) return null;
  return <div className="admin-pagination"><span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count)} of {count}</span><div><button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>Previous</button><span>Page {page} of {pages}</span><button type="button" onClick={() => onChange(Math.min(pages, page + 1))} disabled={page >= pages}>Next</button></div></div>;
}

function ReportsPanel({ requests, applications, packages, errors, from, to, setFrom, setTo }) {
  const filtered = requests.filter((item) => {
    const date = new Date(item.created_at);
    return (!from || date >= new Date(`${from}T00:00:00`)) && (!to || date <= new Date(`${to}T23:59:59.999`));
  });
  const groupCounts = (items, getKey) => Object.entries(items.reduce((acc, item) => { const key = getKey(item) || "Not specified"; acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
  const vehicleCategory = (item) => {
    const data = item.request_data || {};
    const categories = [data.vehicleCategory, data.vehicleType, data.vehicleLabel, data.vehicle, data.vehicleId, ...(Array.isArray(data.vehicles) ? data.vehicles.map((vehicle) => vehicle.category || vehicle.type || vehicle.model) : [])].filter(Boolean);
    return [...new Set(categories.map(String))].join(", ") || "Not specified";
  };
  const byDay = groupCounts(filtered, (item) => new Date(item.created_at).toLocaleDateString("en-CA")).sort((a, b) => a[0].localeCompare(b[0]));
  const byType = groupCounts(filtered, (item) => {
    const data = item.request_data || {};
    const service = data.serviceName || data.service;
    return service ? `${requestTitle(item.request_type)} · ${service}` : requestTitle(item.request_type);
  });
  const byStatus = groupCounts(filtered, (item) => item.status);
  const byVehicle = groupCounts(filtered, vehicleCategory);
  return <section className="admin-reports"><div className="admin-report-filter"><div><span className="admin-eyebrow">ACTUAL SUBMISSIONS</span><h2>Reports</h2><p>Summaries use records loaded from Supabase. Dates apply to customer requests.</p></div><label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></div><div className="admin-report-kpis"><article><span>Customer requests in range</span><strong>{errors.requests ? "—" : filtered.length}</strong></article><article><span>All driver applications</span><strong>{errors.drivers ? "—" : applications.length}</strong></article><article><span>Published packages</span><strong>{errors.packages ? "—" : packages.filter((item) => item.is_published).length}</strong></article></div><div className="admin-report-grid"><ReportTable title="Requests by date" rows={byDay} error={errors.requests} /><ReportTable title="Requests by type" rows={byType} error={errors.requests} /><ReportTable title="Requests by status" rows={byStatus} error={errors.requests} /><ReportTable title="Vehicle category" rows={byVehicle} error={errors.requests} /></div></section>;
}

function ReportTable({ title, rows, error }) {
  return <section className="admin-panel admin-report-card"><h3>{title}</h3>{error ? <EmptyState title="Report unavailable" detail={error} /> : rows.length ? <div className="admin-report-rows">{rows.map(([label, count]) => <div key={label}><span>{label}</span><strong>{count}</strong></div>)}</div> : <EmptyState title="No matching submissions" detail="Change the date range or refresh the dashboard." />}</section>;
}

function DriverDetail({ application, onClose, onSave }) {
  return <aside className="admin-panel admin-detail"><div className="admin-detail-head"><span className="admin-record-avatar driver large">{application.full_name.slice(0, 1).toUpperCase()}</span><div><span className="admin-eyebrow">DRIVER APPLICATION</span><h2>{application.full_name}</h2></div><button type="button" aria-label="Close details" onClick={onClose}>×</button></div><p className="admin-detail-date">Received {prettyDate(application.created_at)}</p>
    <dl className="admin-detail-data">{[["Mobile", application.mobile], ["WhatsApp", application.whatsapp], ["Location", application.city_area], ["Experience", `${application.experience_years} years`], ["Driving licence", application.licence_status], ["Driver badge", application.badge_status], ["Police verification", application.police_verification_certificate], ["Work type", application.preferred_work_type], ["Availability", application.preferred_shift], ["Languages", application.languages || "Not provided"], ["Previous experience", application.previous_experience || "Not provided"], ["Expected salary", application.expected_monthly_salary ? `₹${application.expected_monthly_salary.toLocaleString("en-IN")} / month` : "Not provided"], ["Additional info", application.additional_information || "Not provided"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <label className="admin-edit-field">Application status<select value={application.status} onChange={(event) => onSave({ status: event.target.value })}>{APPLICATION_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="admin-edit-field">Internal notes<textarea rows="4" maxLength="5000" defaultValue={application.admin_notes} key={`${application.application_id}-${application.updated_at}`} onBlur={(event) => { if (event.target.value !== application.admin_notes) onSave({ admin_notes: event.target.value }); }} /></label>
    <div className="admin-contact-actions"><a href={`tel:${application.mobile}`}>Call applicant</a><a href={`https://wa.me/91${application.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp ↗</a></div>
  </aside>;
}

function RequestDetail({ request, onClose, onSave }) {
  const [quote, setQuote] = useState(request.quoted_amount ?? "");
  const [quoteNotes, setQuoteNotes] = useState(request.quote_notes || "");
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || "");
  return <aside className="admin-panel admin-detail"><div className="admin-detail-head"><span className="admin-record-avatar request large">↗</span><div><span className="admin-eyebrow">{requestTitle(request.request_type).toUpperCase()}</span><h2>{request.customer_name}</h2></div><button type="button" aria-label="Close details" onClick={onClose}>×</button></div><p className="admin-detail-date">Received {prettyDate(request.created_at)}</p>
    <dl className="admin-detail-data">{[["Mobile", request.mobile], ["Reference", request.request_id], ["Contact consent", request.contact_consent ? "Yes" : "No"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <h3 className="admin-subheading">Request details</h3><pre className="admin-json">{JSON.stringify(request.request_data, null, 2)}</pre>
    <label className="admin-edit-field">Request status<select value={request.status} onChange={(event) => onSave({ status: event.target.value })}>{REQUEST_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="admin-edit-field">Quotation amount (₹)<input type="number" min="0" step="1" value={quote} onChange={(event) => setQuote(event.target.value)} /></label>
    <label className="admin-edit-field">Quotation notes<textarea rows="3" maxLength="5000" value={quoteNotes} onChange={(event) => setQuoteNotes(event.target.value)} /></label>
    <label className="admin-edit-field">Internal notes<textarea rows="3" maxLength="5000" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} /></label>
    <button className="admin-primary admin-save-quote" type="button" onClick={() => onSave({ quoted_amount: quote === "" ? null : Number(quote), quote_notes: quoteNotes, admin_notes: adminNotes })}>Save quote and notes <span>↗</span></button>
    <div className="admin-contact-actions"><a href={`tel:${request.mobile}`}>Call customer</a><a href={`https://wa.me/91${request.mobile}`} target="_blank" rel="noreferrer">WhatsApp ↗</a></div>
  </aside>;
}
