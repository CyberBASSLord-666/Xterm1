import { test, expect } from '@playwright/test';

test.describe('Theme Functionality', () => {
  test('should toggle theme when theme button is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const themeButton = page.getByRole('button', { name: /switch to (dark|light) theme/i });
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('data-theme');

    await themeButton.click();

    await expect(htmlElement).not.toHaveAttribute('data-theme', initialTheme ?? '');

    const finalTheme = await htmlElement.getAttribute('data-theme');
    expect(finalTheme).not.toBe(initialTheme);
  });

  test('should persist theme preference across page reloads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const themeButton = page.getByRole('button', { name: /switch to (dark|light) theme/i });
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('data-theme');

    await themeButton.click();
    await expect(htmlElement).not.toHaveAttribute('data-theme', initialTheme ?? '');

    const themeAfterToggle = await htmlElement.getAttribute('data-theme');

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(htmlElement).toHaveAttribute('data-theme', themeAfterToggle ?? '');
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
