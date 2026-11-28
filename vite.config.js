import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { destinations } from './src/tours/tourData.js'

const projectRoot = dirname(fileURLToPath(import.meta.url))
const defaultSiteUrl = 'https://cabconnecttours.in'

const publicPages = [
  { path: '/', title: 'CabConnect Chennai | City, Airport & Outstation Cabs', description: 'Request Chennai city and airport rides, outstation cabs, temple tours and South India tour quotations from CabConnect Chennai.' },
  { path: '/driver-register', title: 'Driver Registration | CabConnect Chennai', description: 'Register your driving experience and preferred work with CabConnect Chennai. Applications are reviewed by the team; submission is not an employment offer.' },
  { path: '/cab-attachment', title: 'Attach Your Cab | CabConnect Chennai', description: 'Share your commercial vehicle details with CabConnect Chennai for a team review and follow-up about possible fleet partnership.' },
]

const tourPages = [
  { path: '/tour-packages', title: 'South India Tour Packages from Chennai | CabConnect', description: 'Explore hill stations, family holidays, coastal trips and pilgrimage tours from Chennai. Review suggested plans and request a cab quotation from CabConnect.' },
  { path: '/chennai-to-kodaikanal-cab', title: 'Chennai to Kodaikanal Cab | Private Tour Quote | CabConnect', description: 'Plan a private cab from Chennai to Kodaikanal. Review suggested sightseeing and request a trip-specific quote from CabConnect Chennai.' },
  { path: '/chennai-to-ooty-cab', title: 'Chennai to Ooty Cab | Private Tour Quote | CabConnect', description: 'Plan a private cab from Chennai to Ooty. Review suggested sightseeing and request a trip-specific quote from CabConnect Chennai.' },
  ...destinations.map((destination) => ({
    path: destination.slug,
    title: `${destination.name} Tour Package from Chennai | CabConnect`,
    description: `Explore ${destination.name}, ${destination.state} with a suggested itinerary and request a private cab quotation from CabConnect Chennai.`,
  })),
]

function tourSeoPages(siteUrl) {
  return {
    name: 'cabconnect-tour-seo-pages',
    apply: 'build',
    closeBundle() {
      const outputDirectory = join(projectRoot, 'dist')
      const baseHtml = readFileSync(join(outputDirectory, 'index.html'), 'utf8')
      const xmlEscape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
      const sitemapEntries = []
      for (const page of [...publicPages, ...tourPages]) {
        const canonical = siteUrl ? `${siteUrl}${page.path}` : ''
        const metaTags = `<meta property="og:title" content="${page.title}" />\n    <meta property="og:description" content="${page.description}" />\n    <meta property="og:type" content="website" />\n    <meta property="og:image" content="${siteUrl}/daily-ride-passenger.webp" />\n    <meta property="og:image:alt" content="A passenger travelling by CabConnect Chennai cab" />\n    <meta property="og:url" content="${canonical}" />\n    <meta name="twitter:card" content="summary_large_image" />${canonical ? `\n    <link rel="canonical" href="${canonical}" />` : ''}`
        const fallbackLabel = page.path.startsWith('/tour') || page.path.startsWith('/chennai-to-') ? 'Tour Packages' : page.path === '/driver-register' ? 'Driver opportunities' : page.path === '/cab-attachment' ? 'Fleet partners' : 'Private cab enquiries'
        const fallback = `<main class="tour-seo-fallback"><p>CabConnect Chennai · ${fallbackLabel}</p><h1>${page.title.split(' | ')[0]}</h1><p>${page.description}</p><a href="/">Explore CabConnect Chennai</a></main>`
        const organizationSchema = page.path === '/' ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'CabConnect Chennai', url: siteUrl, telephone: '+91-94445-64127', areaServed: { '@type': 'City', name: 'Chennai' }, contactPoint: { '@type': 'ContactPoint', telephone: '+91-94445-64127', contactType: 'customer support' } })}</script>` : ''
        const html = baseHtml
          .replace('<title>CabConnect Chennai | Private Cab Bookings</title>', `<title>${page.title}</title>`)
          .replace(/<meta name="description"[^>]*\/>/, `<meta name="description" content="${page.description}" />`)
          .replace('</head>', `    ${metaTags}\n    ${organizationSchema}\n  </head>`)
          .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`)
        const destination = page.path === '/' ? join(outputDirectory, 'index.html') : join(outputDirectory, page.path.slice(1), 'index.html')
        mkdirSync(dirname(destination), { recursive: true })
        writeFileSync(destination, html)
        if (canonical && !page.path.startsWith('/admin')) sitemapEntries.push(`  <url><loc>${xmlEscape(canonical)}</loc></url>`)
      }
      if (siteUrl) {
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join('\n')}\n</urlset>\n`
        writeFileSync(join(outputDirectory, 'sitemap.xml'), sitemap)
        writeFileSync(join(outputDirectory, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '')
  const siteUrl = (env.VITE_SITE_URL || defaultSiteUrl).replace(/\/$/, '')
  return {
    plugins: [react(), tourSeoPages(siteUrl)],
  }
})
