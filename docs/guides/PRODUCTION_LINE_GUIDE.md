# Production Line Workflow Guide

> **Generated as Part of Operation Bedrock Completion**  
> **Agent**: lead-architect + technical-scribe  
> **Date**: 2025-11-12  
> **Status**: ✅ **ACTIVE**

---

## Executive Summary

This document defines the **Production Line** workflow for PolliWall (Xterm1) - the standard, cyclical process for adding any new, feature-complete, production-ready functionality to the project. This workflow is now active following the successful completion of Operation Bedrock.

**Purpose**: Ensure every new feature is planned, implemented, tested, secured, reviewed, documented, and deployed with uncompromising quality standards.

**Scope**: All new features, enhancements, and non-trivial changes to the codebase.

---

## Workflow Overview

The Production Line follows an **8-step sequential process** with strict quality gates between each step. No step can be skipped, and each step has a designated agent responsible for execution.

```
1. Plan → 2. Code → 3. Test → 4. Audit → 5. Review → 6. Document → 7. Release → 8. PR
```

**Key Principles**:
- ✅ Every feature must have a detailed Plan of Record before coding begins
- ✅ All code must conform to documented architectural standards (100%)
- ✅ All code must achieve 100% test coverage for new functionality
- ✅ All code must pass security audit (ValidationService for all inputs)
- ✅ All code must be reviewed and approved by lead-architect
- ✅ All code must be documented (CHANGELOG, API docs, E2E docs)
- ✅ All code must pass CI/CD checks before deployment

**Quality Score Target**: 95/100 minimum for production deployment

---

## Step 1: Feature Initiation - The Plan

**Agent**: `lead-architect`

**Responsibility**: Create a detailed Plan of Record for the new feature

### Input
- Feature request description (e.g., "Add 'Favorites' collection")
- User stories or requirements
- Business objectives

### Process

The lead-architect analyzes the request and creates a comprehensive **Plan of Record** that specifies:

#### 1.1 Architecture Definition
- **New Components**: What standalone components need to be created
  - File names, selectors, responsibilities
  - Routing paths and navigation integration
  - Change detection strategy (OnPush required)
  
- **New Services**: What injectable services need to be created
  - Service names, responsibilities, singleton scope
  - Dependencies on core services (Logger, Error Handler, etc.)
  - State management approach (Signals required)

- **New Directives**: What attribute/structural directives are needed
  - Directive names, selectors, purposes
  - Input/output properties

- **Modified Files**: What existing files will be changed
  - Exact files and reasons for modification
  - Migration strategy for breaking changes

#### 1.2 Core Service Integration
**MANDATORY**: The plan must specify which core services MUST be used:

- **LoggerService**: All logging operations (no console.log)
- **ErrorHandlerService**: All error handling and user notifications
- **ValidationService**: All user input validation (XSS prevention)
- **BlobUrlManagerService**: All blob URL management
- **AnalyticsService**: All user interaction tracking
- **KeyboardShortcutsService**: All keyboard navigation
- **PerformanceMonitorService**: All performance-critical operations

**Example**:
```typescript
// Plan specifies:
"The FavoritesService MUST inject LoggerService for all logging,
ErrorHandlerService for error handling, ValidationService for
validating collection names, and AnalyticsService for tracking
favorite events."
```

#### 1.3 Data Structure Definition
**MANDATORY**: The plan must specify exact data structures using Angular Signals:

```typescript
// Example from Plan of Record:
interface Favorite {
  id: string;
  imageId: string;
  prompt: string;
  addedAt: Date;
}

class FavoritesService {
  private readonly _favorites = signal<Favorite[]>([]);
  readonly favorites = this._favorites.asReadonly();
  readonly favoriteCount = computed(() => this._favorites().length);
}
```

#### 1.4 Acceptance Criteria
The plan must define measurable acceptance criteria:
- ✅ Functional requirements (what it must do)
- ✅ Performance requirements (response time, bundle size impact)
- ✅ Accessibility requirements (WCAG 2.1 AA compliance)
- ✅ Security requirements (input validation, XSS prevention)
- ✅ Test coverage requirements (100% for new code)

### Output
- **Document**: `PLAN_OF_RECORD_[FEATURE_NAME].md`
- **Status**: Ready for implementation
- **Next Agent**: code-assistant

### Quality Gate
- [ ] All components/services/directives clearly defined
- [ ] All core service integrations specified
- [ ] All data structures defined with Signals
- [ ] All acceptance criteria measurable
- [ ] Plan reviewed and approved by architect

---

## Step 2: Implementation - The Code

**Agent**: `code-assistant`

**Responsibility**: Generate complete, unabridged application code that perfectly adheres to the Plan of Record

### Input
- Plan of Record from lead-architect
- Existing codebase and architectural standards

### Process

The code-assistant implements the feature by:

#### 2.1 Component Generation
For each component specified in the Plan:

```typescript
import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggerService } from '@/services/logger.service';
import { ErrorHandlerService } from '@/services/error-handler.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesComponent {
  private readonly logger = inject(LoggerService);
  private readonly errorHandler = inject(ErrorHandlerService);
  
  // All state as Signals
  readonly favorites = signal<Favorite[]>([]);
  
  // All derived state as computed()
  readonly isEmpty = computed(() => this.favorites().length === 0);
  
  ngOnInit(): void {
    this.logger.info('FavoritesComponent initialized');
  }
}
```

**Requirements**:
- ✅ Standalone: true (no NgModules)
- ✅ ChangeDetectionStrategy.OnPush
- ✅ All state managed with Signals
- ✅ All derived state using computed()
- ✅ Core services injected via inject() or constructor
- ✅ Initialization in ngOnInit() (not constructor)
- ✅ Cleanup in ngOnDestroy() if needed

#### 2.2 Service Generation
For each service specified in the Plan:

```typescript
import { Injectable, inject } from '@angular/core';
import { signal, computed } from '@angular/core';
import { LoggerService } from './logger.service';
import { ErrorHandlerService } from './error-handler.service';
import { ValidationService } from './validation.service';
import { AnalyticsService } from './analytics.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly logger = inject(LoggerService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly validator = inject(ValidationService);
  private readonly analytics = inject(AnalyticsService);
  
  private readonly _favorites = signal<Favorite[]>([]);
  readonly favorites = this._favorites.asReadonly();
  readonly count = computed(() => this._favorites().length);
  
  async addFavorite(favorite: Favorite): Promise<void> {
    try {
      // Validate input
      const validated = this.validator.sanitizeHtml(favorite.prompt);
      
      // Perform operation
      this._favorites.update(favs => [...favs, { ...favorite, prompt: validated }]);
      
      // Log and track
      this.logger.info('Favorite added', { id: favorite.id });
      this.analytics.track('favorite_added', { id: favorite.id });
      
    } catch (error) {
      this.logger.error('Failed to add favorite', { error });
      this.errorHandler.handleError(error, 'Failed to add favorite');
      throw error;
    }
  }
}
```

**Requirements**:
- ✅ Injectable with providedIn: 'root'
- ✅ All core services injected
- ✅ All logging through LoggerService
- ✅ All errors through ErrorHandlerService
- ✅ All validation through ValidationService
- ✅ All events through AnalyticsService
- ✅ Try-catch-finally for async operations
- ✅ Signal-based state management

#### 2.3 Routing Integration
If the feature requires new routes:

```typescript
// In app.routes.ts
{
  path: 'favorites',
  loadComponent: () => import('./components/favorites/favorites.component')
    .then(m => m.FavoritesComponent),
  title: 'My Favorites - PolliWall'
}
```

#### 2.4 Code Quality Standards
All generated code must:
- ✅ Pass TypeScript strict mode compilation
- ✅ Have no `any` types (use proper typing or unknown with guards)
- ✅ Have explicit return types for all public methods
- ✅ Follow ESLint rules (no warnings)
- ✅ Follow Prettier formatting
- ✅ Include JSDoc comments for complex logic
- ✅ Use path aliases (@/) for imports

### Output
- **Files**: All component/service/directive files
- **Status**: Code complete, ready for testing
- **Next Agent**: qa-engineer

### Quality Gate
- [ ] All files created as specified in Plan
- [ ] All core services integrated correctly
- [ ] TypeScript compiles with strict mode
- [ ] ESLint passes with no errors
- [ ] Code follows architectural standards

---

## Step 3: Quality Assurance - The Tests

**Agent**: `qa-engineer`

**Responsibility**: Generate 100% coverage tests for all new code

### Input
- Implementation code from code-assistant
- Plan of Record for acceptance criteria
- Existing test patterns and utilities

### Process

The qa-engineer creates two types of tests:

#### 3.1 Unit Tests (Jest)

For every service, component, and utility:

```typescript
// favorites.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';
import { LoggerService } from './logger.service';
import { ErrorHandlerService } from './error-handler.service';
import { ValidationService } from './validation.service';
import { AnalyticsService } from './analytics.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let mockLogger: jest.Mocked<LoggerService>;
  let mockErrorHandler: jest.Mocked<ErrorHandlerService>;
  let mockValidator: jest.Mocked<ValidationService>;
  let mockAnalytics: jest.Mocked<AnalyticsService>;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), error: jest.fn() } as any;
    mockErrorHandler = { handleError: jest.fn() } as any;
    mockValidator = { sanitizeHtml: jest.fn(v => v) } as any;
    mockAnalytics = { track: jest.fn() } as any;

    TestBed.configureTestingModule({
      providers: [
        FavoritesService,
        { provide: LoggerService, useValue: mockLogger },
        { provide: ErrorHandlerService, useValue: mockErrorHandler },
        { provide: ValidationService, useValue: mockValidator },
        { provide: AnalyticsService, useValue: mockAnalytics },
      ]
    });

    service = TestBed.inject(FavoritesService);
  });

  describe('addFavorite', () => {
    it('should add a favorite successfully', async () => {
      const favorite = { id: '1', imageId: 'img1', prompt: 'test', addedAt: new Date() };
      
      await service.addFavorite(favorite);
      
      expect(service.favorites()).toContain(favorite);
      expect(mockLogger.info).toHaveBeenCalledWith('Favorite added', { id: '1' });
      expect(mockAnalytics.track).toHaveBeenCalledWith('favorite_added', { id: '1' });
    });

    it('should sanitize prompt before adding', async () => {
      const favorite = { id: '1', imageId: 'img1', prompt: '<script>alert("xss")</script>', addedAt: new Date() };
      mockValidator.sanitizeHtml.mockReturnValue('alert("xss")');
      
      await service.addFavorite(favorite);
      
      expect(mockValidator.sanitizeHtml).toHaveBeenCalledWith(favorite.prompt);
      expect(service.favorites()[0].prompt).toBe('alert("xss")');
    });

    it('should handle errors gracefully', async () => {
      const favorite = { id: '1', imageId: 'img1', prompt: 'test', addedAt: new Date() };
      const error = new Error('Storage full');
      mockValidator.sanitizeHtml.mockImplementation(() => { throw error; });
      
      await expect(service.addFavorite(favorite)).rejects.toThrow('Storage full');
      
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error, expect.any(String));
    });
  });

  describe('count computed', () => {
    it('should return correct count', async () => {
      expect(service.count()).toBe(0);
      
      await service.addFavorite({ id: '1', imageId: 'img1', prompt: 'test', addedAt: new Date() });
      expect(service.count()).toBe(1);
      
      await service.addFavorite({ id: '2', imageId: 'img2', prompt: 'test2', addedAt: new Date() });
      expect(service.count()).toBe(2);
    });
  });
});
```

**Coverage Requirements**:
- ✅ 100% line coverage for new code
- ✅ 100% branch coverage for new code
- ✅ 100% function coverage for new code
- ✅ All error paths tested
- ✅ All edge cases tested
- ✅ All signals and computed values tested

#### 3.2 E2E Tests (Playwright)

For every user-facing feature:

```typescript
// favorites.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Favorites Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
  });

  test('should add image to favorites', async ({ page }) => {
    // Navigate to wizard
    await page.click('text=Generate Wallpaper');
    
    // Generate image
    await page.fill('[data-testid="prompt-input"]', 'beautiful sunset');
    await page.click('[data-testid="generate-button"]');
    
    // Wait for generation
    await expect(page.locator('[data-testid="generated-image"]')).toBeVisible({ timeout: 30000 });
    
    // Add to favorites
    await page.click('[data-testid="add-favorite-button"]');
    
    // Verify toast notification
    await expect(page.locator('.toast-success')).toContainText('Added to favorites');
    
    // Navigate to favorites
    await page.click('[data-testid="nav-favorites"]');
    
    // Verify image in favorites
    await expect(page.locator('[data-testid="favorite-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="favorite-prompt"]')).toContainText('beautiful sunset');
  });

  test('should remove image from favorites', async ({ page }) => {
    // Assuming favorite already exists
    await page.goto('http://localhost:4200/favorites');
    
    const favoriteCount = await page.locator('[data-testid="favorite-item"]').count();
    expect(favoriteCount).toBeGreaterThan(0);
    
    // Remove first favorite
    await page.click('[data-testid="remove-favorite-button"]');
    
    // Confirm deletion
    await page.click('text=Confirm');
    
    // Verify removed
    await expect(page.locator('[data-testid="favorite-item"]')).toHaveCount(favoriteCount - 1);
  });

  test('should display empty state when no favorites', async ({ page }) => {
    await page.goto('http://localhost:4200/favorites');
    
    // Remove all favorites (if any)
    while (await page.locator('[data-testid="favorite-item"]').count() > 0) {
      await page.click('[data-testid="remove-favorite-button"]');
      await page.click('text=Confirm');
    }
    
    // Verify empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No favorites yet')).toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('http://localhost:4200/favorites');
    
    // Tab to first favorite
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check focus visible
    await expect(page.locator('[data-testid="favorite-item"]:focus-visible')).toBeVisible();
    
    // Delete with keyboard
    await page.keyboard.press('Delete');
    await page.keyboard.press('Enter'); // Confirm
    
    // Verify deleted
    await expect(page.locator('.toast-success')).toContainText('Removed from favorites');
  });
});
```

**E2E Test Requirements**:
- ✅ Test complete user flows (happy path)
- ✅ Test error scenarios (network failures, validation errors)
- ✅ Test keyboard navigation and accessibility
- ✅ Test mobile responsive behavior
- ✅ Test loading states and skeletons
- ✅ Test edge cases (empty states, full states)

#### 3.3 Test Execution

The qa-engineer must run:

```bash
# Unit tests
npm test -- --coverage

# E2E tests (headless)
npm run e2e:headless

# E2E tests (UI mode for debugging)
npm run e2e:ui

# Linting
npm run lint

# Type checking
npm run type-check
```

**All tests must pass with 100% coverage for new code.**

### Output
- **Files**: `.spec.ts` files for unit tests, E2E test files
- **Coverage Report**: Jest coverage report showing 100% for new code
- **Status**: All tests passing, ready for security audit
- **Next Agent**: security-specialist

### Quality Gate
- [ ] 100% code coverage for new functionality
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] All edge cases tested
- [ ] Keyboard accessibility tested
- [ ] No failing lints or type errors

---

## Step 4: Security Audit - The Hardening

**Agent**: `security-specialist`

**Responsibility**: Audit new code for security vulnerabilities and ensure compliance with security standards

### Input
- Implementation code from code-assistant
- Test code from qa-engineer
- Plan of Record for security requirements

### Process

The security-specialist performs a comprehensive security audit:

#### 4.1 Input Validation Audit

**Check**: Every user input must use ValidationService

```typescript
// CORRECT:
const sanitized = this.validator.sanitizeHtml(userInput);

// INCORRECT:
const unsanitized = userInput; // ❌ XSS vulnerability
```

**Audit Checklist**:
- [ ] All form inputs validated
- [ ] All URL parameters validated
- [ ] All localStorage/sessionStorage reads validated
- [ ] All file uploads validated (if applicable)
- [ ] All API responses validated (if external)

#### 4.2 XSS Prevention Audit

**Check**: 5-layer defense must be applied to all user-generated content

**Layer 1**: sanitize-html library
```typescript
this.validator.sanitizeHtml(content); // ✅
```

**Layer 2**: Event handler removal (automatic in ValidationService)

**Layer 3**: Dangerous protocol blocking (automatic in ValidationService)

**Layer 4**: CSS pattern sanitization (automatic in ValidationService)

**Layer 5**: Navigation tag removal (automatic in ValidationService)

**Audit Checklist**:
- [ ] All innerHTML uses sanitized
- [ ] All [innerHTML] bindings use sanitized
- [ ] All dynamic content sanitized
- [ ] No eval() or Function() constructors
- [ ] No dangerouslySetInnerHTML equivalents

#### 4.3 Authentication & Authorization Audit (if applicable)

If feature involves protected resources:

**Audit Checklist**:
- [ ] Routes protected with guards
- [ ] API calls include authentication headers
- [ ] Sensitive data not exposed in logs
- [ ] Session timeout handled
- [ ] CSRF protection considered

#### 4.4 Secrets Management Audit

**Check**: No secrets in code, all in environment variables

**Audit Checklist**:
- [ ] No API keys hardcoded
- [ ] No passwords in code
- [ ] No tokens in localStorage (use httpOnly cookies if needed)
- [ ] Environment variables properly namespaced
- [ ] Sensitive logs filtered by LoggerService

#### 4.5 Dependency Audit

**Check**: No new dependencies with known vulnerabilities

```bash
# Run security audit
npm audit

# Check for high/critical vulnerabilities
npm audit --audit-level=high
```

**Audit Checklist**:
- [ ] No critical or high severity vulnerabilities
- [ ] All new dependencies justified in Plan of Record
- [ ] Dependencies pinned to specific versions
- [ ] Dependencies from trusted sources

#### 4.6 Security Headers Audit

If feature affects deployment configuration:

**Audit Checklist**:
- [ ] CSP policy allows new resources (if needed)
- [ ] No overly permissive CSP directives added
- [ ] CORS properly configured (if new API endpoints)
- [ ] No new unsafe-inline or unsafe-eval

#### 4.7 Security Testing

Run automated security scans:

```bash
# CodeQL scan (in CI/CD)
# Already configured in .github/workflows/codeql-analysis.yml

# OWASP ZAP scan (if applicable)
# Manual scan for complex features
```

### Output
- **Document**: Security audit report or approval
- **Changes**: Security configuration updates (if needed)
- **Status**: Security approved, ready for architectural review
- **Next Agent**: lead-architect

### Quality Gate
- [ ] All user inputs validated with ValidationService
- [ ] All XSS prevention measures in place
- [ ] No secrets in code
- [ ] No high/critical vulnerabilities
- [ ] Security headers not weakened
- [ ] Security testing passed

---

## Step 5: Architectural Review - The Gate

**Agent**: `lead-architect`

**Responsibility**: Final review to ensure implementation matches Plan of Record and adheres to all architectural standards

### Input
- Plan of Record (original)
- Implementation code
- Test code
- Security audit report

### Process

The lead-architect performs a comprehensive review:

#### 5.1 Conformance to Plan

**Check**: Does implementation match Plan of Record?

**Review Checklist**:
- [ ] All specified components created
- [ ] All specified services created
- [ ] All specified directives created
- [ ] All core services integrated as planned
- [ ] All data structures match specification
- [ ] No deviation from planned architecture

#### 5.2 Angular 20 Best Practices

**Review Checklist**:
- [ ] All components standalone
- [ ] All components OnPush
- [ ] All state managed with Signals
- [ ] All derived state using computed()
- [ ] No RxJS Subjects for local state
- [ ] Proper lifecycle hooks used

#### 5.3 Core Service Integration

**Review Checklist**:
- [ ] LoggerService used for all logging
- [ ] ErrorHandlerService used for all errors
- [ ] ValidationService used for all validation
- [ ] No console.log in code
- [ ] No direct fetch calls
- [ ] Proper error boundaries

#### 5.4 Code Quality

**Review Checklist**:
- [ ] TypeScript strict mode passing
- [ ] No `any` types
- [ ] Explicit return types
- [ ] Proper null handling
- [ ] ESLint passing
- [ ] Prettier formatted

#### 5.5 Performance Impact

**Review Checklist**:
- [ ] Bundle size impact acceptable (<50KB increase)
- [ ] No unnecessary computations
- [ ] Lazy loading used where appropriate
- [ ] Images optimized
- [ ] No memory leaks (proper cleanup)

#### 5.6 Accessibility

**Review Checklist**:
- [ ] Semantic HTML used
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] Color contrast sufficient
- [ ] Screen reader friendly

### Decision Points

The lead-architect makes one of two decisions:

#### ✅ APPROVED

If all checks pass:
- Feature is approved for documentation
- No changes required
- Proceed to Step 6

#### ❌ REJECTED

If any checks fail:
- Feature is rejected
- Detailed feedback provided
- Sent back to code-assistant (Step 2) for rework
- Must repeat Steps 2-5 until approved

### Output
- **Decision**: APPROVED or REJECTED
- **Feedback**: Detailed comments if rejected
- **Status**: Ready for documentation (if approved)
- **Next Agent**: technical-scribe (if approved), code-assistant (if rejected)

### Quality Gate
- [ ] Implementation matches Plan of Record 100%
- [ ] All architectural standards met
- [ ] All best practices followed
- [ ] Performance impact acceptable
- [ ] Accessibility compliant
- [ ] Lead architect approval granted

---

## Step 6: Documentation - The Scribe

**Agent**: `technical-scribe`

**Responsibility**: Update all relevant documentation to reflect the new feature

### Input
- Approved implementation
- Plan of Record
- Test documentation

### Process

The technical-scribe updates multiple documentation files:

#### 6.1 CHANGELOG.md

Add entry under `[Unreleased]` section:

```markdown
## [Unreleased]

### Added
- **Favorites Feature**: Users can now save generated wallpapers to a personal favorites collection
  - New `FavoritesComponent` for viewing favorites
  - New `FavoritesService` for managing favorites with IndexedDB
  - Keyboard shortcuts: `F` to add/remove favorite, `Ctrl+F` to view favorites
  - Accessibility: Full keyboard navigation and screen reader support
  - Closes #123

### Technical Details
- Added `favorites.component.ts` (standalone, OnPush, Signals-based)
- Added `favorites.service.ts` with 100% test coverage
- Added 15 unit tests and 5 E2E tests (all passing)
- Bundle size impact: +12KB (within acceptable range)
```

#### 6.2 API_DOCUMENTATION.md

Add API documentation for new public interfaces:

```markdown
### FavoritesService

**Purpose**: Manages user's favorite wallpapers with persistent storage

**Injection**: `{ providedIn: 'root' }`

#### Public API

##### Properties

###### `favorites: Signal<Favorite[]>` (readonly)
Returns array of all favorite wallpapers.

**Type**:
```typescript
interface Favorite {
  id: string;
  imageId: string;
  prompt: string;
  thumbnailUrl: string;
  addedAt: Date;
}
```

###### `count: Signal<number>` (readonly)
Returns count of favorites (computed from favorites array).

##### Methods

###### `addFavorite(favorite: Favorite): Promise<void>`
Adds wallpaper to favorites collection.

**Parameters**:
- `favorite`: Favorite object containing wallpaper details

**Returns**: Promise that resolves when favorite is added

**Throws**: Error if validation fails or storage is full

**Example**:
```typescript
await favoritesService.addFavorite({
  id: generateId(),
  imageId: 'img_123',
  prompt: 'Beautiful sunset',
  thumbnailUrl: blobUrl,
  addedAt: new Date()
});
```

###### `removeFavorite(id: string): Promise<void>`
Removes wallpaper from favorites collection.

**Parameters**:
- `id`: Unique identifier of favorite to remove

**Returns**: Promise that resolves when favorite is removed

**Example**:
```typescript
await favoritesService.removeFavorite('fav_123');
```
```

#### 6.3 E2E_TESTING.md

Add E2E test documentation:

```markdown
### Favorites Feature Tests

**Location**: `playwright/favorites.spec.ts`

**Coverage**: Complete user flows for favorites management

#### Test Scenarios

1. **Adding Favorites**
   - Generates wallpaper
   - Adds to favorites
   - Verifies toast notification
   - Verifies appears in favorites list

2. **Removing Favorites**
   - Navigates to favorites
   - Removes favorite with confirmation
   - Verifies removal and toast

3. **Empty State**
   - Displays empty state when no favorites
   - Shows helpful message and CTA

4. **Keyboard Navigation**
   - Tab navigation works
   - Delete key removes favorite
   - Focus management correct

**Running Tests**:
```bash
npx playwright test favorites.spec.ts
```
```

#### 6.4 ARCHITECTURE.md

Update architecture if new patterns introduced:

```markdown
### Favorites Management Pattern

The favorites feature demonstrates the standard pattern for persistent collections:

1. **Service Layer**: `FavoritesService` manages state with Signals
2. **Storage Layer**: IndexedDB via `idb` library for persistence
3. **Component Layer**: `FavoritesComponent` displays with OnPush
4. **Integration**: Core services (Logger, Error Handler, Validation) fully integrated

**Key Patterns**:
- Signal-based reactive state
- Computed values for derived data
- Async operations with proper error handling
- Keyboard shortcuts registered in ngOnInit
- Blob URLs managed by BlobUrlManagerService
```

#### 6.5 TEST_COVERAGE.md

Update coverage metrics:

```markdown
### FavoritesService

**Status**: ✅ Excellent (100% coverage)

- **Lines**: 45/45 (100%)
- **Branches**: 12/12 (100%)
- **Functions**: 8/8 (100%)
- **Statements**: 45/45 (100%)

**Test File**: `src/services/favorites.service.spec.ts`

**Tests**: 15 tests covering:
- Adding favorites (3 tests)
- Removing favorites (3 tests)
- Loading favorites (2 tests)
- Error handling (4 tests)
- Computed values (3 tests)
```

### Output
- **Updated Files**: CHANGELOG.md, API_DOCUMENTATION.md, E2E_TESTING.md, ARCHITECTURE.md, TEST_COVERAGE.md
- **Status**: Documentation complete, ready for release check
- **Next Agent**: devops-engineer

### Quality Gate
- [ ] CHANGELOG.md updated with feature description
- [ ] API_DOCUMENTATION.md updated with all new public APIs
- [ ] E2E_TESTING.md updated with test scenarios
- [ ] ARCHITECTURE.md updated if new patterns introduced
- [ ] TEST_COVERAGE.md updated with coverage metrics
- [ ] All documentation accurate and comprehensive

---

## Step 7: Deployment - The Release

**Agent**: `devops-engineer`

**Responsibility**: Perform final checks before deployment and ensure CI/CD readiness

### Input
- Approved and documented feature
- All test results
- Bundle size analysis

### Process

The devops-engineer performs pre-deployment checks:

#### 7.1 CI/CD Workflow Check

**Verify all workflows pass**:

```bash
# Check workflow runs
gh run list --workflow=ci.yml
gh run list --workflow=bundle-size.yml
gh run list --workflow=codeql-analysis.yml
gh run list --workflow=e2e-tests.yml
```

**Review Checklist**:
- [ ] `ci.yml`: Linting, tests, build all passing
- [ ] `bundle-size.yml`: Bundle size within limits
- [ ] `codeql-analysis.yml`: No security issues
- [ ] `e2e-tests.yml`: All E2E tests passing
- [ ] `playwright-report.yml`: Visual regression tests passing

#### 7.2 Build Check

**Verify production build**:

```bash
npm run build

# Check output
ls -lh dist/xterm1/browser/
```

**Review Checklist**:
- [ ] Build completes without errors
- [ ] No warnings in build output
- [ ] Bundle size increase acceptable
- [ ] All assets generated correctly
- [ ] Service worker updated (if changed)

#### 7.3 Environment Variables Check

**Verify no new environment variables needed**:

**Review Checklist**:
- [ ] No new environment variables required
- [ ] Or: New variables documented in DEPLOYMENT.md
- [ ] Or: New variables added to .env.example
- [ ] Or: Deployment platforms updated (Vercel, Netlify)

#### 7.4 Bundle Size Impact

**Analyze bundle size change**:

```bash
npm run analyze

# Or check bundle-size.yml output
```

**Acceptance Criteria**:
- ✅ Main bundle increase: <50KB
- ✅ Total bundle increase: <100KB
- ✅ Lazy-loaded routes used for large features
- ✅ Tree-shaking effective

#### 7.5 Performance Testing

**Run performance checks**:

```bash
# Lighthouse CI (if configured)
npm run lighthouse

# Or manual Lighthouse audit
```

**Acceptance Criteria**:
- ✅ Performance score: >90
- ✅ Accessibility score: >90
- ✅ Best Practices score: >90
- ✅ SEO score: >90

#### 7.6 Deployment Configuration Check

**Verify deployment configs unchanged or properly updated**:

**Files to check**:
- `vercel.json`: Routes, headers, redirects
- `_headers`: Security headers
- `nginx.conf.example`: Nginx configuration
- `angular.json`: Build configuration

**Review Checklist**:
- [ ] No breaking changes to deployment configs
- [ ] Or: Config changes documented and tested
- [ ] All deployment platforms supported
- [ ] Rollback plan documented

#### 7.7 Monitoring & Analytics

**Verify monitoring ready**:

**Review Checklist**:
- [ ] New features tracked in AnalyticsService
- [ ] Error tracking configured
- [ ] Performance monitoring in place
- [ ] No PII in logs

### Output
- **Report**: Deployment readiness report
- **Status**: Ready for pull request (if all checks pass)
- **Blockers**: List of issues to resolve (if checks fail)
- **Next Agent**: code-assistant (for PR creation)

### Quality Gate
- [ ] All CI/CD workflows passing
- [ ] Production build successful
- [ ] Bundle size acceptable
- [ ] Performance scores acceptable
- [ ] No new environment variables (or documented)
- [ ] Monitoring configured
- [ ] Deployment configs valid

---

## Step 8: Pull Request - Production Ready

**Agent**: `code-assistant`

**Responsibility**: Create comprehensive, production-ready pull request

### Input
- All previous work (code, tests, docs, approvals)
- CI/CD status
- Deployment readiness

### Process

The code-assistant creates the final pull request:

#### 8.1 PR Title

Format: `feat: [Feature Name] - [Brief Description]`

Example: `feat: Favorites Collection - Save and manage favorite wallpapers`

#### 8.2 PR Description

**Template**:

```markdown
## Feature: Favorites Collection

### Description
Adds a new favorites collection feature allowing users to save and manage their favorite generated wallpapers. Users can add wallpapers to favorites from the generation wizard or gallery, view all favorites in a dedicated page, and remove favorites with confirmation.

### Changes

#### New Files
- `src/components/favorites/favorites.component.ts` - Favorites display component
- `src/components/favorites/favorites.component.html` - Favorites template
- `src/components/favorites/favorites.component.css` - Favorites styles
- `src/services/favorites.service.ts` - Favorites management service
- `src/services/favorites.service.spec.ts` - Favorites service tests (100% coverage)
- `playwright/favorites.spec.ts` - E2E tests for favorites feature

#### Modified Files
- `src/app.routes.ts` - Added /favorites route
- `src/components/wizard/wizard.component.ts` - Added "Add to Favorites" button
- `src/components/gallery/gallery.component.ts` - Added favorites integration
- `CHANGELOG.md` - Added feature entry
- `API_DOCUMENTATION.md` - Documented FavoritesService API
- `E2E_TESTING.md` - Documented favorites E2E tests
- `ARCHITECTURE.md` - Documented favorites pattern
- `TEST_COVERAGE.md` - Updated coverage metrics

### Implementation Details

#### Architecture
- **Pattern**: Signal-based reactive state management
- **Storage**: IndexedDB for persistent storage via `idb` library
- **Change Detection**: OnPush for optimal performance
- **Core Services**: Fully integrated (Logger, Error Handler, Validation, Analytics)

#### Code Quality
- ✅ TypeScript strict mode: Passing
- ✅ ESLint: No errors, no warnings
- ✅ Prettier: Formatted
- ✅ Test Coverage: 100% for new code
- ✅ Angular 20 Best Practices: Full compliance

### Testing

#### Unit Tests
- **File**: `favorites.service.spec.ts`
- **Tests**: 15 tests
- **Coverage**: 100% (lines, branches, functions, statements)
- **Status**: ✅ All passing

#### E2E Tests
- **File**: `playwright/favorites.spec.ts`
- **Tests**: 5 complete user flow tests
- **Coverage**: Add, remove, empty state, keyboard navigation
- **Status**: ✅ All passing

#### Test Results
```bash
npm test -- favorites.service.spec.ts
# PASS: 15/15 tests passing

npx playwright test favorites.spec.ts
# PASS: 5/5 tests passing
```

### Security

#### Security Audit
- ✅ All user inputs validated with ValidationService
- ✅ 5-layer XSS prevention applied to prompts
- ✅ No secrets in code
- ✅ Blob URLs properly managed
- ✅ No new vulnerabilities introduced
- ✅ Security specialist approval granted

#### Dependencies
- No new dependencies added
- All existing dependencies up-to-date

### Performance

#### Bundle Size Impact
- **Main Bundle**: +12KB (baseline: 963KB → 975KB)
- **Lazy Chunk**: +8KB (favorites route)
- **Total Impact**: +20KB
- **Status**: ✅ Within acceptable range (<50KB)

#### Performance Metrics
- **Lighthouse Performance**: 95/100 (no change)
- **First Contentful Paint**: 1.2s (no change)
- **Time to Interactive**: 2.8s (no change)

### Accessibility

#### WCAG 2.1 AA Compliance
- ✅ Semantic HTML used throughout
- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation fully functional
- ✅ Focus management correct
- ✅ Color contrast ratios met (4.5:1+)
- ✅ Screen reader tested and compatible

#### Keyboard Shortcuts
- `F`: Add/remove current wallpaper from favorites
- `Ctrl+F`: Navigate to favorites page
- `Delete`: Remove focused favorite (with confirmation)
- `Escape`: Close confirmation dialogs

### Documentation

All documentation updated:
- [x] CHANGELOG.md - Feature entry added
- [x] API_DOCUMENTATION.md - FavoritesService documented
- [x] E2E_TESTING.md - Test scenarios documented
- [x] ARCHITECTURE.md - Pattern documented
- [x] TEST_COVERAGE.md - Coverage metrics updated

### CI/CD Status

All workflows passing:
- ✅ Lint & Test (`ci.yml`)
- ✅ Bundle Size Check (`bundle-size.yml`)
- ✅ CodeQL Analysis (`codeql-analysis.yml`)
- ✅ E2E Tests (`e2e-tests.yml`)
- ✅ Playwright Report (`playwright-report.yml`)

### Approvals

- ✅ **Lead Architect**: Approved (100% conformance to Plan of Record)
- ✅ **QA Engineer**: Approved (100% test coverage, all tests passing)
- ✅ **Security Specialist**: Approved (all security requirements met)
- ✅ **DevOps Engineer**: Approved (deployment ready)

### Deployment

**Target**: Production (main branch)

**Deployment Plan**:
1. Merge to main
2. Automatic deployment to Vercel (production)
3. Verify favorites feature in production
4. Monitor analytics for feature adoption
5. Monitor error logs for issues

**Rollback Plan**: 
If issues occur, revert merge commit and redeploy previous version.

### Breaking Changes

None. This is a purely additive feature with no breaking changes to existing functionality.

### Related Issues

- Closes #123

---

**This pull request is production ready** and includes:
1. ✅ Feature-complete application code
2. ✅ 100% test coverage (unit + E2E)
3. ✅ Complete documentation updates
4. ✅ Security audit approval
5. ✅ Architectural review approval
6. ✅ CI/CD passing
7. ✅ Deployment readiness confirmed

**Ready to merge and deploy to production.**
```

#### 8.3 PR Labels

Add appropriate labels:
- `feature`: New feature
- `enhancement`: Enhancement to existing functionality
- `documentation`: Documentation updates included
- `tested`: 100% test coverage
- `ready-to-merge`: All approvals granted
- `production-ready`: Deployment ready

#### 8.4 PR Reviewers

Request reviews from:
- Repository maintainers
- Project owner
- Other team members (if applicable)

#### 8.5 PR Checklist

Include checklist in PR description:

```markdown
### Pre-Merge Checklist

- [x] Code follows architectural standards (100% conformance)
- [x] All tests passing (unit + E2E)
- [x] 100% test coverage for new code
- [x] Documentation updated (CHANGELOG, API docs, etc.)
- [x] Security audit passed
- [x] Lead architect approval granted
- [x] CI/CD workflows passing
- [x] Bundle size acceptable
- [x] Accessibility compliant (WCAG 2.1 AA)
- [x] No breaking changes
- [x] Deployment plan documented
```

### Output
- **Pull Request**: Complete, production-ready PR
- **Status**: Ready for final review and merge
- **Next Step**: Human review and approval

### Quality Gate
- [ ] PR description comprehensive
- [ ] All code, tests, and docs included
- [ ] All approvals documented
- [ ] CI/CD status visible
- [ ] Ready to merge and deploy

---

## Production Line Metrics

### Success Criteria

Each feature delivered through the Production Line must meet:

**Quality Targets**:
- ✅ Code Quality: 95/100 minimum
- ✅ Test Coverage: 100% for new code
- ✅ Performance: No degradation (Lighthouse 90+)
- ✅ Security: All vulnerabilities addressed
- ✅ Accessibility: WCAG 2.1 AA compliant
- ✅ Documentation: Complete and accurate

**Process Targets**:
- ✅ All 8 steps completed
- ✅ All quality gates passed
- ✅ All approvals granted
- ✅ Zero rework cycles (ideal)
- ✅ 100% conformance to Plan of Record

### Key Performance Indicators (KPIs)

**Cycle Time**:
- Plan to Code: <1 day
- Code to Tests: <1 day
- Tests to Approval: <1 day
- Approval to Deployment: <1 hour
- **Total**: <3 days per feature

**Quality Metrics**:
- First-time approval rate: >80%
- Rework cycles: <1 per feature
- Production bugs: <1 per feature
- Test coverage: 100% for new code

**Process Compliance**:
- Steps skipped: 0
- Quality gates bypassed: 0
- Documentation gaps: 0
- Security exceptions: 0

---

## Common Scenarios

### Scenario 1: Small Enhancement (e.g., Add export button)

**Simplified Process**: Still follow all 8 steps, but each is faster
- **Step 1**: Plan (30 min) - Simple component change
- **Step 2**: Code (1 hour) - Add button and handler
- **Step 3**: Tests (1 hour) - Add 5 unit tests, 2 E2E tests
- **Step 4**: Security (30 min) - Quick audit (no new inputs)
- **Step 5**: Review (30 min) - Simple approval
- **Step 6**: Docs (30 min) - Update CHANGELOG and API docs
- **Step 7**: Release (15 min) - CI/CD checks
- **Step 8**: PR (15 min) - Create PR

**Total Time**: ~5 hours

### Scenario 2: Medium Feature (e.g., Search functionality)

**Standard Process**: Follow all 8 steps thoroughly
- **Step 1**: Plan (2 hours) - Design search UI and logic
- **Step 2**: Code (4 hours) - Component, service, state management
- **Step 3**: Tests (4 hours) - 15 unit tests, 5 E2E tests
- **Step 4**: Security (1 hour) - Input validation audit
- **Step 5**: Review (1 hour) - Detailed review
- **Step 6**: Docs (2 hours) - Comprehensive documentation
- **Step 7**: Release (1 hour) - Full CI/CD validation
- **Step 8**: PR (1 hour) - Detailed PR description

**Total Time**: 2 days

### Scenario 3: Large Feature (e.g., User accounts)

**Extended Process**: May require multiple iterations
- **Step 1**: Plan (1 day) - Detailed architecture planning
- **Step 2**: Code (3 days) - Multiple components, services
- **Step 3**: Tests (2 days) - 50+ unit tests, 15+ E2E tests
- **Step 4**: Security (4 hours) - Comprehensive security audit
- **Step 5**: Review (4 hours) - May require rework
- **Step 6**: Docs (1 day) - Extensive documentation
- **Step 7**: Release (2 hours) - Staging deployment test
- **Step 8**: PR (2 hours) - Very detailed PR

**Total Time**: 1 week

### Scenario 4: Bug Fix

**Expedited Process**: Still follow workflow, but streamlined

**Critical Bug** (production down):
- Skip Step 1 (Plan) - Document after fix
- Steps 2-8 as fast as possible
- Post-mortem and proper documentation after deployment

**Non-Critical Bug**:
- Follow all 8 steps normally
- Treat as small enhancement
- Root cause analysis in documentation

---

## Quality Gates - Detailed Criteria

### Gate 1: Plan Complete
- [ ] Feature scope clearly defined
- [ ] Architecture decisions documented
- [ ] Core services specified
- [ ] Data structures defined
- [ ] Acceptance criteria measurable
- [ ] Architect approval

### Gate 2: Code Complete
- [ ] All planned files created
- [ ] TypeScript compiling
- [ ] ESLint passing
- [ ] Code follows standards
- [ ] No console.log or debug code

### Gate 3: Tests Complete
- [ ] 100% coverage for new code
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Edge cases covered
- [ ] Performance tested

### Gate 4: Security Approved
- [ ] All inputs validated
- [ ] XSS prevention applied
- [ ] No secrets in code
- [ ] Dependencies secure
- [ ] Security specialist approval

### Gate 5: Architecture Approved
- [ ] Matches Plan of Record
- [ ] Best practices followed
- [ ] Performance acceptable
- [ ] Accessible
- [ ] Lead architect approval

### Gate 6: Documentation Complete
- [ ] CHANGELOG updated
- [ ] API docs updated
- [ ] Test docs updated
- [ ] Architecture docs updated (if needed)
- [ ] All docs accurate

### Gate 7: Deployment Ready
- [ ] CI/CD passing
- [ ] Build successful
- [ ] Bundle size acceptable
- [ ] Environment variables handled
- [ ] DevOps approval

### Gate 8: PR Ready
- [ ] Comprehensive description
- [ ] All files included
- [ ] All approvals documented
- [ ] Labels applied
- [ ] Ready to merge

---

## Troubleshooting

### Issue: Feature Rejected in Step 5

**Cause**: Implementation doesn't match Plan of Record

**Resolution**:
1. Review architect's feedback carefully
2. Identify specific deviations
3. Return to Step 2 (Code)
4. Fix issues without changing architecture
5. Re-run Steps 3-5

### Issue: Tests Failing in Step 3

**Cause**: Code bugs or incomplete test coverage

**Resolution**:
1. Debug failing tests
2. Fix code issues
3. Add missing tests
4. Ensure 100% coverage
5. Re-run all tests until passing

### Issue: Security Concerns in Step 4

**Cause**: Missing input validation or XSS vulnerability

**Resolution**:
1. Review security specialist's findings
2. Add ValidationService calls where missing
3. Apply 5-layer XSS prevention
4. Remove any hardcoded secrets
5. Re-run security audit

### Issue: CI/CD Failing in Step 7

**Cause**: Build errors, lint issues, or test failures

**Resolution**:
1. Check CI/CD logs for specific errors
2. Fix issues locally first
3. Test locally: `npm run build && npm test && npm run e2e:headless`
4. Push fixes
5. Wait for CI/CD to pass

### Issue: Bundle Size Too Large

**Cause**: Feature adds too much code without lazy loading

**Resolution**:
1. Implement lazy loading for feature route
2. Optimize images and assets
3. Remove unnecessary dependencies
4. Use tree-shaking effectively
5. Re-build and verify size

---

## Templates

### Plan of Record Template

See: `PLAN_OF_RECORD_TEMPLATE.md` (to be created separately)

### PR Description Template

See: PR creation process in Step 8

### Security Audit Template

See: Security audit checklist in Step 4

---

## Continuous Improvement

### Retrospective After Each Feature

**Questions**:
1. What went well in the Production Line?
2. What could be improved?
3. Were any steps unnecessarily slow?
4. Were any quality issues missed?
5. How can we prevent future rework?

**Action Items**:
- Update this guide with lessons learned
- Improve templates and checklists
- Enhance automation where possible
- Train team on new best practices

### Process Metrics Review (Monthly)

**Analyze**:
- Average cycle time per feature
- First-time approval rate
- Number of rework cycles
- Production bugs per feature
- CI/CD pass rate

**Optimize**:
- Identify bottlenecks
- Improve slow steps
- Enhance quality gates
- Update documentation

---

## Appendix

### Glossary

**Plan of Record**: Detailed architectural plan for a feature, created by lead-architect

**Quality Gate**: Checkpoint between steps requiring approval before proceeding

**Conformance**: Degree to which code matches documented standards (target: 100%)

**Core Services**: Essential services that must be used (Logger, Error Handler, Validation, etc.)

**Production Ready**: Code that meets all quality criteria and is approved for deployment

### References

- AGENT_WORKFLOW.md - Original workflow specification
- ARCHITECTURE.md - Architectural standards
- API_DOCUMENTATION.md - API reference
- TEST_COVERAGE.md - Testing standards
- XSS_PREVENTION.md - Security standards
- DEPLOYMENT_SECURITY.md - Deployment security

---

## Summary

The Production Line workflow ensures every feature is:
1. **Planned**: Architecturally sound
2. **Coded**: Standards-compliant
3. **Tested**: 100% coverage
4. **Secured**: Vulnerability-free
5. **Reviewed**: Architect-approved
6. **Documented**: Comprehensively
7. **Deployed**: CI/CD-ready
8. **Delivered**: Production-ready

**Status**: ✅ **ACTIVE AND READY FOR USE**

**Next Steps**: Create first feature using this workflow

---

*End of Production Line Workflow Guide*
