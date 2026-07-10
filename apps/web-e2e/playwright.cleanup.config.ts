import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: 'e2e-cleanup.spec.ts',
  workers: 1,
  projects: [{ name: 'cleanup-safety' }],
});
