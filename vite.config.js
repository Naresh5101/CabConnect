import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { destinations } from './src/tours/tourData.js'

const projectRoot = dirname(fileURLToPath(import.meta.url))

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
      for (const page of tourPages) {
        const canonical = siteUrl ? `${siteUrl}${page.path}` : ''
        const metaTags = `<meta name="description" content="${page.description}" />\n    <meta property="og:title" content="${page.title}" />\n    <meta property="og:description" content="${page.description}" />${canonical ? `\n    <link rel="canonical" href="${canonical}" />` : ''}`
        const fallback = `<main class="tour-seo-fallback"><p>CabConnect Chennai · Tour Packages</p><h1>${page.title.split(' | ')[0]}</h1><p>${page.description}</p><a href="/tour-packages">Explore tour packages</a></main>`
        const html = baseHtml
          .replace('<title>CabConnect Chennai | Private Cab Bookings</title>', `<title>${page.title}</title>`)
          .replace('</head>', `    ${metaTags}\n  </head>`)
          .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`)
        const destination = join(outputDirectory, page.path.slice(1), 'index.html')
        mkdirSync(dirname(destination), { recursive: true })
        writeFileSync(destination, html)
        if (canonical) sitemapEntries.push(`  <url><loc>${xmlEscape(canonical)}</loc></url>`)
      }
      if (siteUrl) {
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join('\n')}\n</urlset>\n`
        writeFileSync(join(outputDirectory, 'sitemap.xml'), sitemap)
        writeFileSync(join(outputDirectory, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '')
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '')
  return {
    plugins: [react(), tourSeoPages(siteUrl)],
  }
})
