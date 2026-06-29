# Route And Screen Matrix

PetRadar routes are implemented as feature-owned Angular standalone pages and lazy-loaded from `apps/web/src/app/app.routes.ts`.

| Route area | Routes | Feature owner | Screen group |
| --- | --- | --- | --- |
| Public discovery | `/`, `/map`, `/sightings/:id`, `/community-guidelines` | landing, map, sightings, account | Landing, public map, sighting detail, safety/privacy |
| Auth | `/login`, `/register` | auth | Login and registration |
| Lost pets | `/lost-pets`, `/lost-pets/:id`, `/lost-pets/new`, `/my/lost-pets`, `/my/lost-pets/:id/matches` | lost-pets | Lost-pet discovery, owner posts, possible matches |
| Reporting | `/report-animal`, `/my/reports` | report-animal, sightings | Report animal wizard and user reports |
| Matching | `/matches/:id` | matching | Lost-pet match review |
| Account | `/notifications`, `/profile`, `/settings` | notifications, account | Notification center, user profile, settings |
| Volunteer | `/volunteer`, `/volunteer/rescue-cases`, `/volunteer/rescue-cases/:id`, `/volunteer/profile` | volunteer, rescue-cases | Volunteer dashboard, rescue board, case update, profile |
| Admin | `/admin`, `/admin/verification`, `/admin/verification/:id`, `/admin/duplicates/:id`, `/admin/rescue-cases`, `/admin/rescue-cases/:id`, `/admin/privacy`, `/admin/users`, `/admin/users/:id` | admin | Verification, duplicates, rescue management, privacy, users |
| Admin analytics | `/admin/analytics`, `/admin/heatmap`, `/admin/reports` | analytics | Analytics dashboard, community heatmap, executive report |

The old Phase 0 `/showcase` and placeholder pages have been removed from active routing. UI states are represented on real routes with query parameters where useful.
