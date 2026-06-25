# PetRadar Architecture

PetRadar is a modular monolith in an Nx workspace. The backend follows Clean Architecture inside each business module:

- `domain`: framework-independent entities, value objects, policies, and errors.
- `application`: use cases, commands, queries, authorization orchestration, and ports.
- `infrastructure`: Prisma, storage, and external adapters that implement application ports.
- `presentation`: controllers, request DTOs, response DTOs, guards, and presenters.

Controllers must stay thin and must never inject Prisma directly. Cross-module coordination should go through explicit application services or ports.

The frontend uses feature-first Angular standalone components. Pages orchestrate components, data-access services own API calls, and shared UI components live in `libs/frontend/shared-ui`.

Phase 0 creates the foundation only: workspace, API shell, database baseline, shared UI tokens/components, and empty feature/module boundaries.
