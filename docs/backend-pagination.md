# Backend pagination

PetRadar uses pagination only after authorization and domain filters have been applied. Public
location mappers remain responsible for returning approximate locations instead of exact owner or
reporter coordinates.

## Contracts

- Numbered tables use offset pagination. The canonical query parameters are `page` (default `1`)
  and `limit` (default `20`, maximum `100`). Existing endpoints may continue to accept `pageSize`
  as a backward-compatible alias while their clients migrate.
- The canonical offset metadata is
  `{ page, limit, total, totalPages, hasNextPage, hasPreviousPage }`. Existing flat
  `page/pageSize/total/totalPages` fields are retained where current clients depend on them.
- Append-heavy feeds use an opaque cursor and stable `(createdAt, id)` keyset ordering. Their
  metadata is `{ limit, nextCursor, hasNextPage }`. A malformed cursor returns HTTP 400.
- Map endpoints use viewport bounds or center/radius plus a validated hard limit. They never use
  pagination as a substitute for a spatial constraint and only select public approximate points.
- Domain sort orders are explicit. User-provided database column names are never interpolated.

## Endpoint audit

| Endpoint | Current behavior | Expected growth | Current consumers | Strategy | Change required |
| --- | --- | --- | --- | --- | --- |
| `GET /api/v1/lost-pets` | Flat offset envelope, stable created/id order, default 25/max 50 | High | Next Web, Angular Web | OFFSET PAGINATION | No |
| `GET /api/v1/lost-pets/mine` | Owner-filtered flat offset envelope, default 25/max 50 | High | Next Web, Angular Web | OFFSET PAGINATION | No |
| `GET /api/v1/sightings` | Public-safe flat offset envelope, stable created/id order | High | Next Web, Angular Web | OFFSET PAGINATION | No |
| `GET /api/v1/sightings/mine` | Reporter-filtered flat offset envelope | High | Next Web, Angular Web | OFFSET PAGINATION | No |
| `GET /api/v1/matches` | Role/owner-filtered offset envelope; canonical metadata plus legacy flat fields | High | Next Web, Angular Web, Admin match review | OFFSET PAGINATION | Updated |
| `GET /api/v1/lost-pets/:id/matches` | Ownership checked first; offset count and metadata; stable score/matched/id order | High | Next Web, Angular Web | OFFSET PAGINATION | Added |
| `GET /api/v1/notifications` | User-filtered opaque cursor, stable created/id order, default 20/max 100 | High | Next Web, Angular Web | CURSOR PAGINATION | Added |
| `GET /api/v1/notifications/unread-count` | Scalar aggregate scoped to current user | Low | Next Web, Angular Web | NO PAGINATION REQUIRED | No |
| `GET /api/v1/rescue-cases` | Admin or assigned-volunteer offset envelope, default 25/max 50 | High | Angular Admin/Volunteer | OFFSET PAGINATION | No |
| `GET /api/v1/rescue-cases/:id/timeline` | Case authorization then opaque cursor, ascending created/id order | Medium | Future Admin/Volunteer; current detail embeds full history | CURSOR PAGINATION | Added |
| `GET /api/v1/rescue-cases/:id/notes` | Case authorization then opaque cursor, ascending created/id order | Medium | Future Admin/Volunteer; current detail embeds full notes | CURSOR PAGINATION | Added |
| `GET /api/v1/admin/users` | Admin-only offset envelope with role/status filters | High | Angular Admin | OFFSET PAGINATION | No |
| `GET /api/v1/admin/users?role=VOLUNTEER` | Same authorized user query with volunteer role filter | Medium | Angular Admin volunteer table | OFFSET PAGINATION | No |
| `GET /api/v1/admin/sightings` | Admin-only moderation queue offset envelope | High | Angular Admin | OFFSET PAGINATION | No |
| `GET /api/v1/admin/reports/pending` | Alias of filtered Admin moderation queue | High | Angular Admin | OFFSET PAGINATION | No |
| `GET /api/v1/admin/verification-queue` | Alias of filtered Admin moderation queue | High | Angular Admin | OFFSET PAGINATION | No |
| `GET /api/v1/admin/audit-logs` | Admin-only offset envelope, stable created/id order | Very high | Angular Admin | OFFSET PAGINATION | No |
| `GET /api/v1/admin/sightings/:id` nested photos/activity | Photos are domain-capped; moderation activity is capped at 25 | Low per report | Angular Admin | BOUNDED COLLECTION | No |
| `GET /api/v1/map/sightings` | Public-safe viewport filters, deterministic ordering, max 100; legacy page window retained | High | Next Web, Angular Web | BOUNDS/RADIUS QUERY | No |
| `GET /api/v1/map/nearby` | Public-safe center/radius query, distance/seen/id order, max 100 | High | Next Web, Angular Web | BOUNDS/RADIUS QUERY | Ordering updated |
| `GET /api/v1/map/heatmap` | Aggregated public cells, max 200 | High | Angular Admin analytics | BOUNDED COLLECTION | No |
| Backend clinic/provider collection | No NestJS endpoint; current provider lookup is client-side/configured externally | Unknown | Next Web map | INSUFFICIENT EVIDENCE | No backend change |
| `GET /api/v1/analytics/by-species` | Enum-sized aggregate | Low | Angular Admin | BOUNDED COLLECTION | No |
| `GET /api/v1/analytics/by-status` | Enum-sized aggregates | Low | Angular Admin | BOUNDED COLLECTION | No |
| `GET /api/v1/analytics/hotspots` | Privacy-safe aggregate capped at 100 | Medium | Angular Admin | BOUNDED COLLECTION | No |
| Profile activity collection | No backend collection endpoint exists | Unknown | None | INSUFFICIENT EVIDENCE | No |

Detail, authentication, health, configuration, scalar aggregate, and mutation endpoints do not need
pagination. Sighting photo collections are capped by the domain upload limit. Rescue detail keeps
its existing complete nested history for compatibility; future incremental UIs should call the
cursor endpoints directly.

## Index review

The existing schema already supplies the leading columns for the implemented queries:

- notifications: `(userId, createdAt)`, `(userId, readAt)`;
- matches: `lostPetId`, `reviewStatus`, `matchedAt`, and unique `(lostPetId, sightingId)`;
- rescue activity: `(rescueCaseId, createdAt)` for both timeline events and notes;
- owner/report lists: `ownerId`, `reporterId`, status, and timestamp indexes;
- map/radius searches: PostGIS GiST indexes are created by the existing spatial migrations.

The UUID tie-breaker only sorts rows sharing a timestamp within an already narrow index range. No
new index or migration is justified without query-plan evidence at production-like volume.
