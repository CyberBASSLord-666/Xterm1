# API Documentation

## Table of Contents

1. [Services](#services)
2. [Types](#types)
3. [Components](#components)
4. [Directives](#directives)

## Services

### Pollinations Client Service

**File**: `src/services/pollinations.client.ts`

Main API client for interacting with the Pollinations AI service.

#### Functions

##### `initializeGeminiClient(apiKey: string): void`

Initialize the Gemini AI client with an API key.

**Parameters**:
- `apiKey` (string): The Gemini API key

**Example**:
```typescript
import { initializeGeminiClient } from './services/pollinations.client';

initializeGeminiClient('your-api-key-here');
```

##### `generateImage(prompt: string, width: number, height: number, options?: ImageOptions): Promise<Blob>`

Generate an image using the Pollinations AI API.

**Parameters**:
- `prompt` (string): The text description of the desired image
- `width` (number): Image width in pixels
- `height` (number): Image height in pixels
- `options` (ImageOptions): Optional generation parameters

**Returns**: Promise<Blob> - The generated image as a blob

**Example**:
```typescript
const blob = await generateImage(
  'A beautiful sunset over mountains',
  1920,
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
import { APP_INITIALIZER } from '@angular/core';
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
  alt="Description"
>
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
