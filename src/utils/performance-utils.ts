/**
 * Performance Utility Functions
 * Optimized utilities for performance monitoring and optimization
 */

/**
 * Debounce function with proper TypeScript typing
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>): void {
    const later = (): void => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function with proper TypeScript typing
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: unknown[]) => unknown>(func: T): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  };
}

/**
 * Request idle callback wrapper with fallback
 */
export function requestIdleCallbackSafe(callback: () => void, options?: IdleRequestOptions): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  // Fallback for browsers that don't support requestIdleCallback
  return setTimeout(callback, 1) as unknown as number;
}

/**
 * Cancel idle callback wrapper with fallback
 */
export function cancelIdleCallbackSafe(handle: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  label: string,
  func: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await func();
  const duration = performance.now() - start;

  /**
   * NOTE: Using direct console for performance measurements
   * This is intentional because:
   * 1. Performance utilities are foundational infrastructure
   * 2. LoggerService may depend on these utilities (circular dependency)
   * 3. Performance measurements need minimal overhead
   * 4. Development-time diagnostic tool, not production logging
   */
  // eslint-disable-next-line no-console
  console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * Batch DOM reads to avoid layout thrashing
 */
export function batchDOMReads<T>(reads: (() => T)[]): T[] {
  return reads.map((read) => read());
}

/**
 * Batch DOM writes to avoid layout thrashing
 */
export function batchDOMWrites(writes: (() => void)[]): void {
  requestAnimationFrame(() => {
    writes.forEach((write) => write());
  });
}
