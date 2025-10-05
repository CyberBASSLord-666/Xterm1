import { test, expect } from '@playwright/test';

const PAGE_TITLE_REGEX = /PolliWall/i;

test('basic test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(PAGE_TITLE_REGEX);
});
