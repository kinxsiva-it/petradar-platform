import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev:web',
    reuseExistingServer: true,
    url: 'http://localhost:4200',
  },
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
