const imageCache = new Map();

const searchableWords = (query) => query
  .toLocaleLowerCase()
  .replace(/[^a-z0-9 ]/g, " ")
  .split(/\s+/)
  .filter((word) => word.length > 2 && !["the", "and", "near", "view"].includes(word));

function cleanMetadata(value = "") {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

export function findCommonsPhoto(query, context = "") {
  const cacheKey = `${query}|${context}`.toLocaleLowerCase();
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

  const request = (async () => {
    const search = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: `${query} ${context} filetype:bitmap`,
      gsrnamespace: "6",
      gsrlimit: "18",
      prop: "imageinfo",
      iiprop: "url|size|extmetadata",
      iiurlwidth: "1440",
      format: "json",
      origin: "*",
    });
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${search}`);
    if (!response.ok) throw new Error("Photo search failed");
    const data = await response.json();
    const terms = searchableWords(query);
    const pages = Object.values(data.query?.pages || []).map((page) => {
      const info = page.imageinfo?.[0];
      if (!info || !info.thumburl || info.width < 800 || /\.svg$/i.test(info.url || "")) return null;
      const title = page.title.toLocaleLowerCase();
      const score = terms.reduce((total, word) => total + (title.includes(word) ? 1 : 0), 0);
      return score ? { page, info, score } : null;
    }).filter(Boolean);
    pages.sort((a, b) => b.score - a.score || b.info.width - a.info.width);
    const best = pages[0];
    if (!best) return null;
    const metadata = best.info.extmetadata || {};
    return {
      image: best.info.thumburl,
      source: best.info.descriptionurl,
      title: best.page.title.replace(/^File:/, ""),
      artist: cleanMetadata(metadata.Artist?.value || ""),
      license: cleanMetadata(metadata.LicenseShortName?.value || metadata.UsageTerms?.value || "Wikimedia Commons license"),
    };
  })().catch(() => null);

  imageCache.set(cacheKey, request);
  return request;
}
