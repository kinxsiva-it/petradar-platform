# Privacy Model

Location privacy is a critical product invariant.

Phase 0 establishes the configuration and documentation baseline:

- `LOCATION_PRIVACY_RADIUS_METERS` controls public obfuscation radius.
- Public clients must receive only stable approximate coordinates.
- Exact coordinates must not appear in public DTOs, logs, analytics responses, URLs, or unauthorized frontend state.
- Exact-location access must be tied to admin authorization or verified volunteer rescue-case authorization.
- Sensitive-location access must create audit records.

The concrete PostGIS sighting/lost-pet location models and privacy service are implemented in Phase 1 and Phase 2.
