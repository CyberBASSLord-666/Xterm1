/**
 * Bundle Optimization Utilities
 * Helpers for reducing bundle size and improving load performance
 */

/**
 * Lazy load a module dynamically
 */
export async function lazyLoadModule<T>(importFn: () => Promise<{ default: T } | T>): Promise<T> {
  const module = await importFn();
  // Type guard to check if module has 'default' property
  if (module && typeof module === 'object' && 'default' in module) {
    return (module as { default: T }).default;
  }
  return module as T;
}

/**
 * Preload a module in the background
 */
export function preloadModule(importFn: () => Promise<unknown>): void {
  // Use requestIdleCallback if available, otherwise setTimeout
  const loader = (): void => {
    importFn().catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.warn('Module preload failed:', error);
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loader);
  } else {
    setTimeout(loader, 1);
  }
}

/**
 * Check if a feature is supported before loading its implementation
 */
export function conditionalLoad<T>(condition: boolean, importFn: () => Promise<T>): Promise<T | null> {
  if (condition) {
    return importFn();
  }
  return Promise.resolve(null);
}

/**
 * Load module with timeout and fallback
 */
export async function loadWithFallback<T>(
  primaryImport: () => Promise<T>,
  fallbackImport: () => Promise<T>,
  timeout = 5000
): Promise<T> {
  return Promise.race([
    primaryImport(),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Load timeout')), timeout)),
  ]).catch((err) => {
    // NOTE: Using console for bundle optimization diagnostics
    // This is a foundational utility that logs loading failures for debugging
    // eslint-disable-next-line no-console
    console.warn('Primary import failed or timed out, using fallback:', err);
    return fallbackImport();
  });
}

/**
 * Chunk loader - load multiple modules in parallel
 */
export async function loadChunks<T extends Record<string, () => Promise<unknown>>>(
  chunks: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const entries = Object.entries(chunks);
  const results = await Promise.all(entries.map(([, fn]) => fn()));

  return Object.fromEntries(entries.map(([key], index) => [key, results[index]])) as {
    [K in keyof T]: Awaited<ReturnType<T[K]>>;
  };
}

/**
 * Progressive enhancement loader
 * Load core first, then enhanced features
 */
export async function loadProgressive<TCore, TEnhanced>(
  coreImport: () => Promise<TCore>,
  enhancedImport: () => Promise<TEnhanced>,
  onCoreLoaded?: (core: TCore) => void
): Promise<{ core: TCore; enhanced: TEnhanced }> {
  const core = await coreImport();
  onCoreLoaded?.(core);

  const enhanced = await enhancedImport();
  return { core, enhanced };
}

/**
 * Resource prioritization helper
 */
export function setPriority(url: string, priority: 'high' | 'low'): void {
  if ('HTMLLinkElement' in window) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'script';
    if (priority === 'high') {
      link.setAttribute('importance', 'high');
    }
    document.head.appendChild(link);
  }
}

/**
 * Tree-shakeable feature flags
 */
export const FEATURES = {
  ANALYTICS: process.env['NG_ANALYTICS'] !== 'false',
  PERFORMANCE_MONITORING: process.env['NG_PERF_MONITORING'] !== 'false',
  DEBUG_MODE: process.env['NG_DEBUG'] === 'true',
} as const;

/**
 * Dead code elimination helper
 * Wraps code that should be removed in production
 */
export function devOnly<T>(fn: () => T): T | undefined {
  if (process.env['NODE_ENV'] === 'development') {
    return fn();
  }
  return undefined;
}

/**
 * Production-only code
 */
export function prodOnly<T>(fn: () => T): T | undefined {
  if (process.env['NODE_ENV'] === 'production') {
    return fn();
  }
  return undefined;
}

/**
 * Module size analyzer (development only)
 */
export function analyzeModuleSize(moduleName: string): void {
  if (process.env['NODE_ENV'] === 'development') {
    // eslint-disable-next-line no-console
    console.log(`📦 Module loaded: ${moduleName}`);
    // In real implementation, this would track actual sizes
  }
}

/**
 * Optimize import statements helper
 * Suggests better import patterns
 */
export function getOptimizedImportSuggestion(packageName: string, importedItem: string): string | null {
  const suggestions: Record<string, Record<string, string>> = {
    lodash: {
      default: "Use 'lodash-es' or import specific functions like 'import debounce from 'lodash/debounce'",
    },
    rxjs: {
      default: "Import specific operators from 'rxjs/operators' instead of 'rxjs'",
    },
    '@angular/material': {
      default: 'Import specific components instead of the entire module',
    },
  };

  return suggestions[packageName]?.[importedItem] || suggestions[packageName]?.default || null;
}

/**
 * Bundle analyzer integration
 */
export interface BundleStats {
  size: number;
  gzipSize: number;
  modules: number;
  chunks: number;
}

export function logBundleStats(stats: BundleStats): void {
  if (process.env['NODE_ENV'] === 'development') {
    // eslint-disable-next-line no-console
    console.table(stats);
  }
}

/**
 * Dynamic import with retry logic
 */
export async function importWithRetry<T>(importFn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Import failed after retries');
}
