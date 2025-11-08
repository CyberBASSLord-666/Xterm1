# Test Coverage Documentation

<!-- This file will be regenerated during Operation Bedrock Phase 1.2 -->
<!-- Agent: qa-engineer + technical-scribe -->

#### Application Component Tests
- **`src/__tests__/app.spec.ts`**
  - Tests the main AppComponent
  - Verifies theme toggling functionality
  - Tests mobile menu operations
  - Validates dark mode integration

#### Service Tests
- **`src/services/__tests__/device.service.spec.ts`**
  - Tests device information retrieval
  - Validates device pixel ratio calculations
  - Tests fallback behavior for missing screen data

- **`src/services/__tests__/toast.service.spec.ts`**
  - Tests toast notification dispatch
  - Validates custom event handling
  - Tests multiple concurrent messages
  - Handles special characters and edge cases

- **`src/services/__tests__/settings.service.spec.ts`**
  - Tests settings persistence to localStorage
  - Validates settings loading from storage
  - Tests default values
  - Handles corrupted data gracefully
  - Tests generation options extraction

- **`src/services/__tests__/gallery.service.spec.ts`**
  - Tests gallery CRUD operations
  - Validates IndexedDB interactions
  - Tests bulk operations
  - Validates favorite toggling

- **`src/services/__tests__/generation.service.spec.ts`**
  - Tests wallpaper generation flow
  - Validates status signal management
  - Tests service dependencies injection
  - Validates reset functionality

#### Component Tests
- **`src/components/__tests__/toast.component.spec.ts`**
  - Tests toast component visibility
  - Validates message display
  - Tests auto-hide functionality
  - Validates event listener cleanup

### End-to-End Tests (Playwright)
Located in `playwright/e2e/`:

#### Core Functionality Tests
- **`playwright/e2e/example.spec.ts`**
  - Tests basic application loading
  - Validates title and main elements
  - Tests responsive behavior across viewports
  - Checks for console errors
  - Validates navigation functionality
  - Tests meta tags

#### Theme Tests
- **`playwright/e2e/theme.spec.ts`**
  - Tests theme toggle functionality
  - Validates theme persistence across reloads
  - Tests CSS variable application
  - Validates dark mode behavior

#### Navigation Tests
- **`playwright/e2e/navigation.spec.ts`**
  - Tests router outlet functionality
  - Validates hash-based routing
  - Tests navigation link clickability
  - Validates state preservation during navigation
  - Tests mobile menu if present

#### Accessibility Tests
- **`playwright/e2e/accessibility.spec.ts`**
  - Tests heading hierarchy
  - Validates ARIA labels on interactive elements
  - Tests alt text on images
  - Validates keyboard navigation
  - Tests color contrast
  - Validates lang attribute
  - Tests form label associations

## Coverage Thresholds

The project maintains a minimum of 50% coverage across all metrics:
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run E2E tests with UI
npm run e2e

# Run E2E tests headless
npm run e2e:headless
```

### Linting
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix
```

### Code Formatting
```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

## CI/CD Integration

All tests run automatically in the CI pipeline:

1. **Lint Job**: Runs ESLint on all TypeScript and HTML files
2. **Test Job**: Runs Jest unit tests with coverage reporting
3. **Build Job**: Builds the application in both development and production modes
4. **E2E Job**: Runs Playwright end-to-end tests
5. **Lighthouse Job**: Runs Lighthouse CI for performance auditing

Coverage reports are uploaded to Codecov and stored as artifacts.

## Test Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Cleanup**: Tests clean up after themselves (localStorage, event listeners)
3. **Mocking**: External dependencies are mocked appropriately
4. **Descriptive**: Test names clearly describe what they're testing
5. **Comprehensive**: Tests cover happy paths, edge cases, and error conditions

## Adding New Tests

When adding new features:

1. Create unit tests in the appropriate `__tests__` directory
2. Add E2E tests if the feature involves user interaction
3. Update this documentation
4. Ensure all tests pass before committing
5. Maintain or improve coverage thresholds

## Debugging Tests

### Jest Tests
```bash
# Run a specific test file
npm test -- device.service.spec.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should toggle theme"

# Run tests with verbose output
npm test -- --verbose
```

### Playwright Tests
```bash
# Run with debugging
npx playwright test --debug

# Run a specific test file
npx playwright test theme.spec.ts

# Generate test report
npx playwright show-report
```

## Coverage Reports

After running tests with coverage, open `coverage/lcov-report/index.html` in a browser to view detailed coverage reports.

## Known Limitations

- Some tests may require specific browser features (e.g., IntersectionObserver) which are mocked
- IndexedDB operations in tests use mocked implementations
- Network requests in E2E tests may be slower due to actual API calls

## Future Improvements

- [ ] Increase coverage threshold to 80%
- [ ] Add visual regression testing
- [ ] Add performance benchmarks
- [ ] Add mutation testing
- [ ] Add integration tests for complex workflows
