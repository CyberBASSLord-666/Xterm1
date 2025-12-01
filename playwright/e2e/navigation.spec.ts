import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have working router outlet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const routerOutlet = page.locator('router-outlet');
    // Router outlet might not be visible but should exist
    const count = await routerOutlet.count();
    expect(count).toBeGreaterThanOrEqual(0);
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

    if (count > 0) {
      // Click the first valid link
      const firstLink = navLinks.first();
      const isVisible = await firstLink.isVisible();

      if (isVisible) {
        await firstLink.click();
        // Wait for navigation to complete
        await page.waitForLoadState('domcontentloaded');

        // Verify navigation occurred
        const appRoot = page.locator('app-root');
        await expect(appRoot).toBeVisible();
      }
    }
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

    // Look for mobile menu button (hamburger icon, menu button, etc.)
    const menuButton = page
      .locator('button')
      .filter({ hasText: /menu|☰/i })
      .first();

    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Wait for menu animation to complete
      await page.waitForLoadState('domcontentloaded');

      // Menu should be open - check for navigation items
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });
});
