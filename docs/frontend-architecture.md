# Frontend Architecture

PetRadar's UI prototype is organized as feature-first Angular standalone libraries. The prototype is frontend-only: no backend, database, Prisma, Docker, storage, real authorization, or production security is connected.

## Route Ownership

- `@petradar/frontend/landing`: public landing route `/`
- `@petradar/frontend/auth`: `/login`, `/register`
- `@petradar/frontend/map`: public community map `/map`
- `@petradar/frontend/sightings`: `/sightings/:id`, `/my/reports`
- `@petradar/frontend/lost-pets`: `/lost-pets`, `/lost-pets/:id`, `/lost-pets/new`, `/my/lost-pets`, `/my/lost-pets/:id/matches`
- `@petradar/frontend/matching`: `/matches/:id`
- `@petradar/frontend/account`: `/profile`, `/settings`, `/community-guidelines`
- `@petradar/frontend/notifications`: `/notifications`
- `@petradar/frontend/volunteer`: volunteer layout, `/volunteer`, `/volunteer/profile`, nested rescue routes
- `@petradar/frontend/rescue-cases`: reusable volunteer rescue board/detail pages and components
- `@petradar/frontend/admin`: Admin shell, verification, duplicate review, rescue management, privacy, and users
- `@petradar/frontend/analytics`: `/admin/analytics`, `/admin/heatmap`, `/admin/reports`

`apps/web/src/app/app.routes.ts` stays small and lazy-loads feature route arrays. The root `AppComponent` contains only the root router outlet.

## Layout Ownership

- Public pages use `PublicLayoutComponent`.
- Authenticated user pages use `AuthenticatedLayoutComponent`.
- Volunteer pages use `VolunteerLayoutComponent`.
- Admin pages use `AdminLayoutComponent` with nested router outlet, desktop sidebar, responsive header, compact navigation drawer, and mock toast area.

## Shared Component Ownership

- `@petradar/frontend/shared-ui` owns primitive UI: buttons, alerts, cards, empty states, loading skeletons, status badges, form controls, page headers, and privacy banners.
- `@petradar/frontend/rescue-cases` owns reusable rescue cards, status/severity badges, timeline, internal note list, status stepper, and photo update components.
- Feature libraries own feature-specific cards, drawers, forms, tables, comparison panels, charts, and maps.

## Mock Data Ownership

- `@petradar/frontend/mock-data` owns typed fixtures and Angular Signal data sources.
- `PublicDiscoveryDataSource` owns public sightings, map cards, landing stats, and public-safe approximate locations.
- `UserWorkspaceDataSource` owns user reports, lost-pet posts, possible matches, notifications, profile, and settings fixtures.
- `RescueWorkflowDataSource` owns rescue cases, volunteer workflow state, transitions, notes, photos, and assignments.
- `AdminWorkspaceDataSource` owns verification reports, duplicate suggestions, volunteer candidates, privacy settings, analytics fixtures, heatmap aggregates, executive report fixtures, users, roles, and mock Admin activity.

## Styling Strategy

- Global styles in `apps/web/src/styles.css` are limited to Tailwind import, Leaflet import, semantic design tokens, base reset, typography defaults, shared map marker styles, and motion preferences.
- Semantic PetRadar tokens are mirrored in `:root` so component CSS can use stable browser-readable variables even when Tailwind `@theme` is emitted for utility generation.
- Page and component styles stay beside their feature-owned Angular files.
- Shared primitives use component CSS rather than dynamic Tailwind class strings for core visual behavior.

## Backend Integration Points

Future integration should replace frontend mock state with server-backed services for:

- Authentication and session state
- Server-side authorization and role enforcement
- Exact-location access control
- Verification approval/rejection persistence
- Duplicate merging
- Rescue volunteer assignment and workflow transactions
- Privacy setting enforcement
- Admin audit logging
- Analytics and heatmap aggregation
- Export generation
- User role and account status management

## Monolithic Prototype Status

The former monolithic UI file has been removed. Migrated Admin, Volunteer, public, authenticated, rescue, matching, and analytics routes are owned by feature libraries. App-level legacy mock data from the monolithic prototype was removed after confirming active routes use `@petradar/frontend/mock-data`.

`/showcase` has been removed from root routing. UI states now live on real product routes with query parameters where useful.
