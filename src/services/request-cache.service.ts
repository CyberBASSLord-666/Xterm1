import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  subscribers: number;
}

/**
 * Service for caching and deduplicating requests.
 * Prevents multiple identical requests from being made simultaneously
 * and caches responses for a configurable duration.
 */
@Injectable({ providedIn: 'root' })
export class RequestCacheService {
  private logger = inject(LoggerService);
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Execute a request with caching and deduplication.
   * @param key The cache key
   * @param requestFn The function that makes the request
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   * @returns The cached or fresh data
   */
  async execute<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache HIT: ${key}`, undefined, 'RequestCache');
      return cached;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      this.logger.debug(`Request deduplication: ${key}`, undefined, 'RequestCache');
      pending.subscribers++;
      return pending.promise;
    }

    // Make new request
    this.logger.debug(`Cache MISS: ${key}`, undefined, 'RequestCache');
    const promise = requestFn().then(
      (data) => {
        // Store in cache
        this.set(key, data, ttl);
        // Remove from pending
        this.pendingRequests.delete(key);
        return data;
      },
      (error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key);
        throw error;
      }
    );

    // Store as pending
    this.pendingRequests.set(key, {
      promise,
      subscribers: 1,
    });

    return promise;
  }

  /**
   * Get data from cache if it exists and hasn't expired.
   * @param key The cache key
   * @returns The cached data or null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired: ${key}`, undefined, 'RequestCache');
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache.
   * @param key The cache key
   * @param data The data to cache
   * @param ttl Time to live in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    this.cache.set(key, entry);
    this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}ms)`, undefined, 'RequestCache');
  }

  /**
   * Invalidate a specific cache entry.
   * @param key The cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.logger.debug(`Cache invalidated: ${key}`, undefined, 'RequestCache');
  }

  /**
   * Invalidate all cache entries matching a pattern.
   * @param pattern A regex pattern or string prefix
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(`^${pattern}`) : pattern;
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.logger.debug(
      `Cache invalidated by pattern: ${pattern} (${count} entries)`,
      undefined,
      'RequestCache'
    );
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.debug(`Cache cleared (${size} entries)`, undefined, 'RequestCache');
  }

  /**
   * Remove expired entries from cache.
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.debug(
        `Cache cleanup: ${removed} expired entries removed`,
        undefined,
        'RequestCache'
      );
    }
  }

  /**
   * Get cache statistics.
   */
  getStats(): {
    size: number;
    pending: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
    };
  }

  /**
   * Start periodic cleanup (call in app initialization).
   */
  startPeriodicCleanup(intervalMs: number = 60000): void {
    setInterval(() => this.cleanup(), intervalMs);
  }
}
