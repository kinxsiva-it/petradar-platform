# PetRadar Next.js User Web Migration Plan

## Purpose and boundaries

PetRadar will migrate the user-facing Angular application to Next.js in parallel. The Angular app
at `apps/web` remains the behavior reference and rollback target until the Next app reaches verified
feature parity. The Angular Admin CMS at `apps/admin` and NestJS API at `apps/api` remain separate.

The Next user app must never expose Admin CMS operations. An account with the `ADMIN` role receives
the same user-facing experience as another authenticated user. Any retained volunteer experience must
require an explicit `VOLUNTEER` role; no rescue board is part of the Next foundation.

## 1. Current Angular Web feature inventory

| Area | Current source | Behavior to preserve |
| --- | --- | --- |
| Landing page | `libs/frontend/landing` | PetRadar hero, report/search calls to action, platform summary, privacy message |
| Navbar and account menu | `libs/frontend/core/src/lib/layouts` | Responsive navigation, authenticated account actions, notifications, active links, sign out |
| Notifications | `libs/frontend/core/src/lib/notifications`, `libs/frontend/notifications` | Unread count, dropdown, all/unread filters, read-one/read-all, action deep links |
| Community Map | `libs/frontend/map` | Search/filter overlays, marker rendering, approximate public locations, provider fallback |
| Report Animal | `libs/frontend/report-animal` | Six-step validation, exact private pin, review, create-then-upload retry behavior |
| Lost Pets | `libs/frontend/lost-pets` | Public list/detail plus authenticated create, edit, owner views, match links, privacy copy |
| My Reports | `libs/frontend/sightings` | Owned report list, statuses, edits where allowed, ordered photos and fallbacks |
| Matches | `libs/frontend/matching`, `libs/frontend/lost-pets` | Authenticated overview/detail, evidence and approximate distance without Web Admin moderation |
| Profile and settings | `libs/frontend/account` | Normal authenticated-user identity and preference surfaces |
| Login and registration | `libs/frontend/auth`, `libs/frontend/core/src/lib/auth` | Validated forms, access token, HttpOnly refresh cookie, session restore, safe return URL |
| Private location picker | `libs/frontend/shared-ui`, reporting and lost-pet forms | Owner/reporter exact pin input separated from public approximate output |
| Map providers | `libs/frontend/map/src/lib/services/map-provider-state.service.ts` | Leaflet default, Google 2D when configured, safe fallback; experimental Google 3D is not a cutover requirement |
| Photo uploads | reporting, sightings, and lost-pet data access | Client validation, `FormData`, upload limits, retry without duplicate parent records |
| Role behavior | Web routes and core layouts | ADMIN acts as a normal Web user; volunteer access requires explicit `VOLUNTEER` |

## 2. Next.js migration target

- `apps/web-next` uses Next.js App Router, React, TypeScript, global design tokens, and focused
  component styles.
- Server Components are the default for public page structure and SEO. Client Components are used
  only for session state, interactive forms, browser maps, uploads, dropdowns, and other browser-only
  behavior.
- The NestJS API remains the only business-logic and authorization authority. Next.js does not gain a
  second database connection, ORM, or parallel policy layer.
- `NEXT_PUBLIC_API_BASE_URL` is the required public API URL. Optional
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is a browser key and must be restricted by production HTTP
  referrer and to the Maps JavaScript API. Neither value may contain tokens, cookies, database URLs,
  unrestricted credentials, or server secrets.
- The Angular app stays deployable throughout migration. Route cutover happens only after parity is
  measured and approved.

## 3. Route-by-route migration plan

| Angular route | Next target | Target phase | Foundation status |
| --- | --- | --- | --- |
| `/` | `/` | Phase 2 | Migrated with public metadata and product-quality calls to action |
| `/login` | `/login` | Phase 2 | Real API-backed form and user-facing redirect implemented |
| `/register` | `/register` | Phase 2 | Real validated form and user-facing redirect implemented |
| `/community-guidelines` | `/community-guidelines` | Phase 2 | Public safety and privacy guidance implemented |
| `/lost-pets` and public detail | Same paths | Phase 2 | API-backed list, filters, pagination, detail, and metadata implemented |
| `/report-animal` | `/report-animal` | Phase 3/4 | Authenticated create wizard, private map picker, and retry-safe sighting photo upload implemented |
| `/my/reports` | `/my/reports` | Phase 3 | Authenticated API-backed read path implemented |
| `/my/lost-pets` and owner detail/edit | Same paths | Phase 3/4 | Owner list, create/edit private picker, and supported lost-pet photo URL behavior implemented |
| `/matches` and match detail | Same paths | Phase 3 | Authenticated read-only overview and detail implemented |
| `/notifications` | `/notifications` | Phase 3 | Dropdown, unread count, list, and read mutations implemented |
| `/profile` | `/profile` | Phase 3 | Authenticated read-only account view implemented |
| `/settings` | `/settings` | Phase 3 | Truthful API-capability settings shell implemented |
| `/map` | `/map` | Phase 4 | Public API-backed approximate-area map, filters, near-me, Leaflet, and optional Google 2D implemented |

The Angular `/volunteer` tree is intentionally not scaffolded. A later product decision may retain a
strictly volunteer-facing assignment experience, but it must not be inferred from `ADMIN` privilege.

## 4. Shared API contract strategy

1. Keep the existing `/api/v1` endpoints and DTO semantics unchanged during migration.
2. Model request/response types next to the Next client initially, matching the real API contracts.
3. Prefer extracting framework-neutral types into `libs/contracts` or generating types from the
   existing OpenAPI document once that workflow is approved; do not import Angular services into React.
4. Use one typed `apiRequest<T>` wrapper with normalized base URL, JSON handling, structured errors,
   `credentials: 'include'`, optional bearer token, and no-cache defaults for user-specific data.
5. Preserve backend ownership, RBAC, moderation, status-transition, and privacy enforcement. UI guards
   improve navigation but never replace API authorization.

## 5. Auth migration plan

- Keep the access token only in React memory. Do not write it or the refresh token to local storage,
  session storage, URL parameters, logs, or public environment variables.
- Continue sending the API-managed HttpOnly refresh cookie with credentialed login, register, refresh,
  and logout requests.
- Restore a session once on client startup. During Phase 2, add coordinated 401 handling with one
  refresh attempt and replay, matching the Angular interceptor without creating refresh storms.
- Add safe return-URL validation before wiring redirects. Web defaults remain user-facing; Admin CMS
  redirect behavior stays inside `apps/admin`.
- Treat ADMIN as a normal authenticated user in this application. Do not add CMS links, moderation
  controls, rescue management, or automatic Admin redirects.
- If volunteer routes are retained, check explicitly for `VOLUNTEER`, including for multi-role users.

## 6. Map and private location picker migration plan

- Load Leaflet and Google Maps browser code only from Client Components and avoid server rendering of
  browser globals.
- Keep Leaflet as the dependable default. Enable Google 2D only when its browser key is configured and
  retain the current fallback-to-Leaflet behavior.
- Do not make experimental Google 3D part of migration parity or cutover without separate approval.
- Preserve longitude/latitude ordering at API boundaries and the existing valid coordinate ranges.
- Keep a single exact-pin source of truth in create/edit forms. Exact coordinates are submitted only to
  authorized endpoints and never rendered by public list, detail, marker, metadata, or SEO output.
- Render only backend-produced approximate coordinates on public maps. Do not approximate private data
  independently in the browser.

## 7. Photo upload migration plan

- Preserve accepted image types, file-count limits, empty-file rejection, per-file size limits, ordered
  previews, removal, progress, and accessible error feedback.
- Continue the existing sighting flow: create the parent record first, upload selected files with
  `FormData`, and allow upload retry without creating a duplicate sighting.
- Keep server-side signature validation, metadata stripping, owner/Admin authorization, storage-key
  generation, and compensation cleanup as the security authority.
- Revoke browser object URLs when previews are removed or components unmount.
- Verify public photo responses never expose storage keys, private coordinates, reporter details, or
  image metadata.

## 8. Notification migration plan

- Migrate the navbar bell and full page as one state domain so unread count and list state cannot drift.
- Preserve list filters, recent-item limit, unread badge cap, mark-one/read-all mutations, accessible
  loading/error/empty states, and safe internal action URLs.
- Refresh unread state after login and mutations, and clear local notification state on logout.
- Reject external or malformed action URLs before client navigation.

## 9. Testing strategy

- Add focused component tests for form validation, auth state, role visibility, notifications, upload
  retries, and privacy-safe rendering as each real feature migrates.
- Add API-contract tests or schema validation for typed Next clients rather than relying on TypeScript
  assertions alone.
- Run strict typecheck, lint, and production build for `web-next` in CI once the foundation is accepted.
- Add browser smoke coverage later when authorized. Reuse fresh auth contexts and stable role-specific
  locators; do not share mutable demo state across parallel workers.
- Maintain a route parity checklist comparing Angular and Next loading, success, empty, error,
  authorization, responsive, and accessibility behavior.

## 10. Cutover plan

1. Deploy `web-next` to a separate preview hostname with the same development/staging API contracts.
2. Verify each route against the Angular reference and record intentional differences.
3. Confirm cookies, CORS, CSP, image sources, map keys, deep links, and refresh behavior on the intended
   production origin.
4. Freeze new Angular Web features briefly or dual-implement approved fixes while final parity closes.
5. Run authorized smoke/E2E and privacy checks, then approve traffic cutover explicitly.
6. Keep the Angular artifact and routing configuration available for immediate rollback during the
   observation window.
7. Remove Angular Web only in a later, separately approved cleanup after rollback is no longer needed.

## 11. Risks and rollback plan

- **Contract drift:** Angular interfaces may hide API changes. Mitigate with shared/generated contracts
  and response validation before feature cutover.
- **Cookie/CORS differences:** a new origin can break refresh cookies. Test real origin attributes and
  credentialed requests before enabling traffic.
- **SSR privacy leaks:** server-rendered metadata or cached payloads could expose user-specific data.
  Keep private pages dynamic and never serialize exact locations or reporter contact into public HTML.
- **Map behavior drift:** provider loading, marker geometry, geolocation, and mobile overlays are
  browser-sensitive. Compare both providers on real devices before cutover.
- **Upload regressions:** multipart retries can duplicate parent records. Preserve create-then-upload
  state and test partial failure explicitly.
- **Role leakage:** ADMIN must not inherit volunteer/CMS UI. Centralize user-Web role visibility and
  test ADMIN-only, VOLUNTEER-only, and explicit multi-role accounts.
- **Rollback:** keep `apps/web`, its deployment artifact, and original routing intact. Repoint user Web
  traffic to Angular if any parity, auth, privacy, or stability threshold fails.

## Four-phase migration plan

### Phase 1: Foundation

- Create `apps/web-next`.
- Set up Next.js + React + TypeScript.
- Add routing shell.
- Add PetRadar layout/navbar foundation.
- Add API client foundation.
- Add auth foundation.
- Add environment example.
- Add initial placeholder routes.
- Keep Angular Web intact.
- Keep Admin CMS intact.

Exit criteria: all foundation routes compile, the app serves independently on port 4300, no Admin or
rescue-board links exist, the API/auth foundations preserve the refresh-cookie security model, and the
Angular Web/Admin applications remain untouched.

### Phase 2: Public Pages + Auth

- Migrate landing page.
- Migrate login/register.
- Migrate community guidelines.
- Migrate public lost-pet list/detail.
- Add public SEO-friendly page structure.
- Wire basic auth/session behavior.
- Preserve HttpOnly refresh-cookie strategy.
- Keep ADMIN behaving like normal Web user.

Exit criteria: public pages and auth behavior match Angular for navigation, validation, session restore,
safe redirects, loading/error states, SEO metadata, and public-location privacy.

Phase 2 status (2026-07-13): implementation complete pending broader authorized browser parity checks.

- Completed routes: `/`, `/login`, `/register`, `/community-guidelines`, `/lost-pets`, and
  `/lost-pets/[id]`.
- Wired `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `GET /auth/me`, and
  `POST /auth/logout`. The access token remains in React memory; the API-managed HttpOnly refresh
  cookie remains credentialed and inaccessible to application code.
- Session restoration calls refresh followed by `me`. Authenticated requests coordinate one refresh
  attempt and replay after a 401 rather than issuing parallel refresh requests.
- Added authenticated and anonymous navbar states plus a normal user account menu. `ADMIN` receives
  no CMS, moderation, rescue-board, or volunteer navigation.
- Wired public `GET /lost-pets` with supported `query`, `species`, `status`, `page`, and `pageSize`
  parameters, and public `GET /lost-pets/:id` for details.
- Public lost-pet payloads are parsed from `unknown` and mapped to a whitelist that discards owner ID,
  contact method, exact location, microchip state, and all other owner-only fields. UI and metadata do
  not render coordinates; the UI describes only the backend-provided approximate radius.
- Added page metadata without pet descriptions, contact details, or coordinates. Dynamic detail
  metadata falls back safely if the API record cannot be fetched.
- Intentional Angular difference: the Next public list uses URL-based server filters and pagination for
  shareable, SEO-friendly state rather than Angular's client signal state. Supported filters and API
  semantics are unchanged.
- Current gaps: authenticated Phase 3 routes remain normal placeholders, map and uploads remain Phase
  4, and full cookie/CORS behavior still requires deployment-origin verification before cutover. The
  locally running API currently answers a preflight from `http://localhost:4300` with
  `Access-Control-Allow-Origin: http://localhost:4301`; local browser auth requires the configured API
  CORS origin to match the approved Next Web origin before interactive verification.
- Phase 3 should begin with authenticated route protection and My Reports/My Lost Pets read paths,
  then proceed to create/edit wizards, matches, notifications, and profile/settings.

### Phase 3: Core User Flows

- Migrate Report Animal wizard.
- Migrate Lost Pet create/edit.
- Migrate My Reports.
- Migrate My Lost Pets.
- Migrate Matches overview/detail.
- Migrate Notifications dropdown/page.
- Migrate Profile/Settings shell.
- Preserve validation, loading, error, and privacy behavior.

Exit criteria: authenticated user workflows match Angular, ownership remains backend-enforced, uploads
retry safely, ADMIN receives normal user behavior, and any volunteer access is explicitly role-gated.

Phase 3 status (2026-07-13): core user-flow implementation complete pending visual browser parity and
the Phase 4 map/upload work.

- Development CORS now preserves the configured `WEB_ORIGIN` and adds only the named local Angular
  Web, Next Web, and Admin origins while `NODE_ENV=development`. Production remains restricted to its
  configured origin and credential support remains enabled.
- Verified on a temporary task-owned API instance: the `http://localhost:4300` preflight returned the
  matching allow-origin plus credentials, login created a session, `/auth/me` matched the login user,
  refresh rotated the session, logout succeeded, and refresh after logout returned 401.
- Added one reusable authenticated-route boundary for `/my/reports`, `/my/lost-pets`,
  `/report-animal`, `/lost-pets/new`, `/lost-pets/[id]/edit`, `/matches`, `/matches/[id]`,
  `/notifications`, `/profile`, and `/settings`. Anonymous visitors receive a safe internal
  `returnUrl` redirect to login while session restoration renders a loading state.
- Wired authenticated `GET /sightings/mine` and `POST /sightings` for My Reports and the report wizard.
  Report validation requires species, condition, urgency, a valid seen time, count, and a confirmed
  private point before the API is called.
- Wired `GET /lost-pets/mine`, `GET /lost-pets/mine/:id`, `POST /lost-pets`, and
  `PATCH /lost-pets/:id` for owner list/create/edit flows. Exact coordinates and contact instructions
  remain inside owner-authorized responses and are not rendered by public pages.
- Wired `GET /matches` and `GET /matches/:id`. The user Web renders score, status, reasons, timing,
  approximate distance, and public radius without confirm/reject moderation operations, including for
  ADMIN accounts.
- Wired notification list, unread-count, mark-one-read, and mark-all-read endpoints through one shared
  notification state domain used by the navbar dropdown and `/notifications`. Action links accept safe
  root-relative paths only.
- Profile reads the current auth session truthfully. Settings is deliberately non-editable because no
  persistence endpoints exist; it does not create mock preference state.
- Manual coordinate entry is an intentional Phase 3 fallback. It keeps exact values inside
  authenticated create/update calls and explains that backend-generated approximate locations are the
  only public output.
- Current gaps: the private map picker, provider behavior, sighting photo upload/retry, lost-pet photo
  upload, responsive visual parity, and final Angular-versus-Next comparison remain Phase 4.
- Rollback remains unchanged: Angular Web stays intact and deployable until parity, privacy, and
  authorized browser checks approve cutover.

### Phase 4: Map, Uploads, Parity, and Cutover

Status: implemented in the migration workspace; production cutover is not approved by this phase.

- Community Map now reads `GET /map/sightings` and `GET /map/nearby`, validates the lightweight
  public response, draws backend-produced approximate areas, and provides species/condition filters,
  safe near-me discovery, loading/error/empty states, and a public-safe result/detail panel.
- Leaflet/OpenStreetMap is the client-only default. Google Maps 2D is offered only when the optional
  public browser key is configured. Google 3D is neither loaded nor exposed.
- `/report-animal`, `/lost-pets/new`, and `/lost-pets/[id]/edit` share a private Leaflet pin picker,
  browser geolocation, manual coordinate fallback, explicit confirmation, and privacy copy. Public
  map code never receives those exact form coordinates.
- Report Animal accepts up to five JPEG, PNG, or WebP files of at most 8 MB each, creates the sighting
  first, then sends multipart field `photos` to `POST /sightings/:id/photos`. A failed upload retains
  the created ID and retries only the upload. The API remains responsible for signature validation,
  metadata stripping, ownership, storage, and public URLs.
- Lost pets retain the current API-supported `photoUrls` workflow with add/remove/preview behavior.
  Binary lost-pet upload is not simulated because no corresponding endpoint exists.
- Focused responsive behavior covers map panels, filters, pickers, photo grids, wizard actions, and
  mobile wrapping. Controls use native labels/buttons, visible focus styles, alert/live regions, and
  accessible map/picker labels.
- Smoke/E2E coverage remains deferred until explicitly authorized.

#### Route parity checklist

| Route group | Functional parity status | Remaining pre-cutover check |
| --- | --- | --- |
| `/`, `/community-guidelines` | Public content, metadata, navigation, and privacy guidance implemented | Cross-browser visual review |
| `/login`, `/register` | API auth, memory-only access token, refresh-cookie restore, and safe return URL implemented | Production-origin cookie/CORS verification |
| `/lost-pets`, `/lost-pets/[id]` | Public list/detail, filters, safe fields, images, loading/error/empty states implemented | Real-device image and metadata review |
| `/map` | Public approximate map, Leaflet, optional Google 2D, filters, near-me, selection panel implemented | Provider and geolocation browser matrix |
| `/report-animal` | Validation, private picker, create, photo preview/upload, partial-failure retry implemented | Authorized real-file browser upload smoke |
| `/lost-pets/new`, `/lost-pets/[id]/edit` | Owner validation, private picker, exact authorized edit load, photo URL parity implemented | Owner-record browser edit smoke; binary upload remains a backend follow-up |
| `/my/reports`, `/my/lost-pets` | Authenticated API lists and privacy-safe summaries implemented | Large/empty dataset responsive review |
| `/matches`, `/matches/[id]` | Authenticated read-only match views implemented; no Web moderation actions | Non-empty demo account browser review |
| `/notifications` and navbar bell | Shared unread state, safe navigation, read mutations, layering implemented | Keyboard and mobile dropdown browser review |
| `/profile`, `/settings` | Truthful read-only/API-capability shells implemented | Add edit behavior only after APIs exist |

#### Privacy and security checklist

- [x] Public map markers are parsed only from `/map/*` public latitude, longitude, and radius fields.
- [x] Exact coordinates stay in authenticated create/edit form state and payloads.
- [x] Public lost-pet pages omit owner contact and exact location; map panels omit reporter contact.
- [x] The backend—not Next—generates public approximations and validates/sanitizes uploaded images.
- [x] Access tokens remain in memory; refresh tokens remain API-managed HttpOnly cookies.
- [x] No Admin CMS, rescue board, volunteer dashboard, Google 3D, or Web moderation action is exposed.
- [ ] Run authorized network/DOM inspection against production-like builds to reconfirm no sensitive
  fields enter public HTML, metadata, browser logs, or cached responses.

#### Production CORS, cookie, environment, and deploy checklist

- Set `NEXT_PUBLIC_API_BASE_URL` to the approved HTTPS `/api/v1` origin before building the Next app.
- Optionally set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` only to a referrer-restricted Maps JavaScript API
  browser key. Omit it to keep Leaflet-only behavior. Never configure a Google server key here.
- Set the API production `WEB_ORIGIN` to the exact approved Next Web origin; do not rely on local
  development origins in production.
- Verify credentialed CORS returns that exact origin and `Access-Control-Allow-Credentials: true`.
- Verify refresh-cookie `Secure`, `HttpOnly`, `SameSite`, domain, path, expiry, rotation, and logout
  revocation from the final Web/API topology. Cross-site hosting may require a deliberate SameSite
  policy and CSRF review.
- Verify CSP/connect/image/script/style sources for the API, uploaded media, OpenStreetMap tiles, and
  optional Google Maps. Confirm HTTPS-only production content and no mixed-content requests.
- Use the explicit production-safe `web-next:build` target and add its artifact to the deployment
  pipeline; this phase intentionally does not change DNS, reverse proxy, CDN, or Angular deployment.
- Confirm deep-link rewrites, Next static assets, health monitoring, error reporting, cache headers,
  rate limits, and upload body limits in the deployment environment.

#### Recommended cutover and rollback

1. Deploy the current `apps/web-next` artifact to an isolated production-like preview origin.
2. Complete the route checklist using reporter, pet-owner, ADMIN-as-normal-user, and anonymous accounts;
   run explicitly authorized smoke/E2E, accessibility, responsive, upload, provider, and privacy checks.
3. Resolve every blocking gap, freeze or dual-implement user-Web changes, then obtain explicit product,
   security, and operations approval.
4. Configure production origin/cookies/CORS/CSP and direct a small monitored traffic slice to Next.
5. Increase traffic only while auth refresh, errors, latency, map tiles/providers, uploads, and privacy
   telemetry remain healthy. Keep the Angular artifact and its routing configuration immediately ready.
6. On regression, route all user-Web traffic back to Angular without database rollback; both clients
   use the unchanged API contracts. Preserve logs needed for diagnosis without sensitive payloads.
7. Remove or rename `apps/web` only in a later, separately approved task after the observation window.

Remaining gaps before cutover approval: browser/real-device verification was not authorized as E2E in
this phase; Google Places search is optional and not implemented; lost-pet binary upload needs a future
backend endpoint; profile/settings remain read-only where APIs are absent; a production Next build and
deployment target plus monitoring must be established. The four-phase implementation is complete, but
the exit criteria remain gated on authorized browser coverage and explicit cutover approval.

## 12. Post-Phase-4 cutover readiness audit

Audit date: 2026-07-13. Recommendation: **ready with caveats; do not cut over yet**.

### Validation results

- `corepack pnpm nx typecheck web-next`: passed.
- `corepack pnpm nx typecheck api`: passed.
- `corepack pnpm nx typecheck admin`: passed.
- The inferred Next build exposed a non-standard inherited `NODE_ENV` and failed while prerendering.
  The identical build passed with `NODE_ENV=production`; `apps/web-next/project.json` now has an
  explicit production build target so the normal Nx command is deterministic.
- Unit tests, Playwright E2E, mobile E2E, and full CI were intentionally not run in this audit.

### Route and feature smoke results

- The production Next server returned HTTP 200 without server-error output for `/`,
  `/community-guidelines`, `/login`, `/register`, `/lost-pets`, `/map`, `/report-animal`,
  `/lost-pets/new`, `/my/reports`, `/my/lost-pets`, `/matches`, `/notifications`, `/profile`, and
  `/settings`.
- Real API-backed lost-pet detail, owner edit, and match detail paths also returned HTTP 200.
- Protected route shells are expected to restore a session or redirect when no browser cookie exists.
- Source review confirmed required-field validation, private location confirmation, map provider
  fallback, near-me denial feedback, sighting photo limits, create-then-upload retry state, truthful
  lost-pet URL-only photos, and read-only profile/settings behavior.

### Auth, role, CORS, and privacy results

- A committed development account completed login, `/auth/me`, refresh rotation, logout, and a final
  refresh rejection with HTTP 401. No credential or token value was logged.
- An ADMIN account used the same user-facing header and routes. No Admin CMS, rescue board, volunteer
  dashboard, or moderation mutation/navigation is present in the Next user app.
- The pre-existing API process on port 3000 was built before the migration commit and still returned
  its configured origin `http://localhost:4301`. A task-owned current API on port 3001 proved the
  committed development CORS behavior: origin 4300 was allowed with credentials, while an unapproved
  origin received no allow-origin header. Rebuild/restart the normal API before browser verification.
- Live public lost-pet and map responses contained public location/radius data and no exact-location,
  contact, reporter, owner, or microchip fields. Public Next response types/renderers omit these fields;
  exact coordinates remain limited to authenticated create/edit state and payloads.
- Access tokens remain in React memory and refresh tokens remain API-managed HttpOnly cookies.

### Before-cutover checklist

- [x] Strict typechecks pass for Next Web, API, and Admin.
- [x] Production Next build succeeds through the explicit Nx target.
- [x] Required static, protected-shell, and real dynamic routes return successfully.
- [x] Direct development auth lifecycle and committed CORS behavior pass.
- [x] Source/live-response privacy and user-role boundaries pass.
- [ ] Rebuild and restart the normal API process so port 3000 runs the committed CORS code.
- [ ] Attach an interactive browser and verify session restoration, validation focus, dropdown
  escape/outside behavior, responsive layouts, Leaflet tiles/markers, near-me denial, optional Google
  2D fallback, and sighting upload failure/retry with a disposable record.
- [ ] Run the separately authorized smoke/E2E and production-like cookie/CORS/CSP checks.
- [ ] Configure deployment artifact, monitoring, deep-link routing, and approved production origin.
- [ ] Obtain explicit product, security, and operations cutover approval.

Known non-blocking follow-ups remain unchanged: Google Places search, lost-pet binary upload, and
profile/settings persistence require backend/product work and are not represented as working features.

Rollback reminder: keep `apps/web`, its artifact, and its routing configuration available. If any auth,
privacy, map, upload, or stability gate fails during a later traffic rollout, route user-Web traffic back
to Angular without changing the shared API or database. Removing Angular requires separate approval.
