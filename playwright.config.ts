import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * Production-grade E2E testing setup optimized for CI speed
 *
 * Features:
 * - CI-optimized single browser testing (Chromium only in CI)
 * - Multi-browser testing in local development
 * - Parallel execution for speed
 * - Minimal artifacts in CI for faster runs
 * - Full debugging capabilities locally
 */

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './playwright/e2e',

  /* Maximum time one test can run for - reduced for CI */
  timeout: isCI ? 15 * 1000 : 30 * 1000,

  /* Expect timeout */
  expect: {
    timeout: isCI ? 5000 : 10000,
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: isCI,

  /* No retries in CI for speed - tests should be reliable */
  retries: isCI ? 0 : 0,

  /* Use 2 workers in CI for parallelism */
  workers: isCI ? 2 : undefined,

  /* Minimal reporter in CI for speed */
  reporter: isCI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'playwright-report/results.json' }],
        ['list'],
      ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200',

    /* Disable trace in CI for speed */
    trace: isCI ? 'off' : 'on-first-retry',

    /* Screenshot only on failure, skip in CI for speed */
    screenshot: isCI ? 'off' : 'only-on-failure',

    /* No video in CI for speed */
    video: isCI ? 'off' : 'retain-on-failure',

    /* Reduced timeouts for CI */
    navigationTimeout: isCI ? 8000 : 10000,
    actionTimeout: isCI ? 5000 : 10000,
  },

  /* Configure projects - CI only uses Chromium for speed */
  projects: isCI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        /* Test against mobile viewports */
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ],

  /* Run your local dev server before starting the tests */
  webServer: isCI
    ? {
        command: 'npx serve dist/app/browser -l 4200',
        url: 'http://localhost:4200',
        reuseExistingServer: false,
        timeout: 30 * 1000,
      }
    : {
        command: 'npm start',
        url: 'http://localhost:4200',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
});
