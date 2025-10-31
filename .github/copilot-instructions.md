# GitHub Copilot Instructions for PolliWall

## Project Overview

PolliWall is a production-grade AI-powered wallpaper generation application built with Angular 20. It leverages Pollinations AI for image generation and Google Gemini for prompt enhancement, with a focus on performance, accessibility, user safety, and maintainability.

## Technology Stack

- **Framework**: Angular 20.x with standalone components (full migration complete)
- **Language**: TypeScript 5.8.x (strict mode enabled)
- **Styling**: Tailwind CSS 4.x with utility-first approach
- **State Management**: Angular Signals with computed() for derived state
- **Storage**: IndexedDB via `idb` library
- **Service Worker**: @angular/service-worker for PWA capabilities
- **Testing**: Jest for unit tests, Playwright and Cypress for E2E tests
- **Build Tool**: Angular CLI with esbuild
- **CI/CD**: GitHub Actions with dependency caching and security scanning

## Code Style and Standards

### TypeScript

- **Strict mode is enabled** - all code must pass TypeScript strict checks
- Use explicit return types for functions (ESLint enforces this)
- Avoid `any` type - use proper typing or `unknown` with type guards
- Prefix unused parameters with underscore: `_paramName`
- Use modern ES2022+ features (async/await, optional chaining, nullish coalescing)
- Path alias `@/*` is configured for root imports
- For fire-and-forget async operations, use `void` prefix: `void this.asyncMethod()`

### Angular

- **All components are standalone** - no NgModule declarations anywhere
- **OnPush change detection** strategy for all components
- **Angular Signals** for state management (not RxJS Subjects for local state)
- **Use `computed()` for derived state** - never direct signal references
- Component selectors: Use `app-` or `pw-` prefix with kebab-case
- Directive selectors: Use `app` or `lazyImage` prefix with camelCase
- Inject dependencies via constructor or `inject()` function
- Use `ngOnInit()` for initialization logic, not constructors
- Implement `ngOnDestroy()` for cleanup when needed

### Component Structure

```typescript
@Component({
  selector: 'app-feature-name',
  standalone: true,
  imports: [CommonModule, FormsModule, /* other imports */],
  templateUrl: './feature-name.component.html',
  styleUrls: ['./feature-name.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureNameComponent implements OnInit, OnDestroy {
  // Injected services
  private readonly service = inject(ServiceName);
  private readonly logger = inject(LoggerService);
  
  // Signals for reactive state
  readonly state = signal<StateType>(initialValue);
  
  // Always use computed() for derived state
  readonly derived = computed(() => this.state().someProperty);
  
  ngOnInit(): void {
    // Initialization logic here (NOT in constructor)
  }
  
  ngOnDestroy(): void {
    // Cleanup logic here
  }
  
  // Public methods for template
  public handleAction(): void {
    // Implementation
  }
}
```

### Services

- All services should be `@Injectable({ providedIn: 'root' })`
- Use dependency injection, not service locators
- Services should have single responsibility
- Use the existing infrastructure services:
  - `LoggerService` - for all logging (never console.log)
  - `ErrorHandlerService` - for error handling and user notifications
  - `ValidationService` - for input validation
  - `BlobUrlManagerService` - for managing blob URLs (memory leak prevention)
  - `PerformanceMonitorService` - for tracking performance metrics
  - `KeyboardShortcutsService` - for keyboard navigation
  - `AnalyticsService` - for event tracking with batch sending

### Error Handling

- Always use try-catch for async operations
- Use finally blocks to guarantee cleanup (e.g., loading states)
- Log errors with `LoggerService.error()` - never console.log
- Show user-friendly errors with `ErrorHandlerService`
- Never expose API keys or sensitive data in logs
- Example:
```typescript
try {
  const result = await this.apiCall();
  return result;
} catch (error) {
  this.logger.error('Operation failed', { context: 'FeatureName', error });
  this.errorHandler.handleError(error, 'Failed to complete operation');
  throw error; // Re-throw if caller needs to handle
} finally {
  loading.set(false); // Always reset state
}
```

### Async Operation Patterns

- For fire-and-forget operations in event handlers: `void this.asyncMethod()`
- For operations that need error handling: use try-catch
- For user-initiated destructive actions: always confirm first
- Example confirmation:
```typescript
const confirmed = window.confirm('Are you sure? This action cannot be undone.');
if (confirmed) {
  void this.deleteItems();
}
```

### File Naming Conventions

- Components: `feature-name.component.ts`
- Services: `feature-name.service.ts`
- Directives: `feature-name.directive.ts`
- Interfaces/Types: `feature-name.types.ts` or define in same file
- Tests: `feature-name.spec.ts` (Jest) or `feature-name.e2e.ts` (Playwright)
- Constants: Extract magic numbers to named constants at class/module level

## Architecture Patterns

### State Management with Signals

- Use Angular Signals for local component state
- Use services with Signals for shared state
- **Always use `computed()` for derived state** - provides better type safety and reactivity tracking
- Avoid RxJS for simple state - use for streams/events only
- Example:
```typescript
// In component
readonly loadingState = createLoadingState();
readonly isLoading = computed(() => this.loadingState.loading());

// In service
export class StateService {
  private readonly _items = signal<Item[]>([]);
  readonly items = this._items.asReadonly();
  
  addItem(item: Item): void {
    this._items.update(items => [...items, item]);
  }
}
```

### Loading State Pattern

Use `createLoadingState()` helper with proper error handling:
```typescript
readonly loadingState = createLoadingState();
readonly loading = computed(() => this.loadingState.loading());
readonly error = computed(() => this.loadingState.error());

async performAction(): Promise<void> {
  await this.loadingState.execute(async () => {
    // Your async logic here
    // Loading state automatically managed with finally block
  });
}
```

### Performance Optimization

- Use lazy loading for routes and large components
- Implement `LazyImageDirective` for images
- Use `SkeletonComponent` for loading states
- Leverage service worker caching strategies
- Use `ImageUtilService` for image optimization (compression, format conversion)
- Enable `RequestCacheService` for deduplication
- Use batch operations where appropriate (e.g., AnalyticsService)

### Memory Management

- Always clean up blob URLs with `BlobUrlManagerService`
- Use `DestroyRef` or implement `ngOnDestroy()` for cleanup
- Clear timers/intervals in cleanup methods
- Avoid memory leaks in event listeners
- Unregister keyboard shortcuts in `ngOnDestroy()`

### Concurrency & Race Conditions

- Use flags to prevent concurrent operations (e.g., `isSendingBatch`)
- Set flags BEFORE modifying shared state
- Use finally blocks to guarantee flag reset
- Example:
```typescript
if (this.isProcessing) return;
this.isProcessing = true;
try {
  // Critical section
} finally {
  this.isProcessing = false;
}
```

### Accessibility & User Safety

- Follow WCAG 2.1 AA standards
- Use semantic HTML elements
- Add proper ARIA labels and roles
- Support keyboard navigation via `KeyboardShortcutsService`
- Register shortcuts in `ngOnInit()`, unregister in `ngOnDestroy()`
- **Always confirm destructive actions**: Add confirmation dialogs for delete operations
- Provide clear, actionable error messages to users
- Include counts and status in feedback messages

## Testing

### Unit Tests (Jest)

- Place tests in `__tests__` directories or adjacent `.spec.ts` files
- Mock dependencies with Jest mocks
- Test public API only, not implementation details
- Use `TestBed` for Angular component testing
- Example test file naming: `feature.service.spec.ts`
- Current coverage: 161/165 tests passing

### E2E Tests

- Playwright tests in `playwright/` directory
- Cypress tests in `cypress/` directory
- Test critical user flows
- Use page object pattern for maintainability

## API Integration

### Pollinations AI

- Use `PollinationsClient` service for all API calls
- Never hardcode API endpoints
- Handle rate limiting with `RequestQueue`
- Cache responses when appropriate with `RequestCacheService`

### Google Gemini

- Use via `@google/genai` package
- API keys stored securely in settings service, never logged
- Use for prompt enhancement only

## Security Best Practices

- **Input Validation**: Use `ValidationService` for all user inputs
- **XSS Prevention**: Sanitize HTML with `sanitize-html` library
- **API Key Security**: Store in settings service, never in code or logs
- **Rate Limiting**: Implement client-side rate limiting
- **Content Security**: Be cautious with user-generated content
- **File Size Validation**: Use named constants (e.g., `MAX_IMPORT_FILE_SIZE`)
- **CI/CD Security**: CodeQL scanning enabled, dependency auditing in place

## Styling with Tailwind CSS

- Use utility classes over custom CSS
- Follow mobile-first responsive design
- Use Tailwind's color palette and spacing scale
- Dark mode support using Tailwind's `dark:` variants
- Custom configuration in `tailwind.config.js`

## Build and Development

### Commands

- `npm start` - Development server (port 4200)
- `npm run build` - Production build
- `npm test` - Run Jest unit tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run e2e` - Run Playwright tests with UI

### Environment Configuration

- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts`
- Use `ConfigService` to access environment variables
- Never commit API keys or secrets

### CI/CD Pipelines

- All workflows use `npm ci --legacy-peer-deps` for Angular 20 compatibility
- `.npmrc` configured with `legacy-peer-deps=true`
- Workflows include: lint, test, build, e2e, security scanning, bundle analysis
- ESLint workflow scans: `src/**/*.{ts,html}`, `*.js`, `scripts/*.js`

## Common Patterns

### Loading States

Use `createLoadingState()` helper:
```typescript
readonly loadingState = createLoadingState();
readonly loading = computed(() => this.loadingState.loading());

await this.loadingState.execute(async () => {
  // Your async operation
});
```

### Toast Notifications

Use `ToastService` for user feedback:
```typescript
this.toastService.show('Operation successful', 'success');
this.toastService.show('Operation failed', 'error');
```

### Lazy Loading Images

Use `LazyImageDirective`:
```html
<img lazyImage [src]="imageUrl" [alt]="description" />
```

### Keyboard Shortcuts

Register in `ngOnInit()`, unregister in `ngOnDestroy()`:
```typescript
ngOnInit(): void {
  this.keyboardShortcuts.registerDefaultShortcuts({
    save: () => void this.save(),
    delete: () => this.confirmAndDelete(),
  });
}

ngOnDestroy(): void {
  this.keyboardShortcuts.unregister('save');
  this.keyboardShortcuts.unregister('delete');
}
```

### Import/Export Operations

- Validate file size with named constant
- Use continue-on-error strategy for batch operations
- Track imported, failed, and skipped counts separately
- Provide comprehensive feedback: "Import complete! Added X, failed Y, skipped Z"

## Project Structure

```
src/
├── components/          # UI components (all standalone)
│   ├── collections/    # Collection management
│   ├── editor/         # Image editing
│   ├── feed/           # Community feed
│   ├── gallery/        # User gallery with keyboard shortcuts
│   ├── settings/       # App settings with import/export
│   ├── shortcuts-help/ # Keyboard shortcuts help overlay
│   ├── skeleton/       # Loading skeletons
│   ├── toast/          # Notifications
│   └── wizard/         # Generation wizard
├── directives/         # Custom directives (LazyImageDirective)
├── services/           # Business logic and utilities
│   ├── analytics.service.ts      # Batch event tracking
│   ├── keyboard-shortcuts.service.ts
│   ├── logger.service.ts
│   └── ...
├── utils/              # Utility functions
│   ├── component-helpers.ts  # createLoadingState()
│   └── reactive-patterns.ts
├── types/              # TypeScript type definitions
└── environments/       # Environment configs
```

## Git Workflow

- Follow conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Keep PRs focused and small
- Run linting and tests before committing
- Update documentation for significant changes
- Breaking changes should include migration guide in comments

## Documentation

- Document complex algorithms and business logic
- Use JSDoc for public APIs with `@breaking-change` annotations
- Include migration guides for breaking changes
- Keep README.md up to date
- Architecture changes go in ARCHITECTURE.md
- Development processes in DEVELOPMENT.md

## Performance Targets

- Initial bundle: < 3 MB (current: ~963 KB)
- Time to Interactive: < 3s on 3G
- Lighthouse score: > 90
- Core Web Vitals: All "Good"

## Avoid

- ❌ Using `any` type without justification
- ❌ Console.log in production code (use LoggerService)
- ❌ Inline styles (use Tailwind classes)
- ❌ NgModules (all components are standalone)
- ❌ Direct signal references for derived state (use `computed()`)
- ❌ Mutable state without Signals
- ❌ Memory leaks (always clean up resources)
- ❌ Magic numbers (extract to named constants)
- ❌ Direct DOM manipulation (use Angular's renderer or ViewChild)
- ❌ Async operations in constructors (use ngOnInit)
- ❌ Destructive actions without confirmation
- ❌ Silent failures (always inform users of outcomes)

## When Adding New Features

1. Check if existing services can be extended
2. Follow the established patterns in similar components
3. Add proper error handling with finally blocks for cleanup
4. Include loading and error states in UI
5. Add confirmation dialogs for destructive actions
6. Use `computed()` for all derived state
7. Register keyboard shortcuts in `ngOnInit()`, unregister in `ngOnDestroy()`
8. Add unit tests for services and E2E tests for flows
9. Update relevant documentation with migration guides if breaking
10. Consider performance, accessibility, and user safety impact
11. Extract magic numbers to named constants
12. Use `void` prefix for fire-and-forget async operations
13. Run full lint and test suite before PR

## Breaking Changes & Migrations

When introducing breaking changes:
1. Document with `@breaking-change v{version}` in JSDoc
2. Include migration guide in comments
3. Reference commit where all call sites were updated
4. Example:
```typescript
/**
 * @breaking-change v2.0.0 - Signature changed from Promise<T> to () => Promise<T>
 * Migration: Change execute(promise) to execute(() => promise)
 * All internal call sites updated in commit c5ccab5
 */
```

## Questions or Clarifications

For architectural decisions or patterns not covered here, refer to:
- ARCHITECTURE.md - System design and patterns
- DEVELOPMENT.md - Development setup and workflows
- API_DOCUMENTATION.md - API references
- Or ask the team in GitHub Discussions

## Recent Improvements (Latest PR #93)

This repository has recently undergone comprehensive quality improvements:
- ✅ All components migrated to standalone architecture
- ✅ Import/export gallery functionality complete
- ✅ Keyboard shortcuts integrated across all major components
- ✅ Analytics batch sending with race condition protection
- ✅ CI/CD pipelines fully operational with Angular 20 support
- ✅ Loading states use computed() for reactivity
- ✅ User safety confirmations for destructive actions
- ✅ Comprehensive error reporting in batch operations
- ✅ Memory leak prevention with proper cleanup
- ✅ All magic numbers extracted to constants

Follow these established patterns when adding new features.
