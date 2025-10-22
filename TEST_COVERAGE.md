# Test Coverage Documentation

## Overview
This project maintains exhaustive test coverage using Jest for unit and integration suites, complemented by Playwright
end-to-end automation across Chromium, Firefox, WebKit, and real mobile devices. Coverage artefacts live under
`artifacts/test/` for deterministic audit trails.

## Test Structure

### Unit & Integration Tests (Jest)

The codebase contains 21 suites / 194 individual specs. Highlights include:

- **Application Shell** — `src/__tests__/app.spec.ts` exercises responsive layout, theme toggling, menu handling, and
  analytics hooks.
- **Directive Coverage** — `src/directives/__tests__/lazy-image.directive.spec.ts` simulates IntersectionObserver support,
  placeholder fallbacks, network errors, and dynamic source swaps.
- **Runtime Bootstrap** — `src/services/__tests__/app-initializer.service.spec.ts` and
  `src/services/__tests__/config.service.spec.ts` validate runtime configuration sourcing, HTTPS enforcement, analytics
  enablement, and Gemini client initialisation.
- **Analytics & Monitoring** — Suites for analytics, performance monitoring, and keyboard shortcuts assert batching,
  lifecycle hygiene, and instrumentation forwarding.
- **Data Services** — Gallery, request cache, image utilities, pollinations client, and validation services include
  high-fidelity mocks for IndexedDB, blob manipulation, queueing, sanitisation, and retry logic.
- **Legacy Services** — Device, settings, toast, generation, and additional services retain comprehensive regression
  coverage to guard historical functionality.

### End-to-End Tests (Playwright)

Playwright suites reside in `playwright/e2e/` and are executed against Chromium, Firefox, WebKit, and BrowserStack mobile
profiles. Key suites include:

- `example.spec.ts` — Smoke validation for boot, navigation, console hygiene, and responsive layout.
- `navigation.spec.ts` — Router transitions, SPA fallback, and state persistence.
- `theme.spec.ts` — Theme toggle persistence and CSS variable assertions.
- `gallery.spec.ts` — CRUD flows, optimistic updates, offline recovery, and accessibility of gallery interactions.
- `analytics.spec.ts` — Consent banner, opt-in/out, and GA4 event verification.
- `accessibility.spec.ts` — Axe-powered audits covering headings, ARIA attributes, keyboard navigation, and contrast.

Execution results are captured in [`artifacts/test/playwright-summary.xml`](artifacts/test/playwright-summary.xml).

## Coverage Thresholds

Coverage thresholds are enforced via `jest.config.ts`:

- **Statements** ≥ 70%
- **Branches** ≥ 70%
- **Functions** ≥ 70%
- **Lines** ≥ 70%

Latest run (`npm test -- --coverage`) produced:

- Statements: **85.66%**
- Branches: **70.00%**
- Functions: **81.56%**
- Lines: **86.25%**

Refer to [`artifacts/test/jest-coverage.txt`](artifacts/test/jest-coverage.txt) for the full LCOV summary.

## Running Tests

### Unit & Integration Tests
```bash
# Run the full suite with coverage (CI default)
npm test -- --coverage

# Execute a specific file
npm test -- --runTestsByPath src/services/__tests__/analytics.service.spec.ts

# Watch mode for local iteration
npm run test:watch
```

### End-to-End Tests
```bash
# Run Chromium suite locally with UI controls
npm run e2e

# Headless matrix aligned with CI
npm run e2e:headless

# Target a single spec across browsers
npx playwright test playwright/e2e/gallery.spec.ts --project=chromium
```

### Linting & Formatting
```bash
# Static analysis
npm run lint

# Auto-fix eligible lint issues
npm run lint:fix

# Apply Prettier formatting
npm run format

# Verify formatting without modifications
npm run format:check
```

## CI/CD Integration

1. **Lint Job** — ESLint across TypeScript/HTML with caching.
2. **Unit Test Job** — `npm test -- --coverage`; uploads [`artifacts/test/jest-coverage.txt`](artifacts/test/jest-coverage.txt).
3. **E2E Job** — Playwright matrix; publishes [`artifacts/test/playwright-summary.xml`](artifacts/test/playwright-summary.xml).
4. **Build Job** — Angular production build with logs archived at [`artifacts/build/angular-build.log`](artifacts/build/angular-build.log).
5. **Performance Job** — Executes k6 load test (`scripts/performance/k6-generate.js`) and stores Lighthouse output at
   [`artifacts/performance/lighthouse-summary.json`](artifacts/performance/lighthouse-summary.json).

Coverage artefacts are versioned inside the repository for transparency in addition to CI storage.

## Best Practices

1. **Isolation** — Avoid shared mutable state; leverage factory helpers and tear-down hooks.
2. **Determinism** — Seed randomness (e.g., `crypto.randomUUID` mock) to stabilise coverage runs.
3. **Mocking Discipline** — Prefer explicit, minimal mocks; validate behaviour via expectations rather than implementation
   details.
4. **Accessibility** — End-to-end suites assert screen reader compatibility and keyboard navigation.
5. **Observability** — Tests assert log outputs, analytics payloads, and monitoring events where feasible.

## Future Enhancements

- [ ] Expand mutation testing coverage with Stryker.
- [ ] Automate visual regression checks via Playwright trace viewers.
- [ ] Increase branch coverage target to 80% after stabilising new modules.
