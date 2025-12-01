# Developer Setup Guide

> **Regenerated during Operation Bedrock Phase 1.2**  
> **Code Assistant + Technical Scribe**  
> **Date**: 2025-11-10

---

## Executive Summary

This comprehensive guide covers setting up a complete development environment for PolliWall, from initial prerequisites through advanced workflows. Whether you're a new contributor or experienced developer, this guide provides everything needed to build, test, and contribute to PolliWall.

**Time to Setup**: 15-30 minutes  
**Skill Level**: Intermediate TypeScript/Angular knowledge recommended

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Purpose |
|----------|----------------|-------------|---------|
| **Node.js** | 18.x | 20.x LTS | JavaScript runtime |
| **npm** | 9.x | 10.x | Package manager |
| **Git** | 2.x | Latest | Version control |
| **VS Code** | Latest | Latest | IDE (recommended) |

### Operating System

**Supported**:
- ✅ macOS 12+ (Monterey or later)
- ✅ Windows 10/11 with WSL2
- ✅ Ubuntu 22.04 LTS
- ✅ Debian 11+
- ✅ Fedora 38+

---

## Installation

### 1. Install Node.js

#### macOS (Homebrew)
```bash
brew install node@20
```

#### Windows (Official Installer)
```bash
# Download from https://nodejs.org/
# Install LTS version (20.x)
```

#### Linux (NodeSource)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Verify Installation
```bash
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

### 2. Install Git

#### macOS
```bash
# Included with Xcode Command Line Tools
xcode-select --install
```

#### Windows
```bash
# Download from https://git-scm.com/
# Use Git Bash for command line
```

#### Linux
```bash
sudo apt-get update
sudo apt-get install git
```

#### Verify Installation
```bash
git --version     # Should show 2.x.x
```

### 3. Install VS Code

#### All Platforms
Download from: https://code.visualstudio.com/

#### Recommended Extensions
```bash
# Install via VS Code Extensions marketplace:
- Angular Language Service
- ESLint
- Prettier - Code formatter
- TypeScript Vue Plugin (Volar)
- GitLens
- Jest Runner
- Playwright Test for VSCode
```

---

## Repository Setup

### 1. Clone Repository

```bash
# Clone via HTTPS
git clone https://github.com/CyberBASSLord-666/Xterm1.git

# Or clone via SSH (recommended for contributors)
git clone git@github.com:CyberBASSLord-666/Xterm1.git

# Navigate to directory
cd Xterm1
```

### 2. Install Dependencies

```bash
# Install all project dependencies
npm ci
```

**Note**: Use `npm ci` (not `npm install`) for consistent installations matching package-lock.json.

### 3. Environment Configuration

#### Create Local Environment File

```bash
# Create .env.local (NOT committed to Git)
touch .env.local
```

#### Add API Keys (Optional)

**File**: `.env.local`

```bash
# Google Gemini API Key (for prompt enhancement)
GEMINI_API_KEY=your-api-key-here

# Analytics ID (optional)
ANALYTICS_ID=your-analytics-id
```

**Note**: Application works without API keys (Gemini features disabled).

---

## Development Server

### Start Development Server

```bash
# Start dev server
npm start

# Or with ng serve directly
ng serve

# Access application
# http://localhost:4200
```

**Output**:
```
✔ Browser application bundle generation complete.
Initial chunk files   | Names         | Raw size
main.js               | main          | 1.2 MB
polyfills.js          | polyfills     | 90 KB
styles.css            | styles        | 5 KB

Build at: 2025-11-10T08:00:00.000Z - Hash: abc123def456
** Angular Live Development Server is listening on localhost:4200 **
✔ Compiled successfully.
```

### Development Server Options

```bash
# Specific port
ng serve --port 4201

# Open browser automatically
ng serve --open

# Production mode (for testing)
ng serve --configuration=production

# Disable live reload
ng serve --live-reload=false

# Custom host (for network access)
ng serve --host 0.0.0.0
```

---

## Project Structure

### Directory Layout

```
Xterm1/
├── .github/                 # GitHub Actions workflows
│   ├── workflows/          # CI/CD pipelines
│   │   ├── ci.yml         # Continuous integration
│   │   ├── deploy.yml     # Deployment automation
│   │   ├── eslint.yml     # Linting checks
│   │   ├── security.yml   # Security scanning
│   │   └── bundle-size.yml # Bundle size monitoring
│   ├── dependabot.yml     # Dependency updates
│   └── AGENT_WORKFLOW.md  # Development workflow
│
├── src/                    # Source code
│   ├── app.component.ts   # Root component
│   ├── app.routes.ts      # Route definitions
│   ├── main.ts            # Bootstrap entry point
│   │
│   ├── components/        # Feature components
│   │   ├── wizard/       # Image generation wizard
│   │   ├── gallery/      # User gallery
│   │   ├── collections/  # Collection management
│   │   ├── feed/         # Community feed
│   │   ├── editor/       # Image editor
│   │   ├── settings/     # App settings
│   │   ├── toast/        # Notifications
│   │   └── shortcuts-help/ # Keyboard help
│   │
│   ├── services/          # Business logic services (21 total)
│   │   ├── logger.service.ts
│   │   ├── error-handler.service.ts
│   │   ├── validation.service.ts
│   │   ├── analytics.service.ts
│   │   ├── gallery.service.ts
│   │   ├── generation.service.ts
│   │   └── ... (15 more)
│   │
│   ├── directives/        # Custom directives
│   │   └── lazy-image.directive.ts
│   │
│   ├── utils/             # Utility functions
│   │   ├── component-helpers.ts
│   │   ├── reactive-patterns.ts
│   │   └── type-guards.ts
│   │
│   ├── types/             # TypeScript types
│   ├── constants/         # App constants
│   └── environments/      # Environment configs
│
├── playwright/            # E2E tests
│   └── e2e/              # Test files
│
├── dist/                  # Build output (gitignored)
├── node_modules/          # Dependencies (gitignored)
│
├── angular.json           # Angular CLI configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── jest.config.ts         # Jest testing configuration
├── playwright.config.ts   # Playwright E2E configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── eslint.config.js       # ESLint linting rules
└── .prettierrc            # Prettier formatting rules
```

---

## Available Scripts

### Development

```bash
# Start development server
npm start                     # Alias for ng serve

# Build for development
npm run build                 # Development build

# Build for production
npm run build -- --configuration=production

# Generate production build with base-href
npm run build -- --configuration=production --base-href=/Xterm1/
```

### Testing

```bash
# Run unit tests (Jest)
npm test                      # Run all tests
npm run test:watch           # Watch mode
npm run test:coverage        # With coverage report

# Run E2E tests (Playwright)
npm run e2e                  # Interactive UI mode
npm run e2e:headless         # Headless mode (CI)

# Run specific test
npx jest logger.service.spec.ts
npx playwright test wizard.spec.ts
```

### Code Quality

```bash
# Run linter
npm run lint                 # Check for issues
npm run lint:fix             # Fix auto-fixable issues

# Format code
npm run format               # Format all files
npm run format:check         # Check formatting

# Type checking
npx tsc --noEmit            # Check TypeScript types
```

### Utilities

```bash
# Health check
npm run health-check         # Verify setup

# Clear caches
rm -rf node_modules package-lock.json
npm ci

# Update dependencies
npm update
npm audit fix
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Or bugfix branch
git checkout -b fix/bug-description
```

### 2. Make Changes

```typescript
// Example: Create new service
ng generate service services/my-feature

// Example: Create new component
ng generate component components/my-feature --standalone

// Make your changes...
```

### 3. Test Changes

```bash
# Run tests
npm test

# Run specific test
npx jest my-feature.service.spec.ts

# Check linting
npm run lint

# Format code
npm run format
```

### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat(my-feature): add new feature"

# Or for fixes
git commit -m "fix(component): resolve issue with X"
```

**Commit Message Format**:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### 5. Push and Create PR

```bash
# Push branch
git push origin feature/your-feature-name

# Create PR on GitHub
# Go to: https://github.com/CyberBASSLord-666/Xterm1/pulls
# Click "New Pull Request"
```

---

## Testing

### Unit Tests (Jest)

#### Run Tests

```bash
# All tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npx jest logger.service.spec.ts

# Test name pattern
npx jest --testNamePattern="should log"
```

#### Write Tests

**Example Service Test**:
```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform action', () => {
    const result = service.performAction();
    expect(result).toBe('expected value');
  });
});
```

**Example Component Test**:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent] // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

#### Coverage Reports

```bash
# Generate coverage
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### E2E Tests (Playwright)

#### Run Tests

```bash
# Interactive mode (recommended for development)
npm run e2e

# Headless mode (for CI)
npm run e2e:headless

# Specific browser
npx playwright test --project=chromium

# Specific test file
npx playwright test wizard.spec.ts

# Debug mode
npx playwright test --debug
```

#### Write E2E Tests

**Example**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Wizard Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should generate image', async ({ page }) => {
    // Fill prompt
    await page.fill('[data-testid="prompt-input"]', 'A sunset over mountains');

    // Click generate
    await page.click('[data-testid="generate-button"]');

    // Wait for result
    await expect(page.locator('[data-testid="image-result"]')).toBeVisible();
  });
});
```

---

## Debugging

### VS Code Debugging

#### Launch Configuration

**File**: `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Angular App",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}",
      "sourceMapPathOverrides": {
        "webpack:/*": "${webRoot}/*"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Jest Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Browser DevTools

```typescript
// Add breakpoints in code
debugger;

// Log to console
console.log('Debug value:', value);

// Use Angular DevTools extension
// Chrome: https://chrome.google.com/webstore/detail/angular-devtools/
```

---

## Code Style

### Linting (ESLint)

**Configuration**: `eslint.config.js`

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting (Prettier)

**Configuration**: `.prettierrc`

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Editor Integration

**VS Code** (auto-format on save):

**File**: `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

**Error**: `Port 4200 is already in use`

**Solution**:
```bash
# Kill process on port 4200
lsof -ti:4200 | xargs kill -9

# Or use different port
ng serve --port 4201
```

#### Module Not Found

**Error**: `Cannot find module '@angular/core'`

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm ci
```

#### TypeScript Errors

**Error**: Type errors in IDE

**Solution**:
```bash
# Restart TypeScript server (VS Code)
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
npm run build
```

#### Build Failures

**Error**: Build fails with memory error

**Solution**:
```bash
# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

---

## Best Practices

### DO

✅ **Use Angular CLI** for generating code
✅ **Write tests** for new features
✅ **Run linter** before committing
✅ **Format code** with Prettier
✅ **Use Signals** for state management
✅ **Follow TypeScript strict** mode
✅ **Use OnPush** change detection
✅ **Write standalone** components

### DON'T

❌ **Commit** `node_modules` or `dist`
❌ **Use `any`** type without justification
❌ **Skip tests** for new features
❌ **Commit** API keys or secrets
❌ **Modify** `package-lock.json` manually
❌ **Use `console.log`** (use LoggerService)
❌ **Skip code** review

---

## Additional Resources

### Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [E2E_TESTING.md](./E2E_TESTING.md) - E2E testing guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

### External Links

- [Angular Documentation](https://angular.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)

### Community

- [GitHub Issues](https://github.com/CyberBASSLord-666/Xterm1/issues)
- [Pull Requests](https://github.com/CyberBASSLord-666/Xterm1/pulls)

---

*This development guide is the definitive reference for setting up and contributing to PolliWall.*  
*Last Updated: 2025-11-10 | Operation Bedrock Phase 1.2*

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
