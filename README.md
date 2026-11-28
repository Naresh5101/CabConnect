# CabConnect Chennai

Cab booking request site built with React, Vite and Leaflet. Customer screens remain JSX; the Supabase client, data services, database models, and route/access helpers use TypeScript.

## Project structure

- `src/App.jsx` composes the public site and preserves existing URL paths.
- `src/pages/admin/` contains the administrator dashboard; `src/layouts/` contains its reusable workspace shell.
- `src/components/` contains shared presentation and page metadata components.
- `src/drivers/`, `src/temples/`, and `src/tours/` contain feature screens, domain utilities, and styles.
- `src/services/` owns Supabase submissions and admin/package data access; UI components do not query tables directly.
- `src/utils/` contains cross-feature fare and location helpers; domain-only utilities stay beside their driver, temple, or tour feature.
- `src/config/environment.ts` centralizes public Vite environment settings.
- `src/lib/supabase.ts` is the browser client configuration; `src/types/database.ts` mirrors the local SQL schema; `src/app/routes.ts` centralizes route checks.
- `supabase/migrations/` and `supabase/functions/` contain database policy/schema and trusted server-side submission handlers.

The TypeScript check covers typed data, auth, route, and hook modules. Existing customer page components remain JavaScript/JSX and are checked by ESLint and the Vite build.
## Run and check
```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run preview
```

Vite may choose the next available port when its default port is occupied. Production files are generated in `dist/` for static hosting.
## Configuration and estimates

- `VITE_WHATSAPP_NUMBER` is the WhatsApp contact, in international digits-only format; `.env.example` shows the configured number. Vite variables are included in the browser bundle, so this must be treated as public contact information, never as a secret. The app also has a public fallback number in `src/App.jsx`.
- Vehicle rates are configured in `src/App.jsx`; common Chennai billing rules are in `src/utils/fareRules.js`. The indicative outstation card uses ₹16/₹19 per km for one-way Dzire/Ertiga (130 km minimum) and ₹14/₹17 per km for round trips (250 km/day minimum), plus ₹300/₹400 driver allowance per day. Chennai local rentals use 4/40, 8/80 and 12/120 hour/km packages, with extra-hour charges. These rates follow representative published [Chennai operator outstation tariffs](https://kalidasstravels.in/tariff/) and [local package tariffs](https://cabschennai.in/tariff/), not a regulated universal rate or partner-approved quote. Tempo Traveller requests are manual-quote only until partner pricing is approved. Confirm each partner's vehicle rates, capacity, allowance, airport minimums, package inclusions and tax treatment before launch.
- Local point-to-point and airport estimates are separate indicative rate models; airport minimums apply where configured. Ride-hailing prices can vary by demand and time, and the site's manual quotes may differ.
- Tolls, parking, waiting charges, taxes and other partner fees are not guessed or included in the estimated total. Confirm and communicate actuals before booking.
- The booking opens a prefilled `wa.me` link. It does not send messages automatically and does not use the WhatsApp Business API. Staff must confirm availability and the final quotation.

## Driver Recruitment Applications

- `/driver-register` is a driver recruitment form only. It collects the applicant’s contact details, service area, driving credentials (including a required Yes/No police verification certificate response), preferred work and shift, and optional profile information. It does not collect cab/vehicle attachment details.
- Applicants review their details before confirming. The page reports success only when the Supabase Edge Function returns a saved application ID. If Supabase is not configured or the write fails, it displays an error and does not claim the application was saved. WhatsApp is an optional follow-up after saving.
- `/admin` (also `/dashboard` and `/driver-admin`) is the separate administrator workspace. Production requires a Supabase Auth account whose **app metadata** has `role: "driver_admin"`; Supabase row-level security also checks that role for every private read and update. Applicant rows are never readable by anonymous users or ordinary signed-in users. Local development can show the dashboard shell, but RLS still blocks private data until an authorized admin signs in.
- Driver and customer submissions use server-side Supabase Edge Functions. The admin page reads `driver_applications`, `customer_requests`, and `tour_packages` through authenticated services, with RLS enforced by Postgres.

### Supabase setup

1. Configure `.env.local` from `.env.example` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public anon/publishable key only), and optional `VITE_WHATSAPP_NUMBER` / `VITE_SITE_URL`. `.env.local` is ignored by Git. Never put the service-role key in a `VITE_` variable or frontend file.
2. Review migration history and apply only migrations appropriate to the linked project. Do not reset or repair history without verifying the remote schema.
3. Set Edge Function secrets in Supabase: `SUPABASE_SERVICE_ROLE_KEY`, `RATE_LIMIT_HASH_SECRET`, and `APP_ORIGIN`. Supabase provides `SUPABASE_URL` to Edge Functions. Deploy `submit-driver-application` and `submit-customer-request` only after confirming the target project and migration state.
4. Create administrator accounts in Supabase Auth. Grant access from the Supabase SQL Editor (substitute the exact account email):

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"driver_admin"}'::jsonb
   where email = 'admin@example.com';
   ```

   Only trusted project owners should execute this statement. Do not set `driver_admin` in user-editable metadata. The app does not include an admin password, service-role key, or a public admin data endpoint.

The database enforces field lengths, allowed values, consent, phone formats, status values, and one application per normalized mobile number. The Edge Function repeats validation, applies a database-backed limit of five submissions per hashed IP per hour, uses a honeypot field, and writes through its server-side service-role key. RLS denies public table access and limits administrator reads/updates to the `driver_admin` app-metadata role. The function returns a conflict for duplicate mobile numbers. A deployment must have the migration, function secrets, published function, and Vite public environment variables configured for live saving; the local repository does not contain project credentials, so its database connection cannot be exercised until configured.

- `npm run test:drivers` checks driver input validation and application payload/message formatting.

## Cab Attachment

- Visit `/cab-attachment` to register one commercial vehicle or a fleet separately from driver registration. Every vehicle has its own document status and optional assigned-driver details.
- The owner can add multiple vehicles. A driver's details are associated only with the vehicle card where entered; the site does not assign one driver across the fleet.
- Cab attachment enquiries are submitted through `submit-customer-request` as `cab_attachment` records in `customer_requests`. The admin dashboard has a separate Cab Attachments view; WhatsApp is a follow-up option, not the database submission.
- `npm run test:attachment` checks per-vehicle driver validation and enquiry message separation.

## External services and deployment

- When `VITE_GOOGLE_MAPS_API_KEY` is configured, place autocomplete, address/reverse geocoding, interactive map picking, road distances and temple stop ordering use Google Maps Platform (Maps JavaScript API, Places API (New), Geocoding API, and Routes API). The key is public in the browser bundle: restrict it to the site's HTTP referrers and only these APIs, and enable billing in Google Cloud.
- Without a Google Maps key, the app keeps its OpenStreetMap tiles, Photon geocoder, and public OSRM routing fallback. Those public endpoints have availability, usage-policy and capacity limits and are not a production service-level guarantee.
- Add `VITE_GOOGLE_MAPS_API_KEY` to `.env.local` for local development and to the static host's build environment for production; rebuild after changing Vite environment variables. The empty example key in `.env.example` is intentional.
- When the Google provider is active, Google-derived coordinates and route distances are used for the current estimate but omitted from persisted request payloads.
- Geolocation requires customer permission and a secure origin (HTTPS, or localhost during development). Google Maps and OpenStreetMap attribution are displayed with their respective map/search results.
- Deploy the contents of `dist/` over HTTPS and configure the static host to serve `index.html` for the root route. Set `VITE_WHATSAPP_NUMBER` in the build environment if changing the contact.
- Previously referenced PNG artwork is now served as lossless WebP at the same pixel dimensions. JPEG photos remain unchanged; the conversions preserve decoded pixels while reducing transfer size.
- Vehicle image credits and license references are in `public/vehicles/ATTRIBUTION.md`. The Dzire source has a personality-rights warning on its Commons page and must be reviewed or replaced before public launch.

## Temple Tours

- Temple records and category memberships live in `src/temples/templeData.js` and use JSDoc `TempleRecord` typing because this repository is JavaScript/JSX. Each record links to a source; the catalogue note calls out provisional curation and missing temple image rights. Tamil names are only supplied where an official HR&CE name was checked.
- The first catalogue includes all six Arupadai Veedu temples, Navagraha and Pancha Bhoota circuits (with out-of-state temples explicitly marked), Navatirupathi records, and representative Amman, Shiva, Vishnu, Murugan and pilgrimage records. The list is an initial selection, not an exhaustive gazetteer.
- Temple stop geocoding, road distances, and route-order suggestions use Google Maps when configured and the documented public fallbacks otherwise. Stop coordinates are resolved at request time and are not stored as invented catalogue coordinates. A failed lookup or route leaves the manual WhatsApp quotation path available.
- Temple estimates use the currently configured per-kilometre vehicle rate plus the configured daily driver allowance. Tolls, parking, waiting, taxes and other partner charges are excluded. Partner-approved tour rates and public-service usage limits need review before production use.
- `npm run test:temples` runs helper-level tests for catalogue search/filtering, selection order, route errors, fare recalculation and WhatsApp message content.

## Tour Packages

- Visit `/tour-packages` for the destination catalogue; destination pages are available for Kodaikanal, Ooty, Yercaud and Rameswaram. Chennai-to-Kodaikanal and Chennai-to-Ooty cab landing paths are also included.
- Tour itineraries are suggestions. Attraction access, weather, travel time and local conditions need confirmation for each trip. Tour pages do not show unverified package prices.
- Tour and temple enquiries are saved through `submit-customer-request` as `tour_quote` and `temple_tour` records in `customer_requests`. WhatsApp follow-up does not replace the database write.
- Published destinations load from `tour_packages`. Admin package changes require a `driver_admin` session; new database slugs resolve to their detail pages.
- Dedicated SEO landing pages cover `/chennai-local-cab`, `/chennai-outstation-cab`, and `/chennai-arupadai-veedu-tour`. Each page has distinct service information, FAQs, booking links and internal links; they are also emitted in the sitemap with crawlable static HTML content at build time.
- To generate canonical URLs and a sitemap at build time, set `VITE_SITE_URL` to the public production origin, then rebuild. The Vite build writes static route HTML with destination-specific titles/descriptions and crawlable fallback content. The React app remains client-rendered; this is not full server-side rendering.
- Run `npm run test:seo` to check the landing-page routes and content.
- Attraction details are linked to tourism and government references on each destination page. Some generated destination illustrations are reused for attraction context rather than presented as documentary photos; the attraction text notes seasonal and access limits.

The booking flow should be retested against the actual selected geocoding/routing provider and partner-approved rates before deployment.

The booking flow should be retested against the selected geocoding/routing provider and partner-approved rates before deployment. Run `npm run typecheck`, `npm run lint`, `npm run build`, and the feature-specific test scripts for local verification.
