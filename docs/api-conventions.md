# API Conventions

- API prefix: `/api/v1`.
- Swagger UI: `/api/docs`.
- Request payloads are validated globally with `class-validator`.
- Unknown payload properties are rejected.
- Errors use a consistent JSON shape with `statusCode`, `message`, `error`, `path`, `requestId`, and `timestamp`.
- Every response receives an `x-request-id` header.
- Structured request logs include method, path, status code, duration, and request ID.

Phase 0 endpoint:

- `GET /api/v1/health`
