import { useEffect } from "react";
import { environment } from "../config/environment";

function setMeta(name, content, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function PageMeta({ title, description, path, noIndex = false }) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "website", true);
    const siteUrl = environment.siteUrl;
    setMeta("twitter:card", "summary_large_image");
    if (siteUrl && path) {
      setMeta("og:url", `${siteUrl}${path}`, true);
      setMeta("og:image", `${siteUrl}/daily-ride-passenger.webp`, true);
      setMeta("og:image:alt", "A passenger travelling by CabConnect Chennai cab", true);
    }
    if (noIndex) setMeta("robots", "noindex, nofollow");
    else document.head.querySelector('meta[name="robots"]')?.remove();
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (siteUrl) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = `${siteUrl}${path}`;
    } else if (canonical) canonical.remove();
  }, [description, noIndex, path, title]);
  return null;
}
