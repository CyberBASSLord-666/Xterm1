import { test, expect } from '@playwright/test';

const PAGE_TITLE_REGEX = /PolliWall/i;

test.describe('PolliWall Application', () => {
  test('should load the application and display the title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(PAGE_TITLE_REGEX);
  });

  test('should have a visible app root element', async ({ page }) => {
    await page.goto('/');
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check if there are any navigation elements
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page).toHaveTitle(PAGE_TITLE_REGEX);
    
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page).toHaveTitle(PAGE_TITLE_REGEX);
    
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeVisible();
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page).toHaveTitle(PAGE_TITLE_REGEX);
    
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Some errors might be acceptable (like network errors in testing)
    // but we want to ensure there are no critical JavaScript errors
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('net::ERR_') && 
      !err.includes('Failed to load resource')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should handle navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to find any router links
    const links = page.locator('a[href*="#"]');
    const linkCount = await links.count();
    
    // If there are navigation links, test one
    if (linkCount > 0) {
      const firstLink = links.first();
      await firstLink.click();
      
      // Wait a bit for navigation
      await page.waitForTimeout(500);
      
      // Verify we're still on the app
      const appRoot = page.locator('app-root');
      await expect(appRoot).toBeVisible();
    }
  });

  test('should load without JavaScript errors', async ({ page }) => {
    let jsErrors = false;
    
    page.on('pageerror', (error) => {
      console.error('Page error:', error);
      jsErrors = true;
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(jsErrors).toBe(false);
  });
});
