import { useState } from "react";

export default function AdminWorkspace({
  section,
  items,
  localPreview,
  accountLabel,
  newRequests,
  loading,
  onNavigate,
  onRefresh,
  onSignOut,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeLabel = items.find(([id]) => id === section)?.[1];
  return <main className="admin-page"><div className="admin-shell">
    {sidebarOpen && <button className="admin-sidebar-scrim" type="button" aria-label="Close admin navigation" onClick={() => setSidebarOpen(false)} />}
    <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
      <a className="admin-brand" href="/#home"><span className="admin-brand-mark">C+</span><span><strong>CabConnect</strong><small>OPERATIONS</small></span></a>
      <div className="admin-side-label">WORKSPACE</div>
      <nav className="admin-nav" aria-label="Admin sections">{items.map(([id, label, icon]) => <button type="button" key={id} className={section === id ? "active" : ""} aria-current={section === id ? "page" : undefined} onClick={() => { onNavigate(id); setSidebarOpen(false); }}><span className="admin-nav-icon">{icon}</span><span className="admin-nav-label">{label}</span>{(id === "cab-bookings" || id === "enquiries") && newRequests[id] > 0 && <b>{newRequests[id]}</b>}</button>)}</nav>
      <div className="admin-sidebar-bottom"><span className="admin-user-avatar">{accountLabel.slice(0, 1).toUpperCase()}</span><span className="admin-user-copy"><strong>{accountLabel}</strong><small>{localPreview ? "Local development" : "Administrator"}</small></span>{!localPreview && <button type="button" aria-label="Sign out" title="Sign out" onClick={onSignOut}>↗</button>}</div>
    </aside>
    <section className="admin-main">
      <header className="admin-topbar"><div className="admin-topbar-leading"><button type="button" className="admin-menu-toggle" aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}>☰</button><div className="admin-breadcrumb">CabConnect <span>/</span> {activeLabel}</div></div><div className="admin-top-actions"><span className="admin-live"><i /> {localPreview ? "Local development preview" : "Private workspace"}</span><button type="button" className="admin-refresh" onClick={onRefresh} disabled={loading}>{loading ? "Refreshing…" : "↻ Refresh"}</button></div></header>
      {children}
    </section>
  </div></main>;
}
