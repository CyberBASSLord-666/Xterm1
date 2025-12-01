import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for PolliWall (Xterm1)
 *
 * Production-grade E2E testing setup optimized for both CI and local development.
 *
 * QA QUALITY GATES:
 * - CI uses Chromium-only for speed and consistency
 * - Local development tests all browsers for compatibility
 * - Parallel execution enabled for faster feedback
 * - Strict timeouts prevent flaky tests from hanging CI
 *
 * BROWSER COVERAGE:
 * - Chromium (Desktop Chrome) - Primary, always tested
 * - Firefox (Desktop Firefox) - Local only
 * - WebKit (Desktop Safari) - Local only
 * - Mobile Chrome (Pixel 5) - Local only
 * - Mobile Safari (iPhone 12) - Local only
 *
 * TEST CATEGORIES:
 * - app.spec.ts: Application loading, navigation, theme
 * - wizard.spec.ts: Wallpaper generation workflow
 * - navigation.spec.ts: Router and navigation tests
 * - accessibility.spec.ts: WCAG 2.1 AA compliance
 * - theme.spec.ts: Theme toggling and persistence
 *
 * @see E2E_TESTING.md for comprehensive testing strategy
 * @see QUALITY_METRICS.md for quality gate definitions
 */

const isCI = !!process.env.CI;

export default defineConfig({
  // Test directory containing all E2E test specs
  testDir: './playwright/e2e',

  /**
   * Test Timeout Configuration
   * - CI: Reduced to 15s to catch slow tests early and fail fast
   * - Local: Extended to 30s to accommodate slower development machines
   */
  timeout: isCI ? 15 * 1000 : 30 * 1000,

  /**
   * Assertion Timeout Configuration
   * - CI: 5s for quick failure detection
   * - Local: 10s for development flexibility
   */
  expect: {
    timeout: isCI ? 5000 : 10000,
  },

  /**
   * Parallel Execution
   * Enabled for maximum test throughput. Tests must be independent.
   */
  fullyParallel: true,

  /**
   * Prevent .only() from accidentally shipping to CI
   * This ensures all tests run in the pipeline
   */
  forbidOnly: isCI,

  /**
   * Retry Configuration
   * - CI: No retries to expose flaky tests immediately
   * - Local: No retries for faster feedback
   * Tests should be reliable without retries.
   */
  retries: isCI ? 0 : 0,

  /**
   * Worker Configuration
   * - CI: 2 workers for parallel execution within resource limits
   * - Local: Auto-detect based on CPU cores
   */
  workers: isCI ? 2 : undefined,

  /**
   * Reporter Configuration
   * - CI: List reporter for logs + HTML for artifact storage
   * - Local: Full HTML with auto-open + JSON for tooling
   */
  reporter: isCI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'playwright-report/results.json' }],
        ['list'],
      ],

  /**
   * Shared Configuration for All Projects
   * These settings apply to all browser configurations
   */
  use: {
    // Base URL for navigation (page.goto('/'))
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200',

    /**
     * Trace Recording
     * - CI: Disabled for speed (artifacts are large)
     * - Local: On first retry for debugging flaky tests
     */
    trace: isCI ? 'off' : 'on-first-retry',

    /**
     * Screenshot Configuration
     * - CI: Disabled for speed
     * - Local: Capture on failure for debugging
     */
    screenshot: isCI ? 'off' : 'only-on-failure',

    /**
     * Video Recording
     * - CI: Disabled for speed and storage
     * - Local: Retain on failure for debugging
     */
    video: isCI ? 'off' : 'retain-on-failure',

    /**
     * Timeout Configuration for Actions
     * - Navigation: Time to wait for page load
     * - Action: Time to wait for element interactions
     */
    navigationTimeout: isCI ? 8000 : 10000,
    actionTimeout: isCI ? 5000 : 10000,
  },

  /**
   * Browser Projects Configuration
   *
   * CI: Chromium only for speed and consistency
   * Local: Full browser matrix for compatibility testing
   */
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
        /* Mobile viewport testing for responsive design */
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ],

  /**
   * Web Server Configuration
   *
   * CI: Serve pre-built production bundle for speed
   * Local: Use npm start with hot reload for development
   */
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
