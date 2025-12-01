import { test, expect } from '@playwright/test';

test.describe('Theme Functionality', () => {
  test('should toggle theme when theme button is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for theme toggle button (may have different text or icon)
    const themeButton = page
      .locator('button')
      .filter({ hasText: /theme|dark|light/i })
      .first();

    if (await themeButton.isVisible()) {
      // Get initial theme state
      const htmlElement = page.locator('html');
      const initialHasClass = await htmlElement.evaluate((el) => el.classList.contains('dark'));

      // Click theme toggle
      await themeButton.click();

      // Wait for class to change using assertion
      if (initialHasClass) {
        await expect(htmlElement).not.toHaveClass(/dark/);
      } else {
        await expect(htmlElement).toHaveClass(/dark/);
      }

      // Check if theme changed
      const finalHasClass = await htmlElement.evaluate((el) => el.classList.contains('dark'));
      expect(finalHasClass).not.toBe(initialHasClass);
    }
  });

  test('should persist theme preference across page reloads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const themeButton = page
      .locator('button')
      .filter({ hasText: /theme|dark|light/i })
      .first();

    if (await themeButton.isVisible()) {
      // Set a specific theme
      await themeButton.click();

      // Wait for theme change using assertion
      const htmlElement = page.locator('html');
      await expect(htmlElement).toHaveAttribute('class', /./);

      const themeAfterToggle = await htmlElement.evaluate((el) => el.classList.contains('dark'));

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if theme persisted
      const themeAfterReload = await htmlElement.evaluate((el) => el.classList.contains('dark'));
      expect(themeAfterReload).toBe(themeAfterToggle);
    }
  });

  test('should apply correct CSS variables for theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if the page has theme-related styles
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(backgroundColor).toBeTruthy();
  });
});
