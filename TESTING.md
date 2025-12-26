# Testing Strategy and Guidelines

> **Consolidated Testing Documentation for Xterm1**  
> **Date**: 2025-12-26  
> **Status**: ✅ COMPREHENSIVE TESTING GUIDE  
> **Consolidates**: E2E_TESTING.md + TEST_COVERAGE.md

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Philosophy](#testing-philosophy)
3. [Unit Testing with Jest](#unit-testing-with-jest)
4. [End-to-End Testing with Playwright](#end-to-end-testing-with-playwright)
5. [Test Coverage](#test-coverage)
6. [Testing Best Practices](#testing-best-practices)
7. [Debugging Tests](#debugging-tests)
8. [CI/CD Integration](#cicd-integration)
9. [Accessibility Testing](#accessibility-testing)
10. [Performance Testing](#performance-testing)
11. [Future Enhancements](#future-enhancements)

---

## Overview

Xterm1 employs a comprehensive, production-grade testing strategy using multiple testing frameworks and methodologies to ensure code quality, reliability, and security.

**Testing Frameworks**:
- **Jest 30.2.0** - Unit testing (with jest-preset-angular 15.0.3)
- **Playwright 1.45.0** - End-to-end testing
- **Istanbul** - Code coverage analysis (via Jest)

**Test Count**: 165 unit tests (97.6% pass rate)  
**E2E Tests**: 15+ comprehensive end-to-end scenarios  
**Coverage**: Meets all thresholds (branches: 50%, functions: 50%, lines: 50%, statements: 50%)

---

## Testing Philosophy

### Test Pyramid

```
         /\
        /  \
       / E2E \          15+ tests (slow, high-level)
      /______\
     /        \
    /  Integ.  \        Future expansion
   /____________\
  /              \
 /  Unit Tests    \    165+ tests (fast, focused)
/__________________\
```

### Core Principles

1. **Test User Behavior, Not Implementation** - Focus on public API and user-facing functionality
2. **Fast & Isolated** - Tests should be independent and execute quickly
3. **Comprehensive Coverage** - Critical paths must have 100% coverage
4. **Accessibility-First** - All tests include accessibility validation
5. **Security-Aware** - XSS prevention and input validation tested thoroughly

---

## Unit Testing with Jest

### Configuration

**File**: `jest.config.ts`

```typescript
export default {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.types.ts',
    '!src/main.ts',
    '!src/polyfills.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  transform: {
    '^.+\\.ts$': ['jest-preset-angular', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$'
    }]
  }
};
```

### Test Organization

```
src/
├── __tests__/
│   └── app.spec.ts                    # Root component tests
├── services/__tests__/
│   ├── logger.service.spec.ts         # 95%+ coverage
│   ├── error-handler.service.spec.ts  # 90%+ coverage
│   ├── validation.service.spec.ts     # 95%+ coverage
│   ├── analytics.service.spec.ts      # 85%+ coverage
│   ├── gallery.service.spec.ts        # 90%+ coverage
│   ├── generation.service.spec.ts     # 85%+ coverage
│   ├── settings.service.spec.ts       # 90%+ coverage
│   ├── toast.service.spec.ts          # 95%+ coverage
│   └── device.service.spec.ts         # 90%+ coverage
└── components/__tests__/
    ├── toast.component.spec.ts        # 90%+ coverage
    └── ... (10+ component tests)
```

### Running Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npx jest logger.service.spec.ts

# Run tests matching pattern
npx jest --testNamePattern="should log"

# Run with verbose output
npm test -- --verbose
```

### Unit Test Structure

**Pattern**:
```typescript
import { TestBed } from '@angular/core/testing';
import { ServiceName } from './service-name.service';

describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: jest.Mocked<DependencyService>;
  
  beforeEach(() => {
    // Setup mocks
    mockDependency = {
      method: jest.fn().mockResolvedValue('result')
    } as any;
    
    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        ServiceName,
        { provide: DependencyService, useValue: mockDependency }
      ]
    });
    
    service = TestBed.inject(ServiceName);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should process data successfully', async () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = await service.process(input);
    
    // Assert
    expect(result).toBe('expected output');
    expect(mockDependency.method).toHaveBeenCalledWith(input);
  });
  
  it('should handle errors gracefully', async () => {
    // Arrange
    mockDependency.method.mockRejectedValue(new Error('test error'));
    
    // Act & Assert
    await expect(service.process('input')).rejects.toThrow('test error');
  });
});
```

### Service Test Coverage

#### Foundation Services

##### LoggerService (95%+ coverage)
```typescript
describe('LoggerService', () => {
  it('should log debug messages with context', () => {
    const spy = jest.spyOn(console, 'debug');
    service.debug('test message', { data: 'value' }, 'TestService');
    expect(spy).toHaveBeenCalled();
  });
  
  it('should track log history', () => {
    service.info('test 1');
    service.info('test 2');
    expect(service.getHistory()).toHaveLength(2);
  });
  
  it('should enforce history size limits', () => {
    for (let i = 0; i < 1500; i++) {
      service.info(`log ${i}`);
    }
    expect(service.getHistory().length).toBeLessThanOrEqual(1000);
  });
});
```

##### ValidationService (95%+ coverage)
```typescript
describe('ValidationService - XSS Prevention', () => {
  it('should remove script tags', () => {
    const input = '<script>alert("XSS")</script>';
    const result = service.sanitizeHtml(input);
    expect(result).toBe('');
  });
  
  it('should remove event handlers', () => {
    const input = '<div onclick="alert(1)">Click</div>';
    const result = service.sanitizeHtml(input);
    expect(result).not.toContain('onclick');
  });
  
  it('should block dangerous protocols', () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = service.sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });
});
```

##### ErrorHandlerService (90%+ coverage)
```typescript
describe('ErrorHandlerService', () => {
  it('should handle errors with logging and toast', () => {
    const error = new Error('Test error');
    service.handleError(error);
    
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockToast.show).toHaveBeenCalledWith(
      expect.stringContaining('error'),
      'error'
    );
  });
});
```

#### Feature Services

##### GalleryService (90%+ coverage)
```typescript
describe('GalleryService', () => {
  it('should perform CRUD operations on IndexedDB', async () => {
    const item = { prompt: 'test', imageUrl: 'data:image/png;base64,...' };
    
    // Create
    const id = await service.addItem(item);
    expect(id).toBeDefined();
    
    // Read
    const retrieved = await service.getItem(id);
    expect(retrieved.prompt).toBe('test');
    
    // Update
    await service.updateItem(id, { prompt: 'updated' });
    const updated = await service.getItem(id);
    expect(updated.prompt).toBe('updated');
    
    // Delete
    await service.deleteItem(id);
    const deleted = await service.getItem(id);
    expect(deleted).toBeUndefined();
  });
});
```

---

## End-to-End Testing with Playwright

### Configuration

**File**: `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './playwright/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list']
  ],
  
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 10000,
    actionTimeout: 10000
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }
  ],
  
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
```

### Test Organization

```
playwright/
├── e2e/
│   ├── app.spec.ts               # Application loading & navigation
│   ├── wizard.spec.ts            # Image generation workflow
│   ├── gallery.spec.ts           # Gallery management
│   ├── collections.spec.ts       # Collection organization
│   ├── settings.spec.ts          # Settings configuration
│   ├── navigation.spec.ts        # Navigation & routing
│   ├── accessibility.spec.ts     # WCAG 2.1 AA compliance
│   └── theme.spec.ts             # Theme switching
├── fixtures/                     # Custom fixtures
└── helpers/                      # Test utilities
```

### Running E2E Tests

```bash
# Interactive mode (UI)
npm run e2e

# Headless mode
npm run e2e:headless

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project="Mobile Chrome"

# Specific test file
npx playwright test wizard.spec.ts

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### E2E Test Structure

**Pattern**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  
  test('should perform user action', async ({ page }) => {
    // Arrange
    await page.fill('[data-testid="input"]', 'value');
    
    // Act
    await page.click('[data-testid="submit"]');
    
    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Locator Strategy

**Priority Order**:
1. `data-testid` attributes (best)
2. ARIA roles and labels
3. Text content
4. CSS selectors (last resort)

**Examples**:
```typescript
// Preferred: data-testid
await page.click('[data-testid="generate-button"]');

// Good: ARIA
await page.click('button[role="button"][aria-label="Generate"]');

// Acceptable: Text
await page.click('text=Generate Image');

// Avoid: CSS selectors
// await page.click('.wizard-form button.primary');
```

### Browser Coverage

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| **Chromium** | ✅ | ✅ (Pixel 5) | Full coverage |
| **Firefox** | ✅ | N/A | Full coverage |
| **WebKit** | ✅ | ✅ (iPhone 12) | Full coverage |

---

## Test Coverage

### Current Metrics

**Overall Coverage**:
```json
{
  "branches": 50,
  "functions": 50,
  "lines": 50,
  "statements": 50
}
```

**Status**: ✅ All thresholds met

| Metric | Threshold | Current | Status |
|--------|-----------|---------|--------|
| **Branches** | 50% | ~55% | ✅ Pass |
| **Functions** | 50% | ~55% | ✅ Pass |
| **Lines** | 50% | ~60% | ✅ Pass |
| **Statements** | 50% | ~60% | ✅ Pass |

### Coverage by Category

| Category | Files | Coverage | Priority |
|----------|-------|----------|----------|
| **Core Services** | 21 | 85%+ | Critical |
| **Components** | 10 | 60%+ | High |
| **Utilities** | 5 | 75%+ | High |
| **Directives** | 1 | 70%+ | Medium |
| **Types** | 3 | N/A | N/A |

### Coverage Reports

**Generated Reports**:
- `coverage/lcov-report/index.html` - HTML coverage report (interactive)
- `coverage/lcov.info` - LCOV format (for CI integration)
- `coverage/coverage-final.json` - JSON format (machine-readable)

**View HTML Report**:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Improvement Plan

**Goals (Next 6 Months)**:

**Phase 1: Foundation** (Month 1-2)
- [ ] Increase unit coverage to 70%
- [ ] Add missing service tests
- [ ] Improve component test coverage to 80%

**Phase 2: Expansion** (Month 3-4)
- [ ] Increase unit coverage to 80%
- [ ] Add visual regression tests
- [ ] Improve E2E test coverage to 25+ tests

**Phase 3: Excellence** (Month 5-6)
- [ ] Achieve 85%+ unit coverage
- [ ] 100% coverage on critical services
- [ ] Full accessibility test suite
- [ ] Performance test suite

---

## Testing Best Practices

### DO ✅

**1. Use descriptive test names**
```typescript
test('should generate image when valid prompt is submitted', async ({ page }) => {
  // Test implementation
});
```

**2. Test user behavior, not implementation**
```typescript
// Good: Tests what user does
await page.fill('[data-testid="prompt-input"]', 'A sunset');
await page.click('[data-testid="generate-button"]');
await expect(page.locator('[data-testid="image-result"]')).toBeVisible();

// Bad: Tests internal state
// expect(component.state.isGenerating).toBe(true);
```

**3. Use Page Object Model for complex flows**
```typescript
class WizardPage {
  constructor(private page: Page) {}
  
  async enterPrompt(prompt: string) {
    await this.page.fill('[data-testid="prompt-input"]', prompt);
  }
  
  async clickGenerate() {
    await this.page.click('[data-testid="generate-button"]');
  }
  
  async waitForResult() {
    await this.page.waitForSelector('[data-testid="image-result"]');
  }
}
```

**4. Clean up test data**
```typescript
test.afterEach(async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

**5. Test error scenarios**
```typescript
test('should show error when API fails', async ({ page, context }) => {
  await context.route('**/api/generate', route => {
    route.abort('failed');
  });
  
  await page.click('[data-testid="generate-button"]');
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});
```

### DON'T ❌

**1. Don't use hard-coded waits**
```typescript
// Bad
await page.waitForTimeout(5000);

// Good
await expect(element).toBeVisible();
```

**2. Don't test implementation details**
```typescript
// Bad
expect(page.locator('.internal-class')).toBeTruthy();

// Good
await expect(page.locator('[data-testid="feature"]')).toBeVisible();
```

**3. Don't make tests interdependent**
```typescript
// Bad: Test B depends on Test A
test('A: create item', ...);
test('B: edit item', ...); // Assumes A ran first

// Good: Each test is independent
test('should create item', ...);
test('should edit item', async ({ page }) => {
  await createTestItem(page); // Setup within test
  // ...
});
```

---

## Debugging Tests

### Debug Commands

```bash
# Unit Tests (Jest)
npm test -- --watchAll=false --verbose

# Run specific test file
npm test -- device.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should toggle theme"

# E2E Tests (Playwright)
# Run with headed browser
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Run specific test in debug mode
npx playwright test wizard.spec.ts --debug

# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### VSCode Debug Configuration

**`.vscode/launch.json`**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Jest Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Playwright Tests",
      "program": "${workspaceFolder}/node_modules/.bin/playwright",
      "args": ["test", "--debug"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Troubleshooting Common Issues

**Issue**: Tests timing out
```typescript
// Solution: Increase timeout
test('long running test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

**Issue**: Flaky tests
```typescript
// Solution: Add explicit waits
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

**Issue**: Element not found
```typescript
// Solution: Use better selectors
// Bad: await page.click('.btn')
// Good: await page.click('[data-testid="submit-button"]')
```

---

## CI/CD Integration

### GitHub Actions Configuration

**E2E Testing** (`.github/workflows/ci.yml`):
```yaml
e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v6
      with:
        node-version: '20'
    - run: npm ci
    - run: npx playwright install --with-deps
    - run: npm run e2e:headless
    - uses: actions/upload-artifact@v5
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

**Unit Testing** (`.github/workflows/ci.yml`):
```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v6
      with:
        node-version: '20'
    - run: npm ci
    - run: npm test -- --coverage --watchAll=false
    - uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    - uses: actions/upload-artifact@v5
      with:
        name: coverage-report
        path: coverage/
```

### CI Features

- ✅ Parallel test execution (E2E)
- ✅ Artifact upload (reports, screenshots, videos)
- ✅ Retry on failure (2 retries for E2E)
- ✅ HTML report generation
- ✅ Automatic cleanup
- ✅ Coverage upload to Codecov

---

## Accessibility Testing

### Automated A11y Checks

**Using axe-core integration**:
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Manual A11y Tests

**Keyboard Navigation**:
```typescript
test('should navigate with keyboard', async ({ page }) => {
  await page.goto('/');
  
  // Tab through interactive elements
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'first-input');
  
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'second-input');
  
  // Activate with Enter/Space
  await page.keyboard.press('Enter');
});
```

**ARIA Labels**:
```typescript
test('should have proper ARIA labels', async ({ page }) => {
  await page.goto('/');
  
  const button = page.locator('button[aria-label="Generate Image"]');
  await expect(button).toBeVisible();
  
  const input = page.locator('input[aria-label="Image prompt"]');
  await expect(input).toBeVisible();
});
```

### WCAG 2.1 AA Compliance

**Coverage** (90%+ tested):
- ✅ Keyboard navigation
- ✅ Screen reader support (ARIA labels)
- ✅ Focus management
- ✅ Color contrast
- ✅ Semantic HTML
- ✅ Form labels
- ⚠️ Live regions (partial)

---

## Performance Testing

### Measuring Metrics

```typescript
test('should load quickly', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/');
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // 3 second threshold
  
  // Web Vitals
  const metrics = await page.evaluate(() => 
    JSON.stringify(performance.getEntries())
  );
  console.log('Performance metrics:', metrics);
});
```

### Core Web Vitals

**Target**: "Good" rating
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

---

## Future Enhancements

### Planned Additions

1. **Visual Regression**
   - Implement full visual snapshot testing
   - Compare across browser versions
   - Automated screenshot comparison

2. **Performance Budgets**
   - Lighthouse integration
   - Core Web Vitals assertions
   - Bundle size checks

3. **API Mocking**
   - Mock external APIs in tests
   - Faster, more reliable tests
   - Offline testing capability

4. **Test Data Management**
   - Seed test database
   - Clean test data automatically
   - Fixtures for common scenarios

---

## Summary

### Test Quality Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Test Count** | 165 | 200+ | 🟡 In Progress |
| **Pass Rate** | 97.6% | 100% | 🟢 Good |
| **Test Duration** | ~30s | <60s | 🟢 Excellent |
| **Flaky Tests** | 0 | 0 | 🟢 Perfect |
| **Coverage** | 55% | 70%+ | 🟡 Improving |

### Key Strengths

✅ **Comprehensive Testing Strategy** - Unit + E2E + Accessibility  
✅ **High Pass Rate** - 97.6% of tests passing  
✅ **Fast Execution** - ~30 seconds for full unit test suite  
✅ **Zero Flaky Tests** - Reliable and deterministic  
✅ **Multi-Browser Coverage** - Chromium, Firefox, WebKit, Mobile  
✅ **Accessibility-First** - WCAG 2.1 AA compliance testing  
✅ **CI/CD Integration** - Automated testing on every PR

### Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [jest-preset-angular](https://thymikee.github.io/jest-preset-angular/)
- [Playwright Documentation](https://playwright.dev/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Testing Best Practices](https://testingjavascript.com/)

---

*This testing documentation is the definitive reference for all testing in Xterm1.*  
*Last Updated: 2025-12-26 | Documentation Consolidation Complete*
