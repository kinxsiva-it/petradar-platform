import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@petradar/frontend/account': fileURLToPath(
        new URL('../../libs/frontend/account/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/admin': fileURLToPath(
        new URL('../../libs/frontend/admin/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/analytics': fileURLToPath(
        new URL('../../libs/frontend/analytics/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/auth': fileURLToPath(
        new URL('../../libs/frontend/auth/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/core': fileURLToPath(
        new URL('../../libs/frontend/core/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/landing': fileURLToPath(
        new URL('../../libs/frontend/landing/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/lost-pets': fileURLToPath(
        new URL('../../libs/frontend/lost-pets/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/map': fileURLToPath(
        new URL('../../libs/frontend/map/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/matching': fileURLToPath(
        new URL('../../libs/frontend/matching/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/mock-data': fileURLToPath(
        new URL('../../libs/frontend/mock-data/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/notifications': fileURLToPath(
        new URL('../../libs/frontend/notifications/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/report-animal': fileURLToPath(
        new URL('../../libs/frontend/report-animal/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/rescue-cases': fileURLToPath(
        new URL('../../libs/frontend/rescue-cases/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/shared-ui': fileURLToPath(
        new URL('../../libs/frontend/shared-ui/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/sightings': fileURLToPath(
        new URL('../../libs/frontend/sightings/src/index.ts', import.meta.url),
      ),
      '@petradar/frontend/volunteer': fileURLToPath(
        new URL('../../libs/frontend/volunteer/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['apps/web/src/**/*.spec.ts', 'libs/frontend/**/*.spec.ts'],
    setupFiles: ['apps/web/src/test-setup.ts'],
  },
});
