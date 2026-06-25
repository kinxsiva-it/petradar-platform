# Authorization Matrix

Phase 0 defines roles and boundaries only. Enforcement is implemented as feature endpoints are added.

| Role | MVP capability direction |
| --- | --- |
| GUEST | View public map and approximate public details. |
| REPORTER | Create and manage own unverified sightings. |
| PET_OWNER | Create lost-pet posts and view possible matches without exact sighting coordinates. |
| VOLUNTEER | Manage assigned rescue cases and access exact locations only when authorized. |
| ADMIN | Verify reports, manage roles, review matches, and audit sensitive activity. |

Backend authorization is the source of truth. Frontend guards are only user experience affordances.
