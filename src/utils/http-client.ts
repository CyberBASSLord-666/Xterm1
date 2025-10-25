/**
 * Advanced HTTP Client Utilities
 * Professional-grade HTTP client with retry logic, caching, and interceptors
 */

import { API_CONFIG } from '../constants';
import { AdvancedCache } from './cache-utils';

export interface HttpRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
  signal?: AbortSignal;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface HttpInterceptor {
  request?(config: HttpRequestConfig): HttpRequestConfig | Promise<HttpRequestConfig>;
  response?<T>(response: HttpResponse<T>): HttpResponse<T> | Promise<HttpResponse<T>>;
  error?(error: Error): Error | Promise<Error>;
}

/**
 * Advanced HTTP client with professional features
 */
export class HttpClient {
  private cache: AdvancedCache<unknown>;
  private interceptors: HttpInterceptor[] = [];
  private readonly defaultTimeout = API_CONFIG.REQUEST_TIMEOUT;
  private readonly defaultRetries = API_CONFIG.DEFAULT_RETRIES;

  constructor(cacheOptions?: { ttl?: number; maxSize?: number }) {
    this.cache = new AdvancedCache({
      ttl: cacheOptions?.ttl ?? API_CONFIG.DEFAULT_TIMEOUT,
      maxSize: cacheOptions?.maxSize ?? 50,
      evictionPolicy: 'lru',
    });
  }

  /**
   * Add request/response interceptor
   */
  public addInterceptor(interceptor: HttpInterceptor): void {
    this.interceptors.push(interceptor);
  }

  /**
   * Remove interceptor
   */
  public removeInterceptor(interceptor: HttpInterceptor): void {
    const index = this.interceptors.indexOf(interceptor);
    if (index !== -1) {
      this.interceptors.splice(index, 1);
    }
  }

  /**
   * Perform HTTP GET request
   */
  public async get<T>(url: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * Perform HTTP POST request
   */
  public async post<T>(
    url: string,
    body: unknown,
    config: HttpRequestConfig = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  /**
   * Perform HTTP PUT request
   */
  public async put<T>(
    url: string,
    body: unknown,
    config: HttpRequestConfig = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  /**
   * Perform HTTP DELETE request
   */
  public async delete<T>(url: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * Perform HTTP request with retry logic and caching
   */
  public async request<T>(url: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    // Apply request interceptors
    let processedConfig = config;
    for (const interceptor of this.interceptors) {
      if (interceptor.request) {
        processedConfig = await interceptor.request(processedConfig);
      }
    }

    const method = processedConfig.method ?? 'GET';
    const cacheKey = `${method}:${url}`;

    // Check cache for GET requests
    if (method === 'GET' && processedConfig.cache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as HttpResponse<T>;
      }
    }

    // Perform request with retry logic
    const retries = processedConfig.retries ?? this.defaultRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.performRequest<T>(url, processedConfig);

        // Apply response interceptors
        let processedResponse = response;
        for (const interceptor of this.interceptors) {
          if (interceptor.response) {
            processedResponse = await interceptor.response(processedResponse);
          }
        }

        // Cache successful GET responses
        if (method === 'GET' && processedConfig.cache !== false) {
          this.cache.set(cacheKey, processedResponse, processedConfig.cacheTTL);
        }

        return processedResponse;
      } catch (error) {
        lastError = error as Error;

        // Apply error interceptors
        for (const interceptor of this.interceptors) {
          if (interceptor.error) {
            lastError = await interceptor.error(lastError);
          }
        }

        // Don't retry on client errors (4xx)
        if (lastError.message.includes('4')) {
          throw lastError;
        }

        // Exponential backoff
        if (attempt < retries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError ?? new Error('Request failed');
  }

  /**
   * Perform actual HTTP request
   */
  private async performRequest<T>(
    url: string,
    config: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.timeout ?? this.defaultTimeout
    );

    try {
      const response = await fetch(url, {
        method: config.method ?? 'GET',
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: config.signal ?? controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        data: data as T,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear request cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    averageAccessCount: number;
  } {
    return this.cache.getStats();
  }
}

/**
 * Create a singleton HTTP client instance
 */
let httpClientInstance: HttpClient | null = null;

export function getHttpClient(): HttpClient {
  if (!httpClientInstance) {
    httpClientInstance = new HttpClient();
  }
  return httpClientInstance;
}

/**
 * Reset HTTP client instance (useful for testing)
 */
export function resetHttpClient(): void {
  httpClientInstance = null;
}
