import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should render the Angular app shell', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('app-root')).toBeVisible();
    await expect(page.locator('router-outlet')).toHaveCount(1);
  });

  test('should handle hash-based routing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try navigating to a hash route
    await page.goto('/#/wizard');
    // Wait for Angular routing to complete by checking app-root is stable
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url).toContain('#');
  });

  test('should have navigation links that are clickable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find all navigation links
    const navLinks = page.locator('a[routerLink], a[href*="#"]');
    const count = await navLinks.count();

    expect(count).toBeGreaterThan(0);

    const firstLink = navLinks.first();
    await expect(firstLink).toBeVisible();
    await firstLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('should maintain app state during navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const links = page.locator('a[href*="#"]');
    const linkCount = await links.count();

    for (let i = 0; i < Math.min(linkCount, 3); i++) {
      await links.nth(i).click();
      // Wait for navigation transition to complete
      await page.waitForLoadState('domcontentloaded');

      // Verify app is still functional
      const appRoot = page.locator('app-root');
      await expect(appRoot).toBeVisible();
    }
  });

  test('should handle mobile menu if present', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The menu toggle is intentionally mobile-only; locate it by its accessible
    // name after forcing a mobile viewport so desktop CI widths do not affect it.
    const menuButton = page.getByRole('button', { name: 'Open main menu' });

    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});
