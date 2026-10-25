# Supabase setup for CabConnect Chennai

The frontend uses the public publishable/anon key only. The service-role key belongs only in Supabase Edge Function secrets and must never be added to a `VITE_*` variable or committed file.

## Local environment

Copy `.env.example` to `.env.local`, then set:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
VITE_WHATSAPP_NUMBER=your-CabConnect-WhatsApp-number-in-international-format
```

`.env.local` is git-ignored. Restart Vite after changing it.

## Database schema

Apply the three migrations in this order using the Supabase CLI linked to this project (`supabase db push`), or paste each file into the SQL Editor in filename order:

1. `migrations/202610170001_driver_applications.sql`
2. `migrations/202610170002_driver_police_verification.sql`
3. `migrations/202610250001_site_data.sql`

They create the driver application and request rate-limit tables, package catalogue, and customer request inbox. Public visitor submissions are accepted only by Edge Functions; applicants have no direct table read access. RLS allows catalogue reads and reserves application/request reads and updates to a signed-in user whose **trusted Auth app metadata** has `role: driver_admin`. Package seed rows preserve the existing package JSON and image paths.

## Edge Functions

Link the CLI to the project ref and deploy both endpoints:

```sh
supabase link --project-ref your-project-ref
supabase functions deploy submit-driver-application
supabase functions deploy submit-customer-request
```

Set these server-side function secrets in the Supabase dashboard or CLI. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are Supabase-provided function environment variables; confirm the service-role value exists in the Edge Function secret settings. Never put it in the website environment.

- `SUPABASE_SERVICE_ROLE_KEY`: project service-role key (server only)
- `RATE_LIMIT_HASH_SECRET`: a newly generated random secret used to hash the source IP for rate limiting
- `APP_ORIGIN`: local dev origin while testing (`http://localhost:5174`); set the deployed website origin before production

The endpoints validate payloads, require contact consent, enforce a server-side per-IP rate limit, and write with the server-only service role. The driver endpoint also rejects a filled honeypot and a second application for the same mobile number. Request submission IDs make client retries idempotent.

## Create the first administrator

Create the admin user through Supabase Auth (Dashboard → Authentication → Users). Then run this statement in the SQL Editor, replacing the email with the exact admin account email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"driver_admin"}'::jsonb
where lower(email) = lower('admin@example.com');
```

This assigns a server-trusted JWT claim used by RLS. Do not use user-editable `user_metadata` for this role. Sign out and back in after changing the role so the JWT refreshes.

## Test locally

Run the app at `http://localhost:5174`, open `/tour-packages`, `/driver-register`, `/cab-attachment`, the booking form, and temple tours. Confirm package data loads, submit a test request with explicit contact consent, and verify it appears under `/driver-admin` after signing in as the assigned admin. Check that a public/anonymous session cannot select from `driver_applications` or `customer_requests`.

The project currently has no TypeScript compiler or Supabase CLI dependency. The application itself is JavaScript/JSX, so `npm run build` and `npm run lint` are the available source checks. Live database reads/writes require the migrations and Edge Functions above to be deployed first.
