import { getAttachmentSummary, normalizeRequestData, pickRequestValue } from "./adminRequestPresentation.js";

const money = (value) => value == null || value === "" ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value));
const date = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "—";
const tripLabel = (row) => String(row.request_type || "request").replaceAll("_", " ");

function SortHeader({ label, field, sort, onSort }) {
  return <th><button type="button" className="admin-sort-button" onClick={() => onSort(field)}>{label}{sort.field === field ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}</button></th>;
}

export default function AdminRequestTable({ rows, count, page, pageSize, selectedId, onSelect, sort, onSort, attachmentMode = false }) {
  if (attachmentMode) {
    const attachmentSummary = (row) => {
      return getAttachmentSummary(row.request_data);
    };
    return <>
      <div className="admin-table-wrap"><table className="admin-table admin-attachment-table"><thead><tr>
        <SortHeader label="Reference" field="reference" sort={sort} onSort={onSort} />
        <SortHeader label="Owner" field="customer" sort={sort} onSort={onSort} />
        <SortHeader label="Mobile" field="mobile" sort={sort} onSort={onSort} />
        <th>Vehicles</th><th>Operating location</th>
        <SortHeader label="Status" field="status" sort={sort} onSort={onSort} />
        <SortHeader label="Submitted" field="created_at" sort={sort} onSort={onSort} />
      </tr></thead><tbody>{rows.map((row) => {
        const summary = attachmentSummary(row);
        return <tr key={row.request_id} className={selectedId === row.request_id ? "is-selected" : ""}>
          <td><button className="admin-table-open" type="button" onClick={() => onSelect(row.request_id)}>{row.request_id.slice(0, 8).toUpperCase()}</button></td>
          <td>{row.customer_name}</td><td>{row.mobile}</td>
          <td><span className="admin-table-sub admin-table-place">{summary.vehicles}</span></td>
          <td><span className="admin-table-sub admin-table-place">{summary.location}</span></td>
          <td><span className={`admin-status status-${row.status.toLowerCase()}`}>{row.status}</span></td>
          <td>{date(row.created_at)}</td>
        </tr>;
      })}</tbody></table></div>
      <div className="admin-request-cards">{rows.map((row) => {
        const summary = attachmentSummary(row);
        return <button type="button" className={`admin-request-card ${selectedId === row.request_id ? "is-selected" : ""}`} key={row.request_id} onClick={() => onSelect(row.request_id)}>
          <span><strong>{row.customer_name} · {row.request_id.slice(0, 8).toUpperCase()}</strong><small>{row.mobile}<br />{summary.vehicles}<br />{summary.location}<br />Submitted {date(row.created_at)}</small></span>
          <span className={`admin-status status-${row.status.toLowerCase()}`}>{row.status}</span>
        </button>;
      })}</div>
      {!count && <p className="admin-detail-empty">No matching attachment requests. Change the search or status filter.</p>}
      <span className="sr-only">Showing page {page} of {Math.max(1, Math.ceil(count / pageSize))}</span>
    </>;
  }
  return <>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr>
      <SortHeader label="Booking reference" field="reference" sort={sort} onSort={onSort} />
      <SortHeader label="Customer" field="customer" sort={sort} onSort={onSort} />
      <SortHeader label="Mobile" field="mobile" sort={sort} onSort={onSort} />
      <SortHeader label="Trip type" field="type" sort={sort} onSort={onSort} />
      <SortHeader label="Pickup / destination" field="pickup" sort={sort} onSort={onSort} />
      <SortHeader label="Travel date" field="travelDate" sort={sort} onSort={onSort} />
      <SortHeader label="Quote" field="quote" sort={sort} onSort={onSort} />
      <th>Payment</th>
      <SortHeader label="Status" field="status" sort={sort} onSort={onSort} />
      <SortHeader label="Created" field="created_at" sort={sort} onSort={onSort} />
    </tr></thead><tbody>{rows.map((row) => {
      const data = normalizeRequestData(row.request_data);
      const paymentStatus = pickRequestValue(data, "paymentStatus", "payment_status") || "Not recorded";
      const pickup = pickRequestValue(data, "pickup", "startingLocation", "starting_location", "pickupAddress", "pickup_address", "start") || "Pickup not recorded";
      const destination = pickRequestValue(data, "destination", "dropoff", "destinationAddress", "destination_address") || "Destination not recorded";
      const travelDate = pickRequestValue(data, "travelDate", "pickupDate", "pickup_date", "date");
      return <tr key={row.request_id} className={selectedId === row.request_id ? "is-selected" : ""}>
        <td><button className="admin-table-open" type="button" onClick={() => onSelect(row.request_id)}>{row.request_id.slice(0, 8).toUpperCase()}</button></td>
        <td>{row.customer_name}</td><td>{row.mobile}</td><td>{tripLabel(row)}</td>
        <td><span className="admin-table-sub admin-table-place">{pickup}<br />→ {destination}</span></td>
        <td>{date(travelDate)}</td><td>{money(row.quoted_amount)}</td><td>{paymentStatus}</td>
        <td><span className={`admin-status status-${row.status.toLowerCase()}`}>{row.status}</span></td><td>{date(row.created_at)}</td>
      </tr>;
    })}</tbody></table></div>
    <div className="admin-request-cards">{rows.map((row) => {
      const data = normalizeRequestData(row.request_data);
      const pickup = pickRequestValue(data, "pickup", "startingLocation", "starting_location", "pickupAddress", "pickup_address", "start") || "Pickup not recorded";
      const destination = pickRequestValue(data, "destination", "dropoff", "destinationAddress", "destination_address") || "Destination not recorded";
      const travelDate = pickRequestValue(data, "travelDate", "pickupDate", "pickup_date", "date");
      return <button type="button" className={`admin-request-card ${selectedId === row.request_id ? "is-selected" : ""}`} key={row.request_id} onClick={() => onSelect(row.request_id)}>
        <span><strong>{row.customer_name} · {row.request_id.slice(0, 8).toUpperCase()}</strong><small>{row.mobile} · {tripLabel(row)}<br />{pickup} → {destination}<br />Travel {date(travelDate)} · Created {date(row.created_at)} · Quote {money(row.quoted_amount)}</small></span>
        <span className={`admin-status status-${row.status.toLowerCase()}`}>{row.status}</span>
      </button>;
    })}</div>
    {!count && <p className="admin-detail-empty">No matching requests. Change the search or status filter.</p>}
    <span className="sr-only">Showing page {page} of {Math.max(1, Math.ceil(count / pageSize))}</span>
  </>;
}
