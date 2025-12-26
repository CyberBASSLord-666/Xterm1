# Bundle Analysis Report

## Current Bundle Size

| Metric | Value |
|--------|-------|
| Initial Bundle (Raw) | 990.67 kB |
| Initial Bundle (Gzipped) | ~217 kB |
| Budget | 500 kB |
| Over Budget | 490.67 kB |

### Initial Chunk Breakdown

| Chunk | Raw Size | Gzipped |
|-------|----------|---------|
| main.js | 491.52 kB | 111.42 kB |
| chunk (unlabeled) | 209.10 kB | 29.41 kB |
| chunk (unlabeled) | 150.43 kB | 44.33 kB |
| chunk (unlabeled) | 84.16 kB | 21.38 kB |
| styles.css | 40.86 kB | 6.30 kB |
| Other small chunks | ~10 kB | ~4 kB |

### Lazy-Loaded Chunks

| Component | Raw Size | Gzipped |
|-----------|----------|---------|
| settings-component | 108.42 kB | 29.62 kB |
| wizard-component | 31.02 kB | 8.84 kB |
| feed-component | 29.80 kB | 7.46 kB |
| editor-component | 15.82 kB | 4.63 kB |
| gallery-component | 13.80 kB | 4.24 kB |
| collections-component | 5.70 kB | 2.02 kB |

## Key Dependencies Contributing to Bundle Size

### 1. @google/genai SDK (~8.7 MB uncompressed)
- **Location**: `node_modules/@google/genai`
- **Import**: `src/services/pollinations.client.ts`
- **Problem**: Statically imported and used during app initialization
- **Impact**: This SDK is included in the initial bundle because:
  - `pollinations.client.ts` imports `GoogleGenAI` at the module level
  - `app-initializer.service.ts` imports `initializeGeminiClient` 
  - App initializer runs during bootstrap via `APP_INITIALIZER`

### 2. Angular Framework (~150-200 kB)
- Core Angular packages are required for app bootstrapping
- This is unavoidable for any Angular application

### 3. RxJS (~50-80 kB)
- Used throughout the application for reactive patterns
- Tree-shaking helps but core operators are still needed

## Code-Splitting Opportunities

### High Impact: Lazy-Load Gemini SDK

**Problem**: The `@google/genai` SDK is loaded eagerly even though it's only needed when:
- User initiates wallpaper generation
- User requests AI-powered features

**Recommendation**: Dynamically import the Gemini SDK only when needed:

```typescript
// pollinations.client.ts - Before
import { GoogleGenAI } from '@google/genai';
let ai: GoogleGenAI | null = null;

export function initializeGeminiClient(apiKey: string): void {
  ai = new GoogleGenAI({ apiKey });
}

// pollinations.client.ts - After (Lazy Loading)
type GoogleGenAI = import('@google/genai').GoogleGenAI;
let ai: GoogleGenAI | null = null;
let aiPromise: Promise<void> | null = null;

export async function initializeGeminiClient(apiKey: string): Promise<void> {
  if (aiPromise) return aiPromise;
  
  aiPromise = (async () => {
    const { GoogleGenAI } = await import('@google/genai');
    ai = new GoogleGenAI({ apiKey });
  })();
  
  return aiPromise;
}

// Ensure client is initialized before use
async function ensureGeminiClient(): Promise<GoogleGenAI> {
  // Fast path: return immediately if already initialized
  if (ai) return ai;
  
  // Check if initialization has been started
  if (!aiPromise) {
    throw new Error('Gemini API client not initialized. Call initializeGeminiClient first.');
  }
  
  // Wait for initialization to complete
  await aiPromise;
  
  // Verify initialization succeeded
  if (!ai) {
    throw new Error('Gemini API client initialization failed');
  }
  
  return ai;
}
```

**Estimated Savings**: 50-100 kB from initial bundle

### Medium Impact: Service-Level Code Splitting

**Candidates for lazy-loading**:

1. **realtime-feed.service.ts** (31.8 kB)
   - Only used by feed component
   - Already lazy-loaded via route (good!)

2. **validation.service.ts** (14.3 kB)
   - Contains comprehensive validation logic
   - Could be loaded on-demand when forms are rendered

3. **analytics-dashboard.service.ts** (8.5 kB)
   - Specialty service for dashboard features
   - Could be lazy-loaded with dashboard component

### Low Impact: Tree-Shaking Improvements

1. **Review barrel exports** in `src/constants/index.ts` and `src/utils/index.ts`
   - Barrel exports can prevent effective tree-shaking
   - Consider direct imports for large utility functions

2. **Audit lodash-like patterns**
   - If any lodash utilities are used, ensure only specific functions are imported

## Implementation Priority

### Phase 1: High Impact (Estimated -100 kB)
1. [ ] Lazy-load `@google/genai` SDK
2. [ ] Update `app-initializer.service.ts` to defer Gemini initialization

### Phase 2: Medium Impact (Estimated -30 kB)
1. [ ] Audit service injection patterns
2. [ ] Consider `providedIn: 'root'` vs route-level providers

### Phase 3: Monitoring
1. [ ] Add bundle size to CI/CD checks
2. [ ] Set up source-map-explorer for detailed analysis
3. [ ] Configure webpack-bundle-analyzer (if using webpack)

## Tools for Analysis

```bash
# Install source-map-explorer
npm install -g source-map-explorer

# Analyze bundle (after build with source maps)
source-map-explorer dist/app/browser/main-*.js

# Or use Angular's built-in stats
ng build --stats-json
# Then use webpack-bundle-analyzer
```

## Notes

- The current lazy-loading of route components is well-implemented
- jszip is already in a lazy-loaded chunk (settings-component)
- The primary optimization opportunity is deferring the Gemini SDK load
- Consider using `@defer` blocks in Angular 17+ templates for component-level deferral
