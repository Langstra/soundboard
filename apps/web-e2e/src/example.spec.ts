import { expect, test } from '@playwright/test';

test('shows the title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Soundboard');
});
