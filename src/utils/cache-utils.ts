/**
 * Advanced Caching Utilities
 * Sophisticated caching mechanisms with TTL, size limits, and eviction policies
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Maximum number of entries */
  maxSize?: number;
  /** Eviction policy: 'lru' (least recently used) or 'lfu' (least frequently used) */
  evictionPolicy?: 'lru' | 'lfu';
}

/**
 * Advanced cache implementation with TTL, size limits, and eviction policies
 */
export class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly evictionPolicy: 'lru' | 'lfu';

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl ?? 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize ?? 100;
    this.evictionPolicy = options.evictionPolicy ?? 'lru';
  }

  /**
   * Get a value from cache
   */
  public get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access metrics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Set a value in cache
   */
  public set(key: string, data: T, ttl?: number): void {
    // Check size limit and evict if necessary
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    const now = Date.now();
    const effectiveTTL = ttl ?? this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + effectiveTTL,
      accessCount: 0,
      lastAccessed: now,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a key from cache
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  public get size(): number {
    return this.cache.size;
  }

  /**
   * Get all valid (non-expired) keys
   */
  public keys(): string[] {
    const now = Date.now();
    const validKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        validKeys.push(key);
      } else {
        this.cache.delete(key);
      }
    }

    return validKeys;
  }

  /**
   * Clean up expired entries
   */
  public cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict entries based on eviction policy
   */
  private evict(): void {
    if (this.cache.size === 0) {
      return;
    }

    let keyToEvict: string | null = null;

    if (this.evictionPolicy === 'lru') {
      // Evict least recently used
      let oldestAccess = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestAccess) {
          oldestAccess = entry.lastAccessed;
          keyToEvict = key;
        }
      }
    } else {
      // Evict least frequently used
      let lowestCount = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.accessCount < lowestCount) {
          lowestCount = entry.accessCount;
          keyToEvict = key;
        }
      }
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    averageAccessCount: number;
  } {
    let totalAccess = 0;
    let validEntries = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      if (now <= entry.expiresAt) {
        totalAccess += entry.accessCount;
        validEntries++;
      }
    }

    return {
      size: validEntries,
      maxSize: this.maxSize,
      hitRate: validEntries > 0 ? totalAccess / validEntries : 0,
      averageAccessCount: validEntries > 0 ? totalAccess / validEntries : 0,
    };
  }

  /**
   * Wrap a function with caching
   */
  public wrap<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn | Promise<TReturn>,
    keyGenerator: (...args: TArgs) => string
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = keyGenerator(...args);
      const cached = this.get(key);

      if (cached !== null) {
        return cached as TReturn;
      }

      const result = await fn(...args);
      this.set(key, result as T);
      return result;
    };
  }
}

/**
 * Create a memoized version of a function with automatic caching
 */
export function createMemoizedFunction<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn | Promise<TReturn>,
  options: CacheOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  const cache = new AdvancedCache<TReturn>(options);

  return async (...args: TArgs): Promise<TReturn> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };
}
