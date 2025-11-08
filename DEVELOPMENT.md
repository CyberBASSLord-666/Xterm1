# Developer Setup Guide

<!-- This file will be regenerated during Operation Bedrock Phase 1.2 -->
<!-- Agent: code-assistant + technical-scribe -->

- **npm**: Version 9.x or higher (comes with Node.js)
  - Verify installation: `npm --version`

- **Git**: Latest version
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify installation: `git --version`

### Recommended Tools

- **VS Code**: [code.visualstudio.com](https://code.visualstudio.com/)
  - Extensions:
    - Angular Language Service
    - ESLint
    - Prettier
    - Angular Snippets
    - GitLens

- **Chrome DevTools**: For debugging and performance profiling
- **Angular DevTools**: Browser extension for Angular debugging

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/CyberBASSLord-666/Xterm1.git
cd Xterm1
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Angular framework and CLI
- Tailwind CSS
- TypeScript
- Development tools

### 3. Configure API Keys

The application requires a Gemini API key for prompt enhancement features.

**Option A: Environment Variable (Recommended for development)**

Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY=your_api_key_here
```

**Option B: Runtime Configuration**

Set the API key through the settings UI after starting the application.

**Getting a Gemini API Key**:
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your configuration

### 4. Start Development Server

```bash
npm start
```

Or with Angular CLI:

```bash
npx ng serve
```

The application will be available at `http://localhost:4200/`

The dev server will:
- Watch for file changes
- Automatically reload the browser
- Provide source maps for debugging

## Development Workflow

### Project Structure

```
Xterm1/
├── src/                    # Source code
│   ├── components/         # Angular components
│   ├── services/          # Business logic
│   ├── directives/        # Custom directives
│   ├── types/             # TypeScript types
│   └── environments/      # Environment configs
├── dist/                  # Build output (generated)
├── node_modules/          # Dependencies (generated)
├── angular.json           # Angular configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── ngsw-config.json       # Service worker configuration
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development |

### Code Style Guidelines

#### TypeScript

- Use **strict mode**: All code must compile with `strict: true`
- Use **explicit types**: Avoid `any`, prefer specific types
- Use **interfaces** for object shapes
- Use **enums** for constants

Example:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User | null {
  // implementation
}
```

#### Angular Components

- Use **standalone components**: All new components should be standalone
- Use **OnPush change detection**: For better performance
- Use **signals**: For reactive state management
- Use **computed signals**: For derived values

Example:
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `...`
})
export class ExampleComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);
  
  increment() {
    this.count.update(n => n + 1);
  }
}
```

#### Services

- Use **providedIn: 'root'**: For singleton services
- Use **dependency injection**: Inject dependencies via `inject()`
- Use **proper typing**: All service methods should be typed

Example:
```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  
  getData(): Observable<Data[]> {
    return this.http.get<Data[]>('/api/data');
  }
}
```

### Working with Signals

Angular Signals provide a reactive programming model:

```typescript
// Create a signal
const count = signal(0);

// Read a signal
console.log(count()); // 0

// Update a signal
count.set(1);
count.update(n => n + 1);

// Computed signal (derived value)
const double = computed(() => count() * 2);

// Effect (side effect)
effect(() => {
  console.log('Count changed:', count());
});
```

### Error Handling

Always use the ErrorHandlerService for consistent error handling:

```typescript
import { ErrorHandlerService } from './services/error-handler.service';

@Component({...})
export class MyComponent {
  private errorHandler = inject(ErrorHandlerService);
  
  async doSomething() {
    try {
      await riskyOperation();
    } catch (error) {
      this.errorHandler.handleError(error, 'MyComponent');
    }
  }
}
```

### Performance Best Practices

1. **Use OnPush Change Detection**
   ```typescript
   @Component({
     changeDetection: ChangeDetectionStrategy.OnPush
   })
   ```

2. **Lazy Load Routes**
   ```typescript
   const routes: Routes = [
     {
       path: 'gallery',
       loadComponent: () => import('./gallery/gallery.component')
     }
   ];
   ```

3. **Use Lazy Loading Directive**
   ```html
   <img [appLazyImage]="imageUrl" [lazySrc]="placeholder">
   ```

4. **Optimize Images**
   ```typescript
   const compressed = await imageUtil.compressImage(blob, {
     maxWidth: 2048,
     quality: 0.85
   });
   ```

5. **Use Request Cache**
   ```typescript
   const data = await requestCache.execute(
     'key',
     () => apiCall(),
     60000 // 1 minute TTL
   );
   ```

## Debugging

### Browser DevTools

**Console Logging**:
```typescript
// Use LoggerService for consistent logging
logger.debug('Debug info', data);
logger.info('Info message');
logger.warn('Warning');
logger.error('Error occurred', error);
```

**Angular DevTools**:
1. Install the Angular DevTools browser extension
2. Open DevTools (F12)
3. Navigate to "Angular" tab
4. Inspect components, profiler, injector tree

**Performance Profiling**:
```typescript
// Use PerformanceMonitorService
const id = perfMonitor.startMeasure('operation');
// ... do work ...
perfMonitor.endMeasure(id);

// Or use the wrapper
await perfMonitor.measureAsync('operation', async () => {
  // async operation
});
```

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}",
      "sourceMapPathOverrides": {
        "webpack:/*": "${webRoot}/*"
      }
    }
  ]
}
```

## Testing

### Unit Tests (Future)

```bash
npm test
```

### E2E Tests (Future)

```bash
npm run e2e
```

### Manual Testing Checklist

- [ ] Generation: Create a new wallpaper
- [ ] Gallery: View, edit, delete items
- [ ] Collections: Create, manage collections
- [ ] Settings: Change preferences
- [ ] Feed: View community images
- [ ] Offline: Test without internet
- [ ] Mobile: Test on mobile devices

## Building for Production

### Production Build

```bash
npm run build
```

Output will be in `dist/app/` directory.

### Build Optimization

The production build includes:
- **Minification**: Code is minified
- **Tree shaking**: Unused code is removed
- **AOT compilation**: Ahead-of-time compilation
- **Service worker**: For offline support
- **Bundle optimization**: Code splitting and lazy loading

### Build Configuration

Edit `angular.json` for build settings:

```json
{
  "configurations": {
    "production": {
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "500kb",
          "maximumError": "1mb"
        }
      ],
      "outputHashing": "all",
      "serviceWorker": "ngsw-config.json"
    }
  }
}
```

## Common Issues

### Build Errors

**Error: Module not found**
```bash
npm install
```

**Error: Port 4200 already in use**
```bash
# Kill the process using port 4200
# On Windows:
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:4200 | xargs kill
```

**TypeScript Errors**
- Check `tsconfig.json` for strict mode settings
- Ensure all types are properly defined
- Run `npx tsc --noEmit` to check for errors

### Runtime Errors

**API Errors**
- Check API key configuration
- Verify network connectivity
- Check browser console for details

**IndexedDB Errors**
- Clear browser data
- Check browser compatibility
- Verify storage quota

**Service Worker Issues**
- Unregister existing service workers
- Clear browser cache
- Check console for service worker errors

## Dependency Management

### Automated Dependabot Updates

The project uses Dependabot to automatically manage dependencies. An automated workflow handles most dependency updates:

**Automatic Merging:**
- **Patch updates** (e.g., 1.0.0 → 1.0.1): Auto-approved and auto-merged after CI passes
- **Minor updates** (e.g., 1.0.0 → 1.1.0): Auto-approved and auto-merged after CI passes
- **Major updates** (e.g., 1.0.0 → 2.0.0): Require manual review and approval

**Update Schedule:**
- **npm dependencies**: Weekly on Mondays at 7:00 AM (America/Denver)
- **GitHub Actions**: Weekly on Mondays at 6:00 AM (America/Denver)

**Configuration Files:**
- `.github/dependabot.yml`: Dependabot configuration
- `.github/workflows/dependabot-auto-merge.yml`: Auto-merge workflow

**How It Works:**
1. Dependabot creates a PR for dependency updates
2. CI workflows (lint, test, build, security) run automatically
3. If all checks pass and the update is patch/minor:
   - PR is auto-approved
   - Auto-merge is enabled
   - PR is merged automatically
4. Major updates receive a comment requesting manual review

**Manual Intervention:**
Major version updates require manual review because they may contain breaking changes:
1. Review the PR description and changelog
2. Check for breaking changes
3. Update code if necessary
4. Approve and merge manually

## Contributing

### Before Submitting a PR

1. **Code Quality**
   - Run linter (when configured)
   - Fix all TypeScript errors
   - Follow code style guidelines

2. **Testing**
   - Manually test your changes
   - Ensure no regressions
   - Test on different browsers

3. **Documentation**
   - Update relevant documentation
   - Add JSDoc comments for public APIs
   - Update CHANGELOG if applicable

4. **Commit Message**
   - Use conventional commits format
   - Be descriptive but concise
   - Reference issues if applicable

Example:
```
feat(gallery): add batch delete functionality

- Add checkbox selection to gallery items
- Implement batch delete action
- Add confirmation dialog

Closes #123
```

## Resources

### Documentation

- [Angular Documentation](https://angular.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [RxJS Documentation](https://rxjs.dev/)

### API References

- [Pollinations AI API](https://pollinations.ai/)
- [Google Gemini API](https://ai.google.dev/)

### Tools

- [Angular DevTools](https://angular.io/guide/devtools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [TypeScript Playground](https://www.typescriptlang.org/play)

## Getting Help

- **Issues**: Open an issue on GitHub
- **Documentation**: Check ARCHITECTURE.md
- **Discussions**: Use GitHub Discussions
- **Code Review**: Request review from maintainers

## License

See LICENSE file for details.
