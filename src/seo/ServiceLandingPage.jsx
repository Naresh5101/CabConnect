import PageMeta from "../components/PageMeta.jsx";
import { serviceLandingPages } from "./serviceLandingPages.js";
import "./serviceLandingPages.css";

function LandingItems({ items, ordered = false }) {
  if (!items?.length) return null;
  const List = ordered ? "ol" : "ul";
  return <List>{items.map((item) => {
    const title = typeof item === "string" ? item : item.title;
    const description = typeof item === "string" ? "" : item.description;
    const content = <>{title}{description && <> — {description}</>}</>;
    return <li key={title}>{item.href ? <a href={item.href}>{content}</a> : content}</li>;
  })}</List>;
}

export default function ServiceLandingPage({ page }) {
  return <article className="seo-landing-page">
    <PageMeta title={page.title} description={page.description} path={page.path} image={page.heroImage} imageAlt={page.heroAlt} />
    <section className="seo-landing-hero">
      <div className="container seo-landing-hero-grid">
        <div className="seo-landing-hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> {page.eyebrow}</p>
          <h1>{page.h1}</h1>
          <p className="seo-landing-intro">{page.intro}</p>
          <div className="hero-actions">
            <a className="button button-primary" href={page.ctaHref}>{page.ctaLabel} <span>↗</span></a>
            <a className="text-link" href="/">Explore CabConnect <span>→</span></a>
          </div>
          <p className="seo-landing-confirmation">A request is not a confirmed booking. The team checks availability and the final fare.</p>
        </div>
        <figure className="seo-landing-hero-image">
          <img src={page.heroImage} alt={page.heroAlt} />
          <figcaption>CabConnect Chennai · Private cab requests</figcaption>
        </figure>
      </div>
    </section>

    <nav className="container seo-landing-breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">{page.h1}</span>
    </nav>

    <div className="container seo-landing-content">
      {page.sections.map((section) => <section className="seo-landing-section" key={section.heading}>
        <h2>{section.heading}</h2>
        {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <LandingItems items={section.items} ordered={section.ordered} />
      </section>)}

      <section className="seo-landing-faq" aria-labelledby="seo-landing-faq-title">
        <h2 id="seo-landing-faq-title">Frequently asked questions</h2>
        {page.faqs.map((faq) => <details key={faq.question}>
          <summary>{faq.question}</summary>
          <p>{faq.answer}</p>
        </details>)}
      </section>

      <section className="seo-landing-related" aria-labelledby="seo-landing-related-title">
        <h2 id="seo-landing-related-title">Explore related CabConnect services</h2>
        <ul>{page.relatedLinks.map((link) => <li key={link.href}><a href={link.href}>{link.label} <span aria-hidden="true">↗</span></a></li>)}</ul>
      </section>
    </div>

    <section className="seo-landing-final-cta">
      <div className="container">
        <div><span className="eyebrow">YOUR JOURNEY, YOUR PLAN</span><h2>Ready to request your trip?</h2><p>Share your route and travel details. The team will follow up to confirm availability and the final quotation.</p></div>
        <a className="button button-primary" href={page.ctaHref}>{page.ctaLabel} <span>↗</span></a>
      </div>
    </section>
  </article>;
}

export function ServiceLandingLinks() {
  return <section className="seo-landing-links" aria-labelledby="seo-landing-links-title">
    <div className="container">
      <div className="seo-landing-links-heading">
        <span className="eyebrow">FIND THE RIGHT RIDE</span>
        <h2 id="seo-landing-links-title">Explore Chennai cab and temple journeys</h2>
        <p>Choose the service that fits your trip, then share your route for a personal quotation.</p>
      </div>
      <div className="seo-landing-links-grid">
        {serviceLandingPages.map((page, index) => <a className="seo-landing-link-card" href={page.path} key={page.path}>
          <span className="seo-landing-link-number">0{index + 1}</span>
          <h3>{page.linkTitle}</h3>
          <p>{page.linkSummary}</p>
          <span className="seo-landing-link-arrow">Explore service <b aria-hidden="true">↗</b></span>
        </a>)}
      </div>
    </div>
  </section>;
}
