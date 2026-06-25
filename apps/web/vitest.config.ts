import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['apps/web/src/**/*.spec.ts', 'libs/frontend/**/*.spec.ts'],
  },
});
