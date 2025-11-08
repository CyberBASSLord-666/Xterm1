# API Documentation

> **Regenerated during Operation Bedrock Phase 1.2**  
> **Lead Architect + Technical Scribe**  
> **Date**: 2025-11-08

---

## Table of Contents

1. [Foundation Services](#foundation-services)
   - [LoggerService](#loggerservice)
   - [ErrorHandlerService](#errorhandlerservice)
   - [ValidationService](#validationservice)
2. [Performance & Monitoring](#performance--monitoring)
   - [PerformanceMonitorService](#performancemonitorservice)
   - [AnalyticsService](#analyticsservice)
   - [RequestCacheService](#requestcacheservice)
3. [Resource Management](#resource-management)
   - [BlobUrlManagerService](#bloburlmanagerservice)
   - [ImageUtilService](#imageutilservice)
4. [User Experience](#user-experience)
   - [KeyboardShortcutsService](#keyboardshortcutsservice)
   - [ToastService](#toastservice)
   - [AccessibilityService](#accessibilityservice)
5. [Feature Services](#feature-services)
   - [GalleryService](#galleryservice)
   - [GenerationService](#generationservice)
   - [SettingsService](#settingsservice)
6. [Infrastructure](#infrastructure)
   - [ConfigService](#configservice)
   - [DeviceService](#deviceservice)
   - [AppInitializerService](#appinitializerservice)
   - [GlobalErrorHandler](#globalerrorhandler)
7. [API Clients](#api-clients)
   - [PollinationsClient](#pollinationsclient)
8. [Components](#components)
9. [Directives](#directives)
10. [Utilities](#utilities)

---

## Foundation Services

### LoggerService

**File**: `src/services/logger.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Centralized logging service with configurable log levels and history tracking.

#### Public API

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: unknown;
  source?: string;
}

class LoggerService {
  setLogLevel(level: LogLevel): void
  debug(message: string, data?: unknown, source?: string): void
  info(message: string, data?: unknown, source?: string): void
  warn(message: string, data?: unknown, source?: string): void
  error(message: string, error?: unknown, source?: string): void
  getHistory(): LogEntry[]
  clearHistory(): void
  exportLogs(): string
}
```

#### Usage Example

```typescript
import { inject } from '@angular/core';
import { LoggerService, LogLevel } from './services/logger.service';

export class MyComponent {
  private logger = inject(LoggerService);
  
  ngOnInit() {
    this.logger.setLogLevel(LogLevel.INFO);
    this.logger.info('Component initialized', { id: this.id }, 'MyComponent');
  }
  
  onError(error: Error) {
    this.logger.error('Operation failed', error, 'MyComponent');
  }
}
```

#### Best Practices

- ✅ Use appropriate log level for message importance
- ✅ Include source context (component/service name)
- ✅ Provide structured data in data parameter
- ❌ Never use `console.log` directly - always use LoggerService

---

### ErrorHandlerService

**File**: `src/services/error-handler.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Centralized error handling with logging and user notification.

#### Public API

```typescript
class AppError extends Error {
  constructor(
    message: string,
    code?: string,
    isUserFriendly?: boolean,
    details?: unknown
  )
}

class ErrorHandlerService {
  handleError(error: unknown, source: string, showToast?: boolean): void
  createAppError(message: string, code?: string, isUserFriendly?: boolean): AppError
}
```

#### Usage Example

```typescript
import { inject } from '@angular/core';
import { ErrorHandlerService, AppError } from './services/error-handler.service';

export class MyService {
  private errorHandler = inject(ErrorHandlerService);
  
  async performOperation(): Promise<void> {
    try {
      await this.riskyOperation();
    } catch (error) {
      // Logs error and shows toast notification
      this.errorHandler.handleError(error, 'MyService');
      throw error; // Re-throw if caller needs to handle
    }
  }
  
  validateInput(input: string): void {
    if (!input) {
      throw this.errorHandler.createAppError(
        'Input is required',
        'INVALID_INPUT',
        true // User-friendly message
      );
    }
  }
}
```

#### Best Practices

- ✅ Use for all error handling
- ✅ Provide source context
- ✅ Use AppError for user-facing errors
- ✅ Always use try-catch-finally for async operations

---

### ValidationService

**File**: `src/services/validation.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Input validation and XSS prevention with 5-layer defense-in-depth.

#### Public API

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

class ValidationService {
  // Validation methods
  validatePrompt(prompt: string): ValidationResult
  validateImageUrl(url: string): ValidationResult
  validateSeed(seed: number | undefined): ValidationResult
  validateDimensions(width: number, height: number): ValidationResult
  validateApiKey(key: string): ValidationResult
  
  // Sanitization methods (5-layer XSS prevention)
  sanitizeHtml(html: string): string
  sanitizeHtmlForAngular(html: string): string
  sanitizeUrl(url: string): string
}
```

#### Usage Example

```typescript
import { inject } from '@angular/core';
import { ValidationService } from './services/validation.service';

export class WizardComponent {
  private validation = inject(ValidationService);
  
  validateAndGenerate(prompt: string): void {
    const result = this.validation.validatePrompt(prompt);
    
    if (!result.isValid) {
      console.error('Validation errors:', result.errors);
      return;
    }
    
    // Safe to use prompt
    this.generate(prompt);
  }
  
  displayUserContent(html: string): void {
    // Always sanitize user-generated content
    this.safeHtml = this.validation.sanitizeHtml(html);
  }
}
```

#### 5-Layer XSS Defense

1. **sanitize-html library**: Strict tag/attribute filtering
2. **Event handler removal**: Strips all `on*` handlers
3. **Protocol blocking**: Blocks `javascript:`, `data:`, `vbscript:`
4. **CSS sanitization**: Removes dangerous CSS patterns
5. **Navigation tag removal**: Strips `<meta>`, `<link>`, `<base>`

#### Best Practices

- ✅ Validate ALL user inputs
- ✅ Check `isValid` before processing
- ✅ Display validation errors to users
- ✅ Sanitize HTML before using `innerHTML`
- ❌ Never trust user input without validation

---

## Performance & Monitoring

### PerformanceMonitorService

**File**: `src/services/performance-monitor.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Track and monitor application performance metrics.

#### Public API

```typescript
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
}

class PerformanceMonitorService {
  measureSync<T>(name: string, fn: () => T): T
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T>
  getMetrics(): PerformanceMetric[]
  clearMetrics(): void
  getAverageTime(name: string): number
}
```

#### Usage Example

```typescript
import { inject } from '@angular/core';
import { PerformanceMonitorService } from './services/performance-monitor.service';

export class ImageService {
  private perf = inject(PerformanceMonitorService);
  
  async generateImage(prompt: string): Promise<Blob> {
    return this.perf.measureAsync('image-generation', async () => {
      // Operation automatically timed
      return await this.api.generate(prompt);
    });
  }
  
  processImage(blob: Blob): ImageData {
    return this.perf.measureSync('image-processing', () => {
      return this.process(blob);
    });
  }
}
```

---

### AnalyticsService

**File**: `src/services/analytics.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Event tracking with batch sending and Google Analytics 4 integration.

#### Public API

```typescript
interface AnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean>;
}

class AnalyticsService {
  initialize(trackingId?: string): void
  trackPageView(path: string, title?: string): void
  trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): void
  trackImageGeneration(model: string, duration: number): void
  trackError(error: string, source: string): void
  trackFeatureUsage(feature: string, action: string): void
  trackInteraction(element: string, action: string): void
  flush(): void
  setEnabled(enabled: boolean): void
}
```

#### Usage Example

```typescript
import { inject } from '@angular/core';
import { AnalyticsService } from './services/analytics.service';

export class WizardComponent {
  private analytics = inject(AnalyticsService);
  
  async generateImage(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.generate();
      const duration = Date.now() - startTime;
      
      this.analytics.trackImageGeneration(this.model, duration);
      this.analytics.trackFeatureUsage('wizard', 'generate');
    } catch (error) {
      this.analytics.trackError(String(error), 'WizardComponent');
    }
  }
}
```

#### Best Practices

- ✅ Track significant user actions
- ✅ Include duration for performance tracking
- ✅ Respect GDPR (analytics disabled in dev mode)
- ✅ Use batch sending (automatic)

---

### RequestCacheService

**File**: `src/services/request-cache.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

HTTP request caching and deduplication.

#### Public API

```typescript
class RequestCacheService {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttl?: number): void
  has(key: string): boolean
  delete(key: string): void
  clear(): void
}
```

---

## Resource Management

### BlobUrlManagerService

**File**: `src/services/blob-url-manager.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Prevent memory leaks from blob URLs with automatic cleanup.

#### Public API

```typescript
class BlobUrlManagerService {
  createObjectURL(blob: Blob, destroyRef?: DestroyRef): string
  revokeObjectURL(url: string): void
  revokeAll(): void
}
```

#### Usage Example

```typescript
import { inject, DestroyRef } from '@angular/core';
import { BlobUrlManagerService } from './services/blob-url-manager.service';

export class ImageComponent implements OnInit {
  private blobManager = inject(BlobUrlManagerService);
  private destroyRef = inject(DestroyRef);
  
  imageUrl = signal<string>('');
  
  loadImage(blob: Blob): void {
    // Automatically cleaned up when component destroys
    const url = this.blobManager.createObjectURL(blob, this.destroyRef);
    this.imageUrl.set(url);
  }
}
```

#### Best Practices

- ✅ ALWAYS use BlobUrlManagerService for blob URLs
- ✅ Pass DestroyRef for automatic cleanup
- ✅ Call revokeObjectURL manually if not using DestroyRef
- ❌ Never use `URL.createObjectURL` directly

---

### ImageUtilService

**File**: `src/services/image-util.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Image processing, compression, and optimization.

#### Public API

```typescript
class ImageUtilService {
  createThumbnail(blob: Blob, maxWidth: number, maxHeight: number): Promise<Blob>
  compress(blob: Blob, quality: number): Promise<Blob>
  convertFormat(blob: Blob, format: 'image/jpeg' | 'image/png' | 'image/webp'): Promise<Blob>
  getDimensions(blob: Blob): Promise<{ width: number; height: number }>
}
```

---

## User Experience

### KeyboardShortcutsService

**File**: `src/services/keyboard-shortcuts.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Keyboard navigation and accessibility shortcuts.

#### Public API

```typescript
interface ShortcutConfig {
  [key: string]: () => void;
}

class KeyboardShortcutsService {
  register(key: string, handler: () => void, scope?: string): void
  unregister(key: string, scope?: string): void
  registerDefaultShortcuts(config: ShortcutConfig): void
  disable(): void
  enable(): void
}
```

#### Usage Example

```typescript
import { inject, OnInit, OnDestroy } from '@angular/core';
import { KeyboardShortcutsService } from './services/keyboard-shortcuts.service';

export class GalleryComponent implements OnInit, OnDestroy {
  private shortcuts = inject(KeyboardShortcutsService);
  
  ngOnInit(): void {
    this.shortcuts.registerDefaultShortcuts({
      'ctrl+s': () => this.save(),
      'delete': () => this.confirmDelete(),
      'escape': () => this.cancel(),
      '?': () => this.showHelp()
    });
  }
  
  ngOnDestroy(): void {
    this.shortcuts.unregister('ctrl+s');
    this.shortcuts.unregister('delete');
    this.shortcuts.unregister('escape');
    this.shortcuts.unregister('?');
  }
}
```

#### Best Practices

- ✅ Register shortcuts in `ngOnInit()`
- ✅ Unregister in `ngOnDestroy()`
- ✅ Use standard shortcuts (Ctrl+S, Delete, Escape)
- ✅ Provide '?' for help overlay

---

### ToastService

**File**: `src/services/toast.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

User notifications and feedback messages.

#### Public API

```typescript
type ToastType = 'success' | 'error' | 'info';

class ToastService {
  show(message: string, type?: ToastType, duration?: number): void
}
```

#### Usage Example

```typescript
import { inject } from '@angular/core';
import { ToastService } from './services/toast.service';

export class SaveComponent {
  private toast = inject(ToastService);
  
  async save(): Promise<void> {
    try {
      await this.saveData();
      this.toast.show('Saved successfully!', 'success');
    } catch (error) {
      this.toast.show('Save failed', 'error');
    }
  }
}
```

---

## Feature Services

### GalleryService

**File**: `src/services/gallery.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Gallery CRUD operations with IndexedDB persistence.

#### Public API

```typescript
interface GalleryItem {
  id: string;
  prompt: string;
  blobUrl: string;
  createdAt: Date;
  model?: string;
  aspect?: string;
  isFavorite?: boolean;
  collectionIds?: string[];
}

interface Collection {
  id: string;
  name: string;
  createdAt: Date;
  itemCount: number;
}

class GalleryService {
  // Gallery Items
  readonly items: Signal<GalleryItem[]>
  addItem(item: Omit<GalleryItem, 'id' | 'createdAt'>): Promise<GalleryItem>
  updateItem(id: string, updates: Partial<GalleryItem>): Promise<void>
  deleteItem(id: string): Promise<void>
  deleteItems(ids: string[]): Promise<void>
  getItem(id: string): Promise<GalleryItem | undefined>
  toggleFavorite(id: string): Promise<void>
  
  // Collections
  readonly collections: Signal<Collection[]>
  createCollection(name: string): Promise<Collection>
  renameCollection(id: string, name: string): Promise<void>
  deleteCollection(id: string): Promise<void>
  addToCollection(itemId: string, collectionId: string): Promise<void>
  removeFromCollection(itemId: string, collectionId: string): Promise<void>
  
  // Import/Export
  exportGallery(): Promise<Blob>
  importGallery(file: File): Promise<{ imported: number; failed: number }>
}
```

---

### GenerationService

**File**: `src/services/generation.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Coordinate image generation workflow.

#### Public API

```typescript
type GenerationStatus = 'idle' | 'generating' | 'saving' | 'error';

interface GenerationResult {
  blobUrl: string;
  prompt: string;
  model: string;
}

class GenerationService {
  readonly status: Signal<GenerationStatus>
  readonly statusMessage: Signal<string>
  readonly currentGenerationResult: Signal<GenerationResult | null>
  
  generate(prompt: string, options: ImageOptions): Promise<GenerationResult>
  saveToGallery(): Promise<void>
  reset(): void
}
```

---

### SettingsService

**File**: `src/services/settings.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

User preferences with localStorage persistence.

#### Public API

```typescript
class SettingsService {
  readonly themeDark: WritableSignal<boolean>
  readonly defaultModel: WritableSignal<string>
  readonly defaultQuality: WritableSignal<number>
  readonly geminiApiKey: WritableSignal<string>
  
  saveSettings(): void
  loadSettings(): void
  resetToDefaults(): void
  exportSettings(): string
  importSettings(json: string): void
}
```

---

## Infrastructure

### ConfigService

**File**: `src/services/config.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Environment configuration and secrets management.

#### Public API

```typescript
class ConfigService {
  readonly isProduction: boolean
  readonly apiEndpoint: string
  
  getApiKey(provider: string): string | undefined
  setApiKey(provider: string, key: string): void
}
```

---

### DeviceService

**File**: `src/services/device.service.ts`  
**Injectable**: `{ providedIn: 'root' }`

Device capability detection.

#### Public API

```typescript
interface DeviceInfo {
  width: number;
  height: number;
  pixelRatio: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

class DeviceService {
  getDeviceInfo(): DeviceInfo
  isTouchDevice(): boolean
}
```

---

## API Clients

### PollinationsClient

**File**: `src/services/pollinations.client.ts`

Main API client for Pollinations AI integration.

#### Public API

```typescript
interface ImageOptions {
  model?: string;
  seed?: number;
  enhance?: boolean;
  nologo?: boolean;
}

// Functions
function initializeGeminiClient(apiKey: string): void
function generateImage(prompt: string, width: number, height: number, options?: ImageOptions): Promise<Blob>
function enhancePrompt(prompt: string): Promise<string>
function listImageModels(): string[]
```

---

## Components

All components are standalone with OnPush change detection and Signal-based state.

### Component API Overview

| Component | Route | Purpose |
|-----------|-------|---------|
| **WizardComponent** | `/` | Image generation interface |
| **GalleryComponent** | `/gallery` | Saved images management |
| **CollectionsComponent** | `/collections` | Collection organization |
| **FeedComponent** | `/feed` | Community feed (future) |
| **EditorComponent** | `/edit/:id` | Image editing |
| **SettingsComponent** | `/settings` | App configuration |
| **ToastComponent** | N/A | Notification display |
| **ShortcutsHelpComponent** | N/A | Keyboard help overlay |
| **SkeletonComponent** | N/A | Loading placeholder |

---

## Directives

### LazyImageDirective

**File**: `src/directives/lazy-image.directive.ts`

Lazy load images with IntersectionObserver.

#### Usage

```html
<img lazyImage [src]="imageUrl" [alt]="description" />
```

---

## Utilities

### Component Helpers

**File**: `src/utils/component-helpers.ts`

```typescript
function createLoadingState(): LoadingState
function createSelectionState<T>(): SelectionState<T>
function createFormField<T>(initialValue: T): FormField<T>
```

### Type Guards

**File**: `src/utils/type-guards.ts`

```typescript
function isString(value: unknown): value is string
function isNumber(value: unknown): value is number
function isError(value: unknown): value is Error
function getErrorMessage(error: unknown): string
```

---

## Best Practices Summary

### Service Integration
- ✅ Inject services via constructor or `inject()` function
- ✅ Use LoggerService for all logging
- ✅ Use ErrorHandlerService for all errors
- ✅ Use ValidationService for all inputs
- ✅ Use BlobUrlManagerService for all blob URLs

### Component Patterns
- ✅ Standalone components only
- ✅ OnPush change detection
- ✅ Signal-based state
- ✅ computed() for derived state
- ✅ Register keyboard shortcuts in ngOnInit
- ✅ Unregister in ngOnDestroy

### Error Handling
- ✅ try-catch-finally for async operations
- ✅ Always use finally for cleanup (e.g., loading states)
- ✅ Log errors with context
- ✅ Show user-friendly messages

### Performance
- ✅ Wrap operations with PerformanceMonitorService
- ✅ Use RequestCacheService for repeated calls
- ✅ Lazy load components
- ✅ Optimize images with ImageUtilService

---

*This API documentation is the authoritative reference for all public-facing APIs in PolliWall.*  
*Last Updated: 2025-11-08 | Operation Bedrock Phase 1.2*

  1080,
  { model: 'flux', seed: 42 }
);
```

##### `composePromptForDevice(device: DeviceInfo, prefs: StylePreferences, options?: TextOptions): Promise<string>`

Compose a prompt optimized for a specific device using Gemini AI.

**Parameters**:
- `device` (DeviceInfo): Device dimensions and DPR
- `prefs` (StylePreferences): Style preferences and base prompt
- `options` (TextOptions): Optional text generation parameters

**Returns**: Promise<string> - The enhanced prompt

**Example**:
```typescript
const prompt = await composePromptForDevice(
  { width: 1920, height: 1080, dpr: 2 },
  { 
    styles: ['Vibrant colors', 'High contrast'],
    basePrompt: 'Mountain landscape'
  }
);
```

##### `composeVariantPrompt(basePrompt: string, options?: TextOptions): Promise<string>`

Generate a subtle variation of an existing prompt.

**Parameters**:
- `basePrompt` (string): The original prompt to vary
- `options` (TextOptions): Optional text generation parameters

**Returns**: Promise<string> - The variant prompt

**Example**:
```typescript
const variant = await composeVariantPrompt(
  'A sunset over mountains with warm colors'
);
```

##### `composeRestylePrompt(basePrompt: string, styleDirective: string, options?: TextOptions): Promise<string>`

Restyle an existing prompt with a new style directive.

**Parameters**:
- `basePrompt` (string): The original prompt
- `styleDirective` (string): The style to apply
- `options` (TextOptions): Optional text generation parameters

**Returns**: Promise<string> - The restyled prompt

**Example**:
```typescript
const restyled = await composeRestylePrompt(
  'A mountain landscape',
  'Golden hour warmth, cinematic'
);
```

##### `createDeviceWallpaper(params: WallpaperParams): Promise<WallpaperResult>`

Create a wallpaper optimized for a specific device.

**Parameters**:
- `device` (DeviceInfo): Device specifications
- `supported` (SupportedResolutions): Supported aspect ratios and resolutions
- `prompt` (string): Image generation prompt
- `options` (ImageOptions): Generation options

**Returns**: Promise<WallpaperResult> - Generated wallpaper details

**Example**:
```typescript
const result = await createDeviceWallpaper({
  device: { width: 1920, height: 1080, dpr: 2 },
  supported: { '16:9': [{ w: 1920, h: 1080 }] },
  prompt: 'Beautiful landscape',
  options: { model: 'flux' }
});
```

---

### App Initializer Service

**File**: `src/services/app-initializer.service.ts`

Application initialization service that handles startup configuration and service setup.

#### Methods

##### `initialize(): Promise<void>`

Initialize the application during bootstrap. Called automatically via APP_INITIALIZER.

**Initialization Steps**:
1. Sets log level based on environment (DEBUG for development, WARN for production)
2. Hydrates configuration from multiple sources (runtime config, meta tags, environment)
3. Starts request cache periodic cleanup
4. Initializes Gemini AI client if API key available
5. Initializes analytics if measurement ID available
6. Sets up keyboard shortcuts service
7. Logs Web Vitals metrics

**Configuration Sources** (in priority order):
1. Runtime configuration object: `window.__POLLIWALL_RUNTIME_CONFIG__`
2. HTML meta tags: `<meta name="gemini-api-key">` and `<meta name="analytics-measurement-id">`
3. Environment bootstrap configuration

**Production Fail-Fast**:
If `environment.bootstrapConfig.failOnMissingGeminiKey` is true and no Gemini API key is found in production, throws an error to prevent incomplete deployment.

**Example**:
```typescript
// In app.config.ts
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { AppInitializerService, initializeApp } from './services/app-initializer.service';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitializerService],
      multi: true
    }
  ]
};
```

**Runtime Configuration Example**:
```html
<!-- Inject configuration at runtime -->
<script>
  window.__POLLIWALL_RUNTIME_CONFIG__ = {
    geminiApiKey: 'your-api-key',
    analyticsMeasurementId: 'G-XXXXXXXXXX'
  };
</script>
```

**Meta Tag Configuration Example**:
```html
<!-- Inject secrets via meta tags -->
<meta name="gemini-api-key" content="your-api-key" />
<meta name="analytics-measurement-id" content="G-XXXXXXXXXX" />
```

##### `destroy(): void`

Cleanup method for application shutdown. Logs performance summary.

---

### Logger Service

**File**: `src/services/logger.service.ts`

Centralized logging service with configurable log levels.

#### Methods

##### `setLogLevel(level: LogLevel): void`

Set the minimum log level.

**Parameters**:
- `level` (LogLevel): Minimum level to log

**Log Levels**:
- `LogLevel.DEBUG` (0): Detailed debugging information
- `LogLevel.INFO` (1): General informational messages
- `LogLevel.WARN` (2): Warning messages
- `LogLevel.ERROR` (3): Error messages
- `LogLevel.NONE` (4): Disable logging

**Example**:
```typescript
loggerService.setLogLevel(LogLevel.DEBUG);
```

##### `debug(message: string, data?: any, source?: string): void`

Log a debug message.

##### `info(message: string, data?: any, source?: string): void`

Log an info message.

##### `warn(message: string, data?: any, source?: string): void`

Log a warning message.

##### `error(message: string, error?: any, source?: string): void`

Log an error message.

**Example**:
```typescript
logger.debug('User action', { action: 'click', target: 'button' }, 'Component');
logger.info('Generation started', { prompt: 'test' });
logger.warn('API rate limit approaching');
logger.error('Generation failed', error, 'GenerationService');
```

##### `getHistory(): LogEntry[]`

Get the log history.

##### `clearHistory(): void`

Clear the log history.

##### `exportLogs(): string`

Export logs as JSON string.

---

### Error Handler Service

**File**: `src/services/error-handler.service.ts`

Centralized error handling with user-friendly messages.

#### Methods

##### `handleError(error: any, source: string, showToast?: boolean): void`

Handle an error with logging and optional user notification.

**Parameters**:
- `error` (any): The error to handle
- `source` (string): Source component/service
- `showToast` (boolean): Whether to show toast notification (default: true)

**Example**:
```typescript
try {
  await riskyOperation();
} catch (error) {
  errorHandler.handleError(error, 'MyComponent');
}
```

##### `createError(message: string, code?: string, showToast?: boolean): AppError`

Create a user-friendly error.

**Example**:
```typescript
throw errorHandler.createError('Invalid input', 'VALIDATION_ERROR');
```

##### `wrapAsync<T>(operation: () => Promise<T>, source: string, showToast?: boolean): Promise<T | null>`

Wrap an async operation with error handling.

**Example**:
```typescript
const result = await errorHandler.wrapAsync(
  () => apiCall(),
  'MyService'
);
```

---

### Image Util Service

**File**: `src/services/image-util.service.ts`

Image manipulation and optimization utilities.

#### Methods

##### `makeThumbnail(blob: Blob, options?: ThumbnailOptions): Promise<Blob>`

Create a thumbnail from an image.

**Parameters**:
- `blob` (Blob): Source image
- `options` (ThumbnailOptions): Size and quality options

**Example**:
```typescript
const thumbnail = await imageUtil.makeThumbnail(blob, {
  size: 320,
  quality: 0.85
});
```

##### `compressImage(blob: Blob, options?: CompressionOptions): Promise<Blob>`

Compress an image.

**Parameters**:
- `blob` (Blob): Source image
- `options` (CompressionOptions): Compression parameters

**Example**:
```typescript
const compressed = await imageUtil.compressImage(blob, {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  format: 'image/jpeg'
});
```

##### `getImageDimensions(blob: Blob): Promise<{width: number, height: number}>`

Get image dimensions without loading the full image.

##### `convertFormat(blob: Blob, format: string, quality?: number): Promise<Blob>`

Convert image to a different format.

##### `createPlaceholder(blob: Blob): Promise<Blob>`

Create a tiny blurred preview for progressive loading.

---

### Validation Service

**File**: `src/services/validation.service.ts`

Input validation and sanitization.

#### Methods

##### `validatePrompt(prompt: string): ValidationResult`

Validate a prompt string.

**Returns**: `{ isValid: boolean, errors: string[] }`

**Example**:
```typescript
const result = validationService.validatePrompt(userInput);
if (!result.isValid) {
  console.error(result.errors);
}
```

##### `validateImageUrl(url: string): ValidationResult`

Validate an image URL.

##### `validateSeed(seed: number | undefined): ValidationResult`

Validate a seed number.

##### `validateDimensions(width: number, height: number): ValidationResult`

Validate image dimensions.

##### `sanitizeString(input: string): string`

Remove potentially dangerous characters.

##### `sanitizeHtml(html: string): string`

Escapes and sanitizes user-provided markup using a curated allowlist of inline formatting tags (for example, `p`, `strong`, `em`, `span`, and anchors). The sanitizer removes script/style content, normalises CSS classes to safe characters, strips unsafe attributes and protocols, and automatically enforces `rel="noopener noreferrer"` on links that open in a new tab.

##### `sanitizeHtmlAdvanced(html: string, allowedTags?: string[], allowedAttributes?: Record<string, string[]>, options?: SanitizeHtmlOptions): string`

Performs DOM-based sanitisation with a caller-supplied allowlist. The optional `options` argument accepts:

- `allowedUriSchemes`: string[] — additional URI schemes to allow (defaults to `http`, `https`, and `blob`).
- `allowRelativeUris`: boolean — enable or disable relative URLs (defaults to `true`).
- `enforceNoopener`: boolean — when `true`, `_blank` links must include `rel` support; otherwise the `target` attribute is removed.
- `blockedTags`: string[] — extra element names to disallow beyond the built-in set (`script`, `style`, `iframe`, etc.).

Returns a sanitised HTML string that is safe to render via Angular bindings such as `[innerHTML]`.

##### `validateApiKey(key: string): ValidationResult`

Validate API key format.

---

### Performance Monitor Service

**File**: `src/services/performance-monitor.service.ts`

Performance tracking and monitoring.

#### Methods

##### `startMeasure(name: string, metadata?: any): string`

Start measuring a performance metric.

**Returns**: string - Metric ID

##### `endMeasure(id: string): void`

End measuring a performance metric.

**Example**:
```typescript
const id = perfMonitor.startMeasure('ImageGeneration');
// ... operation ...
perfMonitor.endMeasure(id);
```

##### `measureAsync<T>(name: string, operation: () => Promise<T>, metadata?: any): Promise<T>`

Measure an async operation.

**Example**:
```typescript
const result = await perfMonitor.measureAsync(
  'DatabaseQuery',
  () => db.query('SELECT * FROM items')
);
```

##### `measureSync<T>(name: string, operation: () => T, metadata?: any): T`

Measure a synchronous operation.

##### `getStats(name: string): {count, min, max, avg} | null`

Get statistics for a specific metric.

##### `getWebVitals(): object`

Get Web Vitals metrics (FCP, LCP, FID, CLS, TTFB).

##### `logSummary(): void`

Log current performance metrics summary.

---

### Request Cache Service

**File**: `src/services/request-cache.service.ts`

Request caching and deduplication.

#### Methods

##### `execute<T>(key: string, requestFn: () => Promise<T>, ttl?: number): Promise<T>`

Execute a request with caching and deduplication.

**Parameters**:
- `key` (string): Cache key
- `requestFn` (() => Promise<T>): Request function
- `ttl` (number): Time to live in milliseconds (default: 5 minutes)

**Example**:
```typescript
const data = await requestCache.execute(
  'models-list',
  () => api.listModels(),
  60000 // 1 minute cache
);
```

##### `get<T>(key: string): T | null`

Get cached data.

##### `set<T>(key: string, data: T, ttl?: number): void`

Set cached data.

##### `invalidate(key: string): void`

Invalidate a cache entry.

##### `invalidatePattern(pattern: string | RegExp): void`

Invalidate entries matching a pattern.

##### `clear(): void`

Clear all cached data.

##### `cleanup(): void`

Remove expired entries.

##### `getStats(): object`

Get cache statistics.

---

### Keyboard Shortcuts Service

**File**: `src/services/keyboard-shortcuts.service.ts`

Keyboard shortcut management.

#### Methods

##### `register(id: string, config: ShortcutConfig): void`

Register a keyboard shortcut.

**Parameters**:
- `id` (string): Unique identifier
- `config` (ShortcutConfig): Shortcut configuration

**Example**:
```typescript
keyboardShortcuts.register('save', {
  key: 's',
  ctrl: true,
  description: 'Save current item',
  handler: () => this.save(),
  preventDefault: true
});
```

##### `unregister(id: string): void`

Unregister a keyboard shortcut.

##### `setEnabled(enabled: boolean): void`

Enable or disable all shortcuts.

##### `getAll(): Array<{id, config}>`

Get all registered shortcuts.

##### `registerDefaultShortcuts(handlers: object): void`

Register common application shortcuts.

**Example**:
```typescript
keyboardShortcuts.registerDefaultShortcuts({
  save: () => this.save(),
  delete: () => this.delete(),
  undo: () => this.undo(),
  redo: () => this.redo(),
  search: () => this.openSearch(),
  help: () => this.showHelp(),
  escape: () => this.closeDialog()
});
```

---

### Blob URL Manager Service

**File**: `src/services/blob-url-manager.service.ts`

Manage blob URLs to prevent memory leaks.

#### Methods

##### `createUrl(blob: Blob): string`

Create a blob URL and track it.

##### `revokeUrl(url: string): void`

Revoke a blob URL.

##### `revokeUrls(urls: string[]): void`

Revoke multiple blob URLs.

##### `revokeAll(): void`

Revoke all tracked blob URLs.

##### `createAutoCleanupUrl(blob: Blob, destroyRef: DestroyRef): string`

Create a blob URL with automatic cleanup.

**Example**:
```typescript
@Component({...})
export class MyComponent {
  private blobUrlManager = inject(BlobUrlManagerService);
  private destroyRef = inject(DestroyRef);
  
  imageUrl = computed(() => {
    const blob = this.imageBlob();
    return blob ? this.blobUrlManager.createAutoCleanupUrl(blob, this.destroyRef) : null;
  });
}
```

---

## Types

### ImageOptions

```typescript
interface ImageOptions {
  model?: string;           // AI model to use (default: 'flux')
  nologo?: boolean;         // Remove watermark (default: false)
  private?: boolean;        // Private generation (default: false)
  safe?: boolean;          // Safe content filtering (default: false)
  referrer?: string;       // Custom referrer
  seed?: number;           // Random seed for reproducibility
  image?: string;          // Source image URL for image-to-image
  enhance?: boolean;       // Enhance prompt with AI (default: false)
}
```

### DeviceInfo

```typescript
interface DeviceInfo {
  width: number;           // Device width in pixels
  height: number;          // Device height in pixels
  dpr: number;            // Device pixel ratio
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;        // Whether validation passed
  errors: string[];        // List of validation errors
}
```

### CompressionOptions

```typescript
interface CompressionOptions {
  maxWidth?: number;       // Maximum width (default: 2048)
  maxHeight?: number;      // Maximum height (default: 2048)
  quality?: number;        // Quality 0-1 (default: 0.85)
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}
```

### ThumbnailOptions

```typescript
interface ThumbnailOptions {
  size?: number;          // Max dimension (default: 320)
  quality?: number;       // Quality 0-1 (default: 0.85)
}
```

### ShortcutConfig

```typescript
interface ShortcutConfig {
  key: string;            // Key name (e.g., 's', 'escape')
  ctrl?: boolean;         // Ctrl modifier
  shift?: boolean;        // Shift modifier
  alt?: boolean;          // Alt modifier
  meta?: boolean;         // Meta/Command modifier
  description: string;    // Human-readable description
  handler: () => void;    // Handler function
  preventDefault?: boolean; // Prevent default action
}
```

---

## Directives

### LazyImageDirective

**File**: `src/directives/lazy-image.directive.ts`

Lazy load images using Intersection Observer with dynamic source binding.

**Usage**:
```html
<img 
  [appLazyImage]="imageUrl"
  [lazySrc]="placeholderUrl"
  [lazyThreshold]="0.1"
  alt="Description" />
```

**Inputs**:
- `appLazyImage` (string | null): The actual image source URL to lazy load
- `lazySrc` (string): Optional placeholder image to display while loading
- `lazyThreshold` (number): Visibility threshold for triggering load (default: 0.1)

**Features**:
- Loads image when it enters viewport using Intersection Observer
- Supports placeholder images during loading
- Automatically reuses observer instance for efficiency
- Handles dynamic source changes (re-observes when source updates)
- Falls back to immediate loading when IntersectionObserver is unavailable
- Automatically cleans up observers on destroy
- Adds CSS classes: `lazy-loaded` (on success), `lazy-error` (on failure)
- Clears metadata after successful load

**Example**:
```typescript
@Component({
  template: `
    <img 
      [appLazyImage]="wallpaperUrl"
      [lazySrc]="thumbnailUrl"
      alt="AI Generated Wallpaper"
    />
  `
})
export class GalleryComponent {
  wallpaperUrl = 'https://example.com/wallpaper.jpg';
  thumbnailUrl = 'data:image/png;base64,...';
}
```

**Browser Compatibility**:
- Modern browsers with IntersectionObserver support: lazy loading with viewport detection
- Browsers without IntersectionObserver: immediate loading (graceful degradation)

---

## Components

### SkeletonComponent

**File**: `src/components/skeleton/skeleton.component.ts`

Loading skeleton screen component.

**Usage**:
```html
<app-skeleton 
  [width]="'200px'" 
  [height]="'100px'"
  [borderRadius]="'8px'"
></app-skeleton>
```

**Inputs**:
- `width` (string): Width of skeleton (default: '100%')
- `height` (string): Height of skeleton (default: '20px')
- `borderRadius` (string): Border radius (default: '4px')
- `customClass` (string): Additional CSS classes

---

## Usage Examples

### Complete Generation Flow

```typescript
import { inject } from '@angular/core';
import { 
  initializeGeminiClient, 
  composePromptForDevice,
  createDeviceWallpaper 
} from './services/pollinations.client';
import { ErrorHandlerService } from './services/error-handler.service';
import { ImageUtilService } from './services/image-util.service';
import { ValidationService } from './services/validation.service';

class WallpaperGenerator {
  private errorHandler = inject(ErrorHandlerService);
  private imageUtil = inject(ImageUtilService);
  private validation = inject(ValidationService);
  
  async generate(userPrompt: string) {
    // Validate input
    const validationResult = this.validation.validatePrompt(userPrompt);
    if (!validationResult.isValid) {
      throw this.errorHandler.createError(validationResult.errors[0]);
    }
    
    try {
      // Initialize Gemini
      initializeGeminiClient('your-api-key');
      
      // Compose enhanced prompt
      const prompt = await composePromptForDevice(
        { width: 1920, height: 1080, dpr: 2 },
        { 
          styles: ['Vibrant', 'Detailed'],
          basePrompt: userPrompt 
        }
      );
      
      // Generate wallpaper
      const { blob } = await createDeviceWallpaper({
        device: { width: 1920, height: 1080, dpr: 2 },
        supported: { '16:9': [{ w: 1920, h: 1080 }] },
        prompt,
        options: { model: 'flux', enhance: true }
      });
      
      // Create thumbnail
      const thumbnail = await this.imageUtil.makeThumbnail(blob);
      
      return { blob, thumbnail, prompt };
      
    } catch (error) {
      this.errorHandler.handleError(error, 'WallpaperGenerator');
      throw error;
    }
  }
}
```

---

## Rate Limits

- **Image Generation**: 1 request per 5 seconds
- **Text Generation**: 1 request per 3 seconds
- **Model Listing**: Cached for 24 hours

---

## Error Handling

All API calls should be wrapped in try-catch blocks and handled through the ErrorHandlerService:

```typescript
try {
  const result = await apiCall();
} catch (error) {
  errorHandler.handleError(error, 'ComponentName');
}
```

---

## Best Practices

1. **Always validate inputs** before API calls
2. **Use caching** for frequently accessed data
3. **Implement proper error handling** for all async operations
4. **Clean up resources** (blob URLs, observers) when done
5. **Monitor performance** for critical operations
6. **Use lazy loading** for images
7. **Implement request deduplication** to avoid redundant API calls

---

For more information, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
