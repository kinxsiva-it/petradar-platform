# PetRadar

PetRadar is a community-powered animal sighting, lost-pet matching, and rescue case management platform.

This repository currently contains Phase 0 foundation only:

- Nx monorepo structure.
- Angular standalone web shell with semantic design tokens and foundational shared UI components.
- NestJS API shell with Swagger, validation, exception handling, request IDs, structured logs, and health check.
- PostgreSQL/PostGIS Docker Compose setup.
- Prisma schema and initial migration for `User` and rotating `RefreshToken`.
- Seed foundation with a development admin account.
- CI workflow for lint, typecheck, tests, build, migration, and seed.

## Requirements

- Node.js 24 LTS
- pnpm 10+
- Docker Desktop or a compatible Docker runtime

Enable pnpm through Corepack if needed:

```bash
corepack enable
corepack prepare pnpm@10.12.4 --activate
```

## Setup

```bash
pnpm install
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d
pnpm prisma:generate
pnpm db:migrate
pnpm db:seed
```

Development-only seed account:

- Email: `admin@petradar.local`
- Password: `ChangeMe-PetRadar-Dev-Only-2026`

## Run

```bash
pnpm dev
```

Web app: `http://localhost:4200`

API health: `http://localhost:3000/api/v1/health`

Swagger: `http://localhost:3000/api/docs`

## Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate
pnpm db:seed
```

## Phase Boundaries

Do not start Phase 1 feature work from this baseline without adding backend authorization, privacy service tests, and sighting-specific domain/application layers first.
