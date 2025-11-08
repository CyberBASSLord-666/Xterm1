# PolliWall Architecture Documentation

<!-- This file will be regenerated during Operation Bedrock Phase 1.2 -->
<!-- Agent: lead-architect + technical-scribe -->
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
