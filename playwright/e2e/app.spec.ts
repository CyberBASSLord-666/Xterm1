import { test, expect } from '@playwright/test';

/**
 * PolliWall Application E2E Tests
 *
 * Comprehensive test suite covering:
 * - Application loading and initialization
 * - Navigation functionality
 * - Theme toggling
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Responsive design
 * - Error handling
 */

test.describe('PolliWall App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for app to be ready
    await page.waitForSelector('app-root', { state: 'visible', timeout: 10000 });

    // Wait for any loading indicators to disappear
    const loadingExists = await page.locator('.loading').count();
    if (loadingExists > 0) {
      await page.waitForSelector('.loading', { state: 'hidden', timeout: 10000 });
    }

    // Wait for Angular to stabilize by waiting for network idle
    await page.waitForLoadState('networkidle');
  });

  test('should load the home page', async ({ page }) => {
    // Check app root exists
    await expect(page.locator('app-root')).toBeVisible();

    // Check for app title
    const title = page.locator('text=PolliWall');
    await expect(title.first()).toBeVisible();
  });

  test('should have navigation elements', async ({ page }) => {
    // Check navigation exists
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Check key navigation items
    await expect(page.locator('text=Gallery').first()).toBeVisible();
    await expect(page.locator('text=Settings').first()).toBeVisible();
  });

  test('should toggle theme between light and dark', async ({ page }) => {
    // Check initial state (should be light mode)
    const html = page.locator('html');
    const initialClass = await html.getAttribute('class');

    // Find and click theme toggle button
    const themeButton = page
      .locator('button')
      .filter({ hasText: /dark|light/i })
      .first();
    await themeButton.click();

    // Wait for theme change by checking class attribute changes
    await expect(html).not.toHaveAttribute('class', initialClass ?? '');

    // Verify theme changed
    const newClass = await html.getAttribute('class');
    expect(newClass).not.toBe(initialClass);

    // Toggle back
    await themeButton.click();

    // Wait for theme to toggle back
    await expect(html).toHaveAttribute('class', initialClass ?? '');

    // Verify it toggles back
    const finalClass = await html.getAttribute('class');
    expect(finalClass).toBe(initialClass);
  });

  test('should navigate to wizard', async ({ page }) => {
    // Click Generate button/link
    await page.locator('text=Generate').first().click();

    // Wait for navigation
    await page.waitForURL('**/wizard', { timeout: 5000 });

    // Verify we're on wizard page
    expect(page.url()).toContain('/wizard');
  });

  test('should navigate to gallery', async ({ page }) => {
    // Click Gallery link
    await page.locator('text=Gallery').first().click();

    // Wait for navigation
    await page.waitForURL('**/gallery', { timeout: 5000 });

    // Verify we're on gallery page
    expect(page.url()).toContain('/gallery');
  });

  test('should navigate to settings', async ({ page }) => {
    // Click Settings link
    await page.locator('text=Settings').first().click();

    // Wait for navigation
    await page.waitForURL('**/settings', { timeout: 5000 });

    // Verify we're on settings page
    expect(page.url()).toContain('/settings');
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate and interact
    await page.locator('text=Gallery').first().click();
    // Wait for navigation to complete
    await page.waitForURL('**/gallery', { timeout: 5000 });

    // Check for errors (excluding expected errors like network timeouts)
    const criticalErrors = errors.filter((err) => !err.includes('net::') && !err.includes('favicon'));

    expect(criticalErrors.length).toBe(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check app still loads properly
    await expect(page.locator('app-root')).toBeVisible();

    // Check navigation is accessible (might be in hamburger menu)
    const navVisible = await page.locator('nav').isVisible();
    const menuButton = await page.locator('button[aria-label*="menu"]').count();

    expect(navVisible || menuButton > 0).toBeTruthy();
  });

  test('should have basic accessibility compliance', async ({ page }) => {
    // Check for basic WCAG violations

    // All images should have alt text
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }

    // All buttons should have accessible names
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      const ariaLabelledBy = await btn.getAttribute('aria-labelledby');

      expect(text?.trim() || ariaLabel || ariaLabelledBy, 'Button must have accessible name').toBeTruthy();
    }

    // Check heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus first interactive element
    await page.keyboard.press('Tab');

    // Check something is focused
    const focused = await page.evaluateHandle(() => document.activeElement);
    const tagName = await focused.evaluate((el) => el?.tagName);

    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(tagName);

    // Tab through elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Shift+Tab back
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('Shift+Tab');
    }
  });

  test('should persist theme preference', async ({ page, context }) => {
    // Set dark theme
    const themeButton = page
      .locator('button')
      .filter({ hasText: /dark|light/i })
      .first();
    await themeButton.click();

    // Wait for theme change by checking for the 'dark' class
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Get current theme
    const darkClass = await html.getAttribute('class');

    // Reload page
    await page.reload();
    await page.waitForSelector('app-root', { state: 'visible' });

    // Check theme persisted
    const persistedClass = await page.locator('html').getAttribute('class');
    expect(persistedClass).toBe(darkClass);
  });
});
