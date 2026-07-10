import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  workers: 1,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm dev:api',
      reuseExistingServer: true,
      timeout: 180_000,
      url: 'http://localhost:3000/api/v1/health',
    },
    {
      command: 'pnpm dev:web',
      reuseExistingServer: true,
      timeout: 180_000,
      url: 'http://localhost:4200',
    },
    {
      command: 'pnpm nx serve admin',
      reuseExistingServer: true,
      timeout: 180_000,
      url: 'http://127.0.0.1:4201',
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
