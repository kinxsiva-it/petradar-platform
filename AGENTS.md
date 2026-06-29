# PetRadar Engineering Instructions

PetRadar is an existing Angular and NestJS application for community animal sightings, lost-pet matching, rescue coordination, and geospatial analytics.

Read `docs/PETRADAR_SPEC.md` before making architectural or database decisions.

## Current state

* The application is already initialized and running.
* The major frontend pages and routes are already implemented.
* The existing UI, routes, components, styling, and project structure must be preserved.
* PostgreSQL is hosted on Neon.
* PostGIS 3.6 has been enabled and verified.
* `DATABASE_URL` is configured in the backend environment.
* Never print, expose, or commit credentials.

## Working rules

1. Inspect the existing implementation before editing.
2. Treat the repository as the source of truth.
3. Reuse the existing ORM, package manager, modules, services, DTOs, and conventions.
4. Do not install a second ORM.
5. Do not rebuild or redesign working frontend pages.
6. Replace mock data incrementally only after the corresponding API works.
7. Use migrations as the source of truth for database changes.
8. Never modify a production database unless the task explicitly authorizes it.
9. Preserve existing compatible data and schema.
10. Explain migrations, environment changes, assumptions, and risks before implementation.
11. Keep controllers thin and place business logic in services.
12. Use strict TypeScript types and validated DTOs.
13. Enforce authorization, ownership, and location privacy on the backend.
14. Never expose exact coordinates to unauthorized users.
15. Use PostGIS for radius searches, distance calculation, and heatmap queries.
16. Use transactions for multi-record business operations.
17. Add focused tests for security, matching, status transitions, and privacy rules.
18. Do not claim commands passed unless they were actually executed.

## Spatial rules

* Use SRID 4326.
* Coordinate order is longitude first, latitude second.
* Prefer PostGIS `geography(Point, 4326)` where distances are measured in meters.
* Use parameterized spatial queries.
* Use `ST_DWithin` for radius searches.
* Add appropriate GiST indexes.
* Store exact and public approximate locations separately.
* Public APIs must return only privacy-safe coordinates.

## Task workflow

Before editing, report:

* Current state
* Existing relevant files
* Proposed changes
* Architecture decisions
* Database and environment changes
* Risks and assumptions

After editing, report:

* Implemented files and behavior
* Migrations created or executed
* Commands and tests actually run
* Failures or limitations
* Remaining work

Keep each implementation task focused and incremental.
