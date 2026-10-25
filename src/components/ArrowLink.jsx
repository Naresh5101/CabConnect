export default function ArrowLink({ href, children, className = "" }) {
  return <a className={`tour-arrow-link ${className}`} href={href}>{children}<span aria-hidden="true">↗</span></a>;
}
