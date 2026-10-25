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

export default function PageMeta({ title, description, path }) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "website", true);
    const siteUrl = environment.siteUrl;
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (siteUrl) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = `${siteUrl}${path}`;
    } else if (canonical) canonical.remove();
  }, [description, path, title]);
  return null;
}
