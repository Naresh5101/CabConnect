import { useEffect, useMemo, useState } from "react";
import { updatePricingRule, validatePricingRules } from "../../admin/pricingRules.js";
import { fetchAdminFarePricingRecord, saveAdminFarePricingRules } from "../../services/farePricingService";

const VEHICLE_LABELS = { dzire: "Sedan · Swift Dzire", ertiga: "SUV · Ertiga" };
const CURRENCY_FIELDS = [
  ["perKm", "Daily rides · ₹ / km"],
  ["shortTripPerKm", "Short city ride · ₹ / km"],
  ["outstationOneWayPerKm", "Outstation one-way · ₹ / km"],
  ["outstationRoundTripPerKm", "Outstation round-trip · ₹ / km"],
  ["extraHourRate", "Extra hour · ₹"],
  ["airportMinimum", "Airport minimum · ₹"],
  ["driverAllowancePerDay", "Driver allowance · ₹ / day"],
];

export default function AdminPricingPanel() {
  const [record, setRecord] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const next = await fetchAdminFarePricingRecord();
      setRecord(next);
      setDraft(structuredClone(next.rules));
    } catch (cause) {
      setError(cause.message || "Pricing rules could not be loaded. Apply the admin pricing migration and confirm your admin session.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const validationError = useMemo(() => draft ? validatePricingRules(draft) : "", [draft]);
  const hasChanges = useMemo(() => Boolean(record && draft && JSON.stringify(record.rules) !== JSON.stringify(draft)), [record, draft]);

  async function save(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const invalid = validatePricingRules(draft);
    if (invalid) { setError(invalid); return; }
    setSaving(true);
    try {
      const updated = await saveAdminFarePricingRules(draft);
      setRecord(updated);
      setDraft(structuredClone(updated.rules));
      setSuccess("Pricing rules saved. New fare estimates will use these database values.");
    } catch (cause) {
      setError(cause.message || "Pricing rules could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function input(path, label, value, { min = 0, step = "1", required = true } = {}) {
    return <label key={path.join("-")}><span>{label}</span><input type="number" inputMode="decimal" min={min} step={step} required={required} value={value ?? ""} onChange={(event) => setDraft((current) => updatePricingRule(current, path, event.target.value === "" ? "" : Number(event.target.value)))} /></label>;
  }

  if (loading) return <section className="admin-panel admin-pricing-card" role="status">Loading pricing rules…</section>;
  if (!draft) return <section className="admin-panel admin-pricing-card"><div className="admin-notice"><strong>Pricing configuration unavailable</strong><span>{error}</span></div><button type="button" className="admin-secondary" onClick={() => void load()}>Retry</button></section>;

  return <form className="admin-pricing-page" onSubmit={save}>
    <section className="admin-panel admin-pricing-toolbar"><div><span className="admin-eyebrow">DATABASE-BACKED FARE SETTINGS</span><h2>Fare &amp; pricing rules</h2><p>Changes are saved explicitly and used by new ride, outstation, temple and tour estimates.</p></div><div className="admin-pricing-toolbar-actions"><button type="button" className="admin-secondary" onClick={() => { setDraft(structuredClone(record.rules)); setError(""); setSuccess(""); }} disabled={!hasChanges || saving}>Discard edits</button><button className="admin-primary" type="submit" disabled={saving || !hasChanges || Boolean(validationError)}>{saving ? "Saving…" : "Save pricing rules"}</button></div></section>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {success && <p className="admin-feedback" role="status">{success}</p>}
    {hasChanges && !validationError && <p className="admin-pricing-dirty" role="status">Unsaved changes · review the rates and choose Save pricing rules.</p>}
    {validationError && <p className="admin-error" role="alert">{validationError}</p>}
    <div className="admin-pricing-grid">
      <section className="admin-panel admin-pricing-card"><h3>Trip minimums</h3><div className="admin-pricing-fields">
        {input(["tariff", "oneWayMinimumKm"], "One-way minimum distance · km", draft.tariff.oneWayMinimumKm, { min: 1 })}
        {input(["tariff", "roundTripMinimumKmPerDay"], "Round-trip minimum · km / day", draft.tariff.roundTripMinimumKmPerDay, { min: 1 })}
        {input(["tariff", "localKmPerHour"], "Included local distance · km / hour", draft.tariff.localKmPerHour, { min: 1 })}
      </div></section>
      {Object.entries(VEHICLE_LABELS).map(([vehicleId, label]) => <section className="admin-panel admin-pricing-card" key={vehicleId}><h3>{label}</h3><div className="admin-pricing-fields">
        {CURRENCY_FIELDS.map(([field, title]) => input(["vehicles", vehicleId, field], title, draft.vehicles[vehicleId][field], { step: "0.01" }))}
        {[4, 8, 12].map((hours) => input(["vehicles", vehicleId, "localPackages", hours], `${hours}-hour local package · ₹`, draft.vehicles[vehicleId].localPackages[hours], { step: "0.01" }))}
      </div></section>)}
    </div>
    <section className="admin-panel admin-settings-card"><h2>Charges and discounts</h2><p>Tolls, parking, taxes, discounts, payment status, and amounts paid are not stored as configured rules in the current schema. They are not estimated or included automatically. Add verified business rules and fields before using them.</p></section>
    {record?.updated_at && <p className="admin-pricing-updated">Last saved {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.updated_at))}</p>}
  </form>;
}
