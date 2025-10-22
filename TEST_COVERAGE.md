# Test Coverage Documentation

## Overview
PolliWall uses Jest (with `jest-preset-angular`) for unit and integration testing and Playwright for end-to-end coverage of critical user journeys. This document captures the current suite layout, how to execute the tests locally, and the latest coverage snapshot produced by `npm test -- --coverage`.

## Jest suite composition

The Jest suites live alongside the implementation code under `src/` and follow a `__tests__` co-location pattern for service-focused coverage.

| Area | Key spec files | Highlights |
| ---- | -------------- | ---------- |
| Application shell | `src/__tests__/app.spec.ts` | Bootstraps the Angular shell, verifies navigation chrome, and confirms theme toggling state transitions. |
| Directives | `src/directives/__tests__/lazy-image.directive.spec.ts` | Exercises IntersectionObserver support and fallbacks, placeholder lifecycle, and dynamic source swaps for the lazy image directive. |
| Runtime bootstrapping | `src/services/__tests__/app-initializer.service.spec.ts`, `src/services/__tests__/config.service.spec.ts` | Validates environment validation, HTTPS enforcement, layered secret injection, and analytics initialisation. |
| Analytics & monitoring | `src/services/__tests__/analytics.service.spec.ts`, `src/services/__tests__/performance-monitor.service.spec.ts` | Confirms batching, queue flushing, noopener enforcement, and performance metric publication. |
| Request orchestration | `src/services/__tests__/pollinations.client.spec.ts`, `src/services/__tests__/request-cache.service.spec.ts` | Covers retry logic, queue backoff, cache eviction, and error propagation paths. |
| Gallery & persistence | `src/services/__tests__/gallery.service.behaviour.spec.ts`, `src/services/__tests__/gallery.service.spec.ts`, `src/services/__tests__/image-util.service.spec.ts` | Tests IndexedDB persistence, gallery CRUD flows, download utilities, and blob manipulation edge cases. |
| Supporting services | Additional specs in `src/services/__tests__/` and `src/services/*.spec.ts` | Safeguard keyboard shortcuts, logger/error handlers, validation/sanitisation, settings storage, and device utilities. |

## Playwright end-to-end suites

Playwright specifications are stored under `playwright/e2e/` and target Chromium by default (configurable to Firefox/WebKit via the Playwright CLI matrix).

- `app.spec.ts` — renders the application shell, checks layout breakpoints, and guards console hygiene.
- `navigation.spec.ts` — verifies primary router flows and SPA fallback handling.
- `wizard.spec.ts` — walks the wallpaper creation wizard, including prompt submission and validation errors.
- `theme.spec.ts` — exercises theme toggling, persistence, and CSS variable updates.
- `accessibility.spec.ts` — runs axe accessibility assertions, keyboard navigation, and ARIA attribute checks.
- `example.spec.ts` — smoke regression ensuring baseline rendering.

## Latest coverage results

Running `npm test -- --coverage` on this branch produces the following global metrics:

- **Statements:** 85.66 %
- **Branches:** 70.00 %
- **Functions:** 81.56 %
- **Lines:** 86.25 %

These values satisfy the configured Jest thresholds (70 % minimum for all metrics) as defined in `jest.config.ts` and correspond to the textual report captured in the test run output (`npm test -- --coverage`).

## How to run the suites locally

### Jest (unit & integration)
```bash
# Install dependencies (first run only)
npm install

# Run the entire suite with coverage, matching CI
npm test -- --coverage

# Run an individual spec for focused iteration
npm test -- --runTestsByPath src/services/__tests__/analytics.service.spec.ts

# Enable watch mode during development
npm run test:watch
```

### Playwright (end-to-end)
```bash
# Install browsers (first run only)
npx playwright install

# Run the default Chromium suite with headed browser controls
npm run e2e

# Execute headless tests across all configured browsers
npm run e2e:headless
```

### Related quality gates
```bash
# Lint the Angular sources
npm run lint

# Format the supported source files
npm run format

# Build the production bundle (uses Angular CLI)
npm run build -- --configuration=production
```

Consistently running these commands before pushing changes ensures contributors maintain the documented coverage guarantees and avoid unexpected CI regressions.
