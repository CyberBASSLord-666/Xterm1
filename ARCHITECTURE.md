# PolliWall Architecture Documentation

> **Regenerated during Operation Bedrock Phase 1.2**  
> **Lead Architect + Technical Scribe**  
> **Date**: 2025-11-08

---

## Executive Summary

PolliWall is a production-grade, AI-powered wallpaper generation application built with Angular 21.0. It leverages the Pollinations AI API for image generation and Google Gemini for prompt enhancement. The architecture follows strict Angular best practices with standalone components, OnPush change detection, Signal-based state management, and a comprehensive service infrastructure.

**Key Architectural Principles:**
- **Angular 20 Standalone Architecture**: 100% standalone components, no NgModules
- **Signal-Based Reactivity**: All state managed with Angular Signals
- **OnPush Change Detection**: Optimal performance across all components
- **Service-Oriented Design**: Comprehensive core services for logging, error handling, validation
- **Type Safety**: TypeScript 5.9.3 strict mode, zero `any` types
- **Progressive Web App**: Service worker enabled with offline capabilities

---

## Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Angular** | 21.0 | Frontend framework with standalone components |
| **TypeScript** | 5.9.3 | Type-safe language with strict mode |
| **RxJS** | 7.8.0 | Reactive programming (minimal use, Signals preferred) |
| **Zone.js** | 0.15.0 | Change detection mechanism |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.0.0-alpha.16 | Utility-first CSS framework |
| **PostCSS** | 8.4.38 | CSS processing pipeline |
| **Autoprefixer** | 10.4.19 | CSS vendor prefixing |

### Data & Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| **IndexedDB** | Native | Client-side storage |
| **idb** | 8.0.0 | IndexedDB wrapper library |
| **JSZip** | 3.10.1 | Export/import functionality |

### AI & APIs
| Technology | Version | Purpose |
|------------|---------|---------|
| **@google/genai** | 1.27.0 | Google Gemini AI integration |
| **Pollinations AI** | API | Image generation endpoint |

### Security
| Technology | Version | Purpose |
|------------|---------|---------|
| **sanitize-html** | 2.17.0 | XSS prevention (5-layer defense) |
| **@types/sanitize-html** | 2.16.0 | Type definitions |

### Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| **Jest** | 30.2.0 | Unit testing framework |
| **jest-preset-angular** | 15.0.3 | Angular Jest configuration |
| **Playwright** | 1.45.0 | End-to-end testing |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 8.57.0 | Code linting |
| **Prettier** | 3.2.0 | Code formatting |
| **Husky** | 9.1.7 | Git hooks |
| **lint-staged** | 16.2.6 | Pre-commit checks |

---

## Application Architecture

### High-Level Structure

```
PolliWall Application
│
├── Root Component (AppComponent)
│   ├── Router Outlet (Lazy-loaded routes)
│   ├── Toast Notifications
│   └── Keyboard Shortcuts Help
│
├── Core Services Layer (Injectable: root)
│   ├── Logging & Monitoring
│   ├── Error Handling
│   ├── Validation & Security
│   ├── Performance Tracking
│   └── State Management
│
├── Feature Modules (Lazy-loaded)
│   ├── Wizard (Image Generation)
│   ├── Gallery (Image Management)
│   ├── Collections (Organization)
│   ├── Feed (Community)
│   ├── Editor (Image Editing)
│   └── Settings (Configuration)
│
└── Infrastructure
    ├── IndexedDB (Persistent Storage)
    ├── Service Worker (PWA)
    └── External APIs (Pollinations, Gemini)
```

### Directory Structure

```
src/
├── app.component.ts          # Root component (standalone)
├── app.routes.ts             # Route definitions
├── main.ts                   # Bootstrap entry point
│
├── components/               # Feature components (all standalone)
│   ├── wizard/              # Image generation wizard
│   ├── gallery/             # User gallery with filters
│   ├── collections/         # Collection management
│   ├── feed/                # Community feed
│   ├── editor/              # Image editing canvas
│   ├── settings/            # App configuration
│   ├── shortcuts-help/      # Keyboard shortcuts overlay
│   ├── skeleton/            # Loading skeleton UI
│   └── toast/               # Toast notifications
│
├── services/                # Core service layer
│   ├── logger.service.ts           # Centralized logging
│   ├── error-handler.service.ts    # Error management
│   ├── validation.service.ts       # Input validation & XSS prevention
│   ├── analytics.service.ts        # Event tracking
│   ├── performance-monitor.service.ts  # Performance metrics
│   ├── keyboard-shortcuts.service.ts   # Keyboard navigation
│   ├── blob-url-manager.service.ts     # Memory leak prevention
│   ├── gallery.service.ts          # Gallery operations
│   ├── generation.service.ts       # Image generation
│   ├── settings.service.ts         # User preferences
│   ├── toast.service.ts            # Notifications
│   ├── device.service.ts           # Device detection
│   ├── image-util.service.ts       # Image processing
│   ├── request-cache.service.ts    # API caching
│   ├── config.service.ts           # Configuration
│   ├── auth.service.ts             # Authentication (future)
│   ├── accessibility.service.ts    # A11y features
│   ├── app-initializer.service.ts  # App startup
│   ├── global-error-handler.service.ts  # Global error handler
│   ├── pollinations.client.ts      # API client
│   └── idb.ts                      # IndexedDB wrapper
│
├── directives/              # Custom directives
│   └── lazy-image.directive.ts   # Lazy loading images
│
├── utils/                   # Utility functions
│   ├── component-helpers.ts       # Component utilities
│   ├── reactive-patterns.ts       # Signal patterns
│   └── type-guards.ts             # Type safety guards
│
├── types/                   # TypeScript type definitions
│   └── utility.types.ts          # Shared types
│
├── constants/               # Application constants
│   └── index.ts                  # Exported constants
│
└── environments/            # Environment configurations
    ├── environment.ts            # Development config
    └── environment.prod.ts       # Production config
```

---

## Core Services Architecture

### Service Categories

PolliWall employs a comprehensive service architecture with 21 core services organized into functional categories:

#### 1. Foundation Services (Mandatory Integration)

**LoggerService** (`logger.service.ts`)
- **Purpose**: Centralized logging with configurable log levels
- **Pattern**: All logging must go through this service (no console.log)
- **Features**: Log history, export capability, DEBUG/INFO/WARN/ERROR levels

**ErrorHandlerService** (`error-handler.service.ts`)
- **Purpose**: User-friendly error handling and notifications
- **Pattern**: All errors must be processed through this service
- **Features**: Error categorization, user messaging, analytics integration

**ValidationService** (`validation.service.ts`)
- **Purpose**: Input validation and XSS prevention (5-layer defense)
- **Pattern**: All user inputs must be validated
- **Features**: Prompt validation, URL validation, HTML sanitization, seed validation

#### 2. Performance & Monitoring Services

**PerformanceMonitorService** (`performance-monitor.service.ts`)
- **Purpose**: Track application performance metrics
- **Pattern**: Wrap critical operations with measureAsync/measureSync
- **Features**: Timing metrics, performance profiling, bottleneck identification

**AnalyticsService** (`analytics.service.ts`)
- **Purpose**: Event tracking with batch sending
- **Pattern**: Track all significant user actions
- **Features**: Google Analytics 4 integration, batch events, GDPR compliance

**RequestCacheService** (`request-cache.service.ts`)
- **Purpose**: API response caching and deduplication
- **Pattern**: Use for repeated API calls
- **Features**: TTL-based expiration, memory management, cache invalidation

#### 3. Resource Management Services

**BlobUrlManagerService** (`blob-url-manager.service.ts`)
- **Purpose**: Prevent memory leaks from blob URLs
- **Pattern**: All URL.createObjectURL calls must be managed
- **Features**: Automatic cleanup, DestroyRef integration, resource tracking

**ImageUtilService** (`image-util.service.ts`)
- **Purpose**: Image processing and optimization
- **Pattern**: Use for thumbnails, compression, format conversion
- **Features**: Canvas-based processing, quality control, size optimization

#### 4. User Experience Services

**KeyboardShortcutsService** (`keyboard-shortcuts.service.ts`)
- **Purpose**: Keyboard navigation and accessibility
- **Pattern**: Register shortcuts in ngOnInit, unregister in ngOnDestroy
- **Features**: Global shortcuts, component-specific shortcuts, help overlay

**ToastService** (`toast.service.ts`)
- **Purpose**: User notifications and feedback
- **Pattern**: Use for all user-facing messages
- **Features**: Success/error/info types, auto-dismiss, queue management

**AccessibilityService** (`accessibility.service.ts`)
- **Purpose**: WCAG 2.1 AA compliance features
- **Pattern**: Integrate for accessible UI
- **Features**: Screen reader support, keyboard navigation, focus management

#### 5. Feature Services

**GalleryService** (`gallery.service.ts`)
- **Purpose**: Gallery CRUD operations with IndexedDB
- **Pattern**: Single source of truth for gallery data
- **Features**: Pagination, filtering, favorites, export/import

**GenerationService** (`generation.service.ts`)
- **Purpose**: Image generation workflow
- **Pattern**: Coordinate with PollinationsClient
- **Features**: Status tracking, progress signals, error recovery

**SettingsService** (`settings.service.ts`)
- **Purpose**: User preferences and configuration
- **Pattern**: Persist to localStorage with Signals
- **Features**: Theme, generation options, keyboard shortcuts preferences

#### 6. Infrastructure Services

**ConfigService** (`config.service.ts`)
- **Purpose**: Environment configuration and secrets
- **Pattern**: Access env variables through this service
- **Features**: API key management, environment detection

**DeviceService** (`device.service.ts`)
- **Purpose**: Device capability detection
- **Pattern**: Use for responsive behavior
- **Features**: Screen size, pixel ratio, touch support

**AppInitializerService** (`app-initializer.service.ts`)
- **Purpose**: Application startup logic
- **Pattern**: Run on app bootstrap
- **Features**: Service initialization, health checks

**GlobalErrorHandler** (`global-error-handler.service.ts`)
- **Purpose**: Angular's global error handler integration
- **Pattern**: Automatic Angular error interception
- **Features**: Integration with ErrorHandlerService, analytics

---

## Component Architecture

### Component Standards

**All components in PolliWall follow these mandatory patterns:**

1. **Standalone Components**: No NgModule imports
```typescript
@Component({
  selector: 'pw-feature',
  standalone: true,
  imports: [CommonModule, FormsModule, /* ... */],
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

2. **OnPush Change Detection**: Optimal performance
3. **Signal-Based State**: All reactive state uses Signals
4. **Computed Derived State**: All derived values use `computed()`
5. **Proper Lifecycle**: Initialization in `ngOnInit()`, cleanup in `ngOnDestroy()`
6. **Dependency Injection**: Use `inject()` function

### Component Catalog

#### Wizard Component (`wizard.component.ts`)
- **Route**: `/` (default)
- **Purpose**: AI image generation interface
- **State**: Prompt, model selection, image-to-image source, generation status
- **Services**: GenerationService, SettingsService, DeviceService
- **Features**: Prompt enhancement, style presets, exact-fit sizing, seed control

#### Gallery Component (`gallery.component.ts`)
- **Route**: `/gallery`
- **Purpose**: User's saved images with filtering
- **State**: Gallery items, filters (model, aspect, date), selection mode
- **Services**: GalleryService, KeyboardShortcutsService
- **Features**: Multi-select, delete, export, keyboard shortcuts, search

#### Collections Component (`collections.component.ts`)
- **Route**: `/collections`
- **Purpose**: Organize images into collections
- **State**: Collections list, items per collection
- **Services**: GalleryService
- **Features**: Create/rename/delete collections, drag-drop (future)

#### Feed Component (`feed.component.ts`)
- **Route**: `/feed`
- **Purpose**: Community-generated images (future feature)
- **State**: Feed items, filters
- **Services**: (Future) FeedService
- **Features**: Infinite scroll, like/save, discover prompts

#### Editor Component (`editor.component.ts`)
- **Route**: `/edit/:id`
- **Purpose**: Image editing canvas
- **State**: Canvas state, editing tools, filters
- **Services**: GalleryService, ImageUtilService
- **Features**: Crop, rotate, filters, text overlay (future)

#### Settings Component (`settings.component.ts`)
- **Route**: `/settings`
- **Purpose**: Application configuration
- **State**: Settings signals from SettingsService
- **Services**: SettingsService, ValidationService
- **Features**: Theme, API keys, defaults, export/import gallery

#### Support Components

**ToastComponent** (`toast.component.ts`)
- Reactive notification display
- Auto-dismiss with countdown
- Success/error/info styling

**ShortcutsHelpComponent** (`shortcuts-help.component.ts`)
- Keyboard shortcuts overlay
- Context-aware help
- Accessible with '?' key

**SkeletonComponent** (`skeleton.component.ts`)
- Loading state placeholder
- Customizable dimensions
- Smooth transitions

---

## State Management

### Signal-Based Architecture

PolliWall uses Angular Signals exclusively for state management:

**Principles:**
1. **Writable Signals**: Private, updated via `.set()` or `.update()`
2. **Readonly Signals**: Public API, use `.asReadonly()`
3. **Computed Signals**: All derived state uses `computed()`
4. **Effects**: Minimal use, only for side effects

**Pattern Example:**
```typescript
export class FeatureService {
  // Private writable signal
  private readonly _items = signal<Item[]>([]);
  
  // Public readonly signal
  readonly items = this._items.asReadonly();
  
  // Computed derived state
  readonly itemCount = computed(() => this._items().length);
  
  // Immutable updates
  addItem(item: Item): void {
    this._items.update(items => [...items, item]);
  }
}
```

### Loading State Pattern

Standard pattern using `createLoadingState()` helper:

```typescript
readonly loadingState = createLoadingState();
readonly loading = computed(() => this.loadingState.loading());
readonly error = computed(() => this.loadingState.error());

async performAction(): Promise<void> {
  await this.loadingState.execute(async () => {
    // Operation automatically wrapped with loading/error state
  });
}
```

---

## Routing Architecture

### Lazy Loading Strategy

All feature routes are lazy-loaded for optimal performance:

```typescript
{
  path: 'feature',
  loadComponent: () => 
    import('./components/feature/feature.component')
      .then(m => m.FeatureComponent),
  title: 'PolliWall – Feature'
}
```

**Routes:**
- `/` - Wizard (default, image generation)
- `/gallery` - Gallery (saved images)
- `/collections` - Collections (organization)
- `/feed` - Feed (community, future)
- `/edit/:id` - Editor (image editing)
- `/settings` - Settings (configuration)
- `/**` - Redirect to root

---

## Data Flow Architecture

### Image Generation Flow

```
User Input (Wizard)
  ↓
ValidationService (sanitize prompt)
  ↓
GenerationService (coordinate)
  ↓
PollinationsClient (API call)
  ↓
BlobUrlManagerService (manage blob URL)
  ↓
GalleryService (save to IndexedDB)
  ↓
Gallery Display
```

### Error Handling Flow

```
Error Occurs
  ↓
GlobalErrorHandler (catch)
  ↓
ErrorHandlerService (process)
  ↓  ↓
LoggerService (log)  ToastService (notify user)
  ↓
AnalyticsService (track)
```

---

## Security Architecture

### Defense-in-Depth Layers

**Layer 1: Input Validation** (ValidationService)
- All user inputs validated
- Type checking, length limits, format validation

**Layer 2: XSS Prevention** (5-layer sanitization)
- sanitize-html library (strict config)
- Event handler removal (regex patterns)
- Dangerous protocol blocking
- CSS pattern sanitization
- Navigation tag removal

**Layer 3: Security Headers**
- Content-Security-Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

**Layer 4: Memory Safety**
- Blob URL lifecycle management (BlobUrlManagerService)
- Proper resource cleanup in ngOnDestroy
- No memory leaks

**Layer 5: API Security**
- API key storage (ConfigService, not in code)
- Rate limiting (client-side)
- Request caching (deduplication)

---

## Performance Architecture

### Optimization Strategies

**1. Change Detection Optimization**
- OnPush strategy on all components
- Signal-based reactivity (no zone.js pollution)
- Computed values (no template recalculation)

**2. Code Splitting**
- Lazy-loaded routes
- Dynamic imports for large dependencies
- Tree-shaking enabled

**3. Asset Optimization**
- Lazy image loading (LazyImageDirective)
- Image compression (ImageUtilService)
- Service worker caching

**4. Monitoring**
- Performance metrics (PerformanceMonitorService)
- Core Web Vitals tracking
- Bundle size monitoring

---

## Testing Architecture

### Test Strategy

**Unit Tests (Jest)**
- 165 tests across services and components
- Mock dependencies with Jest
- Test public API, not implementation
- Coverage thresholds: 50% (all metrics)

**E2E Tests (Playwright)**
- Multi-browser (Chromium, Firefox, WebKit)
- Mobile device emulation
- Accessibility testing
- Visual regression testing

**Test Organization:**
```
src/
├── __tests__/           # Root-level tests
├── services/__tests__/  # Service tests
└── components/__tests__/ # Component tests
```

---

## Build Architecture

### Build Configuration

**Development Build:**
- Source maps enabled
- No optimization
- Hot module replacement
- Fast incremental builds

**Production Build:**
- Full optimization
- Minification
- Tree shaking
- Service worker generation
- Bundle budgets enforced

**Build Tools:**
- Angular CLI with esbuild
- Tailwind CSS JIT compiler
- PostCSS optimization
- Asset fingerprinting

---

## Deployment Architecture

### Progressive Web App (PWA)

**Service Worker Strategy:**
- Cache-first for static assets
- Network-first for API calls
- Background sync for offline actions

**Manifest:**
- Install prompts
- App icons (multiple sizes)
- Theme colors
- Display mode: standalone

### Deployment Targets

**Primary: GitHub Pages**
- Automated deployment via Actions
- CDN distribution
- Custom domain support

**Alternative Targets:**
- Vercel (configured)
- Netlify (ready)
- Custom server (Nginx config provided)

---

## Accessibility Architecture

### WCAG 2.1 AA Compliance

**Features:**
- Keyboard navigation (KeyboardShortcutsService)
- Screen reader support
- ARIA labels and roles
- Focus management
- Color contrast compliance
- Semantic HTML

**Keyboard Shortcuts:**
- `?` - Show help overlay
- `Ctrl/Cmd + S` - Save current state
- `Ctrl/Cmd + K` - Search
- `Delete` - Delete selected items
- `Escape` - Close modals/cancel actions

---

## Future Architecture Considerations

### Planned Enhancements

**1. Server-Side Rendering (SSR)**
- Angular Universal integration
- Improved initial load performance
- SEO optimization

**2. Real-Time Collaboration**
- WebSocket integration
- Shared collections
- Live feed updates

**3. Advanced Image Editing**
- More sophisticated editor
- Layer support
- Filters and effects

**4. Mobile Native Apps**
- Capacitor integration
- iOS and Android builds
- Native camera integration

---

## Appendix: Best Practices Summary

### Component Best Practices
- ✅ Standalone components
- ✅ OnPush change detection
- ✅ Signal-based state
- ✅ Computed derived state
- ✅ Proper lifecycle hooks
- ✅ TypeScript strict mode

### Service Best Practices
- ✅ Injectable providedIn: 'root'
- ✅ Single responsibility
- ✅ Dependency injection
- ✅ Comprehensive error handling
- ✅ Logging integration
- ✅ Performance monitoring

### Code Quality Best Practices
- ✅ No `any` types
- ✅ Explicit return types
- ✅ Immutable state updates
- ✅ Memory leak prevention
- ✅ Comprehensive testing
- ✅ ESLint compliance

---

*This architecture document is maintained as the definitive source of truth for the PolliWall codebase.*
*Last Updated: 2025-11-08 | Operation Bedrock Phase 1.2*
- **Styling**: Tailwind CSS 4.x
- **State Management**: Angular Signals
- **Storage**: IndexedDB (via idb library)
- **Service Worker**: @angular/service-worker
- **AI APIs**: 
  - Pollinations AI (image generation)
  - Google Gemini (prompt enhancement)

## Project Structure

```
src/
├── components/           # Angular components
│   ├── collections/      # Collection management
│   ├── editor/          # Image editing interface
│   ├── feed/            # Community feed
│   ├── gallery/         # User gallery
│   ├── settings/        # Application settings
│   ├── skeleton/        # Loading skeleton screens
│   ├── toast/           # Toast notifications
│   └── wizard/          # Wallpaper generation wizard
├── directives/          # Custom Angular directives
│   └── lazy-image.directive.ts  # Lazy loading images
├── services/            # Business logic and utilities
│   ├── auth.service.ts           # Authentication
│   ├── blob-url-manager.service.ts  # Memory management
│   ├── config.service.ts         # Configuration management
│   ├── device.service.ts         # Device detection
│   ├── error-handler.service.ts  # Error handling
│   ├── gallery.service.ts        # Gallery operations
│   ├── generation.service.ts     # Image generation
│   ├── idb.ts                    # IndexedDB wrapper
│   ├── image-util.service.ts     # Image utilities
│   ├── keyboard-shortcuts.service.ts  # Keyboard shortcuts
│   ├── logger.service.ts         # Logging
│   ├── performance-monitor.service.ts  # Performance tracking
│   ├── pollinations.client.ts    # API client
│   ├── request-cache.service.ts  # Request caching
│   ├── settings.service.ts       # User settings
│   ├── toast.service.ts          # Toast notifications
│   └── validation.service.ts     # Input validation
├── types/               # TypeScript type definitions
│   └── api.types.ts     # API response types
└── environments/        # Environment configurations
    ├── environment.ts         # Development config
    └── environment.prod.ts    # Production config
```

## Core Services

### 1. Pollinations Client (`pollinations.client.ts`)

The central API client that handles all communication with the Pollinations AI service.

**Key Features**:
- Request queue with rate limiting
- Exponential backoff retry logic
- Request cancellation support
- Gemini integration for prompt enhancement

**Rate Limits**:
- Image generation: 1 request per 5 seconds
- Text generation: 1 request per 3 seconds

### 2. Gallery Service (`gallery.service.ts`)

Manages the user's wallpaper collection stored in IndexedDB.

**Key Features**:
- CRUD operations for gallery items
- Collection management
- Lineage tracking (variants and restyled images)
- Export/import functionality

### 3. Generation Service (`generation.service.ts`)

Orchestrates the wallpaper generation process.

**Key Features**:
- Generation status tracking
- Progress messages
- Result caching
- Automatic saving to gallery

### 4. Logger Service (`logger.service.ts`)

Centralized logging with configurable log levels.

**Log Levels**:
- DEBUG: Detailed debugging information
- INFO: General informational messages
- WARN: Warning messages
- ERROR: Error messages
- NONE: Disable logging

### 5. Error Handler Service (`error-handler.service.ts`)

Provides consistent error handling and user-friendly error messages.

**Features**:
- Automatic error logging
- User-friendly error messages
- Toast notification integration
- Error wrapping utilities

### 6. Performance Monitor Service (`performance-monitor.service.ts`)

Tracks application performance metrics.

**Features**:
- Operation timing
- Statistical analysis
- Web Vitals tracking
- Performance history

### 7. Request Cache Service (`request-cache.service.ts`)

Implements request caching and deduplication.

**Features**:
- TTL-based cache expiration
- Request deduplication
- Pattern-based invalidation
- Automatic cleanup

### 8. Validation Service (`validation.service.ts`)

Input validation and sanitization.

**Features**:
- Prompt validation
- URL validation
- Dimension validation
- XSS prevention

### 9. Blob URL Manager Service (`blob-url-manager.service.ts`)

Manages blob URLs to prevent memory leaks.

**Features**:
- Automatic URL creation and tracking
- Automatic cleanup
- Integration with Angular DestroyRef

### 10. Image Util Service (`image-util.service.ts`)

Advanced image processing utilities.

**Features**:
- Thumbnail generation
- Image compression
- Format conversion
- Placeholder creation
- Progressive loading support

### 11. Keyboard Shortcuts Service (`keyboard-shortcuts.service.ts`)

Manages application keyboard shortcuts.

**Features**:
- Global shortcut registration
- Modifier key support
- Input field awareness
- Help display

## Performance Optimizations

### 1. Lazy Loading

- **LazyImageDirective**: Uses Intersection Observer for lazy loading images
- **Route-based code splitting**: Components loaded on demand
- **Progressive image loading**: Placeholder → Thumbnail → Full image

### 2. Caching Strategy

**Service Worker Caching**:
- **App Shell**: Prefetch and cache all app resources
- **Images**: Performance strategy with 7-day TTL, 50 max entries
- **Text**: Freshness strategy with 1-hour TTL, 20 max entries
- **Models**: Performance strategy with 1-day TTL, 5 max entries

**Request Cache**:
- 5-minute default TTL
- Automatic request deduplication
- Pattern-based invalidation

### 3. Memory Management

- Automatic blob URL cleanup
- Component lifecycle integration
- Regular cache cleanup intervals

### 4. Bundle Optimization

- Tree-shaking enabled
- Code splitting by route
- Lazy loading of heavy dependencies
- OnPush change detection strategy

## Data Flow

### Image Generation Flow

```
User Input → Wizard Component
    ↓
Prompt Enhancement (optional) → Gemini API
    ↓
Generation Service → Pollinations API
    ↓
Image Processing → Image Util Service
    ↓
Storage → Gallery Service → IndexedDB
    ↓
Display → Gallery Component
```

### Error Handling Flow

```
Error Occurs → Error Handler Service
    ↓
    ├→ Logger Service (log error)
    ├→ Toast Service (notify user)
    └→ Performance Monitor (track failure)
```

## State Management

The application uses **Angular Signals** for reactive state management:

- **Signals**: Reactive values that automatically propagate changes
- **Computed Signals**: Derived values that update automatically
- **Effects**: Side effects that run when signals change

Example:
```typescript
status = signal<'idle' | 'generating'>('idle');
isLoading = computed(() => this.status() === 'generating');
```

## Security Considerations

### 1. Input Validation

- All user inputs are validated before use
- Prompt length and character restrictions
- URL format validation

### 2. XSS Prevention

- HTML sanitization for user content
- Content Security Policy headers
- Angular's built-in XSS protection

### 3. API Key Management

- API keys stored securely in ConfigService
- Never logged or exposed in errors
- Environment-based configuration

### 4. Rate Limiting

- Client-side rate limiting via request queues
- Prevents API abuse
- Exponential backoff on errors

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance (WCAG 2.1 AA)

## Testing Strategy

### Unit Tests
- Services: Business logic, state management
- Utilities: Image processing, validation

### Integration Tests
- Components: User interactions, data flow
- Services: API interactions, storage

### E2E Tests
- Critical workflows: Generation, gallery management
- User journeys: First-time user, power user

## Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- OnPush change detection for performance

### Commit Messages

Follow conventional commits format:
- `feat:` New features
- `fix:` Bug fixes
- `perf:` Performance improvements
- `docs:` Documentation changes
- `refactor:` Code refactoring

### Component Design

- **Standalone components**: All components are standalone
- **OnPush strategy**: Use OnPush for better performance
- **Smart/Dumb pattern**: Separate presentation and logic
- **Single responsibility**: Each component has one purpose

## Future Enhancements

### Planned Features

1. **Advanced Image Editing**
   - Crop, rotate, filters
   - Batch processing
   - Custom presets

2. **Collaboration**
   - Shared collections
   - Real-time collaboration
   - Comments and annotations

3. **Analytics**
   - Usage statistics
   - Popular styles
   - Performance metrics dashboard

4. **AI Improvements**
   - Custom model fine-tuning
   - Style transfer
   - Image upscaling

5. **Integration**
   - Cloud storage sync
   - Social media sharing
   - Wallpaper engines

## Troubleshooting

### Common Issues

**Build Errors**:
- Ensure Node.js 18+ is installed
- Run `npm install` to update dependencies
- Clear `node_modules` and reinstall if issues persist

**API Errors**:
- Check API key configuration
- Verify network connectivity
- Check rate limits

**Performance Issues**:
- Clear browser cache and IndexedDB
- Check service worker status
- Monitor console for errors

### Debug Mode

Enable debug logging:
```typescript
// In app initialization
loggerService.setLogLevel(LogLevel.DEBUG);
```

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check the troubleshooting guide
- Review the API documentation

## License

See LICENSE file for details.
