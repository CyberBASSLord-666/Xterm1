import type { Config } from 'jest';

/**
 * Jest Configuration for PolliWall (Xterm1)
 *
 * This configuration provides a production-grade unit testing setup using
 * jest-preset-angular for Angular/TypeScript testing.
 *
 * QA QUALITY GATES:
 * - Coverage thresholds are enforced to prevent regression
 * - Test patterns exclude E2E and mock files to ensure accurate metrics
 * - Coverage reports generated in multiple formats for CI integration
 *
 * COVERAGE TARGETS (Current / Goal):
 * - Branches: 46% / 70% (Phase 1 improvement planned)
 * - Functions: 41% / 70%
 * - Lines: 49% / 70%
 * - Statements: 49% / 70%
 *
 * @see TEST_COVERAGE.md for detailed coverage strategy
 * @see QUALITY_METRICS.md for quality gate definitions
 */
const config: Config = {
  // Use Angular-specific Jest preset for proper TypeScript/HTML compilation
  preset: 'jest-preset-angular',

  // Zone.js and Angular testing environment setup
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  // Exclude E2E tests (Playwright), build artifacts, and legacy Cypress tests
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/playwright/', '/cypress/'],

  // Enable coverage collection for all test runs
  collectCoverage: true,
  coverageDirectory: 'coverage',

  // Multiple report formats for different consumers:
  // - html: Local development and PR reviews
  // - text: Console output in CI
  // - lcov: Codecov and coverage tools
  // - json: Machine-readable for custom tooling
  coverageReporters: ['html', 'text', 'lcov', 'json'],

  // Exclude test files and mocks from coverage metrics
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/*.spec.ts$/', '/*.mock.ts$/'],

  // QUALITY GATE: Minimum coverage thresholds
  // These thresholds are enforced in CI and will fail the build if not met
  // Thresholds are set conservatively and should be increased over time
  coverageThreshold: {
    global: {
      branches: 46, // Target: 70% (increase with each milestone)
      functions: 41, // Target: 70%
      lines: 49, // Target: 70%
      statements: 49, // Target: 70%
    },
  },

  // Path aliases matching tsconfig.json for consistent imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform configuration for TypeScript and HTML files
  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
      },
    ],
  },

  // Match all .spec.ts files for unit tests
  testMatch: ['**/*.spec.ts'],

  // Supported file extensions in order of preference
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],

  // Don't transform node_modules except ES modules (.mjs)
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
};

export default config;
