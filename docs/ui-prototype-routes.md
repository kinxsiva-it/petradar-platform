# UI Prototype Routes

This frontend prototype uses typed mock data only. No backend, database, Prisma, Docker, storage, real authorization, or production security is connected.

Primary design system reference for every route: `docs/design/petradar-design-system.png`.

## Public Routes

| Route | Feature owner | Mock role | Valid mock IDs | Reference image | Supported interactions | UI states |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | `@petradar/frontend/landing` | Public | n/a | `petradar-public-map-and-auth-pages.png` | CTA navigation, stats, privacy banner | default |
| `/login` | `@petradar/frontend/auth` | Public | n/a | `petradar-public-map-and-auth-pages.png` | Show password, remember me, mock submit | default |
| `/register` | `@petradar/frontend/auth` | Public | n/a | `petradar-public-map-and-auth-pages.png` | Role card selection, agreement, mock submit | default |
| `/map` | `@petradar/frontend/map` | Public | `cat-00021`, `dog-00014`, `cat-00018` | `petradar-public-map-and-auth-pages.png` | Search/filter, select marker/card, open detail drawer | `?uiState=loading`, `empty`, `error`, `map-unavailable` |
| `/sightings/:id` | `@petradar/frontend/sightings` | Public | `cat-00021`, `dog-00014`, `cat-00018` | `petradar-matching-and-case-detail.png` | View case detail, related sightings, privacy panel | `?uiState=loading`, `error`, `not-found` |
| `/lost-pets` | `@petradar/frontend/lost-pets` | Public | n/a | `petradar-lost-pet-pages.png` | Search/filter lost pets, open detail | `?uiState=loading`, `empty`, `error` |
| `/lost-pets/:id` | `@petradar/frontend/lost-pets` | Public | `lp-00021`, `lp-00018`, `lp-00014` | `petradar-lost-pet-pages.png` | View details, contact presentation, possible matches | `?uiState=loading`, `error`, `not-found` |
| `/community-guidelines` | `@petradar/frontend/account` | Public | n/a | `petradar-profile-notifications-and-states.png` | Read safety/privacy guidance, emergency banner | default |

## Authenticated User Routes

| Route | Feature owner | Mock role | Valid mock IDs | Reference image | Supported interactions | UI states |
| --- | --- | --- | --- | --- | --- | --- |
| `/report-animal` | `@petradar/frontend/report-animal` | Community reporter | n/a | `petradar-report-animal-flow.png` | Six-step wizard, photo preview, location/privacy, mock submit | validation and success states |
| `/my/reports` | `@petradar/frontend/sightings` | Community reporter | n/a | `petradar-profile-notifications-and-states.png` | Search reports, edit drawer, status cards | `?uiState=loading`, `error` |
| `/lost-pets/new` | `@petradar/frontend/lost-pets` | Pet owner | n/a | `petradar-lost-pet-pages.png` | Three-step lost-pet form, photo preview, mock submit | validation and success states |
| `/my/lost-pets` | `@petradar/frontend/lost-pets` | Pet owner | n/a | `petradar-lost-pet-pages.png` | Search/filter owned posts, mark reunited presentation | `?uiState=loading`, `error` |
| `/my/lost-pets/:id/matches` | `@petradar/frontend/lost-pets` | Pet owner | `lp-00021` | `petradar-lost-pet-pages.png` | Review possible matches, contact/review actions | `?uiState=loading`, `error` |
| `/matches/:id` | `@petradar/frontend/matching` | Pet owner or volunteer | `match-00021` | `petradar-matching-and-case-detail.png` | Confirm/reject/request more info | default |
| `/notifications` | `@petradar/frontend/notifications` | Signed-in user | n/a | `petradar-profile-notifications-and-states.png` | Filter tabs, mark all read | `?uiState=loading`, `error` |
| `/profile` | `@petradar/frontend/account` | Signed-in user | `user-nicha` | `petradar-profile-notifications-and-states.png` | Preference toggles, activity tabs | default |
| `/settings` | `@petradar/frontend/account` | Signed-in user | `user-nicha` | `petradar-profile-notifications-and-states.png` | Notification/privacy toggles | default |

## Volunteer Routes

| Route | Feature owner | Mock role | Valid mock IDs | Reference image | Supported interactions | UI states |
| --- | --- | --- | --- | --- | --- | --- |
| `/volunteer` | `@petradar/frontend/volunteer` | Verified volunteer | n/a | `petradar-rescue-and-volunteer-pages.png` | Availability update, accept nearby case, open board | `?uiState=loading`, `empty`, `error`, `denied` |
| `/volunteer/rescue-cases` | `@petradar/frontend/rescue-cases` | Verified volunteer | n/a | `petradar-rescue-and-volunteer-pages.png` | Search/filter board, accept unassigned case | `?uiState=loading`, `empty`, `error` |
| `/volunteer/rescue-cases/:id` | `@petradar/frontend/rescue-cases` | Verified volunteer | `rc-2026-001`, `rc-2026-014`, `rc-2026-009` | `petradar-rescue-and-volunteer-pages.png` | Accept/release, update status, notes, photo update | `?uiState=loading`, `error` |
| `/volunteer/profile` | `@petradar/frontend/volunteer` | Verified volunteer | `vol-nicha` | `petradar-profile-notifications-and-states.png` | Edit presentation, availability card | default |

## Admin Routes

Required mock role: Admin preview. This is frontend-only role simulation and is not a security boundary.

| Route | Feature owner | Valid mock IDs | Reference image | Supported interactions | UI states |
| --- | --- | --- | --- | --- | --- |
| `/admin` | `@petradar/frontend/admin` | n/a | `petradar-admin-verification-pages.png` | Redirects to verification queue | n/a |
| `/admin/verification` | `@petradar/frontend/admin` | n/a | `petradar-admin-verification-pages.png` | Search/filter, open panel, approve, reject | `?uiState=loading`, `empty`, `error`, `denied` |
| `/admin/verification/:id` | `@petradar/frontend/admin` | `cat-00021`, `dog-00014`, `cat-00018` | `petradar-admin-verification-pages.png` | Approve, reject, duplicate, convert to rescue | `?uiState=loading`, `error` |
| `/admin/duplicates/:id` | `@petradar/frontend/admin` | `dup-cat-00021` | `petradar-admin-verification-pages.png` | Merge, keep separate, mark uncertain | `?uiState=loading`, `error` |
| `/admin/rescue-cases` | `@petradar/frontend/admin` | n/a | `petradar-rescue-and-volunteer-pages.png` | Board filters, select case, assign volunteer | `?uiState=loading`, `empty`, `error` |
| `/admin/rescue-cases/:id` | `@petradar/frontend/admin` | `rc-2026-001`, `rc-2026-014`, `rc-2026-009` | `petradar-rescue-and-volunteer-pages.png` | Assign volunteer, update status, add internal note | `?uiState=loading`, `error` |
| `/admin/privacy` | `@petradar/frontend/admin` | n/a | `petradar-admin-verification-pages.png` | Radius, exact-access, role toggles, save/reset | `?uiState=loading`, `error` |
| `/admin/analytics` | `@petradar/frontend/analytics` | n/a | `petradar-heatmap-and-analytics-pages.png` | Filter presentation, SVG/CSS charts | `?uiState=loading`, `empty`, `error` |
| `/admin/heatmap` | `@petradar/frontend/analytics` | `hotspot-ari`, `hotspot-latphrao`, `hotspot-ratchada` | `petradar-heatmap-and-analytics-pages.png` | Leaflet aggregated hotspots, insight drawer | `?uiState=loading`, `empty`, `error`, `map-unavailable` |
| `/admin/reports` | `@petradar/frontend/analytics` | n/a | `petradar-heatmap-and-analytics-pages.png` | Period selector, mock export/print | `?uiState=loading`, `empty`, `error` |
| `/admin/users` | `@petradar/frontend/admin` | n/a | `petradar-profile-notifications-and-states.png` | Search/filter users, open detail | `?uiState=loading`, `empty`, `error` |
| `/admin/users/:id` | `@petradar/frontend/admin` | `user-nicha`, `user-somchai`, `user-mai` | `petradar-profile-notifications-and-states.png` | Edit role, verify volunteer, suspend/reactivate | `?uiState=loading`, `error` |

`/showcase` is not an active product route. UI states are represented on real routes with query parameters where useful.
