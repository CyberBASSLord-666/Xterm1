# GitHub Copilot Instructions for PolliWall

## Project Overview

PolliWall is a professional AI-powered wallpaper generation application built with Angular 20. It leverages Pollinations AI for image generation and Google Gemini for prompt enhancement, with a focus on performance, accessibility, and user experience.

## Technology Stack

- **Framework**: Angular 20.x with standalone components
- **Language**: TypeScript 5.8.x (strict mode enabled)
- **Styling**: Tailwind CSS 4.x with utility-first approach
- **State Management**: Angular Signals (modern reactive state)
- **Storage**: IndexedDB via `idb` library
- **Service Worker**: @angular/service-worker for PWA capabilities
- **Testing**: Jest for unit tests, Playwright and Cypress for E2E tests
- **Build Tool**: Angular CLI with esbuild

## Code Style and Standards

### TypeScript

- **Strict mode is enabled** - all code must pass TypeScript strict checks
- Use explicit return types for functions (ESLint enforces this)
- Avoid `any` type - use proper typing or `unknown` with type guards
- Prefix unused parameters with underscore: `_paramName`
- Use modern ES2022+ features (async/await, optional chaining, nullish coalescing)
- Path alias `@/*` is configured for root imports

### Angular

- **Use standalone components** - no NgModule declarations
- **OnPush change detection** strategy for all components
- **Angular Signals** for state management (not RxJS Subjects for local state)
- Component selectors: Use `app-` or `pw-` prefix with kebab-case
- Directive selectors: Use `app` or `lazyImage` prefix with camelCase
- Inject dependencies via constructor or `inject()` function
- Use `DestroyRef` for cleanup instead of `ngOnDestroy` when possible

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
export class FeatureNameComponent {
  // Injected services
  private readonly service = inject(ServiceName);
  
  // Signals for reactive state
  readonly state = signal<StateType>(initialValue);
  readonly computed = computed(() => this.state() * 2);
  
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
  - `LoggerService` - for all logging (not console.log)
  - `ErrorHandlerService` - for error handling and user notifications
  - `ValidationService` - for input validation
  - `BlobUrlManagerService` - for managing blob URLs (memory leak prevention)
  - `PerformanceMonitorService` - for tracking performance metrics

### Error Handling

- Always use try-catch for async operations
- Log errors with `LoggerService.error()`
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
}
```

### File Naming Conventions

- Components: `feature-name.component.ts`
- Services: `feature-name.service.ts`
- Directives: `feature-name.directive.ts`
- Interfaces/Types: `feature-name.types.ts` or define in same file
- Tests: `feature-name.spec.ts` (Jest) or `feature-name.e2e.ts` (Playwright)

## Architecture Patterns

### State Management

- Use Angular Signals for local component state
- Use services with Signals for shared state
- Avoid RxJS for simple state - use for streams/events only
- Example:
```typescript
// In service
export class StateService {
  private readonly _items = signal<Item[]>([]);
  readonly items = this._items.asReadonly();
  
  addItem(item: Item): void {
    this._items.update(items => [...items, item]);
  }
}
```

### Performance Optimization

- Use lazy loading for routes and large components
- Implement `LazyImageDirective` for images
- Use `SkeletonComponent` for loading states
- Leverage service worker caching strategies
- Use `ImageUtilService` for image optimization (compression, format conversion)
- Enable `RequestCacheService` for deduplication

### Memory Management

- Always clean up blob URLs with `BlobUrlManagerService`
- Use `DestroyRef` or RxJS `takeUntilDestroyed()` for subscriptions
- Avoid memory leaks in event listeners

### Accessibility

- Follow WCAG 2.1 AA standards
- Use semantic HTML elements
- Add proper ARIA labels and roles
- Support keyboard navigation
- Test with `AccessibilityService`
- Use keyboard shortcuts via `KeyboardShortcutsService`

## Testing

### Unit Tests (Jest)

- Place tests in `__tests__` directories or adjacent `.spec.ts` files
- Mock dependencies with Jest mocks
- Test public API only, not implementation details
- Use `TestBed` for Angular component testing
- Example test file naming: `feature.service.spec.ts`

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
- API keys stored securely, never logged
- Use for prompt enhancement only

## Security Best Practices

- **Input Validation**: Use `ValidationService` for all user inputs
- **XSS Prevention**: Sanitize HTML with `sanitize-html` library
- **API Key Security**: Store in settings service, never in code or logs
- **Rate Limiting**: Implement client-side rate limiting
- **Content Security**: Be cautious with user-generated content

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

## Common Patterns

### Loading States

Use `SkeletonComponent` for content loading:
```typescript
<app-skeleton *ngIf="isLoading()" [type]="'card'"></app-skeleton>
<div *ngIf="!isLoading()">Content</div>
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

## Project Structure

```
src/
├── components/          # UI components (standalone)
│   ├── collections/    # Collection management
│   ├── editor/         # Image editing
│   ├── feed/           # Community feed
│   ├── gallery/        # User gallery
│   ├── settings/       # App settings
│   ├── skeleton/       # Loading skeletons
│   ├── toast/          # Notifications
│   └── wizard/         # Generation wizard
├── directives/         # Custom directives
├── services/           # Business logic and utilities
├── types/              # TypeScript type definitions
└── environments/       # Environment configs
```

## Git Workflow

- Follow conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Keep PRs focused and small
- Run linting and tests before committing
- Update documentation for significant changes

## Documentation

- Document complex algorithms and business logic
- Use JSDoc for public APIs
- Keep README.md up to date
- Architecture changes go in ARCHITECTURE.md
- Development processes in DEVELOPMENT.md

## Performance Targets

- Initial bundle: < 3 MB
- Time to Interactive: < 3s on 3G
- Lighthouse score: > 90
- Core Web Vitals: All "Good"

## Avoid

- ❌ Using `any` type without justification
- ❌ Console.log in production code (use LoggerService)
- ❌ Inline styles (use Tailwind classes)
- ❌ NgModules (use standalone components)
- ❌ Mutable state without Signals
- ❌ Memory leaks (always clean up resources)
- ❌ Hardcoded strings (use constants or configuration)
- ❌ Direct DOM manipulation (use Angular's renderer)

## When Adding New Features

1. Check if existing services can be extended
2. Follow the established patterns in similar components
3. Add proper error handling and logging
4. Include loading and error states in UI
5. Add unit tests for services and E2E tests for flows
6. Update relevant documentation
7. Consider performance and accessibility impact
8. Run full lint and test suite before PR

## Questions or Clarifications

For architectural decisions or patterns not covered here, refer to:
- ARCHITECTURE.md - System design and patterns
- DEVELOPMENT.md - Development setup and workflows
- API_DOCUMENTATION.md - API references
- Or ask the team in GitHub Discussions
