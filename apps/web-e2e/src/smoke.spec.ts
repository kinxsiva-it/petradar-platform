import { expect, test } from '@playwright/test';

test('loads the Phase 0 shell', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /find, report, and help animals/i }),
  ).toBeVisible();
  await expect(page.getByText('Exact location is protected for animal safety.')).toBeVisible();
});
