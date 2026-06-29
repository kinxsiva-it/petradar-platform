# UI Mock Data

This prototype uses frontend-only Angular Signals. No backend, database, storage, real authorization, audit logging, or notification delivery is connected.

## Mock Stores And Data Sources

- `PublicDiscoveryDataSource`: landing stats, public map sightings, public-safe detail views, and approximate map coordinates.
- `UserWorkspaceDataSource`: current user profile, user reports, lost-pet posts, possible matches, notifications, settings, and local UI updates.
- `RescueWorkflowDataSource`: rescue cases, volunteer workflow state, assignments, status transitions, internal notes, and photo updates.
- `AdminWorkspaceDataSource`: Admin verification reports, duplicate suggestions, privacy settings, analytics, heatmap aggregates, executive report metrics, managed users, volunteer candidates, and Admin activity.

## Mock Roles

- Public visitor: landing, auth, map, sightings, lost-pet discovery, and guidelines.
- Community reporter: report-animal flow and my reports.
- Pet owner: lost-pet creation, my lost pets, possible matches, and match review.
- Verified volunteer: volunteer dashboard/profile and rescue case workflows.
- Admin preview: verification, duplicate review, rescue management, privacy, analytics, heatmap, reports, and users.

These roles are frontend-only presentation state and are not a security boundary.

## Important Mock IDs

- Sightings/Admin reports: `cat-00021`, `dog-00014`, `cat-00018`
- Lost pets: `lp-00021`, `lp-00018`, `lp-00014`
- Matches: `match-00021`
- Rescue cases: `rc-2026-001`, `rc-2026-014`, `rc-2026-009`
- Duplicate suggestion: `dup-cat-00021`
- Users: `user-nicha`, `user-somchai`, `user-mai`
- Volunteers: `vol-nicha`, `vol-tom`, `vol-mai`
- Heatmap hotspots: `hotspot-ari`, `hotspot-latphrao`, `hotspot-ratchada`

## State Synchronization

- Admin rescue assignment reuses `RescueWorkflowDataSource`, so volunteer assignment and timeline changes are visible to volunteer rescue pages too.
- Verification actions update only `AdminWorkspaceDataSource` signal state.
- User notification/profile/settings interactions update only `UserWorkspaceDataSource` signal state.
- Report/lost-pet wizard submissions are UI-only presentations and do not create server records.

## Location Privacy

- Public fixtures expose only approximate location labels and approximate map coordinates.
- Authorized volunteer/Admin views use separate mock presentation fields for sensitive locations.
- Exact-location sections are labeled sensitive and mock-only.

## Persistence And Reset

State lives in memory for the current browser session. Reloading the dev server or refreshing the page resets most mock state to fixtures unless a feature explicitly keeps local component state for the active page.

## Known Limitations

- Access control, exact-location privacy, audit logs, exports, role changes, duplicate merges, rescue assignments, uploads, analytics, and notifications are not persisted or server-enforced.
- File upload previews use local object URLs only.
- Heatmap uses aggregated fictional cells and Leaflet circle layers; it does not show individual report coordinates.
- Analytics and reports use fictional internally consistent fixture values, not production queries.
