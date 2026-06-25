# PetRadar Development Rules

## Design references

Before implementing or modifying frontend UI, inspect the relevant images in:

docs/design/

The primary design-system reference is:

docs/design/petradar-design-system.png

Do not use screenshots as page backgrounds or copy UI sections as raster images.

Build all interfaces using reusable Angular components and semantic design tokens.

## Requirement priority

1. Security, privacy, authorization, and functional requirements
2. PetRadar development specification
3. Global design system reference
4. Page-specific visual references
5. Existing reusable project patterns

## Frontend rules

- Use Angular standalone components.
- Use feature-first architecture.
- Keep API calls out of UI components.
- Reuse shared components.
- Use semantic design tokens.
- Support loading, empty, error, and permission states.
- Implement mobile layouts intentionally.
- Do not expose exact animal locations to unauthorized users.
- Do not hard-code reference-board sample data.

## Backend rules

- Controllers must remain thin.
- Do not access Prisma directly from controllers.
- Keep domain logic framework-independent.
- Enforce permissions on the server.
- Record sensitive operations in audit logs.
- Use transactions for workflow status changes.

## Workflow

Before modifying code:

1. Inspect the repository.
2. Inspect relevant specifications and design references.
3. State the implementation plan.
4. List files to change.
5. Implement a coherent milestone.
6. Run lint, typecheck, tests, and build.
7. Report actual results honestly.