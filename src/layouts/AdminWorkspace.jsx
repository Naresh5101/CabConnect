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
  const activeLabel = items.find(([id]) => id === section)?.[1];
  return <main className="admin-page"><div className="admin-shell">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/#home"><span className="admin-brand-mark">C+</span><span><strong>CabConnect</strong><small>OPERATIONS</small></span></a>
      <div className="admin-side-label">WORKSPACE</div>
      <nav className="admin-nav" aria-label="Admin sections">{items.map(([id, label, icon]) => <button type="button" key={id} className={section === id ? "active" : ""} onClick={() => onNavigate(id)}><span className="admin-nav-icon">{icon}</span>{label}{id === "requests" && newRequests > 0 && <b>{newRequests}</b>}</button>)}</nav>
      <div className="admin-sidebar-bottom"><span className="admin-user-avatar">{accountLabel.slice(0, 1).toUpperCase()}</span><span className="admin-user-copy"><strong>{accountLabel}</strong><small>{localPreview ? "Local development" : "Administrator"}</small></span>{!localPreview && <button type="button" aria-label="Sign out" title="Sign out" onClick={onSignOut}>↗</button>}</div>
    </aside>
    <section className="admin-main">
      <header className="admin-topbar"><div className="admin-breadcrumb">CabConnect <span>/</span> {activeLabel}</div><div className="admin-top-actions"><span className="admin-live"><i /> {localPreview ? "Local development preview" : "Private workspace"}</span><button type="button" className="admin-refresh" onClick={onRefresh} disabled={loading}>{loading ? "Refreshing…" : "↻ Refresh"}</button></div></header>
      {children}
    </section>
  </div></main>;
}
