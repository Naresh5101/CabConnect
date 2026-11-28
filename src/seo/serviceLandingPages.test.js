import assert from "node:assert/strict";
import test from "node:test";
import { getServiceLandingPage, serviceLandingPages } from "./serviceLandingPages.js";

test("service landing pages have unique crawlable paths and complete page content", () => {
  const paths = serviceLandingPages.map((page) => page.path);
  assert.equal(new Set(paths).size, paths.length);

  for (const page of serviceLandingPages) {
    assert.ok(page.path.startsWith("/"));
    assert.ok(page.title.length > 30);
    assert.ok(page.description.length > 80);
    assert.ok(page.h1);
    assert.ok(page.sections.length > 0);
    assert.ok(page.faqs.length > 0);
    assert.ok(page.ctaHref.startsWith("/"));
  }
});

test("service landing page lookup normalizes a trailing slash and rejects unrelated routes", () => {
  assert.equal(getServiceLandingPage("/chennai-local-cab/").path, "/chennai-local-cab");
  assert.equal(getServiceLandingPage("/not-a-service"), null);
});

test("Arupadai landing page explains all six temples and avoids promising a one-day itinerary", () => {
  const page = getServiceLandingPage("/chennai-arupadai-veedu-tour");
  const listedTemples = page.sections.flatMap((section) => section.items || [])
    .map((item) => typeof item === "string" ? item : item.title);

  assert.equal(listedTemples.filter((name) => name?.includes("Murugan Temple")).length, 6);
  assert.match(page.faqs.find((faq) => faq.question.includes("one day")).answer, /may not be practical/i);
});
