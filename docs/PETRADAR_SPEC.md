Task: Inspect the existing PetRadar database architecture and prepare a safe migration plan.

## Confirmed environment

* The major frontend UI pages and routes are already implemented.
* A development PostgreSQL database has been created on Neon.
* PostGIS has been enabled and verified successfully.
* `SELECT PostGIS_Version();` returned PostGIS 3.6.
* `DATABASE_URL` is already available in the backend environment.
* Do not print, copy, expose, or commit the database connection string or any credentials.

Read `AGENTS.md` and `docs/PETRADAR_SPEC.md` before beginning.

## This task is inspection and planning only

Do not:

* Modify application files
* Install or remove packages
* Generate migrations
* Run migrations
* Run seed scripts
* Create, alter, truncate, or delete database objects
* Insert, update, or delete database records
* Change the frontend UI
* Change environment files
* Commit changes

You may inspect repository files and run safe read-only commands.

You may inspect database metadata using read-only queries if the configured connection is clearly a development database. If the active Neon branch or database appears to be production, stop and report the risk before connecting or executing database queries.

## Inspection requirements

1. Identify the repository structure and package manager.
2. Identify the frontend and backend applications.
3. Determine whether the backend uses Prisma, TypeORM, Drizzle, raw SQL, or another database library.
4. Inspect:

   * package files and lockfiles
   * ORM configuration
   * entities or schema models
   * migrations
   * seed scripts
   * database modules and providers
   * DTOs
   * enums
   * environment validation
   * authentication modules
   * existing API modules
5. Determine whether the backend can currently connect to Neon.
6. Identify all existing tables, enums, indexes, constraints, and PostGIS columns.
7. Compare the existing implementation with the PetRadar specification.
8. Identify mock-only frontend flows and any existing API integrations.
9. Do not install a second ORM if an ORM already exists.

## Proposed database plan

Prepare a staged implementation plan instead of implementing every domain at once.

### Batch A — Foundation

* users
* authentication-related fields
* animal sightings
* sighting photos
* exact and public location handling
* audit logs

### Batch B — Lost pets and matching

* lost pets
* lost-pet photos
* match results
* match scoring metadata

### Batch C — Rescue workflow

* rescue cases
* case status history
* internal notes
* notifications
* volunteer assignments if a separate table is justified

For each batch, propose:

* Tables and columns
* Enums
* Primary and foreign keys
* Unique constraints
* Delete behavior
* Regular indexes
* GiST spatial indexes
* Ownership and RBAC implications
* Exact versus public location fields
* Migration ordering
* Seed-data strategy
* Tests required

## Required output

Return the following sections:

### Current Repository State

Include relevant file paths.

### Current ORM and Database State

State the detected ORM and existing schema or migration status.

### Existing Database Objects

List existing tables, enums, extensions, indexes, and spatial fields.

### Gaps Against the PetRadar Specification

Separate missing, partial, and conflicting implementations.

### Recommended Schema

Describe the proposed entities and relationships without implementing them.

### Staged Migration Plan

Describe Batch A, Batch B, and Batch C in execution order.

### PostGIS and Location Privacy Design

Explain exact location storage, public-location generation, spatial indexes, nearby queries, and API exposure rules.

### Environment Changes

List required variables without showing secret values.

### Risks and Assumptions

Include database-branch safety, ORM limitations, data-loss risks, and compatibility concerns.

### Recommended First Implementation Task

Provide the exact limited scope for Batch A.

Stop after producing the report and wait for explicit approval. Do not implement any changes in this task.
