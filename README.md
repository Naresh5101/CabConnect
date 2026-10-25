# CabConnect Chennai

Cab booking request site built with React, JavaScript, Vite and Leaflet. This repository is JavaScript/JSX, not TypeScript.
## Run and check
```sh
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Vite may choose the next available port when its default port is occupied. Production files are generated in `dist/` for static hosting.
## Configuration and estimates

- `VITE_WHATSAPP_NUMBER` is the WhatsApp contact, in international digits-only format; `.env.example` shows the configured number. Vite variables are included in the browser bundle, so this must be treated as public contact information, never as a secret. The app also has a public fallback number in `src/App.jsx`.
- Vehicle rates are configured in `src/App.jsx`; common Chennai billing rules are in `src/fareRules.js`. The indicative outstation card uses ₹16/₹19 per km for one-way Dzire/Ertiga (130 km minimum) and ₹14/₹17 per km for round trips (250 km/day minimum), plus ₹300/₹400 driver allowance per day. Chennai local rentals use 4/40, 8/80 and 12/120 hour/km packages, with extra-hour charges. These rates follow representative published [Chennai operator outstation tariffs](https://kalidasstravels.in/tariff/) and [local package tariffs](https://cabschennai.in/tariff/), not a regulated universal rate or partner-approved quote. Tempo Traveller requests are manual-quote only until partner pricing is approved. Confirm each partner's vehicle rates, capacity, allowance, airport minimums, package inclusions and tax treatment before launch.
- Local point-to-point and airport estimates are separate indicative rate models; airport minimums apply where configured. Ride-hailing prices can vary by demand and time, and the site's manual quotes may differ.
- Tolls, parking, waiting charges, taxes and other partner fees are not guessed or included in the estimated total. Confirm and communicate actuals before booking.
- The booking opens a prefilled `wa.me` link. It does not send messages automatically and does not use the WhatsApp Business API. Staff must confirm availability and the final quotation.

## Driver Recruitment Applications

- `/driver-register` is a driver recruitment form only. It collects the applicant’s contact details, service area, driving credentials (including a required Yes/No police verification certificate response), preferred work and shift, and optional profile information. It does not collect cab/vehicle attachment details.
- Applicants review their details before confirming. The page reports success only when the Supabase Edge Function returns a saved application ID. If Supabase is not configured or the write fails, it displays an error and does not claim the application was saved. WhatsApp is an optional follow-up after saving.
- `/driver-admin` is the separate administrator workspace. It requires a Supabase Auth account whose **app metadata** has `role: "driver_admin"`; Supabase row-level security also checks that role for every read and update. Applicant rows are never readable by anonymous users or ordinary signed-in users.
- This repository had no backend or database integration. The Supabase integration is implemented in `supabase/migrations/` and `supabase/functions/submit-driver-application/index.ts`. Deploy both SQL migrations and the Edge Function to a Supabase project before enabling applications.

### Supabase setup

1. Create a Supabase project and apply the migration with the Supabase CLI (`supabase link --project-ref ...` followed by `supabase db push`), or run the migration SQL in the Supabase SQL Editor.
2. Configure the Vite build environment with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the public anon/publishable key only). Never put the service-role key in a `VITE_` variable or frontend file. Copy the same public values into local `.env` when developing.
3. Set Edge Function secrets in the Supabase project: `SUPABASE_SERVICE_ROLE_KEY` (secret key), `RATE_LIMIT_HASH_SECRET` (a long random secret used to hash caller IPs), and `APP_ORIGIN` (the exact deployed site origin, for example `https://cabconnect.example`). Supabase provides `SUPABASE_URL` to Edge Functions. Deploy with `supabase functions deploy submit-driver-application`.
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
- Cab attachment enquiries are not stored by the site. The review step opens a prefilled WhatsApp message for the owner to manually send; CabConnect must manually review vehicle and driver eligibility.
- `npm run test:attachment` checks per-vehicle driver validation and enquiry message separation.

## External services and deployment

- Address search and reverse geocoding use the public Photon service; road routes use the public OSRM demo endpoint; map tiles use OpenStreetMap. These public endpoints have availability, usage-policy and capacity limits and are not a production service-level guarantee. Confirm their terms and replace them with an authorized, monitored provider if production volume or uptime requires it.
- Geolocation requires customer permission and a secure origin (HTTPS, or localhost during development). OpenStreetMap attribution is displayed in the map picker.
- Deploy the contents of `dist/` over HTTPS and configure the static host to serve `index.html` for the root route. Set `VITE_WHATSAPP_NUMBER` in the build environment if changing the contact; rebuild after changing Vite environment variables.
- Vehicle image credits and license references are in `public/vehicles/ATTRIBUTION.md`. The Dzire source has a personality-rights warning on its Commons page and must be reviewed or replaced before public launch.

## Temple Tours

- Temple records and category memberships live in `src/temples/templeData.js` and use JSDoc `TempleRecord` typing because this repository is JavaScript/JSX. Each record links to a source; the catalogue note calls out provisional curation and missing temple image rights. Tamil names are only supplied where an official HR&CE name was checked.
- The first catalogue includes all six Arupadai Veedu temples, Navagraha and Pancha Bhoota circuits (with out-of-state temples explicitly marked), Navatirupathi records, and representative Amman, Shiva, Vishnu, Murugan and pilgrimage records. The list is an initial selection, not an exhaustive gazetteer.
- Temple route geocoding uses Photon and road distance/order suggestions use the public OSRM endpoint. Stop coordinates are resolved at request time and are not stored as invented catalogue coordinates. A failed lookup or route leaves the manual WhatsApp quotation path available.
- Temple estimates use the currently configured per-kilometre vehicle rate plus the configured daily driver allowance. Tolls, parking, waiting, taxes and other partner charges are excluded. Partner-approved tour rates and public-service usage limits need review before production use.
- `npm run test:temples` runs helper-level tests for catalogue search/filtering, selection order, route errors, fare recalculation and WhatsApp message content.

## Tour Packages

- Visit `/tour-packages` for the destination catalogue; destination pages are available for Kodaikanal, Ooty, Yercaud and Rameswaram. Chennai-to-Kodaikanal and Chennai-to-Ooty cab landing paths are also included.
- Tour itineraries are suggestions. Attraction access, weather, travel time and local conditions need confirmation for each trip. Tour pages do not show unverified package prices.
- Enquiries use `VITE_WHATSAPP_NUMBER` and open a prefilled message for the customer to review and send manually. This site does not save the enquiry or automatically send WhatsApp messages.
- To generate canonical URLs and a sitemap at build time, set `VITE_SITE_URL` to the public production origin, then rebuild. The Vite build writes static route HTML with destination-specific titles/descriptions and a short crawlable text fallback. The React app remains client-rendered; this is not full server-side rendering.
- Attraction details are linked to tourism and government references on each destination page. Some generated destination illustrations are reused for attraction context rather than presented as documentary photos; the attraction text notes seasonal and access limits.

The booking flow should be retested against the actual selected geocoding/routing provider and partner-approved rates before deployment.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
