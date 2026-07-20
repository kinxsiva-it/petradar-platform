# Next Web Production Readiness

Status: production requirements are documented; deployment, cutover, and production storage smoke
have not been performed. `apps/web` remains the rollback target. Admin CMS traffic must remain
separate from the user Web application. `/volunteer` and rescue routes are outside this cutover.

## Deployment topology

Use a same-site, cross-origin deployment over HTTPS:

```text
Web: https://<web-host>.<site-domain>
API: https://<api-host>.<site-domain>/api/v1
```

This is the smallest topology matching the current implementation. The browser API client uses an
absolute `NEXT_PUBLIC_API_BASE_URL`, always sends credentials, and keeps access tokens in memory. The
API accepts one exact `WEB_ORIGIN` with credentials. Its refresh cookie is host-only, so it belongs to
the API host and is sent only to `/api/v1/auth`; the Web application never needs to read it.

Both hosts must share the same registrable site and use HTTPS. `SameSite=Lax` therefore remains valid
without weakening the cookie. Requests cross origins, so CORS must return the exact Web origin and
`Access-Control-Allow-Credentials: true`; wildcard CORS is forbidden.

A same-origin `/api/v1` reverse proxy is compatible but is not the baseline recommendation. It adds
path-routing ownership and proxy coupling, and must ensure API requests never reach Next. A truly
cross-site Web/API deployment is not supported by the current `SameSite=Lax` policy and would require
a separately approved cookie and CSRF design.

## Production environment contract

Never place secrets in a `NEXT_PUBLIC_` variable or expose them to the browser. Values below are
formats, not deployable values.

| Variable | App | Requirement | Exposure | Expected format and purpose | Missing or invalid behavior | Leaflet-only |
| --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Web | Required in production | Public | Absolute HTTPS API base ending in `/api/v1` | Code falls back to localhost, causing production API failure or mixed content; deployment must fail its config check | Required |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Web | Optional | Public, restricted browser key | Referrer-restricted Maps JavaScript/geocoding browser key | Google controls/search stay unavailable; Leaflet and manual/current-location picking remain available | Not needed |
| `NODE_ENV` | API | Required in production | Non-secret | Literal `production` | Schema defaults to development, disabling production cookie/storage safeguards; deployment must set it explicitly | Required |
| `PORT` | API | Optional | Non-secret | Positive integer; default `3000` | API listens on `3000` | Required |
| `API_PREFIX` | API | Optional, topology-critical | Non-secret | Path without surrounding slashes; default `api/v1` | Defaults to `api/v1`; must agree with Web URL and proxy routes | Required |
| `API_DOCS_ENABLED` | API | Optional | Non-secret | `true` or `false`; default `false` | Swagger remains disabled in production | Required |
| `WEB_ORIGIN` | API | Required in production | Non-secret | Exact HTTPS Web origin, no path | Schema defaults to the Angular development origin, so credentialed browser calls fail CORS | Required |
| `TRUST_PROXY_HOPS` | API | Required when behind trusted proxy | Non-secret | Integer `0` to `2`, equal to the controlled proxy hops | Defaults to `0`; client IP/protocol-derived behavior can be wrong behind a proxy | Required |
| `DATABASE_URL` | API | Required | Secret | PostgreSQL connection URL | API environment validation fails at startup | Required |
| `JWT_ACCESS_SECRET` | API | Required | Secret | Random string of at least 32 characters | API environment validation fails at startup | Required |
| `JWT_REFRESH_SECRET` | API | Required | Secret | Independent random string of at least 32 characters | API environment validation fails at startup | Required |
| `ACCESS_TOKEN_TTL_SECONDS` | API | Optional | Non-secret | Positive integer; default `900` | Default is used | Required |
| `REFRESH_TOKEN_TTL_DAYS` | API | Optional | Non-secret | Positive integer; default `30` | Default is used | Required |
| `LOCATION_PRIVACY_RADIUS_METERS` | API | Optional | Non-secret | Integer `100` to `2000`; default `300` | Default is used | Required |
| `LOCATION_OBFUSCATION_SECRET` | API | Required | Secret | Random string of at least 32 characters | API environment validation fails at startup | Required |
| `SIGHTING_PHOTO_STORAGE_PROVIDER` | API | Required operationally in production | Non-secret | Use `supabase`; `auto` is accepted only with all Supabase values | `auto` without complete Supabase config makes production startup fail; `local` also fails in production | Required |
| `SUPABASE_URL` | API | Required for production sighting photos | Secret server configuration | HTTPS Supabase project URL | Supabase selection fails or production provider startup is refused | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | API | Required for production sighting photos | Secret | Server-only service-role key | Supabase selection fails or production provider startup is refused | Required |
| `SUPABASE_STORAGE_BUCKET` | API | Required for production sighting photos | Non-secret identifier | Existing private bucket name | Supabase selection fails or production provider startup is refused | Required |
| `SIGHTING_PHOTO_LOCAL_ROOT` | API | Optional, development only | Non-secret | Writable local directory path | Development uses `.local-storage/sightings`; production never falls back to it | Required |

`SUPABASE_SIGHTINGS_BUCKET` is not an application variable. The established name is
`SUPABASE_STORAGE_BUCKET`.

## Authentication and CORS verification

Current production behavior:

- CORS permits only the exact `WEB_ORIGIN` outside development and enables credentials.
- Every Next API request uses `credentials: include`; bearer access tokens remain in React memory.
- The refresh cookie is `HttpOnly`, `Secure` in production, `SameSite=Lax`, host-only (no `Domain`),
  and scoped to `/api/v1/auth` when the default prefix is used.
- Login, registration, and refresh set or rotate the same cookie. Logout revokes the refresh token and
  clears the cookie using matching path, security, and SameSite options.
- Configure `TRUST_PROXY_HOPS` to the exact number of controlled proxies. The edge must terminate HTTPS
  and forward the original protocol, host, client IP, and request ID without accepting spoofed values
  from untrusted clients.

Production verification checklist:

1. Log in from the approved Web origin; confirm the response allows only that origin and sets the
   host-only secure refresh cookie.
2. Hard-reload a protected route and confirm session restoration completes through refresh then
   `/auth/me`.
3. Confirm the browser sends the refresh cookie only to the API host under `/api/v1/auth`.
4. Expire or invalidate the in-memory access token; confirm one refresh rotation and one replay restore
   the protected request without a refresh storm.
5. Log out; confirm server revocation and a matching cookie-clearing header.
6. Revisit a protected route and confirm refresh is rejected and the user is returned to anonymous
   behavior.

Do not approve cutover if the final hosts are cross-site, if forwarded HTTPS is not trustworthy, or if
any response combines wildcard CORS with credentials.

## Production sighting-photo storage

Production provider: Supabase Storage. Local filesystem storage is development/test-only; API startup
refuses it in production. `auto` selects Supabase only when URL, service-role key, and bucket are all
configured, so production should explicitly select `supabase`.

Uploads accept at most five files per request and per sighting, with each file at most 8 MiB. Accepted
types are JPEG, PNG, and WebP. The API checks declared MIME and file signature, rejects empty or
mismatched content, strips public image metadata, creates server-generated keys, and compensates by
deleting stored objects if the database transaction fails.

The bucket can remain private. Public pages receive API URLs of the form
`/api/v1/sightings/photos/<photo-id>/file`; the API verifies that the parent sighting is public, reads
the object with server credentials, and streams it with its MIME type. The Supabase URL and service
role key never reach Next. Owner-authorized deletion removes the database record transactionally and
then deletes the object; a cleanup failure is audited and returned as a recoverable service error.
Missing objects return not found, while provider failures return service unavailable.

Production storage smoke status:

`NOT TESTED — PRODUCTION STORAGE CREDENTIALS UNAVAILABLE`

Run in an approved disposable environment:

1. Upload one valid JPEG, PNG, or WebP to an editable disposable sighting.
2. Verify an unsupported MIME and MIME/signature mismatch are rejected.
3. Verify a file larger than 8 MiB is rejected at both proxy and API boundaries without a partial row.
4. Retrieve the image through the API photo route; do not use a direct bucket URL.
5. Reload the public sighting page and confirm the image remains available.
6. Delete the image through the supported owner flow and confirm the API reports success.
7. Confirm the deleted API URL and an inaccessible object fail safely without leaking storage details.
8. Inspect the Web artifact and browser network/configuration to confirm no service-role key is present.

Lost-pet URL-based photos are outside this storage flow and must remain unchanged.

## Reverse proxy, HTTPS, and assets

The production edge must:

- redirect HTTP to HTTPS before application traffic and preserve the original protocol and host;
- route all user-Web pages, including direct App Router dynamic deep links, to the Next runtime;
- serve `/_next/static/*`, `/_next/image/*` when used, `/favicon.ico`, `/icon.svg`, and emitted Leaflet
  CSS/image assets without an SPA fallback or API routing;
- route `/api/v1/*`, including `/api/v1/health` and photo-file routes, to NestJS unchanged;
- preserve `Set-Cookie`, `Cookie`, `Authorization`, CORS, content type, cache, and request-ID headers;
- allow multipart request bodies greater than the maximum 40 MiB file payload plus multipart overhead,
  while retaining the API's five-file and 8 MiB-per-file enforcement;
- use upload timeouts long enough for the approved maximum while bounding slow or abandoned requests;
- never cache authenticated API responses, refresh/logout responses, or responses carrying cookies;
- honor the explicit five-minute public cache header only on public sighting photo responses, and avoid
  caching private or error responses;
- allow required outbound/browser resources for OpenStreetMap tiles and, only when configured, the
  restricted Google Maps scripts and requests;
- keep Admin CMS hostname/path ownership separate and never route it into Next user Web;
- keep the Angular artifact and prior traffic rule available but inactive for immediate rollback.

Health checks use `GET /api/v1/health`. Next readiness must verify both a lightweight page and a static
asset. Deep-link checks must bypass warmed client navigation and request the URL directly.

## Monitoring and rollout gates

Provider-neutral critical signals:

- Web 5xx responses and Next process/runtime failures;
- API 5xx responses, public API latency, and health-check failures;
- login/register failures separated from expected validation failures;
- refresh endpoint rejection/failure rate and repeated refresh attempts;
- sighting upload failures separated by validation, API, and storage cause;
- Supabase store/read/delete failures, including cleanup-failure audit events;
- missing `/_next` assets, favicon/icon failures, Leaflet asset/tile failures, and mixed content;
- client-side fatal errors and failed route hydration/navigation;
- privacy/security incidents, unexpected public fields, suspicious CORS origins, and credential leakage.

Pre-cutover gates:

- The approved commit and immutable Next artifact are identified; required typecheck/build/CI evidence
  is clean for that commit.
- Production environment values pass a secret-safe configuration review, API health is green, and the
  exact-origin cookie/CORS checklist passes on the final topology.
- Supabase storage smoke passes with no browser-visible service-role key.
- Database migration status is confirmed without running migrations in this procedure.
- Direct deep links, static assets, public photo streaming, and the focused post-deployment smoke pass.
- Monitoring dashboards/alerts are active, an observation window is agreed, and deployment, rollback,
  security, and product owners are named.
- Both Next and Angular rollback artifacts plus their traffic configurations are available.

Immediately after traffic moves, check all critical signals, the focused smoke routes below, refresh
rotation, public privacy output, static assets, uploads, and Angular rollback availability. Initial
alert thresholds must be proposed and approved from measured baseline traffic; this repository defines
no numeric SLO, so no numeric gate is asserted here.

Rollback triggers:

- login, refresh/session restoration, or logout is broadly broken;
- sustained or sharply elevated Web/API 5xx, latency, fatal-client, or missing-asset signals;
- public pages expose exact location, contact, storage credentials, or another private field;
- sighting storage cannot reliably store/read, creates unsafe partial state, or leaks credentials;
- deep links, Community Map, or protected reporting are materially unavailable;
- monitoring is blind during the observation window or the authorized incident owner calls rollback.

Any confirmed privacy or credential incident triggers immediate traffic rollback and the incident
response process; do not wait for a rate threshold.

## Deployment and rollback runbook

### Pre-cutover checklist

- [ ] Approved commit and release owner recorded.
- [ ] Clean production build/CI evidence attached to that commit.
- [ ] Production environment variables supplied through approved secret management.
- [ ] API health is green on the deployment network.
- [ ] Exact-origin CORS, credentials, refresh cookie, HTTPS, and proxy trust verified.
- [ ] Production Supabase storage smoke passed.
- [ ] Database migration status confirmed; no unexpected migration is pending.
- [ ] Immutable Next artifact and routing configuration are available.
- [ ] Known-good Angular artifact and rollback routing configuration are available.
- [ ] Rollback authorizer/operator and incident channel are identified.
- [ ] Critical monitoring and alerts are active.

### Post-deployment smoke

Use approved disposable data and avoid unrelated regression testing:

1. Load landing directly.
2. Log in, hard-reload a protected route, and confirm session restoration.
3. Log out and confirm protected access is removed.
4. Load one public lost-pet detail directly.
5. Load Community Map and confirm privacy-safe markers plus required assets.
6. Load one public sighting detail directly and inspect its public response for private fields.
7. Open the protected Report Animal page.
8. Perform one approved non-destructive/disposable upload smoke and clean it up through the supported
   flow.
9. Open one notification deep link and confirm its allowed route/fallback behavior.
10. Confirm public responses omit exact coordinates, reporter/contact data, storage keys, and secrets.

### Rollback procedure

1. The named incident commander or deployment owner authorizes rollback when a trigger above occurs.
2. Preserve logs, request IDs, release identifier, timeline, and secret-safe evidence. Do not dump
   tokens, cookies, private coordinates, image bytes, or service-role credentials.
3. Restore the previously tested user-Web traffic rule to the known-good Angular artifact. Do not
   change Admin CMS routing, API routing, DNS ownership beyond the approved traffic mechanism, the
   database, or storage objects as part of Web rollback.
4. Verify Angular landing, login/session restoration/logout, one public detail, Community Map, one
   protected route, API health, and privacy-safe public responses.
5. Confirm both clients remain compatible with the unchanged API/database contract. If a separate API
   release caused the incident, use its independently approved rollback procedure; do not improvise a
   database rollback.
6. Keep both Next and Angular source/artifacts intact. Disable only the failed traffic assignment.
7. Record the incident, impact, release/rollback times, signals, owner, evidence, and follow-up actions;
   require fresh approval before another traffic move.

## Remaining production closure items

- Supply and independently review real production Web/API, JWT, database, privacy, and Supabase values.
- Provision/confirm the private Supabase bucket and pass the production storage smoke.
- Configure the chosen edge/proxy, HTTPS certificates, exact origins, static/deep-link routing, body
  limits, and trusted-hop count in the real environment.
- Select monitoring tooling, connect the signals above, agree thresholds/observation window, and test
  alert delivery.
- Name deployment, rollback, incident, product, security, and operations owners.
- Produce and approve immutable Next and Angular artifacts, then execute the runbook only under a
  separately authorized deployment/cutover task.
